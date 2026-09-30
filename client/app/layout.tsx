import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TaskProvider } from '@/context/TaskContext';
import Sidebar from '@/components/layout/Sidebar';
import PasswordGate from '@/components/auth/PasswordGate';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tasksmanager.app';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TasksManager — High-Performance Task & Escalation Management',
    template: '%s | TasksManager',
  },
  description:
    'Modern, agile task management with intelligent AI task parsing, automatic multi-tier escalation thresholds, client follow-up tracking, and public status portals.',
  keywords: [
    'TasksManager',
    'task manager',
    'escalation management',
    'follow-up tracking',
    'productivity dashboard',
    'workflow automation',
    'team task management',
    'AI task parser',
  ],
  authors: [{ name: 'TasksManager Team' }],
  creator: 'TasksManager',
  publisher: 'TasksManager',
  applicationName: 'TasksManager',
  generator: 'Next.js',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'TasksManager',
    title: 'TasksManager — High-Performance Task & Escalation Management',
    description:
      'Manage team workflows, log follow-ups, configure multi-tier escalations, and share real-time public project status with TasksManager.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TasksManager Platform Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TasksManager — High-Performance Task & Escalation Management',
    description:
      'Streamline task tracking, multi-tier team escalations, and client follow-ups in one streamlined platform.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  category: 'Productivity',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TasksManager',
  applicationCategory: 'BusinessApplication, Productivity',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  description:
    'Modern, agile task management with intelligent AI task parsing, automatic multi-tier escalation thresholds, client follow-up tracking, and public status portals.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Real-time task tracking with cascading date filters',
    'Multi-tier escalation rules (Manager, HOD, DyHOD)',
    'Client follow-up tracking with attachments',
    'AI voice & text prompt parser for rapid task creation',
    'Shareable read-only public status portal',
    'Responsive dark & light mode support',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let t = localStorage.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (t === 'botanical' || t === 'warm' || t === 'emerald') {
                  t = 'dark';
                  localStorage.theme = 'dark';
                }
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Source+Sans+3:wght@400;500;600;700&family=Space+Grotesk:wght@500;700;900&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex' }}>
        <PasswordGate>
          <TaskProvider>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', minWidth: 0 }}>
              {children}
            </div>
          </TaskProvider>
        </PasswordGate>
      </body>
    </html>
  );
}
