import type { Metadata } from 'next';

import { getSiteUrl } from '@/lib/siteUrl';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Help & User Guide | TasksManager',
  description: 'Step-by-step user guide for TasksManager: dashboard time navigation, task workflows, multilingual AI quick-add, follow-ups, escalations, and exports.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Help & User Guide | TasksManager',
    description: 'Step-by-step user guide for TasksManager: dashboard time navigation, task workflows, multilingual AI quick-add, follow-ups, escalations, and exports.',
    url: '/help',
  },
};

const guideJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I filter tasks by Year, Month, Week, or Day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use the cascading scope bar on the Dashboard or Tasks page. Select a Year, click a Month or 6-day Work Week (Monday-Saturday), or choose a specific day. Click All Time to see your complete task history.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do task statuses and reason notes work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tasks support three states: Pending, In Progress, and Completed. Each status preserves its own notes: Reason for Pending documents blockers, Reason for In Progress tracks active work, and Remarks for Completed records delivery notes.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the AI Quick-Add Assistant work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click New Task and switch to the AI Assistant tab. Type or dictate notes in English, Hindi, Marathi, or Hinglish. The assistant automatically generates task cards with titles, deadlines, departments, priorities, and subtasks.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do communication follow-ups and managerial escalations work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Log client or department interactions across phone calls, WhatsApp, emails, or meetings with proof attachments and next contact dates. When follow-ups reach the configured threshold, automated escalation alerts are dispatched to team leads and department heads.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I export task reports or share progress publicly?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click Export in the top header to download formatted Excel spreadsheets, landscape PDF registers, or complete ZIP bundles with attachment media. You can also generate a secure, read-only public status portal link to share with outside stakeholders.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Help & User Guide',
      item: `${siteUrl}/help`,
    },
  ],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
