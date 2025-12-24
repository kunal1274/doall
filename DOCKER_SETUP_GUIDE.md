# 🐳 Docker Setup Guide - All Services on 11XXX Ports

## 📊 Port Configuration

| Service  | Port  | Access URL             |
| -------- | ----- | ---------------------- |
| Frontend | 11100 | http://localhost:11100 |
| Backend  | 11000 | http://localhost:11000 |
| Redis    | 11200 | localhost:11200        |
| MongoDB  | 11300 | localhost:11300        |

---

## 🚀 Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

### 2. Check Service Status

```bash
docker-compose ps
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### 4. Stop All Services

```bash
docker-compose down
```

### 5. Stop and Remove Volumes (Fresh Start)

```bash
docker-compose down -v
```

---

## 🔧 Development Workflow

### Option A: Docker Development (Recommended)

```bash
# Start all services in detached mode
docker-compose up -d

# Access the application
# Frontend: http://localhost:11100
# Backend API: http://localhost:11000
```

### Option B: Local Development

```bash
# Terminal 1 - Start Backend
npm start

# Terminal 2 - Start Frontend
cd client
npm run dev
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
│                   (doall-network)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Frontend   │────────▶│   Backend    │            │
│  │   (React)    │         │   (Node.js)  │            │
│  │   :11100     │         │   :11000     │            │
│  └──────────────┘         └──────┬───────┘            │
│                                   │                     │
│                          ┌────────┴────────┐           │
│                          │                 │           │
│                   ┌──────▼─────┐   ┌──────▼─────┐    │
│                   │  MongoDB   │   │   Redis    │    │
│                   │   :11300   │   │   :11200   │    │
│                   └────────────┘   └────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Configuration Files

### docker-compose.yml

Main orchestration file that defines all services.

### Dockerfile (Backend)

Located in root directory - builds the Node.js backend.

### client/Dockerfile (Frontend)

Located in client directory - builds the React frontend with Nginx.

### client/nginx.conf

Nginx configuration for:

- Serving React app
- Proxying API requests to backend
- Handling WebSocket connections

---

## 🔍 Testing

### 1. Health Checks

```bash
# Backend health
curl http://localhost:11000/health

# Frontend (should return HTML)
curl http://localhost:11100
```

### 2. Database Connection

```bash
# Connect to MongoDB
docker exec -it doall-mongodb mongosh -u admin -p admin123

# Connect to Redis
docker exec -it doall-redis redis-cli
```

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose up -d --build
```

### Port Already in Use

```bash
# Find process using port 11100
lsof -i :11100

# Kill the process
kill -9 <PID>
```

### Database Issues

```bash
# Remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Build Issues

```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📦 Production Deployment

### 1. Update Environment Variables

```bash
# Edit .env file
NODE_ENV=production
JWT_SECRET=<generate-new-secret>
```

### 2. Build Production Images

```bash
docker-compose build
```

### 3. Deploy

```bash
docker-compose up -d
```

---

## 🔒 Security Notes

1. **Change Default Credentials**

   - MongoDB: Update admin username/password in docker-compose.yml
   - JWT: Generate new secret in .env

2. **Network Security**

   - All services run in isolated Docker network
   - Only necessary ports exposed to host

3. **Volume Permissions**
   - Data persists in Docker volumes
   - Backup regularly

---

## 📊 Monitoring

### Container Stats

```bash
docker stats
```

### Resource Usage

```bash
docker-compose top
```

### Service Health

```bash
docker inspect doall-frontend | grep Health
docker inspect doall-backend | grep Health
docker inspect doall-mongodb | grep Health
docker inspect doall-redis | grep Health
```

---

## 🎯 Next Steps

1. ✅ Start services: `docker-compose up -d`
2. ✅ Access frontend: http://localhost:11100
3. ✅ Test API: http://localhost:11000/health
4. ✅ Check logs: `docker-compose logs -f`
5. ✅ Run tests: `npm test`

---

## 📚 Additional Resources

- Docker Compose Documentation: https://docs.docker.com/compose/
- Nginx Configuration: https://nginx.org/en/docs/
- Vite Configuration: https://vitejs.dev/config/

---

**Last Updated:** December 24, 2025
