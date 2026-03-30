/** Public asset (filename spelling matches repo: notifcation.mp3) */
const NOTIFICATION_SOUND_SRC = '/sound/notifcation.mp3';

/** True after we have run the unlock sequence (muted play in a user gesture). */
let audioUnlocked = false;
let sharedAudio: HTMLAudioElement | null = null;
let unlockStarted = false;

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio(NOTIFICATION_SOUND_SRC);
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

/**
 * Browsers block audio until there has been a real `play()` tied to user input.
 * A boolean flag is not enough — we prime with a muted play inside the gesture.
 */
function primeInUserGesture(): void {
  if (unlockStarted) return;
  unlockStarted = true;

  const el = getSharedAudio();
  el.muted = true;
  el.volume = 1;

  void el
    .play()
    .then(() => {
      el.pause();
      el.currentTime = 0;
      el.muted = false;
      el.volume = 0.9;
    })
    .catch(() => {
      el.muted = false;
      el.volume = 0.9;
    })
    .finally(() => {
      audioUnlocked = true;
    });
}

/** Call once on app mount. */
export function attachAudioUnlockListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const unlock = () => primeInUserGesture();

  window.addEventListener('pointerdown', unlock, { passive: true, capture: true });
  window.addEventListener('keydown', unlock, { passive: true, capture: true });
  window.addEventListener('click', unlock, { passive: true, capture: true });

  return () => {
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('click', unlock, true);
  };
}

export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

export type MessageSoundKind = 'user' | 'system';

/** Plays the notification MP3. Requires a prior user gesture on the page (see prime). */
export function playMessageNotificationSound(_kind: MessageSoundKind): boolean {
  if (typeof window === 'undefined' || !audioUnlocked) return false;

  try {
    const el = getSharedAudio();
    el.muted = false;
    el.volume = 0.9;
    el.currentTime = 0;
    void el.play().catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[notification sound] play() failed:', err);
      }
    });
    return true;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[notification sound]', err);
    }
    return false;
  }
}

export function classifyMessageSound(content: string): MessageSoundKind {
  const t = content.trim();
  if (/^\[system\]/i.test(t) || /^\[auto\]/i.test(t)) return 'system';
  return 'user';
}
