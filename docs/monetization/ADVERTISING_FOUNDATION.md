# Advertising-supported free plan

This document defines the proposed monetization boundaries for SINA AI STUDIO. It does not mean an ad provider is connected or revenue is active.

- Keep standard Free/Normal usage free where provider and infrastructure costs allow.
- Use ads to subsidize selected resource-intensive actions; preserve existing free quotas and keep Plus optional.
- A small corner promotional card (after 30 seconds of usable page time, with Visit and Dismiss actions) is separate from a rewarded ad. It must not unlock a feature or count as a completed rewarded view.
- Rewarded feature unlocks require a short-lived, single-use attempt and trusted provider-side completion verification. Dismissal, client-only claims, expired attempts, and replayed callbacks must not grant access.
- If no eligible ad is available, follow an explicit fallback policy; never fake a completion.
- Keep ad-provider code behind an adapter so provider changes do not affect Agnes or the provider-agnostic AI routing architecture.
- Track requests, impressions, starts, verified completions, dismissals, clicks, unlocks, provider-reported revenue, and costs separately. Do not infer revenue from impressions or clicks.
- Protect admin campaign controls, validate advertiser URLs/content, rate-limit event endpoints, protect secrets, minimize tracking, and apply consent requirements where applicable.
- Verify publisher eligibility, geography, payment terms, and policy before connecting a real network. Do not add paid services without approval.
- Preserve existing routes, authentication, jobs, and pricing. Use supported Node.js versions; never use 22.7.0.

Rollout: inspect current access/quota logic, add a provider-neutral contract and tests, implement idempotent reward verification, then integrate an approved provider. Do not claim an integration, test, deployment, or revenue until verified.