function cleanInlineDarkColors(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/style=["'][^"']*(?:color:\s*(?:#000000|#000|black|#111111|#1a1a1a|#222222|#333333|#444444|#555555|#0b0e14|#121826|rgb\(0,\s*0,\s*0\))|background(?:-color)?:\s*(?:#ffffff|#fff|white|#eeeeee|#eee|#f5f5f5|#fafafa|#f0f0f0|#dfdfdf|rgb\(255,\s*255,\s*255\)));?[^"']*["']/gi, '')
    .replace(/color=["'](#000000|#000|black|#111111|#1a1a1a|#222222|#333333|#444444|#555555)["']/gi, '')
    .replace(/bgcolor=["'][^"']*["']/gi, '');
}

function stripTags(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function parseSizeBytes(sizeStr) {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/([\d\.]+)\s*(GB|MB|KB|TB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024;
  if (unit === 'GB') return val * 1024 * 1024 * 1024;
  if (unit === 'MB') return val * 1024 * 1024;
  if (unit === 'KB') return val * 1024;
  return val;
}

function getActiveFilterCount() {
  let count = 0;
  if (typeof activeCategory !== 'undefined' && activeCategory !== 'all') count++;
  if (typeof activeRatingFilter !== 'undefined' && activeRatingFilter !== 'all') count++;
  if (typeof activeSizeFilter !== 'undefined' && activeSizeFilter !== 'all') count++;
  if (typeof activeSort !== 'undefined' && activeSort !== 'newest') count++;
  return count;
}

function detectPostType(rawTitle, html, categoryClasses = '') {
  if (!rawTitle) return 'unknown';
  const titleLower = rawTitle.toLowerCase().trim();
  const catLower = (categoryClasses || '').toLowerCase();

  if (catLower.includes('category-updates-digest') || titleLower.includes('updates digest')) {
    return 'digest';
  }
  if (titleLower.includes('upcoming repacks')) {
    return 'upcoming';
  }

  const nonGameKeywords = [
    'hello, crowd', 'hello world', 'donation', 'donate', 'contact',
    'troubleshooting', 'faq', 'hypervisor', 'how to install', 'selective download'
  ];
  if (nonGameKeywords.some(kw => titleLower.includes(kw))) {
    return 'blog';
  }

  const hasLosslessCat = catLower.includes('category-lossless-repack') || catLower.includes('lossless-repack');
  const hasRepackNumber = /^#\d+/i.test(titleLower);
  const hasRepackSize = html && (/Repack Size:/i.test(html) || /Original Size:/i.test(html));
  const hasMagnet = html && /href=["']magnet:\?/i.test(html);
  const hasMirrors = html && (/Download Mirrors/i.test(html) || /Repack Features/i.test(html));

  if (hasLosslessCat || hasRepackNumber || (hasRepackSize && hasMagnet) || (hasMagnet && hasMirrors)) {
    return 'repack';
  }

  return 'blog';
}

function isGameRepackPost(rawTitle, html, magnetUrl, repackSize, categoryClasses = '') {
  const type = detectPostType(rawTitle, html, categoryClasses);
  if (type === 'repack') return true;
  if (type !== 'blog' && type !== 'digest' && type !== 'upcoming') {
    return (magnetUrl && magnetUrl.startsWith('magnet:')) && !!(repackSize && repackSize.trim().length > 0);
  }
  return false;
}

function isSpecialNonGamePage() {
  const path = window.location.pathname.toLowerCase();
  const specialPaths = [
    '/donations', '/contacts', '/faq', '/repacks-troubleshooting',
    '/hypervisor-guide', '/hello-world', '/hello-crowd', '/how-to-install', '/selective-download'
  ];
  return specialPaths.some(p => path.includes(p));
}

function is404OrErrorPage() {
  return document.body.classList.contains('error404') ||
         !!document.getElementById('error-404') ||
         !!document.querySelector('.error-404') ||
         !!document.querySelector('.not-found') ||
         (document.title && document.title.toLowerCase().includes('page not found'));
}

function checkIsSingleGamePage() {
  const path = window.location.pathname.toLowerCase();
  const isCatalog = path === '/' || path === '' || path.startsWith('/page/') || path.startsWith('/category/') || path.startsWith('/tag/') || path.includes('/popular-repacks') || path.includes('/all-my-repacks');
  if (isCatalog) return false;

  if (isSpecialNonGamePage()) return false;

  const article = document.querySelector('article.hentry, article.post, article');
  if (!article) return false;

  const titleText = article.querySelector('.entry-title')?.textContent || document.title;
  const contentHtml = article.querySelector('.entry-content')?.innerHTML || article.innerHTML;
  const categoryClasses = article.className || '';

  const postType = detectPostType(titleText, contentHtml, categoryClasses);
  if (postType !== 'repack') {
    return false;
  }

  if (document.body.classList.contains('single') ||
      document.body.classList.contains('single-post') ||
      document.body.classList.contains('singular') ||
      (path.length > 3 && !path.includes('/search/') && !path.includes('/author/'))) {
    return true;
  }
  return false;
}

function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

function safeStorageSet(data, callback) {
  try {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, () => {
        try {
          if (chrome.runtime?.lastError) {}
        } catch (err) {}
        if (callback) callback();
      });
    }
  } catch (e) {}
}

function safeStorageGet(keys, callback) {
  try {
    if (isExtensionContextValid() && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, (res) => {
        try {
          if (chrome.runtime?.lastError) {
            if (callback) callback({});
            return;
          }
        } catch (err) {}
        if (callback) callback(res || {});
      });
    } else if (callback) {
      callback({});
    }
  } catch (e) {
    if (callback) callback({});
  }
}

function safeSendMessage(msg, callback) {
  try {
    if (isExtensionContextValid() && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(msg, (res) => {
        try {
          if (chrome.runtime?.lastError) {
            if (callback) callback(null);
            return;
          }
        } catch (err) {}
        if (callback) callback(res);
      });
    } else if (callback) {
      callback(null);
    }
  } catch (e) {
    if (callback) callback(null);
  }
}
