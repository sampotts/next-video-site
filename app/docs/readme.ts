import { reportError } from 'app/_lib/report-error';

import { escapeBareJsxTags } from './markdown';

const REPO = 'muxinc/next-video';

export class ReadmeFetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    body: string
  ) {
    super(`Failed to fetch ${REPO} README: HTTP ${status} from ${url}: ${body.slice(0, 200)}`);
    this.name = 'ReadmeFetchError';
  }
}

/**
 * Fetch the upstream README. Returns `null` when GitHub cannot be reached (for
 * example a 429 rate limit on raw.githubusercontent.com) so callers can render
 * a fallback instead of the error body. Failures are reported to Sentry.
 *
 * Set `GITHUB_TOKEN` to fetch through the authenticated GitHub API instead of
 * the anonymous raw endpoint, which has a much higher rate limit and is not
 * shared with other tenants on the same egress IPs.
 */
export async function getReadme(): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const url = token
    ? `https://api.github.com/repos/${REPO}/readme`
    : `https://raw.githubusercontent.com/${REPO}/main/README.md`;

  try {
    const res = await fetch(url, {
      headers: token
        ? {
            Accept: 'application/vnd.github.raw+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          }
        : {},
      next: { revalidate: 900 },
    });
    const body = await res.text();

    if (!res.ok) {
      await reportError(new ReadmeFetchError(res.status, url, body), {
        status: res.status,
        url,
        retryAfter: res.headers.get('retry-after'),
        rateLimitRemaining: res.headers.get('x-ratelimit-remaining'),
      });
      return null;
    }

    return escapeBareJsxTags(body);
  } catch (error) {
    await reportError(error, { url });
    return null;
  }
}
