'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LayoutGrid,
  Users,
  Calendar,
  IdCard,
  MessageSquare,
  LifeBuoy,
  Hexagon,
  Bell,
  LogOut,
  Rocket,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import {
  finalizeEmployerWebOnboarding,
  formatPersistError,
  type EmployerWebSummaryPayload,
} from '@/lib/onboardingService';

type Step = 'account' | 'organization' | 'location' | 'manager' | 'summary';

const BRAND = '#4473C0';
const BRAND_NAVY = '#1f2937';
const INPUT =
  'w-full h-14 rounded-lg border border-[#94a3b8] bg-white px-2.5 text-base text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#4473c0]/30 focus:border-[#4473c0]';

function EmployerSetupSidebar() {
  const iconBtn =
    'flex h-[72px] w-full items-center justify-center text-white/80 hover:text-white transition-colors';
  return (
    <aside
      className="flex h-full w-20 shrink-0 flex-col border-r border-[#94a3b8] bg-gradient-to-b from-[#122036] from-[52%] to-[#2a4a7c] pb-5"
      aria-label="Setup navigation"
    >
      <div className="flex h-[120px] items-center justify-center py-5">
        <img src="/images/logo.png" alt="Huzly" className="h-9 w-auto object-contain brightness-0 invert" />
      </div>
      <nav className="flex flex-1 flex-col border-t border-white/10 py-3.5">
        <button type="button" className={iconBtn} aria-label="Dashboard">
          <LayoutGrid className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Team">
          <Users className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Calendar">
          <Calendar className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Directory">
          <IdCard className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Messages">
          <MessageSquare className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Support">
          <LifeBuoy className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Settings">
          <Hexagon className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button type="button" className={iconBtn} aria-label="Notifications">
          <Bell className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </nav>
      <div className="flex justify-center pb-2">
        <button type="button" className={iconBtn} aria-label="Log out">
          <LogOut className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}

function MainPanel({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center p-6 sm:p-10"
      style={{
        background:
          'radial-gradient(ellipse 72% 52% at 50% 50%, rgba(255,255,255,1) 0%, rgba(236,241,249,1) 100%)',
      }}
    >
      <div
        className={`w-full rounded-3xl border border-[#e5e7eb] bg-white px-8 py-9 shadow-[0px_20px_25px_rgba(0,0,0,0.1),0px_10px_10px_rgba(0,0,0,0.04)] ${wide ? 'max-w-[720px]' : 'max-w-[600px]'}`}
      >
        {children}
      </div>
    </div>
  );
}

interface EmployerWebSetupFlowProps {
  userId: string;
  onFinished: () => void;
}

export default function EmployerWebSetupFlow({ userId, onFinished }: EmployerWebSetupFlowProps) {
  const [step, setStep] = useState<Step>('account');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [organizationName, setOrganizationName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [primaryLocation, setPrimaryLocation] = useState(true);
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerRole, setManagerRole] = useState('Manager');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('clients')
        .select('company_name, city, state, zip_code')
        .eq('user_id', userId)
        .maybeSingle();
      if (cancelled || !data) return;
      const parts = [data.city, data.state, data.zip_code].filter(Boolean);
      setOrganizationName((data.company_name as string) || '');
      if (parts.length) setAddress(parts.join(', '));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const goOrganization = () => setStep('organization');
  const goLocation = () => {
    if (!organizationName.trim()) {
      setError('Enter your organization name.');
      return;
    }
    setError(null);
    setStep('location');
  };
  const goManager = () => {
    if (!locationName.trim() || !address.trim()) {
      setError('Enter location name and address.');
      return;
    }
    setError(null);
    setStep('manager');
  };
  const goSummary = () => {
    if (!managerName.trim() || !managerEmail.trim()) {
      setError('Enter manager name and email.');
      return;
    }
    setError(null);
    setStep('summary');
  };

  const handleSummarySave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const payload: EmployerWebSummaryPayload = {
      organizationName: organizationName.trim(),
      locationName: locationName.trim(),
      address: address.trim(),
      primaryLocation,
      managerName: managerName.trim(),
      managerPhone: managerPhone.trim(),
      managerEmail: managerEmail.trim(),
      managerRole: managerRole.trim() || 'Manager',
    };
    try {
      await finalizeEmployerWebOnboarding(userId, payload);
      onFinished();
    } catch (e: unknown) {
      setError(formatPersistError(e));
    } finally {
      setSaving(false);
    }
  }, [
    userId,
    organizationName,
    locationName,
    address,
    primaryLocation,
    managerName,
    managerPhone,
    managerEmail,
    managerRole,
    onFinished,
  ]);

  const btnPrimary =
    'flex h-11 flex-1 items-center justify-center rounded-lg bg-[#4473c0] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40';
  const btnSecondary =
    'flex h-11 flex-1 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-gray-50 disabled:opacity-40';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <EmployerSetupSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'account' && (
          <MainPanel>
            <div className="flex flex-col items-center gap-3.5 text-center">
              <div
                className="flex h-[105px] w-[100px] items-center justify-center rounded-2xl p-2 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
                style={{ background: `linear-gradient(135deg, ${BRAND}22, #fff)` }}
              >
                <Rocket className="h-16 w-16" style={{ color: BRAND }} strokeWidth={1.25} />
              </div>
              <h1 className="text-2xl font-semibold leading-8" style={{ color: BRAND_NAVY }}>
                Your account has been created!
              </h1>
              <div className="flex flex-col gap-6 text-base leading-6 text-[#4b5563]">
                <p className="max-w-md">
                  Congrats! as you start your journey in Huzly, you can start creating your Organization and
                  Location before you can start posting your gigs.
                </p>
                <p className="max-w-md">
                  If you need help you can email{' '}
                  <a href="mailto:support@huzly.com" className="font-medium text-[#0062ff]">
                    support@huzly.com
                  </a>{' '}
                  and will get back to you ASAP.
                </p>
              </div>
              <button type="button" className={`${btnPrimary} mt-2 w-full max-w-none flex-none`} onClick={goOrganization}>
                Add an Organization
              </button>
            </div>
          </MainPanel>
        )}

        {step === 'organization' && (
          <MainPanel>
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-2xl font-semibold leading-8 text-[#1f2937]">Create an Organization</h1>
                <p className="mt-2 text-sm leading-5 text-[#64748b]">
                  Enter your organization name as you want it to appear on Huzly.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#64748b]">Organization name</label>
                <input
                  className={INPUT}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="flex justify-end">
                <button type="button" className={`${btnPrimary} w-[150px] flex-none`} onClick={goLocation}>
                  Continue
                </button>
              </div>
            </div>
          </MainPanel>
        )}

        {step === 'location' && (
          <MainPanel>
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-2xl font-semibold leading-8 text-[#1f2937]">Add Location</h1>
                <p className="mt-2 text-sm leading-5 text-[#64748b]">Add your first work location.</p>
              </div>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Location Name</label>
                  <input
                    className={INPUT}
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Southwest Warehouse"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Address</label>
                  <input
                    className={INPUT}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, City, State"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#64748b]">
                  <input
                    type="checkbox"
                    checked={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.checked)}
                    className="h-6 w-6 rounded border-[#94a3b8] text-[#4473c0] focus:ring-[#4473c0]"
                  />
                  Set as primary location
                </label>
              </div>
              <div className="flex gap-2">
                <button type="button" className={btnSecondary} onClick={() => setStep('organization')}>
                  Cancel
                </button>
                <button type="button" className={btnPrimary} onClick={goManager}>
                  Continue
                </button>
              </div>
            </div>
          </MainPanel>
        )}

        {step === 'manager' && (
          <MainPanel>
            <div className="flex flex-col gap-8">
              <div>
                <h1 className="text-2xl font-semibold leading-8 text-[#1f2937]">Add Manager</h1>
                <p className="mt-2 text-sm leading-5 text-[#64748b]">Add your first manager in this location.</p>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Manager Name</label>
                  <input
                    className={INPUT}
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Phone Number (optional)</label>
                  <input
                    className={INPUT}
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="+1"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Email</label>
                  <input
                    type="email"
                    className={INPUT}
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="yourname@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Role</label>
                  <div className="relative">
                    <select
                      className={`${INPUT} appearance-none pr-10`}
                      value={managerRole}
                      onChange={(e) => setManagerRole(e.target.value)}
                    >
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                      <option value="Supervisor">Supervisor</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748b]" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className={btnSecondary} onClick={() => setStep('location')}>
                  Cancel
                </button>
                <button type="button" className={btnPrimary} onClick={goSummary}>
                  Add Manager
                </button>
              </div>
            </div>
          </MainPanel>
        )}

        {step === 'summary' && (
          <MainPanel wide>
            <div className="flex flex-col gap-6">
              <h1 className="text-4xl font-semibold leading-10 text-[#1f2937]">Summary</h1>

              <section className="flex flex-col gap-5">
                <h2 className="text-lg font-semibold leading-7 text-[#1f2937]">Organization</h2>
                <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                  {organizationName || '—'}
                </div>
              </section>

              <hr className="border-[#e5e7eb]" />

              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold leading-7 text-[#1f2937]">Location</h2>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Location Name</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {locationName}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Address</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {address}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-[#64748b]">
                  <input
                    type="checkbox"
                    checked={primaryLocation}
                    readOnly
                    className="h-6 w-6 rounded border-[#94a3b8] text-[#4473c0]"
                  />
                  Set as primary location
                </label>
              </section>

              <hr className="border-[#e5e7eb]" />

              <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold leading-7 text-[#1f2937]">Manager</h2>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Manager Name</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {managerName}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Phone Number (optional)</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {managerPhone || '—'}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Email</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {managerEmail}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[#64748b]">Role</label>
                  <div className="rounded-lg border border-[#94a3b8] px-2.5 py-3 text-base text-[#0f172a]">
                    {managerRole}
                  </div>
                </div>
              </section>

              <div className="flex gap-2 pt-2">
                <button type="button" className={btnSecondary} onClick={() => setStep('manager')} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className={btnPrimary} onClick={handleSummarySave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </MainPanel>
        )}
      </div>
    </div>
  );
}
