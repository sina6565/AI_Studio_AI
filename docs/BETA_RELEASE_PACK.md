# SINA AI STUDIO — Closed Beta Release Pack

## Beta positioning

SINA AI STUDIO is opening an invite-led beta for people who want to turn ideas into digital experiments. The beta is for hands-on testing and feedback; it is not a claim that every planned capability is production-ready.

## Persian announcement

**از یک ایده، یک جهان بساز.**

ما در حال آماده‌سازی نسخهٔ بتای SINA AI STUDIO هستیم؛ استودیویی برای تبدیل ایده‌ها به تجربه‌های دیجیتال. در نسخهٔ بتا می‌توانید مسیرهای موجود ساخت محتوا را امتحان کنید، نتیجه‌ها را بررسی کنید و به ما بگویید کجا تجربه بهتر، سریع‌تر و قابل‌اعتمادتر می‌شود.

از تصویر و صدا تا ویدئو و نمونه‌های اولیهٔ جهان‌های بازی، هدف ما این است که مسیر خلاقیت را در یک فضای واحد ساده‌تر کنیم. بعضی قابلیت‌ها هنوز آزمایشی‌اند و ممکن است به تنظیم سرویس‌های هوش مصنوعی یا اتصال اینترنت نیاز داشته باشند. بازخورد دقیق شما مستقیماً به اولویت‌های توسعه کمک می‌کند.

**دعوت به بتا:** اگر آماده‌اید تجربه کنید، خطاها را گزارش دهید و در ساخت نسل بعدی استودیو همراه شوید، به ما بپیوندید.

**SINA AI STUDIO**  
FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE.  
WE DON’T BUILD PRODUCTS. WE BUILD WORLDS.

## English announcement

**Turn one idea into an entire universe.**

SINA AI STUDIO is preparing an invite-led beta for creators who want to turn ideas into digital experiments. Try the workflows that are currently available, explore the results, and tell us where the experience needs to become clearer, faster, and more reliable.

From images and audio to video and early game-world prototypes, our goal is to bring more of the creative journey into one place. This is a beta: some capabilities remain experimental and may depend on configured AI services and an internet connection. Your feedback will help determine what we improve next.

**Join the beta. Create something. Tell us what worked—and what did not.**

SINA AI STUDIO  
FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE.  
WE DON’T BUILD PRODUCTS. WE BUILD WORLDS.

## 45-second promotional film — production script

**Format:** 9:16 primary (mobile), crop-safe 16:9 master; 45 seconds; cinematic, high contrast; no unlicensed music or stock footage.

| Time | Picture / motion | Voice-over | On-screen copy |
|---|---|---|---|
| 0–4s | Absolute black. Fine dust particles appear and begin to orbit. A low, restrained cinematic pulse starts. | “Every world begins with a single idea.” | ONE IDEA. |
| 4–10s | Particles gather into a realistic planet; a luminous fracture travels across its surface. | “What if your ideas could become more than notes on a screen?” | MAKE IT REAL. |
| 10–16s | The planet opens in a controlled burst of light; the SINA S mark resolves from the glow. | “Welcome to SINA AI STUDIO.” | SINA AI STUDIO |
| 16–28s | Six distinct worlds orbit the logo: Games, Websites, Videos, Audio, Characters, 3D Assets. Use actual product UI or clearly labelled concept visuals; do not present mock screens as working features. | “Explore images, sound, motion, characters, and early game-world concepts—all from one creative starting point.” | SIX WORLDS. ONE STUDIO. |
| 28–36s | Show authentic recordings of the current web app: landing page, sign-in, Studio form, job status and a real successful result. Only include flows verified in the deployed beta. | “We’re inviting our first community of testers to try it, challenge it, and help shape what comes next.” | INVITE-LED BETA |
| 36–42s | A creator enters a prompt; the output appears only if a real successful capture is available. Otherwise use an explicitly conceptual animation. | “Your imagination sets the direction. Your feedback helps build the future.” | CREATE. TEST. SHAPE WHAT’S NEXT. |
| 42–45s | Logo on black with restrained cyan / violet / gold glow. | “SINA AI STUDIO. We don’t build products. We build worlds.” | JOIN THE BETA · [insert verified launch URL] |

### Sound and edit notes

- Build from near-silence into a cinematic rise; use a properly licensed or original instrumental bed.
- Keep UI text large and legible on mobile; add Persian subtitles and an English-captioned export.
- Avoid claims such as “unlimited,” “production-ready,” “fully playable games,” or “all AI tools work” unless verified.
- Replace the bracketed URL only after the current deployment has been smoke-tested. Never reuse an old SnapDeploy URL without verification.

## Beta tester checklist

1. Open the verified beta URL on a phone and desktop.
2. Create an account and sign in; confirm invalid credentials fail safely.
3. Open Studio and test only the generation types currently enabled in the environment.
4. Confirm each accepted request gets a job ID and a truthful status.
5. Open Jobs and check that a result, failure, or provider-unavailable state is understandable.
6. Try a blank prompt and an obviously invalid parameter; the app should reject it without creating a job.
7. Confirm one account cannot read or cancel another account's jobs.
8. Report the device/browser, steps, expected result, actual result, and a screenshot with personal data hidden.
9. Do not paste passwords, API keys, private prompts, or personal information into public issue threads.

## Release gate — must be checked before inviting the wider group

- [ ] The live URL is the current deployment and /health responds successfully.
- [ ] Register, login, logout, and token expiry behave correctly.
- [ ] MongoDB Atlas and Redis are configured privately with least-privilege credentials; no admin database ports are public.
- [ ] Real AI provider credentials are configured only in deployment secrets; sample files contain no usable secrets.
- [ ] Image, video, audio, and speech are tested end-to-end individually; unavailable provider states do not look like successful generations.
- [ ] The web app works on a common Android phone and desktop browser; Persian RTL and English LTR are readable.
- [ ] Jobs are isolated by authenticated user; generation payload validation and rate limits are active.
- [ ] Gitleaks, backend/frontend CI, build, and tests pass on the exact release commit.
- [ ] Backups, error logs, and a rollback path are confirmed.
- [ ] The promotion film uses authentic, verified product captures and a current URL.

A green source-code scan or CI run alone does not verify production database settings, third-party provider credentials, or a live deployed user journey.
