'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  X,
  Eye,
  BriefcaseBusiness,
  ChevronDown,
  Pencil,
  PlusCircle,
  MapPin,
  Tag,
  ClipboardList,
  Sparkles,
} from 'lucide-react';

const BRAND = '#4473C0';
const TITLE_NAVY = '#1e3559';

export type PostShiftFormValues = {
  timeRange: string;
  /** Selected job category UUID when posting to Supabase; null if using legacy label-only roles. */
  jobCategoryId: string | null;
  /** Display name of the selected role / category (for shift title fallback). */
  roleName: string;
  hourlyRate: string;
  jobSite: string;
  tags: string;
  taskList: string;
  description: string;
  repeatShifts: boolean;
  saveAsTemplate: boolean;
};

const ROLE_OPTIONS = ['Cook', 'Server', 'Picker', 'Laborer', 'Forklift operator'] as const;
const TASK_LIST_OPTIONS = ['Select', 'Opening checklist', 'Closing checklist', 'Inventory count'];

type PostShiftModalProps = {
  open: boolean;
  onClose: () => void;
  /** When provided, role dropdown uses `public.job_categories` ids; otherwise legacy string roles (no `job_category_id` on insert). */
  jobCategories?: { id: string; name: string }[];
  onSave?: (values: PostShiftFormValues) => Promise<void>;
};

function FieldShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 w-full items-center gap-2 rounded-lg border border-[#94a3b8] bg-white px-2.5 text-sm text-[#0f172a] ${className}`}
    >
      {children}
    </div>
  );
}

export default function PostShiftModal({ open, onClose, jobCategories, onSave }: PostShiftModalProps) {
  const titleId = useId();
  const [timeRange, setTimeRange] = useState('1:00 PM - 4:00 PM');
  const roleOptions = useMemo(
    () =>
      jobCategories?.length
        ? jobCategories.map((c) => ({ id: c.id, name: c.name }))
        : ROLE_OPTIONS.map((r) => ({ id: `legacy:${r}`, name: r })),
    [jobCategories],
  );
  const [roleKey, setRoleKey] = useState<string>(() => roleOptions[0]?.id ?? '');
  const [hourlyRate, setHourlyRate] = useState('$20');
  const [jobSite, setJobSite] = useState('');
  const [tags, setTags] = useState('');
  const [taskList, setTaskList] = useState<string>(TASK_LIST_OPTIONS[0]!);
  const [description, setDescription] = useState('');
  const [repeatShifts, setRepeatShifts] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const descLen = description.length;
  const maxDesc = 350;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    const first = roleOptions[0]?.id ?? '';
    setRoleKey((k) => (roleOptions.some((o) => o.id === k) ? k : first));
  }, [open, roleOptions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSave = useCallback(async () => {
    const opt = roleOptions.find((o) => o.id === roleKey);
    const roleName = opt?.name ?? 'Shift';
    const jobCategoryId = roleKey.startsWith('legacy:') ? null : roleKey;

    const values: PostShiftFormValues = {
      timeRange,
      jobCategoryId,
      roleName,
      hourlyRate,
      jobSite,
      tags,
      taskList,
      description: description.slice(0, maxDesc),
      repeatShifts,
      saveAsTemplate,
    };

    if (!onSave) {
      onClose();
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(values);
      onClose();
    } catch (e) {
      console.error('[PostShiftModal] Save failed', e);
      setSaveError(e instanceof Error ? e.message : 'Could not save shift.');
    } finally {
      setSaving(false);
    }
  }, [
    timeRange,
    roleKey,
    roleOptions,
    hourlyRate,
    jobSite,
    tags,
    taskList,
    description,
    repeatShifts,
    saveAsTemplate,
    onSave,
    onClose,
  ]);

  const handleAskAi = useCallback(() => {
    setDescription(
      'Reliable team member needed for food prep and station support during peak hours. Prior experience in a fast-paced kitchen preferred.',
    );
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex max-h-[min(90vh,860px)] w-full max-w-[664px] flex-col overflow-hidden rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0px_20px_25px_rgba(0,0,0,0.1),0px_10px_10px_rgba(0,0,0,0.04)]"
      >
        <div className="relative shrink-0 px-6 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="pb-3 pr-10">
            <h2 id={titleId} className="text-2xl font-semibold leading-8" style={{ color: TITLE_NAVY }}>
              Post shift
            </h2>
          </div>
        </div>
        <div className="h-px w-full shrink-0 bg-[#e5e7eb]" />

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-xs leading-4 text-[#64748b]" htmlFor="post-shift-time">
                  Time:
                </label>
                <FieldShell>
                  <input
                    id="post-shift-time"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#94a3b8]"
                  />
                  <Eye className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} aria-hidden />
                </FieldShell>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-xs leading-4 text-[#64748b]" htmlFor="post-shift-role">
                  Add Role / Position:
                </label>
                <div className="relative">
                  <BriefcaseBusiness
                    className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]"
                    strokeWidth={1.5}
                  />
                  <select
                    id="post-shift-role"
                    value={roleKey}
                    onChange={(e) => setRoleKey(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-[#94a3b8] bg-white py-2 pl-10 pr-9 text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4473c0]/25"
                  >
                    {roleOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 items-end gap-5 sm:grid-cols-2 sm:gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-xs leading-4 text-[#64748b]" htmlFor="post-shift-rate">
                  Edit Hourly rate:
                </label>
                <FieldShell>
                  <input
                    id="post-shift-rate"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#94a3b8]"
                  />
                  <Pencil className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} aria-hidden />
                </FieldShell>
              </div>
              <button
                type="button"
                className="flex h-11 w-full items-center gap-2 rounded-lg border border-[#94a3b8] bg-white px-2.5 text-left text-sm text-[#94a3b8] hover:bg-slate-50"
              >
                <PlusCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                Add a break
              </button>
            </div>
          </div>

          <div className="my-5 h-px w-full bg-[#e5e7eb]" />

          <div className="flex flex-col gap-5">
            <h3 className="text-lg font-semibold leading-7" style={{ color: TITLE_NAVY }}>
              Add more shift details
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-xs text-[#64748b]" htmlFor="post-shift-site">
                  Job Site:
                </label>
                <FieldShell>
                  <MapPin className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                  <input
                    id="post-shift-site"
                    value={jobSite}
                    onChange={(e) => setJobSite(e.target.value)}
                    placeholder="Site"
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#94a3b8]"
                  />
                </FieldShell>
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <label className="text-xs text-[#64748b]" htmlFor="post-shift-tags">
                  Tags:
                </label>
                <FieldShell>
                  <Tag className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                  <input
                    id="post-shift-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Select"
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#94a3b8]"
                  />
                </FieldShell>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#64748b]" htmlFor="post-shift-tasks">
                Shift task list:
              </label>
              <div className="relative">
                <ClipboardList
                  className="pointer-events-none absolute left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]"
                  strokeWidth={1.5}
                />
                <select
                  id="post-shift-tasks"
                  value={taskList}
                  onChange={(e) => setTaskList(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-[#94a3b8] bg-white py-2 pl-10 pr-9 text-sm text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4473c0]/25"
                >
                  {TASK_LIST_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]"
                  strokeWidth={2}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#64748b]">Add Description</span>
                <button
                  type="button"
                  onClick={handleAskAi}
                  className="flex items-center gap-2 text-left text-[10px] leading-[15px] text-[#1e293b]"
                >
                  <Sparkles className="h-[18px] w-[18px] shrink-0" style={{ color: BRAND }} strokeWidth={1.5} />
                  <span>
                    Ask <span className="font-semibold">AI</span> to generate description
                  </span>
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, maxDesc))}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[#94a3b8] bg-white p-3 text-sm leading-5 text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4473c0]/25"
                  placeholder=" "
                  aria-label="Shift description"
                />
                <p className="text-right text-xs text-[#64748b]">
                  {descLen}/{maxDesc}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={repeatShifts}
                  onClick={() => setRepeatShifts((v) => !v)}
                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
                    repeatShifts ? 'bg-[#4473c0]' : 'bg-[#94a3b8]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                      repeatShifts ? 'translate-x-[18px]' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm text-[#0f172a]">Repeat shifts</span>
              </div>
              <label className="flex cursor-pointer items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="size-[18px] rounded border-[#64748b] text-[#4473c0] focus:ring-[#4473c0]"
                />
                <span className="text-xs text-[#0f172a]">Save as shift template</span>
              </label>
            </div>
          </div>

          {saveError ? (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#475569] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
