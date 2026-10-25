# Beta Capability Audit — 2026-10-25

This audit distinguishes code paths found in the repository from features proven in a live deployment. A code path is not proof that the configured provider can successfully produce media in production.

## Capability matrix

| Requested area | Code evidence | Current classification | What a tester can honestly verify |
|---|---|---|---|
| Image | Studio has image prompt flow; backend job type and Agnes image provider method exist. | Implemented in code; provider key, reachability, storage URL, and live generation are deployment-dependent. | Submit a prompt, follow the job to completion, open the returned image URL. |
| Video | Studio and Agnes provider method/job type exist. | Implemented as an integration path; live capability depends on Agnes service/account and output URL. Not live-verified. | Submit a short prompt and confirm a real playable video is returned, not just a queued job. |
| Audio | Studio and Agnes provider method/job type exist. | Implemented as an integration path; live capability depends on provider configuration. Not live-verified. | Confirm an actual playable audio file is returned. |
| Speech | Studio calls the speech route; Agnes provider exposes text-to-speech. | Implemented as an integration path; live language support and output are not verified. | Test Persian and English separately; report provider errors and audio playback. |
| Character | Generic job enum/schema exists, but the configured Agnes provider advertises only image, video, audio, and speech capabilities; no dedicated character UI/workflow was verified. | **Not ready as a standalone character-generation feature.** | Do not promise a dedicated character creator. Image prompts can be used as a workaround only if image generation works. |
| Game | GameService creates a manifest and generates one image asset per scene; GameBuild renders a scene-viewer artifact. | **Limited prototype** — scene concept/viewer, not a full playable game engine with runtime logic, collision, controls, or export pipeline verified. | Test scene generation and the viewer artifact; label it a prototype, not a finished game. |
| 3D | Job type/schema vocabulary exists, but configured provider capabilities do not include 3D and no working 3D generation pipeline was verified. | **Not ready.** | Do not invite testers to expect real 3D model generation yet. |
| Projects | Authenticated project list/create/get/update routes and frontend list/create view exist. | Basic project management is implemented; live persistence and cross-account isolation still require smoke testing. Frontend editing workflow is limited. | Create a project, reload, verify it persists and is only visible to its owner. |
| Jobs | Authenticated create/list/stats/get/cancel routes exist and query/list operations are user-scoped. | Job lifecycle UI/API exists; real completion depends on a working provider, storage, and queue configuration. | Create a job, inspect status/progress/result, cancel one, and ensure another account cannot read it. |

## Confirmed implementation risks

1. **Generation response mismatch:** the backend generation endpoints create asynchronous jobs and return a job envelope; the Studio UI previously treated that response as if it already contained image_url / video_url / audio_url. The beta branch now changes Studio to create a job and poll until completion, then render the returned media URL. This change still needs CI and live smoke-test confirmation.
2. **Provider coverage:** the configured Agnes provider advertises image/video/audio/text-to-speech only. Character and 3D must remain marked unavailable until a real provider implementation, capability routing, output storage, and tests are added.
3. **Game scope:** the current game pipeline produces scene art and a scene-viewer artifact. Do not market it as a complete playable game engine.
4. **Live service dependency:** when no provider is registered, the orchestrator returns 503 NO_PROVIDERS. A passing frontend build does not prove the Agnes key, endpoint, account quota, database, or artifact URLs work.
5. **Rate limiting:** the API uses express-rate-limit with the default process-local store. For a multi-instance deployment, use a shared store or enforce limits at the edge; verify registration/login limits specifically.
6. **Browser token storage:** the frontend stores the bearer token in localStorage; this increases exposure if a cross-site scripting flaw exists. Keep dependency scanning, output escaping, CSP, and XSS testing in the release checklist.
7. **Secrets:** sample env files are not proof of production secret safety. Confirm actual deployment secrets are stored only in the deployment secret manager; rotate any real credential discovered in repository history.
8. **Repository visibility:** code visibility and app visibility are separate. Do not share the repository URL with beta testers as if it were the app.

## Release gate for invited testers

- [ ] PR CI passes, including backend tests, frontend type-check/build, and secret scan.
- [ ] Deployed root URL serves the web homepage (not the API JSON health response).
- [ ] Fresh user can register and sign in.
- [ ] One real successful image generation is confirmed end-to-end.
- [ ] Video, audio, and speech are tested individually; only working capabilities are announced.
- [ ] Job polling, failure messages, cancellation, and owner-only access are verified.
- [ ] Projects persist after reload and remain isolated per account.
- [ ] Database backup/recovery and deployment logs are checked.
- [ ] Character and 3D are labelled unavailable unless independently implemented and verified.
- [ ] Game is labelled scene-viewer prototype, not a complete game engine.
- [ ] Confirm a canonical public beta URL and test it from a logged-out browser before sharing.

## Decision

**Do not advertise all nine items as fully operational yet.** The repository supports basic Projects/Jobs and provider integration paths for Image/Video/Audio/Speech. Game is a limited scene-viewer prototype. Character and 3D are not verified/implemented as end-to-end capabilities. No live deployment URL or end-to-end production test is certified by this source-code review.