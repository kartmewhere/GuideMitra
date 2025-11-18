#!/bin/bash

# Backup Script for GuideMitra
# Run this before deployments to create backups

set -e

# Configuration
EC2_USER="ubuntu"
EC2_HOST="your-ec2-public-ip"
SSH_KEY_PATH="~/.ssh/your-key.pem"

echo " Creating backup..."

ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'
cd ~/guidemitra

# Create backup directory with timestamp
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup application files
echo " Backing up application files..."
cp -r backend $BACKUP_DIR/
cp -r frontend $BACKUP_DIR/

# Backup database
echo " Backing up database..."
pg_dump -U guidemitra_user guidemitra > $BACKUP_DIR/database.sql

# Keep only last 5 backups
echo " Cleaning old backups..."
ls -t | grep backup- | tail -n +6 | xargs -r rm -rf

# Create symlink to latest backup
rm -f backup
ln -s $BACKUP_DIR backup

echo " Backup complete: $BACKUP_DIR"
ENDSSH

echo " Backup successful!"
