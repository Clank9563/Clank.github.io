import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 靜態檔案服務
app.use(express.static(__dirname));
app.use(express.json());

// OAuth callback 處理
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // 交換 access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    // 重定向回首頁，並將 token 作為 hash 傳遞（避免在 URL 中暴露）
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>授權成功</title>
      </head>
      <body>
        <script>
          // 將 token 儲存到 localStorage
          localStorage.setItem('github_token', '${tokenData.access_token}');
          // 重定向回首頁
          window.location.href = '/';
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// API 代理端點（避免 CORS 問題）
app.post('/api/github', async (req, res) => {
  const { endpoint, method = 'GET', body, token } = req.body;

  try {
    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`https://api.github.com${endpoint}`, options);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GraphQL 代理端點
app.post('/api/graphql', async (req, res) => {
  const { query, variables, token } = req.body;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 GitHub Repository: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`);
  console.log(`🔐 OAuth callback: ${process.env.CALLBACK_URL}`);
});
