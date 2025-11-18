#!/bin/bash

# Monitoring Setup Script
# Installs and configures Prometheus, Grafana, and exporters

set -e

echo "📊 Setting up monitoring stack..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ==================== Install Prometheus ====================
echo -e "${GREEN}[1/7] Installing Prometheus...${NC}"

PROM_VERSION="2.48.0"
cd /tmp
wget "https://github.com/prometheus/prometheus/releases/download/v${PROM_VERSION}/prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
tar xvfz "prometheus-${PROM_VERSION}.linux-amd64.tar.gz"
sudo mv "prometheus-${PROM_VERSION}.linux-amd64" /opt/prometheus
sudo ln -sf /opt/prometheus/prometheus /usr/local/bin/

# Create Prometheus user
sudo useradd --no-create-home --shell /bin/false prometheus || true

# Create directories
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus

# Copy configuration
sudo cp ~/guidemitra/monitoring/prometheus.yml /etc/prometheus/
sudo cp -r ~/guidemitra/monitoring/alerts /etc/prometheus/
sudo chown -R prometheus:prometheus /etc/prometheus

# Create systemd service
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/opt/prometheus/consoles \
    --web.console.libraries=/opt/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable prometheus
sudo systemctl start prometheus

echo -e "${GREEN}✅ Prometheus installed${NC}"

# ==================== Install Node Exporter ====================
echo -e "${GREEN}[2/7] Installing Node Exporter...${NC}"

NODE_EXPORTER_VERSION="1.7.0"
cd /tmp
wget "https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
tar xvfz "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
sudo mv "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter" /usr/local/bin/

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

echo -e "${GREEN}✅ Node Exporter installed${NC}"

# ==================== Install Grafana ====================
echo -e "${GREEN}[3/7] Installing Grafana...${NC}"

# Add Grafana repository
sudo apt-get install -y software-properties-common
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana

# Enable and start Grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server

echo -e "${GREEN}✅ Grafana installed${NC}"

# ==================== Install Postgres Exporter ====================
echo -e "${GREEN}[4/7] Installing Postgres Exporter...${NC}"

POSTGRES_EXPORTER_VERSION="0.15.0"
cd /tmp
wget "https://github.com/prometheus-community/postgres_exporter/releases/download/v${POSTGRES_EXPORTER_VERSION}/postgres_exporter-${POSTGRES_EXPORTER_VERSION}.linux-amd64.tar.gz"
tar xvfz "postgres_exporter-${POSTGRES_EXPORTER_VERSION}.linux-amd64.tar.gz"
sudo mv "postgres_exporter-${POSTGRES_EXPORTER_VERSION}.linux-amd64/postgres_exporter" /usr/local/bin/

# Create systemd service
sudo tee /etc/systemd/system/postgres_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Postgres Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
Environment="DATA_SOURCE_NAME=postgresql://guidemitra_user:password@localhost:5432/guidemitra?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable postgres_exporter
sudo systemctl start postgres_exporter

echo -e "${GREEN}✅ Postgres Exporter installed${NC}"

# ==================== Install Nginx Exporter ====================
echo -e "${GREEN}[5/7] Installing Nginx Exporter...${NC}"

# Enable Nginx stub_status
sudo tee -a /etc/nginx/sites-available/guidemitra > /dev/null <<'EOF'

# Nginx status for monitoring
server {
    listen 8080;
    server_name localhost;
    
    location /stub_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

sudo nginx -t && sudo systemctl reload nginx

# Install nginx-prometheus-exporter
NGINX_EXPORTER_VERSION="0.11.0"
cd /tmp
wget "https://github.com/nginxinc/nginx-prometheus-exporter/releases/download/v${NGINX_EXPORTER_VERSION}/nginx-prometheus-exporter_${NGINX_EXPORTER_VERSION}_linux_amd64.tar.gz"
tar xvfz "nginx-prometheus-exporter_${NGINX_EXPORTER_VERSION}_linux_amd64.tar.gz"
sudo mv nginx-prometheus-exporter /usr/local/bin/

# Create systemd service
sudo tee /etc/systemd/system/nginx_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Nginx Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/nginx-prometheus-exporter -nginx.scrape-uri=http://localhost:8080/stub_status

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nginx_exporter
sudo systemctl start nginx_exporter

echo -e "${GREEN}✅ Nginx Exporter installed${NC}"

# ==================== Configure Firewall ====================
echo -e "${GREEN}[6/7] Configuring firewall...${NC}"

# Allow Prometheus
sudo ufw allow 9090/tcp comment 'Prometheus'

# Allow Grafana
sudo ufw allow 3000/tcp comment 'Grafana'

sudo ufw reload

echo -e "${GREEN}✅ Firewall configured${NC}"

# ==================== Create Monitoring Dashboard ====================
echo -e "${GREEN}[7/7] Setting up dashboards...${NC}"

# Import Grafana dashboards (requires manual import or automation)
echo "Grafana is available at: http://$(hostname -I | awk '{print $1}'):3000"
echo "Default credentials: admin/admin"
echo ""
echo "Recommended dashboards to import:"
echo "  - Node Exporter Full: Dashboard ID 1860"
echo "  - Nginx: Dashboard ID 12708"
echo "  - PostgreSQL: Dashboard ID 9628"

echo -e "${GREEN}✅ Monitoring setup complete${NC}"

# ==================== Summary ====================
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Monitoring Stack Installed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Access URLs:${NC}"
echo "  • Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo "  • Grafana: http://$(hostname -I | awk '{print $1}'):3000"
echo "  • Node Exporter: http://localhost:9100/metrics"
echo "  • Postgres Exporter: http://localhost:9187/metrics"
echo "  • Nginx Exporter: http://localhost:9113/metrics"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Access Grafana at http://$(hostname -I | awk '{print $1}'):3000"
echo "  2. Login with admin/admin (change password on first login)"
echo "  3. Add Prometheus as data source (http://localhost:9090)"
echo "  4. Import dashboards from grafana.com"
echo "  5. Configure alerting in Prometheus"

echo -e "\n${GREEN}Monitoring setup completed successfully!${NC}\n"

