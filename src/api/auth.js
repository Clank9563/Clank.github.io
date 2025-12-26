/**
 * GitHub OAuth 認證模組 - 使用 GitHub Pages 部署
 * 
 * 注意：由於 GitHub OAuth 需要 Client Secret，純前端無法安全實作完整的 OAuth 流程。
 * 這裡提供兩種方案：
 * 
 * 方案 1：使用 Personal Access Token (推薦用於個人專案)
 * 方案 2：使用第三方 OAuth 服務（如 Netlify Functions、Vercel Functions）
 */

/**
 * 方案 1：使用 Personal Access Token
 * 
 * 步驟：
 * 1. 前往 https://github.com/settings/tokens
 * 2. 點擊 "Generate new token (classic)"
 * 3. 選擇權限：repo, read:discussion, write:discussion
 * 4. 複製 token 並儲存
 */

/**
 * 設定 Personal Access Token
 */
export function setPersonalToken(token) {
    if (token) {
        localStorage.setItem('github_token', token);
        return true;
    }
    return false;
}

/**
 * 顯示 Token 輸入對話框
 */
export function promptForToken() {
    const token = prompt(
        '請輸入您的 GitHub Personal Access Token\n\n' +
        '如何取得：\n' +
        '1. 前往 https://github.com/settings/tokens\n' +
        '2. 點擊 "Generate new token (classic)"\n' +
        '3. 選擇權限：repo, read:discussion, write:discussion\n' +
        '4. 複製並貼上 token'
    );

    if (token) {
        setPersonalToken(token);
        window.location.reload();
    }
}

/**
 * 登出
 */
export function logout() {
    localStorage.removeItem('github_token');
    window.location.reload();
}

/**
 * 檢查是否已登入
 */
export function isLoggedIn() {
    return !!localStorage.getItem('github_token');
}

/**
 * 獲取 token
 */
export function getToken() {
    return localStorage.getItem('github_token');
}

/**
 * 方案 2：使用 GitHub OAuth (需要後端服務)
 * 
 * 如果您想使用完整的 OAuth 流程，可以使用以下免費服務：
 * 
 * 1. Netlify Functions
 * 2. Vercel Serverless Functions
 * 3. Cloudflare Workers
 * 4. GitHub Actions (作為 OAuth proxy)
 * 
 * 這些服務可以安全地處理 Client Secret
 */

// OAuth 相關函數（需要後端支援）
export function getAuthorizationUrl(clientId, redirectUri) {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'read:user repo write:discussion',
        state: generateRandomState(),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function generateRandomState() {
    return Math.random().toString(36).substring(2, 15);
}

export function login() {
    // 使用 Personal Access Token 方式
    promptForToken();
}

export default {
    login,
    logout,
    isLoggedIn,
    getToken,
    setPersonalToken,
    promptForToken,
};
