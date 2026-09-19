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

module.exports = withSentryConfig(withNextVideo(nextConfig), {
  // Org, project and auth token are read from SENTRY_ORG, SENTRY_PROJECT and
  // SENTRY_AUTH_TOKEN. Without an auth token source maps are simply not uploaded.
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: { treeshake: { removeDebugLogging: true } },
});
