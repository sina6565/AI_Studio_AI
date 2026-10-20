# SINA STUDIO AI — Preorder & Admin: Compatibility Review Handoff

**Status: requirements recovered; production implementation not yet verified in the main repository.**  
**Purpose:** review the existing app and this specification before implementing or merging anything. This document is a handoff/specification, not a claim that the admin system is implemented.

## Source-of-truth documents in Notion

- [Preorder & Admin Dashboard — Consolidated Requirements, Supabase, RLS & Implementation Prompt](https://app.notion.com/p/3fb34835a8af81b28018c501c1bd860d)
- [Builder Prompt — Redesign, Connect & Complete Preorder/Admin System](https://app.notion.com/p/3fb34835a8af8124b3b1d8d0d16b14d8)
- [SINA AI STUDIO — MASTER PROJECT STATUS](https://app.notion.com/p/3fa34835a8af81579a60e590e516b20c)
- [Homepage & Prelaunch — Design, Assets, Tools & Implementation Pack](https://app.notion.com/p/3fa34835a8af81c480bbd8c7805074ac)

## Repository audit snapshot

Repository: `sina6565/AI_Studio_AI`  
Baseline branch: `main`  
Baseline commit inspected: `3526eba8d1774102f55a811b8f7aead981dd2137`

The repository tree currently includes `frontend/src/pages/Dashboard.tsx` and `mobile/src/screens/DashboardScreen.tsx`. The cinematic homepage components are present on the separate branch `feat/cinematic-universe-skeleton`, including `HeroScene.tsx`, `Planet.tsx`, `LogoCore.tsx`, and `EnergyRing.tsx`.

The current `main` tree did **not** show a distinct preorder/admin subsystem by filenames such as `preorder`, `admin`, `founder`, `pricing`, `payment`, or `supabase`. GitHub code searches scoped to this repository for preorder, admin dashboard, and Supabase also returned no matches. This is a bounded repository search, not proof that no related logic exists under differently named files. The existing generic Dashboard is not evidence that the separate preorder/admin system is complete.

## Critical architecture boundary

The Notion specification explicitly treats the preorder/admin system as a separate subsystem and says not to assume it is already integrated into the main AI Studio app. The main app is described as React/Vite + Express with MongoDB/Mongoose and Redis/Bull. The proposed preorder/admin work references Supabase Auth/Postgres. Do **not** introduce Supabase, migrate the main app's database, or duplicate authentication until the current repository, routes, package manifests, environment configuration, and any existing preorder assets are inspected and a compatibility decision is documented.

## Required functionality from Notion

### Public preorder / Founder flow
- Responsive, premium SINA STUDIO AI design consistent with the cinematic brand.
- Validated form for full name, email, phone, and selected plan.
- Distinct Founder/preorder path and clear loading, success, empty, and error states.
- Persist submissions through a real, verified server/database path; never show success if persistence failed.
- Do not promise confirmation emails unless a real provider is configured and tested.
- Do not invent prices, billing periods, launch dates, available slots, buyer counts, or payment status.

### Admin console
- Secure login/logout and session checks; forgot/reset-password flow if supported by the chosen auth architecture.
- Role-based authorization with least privilege: `super_admin`, `admin`, `finance`, `support`, `moderator`.
- Dashboard aggregates, paginated preorder leads, search, Founder view, payment view, authorized status updates, internal notes, user/admin management, settings, and safe CSV export.
- UI hiding is not authorization. Enforce permissions server-side and in database policies.
- Keep approval status separate from payment status. Mark a payment as paid only after trusted provider/webhook/server verification.

### Security and data handling
- Inspect the actual database schema before writing migrations; preserve existing data and make migrations safe to rerun where practical.
- If Supabase is approved and actually configured, apply restrictive RLS policies to sensitive tables and test both allowed and denied actions for anonymous users, ordinary users, and each admin role.
- Never expose service-role credentials, privileged keys, hardcoded passwords, private leads, internal notes, or raw database errors to public clients.
- Never perform privileged Auth admin operations in the browser.
- Validate public submissions on the server, add abuse/rate protection, render user data safely, and mitigate spreadsheet formula injection in CSV exports.
- No database reset/deletion, production configuration changes, public deployment, or paid service provisioning without explicit owner approval.

## Required review and implementation sequence

1. Inspect the full repository tree, current routes, dependencies, frontend entry points, existing Dashboard, environment examples, database models, auth middleware, and any existing preorder assets/files.
2. Check relevant open branches/PRs and identify whether existing work can be reused; do not duplicate the cinematic homepage or existing app features.
3. Determine whether the preorder/admin code exists elsewhere in the repository under different names or only in an external project. State evidence and uncertainty.
4. Compare the Notion requirements against the actual architecture. Recommend whether the subsystem should remain separate or integrate with the current app; explain the auth/database implications before choosing.
5. If implementation is appropriate, work on a dedicated feature branch. Do not commit to `main`, merge, or deploy. Preserve Agnes and the provider-agnostic architecture in the main app.
6. Run the relevant available build/type-check/tests and report exact results. Do not claim functionality that has not been run end-to-end.

## Required report

Return a concise table with:
- Requirement / feature
- Evidence found (exact file path or “Not found in inspected tree”)
- Status: implemented / partial / specification only / blocked
- Compatibility risks or dependencies
- Recommended next action

Also report:
- Branch and commit inspected
- Existing code reused
- Files changed
- Tests actually run and results
- Any missing repository, Supabase, email, or payment access
- Whether a proposed implementation is isolated from main and awaits review

**Do not implement a second homepage or rewrite the main app as part of this review. Do not call this handoff document production code.**
