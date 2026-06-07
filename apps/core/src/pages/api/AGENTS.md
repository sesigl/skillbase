# API routes rule

**Do not create API routes (`src/pages/api/`) for Astro page behaviors** (form
submissions, data mutations that render a page response, etc). Use
[Astro Actions](https://docs.astro.build/en/guides/actions/) instead.

API routes are only appropriate for:
- External API endpoints consumed by non-Astro clients
- Webhook receivers
- JSON APIs for third-party integrations

For everything else — form submissions, server-side mutations triggered from
pages, redirects after POST — define an action in `src/actions/index.ts` and
call it from the page.
