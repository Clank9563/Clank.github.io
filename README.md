# Tech Forum - 靜態原型

這是一個簡單的靜態原型，展示技術博客論壇的 UI 與基本互動（分類、搜尋、Markdown 閱讀）。

檔案結構（重點）

- `index.html` - 入口頁面與主介面
- `assets/styles.css` - 全域樣式（現代科技感漸層背景與卡片式 UI）
- `assets/app.js` - 前端邏輯（載入 `posts/posts.json`、分類、搜尋、開啟文章 modal）
- `posts/posts.json` - 範例文章資料（JSON）

快速啟動

1. 在專案根目錄啟動簡單 HTTP server（建議使用 Python）：

```bash
python3 -m http.server 8000
```

2. 開啟瀏覽器並前往：http://localhost:8000

注意：某些瀏覽器直接從 `file://` 開啟會限制 fetch，本範例使用 fetch 載入 `posts/posts.json`，因此建議用 HTTP server。

如何檢視與開發

- 若你使用 VS Code：右鍵 `index.html` 選擇「在預設瀏覽器中開啟」或使用 Live Server extension。
- 若要在遠端部署：可以部署到 GitHub Pages、Vercel 或 Netlify（靜態站點）。

後續建議

- 換成動態後端（Node / Django / Rails），讓文章可被 CRUD。
- 加入 OAuth（GitHub / Google）、評論系統、分頁、與更完整的搜尋（Typesense / Elastic）。
- 加入單元測試與自動化部署流程（GitHub Actions）。

作者: 原型自動產生