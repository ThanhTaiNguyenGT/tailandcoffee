const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const { requireAdmin } = require('../middleware/auth');
const github  = require('../services/github');

// ── Multer: upload hình menu ──
const menuImgStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/images/menu');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `item-${req.params.id}-${Date.now()}${ext}`);
  },
});
const uploadMenuImg = multer({
  storage: menuImgStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF'));
  },
});

const menuPath     = path.join(__dirname, '../data/menu.json');
const blogPath     = path.join(__dirname, '../data/blog.json');
const bookingsPath = path.join(__dirname, '../data/bookings.json');
const branchesPath = path.join(__dirname, '../data/branches.json');

// ── Helper: đọc JSON ──
const readJSON  = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJSON = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

// ── Helper: sync lên GitHub (không block response nếu lỗi) ──
async function syncToGitHub(filename, data, message) {
  const result = await github.pushFile(filename, data, message);
  if (!result.success) {
    console.warn(`[GitHub Sync] ${filename}: ${result.error}`);
  } else {
    console.log(`[GitHub Sync] ${filename} → commit ${result.commit}`);
  }
  return result;
}

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
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

// ════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════
router.get('/', requireAdmin, async (req, res) => {
  const menu     = readJSON(menuPath);
  const blog     = readJSON(blogPath);
  const bookings = readJSON(bookingsPath);
  const branches = readJSON(branchesPath);

  // Kiểm tra kết nối GitHub (không cần await — hiển thị async)
  const ghStatus = await github.checkConnection().catch(() => ({ connected: false, error: 'Timeout' }));

  res.render('admin/dashboard', {
    title: 'Dashboard — Admin TaiLand',
    stats: {
      menuItems      : menu.items.length,
      blogPosts      : blog.posts.length,
      totalBookings  : bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      branches       : branches.branches.length,
    },
    ghStatus,
  });
});

// ── Manual sync all files ──
router.post('/sync', requireAdmin, async (req, res) => {
  const results = [];

  const menu     = readJSON(menuPath);
  const blog     = readJSON(blogPath);
  const branches = readJSON(branchesPath);
  const bookings = readJSON(bookingsPath);

  const jobs = [
    syncToGitHub('menu.json',     menu,     '[Admin] Sync menu.json'),
    syncToGitHub('blog.json',     blog,     '[Admin] Sync blog.json'),
    syncToGitHub('branches.json', branches, '[Admin] Sync branches.json'),
    syncToGitHub('bookings.json', bookings, '[Admin] Sync bookings.json'),
  ];

  const settled = await Promise.allSettled(jobs);
  settled.forEach((r, i) => {
    const names = ['menu.json','blog.json','branches.json','bookings.json'];
    results.push({ file: names[i], ...(r.value || { success: false, error: r.reason?.message }) });
  });

  const allOk = results.every(r => r.success);
  if (allOk) {
    req.flash('success', `✓ Đã sync ${results.length} files lên GitHub thành công!`);
  } else {
    const failed = results.filter(r => !r.success).map(r => r.file).join(', ');
    req.flash('error', `Sync thất bại: ${failed}. Kiểm tra GITHUB_TOKEN trong .env`);
  }
  res.redirect('/admin');
});

// ════════════════════════════════════════
//  BOOKINGS
// ════════════════════════════════════════
router.get('/bookings', requireAdmin, (req, res) => {
  const bookings = readJSON(bookingsPath);
  res.render('admin/bookings', {
    title   : 'Quản lý đặt bàn — Admin TaiLand',
    bookings: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
});

router.post('/bookings/:id/status', requireAdmin, async (req, res) => {
  const bookings = readJSON(bookingsPath);
  const idx = bookings.findIndex(b => b.id === parseInt(req.params.id));
  if (idx !== -1) bookings[idx].status = req.body.status;
  writeJSON(bookingsPath, bookings);

  // Sync lên GitHub (background, không chờ)
  syncToGitHub('bookings.json', bookings, `[Admin] Cập nhật trạng thái booking #${req.params.id}`);

  req.flash('success', 'Cập nhật trạng thái thành công');
  res.redirect('/admin/bookings');
});

router.post('/bookings/:id/delete', requireAdmin, async (req, res) => {
  let bookings = readJSON(bookingsPath);
  bookings = bookings.filter(b => b.id !== parseInt(req.params.id));
  writeJSON(bookingsPath, bookings);

  syncToGitHub('bookings.json', bookings, `[Admin] Xóa booking #${req.params.id}`);

  req.flash('success', 'Đã xóa đặt bàn');
  res.redirect('/admin/bookings');
});

// ════════════════════════════════════════
//  MENU
// ════════════════════════════════════════
router.get('/menu', requireAdmin, (req, res) => {
  const menu = readJSON(menuPath);
  res.render('admin/menu', {
    title     : 'Quản lý menu — Admin TaiLand',
    categories: menu.categories,
    items     : menu.items,
  });
});

router.post('/menu/add', requireAdmin, async (req, res) => {
  const menu = readJSON(menuPath);
  const { category, name_vi, name_en, desc_vi, desc_en, price, featured, tag_vi, tag_en } = req.body;

  const newItem = {
    id      : Date.now(),
    category,
    name_vi, name_en,
    desc_vi, desc_en,
    price   : parseInt(price),
    image   : '/images/menu/default.jpg',
    featured: featured === 'on',
    tag_vi  : tag_vi  || '',
    tag_en  : tag_en  || '',
  };
  menu.items.push(newItem);
  writeJSON(menuPath, menu);

  // Sync lên GitHub ngay lập tức
  const gh = await syncToGitHub('menu.json', menu, `[Admin] Thêm món: ${name_vi}`);
  if (gh.success) {
    req.flash('success', `✓ Thêm "${name_vi}" thành công & đã sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Thêm "${name_vi}" thành công (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/menu');
});

// ── Upload hình ảnh cho món ──
router.post('/menu/:id/image', requireAdmin, (req, res, next) => {
  uploadMenuImg.single('image')(req, res, async (err) => {
    if (err) {
      req.flash('error', err.message || 'Upload thất bại');
      return res.redirect('/admin/menu');
    }
    if (!req.file) {
      req.flash('error', 'Chưa chọn file ảnh');
      return res.redirect('/admin/menu');
    }

    const menu = readJSON(menuPath);
    const item = menu.items.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      req.flash('error', 'Không tìm thấy món');
      return res.redirect('/admin/menu');
    }

    // Xóa ảnh cũ nếu có (không phải default)
    if (item.image && item.image !== '/images/menu/default.jpg') {
      const oldPath = path.join(__dirname, '../public', item.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    item.image = '/images/menu/' + req.file.filename;
    writeJSON(menuPath, menu);

    const gh = await syncToGitHub('menu.json', menu, `[Admin] Cập nhật hình: ${item.name_vi}`);
    if (gh.success) {
      req.flash('success', `✓ Cập nhật hình "${item.name_vi}" thành công & đã sync GitHub`);
    } else {
      req.flash('success', `✓ Cập nhật hình "${item.name_vi}" thành công`);
    }
    res.redirect('/admin/menu');
  });
});

// ── Xóa hình ảnh món (về SVG mặc định) ──
router.post('/menu/:id/image/delete', requireAdmin, async (req, res) => {
  const menu = readJSON(menuPath);
  const item = menu.items.find(i => i.id === parseInt(req.params.id));
  if (item) {
    if (item.image && item.image !== '/images/menu/default.jpg') {
      const oldPath = path.join(__dirname, '../public', item.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    item.image = '/images/menu/default.jpg';
    writeJSON(menuPath, menu);
    syncToGitHub('menu.json', menu, `[Admin] Xóa hình: ${item.name_vi}`);
    req.flash('success', `✓ Đã xóa hình "${item.name_vi}" — dùng minh họa mặc định`);
  }
  res.redirect('/admin/menu');
});

// ── Sửa món ──
router.get('/menu/:id/edit', requireAdmin, (req, res) => {
  const menu = readJSON(menuPath);
  const item = menu.items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    req.flash('error', 'Không tìm thấy món');
    return res.redirect('/admin/menu');
  }
  res.render('admin/menu-edit', {
    title: `Sửa món: ${item.name_vi} — Admin TaiLand`,
    item,
    categories: menu.categories,
  });
});

router.post('/menu/:id/edit', requireAdmin, async (req, res) => {
  const menu = readJSON(menuPath);
  const item = menu.items.find(i => i.id === parseInt(req.params.id));
  if (!item) {
    req.flash('error', 'Không tìm thấy món');
    return res.redirect('/admin/menu');
  }

  const { category, name_vi, name_en, desc_vi, desc_en, price, featured, tag_vi, tag_en } = req.body;
  Object.assign(item, {
    category, name_vi, name_en, desc_vi, desc_en,
    price: parseInt(price),
    featured: featured === 'on',
    tag_vi: tag_vi || '',
    tag_en: tag_en || '',
  });
  writeJSON(menuPath, menu);

  const gh = await syncToGitHub('menu.json', menu, `[Admin] Cập nhật món: ${name_vi}`);
  if (gh.success) {
    req.flash('success', `✓ Cập nhật "${name_vi}" thành công & đã sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Cập nhật "${name_vi}" thành công (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/menu');
});

router.post('/menu/:id/delete', requireAdmin, async (req, res) => {
  const menu = readJSON(menuPath);
  const item = menu.items.find(i => i.id === parseInt(req.params.id));
  menu.items = menu.items.filter(i => i.id !== parseInt(req.params.id));
  writeJSON(menuPath, menu);

  const gh = await syncToGitHub('menu.json', menu, `[Admin] Xóa món: ${item?.name_vi || req.params.id}`);
  if (gh.success) {
    req.flash('success', `✓ Đã xóa món & sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Đã xóa món (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/menu');
});

// ════════════════════════════════════════
//  BLOG
// ════════════════════════════════════════
router.get('/blog', requireAdmin, (req, res) => {
  const blog = readJSON(blogPath);
  res.render('admin/blog', {
    title: 'Quản lý blog — Admin TaiLand',
    posts: blog.posts,
  });
});

router.post('/blog/add', requireAdmin, async (req, res) => {
  const blog = readJSON(blogPath);
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
    title_vi, title_en,
    excerpt_vi, excerpt_en,
    content_vi, content_en,
    author,
    date        : new Date().toISOString().split('T')[0],
    category_vi, category_en,
    image       : '/images/blog/default.jpg',
    featured    : false,
  });
  writeJSON(blogPath, blog);

  const gh = await syncToGitHub('blog.json', blog, `[Admin] Đăng bài: ${title_vi}`);
  if (gh.success) {
    req.flash('success', `✓ Đăng bài thành công & đã sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Đăng bài thành công (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/blog');
});

// ── Sửa bài blog ──
router.get('/blog/:id/edit', requireAdmin, (req, res) => {
  const blog = readJSON(blogPath);
  const post = blog.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    req.flash('error', 'Không tìm thấy bài viết');
    return res.redirect('/admin/blog');
  }
  res.render('admin/blog-edit', {
    title: `Sửa bài: ${post.title_vi} — Admin TaiLand`,
    post,
  });
});

router.post('/blog/:id/edit', requireAdmin, async (req, res) => {
  const blog = readJSON(blogPath);
  const post = blog.posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    req.flash('error', 'Không tìm thấy bài viết');
    return res.redirect('/admin/blog');
  }

  const { title_vi, title_en, excerpt_vi, excerpt_en, content_vi, content_en, author, category_vi, category_en, featured } = req.body;
  Object.assign(post, {
    title_vi, title_en, excerpt_vi, excerpt_en, content_vi, content_en,
    author, category_vi, category_en,
    featured: featured === 'on',
  });
  writeJSON(blogPath, blog);

  const gh = await syncToGitHub('blog.json', blog, `[Admin] Cập nhật bài: ${title_vi}`);
  if (gh.success) {
    req.flash('success', `✓ Cập nhật bài "${title_vi}" thành công & đã sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Cập nhật bài "${title_vi}" thành công (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/blog');
});

router.post('/blog/:id/delete', requireAdmin, async (req, res) => {
  const blog = readJSON(blogPath);
  const post = blog.posts.find(p => p.id === parseInt(req.params.id));
  blog.posts = blog.posts.filter(p => p.id !== parseInt(req.params.id));
  writeJSON(blogPath, blog);

  const gh = await syncToGitHub('blog.json', blog, `[Admin] Xóa bài: ${post?.title_vi || req.params.id}`);
  if (gh.success) {
    req.flash('success', `✓ Đã xóa bài & sync lên GitHub (commit ${gh.commit})`);
  } else {
    req.flash('success', `✓ Đã xóa bài (chưa sync GitHub: ${gh.error})`);
  }
  res.redirect('/admin/blog');
});

module.exports = router;
