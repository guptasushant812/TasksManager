import type { Metadata } from 'next';

import { getSiteUrl } from '@/lib/siteUrl';

const siteUrl = getSiteUrl();

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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I create and prioritize tasks?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click New Task in the header to add tasks manually or generate them with AI. Set priority to High (urgent blockers), Medium (standard deliverables), or Low (routine maintenance). Assign Task Date, optional Due Date, Given By department, and Contact Person.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Work Status connect to Reason and Remarks tabs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tasks support three active states: Pending, InProgress, and Completed. Switching status automatically updates the active reason notes and audit log.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the Multilingual AI Task Extraction work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The AI engine parses voice or text notes in English, Hindi, Marathi, and mixed dialects into structured fields including title, dates, department, and priority.',
      },
    },
    {
      '@type': 'Question',
      name: 'What triggers automated managerial escalations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Follow-ups exceeding configured touchpoint thresholds trigger automated email notifications to Managers, HODs, and Deputy HODs.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do exports and reporting work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Generate landscape PDF task registers, multi-sheet formatted Excel workbooks, or complete ZIP bundles with attachment media directly in memory.',
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
      name: 'Help & FAQ',
      item: `${siteUrl}/help`,
    },
  ],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
