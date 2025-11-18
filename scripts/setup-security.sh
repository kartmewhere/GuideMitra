#!/bin/bash

# Security Hardening Script for GuideMitra EC2
# This script implements comprehensive security measures

set -e

echo "🔒 Starting Security Hardening..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==================== System Updates ====================
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade -y

# ==================== Install Security Tools ====================
echo -e "${GREEN}[2/10] Installing security tools...${NC}"
sudo apt-get install -y \
    fail2ban \
    ufw \
    unattended-upgrades \
    apt-listchanges \
    lynis \
    rkhunter \
    chkrootkit \
    aide \
    auditd

# ==================== Fail2ban Configuration ====================
echo -e "${GREEN}[3/10] Configuring Fail2ban...${NC}"

# Create custom Fail2ban configuration for SSH
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
# Ban hosts for 1 hour
bantime = 3600
# Find time window
findtime = 600
# Max retry attempts
maxretry = 3
# Email notifications
destemail = admin@yourdomain.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200

[sshd-ddos]
enabled = true
port = ssh
filter = sshd-ddos
logpath = /var/log/auth.log
maxretry = 2
bantime = 7200

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 3600

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400

[nginx-noproxy]
enabled = true
port = http,https
filter = nginx-noproxy
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
EOF

# Create custom filter for Node.js app
sudo tee /etc/fail2ban/filter.d/nodejs-auth.conf > /dev/null <<'EOF'
[Definition]
failregex = ^.*Failed login attempt.*from <HOST>.*$
            ^.*Authentication failed.*<HOST>.*$
            ^.*Invalid credentials.*<HOST>.*$
ignoreregex =
EOF

# Start and enable Fail2ban
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

echo -e "${GREEN}✅ Fail2ban configured and started${NC}"

# ==================== UFW Firewall Configuration ====================
echo -e "${GREEN}[4/10] Configuring UFW firewall...${NC}"

# Reset UFW to defaults
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if you've modified SSH port)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Rate limiting for SSH
sudo ufw limit 22/tcp comment 'SSH rate limit'

# Enable UFW
sudo ufw --force enable

echo -e "${GREEN}✅ UFW firewall configured${NC}"

# ==================== SSH Hardening ====================
echo -e "${GREEN}[5/10] Hardening SSH configuration...${NC}"

# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Apply SSH hardening
sudo tee -a /etc/ssh/sshd_config > /dev/null <<'EOF'

# GuideMitra Security Hardening
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers ubuntu
UsePAM yes
LoginGraceTime 60
MaxStartups 10:30:60
MaxSessions 10
TCPKeepAlive yes
Compression delayed
EOF

# Restart SSH service
sudo systemctl restart sshd

echo -e "${GREEN}✅ SSH hardened${NC}"

# ==================== Automatic Security Updates ====================
echo -e "${GREEN}[6/10] Configuring automatic security updates...${NC}"

sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF

sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo -e "${GREEN}✅ Automatic security updates configured${NC}"

# ==================== Kernel Hardening ====================
echo -e "${GREEN}[7/10] Applying kernel hardening...${NC}"

sudo tee /etc/sysctl.d/99-security-hardening.conf > /dev/null <<'EOF'
# IP Forwarding
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# SYN flood protection
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Log Martians
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0

# Ignore Broadcast Request
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Increase system file descriptor limit
fs.file-max = 65535

# Kernel hardening
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 1
kernel.kexec_load_disabled = 1

# Prevent core dumps
fs.suid_dumpable = 0
EOF

# Apply sysctl settings
sudo sysctl -p /etc/sysctl.d/99-security-hardening.conf

echo -e "${GREEN}✅ Kernel hardened${NC}"

# ==================== Auditd Configuration ====================
echo -e "${GREEN}[8/10] Configuring system auditing...${NC}"

# Enable auditd
sudo systemctl enable auditd
sudo systemctl start auditd

# Add audit rules
sudo tee -a /etc/audit/rules.d/audit.rules > /dev/null <<'EOF'
# Delete all rules
-D

# Buffer Size
-b 8192

# Failure Mode
-f 1

# Audit system calls
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S stime -k time-change

# Audit user/group modifications
-w /etc/group -p wa -k identity
-w /etc/passwd -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/shadow -p wa -k identity

# Audit network changes
-w /etc/hosts -p wa -k network
-w /etc/network/ -p wa -k network

# Monitor for unauthorized access attempts
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins
-w /var/log/auth.log -p wa -k logins

# Monitor for privilege escalation
-w /etc/sudoers -p wa -k privilege
-w /etc/sudoers.d/ -p wa -k privilege

# Make configuration immutable
-e 2
EOF

# Restart auditd
sudo service auditd restart

echo -e "${GREEN}✅ System auditing configured${NC}"

# ==================== AIDE Installation ====================
echo -e "${GREEN}[9/10] Configuring AIDE (file integrity monitoring)...${NC}"

# Initialize AIDE database
sudo aideinit

# Move database to production location
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Create daily AIDE check cron job
sudo tee /etc/cron.daily/aide-check > /dev/null <<'EOF'
#!/bin/bash
/usr/bin/aide --check | mail -s "AIDE Report for $(hostname)" admin@yourdomain.com
EOF

sudo chmod +x /etc/cron.daily/aide-check

echo -e "${GREEN}✅ AIDE configured${NC}"

# ==================== Security Scan ====================
echo -e "${GREEN}[10/10] Running security scan with Lynis...${NC}"

# Update Lynis
sudo lynis update info

# Run security audit (non-interactive)
sudo lynis audit system --quick --quiet

echo -e "${GREEN}✅ Security scan complete${NC}"

# ==================== Summary ====================
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Security Hardening Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Implemented Security Measures:${NC}"
echo "  ✅ System packages updated"
echo "  ✅ Fail2ban installed and configured"
echo "  ✅ UFW firewall configured"
echo "  ✅ SSH hardened"
echo "  ✅ Automatic security updates enabled"
echo "  ✅ Kernel hardening applied"
echo "  ✅ System auditing configured"
echo "  ✅ AIDE file integrity monitoring setup"
echo "  ✅ Security scan completed"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "  1. Configure SSL/TLS certificates (run setup-ssl.sh)"
echo "  2. Review Lynis report: sudo lynis show report"
echo "  3. Check Fail2ban status: sudo fail2ban-client status"
echo "  4. Monitor firewall: sudo ufw status verbose"
echo "  5. Review audit logs: sudo ausearch -m user_login"

echo -e "\n${RED}Important:${NC}"
echo "  - Ensure you have SSH key authentication set up before disconnecting"
echo "  - Save your SSH keys in a secure location"
echo "  - Document any custom firewall rules"
echo "  - Test SSH connection before logging out"

echo -e "\n${GREEN}Security hardening completed successfully!${NC}\n"

