/**
 * GitHub API 客戶端 - 純前端版本
 * 直接從瀏覽器呼叫 GitHub API
 */

class GitHubClient {
  constructor(owner, repo) {
    this.owner = owner;
    this.repo = repo;
    this.token = localStorage.getItem('github_token');
    this.apiBase = 'https://api.github.com';
  }

  /**
   * 設定 access token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      localStorage.removeItem('github_token');
    }
  }

  /**
   * 獲取當前 token
   */
  getToken() {
    return this.token;
  }

  /**
   * 建立請求標頭
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * REST API 請求
   */
  async restRequest(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const headers = this.getHeaders();

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * GraphQL 請求
   */
  async graphqlRequest(query, variables = {}) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data;
  }

  /**
   * 獲取討論列表
   */
  async getDiscussions(first = 20, after = null) {
    const query = `
      query($owner: String!, $repo: String!, $first: Int!, $after: String) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $first, after: $after, orderBy: {field: UPDATED_AT, direction: DESC}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              body
              createdAt
              updatedAt
              author {
                login
                avatarUrl
              }
              category {
                id
                name
                emoji
              }
              labels(first: 5) {
                nodes {
                  id
                  name
                  color
                }
              }
              comments {
                totalCount
              }
              reactions {
                totalCount
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, {
      owner: this.owner,
      repo: this.repo,
      first,
      after,
    });

    return data.repository.discussions;
  }

  /**
   * 獲取單個討論詳情（包含留言）
   */
  async getDiscussion(number) {
    const query = `
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          discussion(number: $number) {
            id
            number
            title
            body
            bodyHTML
            createdAt
            updatedAt
            author {
              login
              avatarUrl
            }
            category {
              name
              emoji
            }
            labels(first: 10) {
              nodes {
                id
                name
                color
              }
            }
            comments(first: 100) {
              nodes {
                id
                body
                bodyHTML
                createdAt
                author {
                  login
                  avatarUrl
                }
                replies(first: 50) {
                  nodes {
                    id
                    body
                    bodyHTML
                    createdAt
                    author {
                      login
                      avatarUrl
                    }
                  }
                }
                reactions {
                  totalCount
                }
              }
            }
            reactions {
              totalCount
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, {
      owner: this.owner,
      repo: this.repo,
      number: parseInt(number),
    });

    return data.repository.discussion;
  }

  /**
   * 獲取討論分類
   */
  async getCategories() {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          discussionCategories(first: 20) {
            nodes {
              id
              name
              emoji
              description
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, {
      owner: this.owner,
      repo: this.repo,
    });

    return data.repository.discussionCategories.nodes;
  }

  /**
   * 獲取標籤列表
   */
  async getLabels() {
    const query = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
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

    const data = await this.graphqlRequest(query, {
      owner: this.owner,
      repo: this.repo,
    });

    return data.repository.labels.nodes;
  }

  /**
   * 建立新討論
   */
  async createDiscussion(categoryId, title, body) {
    if (!this.token) {
      throw new Error('需要登入才能建立討論');
    }

    // 注意：目前 API createDiscussion 不直接支援 labelIds (需要 separate mutation 或使用 labels 欄位如果 API 支援)
    // 根據 GitHub GraphQL API，createDiscussion input 沒有 labelIds。需要使用 addLabelsToLabelable
    // 為了簡化，我們先建立討論。如果需要標籤，需要修改此函數接收 labelIds 並在建立後呼叫 addLabels

    const mutation = `
      mutation($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
        createDiscussion(input: {
          repositoryId: $repositoryId,
          categoryId: $categoryId,
          title: $title,
          body: $body
        }) {
          discussion {
            id
            number
          }
        }
      }
    `;

    // 先獲取 repository ID
    const repoQuery = `
      query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
        }
      }
    `;

    const repoData = await this.graphqlRequest(repoQuery, {
      owner: this.owner,
      repo: this.repo,
    });

    const data = await this.graphqlRequest(mutation, {
      repositoryId: repoData.repository.id,
      categoryId,
      title,
      body,
    });

    return data.createDiscussion.discussion;
  }

  /**
   * 新增留言
   */
  async addComment(discussionId, body) {
    if (!this.token) {
      throw new Error('需要登入才能留言');
    }

    const mutation = `
      mutation($discussionId: ID!, $body: String!) {
        addDiscussionComment(input: {
          discussionId: $discussionId,
          body: $body
        }) {
          comment {
            id
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      discussionId,
      body,
    });

    return data.addDiscussionComment.comment;
  }

  /**
   * 為討論新增反應（按讚）
   */
  async addDiscussionReaction(discussionId, content = 'THUMBS_UP') {
    if (!this.token) {
      throw new Error('需要登入才能按讚');
    }

    const mutation = `
      mutation($subjectId: ID!, $content: ReactionContent!) {
        addReaction(input: {
          subjectId: $subjectId,
          content: $content
        }) {
          reaction {
            id
            content
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      subjectId: discussionId,
      content,
    });

    return data.addReaction.reaction;
  }

  /**
   * 移除討論的反應
   */
  async removeDiscussionReaction(discussionId, content = 'THUMBS_UP') {
    if (!this.token) {
      throw new Error('需要登入才能取消按讚');
    }

    const mutation = `
      mutation($subjectId: ID!, $content: ReactionContent!) {
        removeReaction(input: {
          subjectId: $subjectId,
          content: $content
        }) {
          reaction {
            id
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      subjectId: discussionId,
      content,
    });

    return data.removeReaction.reaction;
  }

  /**
   * 為留言新增反應
   */
  async addCommentReaction(commentId, content = 'THUMBS_UP') {
    if (!this.token) {
      throw new Error('需要登入才能按讚');
    }

    return await this.addDiscussionReaction(commentId, content);
  }

  /**
   * 搜尋討論
   */
  async searchDiscussions(query, first = 20) {
    if (!query || query.trim() === '') {
      throw new Error('搜尋關鍵字不能為空');
    }

    // 構建搜尋查詢字串，限定在當前 repository
    const searchQuery = `repo:${this.owner}/${this.repo} ${query} in:title,body`;

    const graphqlQuery = `
      query($query: String!, $first: Int!) {
        search(query: $query, type: DISCUSSION, first: $first) {
          discussionCount
          nodes {
            ... on Discussion {
              id
              number
              title
              body
              createdAt
              updatedAt
              author {
                login
                avatarUrl
              }
              category {
                id
                name
                emoji
              }
              comments {
                totalCount
              }
              reactions {
                totalCount
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(graphqlQuery, {
      query: searchQuery,
      first,
    });

    return {
      totalCount: data.search.discussionCount,
      nodes: data.search.nodes,
    };
  }

  /**
   * 置頂討論
   */
  async pinDiscussion(discussionId) {
    if (!this.token) {
      throw new Error('需要登入才能置頂討論');
    }

    const mutation = `
      mutation($discussionId: ID!) {
        pinDiscussion(input: {
          discussionId: $discussionId
        }) {
          discussion {
            id
            isPinned
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      discussionId,
    });

    return data.pinDiscussion.discussion;
  }

  /**
   * 取消置頂討論
   */
  async unpinDiscussion(discussionId) {
    if (!this.token) {
      throw new Error('需要登入才能取消置頂');
    }

    const mutation = `
      mutation($discussionId: ID!) {
        unpinDiscussion(input: {
          discussionId: $discussionId
        }) {
          discussion {
            id
            isPinned
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      discussionId,
    });

    return data.unpinDiscussion.discussion;
  }

  /**
   * 為討論添加標籤
   */
  async addLabels(discussionId, labelIds) {
    if (!this.token) {
      throw new Error('需要登入才能添加標籤');
    }

    const mutation = `
      mutation($labelableId: ID!, $labelIds: [ID!]!) {
        addLabelsToLabelable(input: {
          labelableId: $labelableId,
          labelIds: $labelIds
        }) {
          labelable {
            ... on Discussion {
              id
              labels(first: 10) {
                nodes {
                  name
                  color
                }
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      labelableId: discussionId,
      labelIds,
    });

    return data.addLabelsToLabelable.labelable.labels.nodes;
  }

  /**
   * 獲取當前使用者資訊
   */
  async getCurrentUser() {
    if (!this.token) {
      return null;
    }

    const query = `
      query {
        viewer {
          login
          name
          avatarUrl
          email
        }
      }
    `;

    try {
      const data = await this.graphqlRequest(query);
      return data.viewer;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

export default GitHubClient;
