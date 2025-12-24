# Docker Deployment Guide

This guide explains how to deploy the DoAll Service Platform using Docker with custom port configuration.

## Port Configuration

To avoid conflicts, this application uses the following custom ports:

- **Backend API**: `11000` (instead of default 5000)
- **Frontend**: `11100` (instead of default 3000)
- **Redis**: `11200` (instead of default 6379)
- **MongoDB**: `11300` (instead of default 27017)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB free RAM
- At least 5GB free disk space

## Quick Start

### 1. Environment Setup

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- MongoDB URI (if using external DB, otherwise docker-compose will create one)
- Redis URL (if using external Redis, otherwise docker-compose will create one)
- JWT secrets
- Payment gateway credentials (Razorpay)
- Email/SMS credentials (Twilio, SMTP)
- Cloudinary credentials
- Google Maps API key

### 2. Start Services with Docker Compose

Start all services (MongoDB, Redis, Backend API):

```bash
docker-compose up -d
```

This will:

- Create a MongoDB instance on port `11300`
- Create a Redis instance on port `11200`
- Build and start the backend API on port `11000`

### 3. Check Service Status

```bash
docker-compose ps
```

View logs:

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# MongoDB only
docker-compose logs -f mongodb

# Redis only
docker-compose logs -f redis
```

### 4. Access the Application

- **Backend API**: http://localhost:11000
- **Health Check**: http://localhost:11000/health
- **API Documentation**: http://localhost:11000/api/v1

## Docker Commands

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (WARNING: This deletes all data)

```bash
docker-compose down -v
```

### Restart Services

```bash
docker-compose restart
```

### Rebuild Backend

```bash
docker-compose up -d --build backend
```

### View Resource Usage

```bash
docker stats
```

## Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

### 1. Build Production Image

```bash
docker build -t doall-backend:latest .
```

### 2. Use External Databases

Update `.env` with external database URLs:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/service_platform
REDIS_URL=redis://your-redis-host:6379
```

Then start only the backend:

```bash
docker-compose up -d backend
```

### 3. Scale Backend

```bash
docker-compose up -d --scale backend=3
```

## Connecting Frontend

Configure your frontend to connect to the backend:

```env
# In your frontend .env
REACT_APP_API_URL=http://localhost:11000/api/v1
REACT_APP_SOCKET_URL=http://localhost:11000
```

For production:

```env
REACT_APP_API_URL=https://your-api-domain.com/api/v1
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

## Database Management

### Access MongoDB Shell

```bash
docker exec -it doall-mongodb mongosh -u admin -p admin123
```

### MongoDB Backup

```bash
docker exec doall-mongodb mongodump --authenticationDatabase admin \
  -u admin -p admin123 -d service_platform --archive=/tmp/backup.archive

docker cp doall-mongodb:/tmp/backup.archive ./backup-$(date +%Y%m%d).archive
```

### MongoDB Restore

```bash
docker cp ./backup.archive doall-mongodb:/tmp/backup.archive

docker exec doall-mongodb mongorestore --authenticationDatabase admin \
  -u admin -p admin123 --archive=/tmp/backup.archive
```

### Access Redis CLI

```bash
docker exec -it doall-redis redis-cli
```

## Troubleshooting

### Port Already in Use

If ports are already in use, you can change them in `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "12000:11000" # Map to different host port
```

### Container Won't Start

Check logs:

```bash
docker-compose logs backend
```

### MongoDB Connection Issues

Ensure MongoDB is healthy:

```bash
docker-compose ps mongodb
```

Try restarting:

```bash
docker-compose restart mongodb
```

### Redis Connection Issues

Test Redis connection:

```bash
docker exec doall-redis redis-cli ping
```

Should return `PONG`.

### Memory Issues

Increase Docker memory limit in Docker Desktop settings to at least 4GB.

### Permission Issues

On Linux, you may need to fix volume permissions:

```bash
sudo chown -R $USER:$USER ./public ./logs
```

## Security Considerations

### Production Checklist

- [ ] Change default MongoDB credentials
- [ ] Use strong JWT secrets
- [ ] Enable MongoDB authentication
- [ ] Use Redis password
- [ ] Configure firewall rules
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Update Docker images regularly

### Secure MongoDB

Add password to Redis in `docker-compose.yml`:

```yaml
redis:
  command: redis-server --requirepass your_strong_password
  environment:
    REDIS_PASSWORD: your_strong_password
```

Update `REDIS_URL` in `.env`:

```env
REDIS_URL=redis://:your_strong_password@redis:6379
```

## Monitoring

### Container Health

```bash
docker inspect --format='{{.State.Health.Status}}' doall-backend
```

### Resource Usage

```bash
docker stats --no-stream
```

## Advanced Configuration

### Custom Network

Create an external network:

```bash
docker network create doall-external
```

Update `docker-compose.yml`:

```yaml
networks:
  doall-network:
    external: true
    name: doall-external
```

### Reverse Proxy (Nginx)

Example nginx configuration for production:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:11000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:11000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Support

For issues or questions:

- Check logs: `docker-compose logs`
- Review health status: `docker-compose ps`
- Verify port availability: `lsof -i :11000` (macOS/Linux)
