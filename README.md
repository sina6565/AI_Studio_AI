# SINA AI STUDIO

**From a single idea to an entire universe.**

SINA AI STUDIO is an AI creation platform designed to help people turn an idea into a complete digital project. Instead of using disconnected tools for every step, users work in one studio to plan a project, create its content and assets, build websites or game environments, and manage the resulting files and tasks.

The platform brings multiple AI capabilities together behind one product experience. A user may start with an idea, create the images, text, audio or other assets it needs, and use those outputs in a website or game project. The long-term goal is a connected creative workspace—not simply a collection of model APIs or chatbots.

**خلاصه فارسی:** سینا AI استودیو یک پلتفرم ساخت و توسعه پروژه با هوش مصنوعی است. کاربر ایده‌اش را وارد می‌کند و در یک محیط واحد، مسیر تبدیل آن به محتوا، تصویر، صدا، ویدئو، وب‌سایت، دارایی سه‌بعدی یا پروژه بازی را دنبال می‌کند. هدف، اتصال این قابلیت‌ها در یک استودیوی یکپارچه است؛ نه صرفاً نمایش چند ابزار هوش مصنوعی کنار هم.

## What users can create

SINA is being developed around these connected creation areas:

- **Text and ideas:** write, refine and structure project content.
- **Images and visual assets:** create visual material for projects.
- **Video and animation:** develop moving visual content.
- **Audio, music and speech:** create or process sound and spoken content, including Persian where a configured provider supports it.
- **Characters and 3D:** develop characters, objects and three-dimensional environments.
- **Websites:** create and preview website projects.
- **Games:** develop game scenes and, progressively, playable 2D and 3D experiences.
- **Projects and jobs:** organize work, follow task status, and access generated outputs.

These are the platform's product areas and development direction. Their availability is not identical today: the implementation notes below distinguish working repository workflows from planned or unverified capabilities.

## How the platform works

A user starts a project or submits a creation request. SINA's application receives the request, identifies the work that needs to happen, and coordinates the relevant capabilities. Longer tasks can run as jobs so the user can follow their status and retrieve the results later.

At a high level:

```text
User idea
   |
SINA Studio (web / mobile)
   |
SINA API and project management
   |
SINA Orchestrator
   |  plans work and coordinates tasks/agents
   v
Provider Pool and tool-access layer
   |  selects permitted AI models, providers and tools
   v
Specialized creation workflows
   |  text / image / audio / video / website / 3D / game
   |
Project files, generated assets and job results
   |
User reviews and continues the project
```

The Orchestrator is the platform's task-coordination brain. Provider management is a separate responsibility: provider selection, quota checks, health, retries and fallback belong in the Provider Pool, not in provider-specific branches inside the Orchestrator. The Provider Pool and MCP Gateway are architectural work in progress; this diagram describes the intended boundary, not a claim that every path has already been migrated.

## What is implemented today

The current repository contains real application code, but it is not yet a finished, production-proven version of every product area.

| Area | Current repository state |
|---|---|
| Web application | React, TypeScript and Vite client |
| Mobile application | React Native client; native release/runtime still requires platform-specific verification |
| API and accounts | Express/TypeScript API with authentication and project/job-related services |
| Task coordination | Existing SINA Orchestrator and provider-routing code |
| Background work | Redis/Bull job processing, with the configured in-process fallback mode |
| Data | MongoDB/Mongoose data layer |
| Provider integration | Provider adapters, including an environment-configured Agnes integration; live behavior depends on credentials and provider availability |
| Game scene creation | Generates scene artwork and a validated scene manifest, then displays it in a standalone HTML viewer. This is not currently a playable game runtime. |
| Website Builder | Generates responsive standalone HTML from templates, with preview, source editing and HTML download. AI-written website content and hosted publishing are not yet established by this workflow. |
| 3D Game Lab | A procedural room workflow targeting Unreal Engine 5, with a Blender preview/review path and a self-hosted UE5 worker contract. A real engine import, playable game, and packaged build have not yet been verified. |

### Important 3D status

The 3D workflow currently prepares a configurable procedural room and a UE5 source-project path. It requires a compatible owner-operated machine with Blender and Unreal Engine 5 installed, plus the required project template. Repository tests cover parts of the worker contract and approval gates; they do **not** prove that a complete playable game has been built or packaged.

### What is not yet proven

Do not interpret a capability name, a successful build, or a passing unit test as proof of a complete live workflow. The following still require direct evidence:

- Live end-to-end generation through configured providers for each modality.
- Production operation of the Provider Pool, quota-aware fallback and all provider routes.
- Secure, end-to-end MCP tool execution through a central SINA gateway.
- Full website publishing to a hosted domain.
- Real Blender execution, UE5 project import, gameplay, and packaged 3D output.
- Native Android/iOS builds and device-level testing.
- Production deployment, operational monitoring, recovery and realistic load testing.

## Core architecture principles

- **SINA owns orchestration.** External models and services may provide capabilities, but they do not replace SINA's task-planning and coordination layer.
- **Provider-independent design.** Product workflows use stable SINA interfaces rather than depending directly on one provider's SDK.
- **One governed provider boundary.** The target architecture routes all production model inference through the Provider Pool. Product features, Agents, workers and API routes must not bypass it.
- **Capability-specific fallback.** Text, image, audio, video and other modalities need compatible fallback policies; one provider order must not be assumed suitable for every task.
- **No surprise spending.** Paid providers and paid infrastructure must remain disabled unless explicitly configured and approved by the project owner.
- **Local and hosted options.** Local runtimes such as Ollama, ComfyUI, Whisper, Piper and FFmpeg can be used where the task and available hardware support them. Hosted providers remain optional and subject to their terms, quotas and configuration.
- **Safe tool access.** Agents should access external tools through a SINA-controlled gateway with authentication, scoped permissions, approvals and audit records.
- **Honest capability claims.** Clearly label each feature as implemented, tested, live-verified, experimental or planned.

**Current scope note:** RAG (including trace indexes, asset indexes, vector databases and `query_rag`) is deferred. It is not part of the active implementation scope and must not become a dependency of the current release work.

## Technology

| Layer | Current repository technology |
|---|---|
| Web | React, TypeScript, Vite |
| Mobile | React Native, TypeScript |
| Backend API | Node.js, Express, TypeScript |
| Data | MongoDB, Mongoose |
| Jobs and queue | Redis, Bull |
| 3D workflow | Blender and Unreal Engine 5 worker integration |
| Testing | Jest, Vitest and configured worker tests |
| CI | GitHub Actions |
| Packaging/deployment | Docker and Docker Compose |

The repository's code, package scripts and environment examples are authoritative. A technology mentioned as a future integration is not necessarily installed or enabled.

## Development priorities

1. Inspect and document the real request paths in the existing TypeScript backend.
2. Implement the mandatory Provider Pool and migrate every production inference path through it.
3. Add server-side quota tracking, safe retries and the approved capability-specific fallback policies.
4. Establish the SINA MCP Gateway and enforce tool permissions and approvals.
5. Complete and verify the main website and 3D game workflows against real acceptance criteria.
6. Run end-to-end tests and record evidence for each user-facing capability before calling it release-ready.

Do not create a parallel Python backend or replace the existing SINA Orchestrator simply to implement these priorities. Adapt the work to the canonical repository after inspecting its actual code.

## Repository and documentation

- **Canonical repository:** [sina6565/AI_Studio_AI](https://github.com/sina6565/AI_Studio_AI)
- **Default branch:** `main`
- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Providers](./docs/PROVIDERS.md)
- [Provider Pool & Fallback Engine design](./docs/PROVIDER_POOL_FALLBACK_ENGINE.md)
- [Security](./docs/SECURITY.md)
- [Development](./docs/DEVELOPMENT.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Website creation](./docs/WEBSITE_CREATION.md)
- [Game scene creation](./docs/GAME_CREATION.md)
- [Unreal Engine 5 room pipeline](./docs/3D_GAME_ROOM_PIPELINE.md)

## Contributing and verification

Use branches and pull requests so changes can be reviewed and traced. Before changing an existing subsystem, inspect its current implementation and tests. For every change, report:

- Exact branch and commit.
- Files changed and why.
- Commands and tests actually run.
- Results, including failures.
- What remains unimplemented or unverified.

Never commit API keys, tokens, private keys or real environment files. Do not claim production readiness from documentation or CI results alone.

## Project status

**SINA AI STUDIO is under active development.** It has an existing web/mobile application and backend foundation, plus early creation workflows for websites, game scenes and procedural 3D rooms. The broader unified AI creation platform is the product goal; completion and live verification of all capabilities remain ongoing work.
