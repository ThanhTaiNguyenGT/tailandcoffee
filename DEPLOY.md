# Hướng dẫn Deploy TaiLand Cafe lên Hostinger VPS

---

## Yêu cầu
- Hostinger VPS (KVM 1 hoặc cao hơn) với Ubuntu 22.04
- Tên miền đã trỏ về IP của VPS
- SSH access vào server

---

## BƯỚC 1 — Kết nối SSH vào VPS

```bash
ssh root@YOUR_SERVER_IP
```

> Thay `YOUR_SERVER_IP` bằng IP VPS trong Hostinger hPanel → VPS → Manage

---

## BƯỚC 2 — Cài đặt Node.js 20 LTS

```bash
# Cài NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Nạp NVM vào shell hiện tại
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

# Cài Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Xác nhận
node --version    # v20.x.x
npm --version     # 10.x.x
```

---

## BƯỚC 3 — Cài PM2 (process manager)

```bash
npm install -g pm2
```

---

## BƯỚC 4 — Cài Nginx (reverse proxy)

```bash
apt update && apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## BƯỚC 5 — Clone code từ GitHub

```bash
# Tạo thư mục app
mkdir -p /var/www/tailand-cafe
cd /var/www/tailand-cafe

# Clone repo
git clone https://github.com/ThanhTaiNguyenGT/tailandcoffee.git .

# Cài dependencies (production only)
npm install --omit=dev

# Tạo thư mục logs
mkdir -p logs
```

---

## BƯỚC 6 — Tạo file .env

```bash
cp .env.example .env
nano .env
```

Điền nội dung như sau (thay giá trị thực):

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=TaiLand@2024!XrandomStringDayNhaNho64kytu
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MatKhauManhCuaBan@2024
```

> **Lưu ý:** `SESSION_SECRET` nên là chuỗi ngẫu nhiên ít nhất 32 ký tự.  
> Tạo nhanh bằng: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Lưu file: `Ctrl+O` → `Enter` → `Ctrl+X`

---

## BƯỚC 7 — Khởi động app với PM2

```bash
cd /var/www/tailand-cafe

# Start bằng ecosystem config
pm2 start ecosystem.config.js --env production

# Xem trạng thái
pm2 status

# Xem logs realtime
pm2 logs tailand-cafe

# Tự động start lại sau khi reboot server
pm2 startup
# → Copy lệnh mà PM2 hiển thị, paste và chạy
pm2 save
```

Kiểm tra app đang chạy:
```bash
curl http://localhost:3000
# → Phải trả về HTML của trang chủ
```

---

## BƯỚC 8 — Cấu hình Nginx reverse proxy

```bash
nano /etc/nginx/sites-available/tailand-cafe
```

Dán nội dung sau (thay `yourdomain.com` bằng tên miền thực):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Static files served directly by Nginx (nhanh hơn)
    location /css/ {
        alias /var/www/tailand-cafe/public/css/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location /js/ {
        alias /var/www/tailand-cafe/public/js/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location /images/ {
        alias /var/www/tailand-cafe/public/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy tất cả request còn lại về Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

Kích hoạt site và khởi động lại Nginx:

```bash
# Tạo symlink kích hoạt
ln -s /etc/nginx/sites-available/tailand-cafe /etc/nginx/sites-enabled/

# Xóa config default (nếu còn)
rm -f /etc/nginx/sites-enabled/default

# Kiểm tra cú pháp
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## BƯỚC 9 — Cài SSL miễn phí (HTTPS) với Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx

# Cấp SSL cho domain (thay yourdomain.com)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Nhập email, chấp nhận terms, chọn redirect HTTP → HTTPS
```

Certbot sẽ tự cập nhật Nginx config và thêm chứng chỉ SSL.  
SSL tự động gia hạn — kiểm tra bằng:
```bash
certbot renew --dry-run
```

---

## BƯỚC 10 — Kiểm tra hoàn chỉnh

```bash
# App status
pm2 status

# Nginx status
systemctl status nginx

# Test HTTPS
curl -I https://yourdomain.com
# → HTTP/2 200

# Xem logs app
pm2 logs tailand-cafe --lines 20
```

Mở trình duyệt: `https://yourdomain.com` — website hoạt động! 🎉

---

## Cập nhật code (Deploy mới)

Mỗi khi có code mới push lên GitHub, SSH vào server và chạy:

```bash
cd /var/www/tailand-cafe
git pull origin main
npm install --omit=dev
pm2 restart tailand-cafe
```

---

## Lệnh PM2 hữu ích

| Lệnh | Mô tả |
|------|-------|
| `pm2 status` | Xem trạng thái tất cả app |
| `pm2 logs tailand-cafe` | Xem logs realtime |
| `pm2 restart tailand-cafe` | Restart app |
| `pm2 stop tailand-cafe` | Dừng app |
| `pm2 monit` | Dashboard CPU/RAM |

---

## Xử lý sự cố

**App không start:**
```bash
pm2 logs tailand-cafe --err --lines 50
# Xem lỗi cụ thể
```

**Nginx 502 Bad Gateway:**
```bash
# Kiểm tra Node app có đang chạy không
curl http://localhost:3000
pm2 status
```

**SSL không gia hạn:**
```bash
certbot renew
systemctl reload nginx
```

**Xem IP server:**
```bash
curl ifconfig.me
```

---

## Thông tin Admin

Sau khi deploy, truy cập admin tại:  
`https://yourdomain.com/admin`

Username / Password: như đã set trong file `.env`
