'use client';

interface NotificationSettingsModalProps {
  open: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (v: boolean) => void;
  desktopEnabled: boolean;
  onDesktopEnabledChange: (v: boolean) => void;
  vibrateEnabled: boolean;
  onVibrateEnabledChange: (v: boolean) => void;
  desktopPermission: NotificationPermission | 'unsupported';
  onRequestDesktopPermission: () => void;
}

export default function NotificationSettingsModal({
  open,
  onClose,
  soundEnabled,
  onSoundEnabledChange,
  desktopEnabled,
  onDesktopEnabledChange,
  vibrateEnabled,
  onVibrateEnabledChange,
  desktopPermission,
  onRequestDesktopPermission,
}: NotificationSettingsModalProps) {
  if (!open) return null;

  const canUseDesktop = typeof window !== 'undefined' && 'Notification' in window;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-settings-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 id="notif-settings-title" className="text-lg font-bold text-gray-900">
            Notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm font-medium"
          >
            Done
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <p className="text-sm text-gray-500">
            Sounds require a click or key press in this tab first (browser autoplay rules). Desktop alerts work best when this tab is in the background.
          </p>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium text-gray-800">Message sound</span>
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => onSoundEnabledChange(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-[#1E3A5F]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium text-gray-800">Vibration (mobile)</span>
            <button
              type="button"
              role="switch"
              aria-checked={vibrateEnabled}
              onClick={() => onVibrateEnabledChange(!vibrateEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                vibrateEnabled ? 'bg-[#1E3A5F]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  vibrateEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                }`}
              />
            </button>
          </label>

          <div className="space-y-2">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm font-medium text-gray-800">Desktop notifications</span>
              <button
                type="button"
                role="switch"
                aria-checked={desktopEnabled}
                disabled={!canUseDesktop || desktopPermission === 'denied'}
                onClick={() => onDesktopEnabledChange(!desktopEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  desktopEnabled ? 'bg-[#1E3A5F]' : 'bg-gray-300'
                } disabled:opacity-40`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    desktopEnabled ? 'translate-x-[22px]' : 'translate-x-[4px]'
                  }`}
                />
              </button>
            </label>
            {!canUseDesktop || desktopPermission === 'unsupported' ? (
              <p className="text-xs text-gray-400">Desktop notifications are not supported in this browser.</p>
            ) : desktopPermission === 'denied' ? (
              <p className="text-xs text-amber-700">Permission was blocked. Enable notifications for this site in the browser address bar.</p>
            ) : desktopPermission === 'default' ? (
              <button
                type="button"
                onClick={onRequestDesktopPermission}
                className="text-xs font-semibold text-[#1E3A5F] hover:underline"
              >
                Ask for permission
              </button>
            ) : (
              <p className="text-xs text-gray-400">Permission granted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
