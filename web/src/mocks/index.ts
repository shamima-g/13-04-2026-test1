/**
 * MSW initialization — conditionally starts mock service worker.
 * Call this once at the app entry point (e.g., layout.tsx or a client component).
 *
 * Only activates when NEXT_PUBLIC_API_MOCKING=enabled.
 * Tree-shaken in production builds.
 */
export async function initMocks(): Promise<void> {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') {
    return;
  }

  if (typeof window === 'undefined') {
    // Node.js / SSR — use server handler
    const { server } = await import('./server');
    server.listen({ onUnhandledRequest: 'bypass' });
    return;
  }

  // Browser — use service worker
  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}
