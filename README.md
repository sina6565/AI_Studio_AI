# AI Content Creation Platform

A unified, production-grade platform for AI-powered content creation across multiple mediums including images, videos, audio, text, characters, 3D assets, and complete games.

## 🎯 Platform Vision

One unified platform accessible via Web and Mobile applications that allows users to create various types of digital content through a simple, intuitive experience.

### Supported Capabilities

- 🖼️ **Images & Photos**: AI image and photo generation
- 🎬 **Video & Animation**: Video creation and animation generation
- 🎵 **Audio & Music**: Audio and music generation
- 🗣️ **Speech**: Text-to-speech synthesis (Persian & English)
- 📝 **Text**: AI-powered text generation
- 👤 **Characters**: Character design and generation
- 🎮 **3D Assets**: 3D model and asset generation
- 🕹️ **Games**: Complete AI-assisted game creation with scenes, levels, characters, and logic

## 🏗️ Architecture Overview

```
Web Client + Mobile Client
        ↓
   Backend API (Express)
        ↓
   Authentication / Users / Projects
        ↓
      Orchestrator (Multi-step workflows)
        ↓
     Routing Layer (Intelligent provider selection)
        ↓
   AI Provider Layer (Agnes, OpenAI, etc.)
        ↓
   Sandbox (Secure isolated execution)
        ↓
    Storage & Results
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose 20.10+
- Node.js 20+ (for development without Docker)
- Git
- Agnes AI API Key (set via environment variable)

### Development Setup

```bash
# Clone repository
git clone https://github.com/sina6565/AI_Studio_AI.git
cd AI_Studio_AI

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env

# Add your Agnes AI API Key to backend/.env
# AGNES_API_KEY=your_key_here

# Start with Docker Compose
docker-compose up -d

# Access:
# Web App: http://localhost:5173
# API: http://localhost:3000
# API Docs: http://localhost:3000/api/v1/docs
# Health: http://localhost:3000/health
```

### Manual Development Setup

```bash
# Backend
cd backend
npm install
npm run dev  # http://localhost:3000

# Frontend (new terminal)
cd frontend
npm install
npm run dev  # http://localhost:5173

# Mobile (new terminal)
cd mobile
npm install
npm start
```

## 📁 Project Structure

```
.
├── backend/                    # Express API + Orchestrator + Providers
│   ├── src/
│   │   ├── api/               # REST endpoints & routes
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts    # Authentication routes
│   │   │   │   ├── jobs.ts    # Job management
│   │   │   │   ├── users.ts   # User routes
│   │   │   │   ├── projects.ts # Project management
│   │   │   │   └── generate.ts # Content generation (NEW - Studio)
│   │   │   └── middleware/    # Express middleware
│   │   ├── orchestrator/       # Central orchestration engine
│   │   ├── routing/           # Intelligent routing layer
│   │   ├── providers/         # AI provider implementations (Agnes)
│   │   ├── sandbox/           # Secure execution environment
│   │   ├── jobs/              # Job queue and management
│   │   ├── storage/           # Content storage abstraction
│   │   ├── database/          # Database models
│   │   ├── services/          # Business logic services
│   │   ├── config/            # Configuration management
│   │   ├── utils/             # Utilities and helpers
│   │   └── types/             # TypeScript type definitions
│   ├── tests/                 # Test suite
│   ├── docker/                # Docker configuration
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # React Web Application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API client
│   │   ├── store/             # State management
│   │   ├── i18n/              # Localization (Persian/English)
│   │   ├── types/             # TypeScript types
│   │   └── styles/            # Global styles
│   ├── public/                # Static assets
│   ├── .env.example
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                    # React Native Mobile Application
│   ├── src/
│   │   ├── screens/           # Mobile screens
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API client (shared)
│   │   ├── store/             # State management (shared)
│   │   ├── navigation/        # Navigation setup
│   │   ├── i18n/              # Localization (shared)
│   │   └── types/             # Types (shared)
│   ├── .env.example
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PROVIDERS.md
│   ├── SANDBOX.md
│   ├── GAME_CREATION.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── SECURITY.md
│
├── docker-compose.yml         # Development environment
├── docker-compose.prod.yml    # Production environment
├── nginx.conf                 # Reverse proxy configuration
├── .env.example               # Root environment template
├── .gitignore
└── README.md
```

## 🔑 Key Features

### Content Generation (via Agnes AI)
- **Image Generation**: Generate high-quality images from text prompts
  - POST `/api/v1/generate/image` - Generate images (512x512, 1024x1024, 1024x768)
  - Configurable quality (standard, high, ultra)
- **Video Generation**: Create videos from text descriptions
  - POST `/api/v1/generate/video` - Generate videos with customizable duration and FPS
  - Async processing with status tracking
- **Audio Generation**: Generate audio content from prompts
  - POST `/api/v1/generate/audio` - Generate audio from text prompts
  - Multiple voice options and durations
- **Text-to-Speech**: Convert text to natural speech
  - POST `/api/v1/generate/speech` - Persian (Farsi) and English support
  - Multiple voice styles

### Unified User Experience
- Single platform identity (providers are transparent infrastructure)
- Simple creation workflow: request → automatic routing → result
- Support for complex multi-step workflows (e.g., game generation)
- Real-time progress tracking
- Project management and content library

### Extensible Architecture
- Modular provider system for adding new AI services
- Agnes AI fully integrated as first provider
- Clear provider interface for future integrations (OpenAI, Stability AI, etc.)
- Automatic provider selection based on capability and constraints

### Production-Ready
- Asynchronous job processing
- Comprehensive error handling with retries
- Structured logging and monitoring
- Input validation and sanitization
- Rate limiting and quota management
- Audit trails for all operations

### Security First
- All credentials via environment variables
- No hardcoded secrets
- Secure sandbox execution
- Input validation on all endpoints
- Authentication & authorization
- Data encryption support

### Game Creation First-Class
- Dedicated game project workflows
- Multi-step generation (concept → design → assets → scenes → code → build)
- Scene and level management
- Character and animation support
- Audio integration
- Validation and build system

### Internationalization
- Persian (Farsi) and English support
- Full RTL (Right-to-Left) support
- Localized UI for both web and mobile
- Culturally appropriate defaults

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - Detailed system design
- [API Documentation](./docs/API.md) - REST API reference
- [Provider Integration](./docs/PROVIDERS.md) - Adding new AI providers
- [Sandbox System](./docs/SANDBOX.md) - Secure execution environment
- [Game Creation](./docs/GAME_CREATION.md) - Game platform capabilities
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Development Guide](./docs/DEVELOPMENT.md) - Local development
- [Security Guide](./docs/SECURITY.md) - Security practices

## 🔌 Providers

### Currently Integrated
- **Agnes AI** - Full production integration with all capabilities
  - Image generation (agnes-image-2.1-flash)
  - Video generation (agnes-video-2.0)
  - Audio generation (agnes-audio-2.0)
  - Text-to-speech with Persian support

### Planned
- OpenAI (GPT-4, DALL-E, Whisper)
- Stability AI (Stable Diffusion)
- Replicate (Multi-provider marketplace)

## 🎮 Game Creation Features

- **Game Design Generation**: AI-assisted game concept and design
- **Character Generation**: Procedural character creation
- **Level Design**: Automated level generation
- **Asset Generation**: 3D models, sprites, animations
- **Script Generation**: Game logic and behavior code
- **Audio Integration**: Background music and sound effects
- **Build & Export**: Compile to multiple game engines
- **Project Management**: Version control and iterations

## 🔒 Security

- ✅ Environment-based credential management
- ✅ Input validation and sanitization
- ✅ Sandbox execution with resource limits
- ✅ JWT authentication
- ✅ Rate limiting and quota enforcement
- ✅ Audit logging
- ✅ HTTPS/TLS ready
- ✅ Database encryption support

See [Security Guide](./docs/SECURITY.md) for detailed security practices.

## 🚀 Deployment

### Docker Compose (Recommended for Single Server)

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for:
- Environment configuration
- Database setup
- Service startup
- Monitoring setup
- Backup strategies

## 📊 Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Cache/Queue**: Redis + Bull
- **Storage**: S3-compatible (MinIO)
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest
- **HTTP Client**: Axios

### Frontend (Web)
- **Framework**: React 18+
- **Language**: TypeScript
- **Build**: Vite
- **UI**: Material-UI / Shadcn/ui
- **State**: Redux Toolkit
- **HTTP**: Axios
- **i18n**: i18next
- **RTL**: Built-in support

### Mobile
- **Framework**: React Native
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State**: Redux Toolkit (shared)
- **HTTP**: Axios (shared)
- **i18n**: i18next (shared)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (ready)

## 📝 API Endpoints

### Content Generation

```bash
# Generate Image
POST /api/v1/generate/image
Content-Type: application/json

{
  "prompt": "a beautiful sunset over mountains",
  "size": "1024x1024",      # optional: 512x512, 1024x1024, 1024x768
  "quality": "high"          # optional: standard, high, ultra
}

# Generate Video
POST /api/v1/generate/video
{
  "prompt": "a person walking in a forest",
  "duration": 10,           # seconds, 1-120
  "fps": 24                 # frames per second, 1-60
}

# Generate Audio
POST /api/v1/generate/audio
{
  "prompt": "sound of rain falling",
  "voice": "neutral",       # optional voice style
  "duration": 30            # seconds, 1-300
}

# Text to Speech
POST /api/v1/generate/speech
{
  "text": "سلام، خوش‌آمدید",
  "voice": "neutral",       # optional
  "language": "fa"          # fa (Persian) or en (English)
}

# Health Check
GET /health
```

## 🤝 Contributing

1. Create feature branch
2. Implement with tests
3. Ensure linting passes
4. Submit pull request

See [Development Guide](./docs/DEVELOPMENT.md) for details.

## 📝 Environment Configuration

All configuration uses environment variables. See `.env.example` files:

- `backend/.env.example` - Backend services configuration
- `frontend/.env.example` - Frontend API endpoints
- `mobile/.env.example` - Mobile app configuration

**Never commit actual secrets or credentials.**

### Required Environment Variables

```env
# Backend - Required
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=mongodb://localhost:27017/ai-platform
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
BCRYPT_ROUNDS=12

# Agnes AI Provider (Required for content generation)
AGNES_ENABLED=true
AGNES_API_KEY=your_agnes_api_key_here
AGNES_API_URL=https://api.agnesai.co/v1
AGNES_TIMEOUT=300000

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:8081

# Storage
STORAGE_TYPE=local
STORAGE_PATH=/tmp/ai-platform-storage
```

## 🆘 Support

For issues, questions, or contributions:

1. Check [Troubleshooting](./docs/DEVELOPMENT.md#troubleshooting)
2. Review existing [GitHub Issues](https://github.com/sina6565/AI_Studio_AI/issues)
3. Create new issue with details

## 📄 License

Proprietary — all rights reserved. See LICENSE. Third-party dependencies retain their respective licenses.

## 📊 Current Status (as of 2026-10-25)

This status reflects the repository's current implementation roadmap. A checked item means the capability is reported as implemented; it does **not** by itself prove end-to-end testing against live external services.

- ✅ Core Express.js API, authentication framework, database models/connection code, Agnes provider integration, content-generation endpoints, security middleware, error handling, and logging
- ✅ Web UI built with React + Vite; API integration is implemented. Full live-service/end-to-end coverage must be verified separately.
- 🚧 Mobile app: screens and API client are implemented and type-checked; native Android/iOS builds still require platform tooling.
- ✅ Job orchestration code: Bull/Redis queue, retries, statistics, cancellation, and interrupted-job recovery
- ✅ Game creation pipeline and manifest generation; a generated scene viewer is not equivalent to a full gameplay engine
- ✅ Provider-agnostic provider registry and routing
- ✅ GitHub Actions CI has passed on the main branch after the frontend dependency fix (PR #18, commit `725abc5764f9e55f9826b18fe23ae38fa2982679`). This does not establish that every integration or production service has been tested.
- 🚧 Performance profiling and optimization
- 🚧 Security audit and remediation
- 🚧 Production deployment validation and release

## 🗓️ Roadmap to Release

1. ✅ Core API foundation with content generation
2. ✅ Web frontend UI development (React + Vite, API integration implemented; end-to-end verification remains separate)
3. 🚧 Mobile app development (screens and API client implemented and type-checked; a native Android/iOS build needs platform tooling)
4. ✅ Job queue & orchestration system (Bull/Redis, retries, stats, cancellation, interrupted-job recovery)
5. ✅ Game creation workflow (spec validation, per-scene asset generation, game manifest; not a full gameplay engine)
6. ✅ Advanced provider selection & routing (provider-agnostic registry + router)
7. 🚧 Testing & quality assurance (main-branch CI is green; complete integration/live-service coverage still needs verification)
8. 🚧 Performance optimization
9. 🚧 Security audit
10. 🚧 Production deployment & release

## 🎮 Game creation

Game creation is a **composite** job: the orchestrator routes it on the capability
its pipeline needs (`image_generation`) rather than asking one provider to
"create a game".

Submit a game through the existing jobs API:

```bash
POST /api/v1/jobs
Authorization: Bearer <token>

{
  "type": "game_creation",
  "input": {
    "title": "Dungeon of Echoes",
    "description": "A short dungeon-crawling adventure.",
    "genre": "dungeon crawler",
    "artStyle": "pixel art",
    "scenes": [
      { "name": "Entrance", "description": "A mossy stone doorway." }
    ]
  }
}
```

Rules: 1–12 scenes, each with a name and a description; title and description are
required. Invalid input returns `400` naming the offending field. The job is
queued, tracked, cancelled and inspected through the existing job endpoints.

When it completes, `GET /api/v1/jobs/:id` returns the game manifest at
`result.metadata.manifest` (scene graph + one generated asset per scene).

**The manifest is a game definition, not a compiled engine build** —
`playable` is `false` and the declared engine target is `scene-viewer`. A
provider failure fails the job; it is never reported as a success.

### Building a runnable scene viewer

`game_build` takes that definition one step further and renders it into a
**self-contained HTML5 scene viewer**: a single `.html` file with no external
JavaScript or CSS, click-through navigation (buttons, arrow keys, swipe, scene
dots) and one frame per scene.

```bash
POST /api/v1/jobs

{ "type": "game_build", "input": { /* same game spec as above */ } }
```

The input may be either a game spec (assets are generated first) or a
**manifest returned by an earlier `game_creation` job** — in that case the
existing assets are reused and nothing is regenerated.

On completion the job result carries the artifact:

- `result.contentUrl` — a `data:text/html;base64,…` URL, so the viewer needs no
  storage backend to be delivered and can be saved straight from the Jobs page.
- `result.format` — `text/html`.
- `result.metadata.artifact` — `{ filename, format, runtime, navigation,
  sceneCount, gameplayMechanics: false }`.
- `result.metadata.manifest` — the underlying game definition.

**Honest scope:** the viewer is a scene viewer over a game definition. There is
no gameplay simulation, physics or scripting, so `gameplayMechanics` is `false`.
The document is self-contained in its *code*; scene images still load from their
provider URLs, so displaying them needs a network connection.

Both game job types run through the same queue, progress reporting and cancel
path as every other job. Cancellation is checked at each stage boundary, so a
cancel during a multi-scene run stops before the next provider call rather than
being ignored until the pipeline finishes.

### Known limitations

- The main-branch GitHub Actions CI workflow is now running and passed after PR #18
  (commit `725abc5764f9e55f9826b18fe23ae38fa2982679`). Treat that result as CI evidence only;
  live Agnes/provider calls, production database/Redis behavior, native mobile builds, and
  full deployed end-to-end flows must be verified separately.
- Native mobile builds require the Android SDK / Xcode, which are not available here.
  `npm run type-check` and `npm run lint` pass for the mobile app.

---

**Version**: 1.0.0  
**Last Updated**: 2026-10-25  
**Status**: Core Features Implemented - Production Development Phase
