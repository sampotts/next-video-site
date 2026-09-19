import * as Sentry from '@sentry/nextjs';

type Context = Record<string, string | number | boolean | null | undefined>;

/**
 * Report an error to Sentry from server code, including code that runs while
 * `next build` prerenders pages. During the build the instrumentation hook has
 * not run, so the Sentry client may not be initialised yet; we initialise it on
 * demand and flush before the build worker exits.
 */
export async function reportError(error: unknown, context: Context = {}) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  console.error('[next-video-site]', error, context);

  if (!dsn) return;

  if (!Sentry.getClient()) {
    Sentry.init({ dsn, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV });
  }

  Sentry.withScope((scope) => {
    scope.setTag('phase', process.env.NEXT_PHASE ?? 'runtime');
    scope.setContext('details', context);
    Sentry.captureException(error);
  });

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    await Sentry.flush(2000);
  }
}
