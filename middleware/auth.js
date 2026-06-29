module.exports = {
  requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/admin/login');
  }
};
