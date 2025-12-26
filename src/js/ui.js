/**
 * UI 渲染模組
 */

import { marked } from 'https://cdn.jsdelivr.net/npm/marked@11.1.0/+esm';
import { translateLabel } from './utils.js';

/**
 * 渲染討論列表
 */
export function renderDiscussions(discussions, container) {
  if (!discussions || discussions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <h2>目前沒有討論</h2>
        <p>成為第一個發起討論的人吧！</p>
      </div>
    `;
    return;
  }

  // 從 localStorage 獲取置頂討論列表
  const pinnedDiscussions = JSON.parse(localStorage.getItem('pinnedDiscussions') || '[]');

  // 將置頂討論排在最前面
  const sortedDiscussions = [...discussions].sort((a, b) => {
    const aIsPinned = pinnedDiscussions.includes(a.id);
    const bIsPinned = pinnedDiscussions.includes(b.id);
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return 0;
  });

  const html = sortedDiscussions.map(discussion => {
    const isPinned = pinnedDiscussions.includes(discussion.id);
    return `
    <a href="discussion.html?number=${discussion.number}" class="discussion-card${isPinned ? ' pinned' : ''}">
      <div class="discussion-header">
        <img src="${discussion.author.avatarUrl}" alt="${discussion.author.login}" class="discussion-avatar">
        <div class="discussion-meta">
          <h2 class="discussion-title">
            ${isPinned ? '<span class="pinned-badge">📌 置頂</span> ' : ''}
            ${escapeHtml(discussion.title)}
          </h2>
          <div class="discussion-info">
            <span class="discussion-category">
              ${discussion.category.emoji} ${escapeHtml(discussion.category.name)}
            </span>
            <span>由 ${escapeHtml(discussion.author.login)} 發起</span>
            <span>${formatDate(discussion.createdAt)}</span>
          </div>
          ${discussion.labels && discussion.labels.nodes.length > 0 ? `
            <div class="discussion-labels">
              ${discussion.labels.nodes.map(label => `
                <span class="label-badge" style="background-color: #${label.color}; --label-color: #${label.color}">
                  ${escapeHtml(translateLabel(label.name))}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      ${discussion.body ? `<div class="discussion-body">${escapeHtml(discussion.body)}</div>` : ''}
      <div class="discussion-stats">
        <span class="stat-item">
          💬 ${discussion.comments.totalCount} 則留言
        </span>
        <span class="stat-item">
          👍 ${discussion.reactions.totalCount} 個反應
        </span>
        <span class="stat-item">
          🕒 ${formatDate(discussion.updatedAt)}更新
        </span>
      </div>
    </a>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * 渲染討論詳情
 */
export function renderDiscussionDetail(discussion, container, currentUser = null) {
  // 從 localStorage 檢查是否置頂
  const pinnedDiscussions = JSON.parse(localStorage.getItem('pinnedDiscussions') || '[]');
  const isPinned = pinnedDiscussions.includes(discussion.id);

  const html = `
    <article class="discussion-detail">
      <header class="discussion-detail-header">
        <div class="discussion-category">
          ${discussion.category.emoji} ${escapeHtml(discussion.category.name)}
        </div>
        <h1 class="discussion-detail-title">
          ${isPinned ? '<span class="pinned-badge">📌 置頂</span> ' : ''}
          ${escapeHtml(discussion.title)}
        </h1>
        <div class="discussion-detail-meta">
          <img src="${discussion.author.avatarUrl}" alt="${discussion.author.login}" class="author-avatar">
          <div>
            <div class="author-name">${escapeHtml(discussion.author.login)}</div>
            <div class="discussion-date">發起於 ${formatDate(discussion.createdAt)}</div>
          </div>
        </div>
        ${discussion.labels && discussion.labels.nodes.length > 0 ? `
          <div class="discussion-detail-labels">
            ${discussion.labels.nodes.map(label => `
              <span class="label-badge large" style="background-color: #${label.color}; --label-color: #${label.color}">
                ${escapeHtml(translateLabel(label.name))}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </header>
      
      <div class="discussion-detail-body markdown-body">
        ${marked.parse(discussion.body || '')}
      </div>
      
      <div class="discussion-detail-stats">
        <span class="stat-item">💬 ${discussion.comments.nodes.length} 則留言</span>
        <span class="stat-item">👍 ${discussion.reactions.totalCount} 個反應</span>
      </div>

      ${currentUser ? `
        <div class="reaction-buttons">
          <button class="reaction-btn" id="likeBtn" data-discussion-id="${discussion.id}">
            👍 按讚 <span id="likeCount">${discussion.reactions.totalCount}</span>
          </button>
          <button class="pin-button${isPinned ? ' pinned' : ''}" id="pinBtn" data-discussion-id="${discussion.id}">
            ${isPinned ? '📌 取消置頂' : '📌 置頂討論'}
          </button>
        </div>
      ` : ''}
    </article>
    
    <section class="comments-section">
      <h2 class="comments-title">留言 (${discussion.comments.nodes.length})</h2>
      <div class="comments-list">
        ${renderComments(discussion.comments.nodes, currentUser)}
      </div>
    </section>
  `;

  container.innerHTML = html;
}

/**
 * 渲染留言列表
 */
function renderComments(comments, currentUser = null) {
  if (!comments || comments.length === 0) {
    return '<div class="empty-state"><p>目前沒有留言</p></div>';
  }

  return comments.map(comment => `
    <div class="comment" data-comment-id="${comment.id}">
      <div class="comment-header">
        <img src="${comment.author.avatarUrl}" alt="${comment.author.login}" class="comment-avatar">
        <div class="comment-meta">
          <span class="comment-author">${escapeHtml(comment.author.login)}</span>
          <span class="comment-date">${formatDate(comment.createdAt)}</span>
        </div>
      </div>
      <div class="comment-body markdown-body">
        ${marked.parse(comment.body || '')}
      </div>
      ${currentUser ? `
        <div class="reaction-buttons">
          <button class="reaction-btn comment-like-btn" data-comment-id="${comment.id}">
            👍 按讚 <span class="comment-like-count">${comment.reactions.totalCount}</span>
          </button>
        </div>
      ` : ''}
      ${comment.replies && comment.replies.nodes.length > 0 ? `
        <div class="comment-replies">
          ${renderComments(comment.replies.nodes, currentUser)}
        </div>
      ` : ''}
    </div>
  `).join('');
}

/**
 * 渲染載入狀態
 */
export function renderLoading(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
}

/**
 * 渲染錯誤訊息
 */
export function renderError(message, container) {
  container.innerHTML = `
    <div class="error-message">
      <strong>❌ 錯誤</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * 渲染使用者資訊
 */
export function renderUserInfo(user, container) {
  if (!user) {
    container.innerHTML = `
      <button class="btn btn-primary" id="loginBtn">
        🔐 使用 GitHub 登入
      </button>
    `;
    return;
  }

  container.innerHTML = `
    <div class="user-info">
      <img src="${user.avatarUrl}" alt="${user.login}" class="user-avatar">
      <span class="user-name">${escapeHtml(user.login)}</span>
      <button class="btn btn-ghost btn-sm" id="logoutBtn">登出</button>
    </div>
  `;
}

/**
 * 渲染分類選擇器
 */
export function renderCategories(categories, container) {
  const html = `
    <select class="category-select" id="categorySelect">
      <option value="">所有分類</option>
      ${categories.map(cat => `
        <option value="${cat.id}">
          ${cat.emoji} ${escapeHtml(cat.name)}
        </option>
      `).join('')}
    </select>
  `;

  container.innerHTML = html;
}

/**
 * 工具函數：轉義 HTML (本地定義以避免快取問題)
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 工具函數：格式化日期 (本地定義以避免快取問題)
 */
function formatDate(dateString) {
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
  renderDiscussions,
  renderDiscussionDetail,
  renderLoading,
  renderError,
  renderUserInfo,
  renderCategories,
};
