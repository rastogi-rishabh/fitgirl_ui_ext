function renderLoaderContent() {
  if (renderLimit < currentFilteredGames.length) {
    return `
      <button class="fg-btn fg-btn-secondary" id="fg-manual-load-btn">
        Load More (${renderLimit} of ${currentFilteredGames.length} shown)
      </button>
    `;
  }
  if (isFetchingNextPage) {
    return `<div class="fg-spinner-loader"><div class="fg-spinner"></div></div>`;
  }
  if (hasMoreApiPages && games.length < 3000) {
    return `
      <button class="fg-btn fg-btn-secondary" id="fg-manual-load-btn">
        Load Next Page (${games.length} repacks loaded)
      </button>
    `;
  }
  return `<span>Showing all ${currentFilteredGames.length} matching repacks</span>`;
}

function updateCatalogContentOnly() {
  filterAndSortGames();

  const countEl = document.getElementById('fg-section-count');
  if (countEl) {
    countEl.textContent = `${currentFilteredGames.length} of ${games.length} Repacks`;
  }

  const filterBtn = document.getElementById('fg-filter-toggle-btn');
  if (filterBtn) {
    const count = getActiveFilterCount();
    if (count > 0) {
      filterBtn.classList.add('active');
    } else {
      filterBtn.classList.remove('active');
    }
    const badge = filterBtn.querySelector('.fg-filter-badge');
    if (count > 0) {
      if (badge) badge.textContent = count;
      else filterBtn.insertAdjacentHTML('beforeend', `<span class="fg-filter-badge">${count}</span>`);
    } else if (badge) {
      badge.remove();
    }
  }

  if (activeViewMode === 'grid') {
    const gridEl = document.getElementById('fg-games-grid');
    const loaderEl = document.getElementById('fg-loader');
    const visibleGames = currentFilteredGames.slice(0, renderLimit);

    if (gridEl) {
      if (visibleGames.length === 0) {
        gridEl.innerHTML = `
          <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--fg-text-muted);">
            <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
            <p style="font-size:1rem; color:var(--fg-text-secondary);">No repacks found matching "${activeSearch}"</p>
          </div>
        `;
      } else {
        gridEl.innerHTML = visibleGames.map(game => renderGameCard(game)).join('');
        attachCardActionListeners(gridEl);
      }
    }
    if (loaderEl) {
      loaderEl.innerHTML = visibleGames.length === 0 ? '' : renderLoaderContent();
      attachLoaderListener();
    }
  } else {
    const pageGames = currentFilteredGames.slice((tablePage - 1) * tablePerPage, tablePage * tablePerPage);
    const container = document.querySelector('.fg-grid-container');
    if (container) {
      const header = container.querySelector('.fg-section-header');
      const headerHtml = header ? header.outerHTML : '';
      container.innerHTML = headerHtml + renderTableView(pageGames, currentFilteredGames.length);
      attachTableEventListeners();
      attachViewToggleListeners();
    }
  }
}

function renderModernApp() {
  const root = document.getElementById('fg-modern-app-root');
  if (!root) return;

  const searchInputBefore = document.getElementById('fg-search-input');
  const wasSearchFocused = document.activeElement === searchInputBefore;
  const selStart = searchInputBefore?.selectionStart;
  const selEnd = searchInputBefore?.selectionEnd;

  filterAndSortGames();

  const visibleGames = currentFilteredGames.slice(0, renderLimit);

  root.innerHTML = `
    <nav class="fg-navbar">
      <div class="fg-brand" id="fg-home-brand">
        <img src="https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg" class="fg-brand-avatar" alt="FitGirl" />
        <span class="fg-brand-title">FitGirl Repacks</span>
      </div>

      <div class="fg-header-search">
        <svg class="fg-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" id="fg-search-input" class="fg-header-search-input" placeholder="Search repacks by title, tags, developer..." value="${activeSearch}" autocomplete="off" />
        <span class="fg-search-shortcut">Ctrl+K</span>
      </div>

      <div class="fg-header-actions">
        <button id="fg-filter-toggle-btn" class="fg-header-btn ${getActiveFilterCount() > 0 ? 'active' : ''}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Filters</span>
          ${getActiveFilterCount() > 0 ? `<span class="fg-filter-badge">${getActiveFilterCount()}</span>` : ''}
        </button>

        <button id="fg-sync-badge-btn" class="fg-sync-badge ${syncStatus.isSyncing ? 'syncing' : ''}" title="Click to sync games library">
          <span class="fg-sync-dot"></span>
          <span id="fg-sync-text">${getSyncBadgeText()}</span>
        </button>

        <a href="https://fitgirl-repacks.site/repacks-troubleshooting/" target="_blank" class="fg-btn fg-btn-secondary" style="font-size:0.8rem; padding:6px 12px;" title="Repacks Troubleshooting Guide">
          FAQ & Help
        </a>

        <a href="https://fitgirl-repacks.site/donations/" target="_blank" class="fg-btn fg-btn-secondary" style="font-size:0.8rem; padding:6px 12px;">
          Donate
        </a>
      </div>
    </nav>

    <section class="fg-hero-section" id="fg-hero-section-container">
      ${renderHeroBannerContent(getHeroSlides()[currentHeroIndex], getHeroSlides())}
    </section>

    <main class="fg-grid-container">
      <div class="fg-section-header">
        <div class="fg-section-title">
          <span>Games Library</span>
          <span class="fg-section-count" id="fg-section-count">${currentFilteredGames.length} of ${games.length} Repacks</span>
        </div>

        <div class="fg-view-toggle-group">
          <button id="fg-view-grid-btn" class="fg-view-btn ${activeViewMode === 'grid' ? 'active' : ''}" title="Cards Grid View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Cards</span>
          </button>
          <button id="fg-view-table-btn" class="fg-view-btn ${activeViewMode === 'table' ? 'active' : ''}" title="Tabular List View">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>Table</span>
          </button>
        </div>
      </div>

      ${activeViewMode === 'grid' ? `
        <div class="fg-games-grid" id="fg-games-grid">
          ${visibleGames.map(game => renderGameCard(game)).join('')}
        </div>

        <div class="fg-infinite-loader" id="fg-loader">
          ${renderLoaderContent()}
        </div>
      ` : `
        ${renderTableView(currentFilteredGames.slice((tablePage - 1) * tablePerPage, tablePage * tablePerPage), currentFilteredGames.length)}
      `}
    </main>

    ${renderFilterDrawer()}
  `;

  attachAppEventListeners();
  attachHeroEventListeners();
  startHeroAutoRotate();

  if (activeViewMode === 'grid') {
    setupIntersectionObserver();
    attachCardActionListeners(document.getElementById('fg-games-grid'));
  } else {
    attachTableEventListeners();
  }

  if (wasSearchFocused) {
    const newSearchInput = document.getElementById('fg-search-input');
    if (newSearchInput) {
      newSearchInput.focus();
      try {
        if (selStart !== undefined && selEnd !== undefined) {
          newSearchInput.setSelectionRange(selStart, selEnd);
        }
      } catch (e) {}
    }
  }
}

function attachViewToggleListeners() {
  const gridBtn = document.getElementById('fg-view-grid-btn');
  const tableBtn = document.getElementById('fg-view-table-btn');

  if (gridBtn) {
    gridBtn.onclick = () => {
      if (activeViewMode !== 'grid') {
        activeViewMode = 'grid';
        renderModernApp();
      }
    };
  }

  if (tableBtn) {
    tableBtn.onclick = () => {
      if (activeViewMode !== 'table') {
        activeViewMode = 'table';
        tablePage = 1;
        renderModernApp();
      }
    };
  }
}

function attachLoaderListener() {
  const loadBtn = document.getElementById('fg-manual-load-btn');
  if (loadBtn) {
    loadBtn.onclick = () => {
      if (renderLimit < currentFilteredGames.length) {
        renderLimit += 48;
        updateCatalogContentOnly();
      } else if (hasMoreApiPages) {
        loadNextApiPage();
      }
    };
  }
}

function attachAppEventListeners() {
  const brandEl = document.getElementById('fg-home-brand');
  if (brandEl) {
    brandEl.addEventListener('click', () => {
      window.location.href = 'https://fitgirl-repacks.site/';
    });
  }

  const searchInput = document.getElementById('fg-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearchInput(e.target.value);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  const syncBtn = document.getElementById('fg-sync-badge-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      triggerCatalogSync(false);
    });
  }

  attachViewToggleListeners();

  const filterToggleBtn = document.getElementById('fg-filter-toggle-btn');
  if (filterToggleBtn) {
    filterToggleBtn.addEventListener('click', () => {
      isFilterDrawerOpen = !isFilterDrawerOpen;
      toggleFilterDrawerDOM();
    });
  }

  attachLoaderListener();
}

function toggleFilterDrawerDOM() {
  const backdrop = document.getElementById('fg-drawer-backdrop');
  const drawer = document.getElementById('fg-filter-drawer');
  const toggleBtn = document.getElementById('fg-modern-toggle-btn');

  if (backdrop && drawer) {
    if (isFilterDrawerOpen) {
      backdrop.classList.add('open');
      drawer.classList.add('open');
      if (toggleBtn) toggleBtn.style.display = 'none';
      attachDrawerEventListeners();
    } else {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      if (toggleBtn) toggleBtn.style.display = 'inline-flex';
    }
  }
}

function setupIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  const loaderEl = document.getElementById('fg-loader');
  if (!loaderEl) return;

  intersectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isFetchingNextPage && activeViewMode === 'grid') {
      if (renderLimit < currentFilteredGames.length) {
        renderLimit += 48;
        updateCatalogContentOnly();
      } else if (hasMoreApiPages && games.length < 3000) {
        loadNextApiPage();
      }
    }
  }, { rootMargin: '400px' });

  intersectionObserver.observe(loaderEl);
}
