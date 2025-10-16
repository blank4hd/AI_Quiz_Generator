# Quiz Generator - Docker Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd quiz_generator

# Create environment file
cp .env.example .env

# Edit .env and add your Google Gemini API key
nano .env
# or
vim .env
```

### 2. Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **YouTube Service**: http://localhost:5001

### 4. Stop the Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## 📦 Architecture

The application consists of 3 Docker containers:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Frontend (nginx:alpine)                                │
│  Port: 8080                                             │
│  - React + Vite + TypeScript                            │
│  - Nginx reverse proxy                                  │
│  - Routes /api → backend:3001                           │
│  - Routes /youtube → youtube-service:5001               │
│                                                         │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────────┐    ┌───────────────────┐
│ Backend           │    │ YouTube Service   │
│ (Node.js)         │    │ (Python Flask)    │
│ Port: 3001        │    │ Port: 5001        │
│ - Express.js      │    │ - Flask API       │
│ - Gemini AI       │    │ - youtube-        │
│ - Quiz generation │    │   transcript-api  │
└───────────────────┘    └───────────────────┘
```

---

## 🛠️ Development

### Running Locally Without Docker

#### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```

#### Terminal 2: YouTube Service
```bash
cd youtube-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Terminal 3: Frontend
```bash
npm install
npm run dev
```

Access: http://localhost:8080

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Docker Compose Override (Optional)

Create `docker-compose.override.yml` for local development:

```yaml
version: '3.8'

services:
  frontend:
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    environment:
      - NODE_ENV=development

  backend:
    volumes:
      - ./backend:/app
    environment:
      - NODE_ENV=development
    command: npm run dev

  youtube-service:
    volumes:
      - ./youtube-service:/app
    environment:
      - FLASK_ENV=development
```

---

## 📊 Health Checks

All services include health checks:

```bash
# Check backend health
curl http://localhost:3001/health

# Check YouTube service health
curl http://localhost:5001/health

# Check frontend (via nginx)
curl http://localhost:8080
```

---

## 🧪 Testing

### Test Backend API

```bash
# Generate quiz
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "The water cycle describes how water evaporates...",
    "type": "generate",
    "options": {
      "count": 5,
      "difficulty": "medium",
      "questionType": "mcq"
    }
  }'
```

### Test YouTube Service

```bash
# Get YouTube transcript
curl -X POST http://localhost:5001/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## 🐳 Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f youtube-service
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Changes

```bash
# Rebuild all services
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Clean Up

```bash
# Remove stopped containers
docker-compose rm

# Remove all (containers, networks, volumes)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

---

## 🚢 Production Deployment

### Using Docker Compose

```bash
# Build for production
docker-compose -f docker-compose.yml build

# Run in production mode
docker-compose -f docker-compose.yml up -d
```

### Environment Variables for Production

```bash
# .env
GOOGLE_GEMINI_API_KEY=your_production_api_key
NODE_ENV=production
FLASK_ENV=production
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Use secrets management (Docker Secrets, Vault, etc.)
- [ ] Enable HTTPS (use nginx-proxy or Traefik)
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

---

## 📱 Deploying to Cloud Platforms

### AWS ECS

```bash
# Tag images
docker tag quiz_generator_frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-frontend
docker tag quiz_generator_backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-backend
docker tag quiz_generator_youtube-service:latest <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-youtube

# Push to ECR
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-frontend
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-backend
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/quiz-youtube
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/<project-id>/quiz-frontend
gcloud builds submit --tag gcr.io/<project-id>/quiz-backend
gcloud builds submit --tag gcr.io/<project-id>/quiz-youtube

# Deploy
gcloud run deploy quiz-frontend --image gcr.io/<project-id>/quiz-frontend
gcloud run deploy quiz-backend --image gcr.io/<project-id>/quiz-backend
gcloud run deploy quiz-youtube --image gcr.io/<project-id>/quiz-youtube
```

### DigitalOcean App Platform

Use the `docker-compose.yml` directly or create app spec:

```yaml
name: quiz-generator
services:
  - name: frontend
    github:
      repo: your-username/quiz_generator
      branch: main
    dockerfile_path: Dockerfile.frontend
    http_port: 8080
    
  - name: backend
    github:
      repo: your-username/quiz_generator
      branch: main
    dockerfile_path: Dockerfile.backend
    http_port: 3001
    envs:
      - key: GOOGLE_GEMINI_API_KEY
        value: ${GOOGLE_GEMINI_API_KEY}
        
  - name: youtube-service
    github:
      repo: your-username/quiz_generator
      branch: main
    dockerfile_path: youtube-service/Dockerfile
    http_port: 5001
```

---

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs <service-name>

# Check container status
docker-compose ps

# Inspect container
docker inspect quiz_generator_<service>_1
```

### Connection refused errors

- Ensure all services are running: `docker-compose ps`
- Check network: `docker network ls`
- Verify ports are not in use: `lsof -i :8080,3001,5001`

### API key not working

- Verify `.env` file exists in root directory
- Check environment variable: `docker-compose exec backend printenv GOOGLE_GEMINI_API_KEY`
- Restart services: `docker-compose restart`

### YouTube transcripts failing

- Check YouTube service logs: `docker-compose logs youtube-service`
- Verify video has captions available
- Test directly: `curl http://localhost:5001/health`

---

## 📈 Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific service
docker stats quiz_generator_backend_1
```

### Logs Management

```bash
# Follow logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > logs.txt
```

---

## 🔄 Updates and Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
npm update

# YouTube service
cd youtube-service
pip install --upgrade -r requirements.txt
```

### Backup and Restore

Currently, the app is stateless (no database), but to backup:

```bash
# Backup environment
cp .env .env.backup

# If you add a database later
docker-compose exec postgres pg_dump -U user database > backup.sql
```

---

## 📞 Support

For issues, please check:
1. Docker and Docker Compose versions
2. Port availability (8080, 3001, 5001)
3. Environment variables set correctly
4. Internet connection for API calls
5. Logs: `docker-compose logs -f`

---

## 📝 License

MIT License - See LICENSE file for details
