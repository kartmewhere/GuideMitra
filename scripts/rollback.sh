#!/bin/bash

# Rollback Script for GuideMitra
# Use this to rollback to a previous deployment

set -e

# Configuration
EC2_USER="ubuntu"
EC2_HOST="your-ec2-public-ip"
SSH_KEY_PATH="~/.ssh/your-key.pem"

echo " Rolling back deployment..."

ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'
cd ~/guidemitra

# Restore from backup
if [ -d "backup" ]; then
    echo " Restoring from backup..."
    
    # Restore backend
    rm -rf backend
    cp -r backup/backend backend
    
    # Restore frontend
    rm -rf frontend
    cp -r backup/frontend frontend
    
    # Restart services
    cd backend
    pm2 restart guidemitra-backend
    sudo systemctl restart nginx
    
    echo " Rollback complete!"
else
    echo " No backup found!"
    exit 1
fi
ENDSSH

echo " Rollback successful!"
