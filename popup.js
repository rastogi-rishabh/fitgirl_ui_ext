document.addEventListener('DOMContentLoaded', () => {
  const toggleInput = document.getElementById('toggle-modern');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const quickSyncBtn = document.getElementById('quick-sync-btn');
  const forceSyncBtn = document.getElementById('force-sync-btn');
  const catalogStatusText = document.getElementById('catalog-status-text');
  const progressBarWrap = document.getElementById('progress-bar-wrap');
  const progressBarFill = document.getElementById('progress-bar-fill');

  chrome.storage.local.get(['fg_modern_enabled'], (res) => {
    toggleInput.checked = res.fg_modern_enabled !== false;
  });

  updateCatalogStatus();

  function updateCatalogStatus() {
    chrome.runtime.sendMessage({ action: 'GET_CATALOG_STATUS' }, (res) => {
      if (res && res.success) {
        if (res.isSyncing) {
          const percent = res.progress?.percent || 0;
          catalogStatusText.textContent = `Syncing Catalog (${percent}%)...`;
          if (progressBarWrap && progressBarFill) {
            progressBarWrap.style.display = 'block';
            progressBarFill.style.width = `${percent}%`;
          }
          setTimeout(updateCatalogStatus, 1200);
        } else {
          if (progressBarWrap) progressBarWrap.style.display = 'none';
          if (res.count > 0) {
            catalogStatusText.textContent = `${res.count.toLocaleString()} games stored`;
          } else {
            catalogStatusText.textContent = 'Not Cached';
          }
        }
      }
    });
  }

  quickSyncBtn.addEventListener('click', () => {
    quickSyncBtn.textContent = 'Checking...';
    catalogStatusText.textContent = 'Checking new...';
    chrome.runtime.sendMessage({ action: 'SYNC_CATALOG', full: false }, (res) => {
      quickSyncBtn.textContent = '⚡ Check for New Games';
      updateCatalogStatus();
    });
  });

  forceSyncBtn.addEventListener('click', () => {
    forceSyncBtn.textContent = 'Re-indexing...';
    catalogStatusText.textContent = 'Starting full sync...';
    chrome.runtime.sendMessage({ action: 'SYNC_CATALOG', full: true }, (res) => {
      forceSyncBtn.textContent = '🔄 Force Full Re-sync (All Pages)';
      updateCatalogStatus();
    });
  });

  toggleInput.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ fg_modern_enabled: enabled }, () => {
      chrome.tabs.query({ url: 'https://fitgirl-repacks.site/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.reload(tab.id);
        });
      });
    });
  });

  clearCacheBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' }, (res) => {
      if (res && res.success) {
        clearCacheBtn.textContent = 'Cache Cleared!';
        updateCatalogStatus();
        setTimeout(() => {
          clearCacheBtn.textContent = 'Clear Cache';
        }, 2000);
      }
    });
  });
});
