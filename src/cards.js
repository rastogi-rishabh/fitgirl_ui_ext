function renderGameCard(game) {
  const coverSrc = (game.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg').replace(/^http:\/\//i, 'https://');
  const tagList = game.genres && game.genres.length > 0 ? game.genres.slice(0, 2) : [];

  return `
    <div class="fg-card" data-game-id="${game.id}">
      <div class="fg-card-poster-wrap">
        <a href="${game.pageUrl}">
          <img src="${coverSrc}" class="fg-card-poster" alt="${game.title}" loading="lazy" onerror="this.onerror=null; this.src='https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg';" />
        </a>
        ${game.repackSize ? `<span class="fg-card-size-badge">${game.repackSize}</span>` : ''}
      </div>

      <div class="fg-card-body">
        <a href="${game.pageUrl}" class="fg-card-title" title="${game.rawTitle || game.title}">
          ${game.title}
        </a>

        <div class="fg-card-meta">
          ${game.date ? `<span>${game.date}</span>` : ''}
          ${game.originalSize ? `<span>Orig: ${game.originalSize}</span>` : ''}
        </div>

        ${tagList.length > 0 ? `
          <div class="fg-card-tags">
            ${tagList.map(t => `<span class="fg-tag">${t}</span>`).join('')}
          </div>
        ` : ''}

        <div class="fg-card-actions">
          ${game.magnetUrl ? `
            <a href="${game.magnetUrl}" class="fg-card-magnet-btn" title="Direct Magnet Download">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 3v7a6 6 0 0 0 12 0V3M6 3h4M14 3h4"/>
              </svg>
              <span>Magnet</span>
            </a>
            <button class="fg-card-copy-btn" data-magnet="${encodeURIComponent(game.magnetUrl)}" title="Copy Magnet URI">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          ` : `
            <a href="${game.pageUrl}" class="fg-card-magnet-btn" style="background:rgba(255,255,255,0.06); color:var(--fg-text-secondary); border-color:var(--fg-border);">
              <span>Details</span>
            </a>
          `}
        </div>
      </div>
    </div>
  `;
}

function attachCardActionListeners(container) {
  if (!container) return;
  const copyButtons = container.querySelectorAll('.fg-card-copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rawMagnet = btn.getAttribute('data-magnet');
      if (rawMagnet) {
        const decoded = decodeURIComponent(rawMagnet);
        navigator.clipboard.writeText(decoded).then(() => {
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
          setTimeout(() => {
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
          }, 1500);
        });
      }
    });
  });
}
