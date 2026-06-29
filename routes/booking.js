const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const branchData = require('../data/branches.json');
const bookingsPath = path.join(__dirname, '../data/bookings.json');

router.get('/', (req, res) => {
  res.render('booking', {
    title: 'Đặt bàn — TaiLand Cafe',
    branches: branchData.branches
  });
});

router.post('/', (req, res) => {
  const { name, phone, email, branch, date, time, guests, note } = req.body;
  if (!name || !phone || !branch || !date || !time || !guests) {
    req.flash('error', 'Vui lòng điền đầy đủ thông tin bắt buộc');
    return res.redirect('/booking');
  }
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  const newBooking = {
    id: Date.now(),
    name, phone, email: email || '',
    branch, date, time,
    guests: parseInt(guests),
    note: note || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  bookings.push(newBooking);
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));
  req.flash('success', `Đặt bàn thành công! Chúng tôi sẽ xác nhận qua SĐT ${phone} trong 30 phút.`);
  res.redirect('/booking');
});

module.exports = router;
