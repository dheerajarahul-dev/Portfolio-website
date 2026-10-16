export function getSiteUrl(): string | undefined {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL;
  if (!configuredUrl) return undefined;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return undefined;
  }
}