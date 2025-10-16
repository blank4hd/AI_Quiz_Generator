# Changelog

## [2.0.0] - Docker Migration - October 15, 2025

### 🎉 Major Changes

#### Architecture Migration

- **Migrated from Supabase to Docker-based architecture**
  - Removed Supabase Edge Functions dependency
  - Replaced with Express.js backend service
  - Added Python Flask microservice for YouTube transcripts
  - Implemented Nginx reverse proxy

#### New Services

- **Frontend**: React + Vite served by Nginx (port 8080)
- **Backend**: Express.js with Gemini AI integration (port 3001)
- **YouTube Service**: Python Flask with youtube-transcript-api (port 5001)

### ✨ Features Added

- **Take Quiz Mode**: Users can now take quizzes and get instant feedback
- **YouTube Transcript Support**: No API key required for YouTube videos
- **One-Command Deployment**: `./start.sh` or `docker-compose up`
- **Health Checks**: All services have health monitoring
- **Retry Logic**: YouTube service retries failed transcript fetches

### 🔧 Improvements

- **AI Model**: Updated to Gemini 2.5 Flash
- **Error Handling**: Better error messages and logging
- **Performance**: Containerized services with optimized builds
- **Documentation**: Comprehensive deployment guide

### 🗑️ Removed

- **Supabase** folder and all Edge Functions
- **MIGRATION_GUIDE.md** (migration complete)
- **SETUP.md** (legacy setup instructions)
- **YOUTUBE_FEATURE.md** (feature integrated)
- **ENABLE_YOUTUBE_API.md** (no longer needed)

### 📦 Current Structure

```
quiz_generator/
├── backend/              # Express.js API server
├── youtube-service/      # Python Flask transcript service
├── src/                  # React frontend
├── public/               # Static assets
├── docker-compose.yml    # Service orchestration
├── Dockerfile.backend    # Backend container config
├── Dockerfile.frontend   # Frontend container config
├── nginx.conf           # Reverse proxy config
├── start.sh             # Easy startup script
├── README.md            # Main documentation
└── DOCKER_DEPLOYMENT.md # Deployment guide
```

### 🚀 Getting Started

```bash
# 1. Set up environment
cp .env.example .env
# Add your GOOGLE_GEMINI_API_KEY

# 2. Start all services
./start.sh

# 3. Access the app
open http://localhost:8080
```

### 🔄 Breaking Changes

- Environment variables: Only `GOOGLE_GEMINI_API_KEY` is now required
- API endpoints: Changed from `/functions/v1/*` to `/api/*` and `/youtube/*`
- No Supabase CLI required
- No YouTube Data API key required

### 📝 Migration Notes

For existing users:

1. Pull latest changes
2. Run `docker-compose up --build`
3. Update your `.env` file (only Gemini API key needed)
4. Old Supabase setup is no longer needed

### 🙏 Acknowledgments

- Thanks to the Docker and container ecosystem
- youtube-transcript-api for free transcript access
- Google Gemini AI for quiz generation
