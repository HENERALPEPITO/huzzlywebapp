'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Filter,
} from 'lucide-react';
import PostShiftModal, { type PostShiftFormValues } from '@/components/schedule/PostShiftModal';
import { supabase } from '@/lib/supabaseClient';
import {
  bucketShiftsByDayOfMonth,
  bucketShiftsByIsoDateRange,
  createClientShift,
  fetchJobCategories,
  fetchShiftsOverlappingDateRange,
  fetchShiftsOverlappingMonth,
  getClientIdForUser,
  parseHourlyRate,
  type ScheduleShiftDisplay,
} from '@/services/shifts.service';

const BRAND = '#4473C0';
const WEEKEND = '#F36A6A';
const MUTED = '#858585';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function toIsoDate(year: number, monthIndex: number, day: number | null): string {
  const d = day ?? 1;
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Week starts Sunday — matches Figma [Client - Schedule Date Range (week view)](https://www.figma.com/design/DlEu2fdDCbPZEoHagQqBwa/Huzly---Mobile-App-Designs?node-id=1451-39544). */
function startOfWeekSunday(anchor: Date): Date {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDaysLocal(anchor: Date, n: number): Date {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

function buildMonthGrid(year: number, monthIndex: number): ({ d: number; inMonth: boolean } | null)[][] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const startPad = first.getDay();
  const n = last.getDate();
  const cells: ({ d: number; inMonth: boolean } | null)[] = [];

  const prevLast = new Date(year, monthIndex, 0).getDate();
  for (let i = 0; i < startPad; i++) {
    const d = prevLast - startPad + i + 1;
    cells.push({ d, inMonth: false });
  }
  for (let d = 1; d <= n; d++) {
    cells.push({ d, inMonth: true });
  }
  let tail = 0;
  while (cells.length % 7 !== 0) {
    tail++;
    cells.push({ d: tail, inMonth: false });
  }
  while (cells.length < 42) {
    tail++;
    cells.push({ d: tail, inMonth: false });
  }

  const rows: ({ d: number; inMonth: boolean } | null)[][] = [];
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

/** Left column day list — [Client - Schedule (Month)](https://www.figma.com/design/DlEu2fdDCbPZEoHagQqBwa/Huzly---Mobile-App-Designs?node-id=809-15609) */
function ScheduleDayShiftList({
  year,
  monthIndex,
  selectedDay,
  shifts,
  className = '',
}: {
  year: number;
  monthIndex: number;
  selectedDay: number | null;
  shifts: ScheduleShiftDisplay[];
  className?: string;
}) {
  const weekdayName =
    selectedDay != null
      ? new Date(year, monthIndex, selectedDay).toLocaleString('default', { weekday: 'long' })
      : '—';

  return (
    <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${className}`}>
      <div className="flex h-12 shrink-0 items-center justify-between px-5">
        <span className="text-base font-medium text-black">{weekdayName}</span>
        <span className="text-sm font-normal tabular-nums text-black">{selectedDay ?? '—'}</span>
      </div>
      <div className="mx-0 min-h-0 flex-1 overflow-y-auto border-t border-[#e5e7eb]">
        {shifts.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-[#64748b]">No shifts for this day</p>
        ) : (
          shifts.map((shift, i) => (
            <div
              key={`${shift.id}-${i}`}
              className="border-b border-[#e5e7eb] px-4 py-4 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium leading-4 text-[#0f172a]">{shift.time}</span>
                {shift.showPencil ? (
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 text-[#64748b] hover:bg-slate-100"
                    aria-label="Edit shift"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                  </button>
                ) : (
                  <span className="w-3 shrink-0" aria-hidden />
                )}
              </div>
              <p className="mt-2 text-sm font-medium leading-5 text-[#0f172a]">{shift.title}</p>
              {shift.tag ? (
                <span className="mt-1.5 inline-flex h-[19px] items-center rounded bg-[#eff6ff] px-2 text-[10px] font-medium leading-none text-[#4473c0]">
                  {shift.tag}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ScheduleSidebar({
  year,
  monthIndex,
  selectedDay,
  shiftsForDay,
  onPostShift,
}: {
  year: number;
  monthIndex: number;
  selectedDay: number | null;
  shiftsForDay: ScheduleShiftDisplay[];
  onPostShift: () => void;
}) {
  return (
    <aside className="hidden h-full w-[264px] shrink-0 flex-col border-r border-[#e5e7eb] bg-white lg:flex">
      <div className="px-5 py-3">
        <div className="flex h-11 items-center gap-2 rounded-lg bg-[#f8fafc] px-2.5">
          <Search className="h-5 w-5 shrink-0 text-[#4473c0]" strokeWidth={1.5} />
          <input
            type="search"
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#6b7280] placeholder:text-[#6b7280] focus:outline-none"
          />
        </div>
      </div>
      <div className="mx-5 border-t border-[#e5e7eb]" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5 pt-3.5">
        <button
          type="button"
          onClick={onPostShift}
          className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: BRAND }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Post shift
        </button>

        <ScheduleDayShiftList
          year={year}
          monthIndex={monthIndex}
          selectedDay={selectedDay}
          shifts={shiftsForDay}
          className="rounded-lg"
        />
      </div>
    </aside>
  );
}

function ShiftPill({ time, title }: { time: string; title: string }) {
  return (
    <div className="flex min-h-[23px] w-full overflow-hidden rounded border border-[#e5e7eb] text-[10px] leading-[15px] sm:text-xs">
      <div className="flex min-w-[3rem] max-w-[4.5rem] shrink-0 items-center justify-center border-r border-[#e5e7eb] bg-[#fafafa] px-1 text-center text-[#1f2937]">
        {time}
      </div>
      <div className="min-w-0 flex-1 truncate px-1.5 py-1 text-[#4b5563]">{title}</div>
    </div>
  );
}

type WeekDayColumn = {
  iso: string;
  date: Date;
  dayNum: number;
  weekdayShort: string;
  shifts: ScheduleShiftDisplay[];
};

/** Single Sun–Sat row with stacked shift pills per day (Figma week view). */
function ScheduleWeekRow({
  weekDays,
  selectedIso,
  onSelectDate,
}: {
  weekDays: WeekDayColumn[];
  selectedIso: string | null;
  onSelectDate: (d: Date) => void;
}) {
  const today = new Date();
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
      <div className="grid min-w-[720px] grid-cols-7 border-b border-[#e5e7eb] bg-[#fafafa]">
        {weekDays.map((col, i) => {
          const isWeekendCol = i === 0 || i === 6;
          return (
            <div
              key={col.iso}
              className="border-r border-[#e5e7eb] py-3 text-center text-sm font-medium last:border-r-0"
              style={{ color: isWeekendCol ? WEEKEND : '#374151' }}
            >
              {col.weekdayShort}
            </div>
          );
        })}
      </div>
      <div className="grid min-h-[200px] min-w-[720px] grid-cols-7">
        {weekDays.map((col, i) => {
          const isWeekendCol = i === 0 || i === 6;
          const isToday = col.iso === todayIso;
          const isSelected = selectedIso === col.iso;
          return (
            <div
              key={col.iso}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(col.date)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDate(col.date);
                }
              }}
              className={`border-r border-[#e5e7eb] p-2 last:border-r-0 ${
                isWeekendCol ? 'bg-[#fffafa]/80' : 'bg-white'
              } ${
                isSelected ? 'z-[1] ring-1 ring-inset ring-[#4473c0]/40' : ''
              } cursor-pointer hover:bg-slate-50/80`}
            >
              <div className="mb-2 flex items-start justify-between gap-1 px-0.5">
                <span
                  className={`text-sm ${isToday ? 'font-semibold' : ''}`}
                  style={{
                    color: isWeekendCol ? WEEKEND : '#374151',
                    ...(isToday ? { color: BRAND } : {}),
                  }}
                >
                  {col.dayNum}
                </span>
                {col.shifts.length > 0 ? (
                  <span className="rounded-full bg-[#4473c0]/15 px-1.5 text-[10px] font-semibold text-[#4473c0]">
                    {col.shifts.length}
                  </span>
                ) : null}
              </div>
              <div className="flex min-h-[120px] flex-col gap-1">
                {col.shifts.slice(0, 8).map((s) => (
                  <ShiftPill key={`${col.iso}-${s.id}`} time={s.time} title={s.title} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ScheduleView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [postShiftOpen, setPostShiftOpen] = useState(false);
  const [shiftsByDay, setShiftsByDay] = useState<Record<number, ScheduleShiftDisplay[]>>({});
  const [weekShiftsByIso, setWeekShiftsByIso] = useState<Record<string, ScheduleShiftDisplay[]>>({});
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [jobCategories, setJobCategories] = useState<{ id: string; name: string }[]>([]);
  const [roleFilter, setRoleFilter] = useState('');

  const grid = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);

  const loadSchedule = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id ?? null;

    setScheduleLoading(true);
    if (!uid) {
      setShiftsByDay({});
      setWeekShiftsByIso({});
      setScheduleLoading(false);
      return;
    }

    const clientId = await getClientIdForUser(uid);
    if (!clientId) {
      setShiftsByDay({});
      setWeekShiftsByIso({});
      setScheduleLoading(false);
      return;
    }

    if (viewMode === 'month') {
      const rows = await fetchShiftsOverlappingMonth(clientId, year, monthIndex);
      setShiftsByDay(bucketShiftsByDayOfMonth(rows, year, monthIndex));
      setWeekShiftsByIso({});
    } else {
      const anchor = new Date(year, monthIndex, selectedDay ?? 1);
      const ws = startOfWeekSunday(anchor);
      const we = addDaysLocal(ws, 6);
      const rangeStart = toIsoDate(ws.getFullYear(), ws.getMonth(), ws.getDate());
      const rangeEnd = toIsoDate(we.getFullYear(), we.getMonth(), we.getDate());
      const rows = await fetchShiftsOverlappingDateRange(clientId, rangeStart, rangeEnd);
      setWeekShiftsByIso(bucketShiftsByIsoDateRange(rows, rangeStart, rangeEnd));
      setShiftsByDay({});
    }
    setScheduleLoading(false);
  }, [year, monthIndex, selectedDay, viewMode]);

  useEffect(() => {
    void loadSchedule();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSchedule();
    });
    return () => subscription.unsubscribe();
  }, [loadSchedule]);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setJobCategories([]);
        return;
      }
      const cats = await fetchJobCategories();
      if (!cancelled) setJobCategories(cats);
    };
    void loadCategories();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCategories();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const filteredShiftsByDay = useMemo(() => {
    if (!roleFilter) return shiftsByDay;
    const next: Record<number, ScheduleShiftDisplay[]> = {};
    for (const k of Object.keys(shiftsByDay)) {
      const day = Number(k);
      next[day] = (shiftsByDay[day] ?? []).filter((s) => (s.categoryName ?? '').trim() === roleFilter);
    }
    return next;
  }, [shiftsByDay, roleFilter]);

  const filteredWeekShiftsByIso = useMemo(() => {
    if (!roleFilter) return weekShiftsByIso;
    const next: Record<string, ScheduleShiftDisplay[]> = {};
    for (const [iso, arr] of Object.entries(weekShiftsByIso)) {
      next[iso] = arr.filter((s) => (s.categoryName ?? '').trim() === roleFilter);
    }
    return next;
  }, [weekShiftsByIso, roleFilter]);

  const selectedIso = selectedDay != null ? toIsoDate(year, monthIndex, selectedDay) : null;

  const shiftsForSelectedDay = useMemo(() => {
    if (selectedDay == null) return [];
    if (viewMode === 'week') {
      if (selectedIso == null) return [];
      return filteredWeekShiftsByIso[selectedIso] ?? [];
    }
    return filteredShiftsByDay[selectedDay] ?? [];
  }, [viewMode, selectedDay, selectedIso, filteredWeekShiftsByIso, filteredShiftsByDay]);

  const weekDays = useMemo((): WeekDayColumn[] => {
    const anchor = new Date(year, monthIndex, selectedDay ?? 1);
    const ws = startOfWeekSunday(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDaysLocal(ws, i);
      const iso = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
      return {
        iso,
        date: d,
        dayNum: d.getDate(),
        weekdayShort: WEEKDAYS[d.getDay()],
        shifts: filteredWeekShiftsByIso[iso] ?? [],
      };
    });
  }, [year, monthIndex, selectedDay, filteredWeekShiftsByIso]);

  const toolbarTitle = useMemo(() => {
    if (viewMode === 'week') {
      const anchor = new Date(year, monthIndex, selectedDay ?? 1);
      const ws = startOfWeekSunday(anchor);
      const we = addDaysLocal(ws, 6);
      const sameYear = ws.getFullYear() === we.getFullYear();
      if (sameYear) {
        return `${ws.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${we.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return `${ws.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${we.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return new Date(year, monthIndex, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewMode, year, monthIndex, selectedDay]);

  const goPrevPeriod = useCallback(() => {
    if (viewMode === 'week') {
      const a = new Date(year, monthIndex, selectedDay ?? 1);
      a.setDate(a.getDate() - 7);
      setYear(a.getFullYear());
      setMonthIndex(a.getMonth());
      setSelectedDay(a.getDate());
      return;
    }
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else setMonthIndex((m) => m - 1);
  }, [viewMode, year, monthIndex, selectedDay]);

  const goNextPeriod = useCallback(() => {
    if (viewMode === 'week') {
      const a = new Date(year, monthIndex, selectedDay ?? 1);
      a.setDate(a.getDate() + 7);
      setYear(a.getFullYear());
      setMonthIndex(a.getMonth());
      setSelectedDay(a.getDate());
      return;
    }
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else setMonthIndex((m) => m + 1);
  }, [viewMode, year, monthIndex, selectedDay]);

  const handlePostShiftSave = useCallback(
    async (values: PostShiftFormValues) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id;
      if (!uid) throw new Error('You must be signed in to post a shift.');

      if (selectedDay == null) {
        throw new Error('Select a day on the calendar before posting a shift.');
      }

      const rate = parseHourlyRate(values.hourlyRate);
      if (rate == null) throw new Error('Enter a valid hourly rate greater than zero.');

      const dateIso = toIsoDate(year, monthIndex, selectedDay);
      const descFirstLine = values.description.trim().split('\n')[0]?.slice(0, 180)?.trim();
      const title =
        descFirstLine ||
        `${values.roleName.trim() || 'Shift'} — ${dateIso}`;

      const { error } = await createClientShift(uid, {
        title,
        startDate: dateIso,
        endDate: dateIso,
        ratePerHour: rate,
        jobCategoryId: values.jobCategoryId,
        description:
          values.description.trim() || (values.timeRange.trim() ? values.timeRange.trim() : null),
      });

      if (error) throw new Error(error);
      await loadSchedule();
    },
    [year, monthIndex, selectedDay, loadSchedule],
  );

  const goToday = useCallback(() => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIndex(t.getMonth());
    setSelectedDay(t.getDate());
  }, []);

  useEffect(() => {
    const dim = new Date(year, monthIndex + 1, 0).getDate();
    if (selectedDay !== null && selectedDay > dim) {
      setSelectedDay(dim);
    }
  }, [year, monthIndex, selectedDay]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#fafafa]">
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5 md:px-8">
        <h1 className="text-xl font-semibold text-[#1f2937] md:text-2xl">Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPostShiftOpen(true)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white lg:hidden"
            style={{ backgroundColor: BRAND }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Post shift
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-sm text-[#475569]"
          >
            Export
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex max-h-[min(40vh,320px)] min-h-[140px] shrink-0 flex-col border-b border-[#e5e7eb] bg-white lg:hidden">
        <ScheduleDayShiftList
          year={year}
          monthIndex={monthIndex}
          selectedDay={selectedDay}
          shifts={shiftsForSelectedDay}
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <ScheduleSidebar
          year={year}
          monthIndex={monthIndex}
          selectedDay={selectedDay}
          shiftsForDay={shiftsForSelectedDay}
          onPostShift={() => setPostShiftOpen(true)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 md:p-5">
          {scheduleLoading ? (
            <p className="mb-2 text-xs text-[#64748b]">Loading shifts…</p>
          ) : null}
          <div className="mb-4 border-b border-[#e5e7eb] pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded p-1 text-[#64748b] hover:bg-gray-100"
                    onClick={goPrevPeriod}
                    aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-[#64748b] hover:bg-gray-100"
                    onClick={goNextPeriod}
                    aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-md border border-[#e2e8f0] px-4 py-1.5 text-xs font-semibold text-[#475569]"
                >
                  Today
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 text-lg font-medium text-[#1f2937]"
                >
                  {toolbarTitle}
                  <ChevronDown className="h-3 w-3 text-[#64748b]" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#e5e7eb] pt-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Filter className="h-5 w-5" />
                  <span className="font-medium text-[#1f2937]">Filter</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-[#64748b]">Role</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="h-9 rounded-lg border border-[#94a3b8] bg-white px-2 text-sm text-[#0f172a]"
                    aria-label="Filter by role"
                  >
                    <option value="">All roles</option>
                    {jobCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-[#64748b]">Location</span>
                  <input
                    className="h-9 w-36 rounded-lg border border-[#94a3b8] px-2 text-sm"
                    placeholder="Search"
                  />
                  <span className="text-sm text-[#64748b]">Sort</span>
                  <select className="h-9 rounded-lg border border-[#94a3b8] bg-white px-2 text-sm">
                    <option>Date</option>
                  </select>
                </div>
              </div>
              <div className="flex rounded-lg border border-[#e5e7eb] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                    viewMode === 'week' ? 'bg-[#f1f5f9] text-[#1f2937]' : 'text-[#64748b]'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                    viewMode === 'month' ? 'bg-[#f1f5f9] text-[#1f2937]' : 'text-[#64748b]'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'week' ? (
            <ScheduleWeekRow
              weekDays={weekDays}
              selectedIso={selectedIso}
              onSelectDate={(d) => {
                setYear(d.getFullYear());
                setMonthIndex(d.getMonth());
                setSelectedDay(d.getDate());
              }}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
              <div className="grid min-w-[720px] grid-cols-7 border-b border-[#e5e7eb] bg-[#fafafa]">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className="border-r border-[#e5e7eb] py-3 text-center text-sm font-medium last:border-r-0"
                    style={{ color: i === 0 || i === 6 ? WEEKEND : '#374151' }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {grid.map((row, ri) => (
                <div key={ri} className="grid min-h-[140px] min-w-[720px] grid-cols-7 border-b border-[#e5e7eb] last:border-b-0">
                  {row.map((cell, ci) => {
                    if (!cell) return <div key={ci} className="border-r border-[#e5e7eb] last:border-r-0" />;
                    const { d, inMonth } = cell;
                    const dayOfWeek = inMonth ? new Date(year, monthIndex, d).getDay() : -1;
                    const isWeekend = inMonth && (dayOfWeek === 0 || dayOfWeek === 6);
                    const isToday =
                      inMonth &&
                      new Date().getFullYear() === year &&
                      new Date().getMonth() === monthIndex &&
                      new Date().getDate() === d;
                    const shifts = inMonth ? filteredShiftsByDay[d] ?? [] : [];

                    return (
                      <div
                        key={ci}
                        role={inMonth ? 'button' : undefined}
                        tabIndex={inMonth ? 0 : undefined}
                        onClick={() => inMonth && setSelectedDay(d)}
                        onKeyDown={(e) => {
                          if (!inMonth) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDay(d);
                          }
                        }}
                        className={`border-r border-[#e5e7eb] p-1.5 last:border-r-0 ${
                          !inMonth ? 'bg-[#fafafa]/80' : 'cursor-pointer bg-white hover:bg-slate-50/80'
                        } ${
                          inMonth && selectedDay === d ? 'ring-1 ring-inset ring-[#4473c0]/40' : ''
                        }`}
                      >
                        <div className="mb-1 flex items-start justify-between gap-1">
                          <span
                            className={`text-sm ${isToday ? 'font-semibold' : ''}`}
                            style={{
                              color: !inMonth ? MUTED : isWeekend ? WEEKEND : '#374151',
                              ...(isToday ? { color: BRAND } : {}),
                            }}
                          >
                            {inMonth ? d : d}
                          </span>
                          {inMonth && shifts.length > 0 && (
                            <span className="rounded-full bg-[#4473c0]/15 px-1.5 text-[10px] font-semibold text-[#4473c0]">
                              {shifts.length}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {shifts.slice(0, 5).map((s) => (
                            <ShiftPill key={s.id} time={s.time} title={s.title} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PostShiftModal
        open={postShiftOpen}
        onClose={() => setPostShiftOpen(false)}
        jobCategories={jobCategories}
        onSave={handlePostShiftSave}
      />
    </div>
  );
}
