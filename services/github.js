/**
 * GitHub Sync Service
 * Tự động push file JSON lên GitHub sau mỗi thay đổi từ Admin panel.
 *
 * Flow: Admin thêm/xóa món → ghi file local → gọi pushFile() → GitHub API → website đồng bộ
 *
 * Cần 3 biến trong .env:
 *   GITHUB_TOKEN  — Personal Access Token (repo scope)
 *   GITHUB_OWNER  — username GitHub (ví dụ: ThanhTaiNguyenGT)
 *   GITHUB_REPO   — tên repo (ví dụ: tailandcoffee)
 */

const https = require('https');

const GITHUB_API = 'api.github.com';
const OWNER     = process.env.GITHUB_OWNER || '';
const REPO      = process.env.GITHUB_REPO  || '';
const TOKEN     = process.env.GITHUB_TOKEN || '';
const BRANCH    = process.env.GITHUB_BRANCH || 'main';

// Map tên file local → đường dẫn trong repo
const FILE_MAP = {
  'menu.json'     : 'data/menu.json',
  'blog.json'     : 'data/blog.json',
  'branches.json' : 'data/branches.json',
  'bookings.json' : 'data/bookings.json',
};

/**
 * Gọi GitHub REST API
 * @param {string} method  GET | PUT
 * @param {string} endpoint  ví dụ: /repos/owner/repo/contents/data/menu.json
 * @param {object} body  payload JSON (với PUT)
 */
function githubRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: GITHUB_API,
      path: endpoint,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept'       : 'application/vnd.github+json',
        'User-Agent'   : 'TaiLand-Cafe-Admin/1.0',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`GitHub API ${res.statusCode}: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`GitHub API parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Lấy SHA hiện tại của file trên GitHub (bắt buộc khi update)
 */
async function getFileSHA(repoPath) {
  try {
    const res = await githubRequest('GET', `/repos/${OWNER}/${REPO}/contents/${repoPath}?ref=${BRANCH}`);
    return res.sha || null;
  } catch {
    return null; // File chưa tồn tại trên repo
  }
}

/**
 * Push 1 file JSON lên GitHub
 * @param {string} filename  tên file (ví dụ: 'menu.json')
 * @param {object} data  nội dung JSON cần lưu
 * @param {string} commitMessage  message của commit
 * @returns {{ success: boolean, url?: string, error?: string }}
 */
async function pushFile(filename, data, commitMessage) {
  if (!TOKEN || !OWNER || !REPO) {
    return { success: false, error: 'GitHub chưa cấu hình (thiếu GITHUB_TOKEN, GITHUB_OWNER hoặc GITHUB_REPO trong .env)' };
  }

  const repoPath = FILE_MAP[filename];
  if (!repoPath) {
    return { success: false, error: `File không được phép sync: ${filename}` };
  }

  try {
    // 1. Lấy SHA file hiện tại
    const sha = await getFileSHA(repoPath);

    // 2. Encode nội dung sang base64
    const content = Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');

    // 3. Tạo commit
    const body = {
      message: commitMessage || `[Admin] Cập nhật ${filename}`,
      content,
      branch: BRANCH,
      ...(sha && { sha }), // Bắt buộc nếu file đã tồn tại
      committer: {
        name : 'TaiLand Admin Bot',
        email: 'admin@tailandcafe.vn',
      },
    };

    const result = await githubRequest('PUT', `/repos/${OWNER}/${REPO}/contents/${repoPath}`, body);

    return {
      success: true,
      url    : result?.content?.html_url,
      commit : result?.commit?.sha?.slice(0, 7),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Kiểm tra kết nối GitHub (dùng trên dashboard)
 * @returns {{ connected: boolean, user?: string, error?: string }}
 */
async function checkConnection() {
  if (!TOKEN || !OWNER || !REPO) {
    return { connected: false, error: 'Chưa cấu hình GitHub trong .env' };
  }
  try {
    const user = await githubRequest('GET', '/user');
    return { connected: true, user: user.login };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

module.exports = { pushFile, checkConnection };
