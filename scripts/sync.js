import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 設定
const CONFIG = {
  owner: 'Clank9563',
  repo: 'Clank.github.io',
  outputFile: 'data.json'
};

// GraphQL 查詢 - 獲取所有數據
const query = `
query {
  repository(owner: "${CONFIG.owner}", name: "${CONFIG.repo}") {
    discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        id
        number
        title
        body
        url
        createdAt
        updatedAt
        author {
          login
          avatarUrl
          url
        }
        category {
          id
          name
          emoji
        }
        labels(first: 10) {
          nodes {
            name
            color
          }
        }
        comments(first: 0) {
          totalCount
        }
        reactions(first: 0) {
          totalCount
        }
      }
    }
    discussionCategories(first: 20) {
      nodes {
        id
        name
        emoji
        description
      }
    }
    labels(first: 20) {
      nodes {
        id
        name
        color
        description
      }
    }
  }
}
`;

async function fetchData() {
  console.log('Fetching data from GitHub API...');

  // 從環境變數獲取 Token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is missing');
  }

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Forum-Sync'
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      throw new Error('GraphQL query failed');
    }

    return json.data.repository;

  } catch (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    const data = await fetchData();

    // 整理數據結構
    const output = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalDiscussions: data.discussions.nodes.length
      },
      categories: data.discussionCategories.nodes,
      labels: data.labels.nodes,
      discussions: data.discussions.nodes
    };

    // 寫入檔案
    const outputPath = path.join(__dirname, '..', CONFIG.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`Successfully synced ${output.discussions.length} discussions to ${CONFIG.outputFile}`);

  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
