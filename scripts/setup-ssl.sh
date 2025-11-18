#!/bin/bash

# SSL/TLS Setup Script using Let's Encrypt
# Automated SSL certificate installation and renewal

set -e

echo "🔐 Setting up SSL/TLS with Let's Encrypt..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}" 
   exit 1
fi

# ==================== Input Validation ====================
if [ -z "$1" ]; then
    echo -e "${RED}Error: Domain name is required${NC}"
    echo "Usage: sudo ./setup-ssl.sh your-domain.com your-email@example.com"
    exit 1
fi

if [ -z "$2" ]; then
    echo -e "${RED}Error: Email address is required${NC}"
    echo "Usage: sudo ./setup-ssl.sh your-domain.com your-email@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2

echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}Email: $EMAIL${NC}"

# ==================== Install Certbot ====================
echo -e "${GREEN}[1/6] Installing Certbot...${NC}"

# Install Certbot and Nginx plugin
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot installed${NC}"

# ==================== Stop Nginx temporarily ====================
echo -e "${GREEN}[2/6] Stopping Nginx temporarily...${NC}"
sudo systemctl stop nginx

# ==================== Obtain SSL Certificate ====================
echo -e "${GREEN}[3/6] Obtaining SSL certificate from Let's Encrypt...${NC}"

# Obtain certificate using standalone mode
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    sudo systemctl start nginx
    exit 1
fi

echo -e "${GREEN}✅ SSL certificate obtained${NC}"

# ==================== Configure Nginx with SSL ====================
echo -e "${GREEN}[4/6] Configuring Nginx with SSL...${NC}"

# Create SSL configuration snippet
sudo tee /etc/nginx/snippets/ssl-params.conf > /dev/null <<'EOF'
# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK;

# SSL Session
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security Headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

# Update Nginx configuration for GuideMitra
sudo tee /etc/nginx/sites-available/guidemitra > /dev/null <<EOF
# HTTP - redirect all traffic to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - main server block
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Configuration
    include /etc/nginx/snippets/ssl-params.conf;
    
    # Logging
    access_log /var/log/nginx/guidemitra_access.log;
    error_log /var/log/nginx/guidemitra_error.log;
    
    # Frontend
    location / {
        root /home/ubuntu/guidemitra/frontend;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Security
        proxy_hide_header X-Powered-By;
        proxy_set_header X-Forwarded-SSL on;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
    
    # Security headers validation endpoint
    location /security-headers {
        proxy_pass http://localhost:5000/security-headers;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx configured with SSL${NC}"

# ==================== Start Nginx ====================
echo -e "${GREEN}[5/6] Starting Nginx...${NC}"
sudo systemctl start nginx
sudo systemctl reload nginx

echo -e "${GREEN}✅ Nginx started${NC}"

# ==================== Setup Automatic Renewal ====================
echo -e "${GREEN}[6/6] Setting up automatic certificate renewal...${NC}"

# Create renewal hook to reload Nginx
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/bash
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Test renewal process (dry run)
sudo certbot renew --dry-run

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Certificate renewal dry run had issues, but continuing...${NC}"
fi

# Add cron job for automatic renewal (twice daily)
CRON_JOB="0 */12 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✅ Automatic renewal configured${NC}"

# ==================== SSL/TLS Test ====================
echo -e "${GREEN}Testing SSL/TLS configuration...${NC}"

# Check if site is accessible via HTTPS
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ]; then
        echo -e "${GREEN}✅ HTTPS is working (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTPS returned HTTP $HTTP_CODE${NC}"
    fi
fi

# ==================== Summary ====================
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   SSL/TLS Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}SSL Certificate Information:${NC}"
echo "  Domain: $DOMAIN"
echo "  Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "  Expiry: 90 days from today"
echo "  Auto-renewal: Enabled (checks twice daily)"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Test your site: https://$DOMAIN"
echo "  2. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo "  3. Update DNS records if needed"
echo "  4. Update REACT_APP_API_URL in frontend to use HTTPS"
echo "  5. Update FRONTEND_URL in backend .env to use HTTPS"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  • Check certificate status: sudo certbot certificates"
echo "  • Renew certificates manually: sudo certbot renew"
echo "  • Test renewal: sudo certbot renew --dry-run"
echo "  • Check Nginx config: sudo nginx -t"
echo "  • View SSL logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"

echo -e "\n${GREEN}SSL/TLS setup completed successfully!${NC}\n"
echo -e "${YELLOW}⚠️  Remember to update your application configuration to use HTTPS!${NC}\n"

