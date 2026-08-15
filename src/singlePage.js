function cleanRepackDetailsBody(html, coverImg, screenshots) {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = cleanInlineDarkColors(html);

  temp.querySelectorAll('video').forEach(v => {
    const parent = v.closest('p, div.wp-caption, figure') || v;
    parent.remove();
  });

  temp.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    const isCover = coverImg && (src === coverImg || src.includes(coverImg) || coverImg.includes(src));
    const isScreenshot = screenshots && screenshots.some(s => {
      const sSrc = typeof s === 'string' ? s : (s.thumb || s.fullUrl || '');
      return sSrc && src && (sSrc === src || sSrc.includes(src) || src.includes(sSrc));
    });

    if (isCover || isScreenshot || img.classList.contains('alignleft') || img.classList.contains('wplp_thumb')) {
      const parent = img.closest('p, a, div.wp-caption, figure');
      if (parent && parent.textContent.trim().length === 0) {
        parent.remove();
      } else {
        img.remove();
      }
    }
  });

  temp.querySelectorAll('.su-spoiler').forEach(spoiler => {
    const title = (spoiler.querySelector('.su-spoiler-title')?.textContent || '').toLowerCase();
    if (title.includes('screenshot') || title.includes('click to enlarge') || title.includes('gallery')) {
      spoiler.remove();
    }
  });

  temp.querySelectorAll('h3').forEach(h3 => {
    const text = (h3.textContent || '').toLowerCase();
    if (text.includes('screenshot') || text.includes('click to enlarge')) {
      h3.remove();
    }
  });

  temp.querySelectorAll('a[href*="riotpixels"], a[href*="imageban"]').forEach(a => {
    const parentP = a.closest('p');
    if (parentP && parentP.querySelectorAll('a').length === parentP.querySelectorAll('a[href*="riotpixels"], a[href*="imageban"]').length) {
      parentP.remove();
    } else {
      a.remove();
    }
  });

  temp.querySelectorAll('p').forEach(p => {
    if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '<br>' || p.innerHTML.trim() === '&nbsp;') {
      p.remove();
    }
  });

  return temp.innerHTML;
}

function render404Page() {
  if (!isModernActive) return;
  document.documentElement.classList.remove('fg-modern-disabled');
  document.body.classList.add('fg-modern-active');

  const root = document.getElementById('fg-modern-app-root');
  if (!root) return;

  root.innerHTML = `
    <nav class="fg-navbar">
      <div style="display:flex; align-items:center; gap:14px;">
        <a href="https://fitgirl-repacks.site/" class="fg-btn fg-btn-secondary">
          ← Back to Library
        </a>
        <div class="fg-brand" onclick="window.location.href='https://fitgirl-repacks.site/';">
          <img src="https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg" class="fg-brand-avatar" alt="FitGirl" />
          <span class="fg-brand-title">FitGirl Repacks</span>
        </div>
      </div>
    </nav>

    <main style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center;">
      <div style="font-size:3.5rem; margin-bottom:12px;">🔍 404</div>
      <h2 style="font-size:1.6rem; font-weight:800; color:var(--fg-text-primary); margin-bottom:10px;">Repack Page Not Found</h2>
      <p style="color:var(--fg-text-secondary); max-width:480px; margin-bottom:24px; line-height:1.5;">
        This repack URL does not exist. Explore over 3,800+ repacks in the official catalog!
      </p>
      <a href="https://fitgirl-repacks.site/" class="fg-btn fg-btn-primary" style="font-size:0.95rem; padding:10px 24px;">
        Return to FitGirl Repacks
      </a>
    </main>
  `;
}

function renderSingleGamePage(game) {
  try {
    const root = document.getElementById('fg-modern-app-root');
    if (!root) return;

    if (!game) {
      game = parseSinglePost(document);
    }

    if (!game) return;

    if (!game.steamData && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: 'GET_STEAM_DATA', title: game.title || '', rawTitle: game.rawTitle || '' },
        (res) => {
          if (res && res.success && res.data) {
            game.steamData = res.data;
            renderSingleGamePage(game);
          }
        }
      );
    }

    const steam = game.steamData;
    const bgImage = steam?.heroImage || game.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg';
    const coverSrc = (steam?.capsuleImage || game.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg').replace(/^http:\/\//i, 'https://');

    let steamRatingHtml = '';
    if (steam && steam.reviews && steam.reviews.percent !== null && steam.reviews.percent !== undefined) {
      const scoreClass = steam.reviews.percent >= 70 ? 'positive' : (steam.reviews.percent >= 40 ? 'mixed' : 'negative');
      steamRatingHtml = `
        <div class="fg-steam-pill ${scoreClass}" style="position:static; display:inline-flex;">
          <svg class="fg-steam-logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.867C1.82 20.143 6.574 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/>
          </svg>
          <span>${steam.reviews.percent}% ${steam.reviews.scoreDesc || ''} (${(steam.reviews.total || 0).toLocaleString()} reviews)</span>
        </div>
      `;
    }

    const screenshots = (game.screenshots && game.screenshots.length > 0) ? game.screenshots : (steam?.screenshots || []);

    let rawBody = game.contentHtml;
    if (!rawBody || rawBody.trim().length < 10) {
      const contentEl = document.querySelector('article.hentry .entry-content, article .entry-content, .entry-content, article');
      if (contentEl) rawBody = contentEl.innerHTML;
    }

    const postBodyHtml = cleanRepackDetailsBody(rawBody, game.coverImg, screenshots);
    const displayTitle = game.rawTitle || game.title || document.title.replace('- FitGirl Repacks', '').trim();
    const officialTrailer = steam?.trailers && steam.trailers.length > 0 ? steam.trailers[0] : null;

    root.innerHTML = `
      <nav class="fg-navbar">
        <div style="display:flex; align-items:center; gap:14px;">
          <a href="https://fitgirl-repacks.site/" class="fg-btn fg-btn-secondary" id="fg-back-nav-btn">
            ← Back to Library
          </a>
          <div class="fg-brand" id="fg-home-brand" onclick="window.location.href='https://fitgirl-repacks.site/';">
            <img src="https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg" class="fg-brand-avatar" alt="FitGirl" />
            <span class="fg-brand-title">FitGirl Repacks</span>
          </div>
        </div>

        <div class="fg-nav-actions">
          <a href="https://fitgirl-repacks.site/donations/" target="_blank" class="fg-btn fg-btn-secondary" style="font-size:0.8rem; padding:6px 12px;">
            Donate
          </a>
        </div>
      </nav>

      <section class="fg-hero-section" style="min-height:360px;">
        <img src="${bgImage}" class="fg-hero-backdrop" alt="${displayTitle}" />
        <div class="fg-hero-overlay">
          <div class="fg-single-hero-content">
            <img src="${coverSrc}" class="fg-single-cover" alt="${displayTitle}" onerror="this.onerror=null; this.src='https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg';" />
            <div class="fg-single-header-info">
              <h1 class="fg-hero-title" style="font-size:2rem; margin-bottom:8px;">${displayTitle}</h1>
              <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
                ${steamRatingHtml}
                ${game.date ? `<span>📅 ${game.date}</span>` : ''}
                ${game.repackSize ? `<span class="fg-size-badge">Repack: ${game.repackSize}</span>` : ''}
                ${game.originalSize ? `<span class="fg-tag">Orig: ${game.originalSize}</span>` : ''}
              </div>
              
              <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
                ${game.magnetUrl ? `
                  <a href="${game.magnetUrl}" class="fg-btn fg-btn-magnet" style="font-size:0.92rem; padding:10px 20px;">
                    Direct Magnet Download
                  </a>
                  <button class="fg-btn fg-btn-secondary" id="fg-copy-magnet-btn-single">
                    Copy Magnet URI
                  </button>
                ` : ''}
                ${steam?.steamUrl ? `
                  <a href="${steam.steamUrl}" target="_blank" class="fg-btn fg-btn-secondary">
                    View on Steam
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main class="fg-grid-container" style="max-width:1400px; margin:0 auto; padding:28px 24px 60px 24px;">
        <div class="fg-single-column-layout">
          
          ${steam?.shortDescription ? `
            <div class="fg-detail-block">
              <h3 class="fg-detail-heading">About Game</h3>
              <p style="line-height:1.65; color:var(--fg-text-secondary); font-size:0.95rem; margin:0;">${steam.shortDescription}</p>
            </div>
          ` : ''}

          <div class="fg-detail-block">
            <h3 class="fg-detail-heading">Game Information & Specs</h3>
            <div class="fg-single-specs-row">
              <div class="fg-spec-item">
                <span class="fg-sidebar-label">Release Date</span>
                <span class="fg-sidebar-val" style="font-weight:600;">${game.date || 'N/A'}</span>
              </div>
              ${game.companies ? `
                <div class="fg-spec-item">
                  <span class="fg-sidebar-label">Developer / Publisher</span>
                  <span class="fg-sidebar-val" style="font-weight:600;">${game.companies}</span>
                </div>
              ` : ''}
              ${game.languages ? `
                <div class="fg-spec-item">
                  <span class="fg-sidebar-label">Languages</span>
                  <span class="fg-sidebar-val" style="font-weight:600;">${game.languages}</span>
                </div>
              ` : ''}
              ${game.genres && game.genres.length > 0 ? `
                <div class="fg-spec-item" style="grid-column: 1 / -1;">
                  <span class="fg-sidebar-label">Genres & Tags</span>
                  <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
                    ${game.genres.map(g => `<span class="fg-tag">${g}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          ${(screenshots && screenshots.length > 0) || game.animatedPreview ? `
            <div class="fg-detail-block">
              <h3 class="fg-detail-heading">Screenshots (Click to enlarge)</h3>
              ${screenshots && screenshots.length > 0 ? `
                <div class="fg-screenshots-grid">
                  ${screenshots.map(s => {
                    const thumb = typeof s === 'string' ? s : (s.thumb || s.fullUrl || '');
                    let fullUrl = typeof s === 'string' ? s : (s.fullUrl || s.thumb || '');
                    if (!fullUrl || fullUrl === thumb) {
                      if (thumb.includes('.240p.jpg')) {
                        fullUrl = thumb.replace(/\.240p\.jpg$/i, '.jpg');
                      }
                    }
                    return `
                      <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="fg-screenshot-link" title="Click to enlarge fullsize screenshot">
                        <img src="${thumb}" class="fg-screenshot-img" loading="lazy" referrerpolicy="no-referrer" alt="Screenshot" />
                        <div class="fg-screenshot-overlay">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                          </svg>
                          <span style="font-size:0.75rem; font-weight:600; margin-left:5px;">Enlarge</span>
                        </div>
                      </a>
                    `;
                  }).join('')}
                </div>
              ` : ''}

              ${game.animatedPreview ? `
                ${game.animatedPreview.linkUrl ? `
                  <a href="${game.animatedPreview.linkUrl}" target="_blank" rel="noopener noreferrer" class="fg-animated-preview-link" title="Click to view on RiotPixels">
                ` : '<div class="fg-animated-preview-link">'}
                  ${game.animatedPreview.type === 'video' ? `
                    <video autoplay loop muted playsinline class="fg-animated-preview-media">
                      <source src="${game.animatedPreview.src}" type="video/webm">
                      <source src="${game.animatedPreview.src}" type="video/mp4">
                    </video>
                  ` : `
                    <img src="${game.animatedPreview.src}" class="fg-animated-preview-media" alt="Gameplay Animation" loading="lazy" />
                  `}
                ${game.animatedPreview.linkUrl ? `</a>` : '</div>'}
              ` : ''}
            </div>
          ` : ''}

          ${officialTrailer && (officialTrailer.mp4 || officialTrailer.webm) ? `
            <div class="fg-detail-block">
              <h3 class="fg-detail-heading">Official Trailer ${officialTrailer.name ? `(${officialTrailer.name})` : ''}</h3>
              <div class="fg-video-wrapper">
                <video controls poster="${officialTrailer.thumbnail || ''}" width="100%" style="border-radius:10px; border:1px solid var(--fg-border); max-height:480px; background:#000;">
                  ${officialTrailer.mp4 ? `<source src="${officialTrailer.mp4}" type="video/mp4" />` : ''}
                  ${officialTrailer.webm ? `<source src="${officialTrailer.webm}" type="video/webm" />` : ''}
                </video>
              </div>
            </div>
          ` : ''}

          <div class="fg-detail-block">
            <h3 class="fg-detail-heading">Repack Details & Download Links</h3>
            <div class="fg-single-post-body">${postBodyHtml || ''}</div>
          </div>

        </div>
      </main>
    `;

    initSinglePageSpoilers(root);

    document.getElementById('fg-copy-magnet-btn-single')?.addEventListener('click', () => {
      if (game.magnetUrl) {
        navigator.clipboard.writeText(game.magnetUrl).then(() => {
          const copyBtn = document.getElementById('fg-copy-magnet-btn-single');
          if (copyBtn) copyBtn.textContent = 'Magnet Copied!';
        });
      }
    });

    embedLiveComments();
  } catch (err) {
    console.error('Error rendering single game page:', err);
  }
}

function toggleSpoilerElement(spoiler) {
  if (!spoiler) return;
  const isClosed = spoiler.classList.contains('su-spoiler-closed');
  const title = spoiler.querySelector(':scope > .su-spoiler-title, .su-spoiler-title');
  const content = spoiler.querySelector(':scope > .su-spoiler-content, .su-spoiler-content');

  if (isClosed) {
    spoiler.classList.remove('su-spoiler-closed');
    spoiler.setAttribute('data-open', 'true');
    if (title) title.setAttribute('aria-expanded', 'true');
    if (content) {
      content.style.removeProperty('display');
      content.style.setProperty('display', 'block', 'important');
      content.style.setProperty('visibility', 'visible', 'important');
      content.style.setProperty('opacity', '1', 'important');
      content.style.setProperty('height', 'auto', 'important');
      content.style.setProperty('max-height', 'none', 'important');
    }
  } else {
    spoiler.classList.add('su-spoiler-closed');
    spoiler.removeAttribute('data-open');
    if (title) title.setAttribute('aria-expanded', 'false');
    if (content) {
      content.style.setProperty('display', 'none', 'important');
      content.style.setProperty('visibility', 'hidden', 'important');
      content.style.setProperty('opacity', '0', 'important');
    }
  }
}

let _singlePageSpoilerListenerAttached = false;
function setupGlobalSpoilerListeners() {
  if (_singlePageSpoilerListenerAttached) return;
  _singlePageSpoilerListenerAttached = true;

  document.addEventListener('click', (e) => {
    const titleEl = e.target.closest('#fg-modern-app-root .su-spoiler-title, #fg-modern-app-root .fg-spoiler-title, #fg-modern-app-root [data-toggle="spoiler"]');
    if (titleEl) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const spoiler = titleEl.closest('.su-spoiler, .fg-spoiler');
      if (spoiler) {
        toggleSpoilerElement(spoiler);
      }
      return;
    }

    const summaryEl = e.target.closest('#fg-modern-app-root summary');
    if (summaryEl) {
      e.stopPropagation();
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const titleEl = e.target.closest('#fg-modern-app-root .su-spoiler-title, #fg-modern-app-root .fg-spoiler-title');
      if (titleEl && (document.activeElement === titleEl || titleEl.contains(document.activeElement))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const spoiler = titleEl.closest('.su-spoiler, .fg-spoiler');
        if (spoiler) {
          toggleSpoilerElement(spoiler);
        }
      }
    }
  }, true);
}

function initSinglePageSpoilers(container) {
  setupGlobalSpoilerListeners();
  if (!container) return;

  container.querySelectorAll('.su-spoiler, .fg-spoiler').forEach(spoiler => {
    const isClosed = spoiler.classList.contains('su-spoiler-closed');
    const title = spoiler.querySelector('.su-spoiler-title, .fg-spoiler-title');
    const content = spoiler.querySelector('.su-spoiler-content, .fg-spoiler-content');

    if (title) {
      title.setAttribute('tabindex', '0');
      title.setAttribute('role', 'button');
      title.setAttribute('aria-expanded', isClosed ? 'false' : 'true');
    }

    if (content) {
      if (isClosed) {
        spoiler.removeAttribute('data-open');
        content.style.setProperty('display', 'none', 'important');
        content.style.setProperty('visibility', 'hidden', 'important');
        content.style.setProperty('opacity', '0', 'important');
      } else {
        spoiler.setAttribute('data-open', 'true');
        content.style.setProperty('display', 'block', 'important');
        content.style.setProperty('visibility', 'visible', 'important');
        content.style.setProperty('opacity', '1', 'important');
      }
    }
  });
}
