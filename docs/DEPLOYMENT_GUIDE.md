# GuideMitra - EC2 Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Manual Deployment](#manual-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Tools
- AWS Account with EC2 access
- GitHub repository
- SSH key pair for EC2
- Domain name (optional)

### Local Requirements
- Git
- Node.js 18.x
- npm or yarn
- SSH client

---

## 2. EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   ```
   Name: guidemitra-production
   AMI: Ubuntu Server 22.04 LTS
   Instance Type: t2.medium (minimum) or t3.medium (recommended)
   Key Pair: Create or select existing key pair
   ```

3. **Configure Security Group**
   ```
   Inbound Rules:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (5000) - Your IP (for testing)
   ```

4. **Configure Storage**
   ```
   Root Volume: 30 GB (minimum)
   Volume Type: gp3
   ```

5. **Launch Instance**
   - Wait for instance to be in "running" state
   - Note the Public IP address

### Step 2: Connect to EC2 Instance

```bash
# Set correct permissions for your key
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Run Setup Script

```bash
# On your local machine, copy setup script to EC2
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@your-ec2-public-ip:~/

# Connect to EC2 and run setup
ssh -i your-key.pem ubuntu@your-ec2-public-ip
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### Step 4: Configure Environment Variables

```bash
# Edit backend .env file
cd ~/guidemitra/backend
cp .env.example .env
nano .env
```

**Update the following values:**
```env
DATABASE_URL="postgresql://guidemitra_user:YOUR_PASSWORD@localhost:5432/guidemitra"
JWT_SECRET="generate-a-secure-random-string-here"
GEMINI_API_KEY="your-google-gemini-api-key"
NODE_ENV="production"
PORT=5000
FRONTEND_URL="http://your-ec2-public-ip"
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. GitHub Secrets Configuration

### Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### AWS Credentials
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION (e.g., us-east-1)
```

#### EC2 Connection
```
EC2_HOST (your EC2 public IP)
EC2_USER (ubuntu)
EC2_SSH_PRIVATE_KEY (content of your .pem file)
```

#### Application Configuration
```
REACT_APP_API_URL (http://your-ec2-public-ip/api)
DATABASE_URL (PostgreSQL connection string)
JWT_SECRET (your JWT secret)
GEMINI_API_KEY (your Google Gemini API key)
```

### How to Add Secrets

1. **AWS Credentials**
   ```bash
   # Create IAM user with EC2 access
   # Copy Access Key ID and Secret Access Key
   ```

2. **SSH Private Key**
   ```bash
   # Copy content of your .pem file
   cat your-key.pem
   # Paste entire content including BEGIN and END lines
   ```

---

## 4. CI/CD Pipeline

### Automatic Deployment

The CI/CD pipeline automatically deploys when you push to `main` or `production` branch.

#### Pipeline Stages

```
1. Frontend Build
   ├── Checkout code
   ├── Install dependencies
   ├── Build React app
   └── Upload artifact

2. Backend Test
   ├── Checkout code
   ├── Install dependencies
   └── Run syntax checks

3. Deploy to EC2
   ├── Download frontend build
   ├── Copy files to EC2
   ├── Install backend dependencies
   ├── Run database migrations
   ├── Restart services
   └── Verify deployment

4. Notify
   └── Send deployment status
```

#### Trigger Deployment

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main

# GitHub Actions will automatically deploy
```

#### Monitor Deployment

1. Go to GitHub repository
2. Click "Actions" tab
3. View running workflow
4. Check logs for each step

---

## 5. Manual Deployment

### Option 1: Using Deployment Script

```bash
# Update configuration in scripts/deploy.sh
nano scripts/deploy.sh

# Update these variables:
EC2_USER="ubuntu"
EC2_HOST="your-ec2-public-ip"
SSH_KEY_PATH="~/.ssh/your-key.pem"

# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### Option 2: Manual Steps

#### Deploy Frontend

```bash
# Build frontend locally
cd frontend
npm install
npm run build

# Copy to EC2
scp -i your-key.pem -r build/* ubuntu@your-ec2-ip:~/guidemitra/frontend/
```

#### Deploy Backend

```bash
# Copy backend files to EC2
scp -i your-key.pem -r backend/* ubuntu@your-ec2-ip:~/guidemitra/backend/

# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install dependencies
cd ~/guidemitra/backend
npm ci --production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Restart backend
pm2 restart guidemitra-backend

# Restart Nginx
sudo systemctl restart nginx
```

---

## 6. Monitoring & Maintenance

### Check Application Status

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Check backend status
pm2 status
pm2 logs guidemitra-backend

# Check Nginx status
sudo systemctl status nginx

# Check database status
sudo systemctl status postgresql

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs guidemitra-backend

# Restart application
pm2 restart guidemitra-backend

# Stop application
pm2 stop guidemitra-backend

# Start application
pm2 start guidemitra-backend

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### Database Management

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Connect to guidemitra database
\c guidemitra

# List tables
\dt

# View table structure
\d table_name

# Run SQL query
SELECT * FROM users LIMIT 10;

# Exit
\q
```

### Backup & Restore

#### Create Backup

```bash
# Run backup script
chmod +x scripts/backup.sh
./scripts/backup.sh

# Or manually on EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/guidemitra
pg_dump -U guidemitra_user guidemitra > backup-$(date +%Y%m%d).sql
```

#### Restore Backup

```bash
# On EC2
cd ~/guidemitra
psql -U guidemitra_user guidemitra < backup-20251021.sql
```

### Rollback Deployment

```bash
# Run rollback script
chmod +x scripts/rollback.sh
./scripts/rollback.sh

# Or manually on EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/guidemitra
cp -r backup/backend backend
cp -r backup/frontend frontend
pm2 restart guidemitra-backend
sudo systemctl restart nginx
```

---

## 7. Troubleshooting

### Common Issues

#### Issue 1: Backend Not Starting

**Symptoms:**
- PM2 shows "errored" status
- Application not accessible

**Solutions:**
```bash
# Check logs
pm2 logs guidemitra-backend --lines 100

# Check environment variables
cd ~/guidemitra/backend
cat .env

# Verify database connection
npx prisma db pull

# Restart with fresh logs
pm2 delete guidemitra-backend
pm2 start src/server.js --name guidemitra-backend
```

#### Issue 2: Database Connection Failed

**Symptoms:**
- "Connection refused" errors
- "Authentication failed" errors

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify database exists
sudo -u postgres psql -l

# Check connection string
cd ~/guidemitra/backend
grep DATABASE_URL .env

# Test connection
npx prisma db pull
```

#### Issue 3: Nginx 502 Bad Gateway

**Symptoms:**
- Frontend loads but API calls fail
- 502 error on /api routes

**Solutions:**
```bash
# Check backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart guidemitra-backend
sudo systemctl restart nginx
```

#### Issue 4: Frontend Not Loading

**Symptoms:**
- Blank page
- 404 errors

**Solutions:**
```bash
# Check Nginx configuration
sudo nginx -t

# Verify frontend files exist
ls -la ~/guidemitra/frontend/

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### Issue 5: CI/CD Pipeline Fails

**Symptoms:**
- GitHub Actions workflow fails
- Deployment not completing

**Solutions:**
```bash
# Check GitHub Secrets are set correctly
# Verify EC2 security group allows SSH from GitHub IPs
# Check SSH key format (must include BEGIN and END lines)
# Verify EC2 instance is running
# Check EC2 disk space: df -h
```

### Performance Optimization

#### Enable Gzip Compression

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Add in http block:
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Restart Nginx
sudo systemctl restart nginx
```

#### Enable PM2 Cluster Mode

```bash
# Stop current process
pm2 delete guidemitra-backend

# Start in cluster mode
pm2 start src/server.js --name guidemitra-backend -i max

# Save configuration
pm2 save
```

#### Database Optimization

```bash
# Connect to database
sudo -u postgres psql guidemitra

# Analyze tables
ANALYZE;

# Vacuum database
VACUUM ANALYZE;

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## 8. SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Certificates auto-renew every 90 days
```

### Update Nginx Configuration

```bash
# Certbot automatically updates Nginx config
# Verify HTTPS is working
curl https://yourdomain.com

# Update frontend .env
REACT_APP_API_URL=https://yourdomain.com/api
```

---

## 9. Scaling & High Availability

### Vertical Scaling

```bash
# Stop instance
# Change instance type to larger size (t3.large, t3.xlarge)
# Start instance
# Verify application is running
```

### Horizontal Scaling (Future)

- Set up Application Load Balancer
- Launch multiple EC2 instances
- Configure Auto Scaling Group
- Use RDS for database (instead of local PostgreSQL)
- Implement Redis for session management

---

## 10. Cost Optimization

### EC2 Instance Recommendations

```
Development: t3.micro ($7/month)
Staging: t3.small ($15/month)
Production: t3.medium ($30/month)
High Traffic: t3.large ($60/month)
```

### Cost Saving Tips

1. Use Reserved Instances (save up to 72%)
2. Stop instances during non-business hours
3. Use Spot Instances for non-critical workloads
4. Enable CloudWatch alarms for cost monitoring
5. Use S3 for static assets instead of EC2 storage

---

## 11. Security Best Practices

### Checklist

- ✅ Use SSH keys (not passwords)
- ✅ Restrict SSH access to specific IPs
- ✅ Keep system packages updated
- ✅ Use environment variables for secrets
- ✅ Enable firewall (UFW)
- ✅ Use HTTPS (SSL/TLS)
- ✅ Regular backups
- ✅ Monitor logs for suspicious activity
- ✅ Use strong database passwords
- ✅ Implement rate limiting
- ✅ Keep Node.js and dependencies updated

### Security Updates

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Node.js packages
cd ~/guidemitra/backend
npm audit
npm audit fix

# Update Nginx
sudo apt-get install --only-upgrade nginx
```

---

## 12. Support & Resources

### Useful Commands Reference

```bash
# System
df -h                    # Check disk space
free -h                  # Check memory
top                      # Monitor processes
htop                     # Better process monitor

# Logs
pm2 logs                 # Application logs
sudo journalctl -u nginx # Nginx system logs
tail -f /var/log/syslog  # System logs

# Network
netstat -tulpn           # Check open ports
curl localhost:5000      # Test backend locally
curl localhost           # Test Nginx locally

# Database
sudo -u postgres psql    # Connect to PostgreSQL
pg_dump                  # Backup database
psql                     # Restore database
```

### Documentation Links

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Quick Start Checklist

- [ ] Launch EC2 instance
- [ ] Configure security group
- [ ] Connect via SSH
- [ ] Run setup script
- [ ] Configure environment variables
- [ ] Set up GitHub secrets
- [ ] Push code to trigger deployment
- [ ] Verify application is running
- [ ] Set up SSL (optional)
- [ ] Configure monitoring
- [ ] Create backup schedule
- [ ] Document custom configurations

---

**Last Updated**: October 21, 2025
**Version**: 1.0
**Maintained By**: GuideMitra Development Team
