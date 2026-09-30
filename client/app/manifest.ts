import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TasksManager — High-Performance Task & Escalation Platform',
    short_name: 'TasksManager',
    description: 'Modern, agile task management with intelligent AI task parsing, automatic multi-tier escalation thresholds, and client follow-ups.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#00ff88',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
