'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  subscribeToIncomingDirectMessages,
  type MessageRecord,
} from '@/services/messages.service';
import {
  fetchGroups,
  subscribeToGroupMessageInserts,
  type GroupMessageRow,
} from '@/services/groups.service';
import { fetchContacts } from '@/lib/contactsService';
import {
  getDesktopNotificationsEnabled,
  getSoundNotificationsEnabled,
  getVibrationEnabled,
  setDesktopNotificationsEnabled,
  setSoundNotificationsEnabled,
  setVibrationEnabled,
} from '@/lib/notificationPreferences';
import {
  attachAudioUnlockListeners,
  classifyMessageSound,
  playMessageNotificationSound,
} from '@/lib/messageNotificationSound';
import MessageToastStack, { type MessageToastItem } from '@/components/MessageToastStack';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';

export type ActiveConversationState = {
  type: 'contact' | 'group' | 'none';
  contactUserId?: string | null;
  shiftId?: string | null;
  groupId?: string | null;
};

type MessageNotificationsContextValue = {
  registerActiveConversation: (s: ActiveConversationState) => void;
  openNotificationSettings: () => void;
};

const MessageNotificationsContext = createContext<MessageNotificationsContextValue | null>(null);

const MAX_TOASTS = 3;
const TOAST_MS = 6500;
const SEEN_CAP = 4000;

function truncateBody(s: string, n = 120): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return 'New activity';
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function trimSeenSet(set: Set<string>) {
  if (set.size <= SEEN_CAP) return;
  const keys = [...set];
  keys.slice(0, Math.floor(SEEN_CAP / 2)).forEach((k) => set.delete(k));
}

export function MessageNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const activeRef = useRef<ActiveConversationState>({ type: 'none' });
  const seenIdsRef = useRef<Set<string>>(new Set());
  const nameByUserIdRef = useRef<Map<string, string>>(new Map());
  const groupIdsRef = useRef<Set<string>>(new Set());
  const groupNameByIdRef = useRef<Map<string, string>>(new Map());

  const [toasts, setToasts] = useState<MessageToastItem[]>([]);
  const toastQueueRef = useRef<MessageToastItem[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [desktopOn, setDesktopOn] = useState(false);
  const [vibrateOn, setVibrateOn] = useState(true);
  const [desktopPerm, setDesktopPerm] = useState<NotificationPermission | 'default' | 'unsupported'>(
    'default'
  );

  const registerActiveConversation = useCallback((s: ActiveConversationState) => {
    activeRef.current = s;
  }, []);

  const openNotificationSettings = useCallback(() => {
    setSettingsOpen(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPerm(Notification.permission);
    } else {
      setDesktopPerm('unsupported');
    }
    setSoundOn(getSoundNotificationsEnabled());
    setDesktopOn(getDesktopNotificationsEnabled());
    setVibrateOn(getVibrationEnabled());
  }, []);

  useEffect(() => attachAudioUnlockListeners(), []);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then((result: { data: { session: { user?: { id: string } } | null } }) => {
      const session = result.data.session;
      if (!cancelled) setUserId(session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: { id: string } } | null) => {
        setUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const refreshGroups = useCallback(() => {
    if (!userId) return;
    void fetchGroups(userId)
      .then((groups) => {
        const ids = new Set<string>();
        const names = new Map<string, string>();
        groups.forEach((g) => {
          ids.add(g.id);
          names.set(g.id, g.name);
        });
        groupIdsRef.current = ids;
        groupNameByIdRef.current = names;
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void fetchContacts()
      .then((contacts) => {
        const m = new Map<string, string>();
        contacts.forEach((c) => m.set(c.user_id, c.name));
        nameByUserIdRef.current = m;
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refreshGroups();
    const t = setInterval(refreshGroups, 120_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshGroups();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [userId, refreshGroups]);

  const dismissToastRef = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    dismissToastRef.current = (id: string) => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      queueMicrotask(() => {
        setToasts((prev) => {
          if (prev.length >= MAX_TOASTS || toastQueueRef.current.length === 0) return prev;
          const pending = toastQueueRef.current.shift();
          if (!pending) return prev;
          window.setTimeout(() => dismissToastRef.current(pending.id), TOAST_MS);
          return [...prev.filter((t) => t.id !== pending.id), pending];
        });
      });
    };
  }, []);

  const dismissToast = useCallback((id: string) => dismissToastRef.current(id), []);

  const addToast = useCallback((item: MessageToastItem) => {
    setToasts((prev) => {
      const deduped = prev.filter((t) => t.id !== item.id);
      if (deduped.length >= MAX_TOASTS) {
        toastQueueRef.current.push(item);
        return deduped;
      }
      window.setTimeout(() => dismissToastRef.current(item.id), TOAST_MS);
      return [...deduped, item];
    });
  }, []);

  const playEffects = useCallback((kind: 'user' | 'system', title: string, body: string) => {
    if (getSoundNotificationsEnabled()) {
      playMessageNotificationSound(kind);
    }
    if (
      getVibrationEnabled() &&
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      try {
        navigator.vibrate(kind === 'system' ? [28, 36, 28] : 120);
      } catch {
        /* ignore */
      }
    }
    if (
      typeof document !== 'undefined' &&
      document.hidden &&
      getDesktopNotificationsEnabled() &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body: truncateBody(body, 100),
          icon: '/images/logo.png',
        });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const consumeNewMessageId = useCallback((id: string): boolean => {
    if (seenIdsRef.current.has(id)) return false;
    seenIdsRef.current.add(id);
    trimSeenSet(seenIdsRef.current);
    return true;
  }, []);

  const notifyDm = useCallback(
    (m: MessageRecord) => {
      const active = activeRef.current;
      if (
        active.type === 'contact' &&
        active.contactUserId === m.sender_id &&
        (active.shiftId ?? null) === (m.shift_id ?? null)
      ) {
        consumeNewMessageId(m.id);
        window.dispatchEvent(new CustomEvent('huzzly-unread-refresh'));
        return;
      }

      if (!consumeNewMessageId(m.id)) return;

      const name = nameByUserIdRef.current.get(m.sender_id) || 'Someone';
      const kind = classifyMessageSound(m.content || '');
      const body = truncateBody(m.content || '(attachment)');
      playEffects(kind, name, body);

      const q = new URLSearchParams({
        receiver_id: m.sender_id,
        receiver_name: name,
      });
      if (m.shift_id) q.set('shift_id', m.shift_id);

      addToast({
        id: m.id,
        title: name,
        body,
        variant: 'dm',
        navigateHref: `/messages?${q.toString()}`,
      });

      window.dispatchEvent(new CustomEvent('huzzly-unread-refresh'));
    },
    [addToast, consumeNewMessageId, playEffects]
  );

  const notifyGroup = useCallback(
    (row: GroupMessageRow) => {
      if (!userId || row.sender_id === userId) return;
      if (!groupIdsRef.current.has(row.group_id)) return;

      const active = activeRef.current;
      if (active.type === 'group' && active.groupId === row.group_id) {
        consumeNewMessageId(row.id);
        window.dispatchEvent(new CustomEvent('huzzly-unread-refresh'));
        return;
      }

      if (!consumeNewMessageId(row.id)) return;

      const gName = groupNameByIdRef.current.get(row.group_id) || 'Group';
      const kind = classifyMessageSound(row.content || '');
      const body = `${row.sender_name}: ${truncateBody(row.content || '(attachment)')}`;
      playEffects(kind, gName, body);

      addToast({
        id: row.id,
        title: gName,
        body,
        variant: 'group',
        navigateHref: '/messages',
      });

      window.dispatchEvent(new CustomEvent('huzzly-unread-refresh'));
    },
    [userId, addToast, consumeNewMessageId, playEffects]
  );

  useEffect(() => {
    if (!userId) return;
    const unsubDm = subscribeToIncomingDirectMessages(userId, notifyDm);
    const unsubG = subscribeToGroupMessageInserts(userId, notifyGroup);
    return () => {
      unsubDm();
      unsubG();
    };
  }, [userId, notifyDm, notifyGroup]);

  const requestDesktopPermission = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    void Notification.requestPermission().then((p) => setDesktopPerm(p));
  }, []);

  const ctx: MessageNotificationsContextValue = {
    registerActiveConversation,
    openNotificationSettings,
  };

  return (
    <MessageNotificationsContext.Provider value={ctx}>
      {children}
      <MessageToastStack toasts={toasts} onDismiss={dismissToast} />
      <NotificationSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundOn}
        onSoundEnabledChange={(v) => {
          setSoundOn(v);
          setSoundNotificationsEnabled(v);
        }}
        desktopEnabled={desktopOn}
        onDesktopEnabledChange={(v) => {
          setDesktopOn(v);
          setDesktopNotificationsEnabled(v);
          if (v && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission().then((p) => setDesktopPerm(p));
          }
        }}
        vibrateEnabled={vibrateOn}
        onVibrateEnabledChange={(v) => {
          setVibrateOn(v);
          setVibrationEnabled(v);
        }}
        desktopPermission={desktopPerm === 'unsupported' ? 'unsupported' : desktopPerm}
        onRequestDesktopPermission={requestDesktopPermission}
      />
    </MessageNotificationsContext.Provider>
  );
}

export function useMessageNotifications() {
  const v = useContext(MessageNotificationsContext);
  if (!v) {
    throw new Error('useMessageNotifications must be used within MessageNotificationsProvider');
  }
  return v;
}
