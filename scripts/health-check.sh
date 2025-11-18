#!/bin/bash

# Health Check Script for GuideMitra
# Use this to verify application health

set -e

# Configuration
EC2_HOST="${1:-localhost}"
BACKEND_PORT="${2:-5000}"

echo " Running health checks for GuideMitra..."
echo "Host: $EC2_HOST"
echo ""

# Check backend health
echo " Checking backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST:$BACKEND_PORT/health)

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo " Backend is healthy"
    curl -s http://$EC2_HOST:$BACKEND_PORT/health | jq '.'
else
    echo " Backend is unhealthy (HTTP $BACKEND_HEALTH)"
    exit 1
fi

echo ""

# Check frontend
echo " Checking frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST)

if [ "$FRONTEND_HEALTH" = "200" ]; then
    echo " Frontend is accessible"
else
    echo " Frontend is not accessible (HTTP $FRONTEND_HEALTH)"
    exit 1
fi

echo ""

# Check API endpoint
echo " Checking API endpoint..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_HOST/api/health)

if [ "$API_HEALTH" = "200" ]; then
    echo " API is accessible through Nginx"
else
    echo " API is not accessible (HTTP $API_HEALTH)"
    exit 1
fi

echo ""
echo " All health checks passed!"
echo " Application URL: http://$EC2_HOST"
