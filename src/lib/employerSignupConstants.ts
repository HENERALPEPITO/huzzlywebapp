/** sessionStorage key: set after employer OTP success, read on `/onboarding` mount. */
export const EMPLOYER_ONBOARDING_PREFILL_KEY = 'employer_onboarding_prefill';

export type EmployerOnboardingPrefill = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};
