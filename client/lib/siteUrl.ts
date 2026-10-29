export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdUrl && vercelProdUrl.trim()) {
    return `https://${vercelProdUrl.trim().replace(/\/+$/, '')}`;
  }

  const vercelPublicUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelPublicUrl && vercelPublicUrl.trim()) {
    return `https://${vercelPublicUrl.trim().replace(/\/+$/, '')}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.trim()) {
    return `https://${vercelUrl.trim().replace(/\/+$/, '')}`;
  }

  return 'https://tasksmanagerweb.vercel.app';
}
