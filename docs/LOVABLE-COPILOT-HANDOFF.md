# Lovable ↔ GitHub ↔ Copilot Handoff — SINA AI STUDIO

## Purpose

This document defines a safe collaboration workflow for using Lovable as a UI/design assistant while keeping the canonical SINA AI STUDIO source code in this repository.

## Source of truth

- Canonical repository: `sina6565/AI_Studio_AI`.
- The default branch and reviewed feature branches in this repository remain the source of truth for product code.
- Lovable is an optional prototyping/design workspace. It does not own the product architecture, backend, database, provider registry, Orchestrator, or release process.
- Do not create or maintain a second, competing production codebase in Lovable.

## What Copilot should do

When asked to continue work that involves Lovable:

1. Read this document and the current repository instructions before editing.
2. Inspect the existing frontend structure, design system, routes, API clients, and tests. Reuse the current implementation; do not assume a blank project.
3. Treat Lovable output as a design reference or proposed frontend change only. It is not automatically trusted or production-ready.
4. If the user supplies Lovable-generated code, screenshots, a preview URL, or exported assets, inspect them and map them onto the existing SINA frontend. Preserve current routing, authentication, localization, Persian RTL, accessibility, and responsive behavior.
5. Implement accepted changes in this repository on a feature branch, with focused tests. Keep backend and frontend contracts compatible.
6. Do not claim that Copilot can read, control, or synchronize the user's Lovable workspace unless a real, verified integration is available in the current environment. A GitHub API connector is not the same as native Lovable Git Sync.
7. Never overwrite the canonical repository with a Lovable-generated project or replace existing working code with a scaffold.

## Architecture guardrails

- Preserve the existing Express/TypeScript backend, Orchestrator, provider abstractions/registry, jobs, authentication, and persistence architecture.
- Keep local-first providers and provider independence. Optional cloud providers must not become mandatory or incur costs without explicit approval.
- Preserve Agnes integration where it exists; do not introduce Arena-related assets or dependencies.
- Do not remove or disable existing product capabilities to simplify a UI task.
- Do not introduce paid services, paid APIs, or paid dependencies without explicit user approval.
- Do not change secrets, production environment settings, database schemas, or deployment configuration as part of a visual/UI task unless separately justified and approved.

## Lovable handoff contract

For each proposed Lovable design or UI change, record:

- **Goal:** the user-visible problem being solved.
- **Reference:** preview URL, screenshots, exported files, or exact component/code supplied by the user.
- **Affected SINA routes/components:** identify the existing files before editing.
- **Behavior:** loading, empty, error, success, and responsive states.
- **Localization:** EN/FA copy, RTL/LTR behavior, and Persian font handling.
- **API contract:** existing endpoint/request/response used; do not invent backend endpoints.
- **Assets/dependencies:** licenses, source, file sizes, and whether a new dependency is truly necessary.
- **Validation:** relevant unit/component tests, type-check, build, and CI evidence.

If no usable Lovable artifact or verified workspace access is available, ask for the preview URL, screenshots, or exported source. Do not fabricate a design or claim a sync occurred.

## Suggested task prompt for Copilot

> Read `docs/LOVABLE-COPILOT-HANDOFF.md` and `.github/copilot-instructions.md`. Work only in the canonical `sina6565/AI_Studio_AI` repository. First inspect the current implementation and tests. Use the Lovable reference I provide only as a UI/design reference; adapt it to the existing SINA architecture rather than creating a parallel app. Preserve the Orchestrator, provider registry, backend/API contracts, authentication, all existing capabilities, EN/FA localization, and RTL. Make the smallest safe change on a feature branch, run the relevant checks, and report exact files, commit/PR, test results, and anything not verified. Do not deploy, merge, add paid services, or change production configuration without my explicit approval.

## Important limitation

This file gives Copilot repository-side instructions; it does not itself connect Copilot to Lovable. Copilot can use Lovable material only when that material is made available to it (for example, through a preview URL it can access, screenshots, or exported source files), or when a verified Lovable integration is explicitly available.


## Web and mobile visual preview requirement

The user must be able to visually inspect both the SINA website and the mobile experience, not only read code or a technical report.

- Build and maintain a previewable responsive web experience based on the existing SINA frontend. It must be inspectable at desktop, tablet, and mobile viewport sizes.
- Include the actual mobile app screens/flows where they already exist in the repository. If the native mobile app cannot run inside Lovable, provide a clearly labelled browser-based mobile preview of the same approved screens and interactions; do not misrepresent it as a native Android/iOS build.
- The preview must cover the main user journeys and visible states: landing/home, navigation, sign-in entry (without real credential collection in a demo), project/workspace, generation capability entry points, jobs/status, and relevant empty/loading/error states where implemented.
- Reuse real SINA frontend components, assets, typography, localization, and API contracts wherever technically possible. Do not create fake working backend behavior. If an API is unavailable, show a clearly labelled demo/unavailable state.
- Ensure Persian RTL and English LTR layouts are both visually reviewable, with mobile navigation and touch-friendly controls.
- Provide a preview URL or a reproducible local preview command, plus screenshots for desktop and mobile if a hosted Lovable preview cannot be produced.
- Before claiming the preview is ready, run the existing frontend checks and verify the pages render at mobile and desktop widths. Record what was actually tested.

### Copilot task prompt for visual preview

> In addition to the Lovable handoff, make the existing SINA website and mobile experience visually reviewable. Inspect the repository to locate the real web frontend and any mobile app implementation. Prepare a working desktop + mobile-responsive preview using the existing code and components. Do not rebuild the product or fake native app functionality. If Lovable cannot import this existing repository, state that limitation and provide the closest verified preview path (hosted preview or local run command) without creating a competing production codebase. Verify Persian RTL and English LTR, and report the exact preview URL/command and tested screen sizes.
