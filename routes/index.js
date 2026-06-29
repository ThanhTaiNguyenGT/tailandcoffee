const express = require('express');
const router = express.Router();
const menuData = require('../data/menu.json');
const blogData = require('../data/blog.json');
const branchData = require('../data/branches.json');

// SVG palette config
const PALETTES = {
  coffee:   { bg: '#2a2520', liquid: '#6B4226', foam: '#C9A96E', rim: '#F5F0E8' },
  'milk-tea':{ bg: '#1e2a24', liquid: '#7FB69E', foam: '#D4EDE5', rim: '#F5F0E8' },
  smoothie: { bg: '#1f2716', liquid: '#5A8C3A', foam: '#A8D880', rim: '#F5F0E8' },
  cake:     { bg: '#261e16', liquid: '#C8963E', foam: '#F0D9B5', rim: '#F5F0E8' },
};

function getCoffeeIllustration(category, idx) {
  const p = PALETTES[category] || PALETTES.coffee;
  const hue = idx * 37;
  return `<svg viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="280" height="210" fill="${p.bg}"/>
    <circle cx="${180 + Math.sin(hue)*20}" cy="${60 + Math.cos(hue)*15}" r="60" fill="${p.foam}" opacity=".06"/>
    <ellipse cx="140" cy="180" rx="80" ry="10" fill="#000" opacity=".25"/>
    <ellipse cx="140" cy="172" rx="68" ry="10" fill="${p.rim}" opacity=".95"/>
    <path d="M88 110 Q80 152 96 170 Q116 182 164 182 Q184 172 196 152 Q206 110 196 110Z" fill="${p.rim}"/>
    <ellipse cx="142" cy="122" rx="44" ry="14" fill="${p.liquid}"/>
    <ellipse cx="142" cy="116" rx="32" ry="10" fill="${p.foam}" opacity=".85"/>
    <path d="M120 116 Q142 106 162 116 Q150 126 130 122Z" fill="#fff" opacity=".5"/>
    <path d="M196 128 Q220 128 220 144 Q220 162 196 164" stroke="${p.rim}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M126 88 Q130 78 126 68" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M140 82 Q145 70 140 58" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M154 88 Q158 78 154 68" stroke="rgba(255,255,255,0.18)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="56" cy="50" r="8" fill="${p.foam}" opacity=".12"/>
    <circle cx="230" cy="70" r="6" fill="${p.foam}" opacity=".1"/>
    <circle cx="48" cy="160" r="5" fill="${p.foam}" opacity=".08"/>
  </svg>`;
}

function getBlogIllustration(idx) {
  const schemes = [
    { bg: '#1C1C1C', accent: '#C9A96E', line: '#FAF7F2' },
    { bg: '#1a2420', accent: '#7FB69E', line: '#FAF7F2' },
    { bg: '#201a10', accent: '#C8963E', line: '#FAF7F2' },
  ];
  const s = schemes[idx % schemes.length];
  return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="400" height="225" fill="${s.bg}"/>
    <circle cx="340" cy="40" r="80" fill="${s.accent}" opacity=".08"/>
    <circle cx="60" cy="180" r="60" fill="${s.accent}" opacity=".06"/>
    <rect x="60" y="60" width="280" height="3" rx="2" fill="${s.line}" opacity=".12"/>
    <rect x="60" y="76" width="200" height="3" rx="2" fill="${s.line}" opacity=".08"/>
    <rect x="60" y="92" width="240" height="3" rx="2" fill="${s.line}" opacity=".1"/>
    <rect x="60" y="120" width="120" height="40" rx="6" fill="${s.accent}" opacity=".15"/>
    <rect x="200" y="120" width="140" height="40" rx="6" fill="${s.line}" opacity=".05"/>
    <circle cx="200" cy="160" r="28" fill="${s.accent}" opacity=".2"/>
    <path d="M192 160 L208 160 M200 152 L200 168" stroke="${s.accent}" stroke-width="3" stroke-linecap="round"/>
    <rect x="60" y="178" width="160" height="3" rx="2" fill="${s.line}" opacity=".07"/>
  </svg>`;
}

function getBranchIllustration(idx) {
  const schemes = [
    { bg: '#1C1C1C', window: '#C9A96E', wall: '#2a2520' },
    { bg: '#1a2420', window: '#7FB69E', wall: '#1e2a24' },
  ];
  const s = schemes[idx % schemes.length];
  return `<svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="480" height="270" fill="${s.bg}"/>
    <!-- Sky gradient -->
    <rect width="480" height="270" fill="url(#sky${idx})"/>
    <defs>
      <linearGradient id="sky${idx}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.wall}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0a0a0a" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <!-- Building -->
    <rect x="80" y="60" width="320" height="180" rx="4" fill="${s.wall}" opacity=".9"/>
    <!-- Awning -->
    <path d="M70 130 L240 110 L410 130Z" fill="${s.window}" opacity=".6"/>
    <!-- Door -->
    <rect x="200" y="170" width="80" height="70" rx="4" fill="#0a0a0a" opacity=".7"/>
    <rect x="235" y="170" width="3" height="70" fill="${s.window}" opacity=".3"/>
    <!-- Windows -->
    <rect x="100" y="80" width="70" height="50" rx="3" fill="${s.window}" opacity=".25"/>
    <rect x="310" y="80" width="70" height="50" rx="3" fill="${s.window}" opacity=".25"/>
    <rect x="100" y="90" width="70" height="1.5" fill="${s.window}" opacity=".3"/>
    <rect x="137" y="82" width="1.5" height="46" fill="${s.window}" opacity=".3"/>
    <rect x="310" y="90" width="70" height="1.5" fill="${s.window}" opacity=".3"/>
    <rect x="347" y="82" width="1.5" height="46" fill="${s.window}" opacity=".3"/>
    <!-- Sign -->
    <rect x="160" y="138" width="160" height="28" rx="4" fill="${s.window}" opacity=".15"/>
    <!-- Ground -->
    <rect x="0" y="240" width="480" height="30" fill="#0a0a0a" opacity=".5"/>
    <!-- Light reflections -->
    <ellipse cx="135" cy="105" rx="30" ry="18" fill="${s.window}" opacity=".08"/>
    <ellipse cx="345" cy="105" rx="30" ry="18" fill="${s.window}" opacity=".08"/>
  </svg>`;
}

router.get('/', (req, res) => {
  const featured = menuData.items.filter(i => i.featured).slice(0, 4);
  const recentPosts = blogData.posts.slice(0, 3);
  const lang = res.locals.lang;
  res.render('index', {
    title: lang === 'vi' ? 'TaiLand Cafe — Nơi cảm hứng hội tụ' : 'TaiLand Cafe — Where Inspiration Converges',
    featured,
    recentPosts,
    branches: branchData.branches,
    getCoffeeIllustration,
    getBlogIllustration,
    getBranchIllustration,
  });
});

module.exports = router;
module.exports.getCoffeeIllustration = getCoffeeIllustration;
module.exports.getBlogIllustration = getBlogIllustration;
module.exports.getBranchIllustration = getBranchIllustration;
