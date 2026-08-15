function parseSinglePost(domContext) {
  const article = domContext.querySelector('article.hentry') || domContext;
  const titleEl = article.querySelector('.entry-title');
  const rawTitle = titleEl ? titleEl.textContent.trim() : document.title.replace('- FitGirl Repacks', '').trim();
  const pageUrl = window.location.href;
  const articleId = article.id || 'single-game-post';

  const dateEl = article.querySelector('.entry-date');
  const date = dateEl ? dateEl.textContent.trim() : '';

  const contentEl = article.querySelector('.entry-content') || article.querySelector('.post-content') || article;

  let coverImg = '';
  const imgEl = contentEl.querySelector('img.alignleft, img.wplp_thumb, img.swiper-lazy, img');
  if (imgEl) {
    coverImg = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.getAttribute('srcset')?.split(' ')[0] || '';
  }
  if (coverImg) {
    coverImg = coverImg.replace(/^http:\/\//i, 'https://');
    if (coverImg.startsWith('/')) {
      coverImg = 'https://fitgirl-repacks.site' + coverImg;
    }
  }

  let magnetUrl = '';
  const magnetEl = article.querySelector('a[href^="magnet:?"]');
  if (magnetEl) magnetUrl = magnetEl.getAttribute('href');

  const contentHtml = contentEl.innerHTML;
  let repackSize = '';
  let originalSize = '';
  let genres = [];
  let companies = '';
  let languages = '';

  const repackSizeMatch = contentHtml.match(/Repack Size:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Repack Size:\s*(.*?)(<br|<\/p)/i);
  if (repackSizeMatch) repackSize = stripTags(repackSizeMatch[1]).trim();

  const originalSizeMatch = contentHtml.match(/Original Size:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Original Size:\s*(.*?)(<br|<\/p)/i);
  if (originalSizeMatch) originalSize = stripTags(originalSizeMatch[1]).trim();

  const genresMatch = contentHtml.match(/Genres\/Tags:\s*(.*?)(<br|<\/p)/i);
  if (genresMatch) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = genresMatch[1];
    genres = Array.from(tempDiv.querySelectorAll('a')).map(a => a.textContent.trim());
  }

  const companyMatch = contentHtml.match(/Companies:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Company:\s*<strong>(.*?)<\/strong>/i);
  if (companyMatch) companies = stripTags(companyMatch[1]).trim();

  const langMatch = contentHtml.match(/Languages:\s*<strong>(.*?)<\/strong>/i);
  if (langMatch) languages = stripTags(langMatch[1]).trim();

  let cleanTitle = rawTitle
    .replace(/^#\d+\s*/, '')
    .replace(/[\–\—\-]\s*v\d+.*/i, '')
    .replace(/\+.*$/, '')
    .trim();

  const screenshots = [];
  const seenSrcs = new Set();
  const screenshotImgs = contentEl.querySelectorAll('a[href*="riotpixels"] img, a[href*="imageban"] img, a[href*="image"] img, p img, .su-spoiler img');
  screenshotImgs.forEach(img => {
    let src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    if (!src || src.includes('cropped-icon') || src === coverImg) return;
    if (src.startsWith('http://')) src = src.replace(/^http:\/\//i, 'https://');
    if (seenSrcs.has(src)) return;
    seenSrcs.add(src);

    const parentA = img.closest('a');
    let fullUrl = parentA ? (parentA.getAttribute('href') || '') : '';
    if (fullUrl.startsWith('http://')) fullUrl = fullUrl.replace(/^http:\/\//i, 'https://');
    if (!fullUrl) {
      fullUrl = src.includes('.240p.jpg') ? src.replace(/\.240p\.jpg$/i, '.jpg') : src;
    }

    screenshots.push({
      thumb: src,
      fullUrl: fullUrl
    });
  });

  let mirrorsHtml = '';
  const mirrorsHeader = Array.from(contentEl.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Download Mirrors'));
  if (mirrorsHeader) {
    let curr = mirrorsHeader.nextElementSibling;
    while (curr && curr.tagName !== 'H3') {
      mirrorsHtml += curr.outerHTML;
      curr = curr.nextElementSibling;
    }
  }

  let featuresHtml = '';
  const featuresHeader = Array.from(contentEl.querySelectorAll('h3')).find(h3 => h3.textContent.includes('Repack Features'));
  if (featuresHeader) {
    let curr = featuresHeader.nextElementSibling;
    while (curr && curr.tagName !== 'H3') {
      featuresHtml += curr.outerHTML;
      curr = curr.nextElementSibling;
    }
  }

  return {
    id: articleId,
    rawTitle: rawTitle,
    title: cleanTitle,
    pageUrl: pageUrl,
    date: date,
    coverImg: coverImg,
    magnetUrl: magnetUrl,
    repackSize: repackSize,
    repackSizeBytes: parseSizeBytes(repackSize),
    originalSize: originalSize,
    genres: genres,
    companies: companies,
    languages: languages,
    screenshots: screenshots,
    trailerUrl: '',
    contentHtml: cleanInlineDarkColors(contentHtml),
    mirrorsHtml: cleanInlineDarkColors(mirrorsHtml),
    featuresHtml: cleanInlineDarkColors(featuresHtml),
    steamData: null
  };
}

function parseWpPost(post) {
  const rawTitle = stripTags(post.title?.rendered || '').trim();
  if (!rawTitle) return null;

  const pageUrl = post.link || '';
  const date = post.date ? post.date.split('T')[0] : '';
  const id = `post-${post.id}`;
  const html = post.content?.rendered || '';

  let magnetUrl = '';
  const magnetMatch = html.match(/href=["'](magnet:\?[^"']+)["']/i);
  if (magnetMatch) magnetUrl = magnetMatch[1];

  let repackSize = '';
  const repackSizeMatch = html.match(/Repack Size:\s*<strong>(.*?)<\/strong>/i) || html.match(/Repack Size:\s*(.*?)(<br|<\/p)/i);
  if (repackSizeMatch) repackSize = stripTags(repackSizeMatch[1]).trim();

  if (!isGameRepackPost(rawTitle, html, magnetUrl, repackSize)) {
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
  if (originalSizeMatch) originalSize = stripTags(originalSizeMatch[1]).trim();

  const repackSizeBytes = parseSizeBytes(repackSize);

  let genres = [];
  const genresMatch = html.match(/Genres\/Tags:\s*(.*?)(<br|<\/p)/i);
  if (genresMatch) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = genresMatch[1];
    genres = Array.from(tempDiv.querySelectorAll('a')).map(a => a.textContent.trim()).filter(Boolean);
  }

  let companies = '';
  const companyMatch = html.match(/Companies:\s*<strong>(.*?)<\/strong>/i) || html.match(/Company:\s*<strong>(.*?)<\/strong>/i);
  if (companyMatch) companies = stripTags(companyMatch[1]).trim();

  let languages = '';
  const langMatch = html.match(/Languages:\s*<strong>(.*?)<\/strong>/i);
  if (langMatch) languages = stripTags(langMatch[1]).trim();

  let cleanTitle = rawTitle
    .replace(/^#\d+\s*/, '')
    .replace(/[\–\—\-]\s*v\d+.*/i, '')
    .replace(/\+.*$/, '')
    .trim();

  return {
    id: id,
    rawTitle: rawTitle,
    title: cleanTitle,
    pageUrl: pageUrl,
    date: date,
    coverImg: coverImg,
    magnetUrl: magnetUrl,
    repackSize: repackSize,
    repackSizeBytes: repackSizeBytes,
    originalSize: originalSize,
    genres: genres,
    companies: companies,
    languages: languages,
    screenshots: [],
    trailerUrl: '',
    contentHtml: cleanInlineDarkColors(html),
    isDonation: false,
    steamData: null
  };
}

function parsePageGames(domContext) {
  const parsedGames = [];
  const articles = domContext.querySelectorAll('article.hentry');

  articles.forEach((article) => {
    const titleEl = article.querySelector('.entry-title a');
    if (!titleEl) return;

    const rawTitle = titleEl.textContent.trim();
    const pageUrl = titleEl.getAttribute('href') || '';
    const articleId = article.id || `game-${Math.random().toString(36).substr(2, 9)}`;

    const dateEl = article.querySelector('.entry-date');
    const date = dateEl ? dateEl.textContent.trim() : '';

    const contentEl = article.querySelector('.entry-content');
    if (!contentEl) return;

    const contentHtml = contentEl.innerHTML;

    let magnetUrl = '';
    const magnetEl = article.querySelector('a[href^="magnet:?"]');
    if (magnetEl) magnetUrl = magnetEl.getAttribute('href');

    let repackSize = '';
    const repackSizeMatch = contentHtml.match(/Repack Size:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Repack Size:\s*(.*?)(<br|<\/p)/i);
    if (repackSizeMatch) repackSize = stripTags(repackSizeMatch[1]).trim();

    if (!isGameRepackPost(rawTitle, contentHtml, magnetUrl, repackSize)) {
      return;
    }

    let coverImg = '';
    const imgEl = contentEl.querySelector('img.alignleft, img.wplp_thumb, img.swiper-lazy, img');
    if (imgEl) {
      coverImg = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || imgEl.getAttribute('srcset')?.split(' ')[0] || '';
    }
    if (coverImg) {
      coverImg = coverImg.replace(/^http:\/\//i, 'https://');
      if (coverImg.startsWith('/')) {
        coverImg = 'https://fitgirl-repacks.site' + coverImg;
      }
    }

    let originalSize = '';
    const originalSizeMatch = contentHtml.match(/Original Size:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Original Size:\s*(.*?)(<br|<\/p)/i);
    if (originalSizeMatch) originalSize = stripTags(originalSizeMatch[1]).trim();

    const genresMatch = contentHtml.match(/Genres\/Tags:\s*(.*?)(<br|<\/p)/i);
    let genres = [];
    if (genresMatch) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = genresMatch[1];
      genres = Array.from(tempDiv.querySelectorAll('a')).map(a => a.textContent.trim());
    }

    const companyMatch = contentHtml.match(/Companies:\s*<strong>(.*?)<\/strong>/i) || contentHtml.match(/Company:\s*<strong>(.*?)<\/strong>/i);
    let companies = '';
    if (companyMatch) companies = stripTags(companyMatch[1]).trim();

    const langMatch = contentHtml.match(/Languages:\s*<strong>(.*?)<\/strong>/i);
    let languages = '';
    if (langMatch) languages = stripTags(langMatch[1]).trim();

    let cleanTitle = rawTitle
      .replace(/^#\d+\s*/, '')
      .replace(/[\–\—\-]\s*v\d+.*/i, '')
      .replace(/\+.*$/, '')
      .trim();

    const screenshots = [];
    const seenPageSrcs = new Set();
    const screenshotImgs = contentEl.querySelectorAll('a[href*="riotpixels"] img, a[href*="imageban"] img, a[href*="image"] img, p img, .su-spoiler img');
    screenshotImgs.forEach(img => {
      let src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      if (!src || src.includes('cropped-icon') || src === coverImg) return;
      if (src.startsWith('http://')) src = src.replace(/^http:\/\//i, 'https://');
      if (seenPageSrcs.has(src)) return;
      seenPageSrcs.add(src);

      const parentA = img.closest('a');
      let fullUrl = parentA ? (parentA.getAttribute('href') || '') : '';
      if (fullUrl.startsWith('http://')) fullUrl = fullUrl.replace(/^http:\/\//i, 'https://');
      if (!fullUrl) {
        fullUrl = src.includes('.240p.jpg') ? src.replace(/\.240p\.jpg$/i, '.jpg') : src;
      }
      screenshots.push({ thumb: src, fullUrl: fullUrl });
    });

    parsedGames.push({
      id: articleId,
      rawTitle: rawTitle,
      title: cleanTitle,
      pageUrl: pageUrl,
      date: date,
      coverImg: coverImg,
      magnetUrl: magnetUrl,
      repackSize: repackSize,
      repackSizeBytes: parseSizeBytes(repackSize),
      originalSize: originalSize,
      genres: genres,
      companies: companies,
      languages: languages,
      screenshots: screenshots.slice(0, 5),
      trailerUrl: '',
      contentHtml: contentHtml,
      isDonation: false,
      steamData: null
    });
  });

  return parsedGames;
}

function parseCleanUpcomingItem(rawStr) {
  if (!rawStr) return null;
  let s = rawStr.trim();

  const lower = s.toLowerCase();
  if (
    lower.includes('{border:') ||
    lower.includes('padding:') ||
    lower.includes('margin:') ||
    lower.includes('do not ask') ||
    lower.includes('never serve requests') ||
    lower.includes('latest repacks') ||
    lower.includes('upcoming repacks') ||
    lower.includes('no particular order') ||
    lower.includes('wplp_outside') ||
    lower.includes('donate') ||
    s.length < 3
  ) {
    return null;
  }

  s = s.replace(/^[⇢\-\>\*\•\#\s]+/, '').trim();

  let title = s;
  let details = '';

  if (s.includes(', v')) {
    const parts = s.split(/,\s*(?=v\d)/i);
    title = parts[0].trim();
    details = parts.slice(1).join(', ').trim();
  } else if (s.includes(' (')) {
    const parts = s.split(/\s*\(/);
    title = parts[0].trim();
    details = parts.slice(1).join(' (').replace(/\)$/, '').trim();
  } else if (s.includes(' [')) {
    const parts = s.split(/\s*\[/);
    title = parts[0].trim();
    details = '[' + parts.slice(1).join(' [');
  } else if (s.includes(' - ')) {
    const parts = s.split(' - ');
    title = parts[0].trim();
    details = parts.slice(1).join(' - ').trim();
  }

  if (!title || title.length < 2) return null;

  return {
    title: title,
    details: details,
    raw: rawStr
  };
}

function parseUpcomingFromDom() {
  const articles = document.querySelectorAll('article.hentry');
  const cleaned = [];
  articles.forEach(article => {
    const title = article.querySelector('.entry-title')?.textContent || '';
    if (title.toLowerCase().includes('upcoming repacks')) {
      const content = article.querySelector('.entry-content');
      if (content) {
        const liEls = content.querySelectorAll('li, p');
        liEls.forEach(el => {
          const parsed = parseCleanUpcomingItem(stripTags(el.textContent));
          if (parsed) {
            parsed.postUrl = 'https://fitgirl-repacks.site/upcoming-repacks/';
            cleaned.push(parsed);
          }
        });
      }
    }
  });
  return cleaned;
}
