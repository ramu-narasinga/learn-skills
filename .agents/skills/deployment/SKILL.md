---
name: deployment
description: Use when building, deploying, or setting up CI/CD pipelines. Covers platform recommendations, environment variables, build configuration, CDN caching, and preview deployments.
---

# Deployment

## When to use this skill

Use this skill when you need to:
- Deploy the application to production
- Configure CI/CD pipelines
- Set up environment variables for different environments
- Configure CDN caching strategies
- Set up preview deployments for pull requests

## Recommended Platforms

| Platform | Best For | Features |
|----------|---------|----------|
| [Vercel](https://vercel.com/) | Next.js apps, React SPAs | Auto-deploy from Git, edge functions, preview deployments |
| [Netlify](https://www.netlify.com/) | JAMstack, static sites, SPAs | Auto-deploy, serverless functions, form handling |
| [AWS CloudFront](https://aws.amazon.com/cloudfront/) | Enterprise, custom infra | Full control, global CDN, S3 integration |
| [Cloudflare](https://www.cloudflare.com/) | Edge-first apps | Workers, Pages, global CDN, DDoS protection |

## Pre-Deployment Checklist

- [ ] All tests pass (unit, integration, E2E)
- [ ] TypeScript compiles with no errors (`tsc --noEmit`)
- [ ] ESLint passes with no errors
- [ ] Environment variables configured for production
- [ ] Source maps uploaded to Sentry (or error tracking tool)
- [ ] Production API URL configured
- [ ] Build completes successfully

## Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

## Environment Variables

```typescript
// src/config/env.ts
export const env = {
  API_URL: import.meta.env.VITE_API_URL as string,
  APP_URL: import.meta.env.VITE_APP_URL as string,
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN as string,
};
```

### Rules:
- Prefix client-side env vars with `VITE_` (for Vite) or `NEXT_PUBLIC_` (for Next.js)
- Never expose secrets in client-side environment variables
- Use `.env.local` for local development, `.env.production` for production defaults

## CI/CD Pipeline

### Recommended Pipeline Stages

```
1. Install dependencies
2. Lint (ESLint)
3. Type check (tsc --noEmit)
4. Unit & Integration tests (vitest)
5. Build
6. E2E tests (Playwright against preview deployment)
7. Deploy
```

### GitHub Actions Example

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

## Post-Deployment Checklist

- [ ] Verify the deployment is working (smoke test)
- [ ] Check error tracking (Sentry) for new errors
- [ ] Monitor Web Vitals (LCP, FID, CLS)
- [ ] Verify CDN caching is working correctly
- [ ] Test critical user flows in production

## CDN & Caching Strategy

- **Static assets** (JS, CSS, images) — Long-lived cache with content hashing
- **HTML** — Short cache or no-cache (to pick up new deployments)
- **API responses** — Managed by React Query's cache, not CDN

```
# Headers for static assets (Vite adds content hashes)
Cache-Control: public, max-age=31536000, immutable

# Headers for HTML
Cache-Control: no-cache
```

## Preview Deployments

Use preview deployments for pull requests:
- Every PR gets its own deployment URL
- Stakeholders can review changes before merge
- E2E tests run against the preview deployment
- Automatically cleaned up after merge

Vercel and Netlify provide this out of the box.
