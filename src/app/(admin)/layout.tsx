import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Website Admin',
    template: '%s | OVSRCSC Admin',
  },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1F3A',
  colorScheme: 'light',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={fontVariables}>
      <body className="min-h-screen bg-[#f3f4f1]">{children}</body>
    </html>
  );
}
