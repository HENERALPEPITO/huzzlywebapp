'use client';

import { MessageNotificationsProvider } from '@/context/MessageNotificationsContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <MessageNotificationsProvider>{children}</MessageNotificationsProvider>;
}
