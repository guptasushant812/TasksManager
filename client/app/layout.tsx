import type { Metadata } from 'next';
import './globals.css';
import { TaskProvider } from '@/context/TaskContext';
import Sidebar from '@/components/layout/Sidebar';
import PasswordGate from '@/components/auth/PasswordGate';

export const metadata: Metadata = {
  title: 'TasksManager Enterprise',
  description: 'Enterprise task management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;900&family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
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
