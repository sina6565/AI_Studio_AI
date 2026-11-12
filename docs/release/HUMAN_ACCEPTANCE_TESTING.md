# Controlled Human Acceptance Testing (HAT)

**Product:** SINA AI STUDIO  
**Purpose:** controlled validation before a wider beta or public release  
**Target cohort:** 5–15 invited testers  
**Status:** protocol prepared; no human testing is claimed by this document.

## 1. Entry gate — do not invite testers until all are true

- [ ] A named release candidate is deployed to the intended test environment.
- [ ] The public homepage, `/health`, `/api/v1/health`, and an SPA deep link pass the deployment smoke checks in [the deployment guide](../DEPLOYMENT.md).
- [ ] `node tools/release-smoke.mjs https://<test-host>` passes all checks.
- [ ] The backend readiness endpoint `/health/ready` returns HTTP 200 and reports MongoDB connected.
- [ ] A real end-to-end generation flow has completed using a provider explicitly configured for this test; the resulting asset opens in the client.
- [ ] Test accounts are provisioned with least privilege. No shared administrator account is distributed.
- [ ] Testers receive the scope, known limitations, support contact, test window, and data-handling notice.
- [ ] A rollback owner and a known-good deployment are identified.
- [ ] No paid provider, paid infrastructure, or billing is enabled without explicit owner approval.

A green CI run is necessary but does not satisfy the deployment, provider, or device checks above.

## 2. Cohort and test setup

Invite 5–15 people who can test independently. Include a mix of desktop and mobile browsers; include at least two Persian/RTL users if Persian is in the release scope. Do not recruit more testers until the first group has been triaged.

Before invitations:
1. Record the release commit SHA, deployment identifier, test URL, and test window.
2. Create one unique test account per participant and verify sign-in.
3. Confirm that each account can access only its own projects and jobs.
4. Prepare one disposable project per participant.
5. Confirm the support contact and incident escalation path.
6. Capture baseline screenshots of the deployed desktop and mobile layouts.

Do not ask participants to enter passwords they use elsewhere, payment details, API keys, government identifiers, private documents, or sensitive personal information. Use synthetic prompts and disposable content only.

## 3. Participant scenarios

Each participant should complete the core scenarios below and mark each as Pass, Fail, Blocked, or Not applicable. Ask them to record the exact page, approximate time, device/browser, and steps immediately before a failure.

| ID | Scenario | Expected result |
|---|---|---|
| HAT-01 | Open the site on desktop and mobile | Homepage loads without a blank screen, broken layout, or blocking console error. |
| HAT-02 | Register/sign in and sign out | Clear success/error feedback; session behavior is consistent; no account can view another user's data. |
| HAT-03 | Switch English and Persian | Text changes correctly; English is LTR and Persian is RTL; navigation and forms remain usable. |
| HAT-04 | Navigate to Projects and create a project | Project appears in the list and remains after refresh. |
| HAT-05 | Open Jobs and inspect a job | Status, progress, and failure states are understandable; refresh does not silently lose the job. |
| HAT-06 | Use Website Builder with a short synthetic brief | Generated preview renders in isolation; source/download controls behave as labelled. |
| HAT-07 | Run one configured media-generation workflow | Job completes or returns a clear actionable error; a successful output can be opened/downloaded. |
| HAT-08 | Explore game creation | The UI accurately communicates current scope; do not interpret a scene preview as a complete playable game or packaged 3D build. |
| HAT-09 | Use the app at a narrow mobile viewport | Navigation, forms, prompt controls, and result actions are reachable without horizontal overflow. |
| HAT-10 | Recover from a refresh or temporary network interruption | The user can understand whether work is queued, running, completed, or failed; no duplicate charge or job is silently created. |

Only run HAT-07 when a test provider and its credentials have been explicitly configured for the test environment. Never ask testers to supply provider credentials.

## 4. Feedback and defect classification

Capture feedback without collecting unnecessary personal data.

For each issue record:
- Test ID and anonymized participant code (for example, P03).
- Release SHA, timestamp, device/OS, browser and viewport.
- Scenario ID and concise reproduction steps.
- Expected versus actual behavior.
- Screenshot or screen recording with tokens, email addresses, and personal content redacted.
- Severity and whether the issue is reproducible.

Severity:
- **S0 — Critical:** account/data exposure, secret leakage, unsafe execution, or a release-wide outage. Stop testing and disable the affected path.
- **S1 — Blocker:** core sign-in, project/job ownership, or primary creation workflow is unusable for multiple testers. Do not widen the cohort.
- **S2 — Major:** a key workflow is unreliable or a mobile/RTL path is materially broken. Fix or explicitly remove that path from the test scope before widening.
- **S3 — Minor:** cosmetic defect or non-blocking usability friction. Record and prioritize.

## 5. Exit criteria

The cohort may be considered accepted for a wider beta only when all of the following are evidence-backed:

- [ ] At least 5 invited participants completed the core scenarios; report the actual number, not the invitation count.
- [ ] No open S0 or S1 defects.
- [ ] Every S2 defect is fixed or explicitly accepted by the product owner with a documented workaround and scope impact.
- [ ] Authentication and cross-account isolation checks pass.
- [ ] At least one real configured provider workflow succeeds end-to-end in the test environment.
- [ ] Desktop, mobile viewport, and Persian RTL checks pass for the supported release scope.
- [ ] All participant feedback is triaged and the product owner records a go/no-go decision.
- [ ] A rollback path has been confirmed.

Passing HAT is not equivalent to a security audit, load test, app-store approval, or proof that every advertised provider works.

## 6. Stop conditions

Pause invitations or testing immediately if any participant can access another account's data, a secret appears in the client/logs, generated content executes outside its intended sandbox, the deployment becomes unstable, or an S0/S1 defect is found. Preserve relevant logs, redact sensitive data, notify the owner, and resume only after a documented fix and retest.

## 7. Results record

Copy this block into the release record after the test; do not pre-fill it with assumed results.

- Release commit:
- Deployment ID / URL:
- Test dates:
- Invited:
- Completed:
- Desktop participants:
- Mobile participants:
- Persian/RTL participants:
- Scenario pass/fail/block counts:
- Open S0 / S1 / S2 / S3:
- Provider workflow and provider name:
- Evidence links:
- Product owner decision (Go / No-go):
- Decision date and owner:

**Current evidence state:** protocol only. No participants have been invited or tested as part of this change.
