# SINA AI STUDIO

<p align="center">
  <strong>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</strong>
</p>

<p align="center">
  <em>Imagine it. Create it. Build the world around it.</em>
</p>

**SINA AI STUDIO is an independent AI creation universe and technology ecosystem—built to bring imagination, intelligence, and engineering together.**

From a single idea, SINA is designed to help create complete digital experiences: visual worlds, films and motion, music and sound, intelligent characters, websites and applications, 2D and 3D games, and interactive environments. These are not disconnected tools gathered under one name; they are creative and technical capabilities being brought together into one evolving ecosystem.

At its core, SINA is building its own orchestration, agent, and technology architecture. It can work with different AI models, engines, and tools while keeping the platform's identity, workflows, projects, and direction under SINA's control. Technologies are components the ecosystem can connect, evaluate, replace, and improve—not the foundation of someone else's product.

## 🌌 The SINA Vision

To make the journey from imagination to realization possible in one connected creative and technological universe: where people can conceive, design, generate, develop, test, and expand ideas into digital products and experiences.

SINA brings together AI-powered creation, software and game development, intelligent agents, and continuous research and innovation. Its ambition is not simply to offer access to AI, but to build an environment in which new things can be made—and the technology behind them can keep evolving.

## ✨ Supported Creative & Technology Domains

- 🖼️ **Image & Visual Creation** — AI-assisted image generation and visual assets
- 🎬 **Video & Motion** — video creation, animation, and motion-oriented workflows
- 🎵 **Audio & Music** — sound, music, and audio production
- 🗣️ **Speech** — speech generation and text-to-speech, including Persian where supported
- 📝 **Text & Ideas** — writing, concepts, planning, and creative development
- 👤 **Characters** — character concepts and digital character assets
- 🧊 **3D Creation** — 3D assets, rooms, environments, and spatial experiences
- 🎮 **Game Creation** — game concepts, scenes, assets, and game-development workflows
- 🌐 **Web & App Creation** — website and software project creation
- 🤖 **Intelligent Agents** — task-oriented agents, orchestration, and tool-assisted execution
- 🔬 **Research & Innovation** — evaluating emerging technologies and integrating validated capabilities

*These are the platform's product domains and development direction. The depth and availability of each workflow depend on its current implementation, configured providers, and runtime environment.*

## 🏗️ Architecture Overview

SINA is built as an extensible platform with its own orchestration and provider-independent product layer.

```text
                 SINA AI STUDIO
          Web Experience / Mobile Experience
                         |
                  Platform API
                         |
              Projects, Users & Jobs
                         |
              SINA Orchestrator
          Planning • Routing • Coordination
                         |
             Capability & Provider Layer
                         |
       AI Models • Creative Engines • Tools
                         |
          Specialized Workers & Services
                         |
          Validation • Storage • Results
                         |
              SINA Projects & History
```

### Core Architecture Principles

- 🧠 **SINA-owned orchestration:** the platform coordinates tasks and capabilities through its own architecture.
- 🔌 **Provider independence:** providers are replaceable resources, selected according to capability, availability, quality, speed, limits, and cost.
- 🏡 **Local-first direction:** support for local and open technologies is a core architectural priority; optional cloud services must not become mandatory dependencies.
- 🧩 **Modular capabilities:** creation domains and provider integrations can evolve without tying the entire platform to one engine.
- ⚙️ **Coordinated execution:** projects, jobs, workers, and results are managed through the platform's existing backend architecture.
- 🛡️ **Controlled execution:** generated or supplied executable content must be handled through appropriate validation and isolation boundaries.

## 🚀 Quick Start

### Prerequisites

- Git
- Node.js and npm versions supported by the repository and its lockfiles
- Docker and Docker Compose for the containerized development environment
- Environment values configured from the relevant example files

### Run with Docker Compose

```bash
git clone https://github.com/sina6565/AI_Studio_AI.git
cd AI_Studio_AI
docker compose up --build
```

Review the environment examples and the [Development Guide](./docs/DEVELOPMENT.md) before starting services. Do not commit real credentials or private environment files.

## 📁 Project Structure

```text
AI_Studio_AI/
├── backend/                 # Express + TypeScript platform API
│   └── src/
│       ├── api/             # API routes and middleware
│       ├── orchestrator/    # Request planning and coordination
│       ├── providers/       # Provider integrations and adapters
│       ├── routing/         # Capability/provider routing
│       ├── jobs/            # Asynchronous job processing
│       ├── sandbox/         # Isolated execution boundaries
│       ├── services/        # Application services
│       ├── storage/         # Storage abstractions
│       ├── database/        # Database models and access
│       └── types/           # Shared backend types
├── frontend/                # React + Vite web experience
├── mobile/                  # React Native mobile application
├── docs/                    # Architecture, API, providers and guides
├── docker-compose.yml       # Development services
├── docker-compose.prod.yml  # Production-oriented services
└── README.md
```

*This is a high-level map of the main project areas; individual modules may evolve as development progresses.*

## 🔑 Key Features

### 🎨 Creative Studio
A unified product direction for image, video, audio, speech, text, character, and 3D creation—bringing multiple creative capabilities into one SINA experience.

### 🌐 Website Builder
A dedicated website-creation workflow with bilingual input, responsive page generation, preview, source editing, and HTML export.

### 🎮 Game & 3D Creation
Separate workflows for game-scene creation and 3D room development. The current 3D Game Lab targets an Unreal Engine 5 workflow and supports procedural room configuration and a review pipeline.

### 🤖 Orchestration & Providers
A platform-owned orchestration layer and modular provider architecture designed to coordinate capabilities while keeping integrations replaceable.

### 📂 Projects & Jobs
Project organization, asynchronous job tracking, and result management across the platform's implemented workflows.

### 🌍 Multilingual Experience
Persian and English product experience, including right-to-left and left-to-right interface support where implemented.

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Provider Integrations](./docs/PROVIDERS.md)
- [Sandbox & Execution](./docs/SANDBOX.md)
- [Game Creation](./docs/GAME_CREATION.md)
- [Website Creation](./docs/WEBSITE_CREATION.md)
- [3D Game Room Pipeline — Unreal Engine 5](./docs/3D_GAME_ROOM_PIPELINE.md)
- [3D Model Benchmark](./docs/3D_MODEL_BENCHMARK.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./docs/SECURITY.md)

## 🔌 Providers & Technology Resources

SINA uses a modular provider layer so capabilities can be connected to suitable engines and services without making the platform dependent on a single vendor.

- **Configured integrations:** provider adapters implemented in the repository, including the current Agnes integration.
- **Local-first technologies:** Ollama, ComfyUI, Whisper, Piper, and FFmpeg are part of the intended local technology direction; each workflow must be verified before being described as active.
- **Optional cloud resources:** external inference and media services may be connected when needed, but they are not the foundation or owner of SINA.

Provider availability depends on configuration, credentials, supported capabilities, and the deployment environment. See [Providers](./docs/PROVIDERS.md).

## 🎮 Game Creation

SINA's game-development direction brings together:

- Game concepts and design workflows
- Scene and environment creation
- Character and asset workflows
- 3D room and spatial environment generation
- Unreal Engine 5-oriented development pipeline
- A future path toward richer interactive gameplay and export workflows

The current implementation includes a scene-generation path and a separate procedural 3D room workflow. A complete arbitrary game-generation and packaged playable-game pipeline remains a development goal, not a blanket claim about current functionality.

## 🔒 Security & Responsible Execution

- Environment-based configuration for credentials
- Input validation and controlled API access
- Authentication and authorization in supported application flows
- Isolation boundaries for executable content
- Careful handling of provider credentials and user project data

See the [Security Guide](./docs/SECURITY.md) for implementation details.

## 🚀 Deployment

SINA includes Docker-based development and production-oriented deployment configurations.

- Review the relevant environment examples.
- Configure database, queue, authentication, and provider settings for the target environment.
- Follow the [Deployment Guide](./docs/DEPLOYMENT.md).
- Verify the deployed services and configured capabilities before announcing a release.

## 🧰 Technology Stack

| Area | Technology |
|---|---|
| Web | React, TypeScript, Vite |
| Mobile | React Native, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Queue | Redis, Bull |
| AI integration | Modular provider adapters and orchestration |
| 3D pipeline | Blender workflow and Unreal Engine 5 worker integration |
| Containers | Docker, Docker Compose |
| CI | GitHub Actions |

## 🤝 Contributing

SINA AI STUDIO is developed as a modular, evolving platform.

1. Understand the existing architecture before changing it.
2. Preserve working capabilities and established interfaces.
3. Keep provider integrations modular and optional where appropriate.
4. Add or update tests for implementation changes.
5. Document meaningful changes and verified behavior.

## 📝 Environment Configuration

Use the repository's `.env.example` files and configuration documentation as the source of truth for environment variable names and required values.

Never commit API keys, passwords, tokens, or private environment files.

## 📊 Current Status

**SINA AI STUDIO is under active development.**

The repository contains a working foundation for the web and mobile experiences, backend API, orchestration and provider layers, project/job workflows, website creation, game-scene creation, and a procedural 3D room pipeline.

The broader creative ecosystem—including deeper agent capabilities, expanded local-first engines, richer 3D/game workflows, and additional creation domains—is being developed and validated incrementally.

## 🗺️ Roadmap

- Expand the SINA orchestration and intelligent-agent architecture.
- Strengthen local-first model and creative-engine integration.
- Advance image, video, audio, speech, and animation workflows.
- Develop richer website and application creation capabilities.
- Extend 3D environments, characters, and Unreal Engine 5 workflows.
- Advance interactive game creation and playable output.
- Improve project continuity, collaboration, and asset management.
- Establish SINA Nexus as a research and technology-validation engine.
- Prepare the platform for broader release through verified end-to-end workflows.

---

## © Ownership

**Project Owner & Exclusive Rights Holder: Sina M. Safarpour**

**© SINA AI STUDIO. All rights reserved.**

---

**Version:** 1.0.0  
**Last Updated:** 2026-11-15  
**Status:** Active Development
