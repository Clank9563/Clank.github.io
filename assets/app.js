const POSTS_URL = 'posts/posts.json'

// DOM
const categoriesEl = document.getElementById('categories')
const sidebarCategoriesEl = document.getElementById('sidebarCategories')
const postsEl = document.getElementById('posts')
const searchInput = document.getElementById('searchInput')
const sortSelect = document.getElementById('sortSelect')
const articleModal = document.getElementById('articleModal')
const articleContent = document.getElementById('articleContent')
const closeModal = document.getElementById('closeModal')
const articleActions = document.getElementById('articleActions')
const commentsSection = document.getElementById('commentsSection')
const commentsList = document.getElementById('commentsList')
const commentForm = document.getElementById('commentForm')
const commentAuthor = document.getElementById('commentAuthor')
const commentText = document.getElementById('commentText')
const bookmarksBtn = document.getElementById('bookmarksBtn')
const themeToggle = document.getElementById('themeToggle')

// state
let posts = []
let categories = new Set()
let activeCategory = '全部'
let showingBookmarks = false

// localStorage keys
const LS_PREFIX = 'tf_'
const LS_LIKES = LS_PREFIX + 'likes' // map postId -> {count,user}
const LS_BOOKMARKS = LS_PREFIX + 'bookmarks' // map postId -> true
const LS_COMMENTS = LS_PREFIX + 'comments' // map postId -> [{author,text,date}]
const LS_THEME = LS_PREFIX + 'theme' // 'dark'|'light'

const LS_VIEWS = LS_PREFIX + 'views' // map postId -> number

// paging options
const PAGE_SIZE = 6
let currentPage = 1

function lsLoad(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v): fallback }catch(e){ return fallback } }
function lsSave(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)) }catch(e){} }

let likes = lsLoad(LS_LIKES, {})
let bookmarks = lsLoad(LS_BOOKMARKS, {})
let comments = lsLoad(LS_COMMENTS, {})
let viewsStore = lsLoad(LS_VIEWS, {})

// theme
function applyTheme(t){
  if(t==='light'){
    document.documentElement.style.setProperty('--bg-1','#f7fafc')
    document.documentElement.style.setProperty('--bg-2','#eef2ff')
    document.documentElement.style.setProperty('color','#0b1320')
    if(themeToggle) themeToggle.textContent='🌙'
  } else {
    document.documentElement.style.setProperty('--bg-1','#0f1724')
    document.documentElement.style.setProperty('--bg-2','#071028')
    document.documentElement.style.setProperty('color','#e6eef8')
    if(themeToggle) themeToggle.textContent='☀️'
  }
  lsSave(LS_THEME,t)
}
const savedTheme = lsLoad(LS_THEME,'dark'); applyTheme(savedTheme)
themeToggle && themeToggle.addEventListener('click', ()=>{ const current = lsLoad(LS_THEME,'dark'); applyTheme(current==='dark' ? 'light' : 'dark') })

// marked + highlight.js integration
if(window.marked){
  marked.setOptions({
    gfm: true,
    breaks: false,
    sanitize: false,
    highlight: function(code, lang){
      if(window.hljs){
        try{
          if(lang && hljs.getLanguage(lang)) return hljs.highlight(code, {language: lang}).value
          return hljs.highlightAuto(code).value
        }catch(e){ return code }
      }
      return code
    }
  })
}

async function loadPosts(){
  try{
    const r = await fetch(POSTS_URL)
    posts = await r.json()
    posts.forEach(p => categories.add(p.category))
    // merge persisted views into posts
    posts.forEach(p => { p.views = viewsStore[p.id] !== undefined ? viewsStore[p.id] : (p.views||0) })
    renderCategoryButtons()
    buildTagCloud()
    renderRecommended()
    renderPosts()
  }catch(e){
    postsEl.innerHTML = '<p style="color:#f88">無法載入文章。</p>'
    console.error(e)
  }
}

function renderCategoryButtons(){
  if(categoriesEl) categoriesEl.innerHTML = ''
  if(sidebarCategoriesEl) sidebarCategoriesEl.innerHTML = ''
  // create separate buttons for top and sidebar so events are bound correctly
  const allTop = createCategoryButton('全部', true)
  const allSide = createCategoryButton('全部', true)
  categoriesEl && categoriesEl.appendChild(allTop)
  sidebarCategoriesEl && sidebarCategoriesEl.appendChild(allSide)
  Array.from(categories).sort().forEach(c => {
    const topBtn = createCategoryButton(c)
    const sideBtn = createCategoryButton(c)
    categoriesEl && categoriesEl.appendChild(topBtn)
    sidebarCategoriesEl && sidebarCategoriesEl.appendChild(sideBtn)
  })
}

function createCategoryButton(name, active=false){
  const btn = document.createElement('button')
  btn.className = 'category-btn' + (active? ' active':'')
  btn.textContent = name
  btn.onclick = ()=>{
    document.querySelectorAll('.category-btn').forEach(b=>b.classList.remove('active'))
    btn.classList.add('active')
    activeCategory = name
    showingBookmarks = false
    currentPage = 1
    renderPosts()
  }
  return btn
}

function renderPosts(){
  const q = (searchInput && searchInput.value)? searchInput.value.trim().toLowerCase() : ''
  const sort = (sortSelect && sortSelect.value)? sortSelect.value : 'new'
  let list = posts.slice()

  if(showingBookmarks){ list = list.filter(p=> bookmarks[p.id]) }
  else if(activeCategory !== '全部'){
    list = list.filter(p=>p.category === activeCategory)
  }
  if(q){
    list = list.filter(p=> (p.title+" "+p.excerpt+" "+(p.tags||[]).join(' ')).toLowerCase().includes(q))
  }

  if(sort==='hot') list.sort((a,b)=> (b.views||0)+(b.likes||0) - ((a.views||0)+(a.likes||0)))
  else list.sort((a,b)=> new Date(b.date) - new Date(a.date))

  const totalFiltered = list.length
  // paging
  const start = (currentPage-1)*PAGE_SIZE
  list = list.slice(start, start+PAGE_SIZE)

  postsEl.innerHTML = ''
  if(totalFiltered===0){ postsEl.innerHTML = '<p style="color:var(--muted)">找不到文章，試試其他關鍵字或分類。</p>'; renderPagination(0); return }
  for(const p of list){
    const card = document.createElement('article')
    card.className = 'post-card'
    card.onclick = ()=> openArticle(p)
    const isBookmarked = !!bookmarks[p.id]
    const likeCount = likes[p.id] && likes[p.id].count? likes[p.id].count : 0
    card.innerHTML = `
      <h3 class="post-title">${escapeHtml(p.title)}</h3>
      <div class="post-meta"> <span>${p.category}</span> <span class="meta-right">• ${p.date}</span> <span>• ${p.views||0} 閱覽</span></div>
      <p class="post-excerpt">${escapeHtml(p.excerpt)}</p>
      <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div style="margin-top:10px;display:flex;gap:8px;align-items:center">
        <button class="category-btn" title="喜歡">❤️ ${likeCount}</button>
        <button class="category-btn" title="書籤">${isBookmarked? '🔖 已書籤':'🔖 書籤'}</button>
      </div>
    `
    postsEl.appendChild(card)
  }
  renderPagination(totalFiltered)
}

function renderPagination(totalItems){
  const pages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const container = document.getElementById('pagination')
  if(!container) return
  // hide pagination if no items
  if(totalItems === 0){ container.innerHTML = ''; return }
  container.innerHTML = ''
  for(let i=1;i<=pages;i++){
    const btn = document.createElement('button')
    btn.textContent = i
    btn.className = i===currentPage? 'active':''
    btn.onclick = ()=>{ currentPage = i; renderPosts() }
    container.appendChild(btn)
  }
}

function renderArticleActions(p){
  const isLiked = !!(likes[p.id] && likes[p.id].user)
  const likeCount = likes[p.id] && likes[p.id].count? likes[p.id].count : 0
  const isBookmarked = !!bookmarks[p.id]
  articleActions.innerHTML = `
    <button id="likeBtn" class="category-btn">${isLiked? '💖':'🤍'} 喜歡 (${likeCount})</button>
    <button id="bookmarkBtn" class="category-btn">${isBookmarked? '🔖 已書籤':'🔖 書籤'}</button>
    <button id="shareBtn" class="category-btn">🔗 複製連結</button>
    <button id="toggleComments" class="category-btn">💬 留言</button>
  `
  document.getElementById('likeBtn').onclick = ()=> toggleLike(p)
  document.getElementById('bookmarkBtn').onclick = ()=> toggleBookmark(p)
  document.getElementById('shareBtn').onclick = ()=> copyLink(p)
  document.getElementById('toggleComments').onclick = ()=> { commentsSection.style.display = commentsSection.style.display === 'none'? 'block':'none' }
}

function openArticle(p){
  // increment view locally
  p.views = (p.views||0) + 1
  // persist views to localStorage
  viewsStore[p.id] = p.views
  lsSave(LS_VIEWS, viewsStore)
  renderPosts()

  const md = marked.parse(p.content || '')
  articleContent.innerHTML = `
    <h2 style="margin-top:0">${escapeHtml(p.title)}</h2>
    <div class="post-meta">${p.category} • ${p.date} • ${p.views||0} 閱覽</div>
    <hr />
    <div id="mdcontent">${md}</div>
  `
  // run highlight.js on any code blocks inside mdcontent
  const mdcontent = document.getElementById('mdcontent')
  if(window.hljs && mdcontent){
    mdcontent.querySelectorAll('pre code').forEach((block)=>{ try{ hljs.highlightElement(block) }catch(e){} })
  }

  renderArticleActions(p)
  renderComments(p.id)

  articleModal.classList.remove('hidden')
  articleModal.setAttribute('aria-hidden','false')
}

function toggleLike(p){
  likes[p.id] = likes[p.id] || {count:0, user:false}
  if(likes[p.id].user){ likes[p.id].user = false; likes[p.id].count = Math.max(0, likes[p.id].count-1) }
  else { likes[p.id].user = true; likes[p.id].count = (likes[p.id].count||0)+1 }
  lsSave(LS_LIKES, likes)
  renderArticleActions(p)
  renderPosts()
}

function toggleBookmark(p){
  if(bookmarks[p.id]) delete bookmarks[p.id]
  else bookmarks[p.id] = true
  lsSave(LS_BOOKMARKS, bookmarks)
  renderArticleActions(p)
  renderPosts()
}

function copyLink(p){
  const url = location.origin + location.pathname + `#${p.id}`
  navigator.clipboard && navigator.clipboard.writeText(url)
  alert('連結已複製：' + url)
}

function renderComments(postId){
  const list = comments[postId] || []
  commentsList.innerHTML = list.map(c=>`<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)"><strong>${escapeHtml(c.author||'匿名')}</strong> <small style="color:var(--muted)">• ${escapeHtml(c.date)}</small><div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join('')
}

commentForm && commentForm.addEventListener('submit', (e)=>{
  e.preventDefault()
  const author = commentAuthor.value.trim() || '匿名'
  const text = commentText.value.trim()
  const title = articleContent.querySelector('h2')? articleContent.querySelector('h2').textContent : ''
  const post = posts.find(p=>p.title===title)
  if(!post) return alert('無法找到該文章')
  if(!text) return alert('留言不可為空')
  comments[post.id] = comments[post.id] || []
  const now = new Date().toLocaleString()
  comments[post.id].push({author,text,date:now})
  lsSave(LS_COMMENTS, comments)
  commentText.value = ''
  renderComments(post.id)
})

closeModal && (closeModal.onclick = ()=>{ articleModal.classList.add('hidden'); articleModal.setAttribute('aria-hidden','true') })
articleModal && articleModal.addEventListener('click', (e)=>{ if(e.target===articleModal) closeModal && closeModal.onclick() })
searchInput && searchInput.addEventListener('input', ()=>{ currentPage = 1; renderPosts() })
sortSelect && sortSelect.addEventListener('change', ()=> renderPosts())

bookmarksBtn && bookmarksBtn.addEventListener('click', ()=>{ showingBookmarks = !showingBookmarks; bookmarksBtn.classList.toggle('active', showingBookmarks); currentPage = 1; renderPosts() })

function buildTagCloud(){
  const tagCounts = {}
  posts.forEach(p=> (p.tags||[]).forEach(t=> tagCounts[t] = (tagCounts[t]||0)+1))
  const cloud = document.getElementById('tagCloud')
  if(!cloud) return
  cloud.innerHTML = Object.keys(tagCounts).sort((a,b)=> tagCounts[b]-tagCounts[a]).map(t=> `<button class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)} <small style="opacity:0.7">${tagCounts[t]}</small></button>`).join('')
  cloud.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=>{ searchInput.value = b.dataset.tag; currentPage=1; renderPosts() }))
}

function renderRecommended(){
  const rec = posts.slice().sort((a,b)=> ((b.views||0)+(b.likes||0)) - ((a.views||0)+(a.likes||0))).slice(0,5)
  const box = document.getElementById('recommended')
  if(!box) return
  box.innerHTML = rec.map(r=> `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.02);cursor:pointer" data-id="${r.id}"><strong>${escapeHtml(r.title)}</strong><div style="color:var(--muted);font-size:0.9rem">${r.category} • ${r.date}</div></div>`).join('')
  box.querySelectorAll('[data-id]').forEach(el=> el.addEventListener('click', ()=>{ const p = posts.find(x=>x.id===el.dataset.id); openArticle(p) }))
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// initial
loadPosts()
