# Initial Release Gate — SINA AI STUDIO

This checklist is the release-control record for the first public release. A green unit-test run is not, by itself, a production-readiness claim.

## Verified on the web/mobile UI branch

- [x] Frontend build and TypeScript validation passed in GitHub Actions for the web/mobile UI changes.
- [x] Frontend test suite passed (23 tests) in GitHub Actions.
- [x] Mobile TypeScript validation passed in GitHub Actions.
- [x] Backend build and test job passed in GitHub Actions.
- [x] Repository secret scan passed.
- [x] CI Node runtime aligned to Node 20 LTS for release validation.

## Release blockers — must be closed before declaring the initial release ready

- [ ] Native Android project and APK build are integrated with the current mobile UI branch and produce a downloadable APK artifact.
- [ ] Install and smoke-test the APK on a physical Android device (launch, RTL/Persian, navigation, login, API connectivity).
- [ ] Browser smoke-test the deployed website on desktop and mobile viewport; capture real screenshots.
- [ ] Verify production frontend/API URL, health endpoint, CORS, and required environment variables.
- [ ] Verify MongoDB and Redis connectivity in the target deployment; test restart/recovery behavior.
- [ ] Run at least one real end-to-end generation flow against an explicitly configured provider and verify the resulting asset is accessible from the client.
- [ ] Verify authentication, project/job authorization, and that no test credentials or secrets are present in the release configuration.
- [ ] Record known limitations and a rollback procedure.

## Release policy

- Do not call the product production-ready or publish a release tag while any blocker above remains unchecked.
- Do not enable paid providers, paid infrastructure, or billing as part of this release without explicit owner approval.
- Keep the existing Orchestrator, Provider Registry, Agnes adapter, MongoDB/Mongoose, and Redis/Bull architecture.
- Use Node 20 for the release workflow. Do not pin or deploy Node 22.7.0.
- Merge only after the release blockers have evidence-backed closure and owner approval.

## Current disposition

**Status: release hardening in progress — not yet cleared for the initial public release.**

The current web/mobile UI CI checks are green, but the Android APK, live deployment, physical-device smoke test, and real provider end-to-end flow are not verified by those checks.
