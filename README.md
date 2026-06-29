# TaiLand Cafe Website

Website cho chuỗi cửa hàng café TaiLand — phong cách Warm Vintage, song ngữ Việt-Anh.

**Stack:** Node.js · Express.js · EJS · JSON file storage  
**Design:** Moss Green (`#4A5240`) + Cream (`#EDE8D5`) · Playfair Display + Inter

## Features

- 🏠 Trang chủ với hero, featured drinks, about, blog preview
- ☕ Menu với lọc danh mục (Cà phê / Trà sữa / Sinh tố / Bánh)
- 📅 Đặt bàn online (form + flash confirmation)
- 📍 Chi nhánh (Quận 1 + Thủ Đức) với link Google Maps
- 📝 Blog song ngữ
- 🔐 Admin panel: quản lý đặt bàn, menu, blog
- 🌐 Bilingual VI/EN via `?lang=` query param

## Quick Start

```bash
cd tailand-cafe
npm install
cp .env.example .env
# Chỉnh sửa .env nếu cần (PORT, SESSION_SECRET, ADMIN_PASSWORD)
npm start
# → http://localhost:3000
```

**Admin panel:** http://localhost:3000/admin  
Default credentials: `admin` / `tailand2024` (set trong `.env`)

## Project Structure

```
tailand-cafe/
├── app.js              # Express app + middleware
├── routes/             # index, menu, booking, branches, blog, admin
├── middleware/auth.js  # requireAdmin middleware
├── views/
│   ├── partials/       # header, footer, admin-header, admin-footer
│   ├── admin/          # login, dashboard, menu, blog, bookings
│   └── *.ejs           # index, menu, booking, branches, blog, blog-post, 404
├── public/
│   ├── css/style.css   # Design system (CSS custom properties)
│   └── js/main.js      # Nav toggle, scroll reveal, booking form
└── data/               # menu.json, branches.json, blog.json, bookings.json
```

## Deploy lên Hostinger (Node.js Hosting)

### 1. Push lên GitHub

```bash
git init
git add .
git commit -m "Initial commit: TaiLand Cafe website"
git remote add origin https://github.com/YOUR_USERNAME/tailand-cafe.git
git push -u origin main
```

### 2. Cài đặt trên Hostinger

1. **Hostinger hPanel** → **Websites** → chọn hosting → **Node.js**
2. **Enable Node.js**, chọn version 18 hoặc 20
3. **Application root:** `/public_html/tailand-cafe` (hoặc root nếu dùng subdomain)
4. **Entry point:** `app.js`
5. **Application URL:** domain của bạn

### 3. Upload code

**Option A — File Manager:**
- Zip toàn bộ project (trừ `node_modules/`)
- Hostinger File Manager → upload → unzip

**Option B — SSH:**
```bash
ssh user@your-server
cd public_html
git clone https://github.com/YOUR_USERNAME/tailand-cafe.git .
npm install --production
```

### 4. Environment Variables

Trong Hostinger hPanel → **Node.js** → **Environment Variables**:

```
SESSION_SECRET=<random-long-string>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong-password>
NODE_ENV=production
PORT=3000
```

### 5. Start App

Hostinger → **Node.js** → **Start Application**

### 6. Custom Domain

Hostinger → **Domains** → point domain → **DNS** → A record → server IP

---

## Admin Usage

| URL | Chức năng |
|-----|-----------|
| `/admin` | Dashboard (thống kê) |
| `/admin/bookings` | Xem & cập nhật trạng thái đặt bàn |
| `/admin/menu` | Thêm / xóa món trong menu |
| `/admin/blog` | Viết & xóa bài blog |

## Bilingual

Thêm `?lang=vi` hoặc `?lang=en` vào bất kỳ URL nào. Session sẽ ghi nhớ lựa chọn.

## Customization

- **Colors:** `/public/css/style.css` → `:root` CSS variables
- **Menu items:** `/data/menu.json`
- **Branches:** `/data/branches.json`
- **Blog posts:** `/data/blog.json` (hoặc qua Admin panel)
