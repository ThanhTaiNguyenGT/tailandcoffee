const express = require('express');
const router = express.Router();
const menuData = require('../data/menu.json');
const { getCoffeeIllustration } = require('./index');

router.get('/', (req, res) => {
  const { cat } = req.query;
  const items = cat ? menuData.items.filter(i => i.category === cat) : menuData.items;
  const lang = res.locals.lang;
  res.render('menu', {
    title: lang === 'vi' ? 'Menu — TaiLand Cafe' : 'Menu — TaiLand Cafe',
    categories: menuData.categories,
    items,
    currentCat: cat || '',
    getCoffeeIllustration,
  });
});

module.exports = router;
