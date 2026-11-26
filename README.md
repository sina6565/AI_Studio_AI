<p align="center">
  <img src="frontend/public/assets/logo-sina.png" alt="SINA AI STUDIO logo" width="180" />
</p>

<h1 align="center">SINA AI STUDIO</h1>

<p align="center">
  <strong>FROM A SINGLE IDEA TO AN ENTIRE UNIVERSE</strong><br/>
  یک درخواست؛ هماهنگی هوشمند؛ خروجی یکپارچه در یک پلتفرم
</p>

**SINA AI STUDIO یک پلتفرم جامع و مستقل هوش مصنوعی برای تبدیل ایده‌ها و درخواست‌های کاربران به محصولات و خروجی‌های دیجیتال است.**

کاربر درخواست خود را به SINA می‌دهد؛ پلتفرم با تکیه بر Orchestrator و Agentهای تخصصی، مراحل موردنیاز را برنامه‌ریزی و هماهنگ می‌کند تا فرایند ساخت و تولید در یک محیط یکپارچه انجام شود. هدف SINA این است که کاربر برای رسیدن به نتیجه، مجبور به جابه‌جایی میان ابزارهای جداگانه و اتصال دستی مراحل مختلف نباشد.

SINA AI STUDIO با چشم‌انداز یک **AI Super-Platform** در حال توسعه است؛ بستری برای ساخت و ترکیب خروجی‌های چندرسانه‌ای و محصولات نرم‌افزاری، از یک درخواست ساده تا یک پروژه کامل.

**حوزه‌های اصلی محصول**

- متن و ایده‌پردازی
- تصویر و دارایی‌های بصری
- ویدئو، انیمیشن و موشن‌گرافیک
- صدا، موسیقی و گفتار
- شخصیت‌ها و محیط‌های سه‌بعدی
- ساخت وب‌سایت و اپلیکیشن
- ساخت بازی‌های دوبعدی و سه‌بعدی
- مدیریت پروژه‌ها، وظایف و خروجی‌ها

قابلیت‌ها به‌صورت مرحله‌ای توسعه می‌یابند و وضعیت اجرایی هر بخش تابع پیاده‌سازی و تأیید آن در محیط واقعی است.


🆘 Support
For issues, questions, or contributions:

Check Troubleshooting
Review existing GitHub Issues
Create new issue with details
📄 License
Not specified

📊 Current Status
✅ Core Express.js backend setup
✅ Authentication framework
✅ Database models and connection
✅ Agnes AI provider integration
✅ Content generation endpoints (Image, Video, Audio, Text-to-Speech)
✅ Security middleware (helmet, CORS, rate limiting)
✅ Error handling and logging
⏳ Frontend Web UI
⏳ Mobile app
⏳ Job orchestration system
⏳ Game creation workflows
⏳ Advanced provider routing
⏳ Production deployment configuration
🗓️ Roadmap to Release
✅ Core API foundation with content generation
Web frontend UI development
Mobile app development
Job queue & orchestration system
Game creation workflows
Advanced provider selection & routing
Testing & quality assurance
Performance optimization
Security audit
Production deployment & release
Version: 1.0.0
Last Updated: 2026-09-09
Status: Core Features Implemented - Production Development Phase
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





Content Generation (via Agnes AI)
Image Generation: Generate high-quality images from text prompts
POST /api/v1/generate/image - Generate images (512x512, 1024x1024, 1024x768)
Configurable quality (standard, high, ultra)
Video Generation: Create videos from text descriptions
POST /api/v1/generate/video - Generate videos with customizable duration and FPS
Async processing with status tracking
Audio Generation: Generate audio content from prompts
POST /api/v1/generate/audio - Generate audio from text prompts
Multiple voice options and durations
Text-to-Speech: Convert text to natural speech
POST /api/v1/generate/speech - Persian (Farsi) and English support
Multiple voice styles
Unified User Experience
Single platform identity (providers are transparent infrastructure)
Simple creation workflow: request → automatic routing → result
Support for complex multi-step workflows (e.g., game generation)
Real-time progress tracking
Project management and content library
Extensible Architecture
Modular provider system for adding new AI services
Agnes AI fully integrated as first provider
Clear provider interface for future integrations (OpenAI, Stability AI, etc.)
Automatic provider selection based on capability and constraints
Production-Ready
Asynchronous job processing
Comprehensive error handling with retries
Structured logging and monitoring
Input validation and sanitization
Rate limiting and quota management
Audit trails for all operations
Security First
All credentials via environment variables
No hardcoded secrets
Secure sandbox execution
Input validation on all endpoints
Authentication & authorization
Data encryption support
Game Creation First-Class
Dedicated game project workflows
Multi-step generation (concept → design → assets → scenes → code → build)
Scene and level management
Character and animation support
Audio integration
Validation and build system
Internationalization
Persian (Farsi) and English support
Full RTL (Right-to-Left) support
Localized UI for both web and mobile
Culturally appropriate defaults
📚 Documentation
Architecture Overview - Detailed system design
API Documentation - REST API reference
Provider Integration - Adding new AI providers
Sandbox System - Secure execution environment
Game Creation - Game platform capabilities
Deployment Guide - Production deployment
Development Guide - Local development
Security Guide - Security practices
🔌 Providers
Currently Integrated
Agnes AI - Full production integration with all capabilities
Image generation (agnes-image-2.1-flash)
Video generation (agnes-video-2.0)
Audio generation (agnes-audio-2.0)
Text-to-speech with Persian support
Planned
OpenAI (GPT-4, DALL-E, Whisper)
Stability AI (Stable Diffusion)
Replicate (Multi-provider marketplace)
🎮 Game Creation Features
Game Design Generation: AI-assisted game concept and design
Character Generation: Procedural character creation
Level Design: Automated level generation
Asset Generation: 3D models, sprites, animations
Script Generation: Game logic and behavior code
Audio Integration: Background music and sound effects
Build & Export: Compile to multiple game engines
Project Management: Version control and iterations
