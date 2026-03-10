// Token 验证模块
// URL链接模式：testtop.site/?t=xxxx
// 限制：每个链接最多2次，48小时有效

import { VALID_TOKEN_HASHES } from './codeHashes.js';

const TOKEN_USAGE_KEY = 'mg_token_usage'; // { token: { count, firstUsed } }
const MAX_USES = 2;
const EXPIRE_HOURS = 48;

export class TokenManager {

    // 从URL获取token
    static getTokenFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('t');
    }

    // SHA-256 哈希
    static async hashToken(token) {
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 获取本地使用记录
    static getUsageData() {
        try {
            return JSON.parse(localStorage.getItem(TOKEN_USAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    static saveUsageData(data) {
        localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(data));
    }

    // 验证token
    static async validateToken(token) {
        if (!token || token.length < 10) {
            return { valid: false, reason: 'invalid' };
        }

        // 检查token是否在哈希列表中
        const hash = await this.hashToken(token);
        if (!VALID_TOKEN_HASHES.has(hash)) {
            return { valid: false, reason: 'invalid' };
        }

        // 检查使用次数和过期时间
        const usage = this.getUsageData();
        const record = usage[token];

        if (record) {
            // 检查是否过期（48小时）
            const elapsed = Date.now() - record.firstUsed;
            if (elapsed > EXPIRE_HOURS * 60 * 60 * 1000) {
                return { valid: false, reason: 'expired' };
            }

            // 检查使用次数
            if (record.count >= MAX_USES) {
                return { valid: false, reason: 'used_up' };
            }

            // 增加使用次数
            record.count++;
            usage[token] = record;
        } else {
            // 首次使用
            usage[token] = { count: 1, firstUsed: Date.now() };
        }

        this.saveUsageData(usage);
        return { valid: true };
    }

    // 获取错误提示文案
    static getErrorMessage(reason) {
        switch (reason) {
            case 'expired':
                return '该链接已过期（超过48小时），请重新购买';
            case 'used_up':
                return '该链接已达到使用上限（2次），请重新购买';
            case 'invalid':
            default:
                return '无效的测试链接，请通过正规渠道购买获取';
        }
    }
}
