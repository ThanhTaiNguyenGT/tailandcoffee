const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getCoffeeIllustration } = require('./index');

const menuPath = path.join(__dirname, '../data/menu.json');
const readMenu = () => JSON.parse(fs.readFileSync(menuPath, 'utf8'));

router.get('/', (req, res) => {
  const menuData = readMenu();
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
