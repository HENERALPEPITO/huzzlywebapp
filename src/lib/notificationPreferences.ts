const SOUND_KEY = 'huzzly_notification_sound';
const DESKTOP_KEY = 'huzzly_notification_desktop';
const VIBRATE_KEY = 'huzzly_notification_vibrate';

function readBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultValue;
    return v === '1' || v === 'true';
  } catch {
    return defaultValue;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function getSoundNotificationsEnabled(): boolean {
  return readBool(SOUND_KEY, true);
}

export function setSoundNotificationsEnabled(value: boolean) {
  writeBool(SOUND_KEY, value);
}

export function getDesktopNotificationsEnabled(): boolean {
  return readBool(DESKTOP_KEY, false);
}

export function setDesktopNotificationsEnabled(value: boolean) {
  writeBool(DESKTOP_KEY, value);
}

export function getVibrationEnabled(): boolean {
  return readBool(VIBRATE_KEY, true);
}

export function setVibrationEnabled(value: boolean) {
  writeBool(VIBRATE_KEY, value);
}
