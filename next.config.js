const { withSentryConfig } = require('@sentry/nextjs/config');
const { withNextVideo } = require('next-video/process');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// withNextVideo is async and returns a Promise. Next.js awaits an exported
// Promise, but withSentryConfig does not: handed a Promise it would spread it
// as a plain object and silently drop everything (images, next-video tracing
// and runtime config). Resolve it first, then wrap with Sentry.
module.exports = async () => {
  const config = await withNextVideo(nextConfig);

  return withSentryConfig(config, {
    // Org, project and auth token are read from SENTRY_ORG, SENTRY_PROJECT and
    // SENTRY_AUTH_TOKEN. Without an auth token source maps are simply not uploaded.
    silent: !process.env.CI,
    widenClientFileUpload: true,
    webpack: { treeshake: { removeDebugLogging: true } },
  });
};
