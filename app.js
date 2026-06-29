require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'tailand_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Flash messages
app.use(flash());

// Global locals
app.use((req, res, next) => {
  res.locals.lang = req.query.lang || req.session.lang || 'vi';
  if (req.query.lang) req.session.lang = req.query.lang;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.currentPath = req.path;
  next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/menu', require('./routes/menu'));
app.use('/booking', require('./routes/booking'));
app.use('/branches', require('./routes/branches'));
app.use('/blog', require('./routes/blog'));
app.use('/admin', require('./routes/admin'));

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

app.listen(PORT, () => {
  console.log(`✅ TaiLand Cafe running at http://localhost:${PORT}`);
});
