import type { Metadata } from 'next';
import NotFound from '../not-found';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function StatusPage() {
  return <NotFound />;
}
