const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAdmin } = require('../middleware/auth');

const menuPath = path.join(__dirname, '../data/menu.json');
const blogPath = path.join(__dirname, '../data/blog.json');
const bookingsPath = path.join(__dirname, '../data/bookings.json');

// Login
router.get('/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin — TaiLand Cafe' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USERNAME || 'admin') &&
      password === (process.env.ADMIN_PASSWORD || 'tailand2024')) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  req.flash('error', 'Sai tài khoản hoặc mật khẩu');
  res.redirect('/admin/login');
});

router.post('/logout', requireAdmin, (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', requireAdmin, (req, res) => {
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  const blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  const branchData = require('../data/branches.json');
  res.render('admin/dashboard', {
    title: 'Dashboard — Admin TaiLand',
    stats: {
      menuItems: menu.items.length,
      blogPosts: blog.posts.length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      branches: branchData.branches.length
    }
  });
});

// ── BOOKINGS ──
router.get('/bookings', requireAdmin, (req, res) => {
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  res.render('admin/bookings', {
    title: 'Quản lý đặt bàn — Admin TaiLand',
    bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

router.post('/bookings/:id/status', requireAdmin, (req, res) => {
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  const idx = bookings.findIndex(b => b.id === parseInt(req.params.id));
  if (idx !== -1) bookings[idx].status = req.body.status;
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
  req.flash('success', 'Cập nhật trạng thái thành công');
  res.redirect('/admin/bookings');
});

router.post('/bookings/:id/delete', requireAdmin, (req, res) => {
  let bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  bookings = bookings.filter(b => b.id !== parseInt(req.params.id));
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
  req.flash('success', 'Đã xóa đặt bàn');
  res.redirect('/admin/bookings');
});

// ── MENU ──
router.get('/menu', requireAdmin, (req, res) => {
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  res.render('admin/menu', {
    title: 'Quản lý menu — Admin TaiLand',
    categories: menu.categories,
    items: menu.items
  });
});

router.post('/menu/add', requireAdmin, (req, res) => {
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  const { category, name_vi, name_en, desc_vi, desc_en, price, featured } = req.body;
  menu.items.push({
    id: Date.now(),
    category, name_vi, name_en, desc_vi, desc_en,
    price: parseInt(price),
    image: '/images/menu/default.jpg',
    featured: featured === 'on',
    tag_vi: '', tag_en: ''
  });
  fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
  req.flash('success', 'Thêm món thành công');
  res.redirect('/admin/menu');
});

router.post('/menu/:id/delete', requireAdmin, (req, res) => {
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  menu.items = menu.items.filter(i => i.id !== parseInt(req.params.id));
  fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
  req.flash('success', 'Đã xóa món');
  res.redirect('/admin/menu');
});

// ── BLOG ──
router.get('/blog', requireAdmin, (req, res) => {
  const blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  res.render('admin/blog', {
    title: 'Quản lý blog — Admin TaiLand',
    posts: blog.posts
  });
});

router.post('/blog/add', requireAdmin, (req, res) => {
  const blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  const { title_vi, title_en, excerpt_vi, excerpt_en, content_vi, content_en, author, category_vi, category_en } = req.body;
  const slug = title_vi.toLowerCase()
    .replace(/[áàảãạăắặẳẵặâấầẩẫậ]/g, 'a')
    .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
    .replace(/[íìỉĩị]/g, 'i')
    .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
    .replace(/[úùủũụưứừửữự]/g, 'u')
    .replace(/[ýỳỷỹỵ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    + '-' + Date.now();
  blog.posts.unshift({
    id: Date.now(), slug,
    title_vi, title_en, excerpt_vi, excerpt_en,
    content_vi, content_en, author,
    date: new Date().toISOString().split('T')[0],
    category_vi, category_en,
    image: '/images/blog/default.jpg',
    featured: false
  });
  fs.writeFileSync(blogPath, JSON.stringify(blog, null, 2));
  req.flash('success', 'Đăng bài thành công');
  res.redirect('/admin/blog');
});

router.post('/blog/:id/delete', requireAdmin, (req, res) => {
  const blog = JSON.parse(fs.readFileSync(blogPath, 'utf8'));
  blog.posts = blog.posts.filter(p => p.id !== parseInt(req.params.id));
  fs.writeFileSync(blogPath, JSON.stringify(blog, null, 2));
  req.flash('success', 'Đã xóa bài viết');
  res.redirect('/admin/blog');
});

module.exports = router;
