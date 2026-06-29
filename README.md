# TaiLand Cafe — Website

Chuỗi cửa hàng café **TaiLand** — *Nơi cảm hứng hội tụ*  
Song ngữ Việt / English · Modern Minimalist Design

**Stack:** Node.js · Express.js · EJS · JSON storage  
**Design:** Charcoal `#1C1C1C` + Cream `#FAF7F2` + Gold `#C9A96E` · Playfair Display + Inter

---

## Quick Start (Local)

```bash
git clone https://github.com/ThanhTaiNguyenGT/tailandcoffee.git
cd tailandcoffee
npm install
cp .env.example .env       # chỉnh SESSION_SECRET & ADMIN_PASSWORD
npm run dev                 # http://localhost:3000
```

**Admin panel:** `http://localhost:3000/admin`  
Default: `admin` / `tailand2024` (đổi trong `.env` trước khi deploy)

---

## Deploy lên Hostinger VPS

Xem hướng dẫn chi tiết: **[DEPLOY.md](DEPLOY.md)**

---

## Cấu trúc dự án

```
tailandcoffee/
├── app.js                  # Express entry point
├── routes/                 # index, menu, booking, branches, blog, admin
├── middleware/auth.js      # Admin session guard
├── views/
│   ├── partials/           # header, footer
│   ├── admin/              # dashboard, menu, blog, bookings, login
│   └── *.ejs               # index, menu, booking, branches, blog, 404
├── public/
│   ├── css/style.css       # Design system (CSS variables)
│   └── js/main.js          # Nav, scroll reveal, forms
├── data/                   # menu.json, branches.json, blog.json, bookings.json
├── .env.example            # Environment template
├── ecosystem.config.js     # PM2 config
└── DEPLOY.md               # Hướng dẫn deploy Hostinger
```

## Trang & Tính năng

| Trang | URL | Mô tả |
|-------|-----|--------|
| Trang chủ | `/` | Hero, featured drinks, about, blog preview, CTA |
| Menu | `/menu` | Lọc theo danh mục, SVG illustrations |
| Đặt bàn | `/booking` | Form đặt bàn có xác nhận |
| Chi nhánh | `/branches` | Địa chỉ, giờ mở cửa, Google Maps |
| Blog | `/blog` | Bài viết song ngữ |
| Admin | `/admin` | Dashboard, quản lý menu/blog/booking |

## Tuỳ chỉnh

| Nội dung | File |
|---------|------|
| Màu sắc & Typography | `public/css/style.css` → `:root` |
| Menu thức uống | `data/menu.json` |
| Thông tin chi nhánh | `data/branches.json` |
| Bài viết blog | `data/blog.json` hoặc qua `/admin/blog` |
| Admin credentials | `.env` → `ADMIN_USERNAME` / `ADMIN_PASSWORD` |
