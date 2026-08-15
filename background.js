let isSyncingCatalog = false;
let syncProgress = { current: 0, totalPages: 0, totalItems: 0, percent: 0, status: 'idle' };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_STEAM_DATA') {
    fetchSteamDataDirect(request.title, request.rawTitle)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'SYNC_CATALOG') {
    if (!isSyncingCatalog) {
      syncCatalog(request.full === true)
        .then(count => sendResponse({ success: true, count }))
        .catch(err => sendResponse({ success: false, error: err.message }));
    } else {
      sendResponse({ success: true, syncing: true, progress: syncProgress });
    }
    return true;
  }

  if (request.action === 'GET_CATALOG_STATUS') {
    chrome.storage.local.get(['fg_catalog_count', 'fg_catalog_last_sync'], (res) => {
      sendResponse({
        success: true,
        count: res.fg_catalog_count || 0,
        lastSync: res.fg_catalog_last_sync || null,
        isSyncing: isSyncingCatalog,
        progress: syncProgress
      });
    });
    return true;
  }

  if (request.action === 'CLEAR_CACHE') {
    chrome.storage.local.clear(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

function cleanGameTitleForSteam(title, rawTitle) {
  let t = (title || rawTitle || '').trim();

  t = t.replace(/^#\d+\s*/i, '');

  if (t.includes(' / ')) {
    t = t.split(' / ')[0].trim();
  }

  t = t.replace(/[\–\—\-]\s*(?:v\d|build\s*\d|update\s*\d|patch\s*\d|hotfix).*$/i, '');
  t = t.replace(/\b(?:v\d+[\d\.]*|build\s*\d+|update\s*\d+|hotfix\s*\d*)\b.*$/i, '');

  t = t.replace(/\b(?:Digital\s+)?(?:Deluxe|Ultimate|Complete|Enhanced|Definitive|Collector'?s|Premium|Gold|Anniversary|Special|Standard|Extended|Legacy|Master)\s+(?:Edition|Version|Cut|Bundle|Pack)\b/gi, '');
  t = t.replace(/\b(?:Game of the Year Edition|GOTY Edition|GOTY)\b/gi, '');
  t = t.replace(/\b(?:Director'?s Cut|Remastered|Remake)\b/gi, '');

  t = t.replace(/\[.*?\]/g, ' ');
  t = t.replace(/\(.*?\)/g, ' ');
  t = t.replace(/\+.*$/, ' ');

  t = t.replace(/[–—\:\,\!\?\"\'\™\®]/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();

  if (t.length < 2 && title) {
    t = title.split(/[\:–—\-\[\(]/)[0].replace(/[^\w\s]/g, ' ').trim();
  }

  return t;
}

async function fetchSteamDataDirect(title, rawTitle) {
  const normalizedTitle = cleanGameTitleForSteam(title, rawTitle);
  if (!normalizedTitle || normalizedTitle.length < 2) {
    return { found: false };
  }

  const cacheKey = `steam_single_${normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const cached = await new Promise(resolve => chrome.storage.local.get([cacheKey], res => resolve(res[cacheKey])));
  if (cached && (Date.now() - cached.timestamp < 14 * 24 * 60 * 60 * 1000)) {
    return cached.data;
  }

  try {
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(normalizedTitle)}&l=english&cc=US`;
    let searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      return { found: false };
    }

    const searchData = await searchRes.json();

    if (!searchData || !searchData.items || searchData.items.length === 0) {
      const nullData = { found: false, title: normalizedTitle };
      chrome.storage.local.set({ [cacheKey]: { timestamp: Date.now(), data: nullData } });
      return nullData;
    }

    const match = searchData.items[0];
    const appId = match.id;

    const detailsPromise = fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    const reviewsPromise = fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all`)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    const [detailsRes, reviewsRes] = await Promise.all([detailsPromise, reviewsPromise]);

    let appDetails = null;
    if (detailsRes && detailsRes[appId] && detailsRes[appId].success) {
      appDetails = detailsRes[appId].data;
    }

    let reviewInfo = {
      scoreDesc: 'No Reviews',
      percent: null,
      total: 0,
      positive: 0,
      negative: 0
    };

    if (reviewsRes && reviewsRes.query_summary) {
      const qs = reviewsRes.query_summary;
      const total = qs.total_reviews || 0;
      const pos = qs.total_positive || 0;
      const pct = total > 0 ? Math.round((pos / total) * 100) : null;

      reviewInfo = {
        scoreDesc: qs.review_score_desc || 'User Reviews',
        percent: pct,
        total: total,
        positive: pos,
        negative: qs.total_negative || 0,
        scoreRating: qs.review_score
      };
    }

    const result = {
      found: true,
      appId: appId,
      name: appDetails?.name || match.name,
      tinyImage: match.tiny_image,
      headerImage: appDetails?.header_image || match.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      capsuleImage: appDetails?.header_image || appDetails?.capsule_image || match.tiny_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      heroImage: appDetails?.screenshots?.[0]?.path_full || appDetails?.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/page_bg_generated_v6.jpg`,
      shortDescription: appDetails?.short_description || '',
      developers: appDetails?.developers || [],
      publishers: appDetails?.publishers || [],
      genres: appDetails?.genres?.map(g => g.description) || [],
      tags: appDetails?.categories?.map(c => c.description).slice(0, 6) || [],
      releaseDate: appDetails?.release_date?.date || '',
      price: appDetails?.price_overview?.final_formatted || (appDetails?.is_free ? 'Free' : ''),
      screenshots: appDetails?.screenshots?.map(s => s.path_full).slice(0, 6) || [],
      trailers: appDetails?.movies?.map(m => ({
        name: m.name,
        thumbnail: m.thumbnail,
        webm: m.webm?.max || m.webm?.['480'],
        mp4: m.mp4?.max || m.mp4?.['480']
      })) || [],
      reviews: reviewInfo,
      steamUrl: `https://store.steampowered.com/app/${appId}/`
    };

    chrome.storage.local.set({ [cacheKey]: { timestamp: Date.now(), data: result } });
    return result;

  } catch (err) {
    return { found: false, error: err.message };
  }
}

async function syncCatalog(isFull = false) {
  isSyncingCatalog = true;
  syncProgress = { current: 0, totalPages: 1, totalItems: 0, percent: 0, status: 'starting' };

  let page = 1;
  let totalPages = 1;
  let totalItemsCount = 0;

  try {
    while (page <= totalPages) {
      const url = `https://fitgirl-repacks.site/wp-json/wp/v2/posts?per_page=100&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) break;

      const headerPages = res.headers.get('X-WP-TotalPages');
      const headerTotal = res.headers.get('X-WP-Total');
      if (headerPages) totalPages = parseInt(headerPages, 10);
      if (headerTotal) totalItemsCount = parseInt(headerTotal, 10);

      const percent = totalPages > 0 ? Math.min(100, Math.round((page / totalPages) * 100)) : 0;
      syncProgress = {
        current: page,
        totalPages: totalPages,
        totalItems: totalItemsCount,
        percent: isFull ? percent : 100,
        status: 'syncing'
      };

      const posts = await res.json();
      if (!posts || !Array.isArray(posts) || posts.length === 0) break;

      const chunk = [];
      posts.forEach(post => {
        const parsed = parseWpPost(post);
        if (parsed) chunk.push(parsed);
      });

      broadcastSyncProgress(syncProgress, chunk);

      if (!isFull) {
        break;
      }

      page++;
    }

    syncProgress.status = 'completed';
    syncProgress.percent = 100;

    await new Promise(resolve => {
      chrome.storage.local.set({
        fg_catalog_count: totalItemsCount,
        fg_catalog_last_sync: Date.now()
      }, resolve);
    });

    broadcastSyncProgress(syncProgress, []);
    return totalItemsCount;

  } catch (err) {
    syncProgress.status = 'error';
    broadcastSyncProgress(syncProgress, []);
    throw err;
  } finally {
    isSyncingCatalog = false;
  }
}

function broadcastSyncProgress(progress, chunk) {
  chrome.tabs.query({ url: 'https://fitgirl-repacks.site/*' }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SYNC_CATALOG_PROGRESS',
        progress: progress,
        count: progress.totalItems,
        gamesChunk: chunk
      }).catch(() => {});
    });
  });
}

function parseWpPost(post) {
  const rawTitle = stripHtmlTags(post.title?.rendered || '').trim();
  if (!rawTitle) return null;

  const rawLower = rawTitle.toLowerCase();
  const pageUrl = post.link || '';
  const date = post.date ? post.date.split('T')[0] : '';
  const id = `post-${post.id}`;
  const html = post.content?.rendered || '';

  let magnetUrl = '';
  const magnetMatch = html.match(/href=["'](magnet:\?[^"']+)["']/i);
  if (magnetMatch) magnetUrl = magnetMatch[1];

  let repackSize = '';
  const repackSizeMatch = html.match(/Repack Size:\s*<strong>(.*?)<\/strong>/i) || html.match(/Repack Size:\s*(.*?)(<br|<\/p)/i);
  if (repackSizeMatch) repackSize = stripHtmlTags(repackSizeMatch[1]).trim();

  const nonGameKeywords = [
    'hello, crowd', 'hello world', 'updates digest', 'upcoming repacks',
    'donation', 'donate', 'contact', 'troubleshooting', 'faq', 'hypervisor',
    'how to install', 'selective download'
  ];
  if (nonGameKeywords.some(kw => rawLower.includes(kw))) {
    return null;
  }

  const hasRepackNumber = /^#\d+/i.test(rawLower);
  const hasRepackSize = !!(repackSize && repackSize.trim().length > 0);
  const hasMagnet = !!(magnetUrl && magnetUrl.startsWith('magnet:'));
  const hasRepackHtml = html && (html.includes('Download Mirrors') || html.includes('Repack Features') || html.includes('Repack Size'));

  if (!hasRepackNumber && !hasRepackSize && !hasMagnet && !hasRepackHtml) {
    return null;
  }

  let coverImg = '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) coverImg = imgMatch[1];
  if (coverImg) {
    coverImg = coverImg.replace(/^http:\/\//i, 'https://');
    if (coverImg.startsWith('/')) {
      coverImg = 'https://fitgirl-repacks.site' + coverImg;
    }
  }

  let originalSize = '';
  const originalSizeMatch = html.match(/Original Size:\s*<strong>(.*?)<\/strong>/i) || html.match(/Original Size:\s*(.*?)(<br|<\/p)/i);
  if (originalSizeMatch) originalSize = stripHtmlTags(originalSizeMatch[1]).trim();

  const repackSizeBytes = parseSizeBytes(repackSize);

  let genres = [];
  const genresMatch = html.match(/Genres\/Tags:\s*(.*?)(<br|<\/p)/i);
  if (genresMatch) {
    const genreLinks = genresMatch[1].match(/<a[^>]*>(.*?)<\/a>/gi) || [];
    genres = genreLinks.map(a => stripHtmlTags(a).trim()).filter(Boolean);
  }

  let companies = '';
  const companyMatch = html.match(/Companies:\s*<strong>(.*?)<\/strong>/i) || html.match(/Company:\s*<strong>(.*?)<\/strong>/i);
  if (companyMatch) companies = stripHtmlTags(companyMatch[1]).trim();

  let languages = '';
  const langMatch = html.match(/Languages:\s*<strong>(.*?)<\/strong>/i);
  if (langMatch) languages = stripTags(langMatch[1]).trim();

  let cleanTitle = rawTitle
    .replace(/^#\d+\s*/, '')
    .replace(/[\–\—\-]\s*v\d+.*/i, '')
    .replace(/\+.*$/, '')
    .trim();

  return {
    id,
    rawTitle,
    title: cleanTitle,
    pageUrl,
    date,
    coverImg,
    magnetUrl,
    repackSize,
    repackSizeBytes,
    originalSize,
    genres,
    companies,
    languages,
    isDonation: false,
    steamData: null
  };
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

function stripHtmlTags(str) {
  return str.replace(/<\/?[^>]+(>|$)/g, '');
}

function stripTags(html) {
  return stripHtmlTags(html);
}
