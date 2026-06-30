const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getBranchIllustration } = require('./index');

const branchesPath = path.join(__dirname, '../data/branches.json');
const readBranches = () => JSON.parse(fs.readFileSync(branchesPath, 'utf8'));

router.get('/', (req, res) => {
  const lang = res.locals.lang;
  res.render('branches', {
    title: lang === 'vi' ? 'Chi nhánh — TaiLand Cafe' : 'Locations — TaiLand Cafe',
    branches: readBranches().branches,
    getBranchIllustration,
  });
});

module.exports = router;
