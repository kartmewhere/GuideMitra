#!/bin/bash

# EC2 Setup Script for GuideMitra
# Run this script on your EC2 instance to set up the environment

set -e

echo " Setting up GuideMitra on EC2..."

# Update system packages
echo " Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
echo " Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
echo " Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo " Setting up database..."
sudo -u postgres psql <<EOF
CREATE DATABASE guidemitra;
CREATE USER guidemitra_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE guidemitra TO guidemitra_user;
\q
EOF

# Install Nginx
echo " Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo " Installing PM2..."
sudo npm install -g pm2

# Create application directory
echo " Creating application directory..."
mkdir -p ~/guidemitra/frontend
mkdir -p ~/guidemitra/backend

# Configure Nginx
echo " Configuring Nginx..."
sudo tee /etc/nginx/sites-available/guidemitra > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root /home/ubuntu/guidemitra/frontend;
        try_files $uri $uri/ /index.html;
        
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/guidemitra /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
echo " Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create .env file template for backend
echo " Creating .env template..."
cat > ~/guidemitra/backend/.env.example <<'EOF'
# Database
DATABASE_URL="postgresql://guidemitra_user:your_secure_password@localhost:5432/guidemitra"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Google Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Server
NODE_ENV="production"
PORT=5000

# CORS
FRONTEND_URL="http://your-ec2-public-ip"
EOF

echo " EC2 setup complete!"
echo ""
echo " Next steps:"
echo "1. Edit ~/guidemitra/backend/.env with your actual values"
echo "2. Copy your application files to ~/guidemitra/"
echo "3. Run: cd ~/guidemitra/backend && npm install"
echo "4. Run: cd ~/guidemitra/backend && npx prisma migrate deploy"
echo "5. Run: pm2 start ~/guidemitra/backend/src/server.js --name guidemitra-backend"
echo "6. Run: pm2 save"
echo "7. Run: pm2 startup"
echo ""
echo " Your application will be available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
