let _feedEl = null;
let _feedOriginalParent = null;
let _feedOriginalNextSibling = null;
let _earlyObserver = null;

function tryMove() {
  if (!document.body) return false;

  const content = document.getElementById('content');
  if (!content) return false;

  const feed = content.querySelector(':scope > .tolstoycomments-feed');
  if (!feed) return false;

  _feedOriginalParent = feed.parentElement;
  _feedOriginalNextSibling = feed.nextSibling;

  document.querySelectorAll('body > .tolstoycomments-feed').forEach(el => {
    if (el !== feed) el.remove();
  });

  document.body.insertBefore(feed, document.body.firstChild);
  _feedEl = feed;

  if (_earlyObserver) {
    _earlyObserver.disconnect();
    _earlyObserver = null;
  }
  return true;
}

function interceptTolstoyFeed() {
  if (!tryMove()) {
    _earlyObserver = new MutationObserver(() => {
      tryMove();
    });
    if (document.documentElement) {
      _earlyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    
    document.addEventListener('DOMContentLoaded', () => {
      if (!tryMove() && _earlyObserver) {
        _earlyObserver.disconnect();
        _earlyObserver = null;
      }
    }, { once: true });
  }
}

function embedLiveComments() {
  const feed = _feedEl;
  if (!feed) return;
  feed.style.removeProperty('display');
  feed.style.setProperty('visibility', 'visible', 'important');
  feed.style.setProperty('opacity', '1', 'important');

  function fireResize() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
  fireResize();
  setTimeout(fireResize, 200);
  setTimeout(fireResize, 800);
}

function restoreLiveCommentsToOriginal() {
  if (!_feedEl || !_feedOriginalParent) return;
  try {
    if (_feedOriginalNextSibling && _feedOriginalNextSibling.parentNode === _feedOriginalParent) {
      _feedOriginalParent.insertBefore(_feedEl, _feedOriginalNextSibling);
    } else {
      _feedOriginalParent.appendChild(_feedEl);
    }
  } catch (e) {}
}

interceptTolstoyFeed();
