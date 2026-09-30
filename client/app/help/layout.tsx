import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & FAQ',
  description: 'Comprehensive documentation, feature walkthroughs, FAQs, and tips for optimizing your workflow with TasksManager.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Help & FAQ | TasksManager',
    description: 'Comprehensive documentation, feature walkthroughs, FAQs, and tips for optimizing your workflow with TasksManager.',
    url: '/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
