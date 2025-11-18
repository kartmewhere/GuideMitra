# CI/CD Pipeline Documentation

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the GuideMitra project using GitHub Actions and AWS EC2.

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                         │
│                  (Code Push to main/production)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                            │
│                   (Automated Workflow)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Frontend Build  │  │  Backend Test    │                │
│  │  - Install deps  │  │  - Install deps  │                │
│  │  - Build React   │  │  - Syntax check  │                │
│  │  - Create artifact│  │  - Lint code    │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│           └──────────┬──────────┘                           │
│                      ▼                                       │
│           ┌──────────────────────┐                          │
│           │   Deploy to EC2      │                          │
│           │   - Copy files       │                          │
│           │   - Install deps     │                          │
│           │   - Run migrations   │                          │
│           │   - Restart services │                          │
│           │   - Health check     │                          │
│           └──────────┬───────────┘                          │
│                      │                                       │
│                      ▼                                       │
│           ┌──────────────────────┐                          │
│           │   Notify Status      │                          │
│           │   - Success/Failure  │                          │
│           └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 INSTANCE                          │
│                  (Production Environment)                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Nginx) + Backend (PM2) + Database (PostgreSQL)   │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Files

### 1. Main Deployment Workflow
**File**: `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` branch
- Push to `production` branch
- Pull request to `main` branch

**Jobs:**
1. **frontend-build**: Builds React application
2. **backend-test**: Tests backend code
3. **deploy**: Deploys to EC2 (only on main/production)
4. **notify**: Sends deployment status

### 2. Test Workflow
**File**: `.github/workflows/test.yml`

**Triggers:**
- Push to `develop` branch
- Push to `feature/*` branches
- Pull request to `main` or `develop`

**Jobs:**
1. **frontend-test**: Frontend linting and build
2. **backend-test**: Backend syntax and linting
3. **security-audit**: Dependency vulnerability scan

---

## GitHub Secrets Configuration

### Required Secrets

Navigate to: **Repository → Settings → Secrets and variables → Actions**

#### AWS Credentials
```
Name: AWS_ACCESS_KEY_ID
Value: Your AWS access key ID

Name: AWS_SECRET_ACCESS_KEY
Value: Your AWS secret access key

Name: AWS_REGION
Value: us-east-1 (or your region)
```

#### EC2 Connection
```
Name: EC2_HOST
Value: Your EC2 public IP or domain

Name: EC2_USER
Value: ubuntu

Name: EC2_SSH_PRIVATE_KEY
Value: Complete content of your .pem file
```

#### Application Configuration
```
Name: REACT_APP_API_URL
Value: http://your-ec2-ip/api

Name: DATABASE_URL
Value: postgresql://user:password@localhost:5432/guidemitra

Name: JWT_SECRET
Value: Your secure JWT secret

Name: GEMINI_API_KEY
Value: Your Google Gemini API key
```

---

## Deployment Process

### Step-by-Step Flow

#### 1. Code Push
```bash
git add .
git commit -m "Your changes"
git push origin main
```

#### 2. GitHub Actions Triggered
- Workflow starts automatically
- View progress in GitHub Actions tab

#### 3. Frontend Build (Job 1)
```yaml
- Checkout code from repository
- Setup Node.js 18.x
- Install dependencies (npm ci)
- Create .env file with secrets
- Build React app (npm run build)
- Upload build artifact
```

**Duration**: ~2-3 minutes

#### 4. Backend Test (Job 2)
```yaml
- Checkout code from repository
- Setup Node.js 18.x
- Install dependencies (npm ci)
- Check syntax errors
- Run linter (if configured)
```

**Duration**: ~1-2 minutes

#### 5. Deploy to EC2 (Job 3)
```yaml
- Download frontend build artifact
- Configure AWS credentials
- Connect to EC2 via SSH
- Create deployment directories
- Copy frontend files
- Copy backend files
- Install backend dependencies
- Generate Prisma client
- Run database migrations
- Restart PM2 process
- Restart Nginx
- Verify deployment
```

**Duration**: ~3-5 minutes

#### 6. Notify (Job 4)
```yaml
- Check deployment status
- Send notification
- Exit with appropriate code
```

**Duration**: ~10 seconds

### Total Deployment Time
**Estimated**: 6-10 minutes

---

## Manual Deployment Scripts

### 1. Full Deployment
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**What it does:**
- Builds frontend locally
- Copies files to EC2
- Installs dependencies
- Runs migrations
- Restarts services

### 2. Backup Before Deployment
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

**What it does:**
- Creates timestamped backup
- Backs up application files
- Backs up database
- Keeps last 5 backups

### 3. Rollback Deployment
```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

**What it does:**
- Restores from latest backup
- Restarts services
- Verifies rollback

### 4. Health Check
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh your-ec2-ip
```

**What it does:**
- Checks backend health
- Checks frontend accessibility
- Checks API through Nginx
- Reports status

### 5. Monitor Application
```bash
chmod +x scripts/monitor.sh
./scripts/monitor.sh
```

**What it does:**
- Shows system metrics
- Shows PM2 status
- Shows recent errors
- Shows network connections

---

## Deployment Strategies

### 1. Blue-Green Deployment (Future)
```
┌─────────────┐
│   Load      │
│  Balancer   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Blue │ │Green│
│(Old)│ │(New)│
└─────┘ └─────┘
```

**Benefits:**
- Zero downtime
- Easy rollback
- Safe testing

### 2. Rolling Deployment (Future)
```
Instance 1: Old → New
Instance 2: Old → Wait
Instance 3: Old → Wait

Instance 1: New
Instance 2: Old → New
Instance 3: Old → Wait

Instance 1: New
Instance 2: New
Instance 3: Old → New
```

**Benefits:**
- Gradual rollout
- Reduced risk
- Resource efficient

### 3. Canary Deployment (Future)
```
90% Traffic → Old Version
10% Traffic → New Version

Monitor metrics...

100% Traffic → New Version
```

**Benefits:**
- Test with real users
- Minimal risk
- Data-driven decisions

---

## Monitoring & Alerts

### Health Checks

#### Backend Health Endpoint
```bash
curl http://your-ec2-ip:5000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T10:00:00Z",
  "uptime": 86400,
  "environment": "production",
  "database": "connected",
  "memory": {
    "used": "150 MB",
    "total": "512 MB"
  }
}
```

#### Readiness Check
```bash
curl http://your-ec2-ip:5000/ready
```

#### Liveness Check
```bash
curl http://your-ec2-ip:5000/live
```

### PM2 Monitoring

```bash
# View process status
pm2 status

# View logs
pm2 logs guidemitra-backend

# Monitor resources
pm2 monit

# View metrics
pm2 describe guidemitra-backend
```

### Nginx Monitoring

```bash
# Check status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check configuration
sudo nginx -t
```

---

## Troubleshooting CI/CD

### Common Issues

#### 1. SSH Connection Failed
**Error**: `Permission denied (publickey)`

**Solutions:**
- Verify EC2_SSH_PRIVATE_KEY secret is correct
- Ensure key includes BEGIN and END lines
- Check EC2 security group allows SSH
- Verify EC2_USER is correct (ubuntu)

#### 2. Build Failed
**Error**: `npm ERR! code ELIFECYCLE`

**Solutions:**
- Check package.json scripts
- Verify Node.js version compatibility
- Check for syntax errors
- Review build logs

#### 3. Deployment Timeout
**Error**: `Timeout waiting for deployment`

**Solutions:**
- Check EC2 instance is running
- Verify network connectivity
- Check disk space on EC2
- Review PM2 logs

#### 4. Database Migration Failed
**Error**: `Migration failed`

**Solutions:**
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check database permissions
- Review migration files

#### 5. Health Check Failed
**Error**: `Health check returned 503`

**Solutions:**
- Check backend is running (pm2 status)
- Verify database connection
- Check environment variables
- Review application logs

---

## Best Practices

### 1. Version Control
- ✅ Use semantic versioning
- ✅ Tag releases
- ✅ Write meaningful commit messages
- ✅ Use feature branches

### 2. Testing
- ✅ Test locally before pushing
- ✅ Run linters
- ✅ Check for security vulnerabilities
- ✅ Test on staging environment

### 3. Deployment
- ✅ Always backup before deployment
- ✅ Deploy during low-traffic periods
- ✅ Monitor after deployment
- ✅ Have rollback plan ready

### 4. Security
- ✅ Never commit secrets
- ✅ Use GitHub Secrets
- ✅ Rotate credentials regularly
- ✅ Limit SSH access

### 5. Monitoring
- ✅ Set up health checks
- ✅ Monitor logs
- ✅ Track metrics
- ✅ Set up alerts

---

## Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] Tests passing locally
- [ ] Backup created
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

### During Deployment
- [ ] Monitor GitHub Actions workflow
- [ ] Watch for errors in logs
- [ ] Verify each step completes
- [ ] Check health endpoints

### Post-Deployment
- [ ] Verify application is accessible
- [ ] Test critical features
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update documentation
- [ ] Notify team of completion

---

## Rollback Procedure

### Automatic Rollback
```bash
# Run rollback script
./scripts/rollback.sh
```

### Manual Rollback
```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to application directory
cd ~/guidemitra

# Restore from backup
cp -r backup/backend backend
cp -r backup/frontend frontend

# Restart services
cd backend
pm2 restart guidemitra-backend
sudo systemctl restart nginx

# Verify
curl http://localhost:5000/health
```

### Database Rollback
```bash
# Restore database from backup
psql -U guidemitra_user guidemitra < backup/database.sql
```

---

## Performance Optimization

### 1. Build Optimization
```yaml
# Use caching
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 2. Parallel Jobs
```yaml
# Run jobs in parallel
jobs:
  frontend-build:
    # ...
  backend-test:
    # Runs in parallel with frontend-build
```

### 3. Artifact Optimization
```yaml
# Only upload necessary files
- uses: actions/upload-artifact@v3
  with:
    name: frontend-build
    path: frontend/build/
    retention-days: 1  # Short retention
```

---

## Cost Optimization

### GitHub Actions
- Free tier: 2,000 minutes/month
- Optimize workflow to reduce minutes
- Use caching to speed up builds
- Run tests only on relevant changes

### EC2 Costs
- Use appropriate instance size
- Stop instances during non-business hours
- Use Reserved Instances for savings
- Monitor usage with CloudWatch

---

## Future Enhancements

### Planned Features
1.  Automated testing (unit, integration, e2e)
2.  Code quality checks (ESLint, Prettier)
3.  Security scanning (Snyk, Dependabot)
4.  Performance testing
5.  Slack/Discord notifications
6.  Deployment approvals
7.  Multi-environment support (dev, staging, prod)
8.  Docker containerization
9.  Kubernetes orchestration
10. Infrastructure as Code (Terraform)

---

