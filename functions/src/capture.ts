import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from './utils';

export const captureUrl = onCall({ region: 'europe-west1', timeoutSeconds: 60 }, async (request) => {
  requireAuth(request);
  const { url } = request.data as { url: string };

  if (!url?.trim()) throw new Error('URL is required');
  try { new URL(url); } catch { throw new Error('Invalid URL'); }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Forge-Capture/1.0' },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    throw new Error('URL did not return HTML content');
  }

  const html = await response.text();
  return { html };
});
