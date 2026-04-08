import { supabase } from '@/lib/supabaseClient';

/** Row shape from `public.shifts` + joined `job_categories`. */
export type ShiftQueryRow = {
  id: string;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  rate_per_hour: string | number | null;
  claimed_at: string | null;
  job_categories: { name: string } | null;
};

/** Normalized for schedule UI (month grid + day sidebar). */
export type ScheduleShiftDisplay = {
  id: string;
  time: string;
  title: string;
  tag: string;
  /** Job category name when joined from DB; used for role filter. */
  categoryName?: string;
  showPencil: boolean;
};

function monthBounds(year: number, monthIndex: number): { first: string; last: string } {
  const ym = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    first: `${ym}-01`,
    last: `${ym}-${String(lastDay).padStart(2, '0')}`,
  };
}

function formatRateLabel(rate: number): string {
  if (Number.isInteger(rate)) return `$${rate}/hr`;
  return `$${rate.toFixed(2)}/hr`;
}

function categoryNameFromRow(row: ShiftQueryRow): string | undefined {
  const jc = row.job_categories as { name: string } | { name: string }[] | null | undefined;
  if (!jc) return undefined;
  const name = Array.isArray(jc) ? jc[0]?.name : jc.name;
  return name?.trim();
}

function rowToDisplay(row: ShiftQueryRow): ScheduleShiftDisplay {
  const rateNum =
    row.rate_per_hour != null && row.rate_per_hour !== ''
      ? Number(row.rate_per_hour)
      : NaN;
  const time = Number.isFinite(rateNum) ? formatRateLabel(rateNum) : 'All day';
  const title = row.title?.trim() || 'Shift';
  const category = categoryNameFromRow(row);
  const status = row.claimed_at ? 'Claimed' : 'Open';
  const tag = category ? `${category} · ${status}` : status;

  return {
    id: row.id,
    time,
    title,
    tag,
    categoryName: category,
    showPencil: true,
  };
}

function forEachDayInInclusiveRange(
  startIso: string,
  endIso: string,
  visit: (y: number, monthIndex: number, day: number) => void,
) {
  const [sy, sm, sd] = startIso.split('-').map((x) => parseInt(x, 10));
  const [ey, em, ed] = endIso.split('-').map((x) => parseInt(x, 10));
  const cur = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  while (cur <= end) {
    visit(cur.getFullYear(), cur.getMonth(), cur.getDate());
    cur.setDate(cur.getDate() + 1);
  }
}

/** Places each shift on every calendar day it spans within the given month. */
export function bucketShiftsByDayOfMonth(
  shifts: ShiftQueryRow[],
  year: number,
  monthIndex: number,
): Record<number, ScheduleShiftDisplay[]> {
  const { first, last } = monthBounds(year, monthIndex);
  const buckets: Record<number, ScheduleShiftDisplay[]> = {};

  for (const row of shifts) {
    const sd = row.start_date;
    const ed = row.end_date;
    if (!sd || !ed) continue;

    const rangeStart = sd > first ? sd : first;
    const rangeEnd = ed < last ? ed : last;
    if (rangeStart > rangeEnd) continue;

    const display = rowToDisplay(row);
    forEachDayInInclusiveRange(rangeStart, rangeEnd, (y, m, d) => {
      if (y !== year || m !== monthIndex) return;
      if (!buckets[d]) buckets[d] = [];
      buckets[d].push(display);
    });
  }

  for (const k of Object.keys(buckets)) {
    const day = Number(k);
    buckets[day].sort((a, b) => a.title.localeCompare(b.title));
  }

  return buckets;
}

function toIsoFromYmd(y: number, monthIndex: number, day: number): string {
  return `${y}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Bucket shifts by local calendar date (YYYY-MM-DD) across an arbitrary inclusive range (week view spanning months). */
export function bucketShiftsByIsoDateRange(
  shifts: ShiftQueryRow[],
  rangeStartIso: string,
  rangeEndIso: string,
): Record<string, ScheduleShiftDisplay[]> {
  const buckets: Record<string, ScheduleShiftDisplay[]> = {};

  for (const row of shifts) {
    const sd = row.start_date;
    const ed = row.end_date;
    if (!sd || !ed) continue;

    const rangeStart = sd > rangeStartIso ? sd : rangeStartIso;
    const rangeEnd = ed < rangeEndIso ? ed : rangeEndIso;
    if (rangeStart > rangeEnd) continue;

    const display = rowToDisplay(row);
    forEachDayInInclusiveRange(rangeStart, rangeEnd, (y, m, d) => {
      const iso = toIsoFromYmd(y, m, d);
      if (!buckets[iso]) buckets[iso] = [];
      buckets[iso].push(display);
    });
  }

  for (const k of Object.keys(buckets)) {
    buckets[k].sort((a, b) => a.title.localeCompare(b.title));
  }

  return buckets;
}

export async function getClientIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('clients').select('id').eq('user_id', userId).maybeSingle();
  if (error) {
    console.error('[shifts.service] getClientIdForUser', error);
    return null;
  }
  return data?.id ?? null;
}

export async function getDefaultFacilityIdForClient(clientId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('facility')
    .select('id')
    .eq('client_id', clientId)
    .order('is_headquarters', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[shifts.service] getDefaultFacilityIdForClient', error);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchJobCategories(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('job_categories').select('id, name').order('name');
  if (error) {
    console.error('[shifts.service] fetchJobCategories', error);
    return [];
  }
  return (data ?? []) as { id: string; name: string }[];
}

/**
 * Shifts that overlap the calendar month (uses `start_date` / `end_date` on `public.shifts`).
 */
export async function fetchShiftsOverlappingMonth(
  clientId: string,
  year: number,
  monthIndex: number,
): Promise<ShiftQueryRow[]> {
  const { first, last } = monthBounds(year, monthIndex);

  const { data, error } = await supabase
    .from('shifts')
    .select('id, title, start_date, end_date, rate_per_hour, claimed_at, job_categories ( name )')
    .eq('client_id', clientId)
    .lte('start_date', last)
    .gte('end_date', first);

  if (error) {
    console.error('[shifts.service] fetchShiftsOverlappingMonth', error);
    return [];
  }

  return (data ?? []) as ShiftQueryRow[];
}

/** Shifts overlapping any day in `[rangeStartIso, rangeEndIso]` (inclusive). */
export async function fetchShiftsOverlappingDateRange(
  clientId: string,
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<ShiftQueryRow[]> {
  const { data, error } = await supabase
    .from('shifts')
    .select('id, title, start_date, end_date, rate_per_hour, claimed_at, job_categories ( name )')
    .eq('client_id', clientId)
    .lte('start_date', rangeEndIso)
    .gte('end_date', rangeStartIso);

  if (error) {
    console.error('[shifts.service] fetchShiftsOverlappingDateRange', error);
    return [];
  }

  return (data ?? []) as ShiftQueryRow[];
}

export function parseHourlyRate(input: string): number | null {
  const n = parseFloat(String(input).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function createClientShift(
  userId: string,
  params: {
    title: string;
    startDate: string;
    endDate: string;
    ratePerHour: number;
    jobCategoryId: string | null;
    description: string | null;
  },
): Promise<{ error: string | null }> {
  const clientId = await getClientIdForUser(userId);
  if (!clientId) return { error: 'No employer profile found for this account.' };

  const facilityId = await getDefaultFacilityIdForClient(clientId);
  if (!facilityId) {
    return { error: 'Add a location in onboarding before posting shifts.' };
  }

  const postedAt = new Date().toISOString();
  const { error } = await supabase.from('shifts').insert({
    client_id: clientId,
    facility_id: facilityId,
    title: params.title,
    description: params.description,
    start_date: params.startDate,
    end_date: params.endDate,
    rate_per_hour: params.ratePerHour,
    job_category_id: params.jobCategoryId,
    posted_at: postedAt,
  });

  if (error) {
    console.error('[shifts.service] createClientShift', error);
    return { error: error.message };
  }
  return { error: null };
}
