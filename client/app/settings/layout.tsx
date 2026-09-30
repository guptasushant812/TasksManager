import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage application preferences, escalation policies, notifications, security credentials, and visual appearance.',
  alternates: {
    canonical: '/settings',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
