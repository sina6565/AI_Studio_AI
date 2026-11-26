<p align="center">
  <img src="frontend/public/assets/logo-sina.png" alt="SINA AI STUDIO logo" width="180" />
</p>

<h1 align="center">🌌 SINA AI STUDIO</h1>

<p align="center">
  <strong>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</strong><br/>
  <em>One request. Intelligent orchestration. Unified results.</em>
</p>

<p align="center">
  🚀 <strong>AI TECHNOLOGY PLATFORM & RESEARCH-DRIVEN VENTURE ECOSYSTEM</strong>
</p>

---

## 👑 Founder

<p align="center">
  <strong>FOUNDED BY</strong><br/>
  <strong> M. SAFARPOUR </strong><br/>
  <em>Founder of SINA AI STUDIO</em>
</p>

---

## 🌠 About SINA AI STUDIO

**SINA AI STUDIO is a comprehensive and independent AI platform designed to transform user ideas and requests into digital products and creative outputs.**

Users submit a request to SINA. The platform relies on its Orchestrator and specialized Agents to plan and coordinate the required steps, bringing creation and production workflows together in one unified environment. The goal is to eliminate the need to move between disconnected tools or manually connect multiple stages to achieve a result.

SINA AI STUDIO is being developed with the vision of an **AI Super-Platform**: an environment for creating and combining multimedia outputs and software products, from a simple request to a complete project.

## 🪐 Core Product Domains

- ✍️ Text and ideation
- 🖼️ Image generation and visual assets
- 🎬 Video, animation, and motion graphics
- 🎧 Audio, music, and speech
- 🧬 3D characters and environments
- 🌐 Website and application development
- 🎮 2D and 3D game creation
- 📁 Project, task, and output management

> Capabilities are being developed in stages. The execution status of each capability depends on implementation and verification in a real environment.

## ⚙️ Unified Creation Workflow

**One platform. One request. Coordinated execution.**

- 🧠 Intelligent planning and orchestration
- 🤖 Specialized Agent collaboration
- 🔀 Automatic capability-based provider routing
- 🛠️ Multi-step creation workflows
- 📡 Progress and job status tracking
- 🗂️ Project management and content library

## 📊 Project Status

### ✅ Implemented Core Components

- Core Express.js backend setup
- Authentication framework
- Database models and connection
- Agnes AI provider integration
- Content generation endpoints (Image, Video, Audio, Text-to-Speech)
- Security middleware (Helmet, CORS, rate limiting)
- Error handling and logging

### ⏳ Listed Development Areas

- Frontend Web UI
- Mobile app
- Job orchestration system
- Game creation workflows
- Advanced provider routing
- Production deployment configuration

## 🗺️ Roadmap to Release

- [x] Core API foundation with content generation
- [ ] Web frontend UI development
- [ ] Mobile app development
- [ ] Job queue and orchestration system
- [ ] Game creation workflows
- [ ] Advanced provider selection and routing
- [ ] Testing and quality assurance
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment and release

## 🏗️ Repository Architecture

```text
.
├── backend/                    # Express API + Orchestrator + Providers
│   ├── src/
│   │   ├── api/                # REST endpoints and routes
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts     # Authentication routes
│   │   │   │   ├── jobs.ts     # Job management
│   │   │   │   ├── users.ts    # User routes
│   │   │   │   ├── projects.ts # Project management
│   │   │   │   └── generate.ts # Content generation (Studio)
│   │   │   └── middleware/     # Express middleware
│   │   ├── orchestrator/       # Central orchestration engine
│   │   ├── routing/            # Intelligent routing layer
│   │   ├── providers/          # AI provider implementations (Agnes)
│   │   ├── sandbox/            # Secure execution environment
│   │   ├── jobs/               # Job queue and management
│   │   ├── storage/            # Content storage abstraction
│   │   ├── database/           # Database models
│   │   ├── services/            # Business logic services
│   │   ├── config/              # Configuration management
│   │   ├── utils/               # Utilities and helpers
│   │   └── types/               # TypeScript type definitions
│   ├── tests/                   # Test suite
│   ├── docker/                  # Docker configuration
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React Web Application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API client
│   │   ├── store/              # State management
│   │   ├── i18n/               # Localization (Persian/English)
│   │   ├── types/              # TypeScript types
│   │   └── styles/             # Global styles
│   ├── public/                 # Static assets
│   ├── .env.example
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                     # React Native Mobile Application
│   ├── src/
│   │   ├── screens/            # Mobile screens
│   │   ├── components/         # Reusable components
│   │   ├── services/           # Shared API client
│   │   ├── store/              # Shared state management
│   │   ├── navigation/         # Navigation setup
│   │   ├── i18n/               # Shared localization
│   │   └── types/              # Shared types
│   ├── .env.example
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PROVIDERS.md
│   ├── SANDBOX.md
│   ├── GAME_CREATION.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── SECURITY.md
│
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── nginx.conf                  # Reverse proxy configuration
├── .env.example                # Root environment template
├── .gitignore
└── README.md
```

## 🎨 Content Generation

### 🖼️ Image Generation (via Agnes AI)

- Generate high-quality images from text prompts
- `POST /api/v1/generate/image` — Generate images (512x512, 1024x1024, 1024x768)
- Configurable quality: standard, high, ultra

### 🎬 Video Generation

- Create videos from text descriptions
- `POST /api/v1/generate/video` — Generate videos with customizable duration and FPS
- Asynchronous processing with status tracking

### 🎧 Audio Generation

- Generate audio content from prompts
- `POST /api/v1/generate/audio` — Generate audio from text prompts
- Multiple voice options and durations

### 🗣️ Text-to-Speech

- Convert text into natural speech
- `POST /api/v1/generate/speech` — Persian (Farsi) and English support
- Multiple voice styles

## 🧩 Platform Principles

### 🤝 Unified User Experience

- Single platform identity; providers operate as transparent infrastructure
- Simple creation workflow: request → automatic routing → result
- Support for complex multi-step workflows, such as game generation
- Real-time progress tracking
- Project management and content library

### 🔌 Extensible Provider Architecture

- Modular provider system for adding new AI services
- Agnes AI integrated as the first provider
- Clear provider interface for future integrations
- Automatic provider selection based on capabilities and constraints

### 🏭 Production-Oriented Engineering

- Asynchronous job processing
- Error handling with retries
- Structured logging and monitoring
- Input validation and sanitization
- Rate limiting and quota management
- Audit trails for operations

### 🛡️ Security First

- Credentials managed through environment variables
- No hardcoded secrets
- Secure sandbox execution
- Input validation on endpoints
- Authentication and authorization
- Data encryption support

### 🎮 Game Creation as a First-Class Capability

- Dedicated game project workflows
- Multi-step generation: concept → design → assets → scenes → code → build
- Scene and level management
- Character and animation support
- Audio integration
- Validation and build system

### 🌍 Internationalization

- Persian (Farsi) and English support
- Full RTL (Right-to-Left) support
- Localized UI for web and mobile
- Culturally appropriate defaults

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) — Detailed system design
- [API Documentation](docs/API.md) — REST API reference
- [Provider Integration](docs/PROVIDERS.md) — Adding new AI providers
- [Sandbox System](docs/SANDBOX.md) — Secure execution environment
- [Game Creation](docs/GAME_CREATION.md) — Game platform capabilities
- [Deployment Guide](docs/DEPLOYMENT.md) — Production deployment
- [Development Guide](docs/DEVELOPMENT.md) — Local development
- [Security Guide](docs/SECURITY.md) — Security practices

## 🔌 AI Providers

### ✅ Currently Integrated

**Agnes AI** — Listed in this README as the integrated provider.

- Image generation: `agnes-image-2.1-flash`
- Video generation: `agnes-video-2.0`
- Audio generation: `agnes-audio-2.0`
- Text-to-speech with Persian support

### 🧭 Planned Integrations

- OpenAI (GPT-4, DALL·E, Whisper)
- Stability AI (Stable Diffusion)
- Replicate (multi-provider marketplace)

## 🕹️ Game Creation Features

- 🎯 **Game Design Generation:** AI-assisted game concept and design
- 🧑‍🚀 **Character Generation:** Procedural character creation
- 🗺️ **Level Design:** Automated level generation
- 🧱 **Asset Generation:** 3D models, sprites, and animations
- 💻 **Script Generation:** Game logic and behavior code
- 🎼 **Audio Integration:** Background music and sound effects
- 📦 **Build and Export:** Compile to multiple game engines
- 🔁 **Project Management:** Version control and iterations

## 🆘 Support

For issues, questions, or contributions:

1. Check the troubleshooting documentation.
2. Review existing GitHub Issues.
3. Create a new issue with clear details.

## 📄 License

Not specified.

---

<p align="center">
  <strong>🌌 SINA AI STUDIO</strong><br/>
  <em>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</em><br/><br/>
  👑 <strong>Founder: M. Safarpour</strong>
</p>

<sub>Version: 1.0.0 · Last Updated: 2026-09-09 · Status: Core Features Implemented - Production Development Phase</sub>
