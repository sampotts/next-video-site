'use client';

import { useEffect, useRef, useState } from 'react';

import { DM_Sans, JetBrains_Mono } from 'next/font/google';

import * as Sentry from '@sentry/nextjs';
import clsx from 'clsx';

import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--sans' });
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });

// Module scope so it survives the boundary re-mounting after a failed retry,
// but resets on a full page load.
let retryAttempts = 0;

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [retrying, setRetrying] = useState(false);

  // Report to Sentry in its own effect so a reporting failure can never
  // prevent the focus management below from running.
  useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch {
      // Sentry is optional; never re-throw inside the error boundary.
    }
  }, [error]);

  // The boundary replaces the whole document as a DOM mutation, so nothing
  // announces the change. Moving focus to the heading is the one reliable
  // cross-screen-reader announcement trigger.
  useEffect(() => {
    headingRef.current?.focus();
  }, [error]);

  const handleRetry = () => {
    if (retrying) return;
    retryAttempts += 1;
    setRetrying(true);
    reset();
  };

  return (
    <html lang="en" className="overflow-x-clip" style={{ colorScheme: 'dark' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#000000" />
        <title>Something went wrong | next-video</title>
      </head>
      <body
        className={clsx(
          dmSans.variable,
          jetBrainsMono.variable,
          'overflow-x-clip bg-black px-30 font-sans text-18 text-white antialiased accent-pink selection:bg-pink/50 selection:text-white sm:px-50'
        )}
        style={{ minWidth: '20rem', colorScheme: 'dark' }}
      >
        <main id="main" tabIndex={-1} className="mx-auto my-80 max-w-700 focus:outline-none lg:my-100">
          <h1 ref={headingRef} tabIndex={-1} className="mb-40 text-24 font-800 -tracking-2 outline-none md:text-32">
            {retryAttempts > 0 ? 'Something went wrong again' : 'Something went wrong'}
          </h1>
          <p className="mb-40">
            An unexpected error stopped this page from loading. You can try again, or head back to the homepage.
          </p>
          {error.digest ? (
            <p className="mb-40 text-16 text-gray-aa">
              Error ID: <code className="font-mono">{error.digest}</code>
            </p>
          ) : null}
          <p className="mb-40">
            <button
              type="button"
              onClick={handleRetry}
              aria-disabled={retrying}
              className="inline-flex min-h-[3rem] items-center rounded-4 bg-pink px-20 font-700 text-black hover:bg-pink-neon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:transition-colors"
            >
              {retrying ? 'Retrying…' : 'Try again'}
            </button>
          </p>
          <p>
            {/* Plain <a>: the router itself may be what crashed. */}
            <a href="/" className="underline hover:no-underline focus-visible:no-underline">
              Go to the next-video homepage
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
