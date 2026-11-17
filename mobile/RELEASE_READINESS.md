# SINA AI STUDIO Mobile — Release Readiness Plan

## Release target

Prepare the React Native application for a polished Android-first private beta (5–15 invited users), then a store-ready release. The visual direction is a cinematic, premium glass interface inspired by high-end game launch experiences: deep-space surfaces, restrained cyan/gold/violet lighting, layered translucent panels, confident typography, subtle motion, and a consistent Persian RTL / English LTR experience.

This document is a release gate, not a claim that the app is already release-ready.

## Visual quality bar

- Keep the SINA identity consistent: near-black/navy foundation, cyan as the interaction accent, gold as a premium highlight, and violet/pink only as secondary world accents.
- Use layered glass-like surfaces with restrained borders, depth, soft ambient lighting, and generous spacing. Do not simulate blur with expensive full-screen effects on low-end devices.
- Motion must be purposeful and short: screen transitions, subtle orbital/ambient motion, loading feedback, and press states. Respect Android reduced-motion/accessibility expectations.
- Maintain readable contrast, touch targets, typography scale, and stable layouts on compact Android screens.
- Persian must use true RTL layout and correct number/date treatment; English remains LTR.
- Avoid visual-only controls: every visible action must navigate, submit, refresh, or clearly indicate that it is not yet available.

## Release gates

### P0 — Build and install
- [ ] Add and verify a complete Android native project (Gradle wrapper, settings, app module, manifest, resources).
- [ ] Add the React Native entry point and required Metro/Babel/app configuration.
- [ ] Pin a supported Node/JDK/Android Gradle toolchain and document reproducible setup.
- [ ] Produce a debug APK in CI and install/run it on a physical Android device.
- [ ] Produce a signed release AAB/APK only after signing configuration is safely supplied outside source control.
- [ ] Verify app ID, version name/code, orientation, permissions, network security, and cleartext policy.

### P0 — Backend contract and core flows
- [ ] Map every Studio capability to the exact backend job enum; do not send UI shorthand values.
- [ ] Verify login, registration, token expiry, refresh/session restoration, logout, and unauthorized API behavior.
- [ ] Persist credentials using Android secure storage; never store bearer tokens in plain AsyncStorage or logs.
- [ ] Verify create/list/detail/cancel/retry behavior for jobs where supported by the backend.
- [ ] Verify project create/list/detail and ownership isolation.
- [ ] Verify provider-unavailable, timeout, offline, validation, and server-error states without fake success.
- [ ] Test actual generated output retrieval and preview/download flows for each enabled capability.

### P1 — Product completeness
- [ ] Complete Website, Character, 3D Asset, 3D Game, and Animation mobile flows or clearly label unsupported flows.
- [ ] Add project detail, asset gallery, output metadata, and safe download/share behavior.
- [ ] Add job detail/progress refresh and clear queued/processing/completed/failed states.
- [ ] Add empty, loading, retry, offline, and partial-data states to every screen.
- [ ] Keep mobile feature availability aligned with backend capability/provider health.

### P1 — Design and accessibility
- [ ] Apply the cinematic glass design system consistently to Welcome, Auth, Dashboard, Studio, Jobs, Projects, and detail screens.
- [ ] Add final adaptive launcher icon, monochrome icon where applicable, splash screen, and store screenshots.
- [ ] Verify RTL on every screen, modal, tab, form, list, and status component.
- [ ] Verify font scaling, screen readers, focus order, contrast, and minimum touch target sizes.
- [ ] Profile animation and scrolling on low/mid-range Android devices; avoid frame drops and excessive overdraw.

### P1 — Quality and security
- [ ] Unit tests for API mapping, auth/session handling, and formatting.
- [ ] Integration tests for auth → create job → poll status → retrieve output.
- [ ] End-to-end smoke test on a real Android device for each release-critical journey.
- [ ] Run dependency audit, secret scan, and Android manifest/permission review.
- [ ] Confirm production API base URL uses HTTPS and no development endpoints or secrets are packaged.
- [ ] Test app background/resume, process death, flaky network, and expired sessions.

### P2 — Beta and store packaging
- [ ] Create privacy policy, terms, support contact, data-safety disclosures, and account/data deletion path as applicable.
- [ ] Prepare store description, feature graphics, screenshots, app icon, release notes, and beta invitation copy.
- [ ] Set versioning, signing ownership, key backup, and release artifact retention.
- [ ] Run a 5–15 user closed beta; collect crash reports and structured feedback.
- [ ] Fix blocker/high-severity issues before public rollout; stage rollout and define rollback criteria.

## Current verified baseline (repository main, 2026-11-17 review)

- React Native screens exist for Welcome, Auth, Dashboard, Studio, Jobs, and Projects.
- API service, AuthContext, theme tokens, and Persian/English i18n scaffolding exist.
- The mobile CI job currently type-checks TypeScript; a passing type-check is not an Android build or device test.
- The reviewed `mobile/` tree did not contain `android/`, `ios/`, or the expected React Native root entry/config files. Native packaging is therefore not verified.
- The Studio UI/backend job-type contract requires explicit mapping and end-to-end validation before release.
- Secure credential persistence, store assets, signing, privacy/legal materials, and physical-device QA remain release gates.

## Acceptance rule

Do not label the mobile app “released” or “store-ready” until the P0 gates pass and the release artifact has been installed and smoke-tested on a physical device. Keep beta and production credentials outside Git. No paid service is required by this plan; use existing free CI and local Android tooling where feasible.
