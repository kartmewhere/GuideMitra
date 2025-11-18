# Deployment Scripts

This directory contains all deployment and maintenance scripts for GuideMitra.

##  Scripts Overview

### 1. setup-ec2.sh
**Purpose**: Initial EC2 instance setup

**What it does**:
- Installs Node.js, PostgreSQL, Nginx, PM2
- Creates database and user
- Configures Nginx
- Sets up firewall
- Creates application directories

**Usage**:
```bash
# Copy to EC2
scp -i your-key.pem setup-ec2.sh ubuntu@your-ec2-ip:~/

# Run on EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**Run once**: During initial setup only

---

### 2. deploy.sh
**Purpose**: Manual deployment to EC2

**What it does**:
- Builds frontend locally
- Copies files to EC2
- Installs backend dependencies
- Runs database migrations
- Restarts services

**Usage**:
```bash
# Update configuration first
nano deploy.sh
# Set: EC2_USER, EC2_HOST, SSH_KEY_PATH

# Make executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Run**: Whenever you want to deploy manually

---

### 3. backup.sh
**Purpose**: Create backups before deployment

**What it does**:
- Backs up application files
- Backs up database
- Creates timestamped backup directory
- Keeps last 5 backups

**Usage**:
```bash
# Update configuration
nano backup.sh
# Set: EC2_USER, EC2_HOST, SSH_KEY_PATH

# Make executable
chmod +x backup.sh

# Run backup
./backup.sh
```

**Run**: Before each deployment (recommended)

---

### 4. rollback.sh
**Purpose**: Rollback to previous deployment

**What it does**:
- Restores application files from backup
- Restores database from backup
- Restarts services

**Usage**:
```bash
# Update configuration
nano rollback.sh
# Set: EC2_USER, EC2_HOST, SSH_KEY_PATH

# Make executable
chmod +x rollback.sh

# Run rollback
./rollback.sh
```

**Run**: When deployment fails or issues found

---

### 5. health-check.sh
**Purpose**: Verify application health

**What it does**:
- Checks backend health endpoint
- Checks frontend accessibility
- Checks API through Nginx
- Reports status

**Usage**:
```bash
# Make executable
chmod +x health-check.sh

# Run health check
./health-check.sh your-ec2-ip

# Or for local testing
./health-check.sh localhost
```

**Run**: After deployment, regularly for monitoring

---

### 6. monitor.sh
**Purpose**: Monitor application metrics

**What it does**:
- Shows system information
- Shows CPU and memory usage
- Shows PM2 process status
- Shows Nginx and PostgreSQL status
- Shows recent errors
- Shows network connections

**Usage**:
```bash
# Update configuration
nano monitor.sh
# Set: EC2_USER, EC2_HOST, SSH_KEY_PATH

# Make executable
chmod +x monitor.sh

# Run monitoring
./monitor.sh
```

**Run**: Regularly to monitor application health

---

##  Quick Start

### First Time Setup

```bash
# 1. Make all scripts executable
chmod +x scripts/*.sh

# 2. Update configuration in each script
# Edit EC2_USER, EC2_HOST, SSH_KEY_PATH

# 3. Run setup on EC2
./scripts/setup-ec2.sh

# 4. Deploy application
./scripts/deploy.sh

# 5. Verify deployment
./scripts/health-check.sh your-ec2-ip
```

### Regular Deployment Workflow

```bash
# 1. Create backup
./scripts/backup.sh

# 2. Deploy new version
./scripts/deploy.sh

# 3. Verify deployment
./scripts/health-check.sh your-ec2-ip

# 4. Monitor application
./scripts/monitor.sh

# If issues found:
./scripts/rollback.sh
```

---

## ⚙️ Configuration

### Required Variables

Each script needs these variables configured:

```bash
EC2_USER="ubuntu"                    # EC2 username
EC2_HOST="your-ec2-public-ip"       # EC2 IP or domain
SSH_KEY_PATH="~/.ssh/your-key.pem"  # Path to SSH key
REMOTE_DIR="~/guidemitra"           # Application directory on EC2
```

### How to Update

```bash
# Open script
nano scripts/deploy.sh

# Find configuration section at top
# Update values
EC2_USER="ubuntu"
EC2_HOST="54.123.45.67"  # Your actual IP
SSH_KEY_PATH="~/.ssh/my-key.pem"

# Save and exit (Ctrl+X, Y, Enter)
```

---

## 🔒 Security Notes

### SSH Key Permissions

```bash
# Ensure correct permissions
chmod 400 ~/.ssh/your-key.pem
```

### Script Permissions

```bash
# Make scripts executable (owner only)
chmod 700 scripts/*.sh

# Or for specific script
chmod 700 scripts/deploy.sh
```


##  Troubleshooting

### Permission Denied

**Error**: `Permission denied (publickey)`

**Solution**:
```bash
# Check key permissions
chmod 400 ~/.ssh/your-key.pem

# Verify key path in script
echo $SSH_KEY_PATH

# Test SSH connection
ssh -i ~/.ssh/your-key.pem ubuntu@your-ec2-ip
```

### Script Not Found

**Error**: `command not found`

**Solution**:
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run with explicit path
./scripts/deploy.sh

# Or from scripts directory
cd scripts
./deploy.sh
```

### Connection Timeout

**Error**: `Connection timed out`

**Solution**:
```bash
# Check EC2 is running
# Check security group allows SSH (port 22)
# Verify EC2_HOST is correct
# Check your IP is allowed in security group
```

### Deployment Failed

**Error**: Various deployment errors

**Solution**:
```bash
# Check logs on EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
pm2 logs guidemitra-backend

# Check disk space
df -h

# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

---

##  Script Customization

### Adding Custom Steps

Example: Add database seed after deployment

```bash
# Edit deploy.sh
nano scripts/deploy.sh

# Add after migration step:
echo "🌱 Seeding database..."
npx prisma db seed

# Save and run
./scripts/deploy.sh
```

### Adding Notifications

Example: Send Slack notification

```bash
# Add to deploy.sh
SLACK_WEBHOOK="your-webhook-url"

# After successful deployment:
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{"text":"Deployment successful!"}'
```

### Adding Pre-deployment Checks

Example: Check if tests pass

```bash
# Add to deploy.sh before deployment
echo " Running tests..."
cd backend
npm test || exit 1
cd ..
```

---

## 🔄 Automation

### Cron Jobs

Schedule regular backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/scripts/backup.sh

# Add hourly health check
0 * * * * /path/to/scripts/health-check.sh your-ec2-ip
```

### GitHub Actions

Scripts can be called from GitHub Actions:

```yaml
- name: Deploy to EC2
  run: |
    chmod +x scripts/deploy.sh
    ./scripts/deploy.sh
```

---

##  Monitoring Integration

### CloudWatch Integration

Add CloudWatch metrics:

```bash
# Install CloudWatch agent
sudo apt-get install amazon-cloudwatch-agent

# Configure metrics
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/path/to/config.json
```

### Prometheus Integration

Export metrics for Prometheus:

```bash
# Install node_exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo mv node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
```

---


---

## Additional Resources

### Documentation
- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)
- [CI/CD Pipeline](../docs/CI_CD_PIPELINE.md)
- [Deployment Summary](../docs/DEPLOYMENT_SUMMARY.md)

### External Resources
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [SSH Best Practices](https://www.ssh.com/academy/ssh/best-practices)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

##  Getting Help

### Check Logs

```bash
# Application logs
ssh -i your-key.pem ubuntu@your-ec2-ip
pm2 logs guidemitra-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx
```

### Common Commands

```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart guidemitra-backend

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check database
sudo -u postgres psql guidemitra
```

+