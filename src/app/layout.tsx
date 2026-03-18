import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Huzzly' };

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%', overflow: 'hidden' }}>
      <body style={{ height: '100%', overflow: 'hidden', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
