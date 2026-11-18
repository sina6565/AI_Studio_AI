# SINA AI STUDIO

**یک پلتفرم جامع، مستقل و یکپارچه هوش مصنوعی؛ از یک درخواست تا یک خروجی کامل.**

SINA AI STUDIO پلتفرمی جامع و مستقل برای تولید و ساخت محتوای چندرسانه‌ای و محصولات دیجیتال است. کاربر فقط یک پرامپت یا درخواست به SINA می‌دهد؛ پلتفرم باید درخواست را درک و برنامه‌ریزی کند، قابلیت‌ها و Agentهای لازم را هماهنگ سازد و خروجی موردنظر را تحویل دهد.

با یک درخواست، هدف SINA این است که بتواند **متن، صدا، تصویر، ویدئو، انیمیشن، شخصیت سه‌بعدی، وب‌سایت و بازی** تولید کند؛ از یک خروجی مستقل تا پروژه‌ای که چند نوع خروجی را با هم ترکیب می‌کند.

کاربر برای رسیدن به نتیجه نباید مجبور باشد چندین ابزار هوش مصنوعی جداگانه را پیدا کند، بین آن‌ها فایل جابه‌جا کند یا هر مرحله را دستی به ابزار بعدی بسپارد. SINA قرار است این فرایند را در یک پلتفرم واحد مدیریت کند: از فهم درخواست و طراحی مراحل تا تولید، ترکیب، بررسی و تحویل نتیجه.

**وعده محصول:** یک درخواست به SINA بده؛ خروجی موردنیازت را از همان پلتفرم دریافت کن.

این تعریف، چشم‌انداز و هویت محصول است. وضعیت واقعی هر قابلیت در ادامه README شفاف شده است؛ هدف محصول نباید با امکاناتی که هنوز پیاده‌سازی یا در اجرای واقعی تأیید نشده‌اند اشتباه گرفته شود.

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

## How a request becomes a finished result

Every creation starts with one user prompt or request. SINA must turn that request into a coordinated execution plan, run the required work in controlled environments, validate the outputs, and return the result inside the same platform. The user should not have to manually choose and connect a different AI service for every step.

### End-to-end execution flow

```text
1. USER REQUEST
   Prompt, brief, uploaded files, references and desired output
        |
        v
2. SINA APPLICATION / API
   Receive request, authenticate user, check project and permissions,
   save request and create a trackable task/job
        |
        v
3. SINA ORCHESTRATOR — CENTRAL COORDINATION
   Understand intent and requirements
   Break the request into tasks and dependencies
   Build the execution plan and acceptance criteria
        |
        v
4. AGENT SELECTION
   Consult Agent Registry
   Select the required specialist Agent(s)
   Assign responsibilities, tools and task boundaries
        |
        v
5. EXECUTION MANAGER
   Select or provision the appropriate execution environment
   Create an isolated workspace / sandbox when required
   Apply resource limits, scoped permissions and task context
        |
        +-------------------------------+
        |                               |
        v                               v
6A. PROVIDER POOL                 6B. SINA MCP GATEWAY
    Select eligible model/provider     Governed access to approved tools
    Check capability, quota, health,   and external systems
    policy and cost constraints        Apply allowlists, permissions,
    Execute bounded retries/fallback   approvals and audit logging
        |                               |
        +---------------+---------------+
                        |
                        v
7. SPECIALIST AGENT EXECUTION
   Execute the planned steps through the permitted providers and tools
   Examples: text, image, audio, speech, video, animation,
   3D character, website and game workflows
                        |
                        v
8. REVIEW, VALIDATION AND ITERATION
   Check outputs against the request and acceptance criteria
   Detect failures or missing assets
   Orchestrator decides whether to retry, revise, request approval,
   or stop with a clear structured error
                        |
                        v
9. ASSET / PROJECT ASSEMBLY
   Organize files, source materials, generated assets and metadata
   Connect dependent outputs into one coherent project
                        |
                        v
10. DELIVERY TO THE USER
    Present preview, downloadable/exportable outputs and project state
    Keep job status and artifacts available for the next instruction
```

### Responsibility boundaries

- **Orchestrator:** owns intent analysis, task decomposition, planning, dependency coordination, Agent assignment, execution decisions and final task-level review. It does not contain provider-specific routing logic.
- **Agent Registry and Agent Runtime:** identify, select, initialize and run specialist Agents with defined capabilities and permissions. Agents execute assigned work; they do not replace the Orchestrator.
- **Execution Manager and Sandbox:** choose or provision the runtime appropriate to the task, isolate project execution where needed, and enforce filesystem, network, compute and permission boundaries. A sandbox is not automatically required for every request; the environment is selected according to the task's risk and runtime needs.
- **Provider Pool & Fallback Engine:** the single governed path for production model inference. It selects compatible providers/models, checks eligibility and quotas, applies policy and cost limits, executes calls, and manages bounded retries and authorized fallback.
- **SINA MCP Gateway:** the controlled path for Agent access to tools and external systems. It enforces per-task tool allowlists, authentication, scoped permissions, approval for sensitive write actions and audit records.
- **Workers and modality workflows:** perform the actual specialized work—such as media generation, website construction, 3D scene preparation or game building—inside their permitted execution context.
- **Validation and delivery:** check the result, assemble related artifacts, preserve project continuity and return the output to the user.

### Architectural status

This is the target end-to-end architecture and the responsibility model SINA is being built toward. It is not a claim that every stage is already implemented or connected in every modality. The implementation-status section below records what exists in the repository and what still needs integration or live verification. In particular, Provider Pool enforcement, the central MCP Gateway, sandbox orchestration and complete multimodal end-to-end delivery must be verified in code and runtime before being described as production-ready.

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
