# Quiz Generator - AI-Powered Quiz Creation Tool

Generate educational quizzes from documents, text, or YouTube videos using Google Gemini AI.

## ✨ Features

- 📄 **Multiple Input Sources**: Upload PDFs, DOCX, images, paste text, or use YouTube videos
- 🤖 **AI-Powered**: Uses Google Gemini 2.5 Flash for intelligent quiz generation
- 🎯 **Customizable**: Choose question types, difficulty levels, and number of questions
- 📝 **Question Types**: Multiple choice, True/False, Short answer, and Essay questions
- 🔄 **Regenerate**: Don't like a question? Regenerate it instantly
- ➕ **Add More**: Add additional questions on specific topics
- 📤 **Export**: Download quizzes in multiple formats
- 🎥 **YouTube Support**: Two methods for transcript extraction (Python API or Google API)
- 🐳 **Docker Ready**: One-command deployment with Docker Compose
- 🆓 **No YouTube API Required**: Free YouTube transcript extraction available

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd quiz_generator

# 2. Set up environment
cp .env.example .env
# Edit .env and add your Google Gemini API key

# 3. Run the application
./start.sh
# Or manually: docker-compose up --build
```

Access the app at: **http://localhost:8080**

### Manual Setup (Without Docker)

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#development) for detailed instructions.

## 📋 Prerequisites

- **Docker & Docker Compose** (for containerized deployment)
- **Google Gemini API Key** ([Get one free here](https://makersuite.google.com/app/apikey))

OR (for manual setup):

- Node.js 18+
- npm (comes with Node.js)
- Python 3.11+

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User / Browser                      │
│                   http://localhost:8080                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend Container (Nginx)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │   React + TypeScript + Vite                      │   │
│  │   • PDF.js (PDF parsing)                         │   │
│  │   • Tesseract.js (OCR)                           │   │
│  │   • Mammoth (DOCX parsing)                       │   │
│  │   Port: 8080                                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Reverse Proxy Routes:                                  │
│  • /         → Static files                             │
│  • /api/*    → Backend Service                          │
│  • /youtube/* → YouTube Service                         │
└────────────────┬────────────────┬───────────────────────┘
                 │                │
        ┌────────┘                └────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────────┐      ┌──────────────────────────┐
│  Backend Service     │      │  YouTube Service         │
│  (Express.js)        │      │  (Python Flask)          │
│                      │      │                          │
│  • Node.js 20        │      │  • Python 3.11           │
│  • Port: 3001        │      │  • Port: 5001            │
│  • Endpoints:        │      │  • Gunicorn workers      │
│    - /api/generate   │      │  • youtube-transcript-api│
│    - /api/youtube-   │      │                          │
│      transcript      │      │  Endpoints:              │
│    - /api/health     │      │  • /transcript           │
│                      │      │  • /health               │
└─────────┬────────────┘      └───────────┬──────────────┘
          │                               │
          └────────────────┌──────────────┘
                           │ API Calls
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Google Gemini AI 2.5 Flash                  │
│              (AI Quiz Generation)                        │
└──────────────────────────────────────────────────────────┘

Input Sources:
📄 PDF  📝 DOCX  📋 Text  🖼️ Images (OCR)  🎥 YouTube URLs

Docker Network: quiz-network (connects all containers)
```

## 🛠️ Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- PDF.js (PDF parsing)
- Tesseract.js (OCR)
- Mammoth (DOCX parsing)

### Backend

- Express.js
- Google Generative AI SDK
- Node.js 20

### YouTube Service

- Python Flask
- youtube-transcript-api
- Gunicorn

### Infrastructure

- Docker & Docker Compose
- Nginx (reverse proxy)

## 📦 Services

| Service         | Port | Purpose                       |
| --------------- | ---- | ----------------------------- |
| Frontend        | 8080 | Web UI + Reverse Proxy        |
| Backend         | 3001 | Quiz generation API           |
| YouTube Service | 5001 | YouTube transcript extraction |

## 🎯 Usage

1. **Choose Input Method**:

   - Upload File (PDF, DOCX, or Images)
   - Paste Text directly
   - Enter YouTube URL

2. **Configure Quiz**:

   - Number of questions (1-50)
   - Question type (Mixed, MCQ, True/False, Short Answer)
   - Difficulty level (Mixed, Easy, Medium, Hard)

3. **Generate & Customize**:

   - Review generated questions
   - Regenerate individual questions
   - Add more questions on specific topics
   - Edit questions manually

4. **Export**:

   - Download in various formats
   - Share with students
   - Print or use online

5. **Take Quiz**:
   - Click "Take Quiz" to enter quiz-taking mode
   - Answer questions one by one
   - Get instant feedback on your answers
   - View your score and review results

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Docker Compose Configuration

See `docker-compose.yml` for service configuration.

## 📚 Documentation

- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Complete deployment guide
- **[YOUTUBE_SETUP.md](./YOUTUBE_SETUP.md)** - YouTube transcript setup (Python API vs Google API)

## 🧪 Testing

### Test Backend API

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your content here",
    "type": "generate",
    "options": {"count": 5}
  }'
```

### Test YouTube Service

```bash
curl -X POST http://localhost:5001/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up --build

# Clean everything
docker-compose down -v --rmi all
```

## 🔍 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs -f

# Check if ports are available
lsof -i :8080,3001,5001
```

### API key not working

```bash
# Verify environment variable
docker-compose exec backend printenv GOOGLE_GEMINI_API_KEY

# Restart services
docker-compose restart
```

### YouTube transcripts failing

- Ensure video has captions/subtitles
- Try switching between Python API and Google API methods
- Check service logs: `docker-compose logs youtube-service`
- See detailed setup guide: [YOUTUBE_SETUP.md](./YOUTUBE_SETUP.md)
- Some videos may be region-restricted or have disabled transcripts

## 📈 Performance

- **Cold Start**: < 1 second
- **Quiz Generation**: 2-5 seconds (depends on content length)
- **YouTube Transcript**: 1-3 seconds
- **PDF Processing**: 2-10 seconds (depends on file size)

## 🚢 Deployment

### Docker Deployment

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#-production-deployment)

### Cloud Platforms

- AWS ECS
- Google Cloud Run
- DigitalOcean App Platform
- Azure Container Instances
- Heroku (with Docker)

## 🔒 Security

- Environment variables for sensitive data
- CORS configured
- Helmet.js for HTTP headers
- Input validation
- Rate limiting recommended for production

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🙏 Acknowledgments

- Google Gemini AI for quiz generation
- youtube-transcript-api for transcript extraction
- shadcn/ui for UI components
- All open-source contributors

## 📧 Support

For issues and questions:

- Check [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md#-troubleshooting)
- Review logs: `docker-compose logs -f`
- Open an issue on GitHub

---

**Made with ❤️ using Docker, React, and Google Gemini AI**
