#!/bin/bash

# Manual Deployment Script for GuideMitra
# Use this for manual deployments to EC2

set -e

# Configuration
EC2_USER="ubuntu"
EC2_HOST="your-ec2-public-ip"
SSH_KEY_PATH="~/.ssh/your-key.pem"
REMOTE_DIR="~/guidemitra"

echo " Starting deployment to EC2..."

# Build frontend
echo " Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deployment package
echo " Creating deployment package..."
mkdir -p deploy-temp
cp -r frontend/build deploy-temp/frontend
cp -r backend deploy-temp/backend

# Upload to EC2
echo " Uploading files to EC2..."
scp -i $SSH_KEY_PATH -r deploy-temp/* $EC2_USER@$EC2_HOST:$REMOTE_DIR/

# Deploy on EC2
echo " Deploying on EC2..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'
cd ~/guidemitra/backend

# Install dependencies
echo " Installing backend dependencies..."
npm ci --production

# Generate Prisma client
echo " Generating Prisma client..."
npx prisma generate

# Run database migrations
echo " Running database migrations..."
npx prisma migrate deploy

# Restart backend with PM2
echo " Restarting backend..."
pm2 restart guidemitra-backend || pm2 start src/server.js --name guidemitra-backend

# Save PM2 configuration
pm2 save

# Restart Nginx
echo " Restarting Nginx..."
sudo systemctl restart nginx

echo " Deployment complete!"
ENDSSH

# Clean up
echo " Cleaning up..."
rm -rf deploy-temp

echo " Deployment successful!"
echo " Application URL: http://$EC2_HOST"
