const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getBlogIllustration } = require('./index');

const blogPath = path.join(__dirname, '../data/blog.json');
const readBlog = () => JSON.parse(fs.readFileSync(blogPath, 'utf8'));

router.get('/', (req, res) => {
  const lang = res.locals.lang;
  res.render('blog', {
    title: lang === 'vi' ? 'Blog — TaiLand Cafe' : 'Blog — TaiLand Cafe',
    posts: readBlog().posts,
    getBlogIllustration,
  });
});

router.get('/:slug', (req, res) => {
  const lang = res.locals.lang;
  const post = readBlog().posts.find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).render('404', { title: 'Bài viết không tồn tại' });
  res.render('blog-post', {
    title: `${lang === 'vi' ? post.title_vi : post.title_en} — TaiLand Cafe`,
    post,
    getBlogIllustration,
  });
});

module.exports = router;
