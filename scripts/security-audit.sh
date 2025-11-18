#!/bin/bash

# Comprehensive Security Audit Script
# Performs security checks and generates a detailed report

set -e

echo "🔍 Starting Security Audit..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create report directory
REPORT_DIR="$HOME/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/security_audit_$TIMESTAMP.txt"

mkdir -p "$REPORT_DIR"

# Start report
{
    echo "════════════════════════════════════════════════════════"
    echo "           GUIDEMITRA SECURITY AUDIT REPORT"
    echo "════════════════════════════════════════════════════════"
    echo "Date: $(date)"
    echo "Hostname: $(hostname)"
    echo "IP Address: $(hostname -I | awk '{print $1}')"
    echo "════════════════════════════════════════════════════════"
    echo ""
} > "$REPORT_FILE"

# ==================== System Information ====================
echo -e "${GREEN}[1/12] Gathering system information...${NC}"
{
    echo "1. SYSTEM INFORMATION"
    echo "────────────────────────────────────────────────────────"
    echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Kernel: $(uname -r)"
    echo "Uptime: $(uptime -p)"
    echo "Last Reboot: $(who -b | awk '{print $3, $4}')"
    echo ""
} >> "$REPORT_FILE"

# ==================== User Accounts ====================
echo -e "${GREEN}[2/12] Checking user accounts...${NC}"
{
    echo "2. USER ACCOUNTS"
    echo "────────────────────────────────────────────────────────"
    echo "Users with login shells:"
    grep -v '/nologin$\|/false$' /etc/passwd | cut -d: -f1
    echo ""
    echo "Users with sudo privileges:"
    grep -Po '^sudo.+:\K.*$' /etc/group || echo "None found"
    echo ""
    echo "Failed login attempts (last 24h):"
    sudo grep "Failed password" /var/log/auth.log | tail -10 || echo "None found"
    echo ""
} >> "$REPORT_FILE"

# ==================== Network Security ====================
echo -e "${GREEN}[3/12] Checking network security...${NC}"
{
    echo "3. NETWORK SECURITY"
    echo "────────────────────────────────────────────────────────"
    echo "Open Ports:"
    sudo ss -tulpn | grep LISTEN
    echo ""
    echo "Firewall Status:"
    sudo ufw status verbose || echo "UFW not installed"
    echo ""
    echo "Active Connections:"
    sudo ss -tupn | grep ESTAB | wc -l
    echo ""
} >> "$REPORT_FILE"

# ==================== SSH Configuration ====================
echo -e "${GREEN}[4/12] Checking SSH configuration...${NC}"
{
    echo "4. SSH CONFIGURATION"
    echo "────────────────────────────────────────────────────────"
    echo "PermitRootLogin: $(sudo grep "^PermitRootLogin" /etc/ssh/sshd_config || echo "Not set")"
    echo "PasswordAuthentication: $(sudo grep "^PasswordAuthentication" /etc/ssh/sshd_config || echo "Not set")"
    echo "PubkeyAuthentication: $(sudo grep "^PubkeyAuthentication" /etc/ssh/sshd_config || echo "Not set")"
    echo "SSH Port: $(sudo grep "^Port" /etc/ssh/sshd_config || echo "22 (default)")"
    echo ""
} >> "$REPORT_FILE"

# ==================== Fail2ban Status ====================
echo -e "${GREEN}[5/12] Checking Fail2ban...${NC}"
{
    echo "5. FAIL2BAN STATUS"
    echo "────────────────────────────────────────────────────────"
    if command -v fail2ban-client &> /dev/null; then
        sudo fail2ban-client status || echo "Fail2ban not running"
        echo ""
        echo "Banned IPs:"
        sudo fail2ban-client status sshd 2>/dev/null | grep "Banned IP" || echo "None"
    else
        echo "Fail2ban not installed"
    fi
    echo ""
} >> "$REPORT_FILE"

# ==================== SSL/TLS Certificates ====================
echo -e "${GREEN}[6/12] Checking SSL/TLS certificates...${NC}"
{
    echo "6. SSL/TLS CERTIFICATES"
    echo "────────────────────────────────────────────────────────"
    if command -v certbot &> /dev/null; then
        sudo certbot certificates 2>/dev/null || echo "No certificates found"
    else
        echo "Certbot not installed"
    fi
    echo ""
} >> "$REPORT_FILE"

# ==================== Package Updates ====================
echo -e "${GREEN}[7/12] Checking for updates...${NC}"
{
    echo "7. PACKAGE UPDATES"
    echo "────────────────────────────────────────────────────────"
    echo "Available updates:"
    sudo apt-get update -qq
    apt list --upgradable 2>/dev/null | tail -n +2 | wc -l
    echo ""
    echo "Security updates:"
    apt list --upgradable 2>/dev/null | grep -i security | wc -l || echo "0"
    echo ""
} >> "$REPORT_FILE"

# ==================== Application Status ====================
echo -e "${GREEN}[8/12] Checking application status...${NC}"
{
    echo "8. APPLICATION STATUS"
    echo "────────────────────────────────────────────────────────"
    echo "PM2 Processes:"
    pm2 list 2>/dev/null || echo "PM2 not running or not installed"
    echo ""
    echo "Nginx Status:"
    sudo systemctl status nginx --no-pager | grep Active || echo "Nginx not running"
    echo ""
    echo "PostgreSQL Status:"
    sudo systemctl status postgresql --no-pager | grep Active || echo "PostgreSQL not running"
    echo ""
} >> "$REPORT_FILE"

# ==================== Disk Usage ====================
echo -e "${GREEN}[9/12] Checking disk usage...${NC}"
{
    echo "9. DISK USAGE"
    echo "────────────────────────────────────────────────────────"
    df -h / | awk 'NR==1 || /\/$/'
    echo ""
    echo "Largest directories:"
    sudo du -h --max-depth=1 /home 2>/dev/null | sort -rh | head -5
    echo ""
} >> "$REPORT_FILE"

# ==================== Log Analysis ====================
echo -e "${GREEN}[10/12] Analyzing logs...${NC}"
{
    echo "10. LOG ANALYSIS"
    echo "────────────────────────────────────────────────────────"
    echo "Recent Errors (last 24h):"
    sudo journalctl --since "24 hours ago" -p err | tail -5 || echo "No errors found"
    echo ""
    echo "Auth log summary:"
    echo "  Total auth attempts: $(sudo grep "authentication" /var/log/auth.log 2>/dev/null | wc -l)"
    echo "  Failed attempts: $(sudo grep "Failed" /var/log/auth.log 2>/dev/null | wc -l)"
    echo "  Successful logins: $(sudo grep "Accepted" /var/log/auth.log 2>/dev/null | wc -l)"
    echo ""
} >> "$REPORT_FILE"

# ==================== Security Scanning ====================
echo -e "${GREEN}[11/12] Running security scans...${NC}"
{
    echo "11. SECURITY SCANS"
    echo "────────────────────────────────────────────────────────"
    
    # Lynis scan
    if command -v lynis &> /dev/null; then
        echo "Running Lynis security audit..."
        sudo lynis audit system --quick --quiet > /tmp/lynis_report.txt 2>&1
        echo "Lynis Hardening Index:"
        grep "Hardening index" /tmp/lynis_report.txt || echo "Not available"
        rm -f /tmp/lynis_report.txt
    else
        echo "Lynis not installed"
    fi
    echo ""
    
    # RKHunter
    if command -v rkhunter &> /dev/null; then
        echo "Running RKHunter rootkit scan..."
        sudo rkhunter --check --skip-keypress --report-warnings-only > /tmp/rkhunter_report.txt 2>&1
        cat /tmp/rkhunter_report.txt | head -20 || echo "No warnings"
        rm -f /tmp/rkhunter_report.txt
    else
        echo "RKHunter not installed"
    fi
    echo ""
} >> "$REPORT_FILE"

# ==================== Recommendations ====================
echo -e "${GREEN}[12/12] Generating recommendations...${NC}"
{
    echo "12. SECURITY RECOMMENDATIONS"
    echo "────────────────────────────────────────────────────────"
    
    # Check for pending updates
    UPDATES=$(apt list --upgradable 2>/dev/null | tail -n +2 | wc -l)
    if [ "$UPDATES" -gt 0 ]; then
        echo "⚠  $UPDATES package updates available - run: sudo apt-get upgrade"
    fi
    
    # Check SSH root login
    if sudo grep -q "^PermitRootLogin yes" /etc/ssh/sshd_config 2>/dev/null; then
        echo "⚠  SSH root login is enabled - disable it for security"
    fi
    
    # Check password authentication
    if sudo grep -q "^PasswordAuthentication yes" /etc/ssh/sshd_config 2>/dev/null; then
        echo "⚠  SSH password authentication is enabled - use key-based auth instead"
    fi
    
    # Check Fail2ban
    if ! command -v fail2ban-client &> /dev/null; then
        echo "⚠  Fail2ban not installed - install for brute-force protection"
    fi
    
    # Check SSL
    if ! command -v certbot &> /dev/null; then
        echo "⚠  SSL not configured - install Let's Encrypt for HTTPS"
    fi
    
    # Check firewall
    if ! command -v ufw &> /dev/null; then
        echo "⚠  UFW firewall not installed - install for network protection"
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        echo "⚠  Disk usage is at ${DISK_USAGE}% - clean up disk space"
    fi
    
    echo ""
    echo "✅ Recommendations complete"
    echo ""
} >> "$REPORT_FILE"

# ==================== Report Summary ====================
{
    echo "════════════════════════════════════════════════════════"
    echo "                    END OF REPORT"
    echo "════════════════════════════════════════════════════════"
    echo "Report saved to: $REPORT_FILE"
    echo "Generated at: $(date)"
    echo "════════════════════════════════════════════════════════"
} >> "$REPORT_FILE"

# Display summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Security Audit Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Report saved to:${NC} $REPORT_FILE"
echo -e "${YELLOW}View report:${NC} cat $REPORT_FILE"
echo -e "${YELLOW}Or:${NC} less $REPORT_FILE\n"

# Show quick summary
echo -e "${YELLOW}Quick Summary:${NC}"
grep -E "⚠|✅" "$REPORT_FILE" | head -10

echo -e "\n${GREEN}Audit completed successfully!${NC}\n"

