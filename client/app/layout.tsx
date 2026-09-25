import type { Metadata } from 'next';
import './globals.css';
import { TaskProvider } from '@/context/TaskContext';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'TasksManager Enterprise',
  description: 'Enterprise task management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex' }}>
        <TaskProvider>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', minWidth: 0 }}>
            {children}
          </div>
        </TaskProvider>
      </body>
    </html>
  );
}
