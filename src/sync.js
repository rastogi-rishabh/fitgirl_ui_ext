let isSyncModalOpen = false;

function renderSyncModal() {
  const percent = syncStatus.progress?.percent || (syncStatus.isSyncing ? 0 : 100);
  const current = syncStatus.progress?.current || 0;
  const total = syncStatus.progress?.totalPages || 1;
  const count = syncStatus.count || games.length;
  const isDone = !syncStatus.isSyncing;

  return `
    <div class="fg-sync-modal-backdrop ${isSyncModalOpen ? 'open' : ''}" id="fg-sync-modal-backdrop">
      <div class="fg-sync-modal">
        <div class="fg-sync-modal-header">
          <div class="fg-sync-modal-title" id="fg-sync-modal-title-el">
            ${isDone ? `
              <span style="font-size:1.2rem; color:#4ade80;">✓</span>
              <span style="color:#fff;">Catalog Sync Complete</span>
            ` : `
              <div class="fg-spinner" style="width:18px; height:18px; border-width:2px;"></div>
              <span>Syncing Games Catalog...</span>
            `}
          </div>
          <button class="fg-drawer-close-btn" id="fg-sync-modal-close-btn">✕</button>
        </div>

        <div class="fg-sync-stats-row">
          <span style="font-weight:600; color:#fff;">Status</span>
          <span class="fg-sync-percent" id="fg-sync-modal-percent">${percent}%</span>
        </div>

        <div class="fg-sync-progress-track">
          <div class="fg-sync-progress-bar" id="fg-sync-modal-bar" style="width:${percent}%;"></div>
        </div>

        <div class="fg-sync-stats-row">
          <span>Page <strong id="fg-sync-modal-pages">${current} of ${total}</strong></span>
          <span><strong id="fg-sync-modal-count">${count.toLocaleString()}</strong> Repacks Stored</span>
        </div>

        <div class="fg-sync-info-box" id="fg-sync-modal-info-box">
          ${isDone
            ? `All ${count.toLocaleString()} repacks are persistently indexed in local browser storage.`
            : 'Indexing repack releases in the background. You can minimize this or wait for completion.'
          }
        </div>

        <div class="fg-sync-modal-footer" id="fg-sync-modal-footer">
          ${isDone ? `
            <button class="fg-btn fg-btn-secondary" id="fg-force-resync-btn" style="font-size:0.8rem; margin-right:auto;">
              🔄 Force Full Re-sync
            </button>
            <button class="fg-btn fg-btn-primary" id="fg-sync-modal-bg-btn" style="font-size:0.85rem; padding:8px 20px;">
              Done (Close)
            </button>
          ` : `
            <button class="fg-btn fg-btn-secondary" id="fg-sync-modal-bg-btn">
              Continue in Background
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

function showSyncModal() {
  isSyncModalOpen = true;
  let modalEl = document.getElementById('fg-sync-modal-backdrop');
  if (!modalEl) {
    const root = document.getElementById('fg-modern-app-root');
    if (root) {
      root.insertAdjacentHTML('beforeend', renderSyncModal());
    }
  } else {
    modalEl.classList.add('open');
    modalEl.outerHTML = renderSyncModal();
  }
  attachSyncModalListeners();
}

function hideSyncModal() {
  isSyncModalOpen = false;
  const modalEl = document.getElementById('fg-sync-modal-backdrop');
  if (modalEl) modalEl.classList.remove('open');
}

function updateSyncModalProgress(progress, count) {
  const percentEl = document.getElementById('fg-sync-modal-percent');
  const barEl = document.getElementById('fg-sync-modal-bar');
  const pagesEl = document.getElementById('fg-sync-modal-pages');
  const countEl = document.getElementById('fg-sync-modal-count');
  const titleEl = document.getElementById('fg-sync-modal-title-el');
  const infoEl = document.getElementById('fg-sync-modal-info-box');
  const footerEl = document.getElementById('fg-sync-modal-footer');

  const percent = progress?.percent || 0;
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (barEl) barEl.style.width = `${percent}%`;
  if (pagesEl) pagesEl.textContent = `${progress?.current || 0} of ${progress?.totalPages || 1}`;
  if (countEl) countEl.textContent = (count || games.length).toLocaleString();

  if (progress?.status === 'completed' || percent >= 100) {
    syncStatus.isSyncing = false;
    if (titleEl) {
      titleEl.innerHTML = `
        <span style="font-size:1.2rem; color:#4ade80;">✓</span>
        <span style="color:#fff;">Catalog Sync Complete</span>
      `;
    }
    if (infoEl) {
      infoEl.textContent = `All ${(count || games.length).toLocaleString()} repacks are persistently indexed in local browser storage.`;
    }
    if (footerEl) {
      footerEl.innerHTML = `
        <button class="fg-btn fg-btn-secondary" id="fg-force-resync-btn" style="font-size:0.8rem; margin-right:auto;">
          🔄 Force Full Re-sync
        </button>
        <button class="fg-btn fg-btn-primary" id="fg-sync-modal-bg-btn" style="font-size:0.85rem; padding:8px 20px;">
          Done (Close)
        </button>
      `;
      attachSyncModalListeners();
    }
  }
}

function attachSyncModalListeners() {
  const closeBtn = document.getElementById('fg-sync-modal-close-btn');
  const bgBtn = document.getElementById('fg-sync-modal-bg-btn');
  const backdrop = document.getElementById('fg-sync-modal-backdrop');
  const forceBtn = document.getElementById('fg-force-resync-btn');

  if (closeBtn) closeBtn.onclick = hideSyncModal;
  if (bgBtn) bgBtn.onclick = hideSyncModal;
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) hideSyncModal();
    };
  }
  if (forceBtn) {
    forceBtn.onclick = () => {
      triggerCatalogSync(true);
    };
  }
}

function getSyncBadgeText() {
  if (syncStatus.isSyncing && syncStatus.progress) {
    return `Syncing ${syncStatus.progress.percent || 0}% (${(syncStatus.count || games.length).toLocaleString()} games)`;
  }
  if (syncStatus.count > 0 || games.length > 0) {
    return `Catalog: ${(syncStatus.count || games.length).toLocaleString()} games`;
  }
  return `Sync Catalog`;
}

function updateSyncBadgeUI() {
  const badgeBtn = document.getElementById('fg-sync-badge-btn');
  const textEl = document.getElementById('fg-sync-text');
  if (!badgeBtn || !textEl) return;

  textEl.textContent = getSyncBadgeText();
  if (syncStatus.isSyncing) {
    badgeBtn.classList.add('syncing');
  } else {
    badgeBtn.classList.remove('syncing');
  }
}

function triggerCatalogSync(isFullSync = false) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
  syncStatus.isSyncing = true;
  updateSyncBadgeUI();
  showSyncModal();

  chrome.runtime.sendMessage({ action: 'SYNC_CATALOG', full: isFullSync }, (res) => {
    if (res && res.success) {
      loadStoredCatalog();
    }
  });
}

async function loadStoredCatalog() {
  try {
    const storedGames = await FGDatabase.getAllGames();
    if (storedGames && storedGames.length > 0) {
      games = storedGames;
      syncStatus.count = games.length;
      updateSyncBadgeUI();
      if (isModernActive && !isSinglePage) {
        if (isSyncModalOpen) {
          updateCatalogContentOnly();
        } else {
          renderModernApp();
        }
      }
    }
  } catch (err) {
    console.error('Error loading stored catalog:', err);
  }
}
