# Deployment Guide

## Overview

This guide covers deploying OinkerUI to production environments.

## Prerequisites

- Server with Node.js 18+ and Python 3.9+
- Domain name (optional)
- SSL certificate (recommended)
- OpenRouter API key

## Deployment Options

### Option 1: Traditional Server Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3.9 python3.9-venv python3-pip

# Install Git
sudo apt install -y git

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/jeffn0rD/oinkerui.git
cd oinkerui

# Run setup
npm run setup

# Configure environment
cp .env.example .env
nano .env  # Add production values
```

#### 3. Build for Production

```bash
# Build frontend
npm run build

# The frontend build will be in frontend/dist/
```

#### 4. Configure nginx

```nginx
# /etc/nginx/sites-available/oinkerui
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/oinkerui/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Node.js API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Python Tools API
    location /tools {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/oinkerui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Setup SSL

```bash
sudo certbot --nginx -d your-domain.com
```

#### 6. Create systemd Services

**Node.js Backend:**
```ini
# /etc/systemd/system/oinkerui-backend.service
[Unit]
Description=OinkerUI Node.js Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/oinkerui
Environment=NODE_ENV=production
ExecStart=/usr/bin/node backend/src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

**Python Backend:**
```ini
# /etc/systemd/system/oinkerui-python.service
[Unit]
Description=OinkerUI Python Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/oinkerui
ExecStart=/path/to/oinkerui/venv/bin/python backend_python/src/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl enable oinkerui-backend
sudo systemctl enable oinkerui-python
sudo systemctl start oinkerui-backend
sudo systemctl start oinkerui-python
```

### Option 2: Docker Deployment (Future)

Docker support will be added in future phases.

### Option 3: Cloud Platform Deployment

#### Heroku

1. Create Heroku apps
2. Add buildpacks
3. Configure environment variables
4. Deploy

#### AWS

1. Use EC2 for server
2. Use RDS for database (future)
3. Use S3 for static assets
4. Use CloudFront for CDN

#### DigitalOcean

1. Create Droplet
2. Follow traditional server deployment
3. Use managed database (future)

## Environment Configuration

### Production Environment Variables

```env
# Server
NODE_ENV=production
NODE_PORT=3000
PYTHON_PORT=8000
HOST=0.0.0.0

# API
OPENROUTER_API_KEY=your-production-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
API_TIMEOUT=60000

# Workspace
WORKSPACE_ROOT=/var/lib/oinkerui/workspaces
DATA_DIR=/var/lib/oinkerui/data
TEMPLATES_DIR=/var/lib/oinkerui/templates
SANDBOXES_DIR=/var/lib/oinkerui/sandboxes

# Security
SECRET_KEY=generate-strong-random-key
CORS_ORIGINS=https://your-domain.com

# Logging
DEBUG=false
LOG_LEVEL=info
LOG_FORMAT=json
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` to version control
- Use strong, unique values for production
- Rotate secrets regularly

### 2. HTTPS
- Always use HTTPS in production
- Use valid SSL certificates
- Enable HSTS headers

### 3. CORS
- Configure CORS for your domain only
- Don't use wildcard origins in production

### 4. Rate Limiting
- Implement rate limiting (future)
- Use nginx rate limiting

### 5. Input Validation
- Validate all user inputs
- Sanitize data before storage
- Use parameterized queries

### 6. Updates
- Keep dependencies updated
- Monitor security advisories
- Apply patches promptly

## Monitoring

### Logs

**View logs:**
```bash
# Node.js backend
sudo journalctl -u oinkerui-backend -f

# Python backend
sudo journalctl -u oinkerui-python -f

# nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

Monitor these endpoints:
- `http://localhost:3000/health` - Node.js backend
- `http://localhost:8000/health` - Python backend

### Metrics (Future)

- Request latency
- Error rates
- Resource usage
- User activity

## Backup

### Database Backup (Future)

When database is added:
```bash
# Backup
pg_dump oinkerui > backup.sql

# Restore
psql oinkerui < backup.sql
```

### File Backup

```bash
# Backup workspaces
tar -czf workspaces-backup.tar.gz /var/lib/oinkerui/workspaces

# Restore
tar -xzf workspaces-backup.tar.gz -C /var/lib/oinkerui/
```

## Scaling

### Horizontal Scaling (Future)

- Load balancer (nginx/HAProxy)
- Multiple backend instances
- Shared file storage (NFS/S3)
- Database replication

### Vertical Scaling

- Increase server resources
- Optimize code performance
- Add caching layer

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u oinkerui-backend -n 50

# Check status
sudo systemctl status oinkerui-backend

# Restart service
sudo systemctl restart oinkerui-backend
```

### High memory usage

```bash
# Check memory
free -h

# Check process memory
ps aux | grep node

# Restart services
sudo systemctl restart oinkerui-backend
```

### Slow response times

- Check server resources
- Review logs for errors
- Monitor network latency
- Check database queries (future)

## Rollback

### Quick Rollback

```bash
# Stop services
sudo systemctl stop oinkerui-backend
sudo systemctl stop oinkerui-python

# Checkout previous version
git checkout previous-tag

# Rebuild
npm run build

# Restart services
sudo systemctl start oinkerui-backend
sudo systemctl start oinkerui-python
```

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install
cd frontend && npm install
source venv/bin/activate && pip install -r requirements.txt

# Rebuild
npm run build

# Restart services
sudo systemctl restart oinkerui-backend
sudo systemctl restart oinkerui-python
```

### Database Migrations (Future)

When database is added:
```bash
# Run migrations
npm run migrate

# Rollback if needed
npm run migrate:rollback
```

## Performance Optimization

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement caching headers
- Optimize images

### Backend
- Enable response caching
- Use connection pooling
- Optimize database queries
- Implement request queuing

### nginx
```nginx
# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Support

For deployment support:
- Check documentation
- Review logs
- Open GitHub issue
- Contact support

## Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] nginx configured
- [ ] Services running
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Security hardened
- [ ] Documentation updated