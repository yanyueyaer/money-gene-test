// 链接 Token 生成工具
// 用法: node scripts/generateCodes.js [数量] [域名]
// 例如: node scripts/generateCodes.js 999 testtop.site
// 输出: 
//   scripts/codes_list.txt — 完整链接（用于自动发货）
//   js/codeHashes.js — Token哈希（用于前端验证）

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COUNT = parseInt(process.argv[2]) || 999;
const DOMAIN = process.argv[3] || 'testtop.site';
const CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'; // 小写+数字，去掉易混淆字符

// 生成24位随机token
function generateToken() {
    let token = '';
    for (let i = 0; i < 24; i++) {
        token += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return token;
}

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

const tokens = [];
const hashes = [];
const seen = new Set();

while (tokens.length < COUNT) {
    const t = generateToken();
    if (!seen.has(t)) {
        seen.add(t);
        tokens.push(t);
        hashes.push(sha256(t));
    }
}

// 写完整链接列表（用于自动发货系统，每行一个链接）
const links = tokens.map(t => `https://${DOMAIN}/?t=${t}`);
fs.writeFileSync(
    path.join(__dirname, 'codes_list.txt'),
    links.join('\n'),
    'utf8'
);

// 写JS格式哈希
const jsContent = `// 自动生成 — ${COUNT} 个 Token 的 SHA-256 哈希
// 生成时间: ${new Date().toISOString()}
// 每个链接限用2次，48小时有效
export const VALID_TOKEN_HASHES = new Set([
${hashes.map(h => `'${h}'`).join(',\n')}
]);
`;

fs.writeFileSync(
    path.join(__dirname, '..', 'js', 'codeHashes.js'),
    jsContent,
    'utf8'
);

console.log(`Done! Generated ${COUNT} links.`);
console.log(`- scripts/codes_list.txt (${COUNT} links for delivery)`);
console.log(`- js/codeHashes.js (hashes for frontend)`);
console.log(`\nExample: ${links[0]}`);
