function renderTableView(pageGames, totalCount) {
  const totalPages = Math.max(1, Math.ceil(totalCount / tablePerPage));

  return `
    <div class="fg-table-wrapper">
      <table class="fg-table">
        <thead>
          <tr>
            <th class="sortable" data-sort="title">Game Title ${activeSort === 'title' ? '↑' : (activeSort === 'title_desc' ? '↓' : '')}</th>
            <th class="sortable" data-sort="size_desc">Repack Size ${activeSort === 'size_desc' ? '↓' : (activeSort === 'size_asc' ? '↑' : '')}</th>
            <th>Original Size</th>
            <th class="sortable" data-sort="newest">Release Date ${activeSort === 'newest' ? '↓' : (activeSort === 'oldest' ? '↑' : '')}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${pageGames.length === 0 ? `
            <tr>
              <td colspan="5" style="text-align:center; padding:40px; color:var(--fg-text-muted);">
                No matching repacks found. Try adjusting your search query or filters.
              </td>
            </tr>
          ` : pageGames.map(game => `
            <tr>
              <td>
                <a href="${game.pageUrl}" class="fg-table-title-link" title="${game.rawTitle || game.title}">
                  ${game.title}
                </a>
              </td>
              <td>${game.repackSize ? `<span class="fg-size-badge">${game.repackSize}</span>` : '—'}</td>
              <td><span style="color:var(--fg-text-muted); font-size:0.82rem;">${game.originalSize || '—'}</span></td>
              <td><span style="color:var(--fg-text-secondary); font-size:0.82rem;">${game.date || '—'}</span></td>
              <td>
                <div class="fg-table-actions">
                  <a href="${game.pageUrl}" class="fg-btn fg-btn-secondary fg-table-btn">Details</a>
                  ${game.magnetUrl ? `
                    <a href="${game.magnetUrl}" class="fg-btn fg-btn-magnet fg-table-btn" title="Download Magnet">
                      🧲 Magnet
                    </a>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="fg-table-pagination">
      <div class="fg-table-pagination-info">
        Page <strong>${tablePage}</strong> of <strong>${totalPages}</strong> (${totalCount.toLocaleString()} repacks)
      </div>

      <div class="fg-table-pagination-controls">
        <button class="fg-btn fg-btn-secondary fg-table-btn" id="fg-table-first-btn" ${tablePage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          « First
        </button>
        <button class="fg-btn fg-btn-secondary fg-table-btn" id="fg-table-prev-btn" ${tablePage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          ‹ Previous
        </button>
        <button class="fg-btn fg-btn-secondary fg-table-btn" id="fg-table-next-btn" ${tablePage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          Next ›
        </button>
        <button class="fg-btn fg-btn-secondary fg-table-btn" id="fg-table-last-btn" ${tablePage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          Last »
        </button>
      </div>
    </div>
  `;
}

function attachTableEventListeners() {
  const tableHeaders = document.querySelectorAll('.fg-table th[data-sort]');
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const sortType = th.getAttribute('data-sort');
      if (sortType === 'title') {
        activeSort = activeSort === 'title' ? 'title_desc' : 'title';
      } else if (sortType === 'size_desc') {
        activeSort = activeSort === 'size_desc' ? 'size_asc' : 'size_desc';
      } else if (sortType === 'newest') {
        activeSort = activeSort === 'newest' ? 'oldest' : 'newest';
      } else {
        activeSort = sortType;
      }
      tablePage = 1;
      renderModernApp();
    });
  });

  const prevBtn = document.getElementById('fg-table-prev-btn');
  const nextBtn = document.getElementById('fg-table-next-btn');
  const firstBtn = document.getElementById('fg-table-first-btn');
  const lastBtn = document.getElementById('fg-table-last-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (tablePage > 1) {
        tablePage--;
        renderModernApp();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(currentFilteredGames.length / tablePerPage);
      if (tablePage < totalPages) {
        tablePage++;
        renderModernApp();
      }
    });
  }

  if (firstBtn) {
    firstBtn.addEventListener('click', () => {
      if (tablePage !== 1) {
        tablePage = 1;
        renderModernApp();
      }
    });
  }

  if (lastBtn) {
    lastBtn.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(currentFilteredGames.length / tablePerPage));
      if (tablePage !== totalPages) {
        tablePage = totalPages;
        renderModernApp();
      }
    });
  }
}
