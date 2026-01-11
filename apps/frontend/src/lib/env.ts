export const isDevelopment = process.env.NODE_ENV === 'development';

export type UserPlan = 'free' | 'basic' | 'pro';

export const isProUser = isDevelopment ? true : false;

export function getUserPlan(): UserPlan {
  if (isDevelopment) {
    return 'basic';
  }
  const plan = localStorage.getItem('user_plan') as UserPlan;
  return plan || 'free';
}

export function setUserPlan(plan: UserPlan): void {
  localStorage.setItem('user_plan', plan);
}

export function shouldShowWatermark(): boolean {
  const plan = getUserPlan();
  return plan === 'free';
}

export function canUseProFeatures(): boolean {
  const plan = getUserPlan();
  return plan === 'pro' || isDevelopment;
}

export function canUseBasicFeatures(): boolean {
  const plan = getUserPlan();
  return plan === 'basic' || plan === 'pro' || isDevelopment;
}

export function getAvailableAnimationCount(): number {
  const plan = getUserPlan();
  if (plan === 'free') return 3;
  if (plan === 'basic' || plan === 'pro') return 9;
  return 3;
}

export function getExportFormats() {
  const plan = getUserPlan();

  if (plan === 'basic' || plan === 'pro' || isDevelopment) {
    return {
      png: { free: true, disabled: false },
      jpg: { free: true, disabled: false },
      json: { free: true, disabled: false },
      gif: { free: true, disabled: false },
      mp4: { free: true, disabled: false },
      svg: { free: true, disabled: false },
      html: { free: true, disabled: false },
    };
  }

  return {
    png: { free: true, disabled: false },
    jpg: { free: true, disabled: false },
    json: { free: true, disabled: false },
    gif: { free: true, disabled: false },
    mp4: { free: false, disabled: false },
    svg: { free: false, disabled: false },
    html: { free: false, disabled: false },
  };
}
