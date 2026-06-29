#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  TaiLand Cafe — Auto Deploy Script for Hostinger VPS
#  Ubuntu 22.04 | Node.js 20 | PM2 | Nginx | Let's Encrypt SSL
# ═══════════════════════════════════════════════════════════════

set -e  # Dừng nếu có lỗi

# ── Màu sắc terminal ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Helper functions ──
log()     { echo -e "${GREEN}[✓]${NC} $1"; }
info()    { echo -e "${BLUE}[→]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
error()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
section() { echo -e "\n${BOLD}${CYAN}══ $1 ══${NC}\n"; }

# ════════════════════════════════════════
#  CHÀO MỪNG
# ════════════════════════════════════════
clear
echo -e "${BOLD}"
echo "  ████████╗ █████╗ ██╗██╗      █████╗ ███╗   ██╗██████╗ "
echo "     ██╔══╝██╔══██╗██║██║     ██╔══██╗████╗  ██║██╔══██╗"
echo "     ██║   ███████║██║██║     ███████║██╔██╗ ██║██║  ██║"
echo "     ██║   ██╔══██║██║██║     ██╔══██║██║╚██╗██║██║  ██║"
echo "     ██║   ██║  ██║██║███████╗██║  ██║██║ ╚████║██████╔╝"
echo "     ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ "
echo -e "${NC}"
echo -e "  ${CYAN}Nơi cảm hứng hội tụ${NC} — Auto Deploy Script"
echo -e "  ${YELLOW}Hostinger VPS · Ubuntu 22.04 · Node.js 20${NC}"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# ════════════════════════════════════════
#  KIỂM TRA QUYỀN ROOT
# ════════════════════════════════════════
if [ "$EUID" -ne 0 ]; then
  error "Vui lòng chạy script với quyền root: sudo bash setup.sh"
fi

# ════════════════════════════════════════
#  NHẬP THÔNG TIN CẤU HÌNH
# ════════════════════════════════════════
section "CẤU HÌNH DEPLOY"

# Domain
echo -e "${BOLD}Nhập tên miền của bạn${NC} (ví dụ: tailandcafe.vn)"
echo -e "${YELLOW}Nếu chưa có domain, nhấn Enter để bỏ qua SSL${NC}"
read -rp "→ Domain: " DOMAIN
DOMAIN="${DOMAIN:-}"

# Subdomain www
if [ -n "$DOMAIN" ]; then
  read -rp "→ Có dùng www.$DOMAIN không? (y/n) [y]: " USE_WWW
  USE_WWW="${USE_WWW:-y}"
fi

# Admin credentials
echo ""
echo -e "${BOLD}Tạo tài khoản Admin${NC}"
read -rp "→ Admin username [admin]: " ADMIN_USER
ADMIN_USER="${ADMIN_USER:-admin}"

while true; do
  read -rsp "→ Admin password: " ADMIN_PASS
  echo ""
  read -rsp "→ Xác nhận password: " ADMIN_PASS2
  echo ""
  [ "$ADMIN_PASS" = "$ADMIN_PASS2" ] && break
  warn "Password không khớp, vui lòng nhập lại."
done

# Session secret (tự tạo ngẫu nhiên)
SESSION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*' | fold -w 64 | head -n 1)

# Port
APP_PORT=3000

# Thư mục cài đặt
APP_DIR="/var/www/tailand-cafe"
REPO_URL="https://github.com/ThanhTaiNguyenGT/tailandcoffee.git"

echo ""
info "Cấu hình:"
echo "  Domain      : ${DOMAIN:-'(bỏ qua)'}"
echo "  Admin user  : $ADMIN_USER"
echo "  App dir     : $APP_DIR"
echo "  Port        : $APP_PORT"
echo ""
read -rp "Xác nhận và bắt đầu deploy? (y/n) [y]: " CONFIRM
CONFIRM="${CONFIRM:-y}"
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && { warn "Đã hủy."; exit 0; }

# ════════════════════════════════════════
#  BƯỚC 1 — CẬP NHẬT HỆ THỐNG
# ════════════════════════════════════════
section "BƯỚC 1/8 — Cập nhật hệ thống"

apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git unzip build-essential ufw
log "Hệ thống đã cập nhật"

# ════════════════════════════════════════
#  BƯỚC 2 — CÀI NODE.JS 20 VIA NVM
# ════════════════════════════════════════
section "BƯỚC 2/8 — Cài Node.js 20"

export NVM_DIR="/root/.nvm"

if [ ! -d "$NVM_DIR" ]; then
  info "Đang tải NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# Nạp NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20 --lts > /dev/null 2>&1
nvm use 20 > /dev/null 2>&1
nvm alias default 20 > /dev/null 2>&1

# Thêm vào PATH hệ thống
NODE_PATH=$(which node)
NPM_PATH=$(which npm)

log "Node.js $(node --version) · npm $(npm --version)"

# ════════════════════════════════════════
#  BƯỚC 3 — CÀI PM2
# ════════════════════════════════════════
section "BƯỚC 3/8 — Cài PM2"

npm install -g pm2 --quiet
log "PM2 $(pm2 --version)"

# ════════════════════════════════════════
#  BƯỚC 4 — CÀI NGINX
# ════════════════════════════════════════
section "BƯỚC 4/8 — Cài Nginx"

apt-get install -y -qq nginx
systemctl enable nginx > /dev/null 2>&1
systemctl start nginx
log "Nginx $(nginx -v 2>&1 | grep -o '[0-9.]*$')"

# ════════════════════════════════════════
#  BƯỚC 5 — CLONE & CÀI ĐẶT CODE
# ════════════════════════════════════════
section "BƯỚC 5/8 — Clone & cài đặt code"

# Backup nếu đã có
if [ -d "$APP_DIR" ]; then
  BACKUP_DIR="${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
  warn "Thư mục $APP_DIR đã tồn tại → backup sang $BACKUP_DIR"
  mv "$APP_DIR" "$BACKUP_DIR"
fi

mkdir -p "$APP_DIR"
info "Clone từ GitHub..."
git clone "$REPO_URL" "$APP_DIR" --quiet
cd "$APP_DIR"

info "Cài dependencies..."
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install --omit=dev --quiet

mkdir -p logs
log "Code đã clone và cài đặt tại $APP_DIR"

# ════════════════════════════════════════
#  BƯỚC 6 — TẠO FILE .ENV
# ════════════════════════════════════════
section "BƯỚC 6/8 — Tạo file .env"

cat > "$APP_DIR/.env" <<EOF
PORT=$APP_PORT
NODE_ENV=production
SESSION_SECRET=$SESSION_SECRET
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASS
EOF

chmod 600 "$APP_DIR/.env"
log "File .env đã tạo (bảo mật 600)"

# ════════════════════════════════════════
#  BƯỚC 7 — KHỞI ĐỘNG APP VỚI PM2
# ════════════════════════════════════════
section "BƯỚC 7/8 — Khởi động app với PM2"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$APP_DIR"

pm2 start ecosystem.config.js --env production --silent
pm2 save --silent

# Tạo PM2 startup script
pm2_startup=$(pm2 startup systemd -u root --hp /root 2>&1 | grep "sudo")
if [ -n "$pm2_startup" ]; then
  eval "$pm2_startup" > /dev/null 2>&1
fi

# Kiểm tra app đang chạy
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT/ --max-time 5 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  log "App đang chạy — HTTP $HTTP_STATUS"
else
  error "App không start được (HTTP $HTTP_STATUS). Xem logs: pm2 logs tailand-cafe"
fi

# ════════════════════════════════════════
#  BƯỚC 8 — CẤU HÌNH NGINX
# ════════════════════════════════════════
section "BƯỚC 8/8 — Cấu hình Nginx"

SERVER_NAME="_"
if [ -n "$DOMAIN" ]; then
  if [ "${USE_WWW:-y}" = "y" ]; then
    SERVER_NAME="$DOMAIN www.$DOMAIN"
  else
    SERVER_NAME="$DOMAIN"
  fi
fi

cat > /etc/nginx/sites-available/tailand-cafe <<NGINX
# TaiLand Cafe — Nginx config
server {
    listen 80;
    server_name $SERVER_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip
    gzip on;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Static files — phục vụ trực tiếp bởi Nginx
    location ~* ^/(css|js|images)/ {
        root $APP_DIR/public;
        expires 7d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy → Node.js
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
NGINX

# Kích hoạt site
ln -sf /etc/nginx/sites-available/tailand-cafe /etc/nginx/sites-enabled/tailand-cafe
rm -f /etc/nginx/sites-enabled/default

# Kiểm tra và reload
nginx -t > /dev/null 2>&1 && systemctl reload nginx
log "Nginx đã cấu hình và reload"

# ════════════════════════════════════════
#  CÀI SSL (nếu có domain)
# ════════════════════════════════════════
if [ -n "$DOMAIN" ]; then
  echo ""
  section "BONUS — Cài SSL Let's Encrypt (HTTPS miễn phí)"

  info "Cài Certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx

  read -rp "→ Email để nhận thông báo SSL (bắt buộc): " SSL_EMAIL

  if [ -n "$SSL_EMAIL" ]; then
    CERTBOT_DOMAINS="-d $DOMAIN"
    [ "${USE_WWW:-y}" = "y" ] && CERTBOT_DOMAINS="$CERTBOT_DOMAINS -d www.$DOMAIN"

    certbot --nginx \
      --non-interactive \
      --agree-tos \
      --email "$SSL_EMAIL" \
      $CERTBOT_DOMAINS \
      --redirect \
      2>&1 | tail -5

    log "SSL đã cài đặt — HTTPS đang hoạt động"

    # Auto-renew cron
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    log "Auto-renew SSL đã thiết lập (3AM mỗi ngày)"
  else
    warn "Bỏ qua SSL — không có email"
  fi
fi

# ════════════════════════════════════════
#  CẤU HÌNH FIREWALL
# ════════════════════════════════════════
section "Cấu hình Firewall (UFW)"

ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
log "Firewall: SSH + HTTP + HTTPS đã mở"

# ════════════════════════════════════════
#  HOÀN THÀNH
# ════════════════════════════════════════
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          🎉  DEPLOY THÀNH CÔNG! 🎉                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e " ${BOLD}Website:${NC}"

if [ -n "$DOMAIN" ]; then
  echo -e "   ${CYAN}https://$DOMAIN${NC}"
  [ "${USE_WWW:-y}" = "y" ] && echo -e "   ${CYAN}https://www.$DOMAIN${NC}"
else
  echo -e "   ${CYAN}http://$SERVER_IP${NC}"
fi

echo ""
echo -e " ${BOLD}Admin panel:${NC}"
if [ -n "$DOMAIN" ]; then
  echo -e "   ${CYAN}https://$DOMAIN/admin${NC}"
else
  echo -e "   ${CYAN}http://$SERVER_IP/admin${NC}"
fi
echo -e "   Username: ${YELLOW}$ADMIN_USER${NC}"
echo -e "   Password: ${YELLOW}(đã nhập lúc setup)${NC}"

echo ""
echo -e " ${BOLD}Lệnh quản lý:${NC}"
echo -e "   pm2 status                ${CYAN}# Xem trạng thái${NC}"
echo -e "   pm2 logs tailand-cafe     ${CYAN}# Xem logs${NC}"
echo -e "   pm2 restart tailand-cafe  ${CYAN}# Restart app${NC}"

echo ""
echo -e " ${BOLD}Cập nhật code sau này:${NC}"
echo -e "   cd $APP_DIR"
echo -e "   git pull origin main"
echo -e "   npm install --omit=dev"
echo -e "   pm2 restart tailand-cafe"

echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e " App dir   : $APP_DIR"
echo -e " Node      : $(node --version 2>/dev/null || echo 'v20')"
echo -e " PM2       : $(pm2 --version 2>/dev/null || echo 'latest')"
echo -e " Server IP : $SERVER_IP"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
