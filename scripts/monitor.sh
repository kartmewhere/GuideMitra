#!/bin/bash

# Monitoring Script for GuideMitra
# Run this to monitor application metrics

# Configuration
EC2_USER="ubuntu"
EC2_HOST="your-ec2-public-ip"
SSH_KEY_PATH="~/.ssh/your-key.pem"

echo " GuideMitra Monitoring Dashboard"
echo "=================================="
echo ""

ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'ENDSSH'

# System Information
echo " System Information"
echo "-------------------"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# CPU Usage
echo " CPU Usage"
echo "------------"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Usage: " 100 - $1"%"}'
echo ""

# Memory Usage
echo " Memory Usage"
echo "--------------"
free -h | awk 'NR==2{printf "Used: %s / %s (%.2f%%)\n", $3, $2, $3*100/$2}'
echo ""

# Disk Usage
echo " Disk Usage"
echo "------------"
df -h / | awk 'NR==2{printf "Used: %s / %s (%s)\n", $3, $2, $5}'
echo ""

# PM2 Status
echo " PM2 Process Status"
echo "--------------------"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) (CPU: \(.monit.cpu)%, Memory: \(.monit.memory / 1024 / 1024 | floor)MB)"'
echo ""

# Nginx Status
echo " Nginx Status"
echo "--------------"
if systemctl is-active --quiet nginx; then
    echo "Status: Running"
    echo "Connections: $(ss -s | grep TCP | awk '{print $2}')"
else
    echo "Status: Not Running"
fi
echo ""

# PostgreSQL Status
echo " PostgreSQL Status"
echo "-------------------"
if systemctl is-active --quiet postgresql; then
    echo "Status: Running"
    sudo -u postgres psql -c "SELECT count(*) as connections FROM pg_stat_activity;" guidemitra 2>/dev/null | grep -A 1 connections | tail -1 | awk '{print "Active Connections: " $1}'
else
    echo "Status: Not Running"
fi
echo ""

# Recent Errors
echo " Recent Application Errors (Last 10)"
echo "-------------------------------------"
pm2 logs guidemitra-backend --lines 10 --nostream --err 2>/dev/null | tail -10 || echo "No recent errors"
echo ""

# Network Connections
echo " Network Connections"
echo "--------------------"
echo "Listening Ports:"
sudo netstat -tulpn | grep LISTEN | grep -E ':(80|443|5000|5432)' | awk '{print $4, $7}'
echo ""

# Last 5 Deployments
echo " Recent Deployments"
echo "-------------------"
ls -lt ~/guidemitra/backup-* 2>/dev/null | head -5 | awk '{print $9}' || echo "No backup history"

ENDSSH

echo ""
echo " Monitoring complete!"
