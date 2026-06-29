const express = require('express');
const router = express.Router();
const branchData = require('../data/branches.json');
const { getBranchIllustration } = require('./index');

router.get('/', (req, res) => {
  const lang = res.locals.lang;
  res.render('branches', {
    title: lang === 'vi' ? 'Chi nhánh — TaiLand Cafe' : 'Locations — TaiLand Cafe',
    branches: branchData.branches,
    getBranchIllustration,
  });
});

module.exports = router;
