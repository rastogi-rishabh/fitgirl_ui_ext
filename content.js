var isModernActive = true;
var isSinglePage = false;
var singleGamePost = null;
var games = [];
var currentFilteredGames = [];
var renderLimit = 72;
var activeCategory = 'all';
var activeRatingFilter = 'all';
var activeSizeFilter = 'all';
var activeSearch = '';
var activeSort = 'newest';
var steamCache = {};
var intersectionObserver = null;
var syncStatus = { count: 0, isSyncing: false, progress: null };

var nextApiPage = 2;
var isFetchingNextPage = false;
var hasMoreApiPages = true;

var activeViewMode = 'grid';
var tablePage = 1;
var tablePerPage = 50;

var isFilterDrawerOpen = false;

var upcomingRepacks = [
  { title: "Monster Hunter Wilds", details: "v1.0 + Pre-order DLCs", postUrl: "https://fitgirl-repacks.site/upcoming-repacks/" },
  { title: "Kingdom Come: Deliverance II", details: "v1.0.2 + Bonus Content", postUrl: "https://fitgirl-repacks.site/upcoming-repacks/" },
  { title: "Civilization VII", details: "Deluxe Edition + DLCs", postUrl: "https://fitgirl-repacks.site/upcoming-repacks/" },
  { title: "Avowed", details: "v1.0 Lossless Repack", postUrl: "https://fitgirl-repacks.site/upcoming-repacks/" },
  { title: "Doom: The Dark Ages", details: "v1.0 + Soundtrack", postUrl: "https://fitgirl-repacks.site/upcoming-repacks/" }
];

safeStorageGet(['fg_modern_enabled'], (res) => {
  if (res && res.fg_modern_enabled === false || isSpecialNonGamePage()) {
    isModernActive = false;
    document.documentElement.classList.add('fg-modern-disabled');
  } else {
    document.documentElement.classList.remove('fg-modern-disabled');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
});

async function init() {
  createFloatingToggleButton();

  if (isSpecialNonGamePage()) {
    document.documentElement.classList.add('fg-modern-disabled');
    document.body.classList.remove('fg-modern-active');
    return;
  }

  createModernUIRoot();

  if (is404OrErrorPage()) {
    render404Page();
    return;
  }

  isSinglePage = checkIsSingleGamePage();

  if (isSinglePage) {
    singleGamePost = parseSinglePost(document);

    if (isModernActive) {
      document.documentElement.classList.remove('fg-modern-disabled');
      document.body.classList.add('fg-modern-active');

      renderSingleGamePage(singleGamePost);

      setTimeout(() => {
        const freshPost = parseSinglePost(document);
        renderSingleGamePage(freshPost);
      }, 150);
    }
    return;
  }

  try {
    const cachedGames = await FGDatabase.getAllGames();
    if (cachedGames && cachedGames.length > 0) {
      games = cachedGames;
      syncStatus.count = games.length;
    }
  } catch (e) {}

  if (isModernActive) {
    document.documentElement.classList.remove('fg-modern-disabled');
    document.body.classList.add('fg-modern-active');

    const domGames = parsePageGames(document);
    if (games.length === 0) {
      games = domGames;
    } else {
      domGames.forEach(dg => {
        if (!games.some(g => g.id === dg.id || g.pageUrl === dg.pageUrl)) {
          games.unshift(dg);
        }
      });
    }

    renderModernApp();
    setupSyncMessageListener();
    fetchUpcomingRepacks();
    fetchPopularRepacks();
    fetchUpdatesDigest();
    checkCatalogStatusAndBackgroundSync();
  } else {
    document.documentElement.classList.add('fg-modern-disabled');
    setupSyncMessageListener();
    fetchUpcomingRepacks();
    fetchPopularRepacks();
    fetchUpdatesDigest();
    checkCatalogStatusAndBackgroundSync();
  }
}

function createModernUIRoot() {
  if (document.getElementById('fg-modern-app-root')) return;

  const root = document.createElement('div');
  root.id = 'fg-modern-app-root';
  document.body.appendChild(root);
}

function createFloatingToggleButton() {
  if (document.getElementById('fg-modern-toggle-btn')) return;
  if (!document.body) return;

  const btn = document.createElement('button');
  btn.id = 'fg-modern-toggle-btn';
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
    <span>${isModernActive ? 'Original FitGirl UI' : 'Modern Library UI'}</span>
  `;

  btn.addEventListener('click', () => {
    isModernActive = !isModernActive;
    safeStorageSet({ fg_modern_enabled: isModernActive });

    if (isModernActive) {
      document.documentElement.classList.remove('fg-modern-disabled');
      document.body.classList.add('fg-modern-active');
      const root = document.getElementById('fg-modern-app-root');
      if (root) root.style.display = 'flex';
      if (isSinglePage && singleGamePost) {
        if (!root || root.children.length === 0) {
          renderSingleGamePage(singleGamePost);
        } else {
          embedLiveComments();
        }
      } else {
        renderModernApp();
      }
      btn.querySelector('span').textContent = 'Original FitGirl UI';
    } else {
      document.documentElement.classList.add('fg-modern-disabled');
      document.body.classList.remove('fg-modern-active');
      restoreLiveCommentsToOriginal();
      const root = document.getElementById('fg-modern-app-root');
      if (root) root.style.display = 'none';
      btn.querySelector('span').textContent = 'Modern Library UI';
    }
  });

  document.body.appendChild(btn);
}

function fetchUpcomingRepacks() {
  if (typeof fetch === 'undefined') return;

  fetch('https://fitgirl-repacks.site/wp-json/wp/v2/posts?slug=upcoming-repacks')
    .then(res => res.json())
    .then(posts => {
      let post = Array.isArray(posts) && posts.length > 0 ? posts[0] : null;
      if (!post) {
        return fetch('https://fitgirl-repacks.site/wp-json/wp/v2/posts?search=upcoming&per_page=10')
          .then(res => res.json())
          .then(searchPosts => {
            if (Array.isArray(searchPosts)) {
              return searchPosts.find(p => (p.title?.rendered || '').toLowerCase().includes('upcoming'));
            }
            return null;
          });
      }
      return post;
    })
    .then(upcomingPost => {
      if (!upcomingPost) {
        const domCleaned = parseUpcomingFromDom();
        if (domCleaned.length > 0) {
          upcomingRepacks = domCleaned.slice(0, 20);
          updateUpcomingRepacksUI();
        }
        return;
      }

      const html = upcomingPost.content?.rendered || '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      let rawItems = [];
      const liEls = tempDiv.querySelectorAll('li');
      if (liEls.length > 0) {
        rawItems = Array.from(liEls).map(el => stripTags(el.textContent).trim());
      } else {
        const text = stripTags(html);
        rawItems = text.split('\n').map(t => t.trim()).filter(Boolean);
      }

      const cleaned = [];
      rawItems.forEach(item => {
        const parsed = parseCleanUpcomingItem(item);
        if (parsed) {
          parsed.postUrl = upcomingPost.link || 'https://fitgirl-repacks.site/upcoming-repacks/';
          cleaned.push(parsed);
        }
      });

      if (cleaned.length > 0) {
        upcomingRepacks = cleaned.slice(0, 20);
        updateUpcomingRepacksUI();
      }
    })
    .catch(() => {
      const domCleaned = parseUpcomingFromDom();
      if (domCleaned.length > 0) {
        upcomingRepacks = domCleaned.slice(0, 20);
        updateUpcomingRepacksUI();
      }
    });
}

function fetchPopularRepacks() {
  const popItems = [];
  document.querySelectorAll('.widget_popular_posts li, #wplp_widget-2 li').forEach(li => {
    const a = li.querySelector('a');
    if (a) {
      const rawTitle = a.textContent.trim();
      const pageUrl = a.getAttribute('href') || '';
      const img = li.querySelector('img');
      const coverImg = img ? img.getAttribute('src') || '' : '';
      if (rawTitle && pageUrl) {
        popItems.push({
          id: `pop-${pageUrl}`,
          rawTitle,
          title: rawTitle.replace(/^#\d+\s*/, '').replace(/[\–\—\-]\s*v\d+.*/i, '').trim(),
          pageUrl,
          coverImg,
          date: '',
          genres: []
        });
      }
    }
  });

  if (popItems.length > 0) {
    popularRepacks = popItems;
    if (activeHeroTab === 'popular') updateHeroCarouselDOM();
  } else {
    fetch('https://fitgirl-repacks.site/wp-json/wp/v2/posts?categories=2&per_page=10')
      .then(res => res.json())
      .then(posts => {
        if (Array.isArray(posts) && posts.length > 0) {
          popularRepacks = posts.map(p => parseWpPost(p)).filter(Boolean);
          if (activeHeroTab === 'popular') updateHeroCarouselDOM();
        }
      })
      .catch(() => {});
  }
}

function fetchUpdatesDigest() {
  fetch('https://fitgirl-repacks.site/wp-json/wp/v2/posts?search=digest&per_page=8')
    .then(res => res.json())
    .then(posts => {
      if (Array.isArray(posts) && posts.length > 0) {
        const digests = [];
        posts.forEach(p => {
          const rawTitle = stripTags(p.title?.rendered || '').trim();
          if (rawTitle.toLowerCase().includes('digest')) {
            digests.push({
              id: `digest-${p.id}`,
              title: rawTitle,
              details: stripTags(p.excerpt?.rendered || '').slice(0, 140) + '...',
              postUrl: p.link || '',
              date: p.date ? p.date.split('T')[0] : '',
              coverImg: 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg'
            });
          }
        });
        if (digests.length > 0) {
          updatesDigestList = digests;
          if (activeHeroTab === 'digest') updateHeroCarouselDOM();
        }
      }
    })
    .catch(() => {});
}

function updateUpcomingRepacksUI() {
  if (!isModernActive || isSinglePage) return;
  if (activeHeroTab === 'upcoming') {
    updateHeroCarouselDOM();
  }
}

function loadNextApiPage() {
  if (isFetchingNextPage || !hasMoreApiPages) return;
  isFetchingNextPage = true;

  const loaderEl = document.getElementById('fg-loader');
  if (loaderEl) {
    loaderEl.innerHTML = `<div class="fg-spinner-loader"><div class="fg-spinner"></div></div>`;
  }

  fetch(`https://fitgirl-repacks.site/wp-json/wp/v2/posts?per_page=50&page=${nextApiPage}`)
    .then(res => {
      if (!res.ok) {
        hasMoreApiPages = false;
        throw new Error('No more pages');
      }
      return res.json();
    })
    .then(posts => {
      isFetchingNextPage = false;
      if (!posts || !Array.isArray(posts) || posts.length === 0) {
        hasMoreApiPages = false;
        if (isModernActive && !isSinglePage) renderModernApp();
        return;
      }

      const newGames = [];
      posts.forEach(post => {
        const parsed = parseWpPost(post);
        if (parsed && !games.some(g => g.id === parsed.id || g.pageUrl === parsed.pageUrl)) {
          games.push(parsed);
          newGames.push(parsed);
        }
      });

      if (newGames.length > 0) {
        FGDatabase.saveGames(newGames).catch(() => {});
      }

      nextApiPage++;
      renderLimit += 48;
      syncStatus.count = games.length;
      updateSyncBadgeUI();

      if (isModernActive && !isSinglePage) {
        renderModernApp();
      }
    })
    .catch(() => {
      isFetchingNextPage = false;
      if (isModernActive && !isSinglePage) renderModernApp();
    });
}

function checkCatalogStatusAndBackgroundSync() {
  safeSendMessage({ action: 'GET_CATALOG_STATUS' }, (res) => {
    if (res && res.success) {
      syncStatus.isSyncing = res.isSyncing;
      syncStatus.progress = res.progress;
      syncStatus.count = res.count || games.length;
      updateSyncBadgeUI();

      if (res.count === 0 && games.length === 0 && !res.isSyncing) {
        triggerCatalogSync(false);
      } else {
        performIncrementalCheck();
      }
    }
  });
}

async function performIncrementalCheck() {
  if (syncStatus.isSyncing) return;
  try {
    const res = await fetch('https://fitgirl-repacks.site/wp-json/wp/v2/posts?per_page=20&page=1');
    if (!res.ok) return;
    const posts = await res.json();
    if (!Array.isArray(posts)) return;

    const newGames = [];
    posts.forEach(post => {
      const parsed = parseWpPost(post);
      if (parsed && !games.some(g => g.id === parsed.id || g.pageUrl === parsed.pageUrl)) {
        games.unshift(parsed);
        newGames.push(parsed);
      }
    });

    if (newGames.length > 0) {
      await FGDatabase.saveGames(newGames);
      syncStatus.count = games.length;
      updateSyncBadgeUI();
      if (isModernActive && !isSinglePage) {
        renderModernApp();
      }
    }
  } catch (e) {}
}

function setupSyncMessageListener() {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) return;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'GET_LOCAL_GAMES_LIST') {
      sendResponse({ success: true, games: games });
      return true;
    }

    if (msg.action === 'STEAM_DATA_ENRICHED') {
      const g = games.find(item => item.id === msg.gameId);
      if (g) {
        g.steamData = msg.steamData;
        FGDatabase.saveGames([g]).catch(() => {});
        updateGameCardSteamUI(g);
      }
    }

    if (msg.action === 'SYNC_CATALOG_PROGRESS') {
      syncStatus.isSyncing = msg.progress?.status === 'syncing';
      syncStatus.progress = msg.progress;
      syncStatus.count = msg.count || syncStatus.count;

      updateSyncBadgeUI();
      updateSyncModalProgress(msg.progress, msg.count);

      if (msg.gamesChunk && msg.gamesChunk.length > 0) {
        FGDatabase.saveGames(msg.gamesChunk).catch(() => {});
        msg.gamesChunk.forEach(item => {
          if (!games.some(g => g.id === item.id || g.pageUrl === item.pageUrl)) {
            games.push(item);
          }
        });
      }

      if (msg.progress?.status === 'completed') {
        syncStatus.isSyncing = false;
        loadStoredCatalog();
      }
    }
  });
}
