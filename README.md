# SINA AI STUDIO

<p align="center">
  <strong>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</strong>
</p>

**An independent AI creation and technology ecosystem for turning ideas into digital worlds, creative works, and real products.**

SINA AI STUDIO brings intelligent creation, media production, software development, game creation, and emerging AI technologies into one connected environment. Its ambition is to make the journey from an idea to a complete digital experience possible—while keeping the platform's identity, orchestration, and technology direction under SINA's control.

## 🎯 Platform Vision

One creative universe across Web and Mobile: imagine, design, create, develop, and bring ideas to life.

### Supported Capabilities

- 🖼️ **Images & Visual Worlds** — image generation and visual assets
- 🎬 **Video & Animation** — video, motion, and animation workflows
- 🎵 **Audio & Music** — sound, music, and audio creation
- 🗣️ **Speech** — text-to-speech and voice capabilities
- 📝 **Text & Ideas** — writing, concepts, and creative development
- 👤 **Characters** — digital character concepts and assets
- 🧊 **3D Creation** — 3D assets, rooms, and environments
- 🎮 **Games** — game scenes, environments, assets, and development workflows
- 🌐 **Web & Apps** — website and software creation
- 🤖 **Intelligent Agents** — task planning, orchestration, and tool-assisted execution
- 🔬 **Research & Innovation** — exploring, testing, and integrating emerging technologies

*Capability availability depends on the implemented workflow and configured runtime or provider. The list describes SINA's product domains, not a claim that every workflow is already production-ready.*

## 🏗️ Architecture Overview

```text
             SINA AI STUDIO
          Web Experience / Mobile
                    |
             Platform API
                    |
        Users / Projects / Jobs
                    |
              Orchestrator
          Planning & Coordination
                    |
          Capability Routing Layer
                    |
       AI Providers / Engines / Tools
                    |
          Workers & Safe Execution
                    |
         Storage / Results / History
```

### Architecture Principles

- **Independent platform identity:** SINA owns the user experience, projects, workflows, and product direction.
- **Provider-agnostic design:** models and services are replaceable resources, not platform owners.
- **Local-first direction:** prioritize local and open technologies; cloud providers remain optional.
- **Modular capabilities:** add and improve creative and development domains without binding the platform to one engine.
- **Orchestrated execution:** coordinate tasks, jobs, providers, and results through the existing SINA architecture.

## 🚀 Quick Start

### Prerequisites

- Git
- Node.js and npm versions supported by the repository
- Docker and Docker Compose
- Environment configuration from the project's example files

### Development Setup

```bash
git clone https://github.com/sina6565/AI_Studio_AI.git
cd AI_Studio_AI
docker compose up --build
```

Configure the required environment variables before starting services. See [Development Guide](./docs/DEVELOPMENT.md). Never commit credentials or private environment files.

## 📁 Project Structure

```text
AI_Studio_AI/
├── backend/
│   └── src/
│       ├── api/routes/           # API route handlers
│       ├── config/               # Runtime configuration
│       ├── database/models/      # MongoDB/Mongoose models
│       ├── game/                 # Game scene and game services
│       ├── game3d/               # Unreal Engine 5 room pipeline
│       ├── orchestrator/         # Task coordination
│       ├── providers/
│       │   ├── agnes/            # Agnes adapter
│       │   └── registry.ts       # Provider registration
│       ├── website/              # Website generation service
│       ├── app.ts                # Express application
│       └── index.ts              # Backend entry point
├── frontend/
│   └── src/
│       ├── components/           # Shared and universe UI
│       ├── pages/                # Web product and landing pages
│       ├── services/             # Frontend API services
│       └── App.tsx               # Web application routes
├── mobile/
│   └── src/
│       ├── screens/              # Mobile screens
│       └── App.tsx               # React Native entry point
├── docs/                         # Product and technical documentation
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

## 🔑 Key Features

### Creative Studio
A connected destination for visual creation, video, animation, audio, speech, text, characters, and 3D workflows.

### Website Builder
A dedicated website workflow with bilingual input, responsive HTML generation, preview, source editing, and HTML export.

### Game & 3D Creation
Game-scene creation and a separate 3D Game Lab for procedural room design, with an Unreal Engine 5-oriented worker pipeline.

### Orchestration & Provider System
The existing SINA Orchestrator and provider-agnostic routing layer coordinate tasks and connect compatible engines and services.

### Projects & Jobs
Project organization, asynchronous job tracking, and result management for supported workflows.

### Web & Mobile Experience
A multilingual product direction for Persian and English, with RTL and LTR interface support.

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Providers](./docs/PROVIDERS.md)
- [Sandbox](./docs/SANDBOX.md)
- [Game Creation](./docs/GAME_CREATION.md)
- [Website Creation](./docs/WEBSITE_CREATION.md)
- [3D Game Room Pipeline — Unreal Engine 5](./docs/3D_GAME_ROOM_PIPELINE.md)
- [3D Model Benchmark](./docs/3D_MODEL_BENCHMARK.md)
- [Development](./docs/DEVELOPMENT.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Security](./docs/SECURITY.md)

## 🔌 Providers

SINA connects capabilities to suitable AI models, engines, and tools through modular adapters.

- **Current integration:** Agnes adapter, enabled through configuration.
- **Local-first technology direction:** Ollama, ComfyUI, Whisper, Piper, and FFmpeg.
- **Optional cloud resources:** may be connected when needed; none should become a mandatory foundation for SINA.

Provider availability depends on implementation, credentials, configuration, and deployment environment. See [Provider Documentation](./docs/PROVIDERS.md).

## 🎮 Game Creation Features

- Game concepts and design workflows
- Scene and environment creation
- Character and asset workflows
- Procedural 3D room creation
- Unreal Engine 5-oriented project pipeline
- Future expansion toward interactive gameplay and game export

The current scene workflow produces provider-backed artwork and a validated scene manifest with a standalone viewer; it is not a complete playable 2D runtime. The 3D Game Lab currently focuses on configurable procedural rooms. A fully playable arbitrary 3D game and packaged export are development goals, not completed claims.

## 🚀 Deployment

SINA includes Docker-based development and production-oriented configurations.

```bash
docker compose up --build
```

For environment setup, services, and deployment guidance, see [Deployment Guide](./docs/DEPLOYMENT.md).

## 📊 Technology Stack

| Area | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Web | React, TypeScript, Vite |
| Mobile | React Native, TypeScript |
| Database | MongoDB, Mongoose |
| Queue | Redis, Bull |
| AI integration | Orchestrator and modular provider adapters |
| 3D pipeline | Blender workflow and Unreal Engine 5 worker integration |
| DevOps | Docker, Docker Compose, GitHub Actions |

## 📝 API Endpoints

The API surface evolves with the implementation. Use [API Documentation](./docs/API.md) and the backend route definitions as the source of truth; this README intentionally does not list unverified endpoints.

## 🤝 Contributing

1. Create a focused feature branch.
2. Preserve the existing architecture and working capabilities.
3. Add or update tests for changed behavior.
4. Run the relevant checks.
5. Submit a pull request with a concise description and verification results.

## 📝 Environment Configuration

Use the repository's `.env.example` files and configuration schema as the source of truth. Keep API keys, passwords, and tokens out of source control.

## 🆘 Support

For development and troubleshooting, start with the [Development Guide](./docs/DEVELOPMENT.md) and the repository's GitHub issues.

## 📄 Ownership

SINA AI STUDIO and its original code, designs, documentation, brand, and assets are proprietary. Commercial use, redistribution, or reuse of proprietary materials requires prior written permission from the rights holder. Third-party components remain subject to their own licenses.

**Project Owner: M. Safarpour**  
**© SINA AI STUDIO. All rights reserved.**

## 📊 Current Status

**Active Development**

The repository includes the web and mobile foundations, Express/TypeScript backend, existing Orchestrator and provider routing, projects and jobs, website creation workflow, game-scene workflow, and procedural 3D room pipeline. Live provider behavior, full native-engine execution, and production release readiness must be verified in their target environments.

## 🗓️ Roadmap to Release

1. Strengthen the core SINA platform and orchestration.
2. Expand intelligent agents and tool integration.
3. Advance local-first AI and creative-engine support.
4. Improve image, video, audio, speech, and animation workflows.
5. Expand website and application creation.
6. Advance 3D worlds, characters, and Unreal Engine 5 workflows.
7. Develop richer playable game creation and export.
8. Strengthen project continuity, testing, and release readiness.

---

**Version:** 1.0.0  
**Status:** Active Development
