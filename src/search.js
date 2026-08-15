let searchDebounceTimer = null;

function getUniqueGenres() {
  const genreSet = new Set();
  games.forEach(g => {
    if (g.genres && Array.isArray(g.genres)) {
      g.genres.forEach(genre => {
        if (genre && genre.length < 30) genreSet.add(genre.trim());
      });
    }
  });
  return Array.from(genreSet).sort();
}

function filterAndSortGames() {
  let list = [...games];

  if (activeCategory !== 'all') {
    list = list.filter(g =>
      g.genres && g.genres.some(genre => genre.toLowerCase() === activeCategory.toLowerCase())
    );
  }

  if (activeSizeFilter !== 'all') {
    list = list.filter(g => {
      const bytes = g.repackSizeBytes || 0;
      if (activeSizeFilter === 'under5') return bytes > 0 && bytes < 5 * 1024 * 1024 * 1024;
      if (activeSizeFilter === '5to15') return bytes >= 5 * 1024 * 1024 * 1024 && bytes < 15 * 1024 * 1024 * 1024;
      if (activeSizeFilter === '15to30') return bytes >= 15 * 1024 * 1024 * 1024 && bytes < 30 * 1024 * 1024 * 1024;
      if (activeSizeFilter === 'over30') return bytes >= 30 * 1024 * 1024 * 1024;
      return true;
    });
  }

  if (activeSearch && activeSearch.trim().length > 0) {
    const queryTokens = activeSearch.toLowerCase().trim().split(/\s+/);
    list = list.filter(g => {
      const searchTarget = `${g.title || ''} ${g.rawTitle || ''} ${(g.genres || []).join(' ')} ${g.companies || ''}`.toLowerCase();
      return queryTokens.every(token => searchTarget.includes(token));
    });
  }

  if (activeSort === 'newest') {
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } else if (activeSort === 'oldest') {
    list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  } else if (activeSort === 'size_asc') {
    list.sort((a, b) => (a.repackSizeBytes || 0) - (b.repackSizeBytes || 0));
  } else if (activeSort === 'size_desc') {
    list.sort((a, b) => (b.repackSizeBytes || 0) - (a.repackSizeBytes || 0));
  } else if (activeSort === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (activeSort === 'title_desc') {
    list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  }

  currentFilteredGames = list;
}

function handleSearchInput(value) {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    activeSearch = value;
    renderLimit = 72;
    tablePage = 1;
    updateCatalogContentOnly();
  }, 120);
}

function renderFilterDrawer() {
  const uniqueGenres = getUniqueGenres();
  return `
    <div class="fg-drawer-backdrop ${isFilterDrawerOpen ? 'open' : ''}" id="fg-drawer-backdrop"></div>

    <aside class="fg-filter-drawer ${isFilterDrawerOpen ? 'open' : ''}" id="fg-filter-drawer">
      <div class="fg-drawer-header">
        <div class="fg-drawer-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>Filter & Sort Library</span>
        </div>
        <button class="fg-drawer-close-btn" id="fg-drawer-close-btn">✕</button>
      </div>

      <div class="fg-drawer-body">
        <div class="fg-drawer-group">
          <label class="fg-drawer-label">Sort Order</label>
          <select id="fg-sort-select" class="fg-drawer-select">
            <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest Releases</option>
            <option value="oldest" ${activeSort === 'oldest' ? 'selected' : ''}>Oldest Releases</option>
            <option value="size_asc" ${activeSort === 'size_asc' ? 'selected' : ''}>Repack Size (Smallest)</option>
            <option value="size_desc" ${activeSort === 'size_desc' ? 'selected' : ''}>Repack Size (Largest)</option>
            <option value="title" ${activeSort === 'title' ? 'selected' : ''}>Alphabetical (A-Z)</option>
            <option value="title_desc" ${activeSort === 'title_desc' ? 'selected' : ''}>Alphabetical (Z-A)</option>
          </select>
        </div>

        <div class="fg-drawer-group">
          <label class="fg-drawer-label">Genre & Category</label>
          <select id="fg-genre-select" class="fg-drawer-select">
            <option value="all">All Genres</option>
            ${uniqueGenres.map(g => `<option value="${g.toLowerCase()}" ${activeCategory.toLowerCase() === g.toLowerCase() ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>

        <div class="fg-drawer-group">
          <label class="fg-drawer-label">Repack Download Size</label>
          <div class="fg-drawer-pills-row">
            <button class="fg-drawer-pill ${activeSizeFilter === 'all' ? 'active' : ''}" data-size="all">All Sizes</button>
            <button class="fg-drawer-pill ${activeSizeFilter === 'under5' ? 'active' : ''}" data-size="under5">&lt; 5 GB</button>
            <button class="fg-drawer-pill ${activeSizeFilter === '5to15' ? 'active' : ''}" data-size="5to15">5–15 GB</button>
            <button class="fg-drawer-pill ${activeSizeFilter === '15to30' ? 'active' : ''}" data-size="15to30">15–30 GB</button>
            <button class="fg-drawer-pill ${activeSizeFilter === 'over30' ? 'active' : ''}" data-size="over30">30 GB+</button>
          </div>
        </div>
      </div>

      <div class="fg-drawer-footer">
        <button class="fg-btn fg-btn-secondary" id="fg-reset-filters-btn">Reset All</button>
        <button class="fg-btn fg-btn-primary" id="fg-apply-filters-btn">Apply Filters</button>
      </div>
    </aside>
  `;
}

function attachDrawerEventListeners() {
  const backdrop = document.getElementById('fg-drawer-backdrop');
  const closeBtn = document.getElementById('fg-drawer-close-btn');

  if (backdrop) {
    backdrop.onclick = () => {
      isFilterDrawerOpen = false;
      toggleFilterDrawerDOM();
    };
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      isFilterDrawerOpen = false;
      toggleFilterDrawerDOM();
    };
  }

  const sizePills = document.querySelectorAll('.fg-drawer-pill[data-size]');
  sizePills.forEach(pill => {
    pill.onclick = (e) => {
      sizePills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activeSizeFilter = e.target.getAttribute('data-size');
    };
  });

  const applyBtn = document.getElementById('fg-apply-filters-btn');
  if (applyBtn) {
    applyBtn.onclick = () => {
      const sortSelect = document.getElementById('fg-sort-select');
      const genreSelect = document.getElementById('fg-genre-select');

      if (sortSelect) activeSort = sortSelect.value;
      if (genreSelect) activeCategory = genreSelect.value;

      renderLimit = 72;
      tablePage = 1;
      isFilterDrawerOpen = false;
      renderModernApp();
    };
  }

  const resetBtn = document.getElementById('fg-reset-filters-btn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      activeCategory = 'all';
      activeSizeFilter = 'all';
      activeSort = 'newest';
      activeSearch = '';
      renderLimit = 72;
      tablePage = 1;
      isFilterDrawerOpen = false;
      renderModernApp();
    };
  }
}
