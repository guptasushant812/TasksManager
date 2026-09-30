import type { Metadata } from 'next';
import './globals.css';
import { TaskProvider } from '@/context/TaskContext';
import Sidebar from '@/components/layout/Sidebar';
import PasswordGate from '@/components/auth/PasswordGate';

export const metadata: Metadata = {
  title: 'TasksManager',
  description: 'Clean and simple task manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'light' || t === 'botanical') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
          }}
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
