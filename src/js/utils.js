/**
 * 工具函數模組
 */

/**
 * 標籤名稱中文化對照表
 */
export const labelNameMap = {
    'bug': '🐛 錯誤',
    'documentation': '📚 文件',
    'enhancement': '✨ 功能增強',
    'help wanted': '🆘 需要協助',
    'invalid': '❌ 無效',
    'question': '❓ 問題',
    // 常見自定義標籤
    'feature': '✨ 新功能',
    'discussion': '💬 討論',
    'announcement': '📢 公告',
    'testing': '🧪 測試',
    'urgent': '🔥 緊急',
    'dependencies': '📦 依賴更新',
    'chore': '🧹 雜項',
    'refactor': '🔨 重構',
    'style': '🎨 樣式',
    'fix': '🐛 修復',
    'ci/cd': '🚀 CI/CD',
    'build': '👷 建置',
    'test': '🧪 測試',
    'ui/ux': '🎨 介面與💡 體驗',
    'performance': '⚡ 效能',
    'security': '🔒 安全',
    'design': '🎨 設計',
    'backend': '⚙️ 後端',
    'frontend': '🖥️ 前端',
    'database': '💾 資料庫'
};

/**
 * 翻譯標籤名稱
 */
export function translateLabel(name) {
    if (!name) return name;
    // 忽略大小寫比較
    const lowerName = name.toLowerCase();
    return labelNameMap[lowerName] || name;
}

/**
 * 從 URL 獲取查詢參數
 */
export function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 防抖函數
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 節流函數
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 本地儲存操作
 */
export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

/**
 * 錯誤處理
 */
export function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let message = '發生未知錯誤';

    if (error.message) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    return message;
}

/**
 * 顯示通知
 */
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * 複製到剪貼簿
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('已複製到剪貼簿', 'success');
        return true;
    } catch (error) {
        console.error('Copy failed:', error);
        showNotification('複製失敗', 'error');
        return false;
    }
}

/**
 * 格式化數字（千分位）
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 截斷文字
 */
export function truncate(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 驗證 URL
 */
export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * 等待指定時間
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 轉義 HTML
 */
export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * 格式化日期
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export default {
    getQueryParam,
    debounce,
    throttle,
    storage,
    handleError,
    showNotification,
    copyToClipboard,
    formatNumber,
    truncate,
    isValidUrl,
    sleep,
    translateLabel,
    escapeHtml,
    formatDate
};
