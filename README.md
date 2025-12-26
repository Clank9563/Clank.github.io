# GitHub Discussions 論壇

一個**純前端**的論壇系統，使用 GitHub Discussions 作為後端，無需自建伺服器。

## ✨ 功能特色

- 🚀 **純前端架構** - 無需後端伺服器，可直接部署到 GitHub Pages
- 💬 **GitHub Discussions 後端** - 利用 GitHub 作為完整的資料儲存和管理系統
- 🔐 **Personal Access Token 認證** - 安全的使用者認證方式
- ✏️ **發起新討論** - Markdown 編輯器、即時預覽、分類選擇
- 💬 **留言回覆** - 支援巢狀留言、Markdown 格式
- 👍 **按讚功能** - 為討論和留言按讚，即時更新計數
- 🎨 **現代化設計** - 深色模式、流暢動畫、響應式佈局
- 📱 **響應式介面** - 完美支援桌面和行動裝置
- ⚡ **GraphQL API** - 高效的資料獲取
- 🔖 **分類篩選** - 依討論分類瀏覽內容
- 📝 **Markdown 支援** - 完整的 Markdown 格式支援

## 🚀 快速開始

### 方式 1：本地開發

1. **克隆專案**
```bash
git clone <your-repo-url>
cd github_web
```

2. **使用簡單的 HTTP 伺服器**
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve

# 或使用 PHP
php -S localhost:8000
```

3. **開啟瀏覽器**
```
http://localhost:8000
```

### 方式 2：部署到 GitHub Pages

1. **推送到 GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **啟用 GitHub Pages**
   - 前往 Repository Settings
   - 找到 "Pages" 選項
   - Source 選擇 "main" branch
   - 點擊 Save

3. **訪問您的論壇**
```
https://Clank9563.github.io/Clank.github.io/
```

## 🔐 設定認證

由於是純前端應用，我們使用 **Personal Access Token** 進行認證：

### 建立 Personal Access Token

1. 前往 [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. 點擊 **"Generate new token (classic)"**
3. 設定 Token：
   - **Note**: `GitHub Discussions Forum`
   - **Expiration**: 選擇適當的過期時間
   - **Scopes**: 勾選以下權限
     - ✅ `repo` (完整的 repository 存取)
     - ✅ `read:discussion`
     - ✅ `write:discussion`
4. 點擊 **"Generate token"**
5. **複製 token**（只會顯示一次！）

### 使用 Token 登入

1. 開啟論壇網站
2. 點擊 **"🔐 使用 GitHub 登入"** 按鈕
3. 在彈出的對話框中貼上您的 Personal Access Token
4. Token 會安全地儲存在瀏覽器的 localStorage 中

> ⚠️ **安全提示**：
> - Token 僅儲存在您的瀏覽器中，不會傳送到任何第三方伺服器
> - 請勿與他人分享您的 token
> - 定期更新 token 以確保安全

## 📁 專案結構

```
github_web/
├── src/
│   ├── api/
│   │   ├── github-client.js    # GitHub API 客戶端（直接呼叫）
│   │   └── auth.js              # Personal Access Token 認證
│   ├── js/
│   │   ├── ui.js                # UI 渲染函數
│   │   └── utils.js             # 工具函數
│   └── styles/
│       └── main.css             # 主要樣式表
├── index.html                   # 討論列表頁面
├── discussion.html              # 討論詳情頁面
├── new-discussion.html          # 發起新討論頁面
└── README.md                    # 專案說明
```

## 🔧 API 使用說明

### 直接呼叫 GitHub API

所有 API 請求都直接從瀏覽器發送到 GitHub：

```javascript
// 初始化客戶端
const client = new GitHubClient('Clank9563', 'Clank.github.io');

// 獲取討論列表
const discussions = await client.getDiscussions(20);

// 獲取單個討論
const discussion = await client.getDiscussion(discussionNumber);

// 建立新討論（需要 token）
const newDiscussion = await client.createDiscussion(categoryId, title, body);

// 新增留言（需要 token）
await client.addComment(discussionId, body);
```

## 🎨 自訂設定

### 修改 Repository

編輯 `index.html` 和 `discussion.html` 中的配置：

```javascript
window.GITHUB_CONFIG = {
  owner: 'your-username',  // 您的 GitHub 使用者名稱
  repo: 'your-repo'        // 您的 repository 名稱
};
```

### 自訂樣式

所有樣式變數定義在 `src/styles/main.css`：

```css
:root {
  --primary-hue: 210;           /* 主色調 */
  --bg-primary: hsl(220, 13%, 9%);  /* 背景色 */
  --text-primary: hsl(0, 0%, 95%);  /* 文字色 */
}
```

## 📝 使用說明

### 瀏覽討論
- 無需登入即可瀏覽所有公開討論
- 點擊討論卡片查看完整內容和留言

### 發起討論
1. 點擊 **"使用 GitHub 登入"** 並輸入 Personal Access Token
2. 登入後，點擊 **"✏️ 發起討論"**
3. 選擇分類、輸入標題和內容
4. 點擊發表

### 留言回覆
1. 確保已登入
2. 在討論詳情頁面底部的留言框輸入內容
3. 點擊 **"💬 發表留言"**

## 🌐 部署選項

### GitHub Pages（推薦）
- ✅ 免費
- ✅ 自動 HTTPS
- ✅ 與 GitHub 完美整合

### 其他選項
- **Netlify**: 拖放部署，自動 CI/CD
- **Vercel**: 快速部署，優秀的效能
- **Cloudflare Pages**: 全球 CDN，快速載入

## 🐛 常見問題

### Q: 為什麼不使用 OAuth？
A: OAuth 需要 Client Secret，無法在純前端安全實作。Personal Access Token 是更適合純前端應用的方案。

### Q: Token 安全嗎？
A: Token 儲存在瀏覽器的 localStorage 中，只在您的裝置上。但請注意：
- 不要在公共電腦上使用
- 定期更新 token
- 使用時設定適當的權限範圍

### Q: 可以使用 OAuth 嗎？
A: 可以，但需要額外的後端服務（如 Netlify Functions、Vercel Functions）來安全處理 Client Secret。

### Q: 無法載入討論？
確認：
1. Repository 名稱正確（`owner/repo`）
2. Repository 已啟用 Discussions
3. Discussions 是公開的

### Q: 無法發文或留言？
確認：
1. 已正確輸入 Personal Access Token
2. Token 具有 `write:discussion` 權限
3. Token 尚未過期

## 📄 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📧 支援

如有問題，請在 GitHub repository 開啟 Issue。
