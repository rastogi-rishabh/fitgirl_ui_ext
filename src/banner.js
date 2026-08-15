let heroAutoRotateTimer = null;
let heroProgressAnimation = null;
let currentHeroIndex = 0;
let activeHeroTab = 'featured';
let isHeroPaused = false;
const HERO_ROTATION_INTERVAL = 7000;

var popularRepacks = [];
var updatesDigestList = [];

function getHeroSlides() {
  if (activeHeroTab === 'featured') {
    const validGames = games.filter(g => !g.isDonation && (g.magnetUrl || g.repackSize));
    const topGames = validGames.length > 0 ? validGames.slice(0, 6) : games.slice(0, 6);

    if (topGames.length === 0) {
      const domGames = parsePageGames(document);
      if (domGames.length > 0) {
        return domGames.slice(0, 6).map(formatGameSlide);
      }
      return [];
    }
    return topGames.map(formatGameSlide);
  } else if (activeHeroTab === 'popular') {
    const popList = popularRepacks.length > 0 ? popularRepacks : games.filter(g => g.repackSizeBytes > 20 * 1024 * 1024 * 1024).slice(0, 6);
    if (popList.length === 0) {
      return games.slice(0, 6).map(formatGameSlide);
    }
    return popList.map(g => ({
      badge: "⭐ Popular Repack",
      title: g.title,
      details: g.repackSize ? `Repack: ${g.repackSize} (Original: ${g.originalSize || 'N/A'})` : 'Popular Community Repack',
      postUrl: g.pageUrl,
      bgImage: g.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
      coverImage: g.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
      magnetUrl: g.magnetUrl,
      date: g.date,
      repackSize: g.repackSize,
      originalSize: g.originalSize,
      genres: g.genres || []
    }));
  } else if (activeHeroTab === 'digest') {
    if (updatesDigestList.length === 0) {
      return [];
    }
    return updatesDigestList.map(d => ({
      badge: "📋 Updates Digest",
      title: d.title,
      details: d.details || "Recent game updates digest and patch notes.",
      postUrl: d.postUrl || "https://fitgirl-repacks.site/category/updates-digest/",
      bgImage: d.coverImg || "https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg",
      coverImage: d.coverImg || "https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg",
      date: d.date
    }));
  } else {
    return upcomingRepacks.map(u => ({
      badge: "⏳ Upcoming Repack",
      title: u.title,
      details: u.details || 'Upcoming Repack Release',
      postUrl: u.postUrl || 'https://fitgirl-repacks.site/upcoming-repacks/',
      bgImage: 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
      coverImage: 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
      isUpcoming: true
    }));
  }
}

function formatGameSlide(g) {
  return {
    badge: "🔥 Featured Repack",
    title: g.title,
    details: g.repackSize ? `Repack Size: ${g.repackSize} (Original: ${g.originalSize || 'N/A'})` : (g.rawTitle || ''),
    postUrl: g.pageUrl,
    bgImage: g.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
    coverImage: g.coverImg || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg',
    magnetUrl: g.magnetUrl,
    date: g.date,
    repackSize: g.repackSize,
    originalSize: g.originalSize,
    genres: g.genres || []
  };
}

function renderHeroBannerContent(slide, allSlides) {
  if (!allSlides || allSlides.length === 0) {
    const slides = getHeroSlides();
    if (slides.length === 0) return '';
    allSlides = slides;
  }
  if (!slide) slide = allSlides[0];
  if (!slide) return '';

  const bgSrc = slide.bgImage || 'https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg';
  const coverSrc = slide.coverImage || bgSrc;

  return `
    <img src="${bgSrc}" class="fg-hero-backdrop" alt="${slide.title}" />
    <div class="fg-hero-overlay">
      <div class="fg-hero-container">
        
        <div class="fg-hero-tabs">
          <button class="fg-hero-tab ${activeHeroTab === 'featured' ? 'active' : ''}" id="fg-hero-tab-featured">
            🔥 Featured
          </button>
          <button class="fg-hero-tab ${activeHeroTab === 'popular' ? 'active' : ''}" id="fg-hero-tab-popular">
            ⭐ Popular
          </button>
          <button class="fg-hero-tab ${activeHeroTab === 'upcoming' ? 'active' : ''}" id="fg-hero-tab-upcoming">
            ⏳ Upcoming (${upcomingRepacks.length})
          </button>
          <button class="fg-hero-tab ${activeHeroTab === 'digest' ? 'active' : ''}" id="fg-hero-tab-digest">
            📋 Updates Digest
          </button>
        </div>

        <div class="fg-hero-content-split">
          <div class="fg-hero-info-col">
            <div class="fg-hero-badge-row">
              <span class="fg-hero-badge-pill">${slide.badge || 'Featured'}</span>
              ${slide.repackSize ? `<span class="fg-size-badge">${slide.repackSize}</span>` : ''}
              ${slide.date ? `<span style="font-size:0.75rem; color:var(--fg-text-muted);">📅 ${slide.date}</span>` : ''}
            </div>

            <h1 class="fg-hero-title">${slide.title}</h1>
            
            <p class="fg-hero-desc">${slide.details}</p>

            ${slide.genres && slide.genres.length > 0 ? `
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                ${slide.genres.slice(0, 3).map(g => `<span class="fg-tag">${g}</span>`).join('')}
              </div>
            ` : ''}

            <div class="fg-hero-actions">
              <a href="${slide.postUrl}" class="fg-btn fg-btn-primary">
                ${slide.isUpcoming ? '🔎 View Upcoming Details' : '📖 View Repack Details'}
              </a>
              ${slide.magnetUrl ? `
                <a href="${slide.magnetUrl}" class="fg-btn fg-btn-magnet">
                  🧲 Direct Magnet
                </a>
              ` : ''}
            </div>
          </div>

          <div class="fg-hero-media-col">
            <a href="${slide.postUrl}" class="fg-hero-media-card">
              <img src="${coverSrc}" class="fg-hero-poster-img" alt="${slide.title}" onerror="this.onerror=null; this.src='https://fitgirl-repacks.site/wp-content/uploads/2016/08/cropped-icon-192x192.jpg';" />
            </a>
          </div>
        </div>

        <div class="fg-hero-carousel-nav">
          <div class="fg-hero-dots">
            ${allSlides.map((_, idx) => `
              <span class="fg-hero-dot ${idx === currentHeroIndex ? 'active' : ''}" data-hero-dot="${idx}"></span>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
    <div class="fg-banner-progress-bar">
      <div class="fg-banner-progress-fill" id="fg-banner-progress-fill"></div>
    </div>
  `;
}

function startHeroAutoRotate() {
  stopHeroAutoRotate();
  startHeroProgressBar();

  heroAutoRotateTimer = setInterval(() => {
    if (isHeroPaused) return;
    const slides = getHeroSlides();
    if (slides.length === 0) return;
    currentHeroIndex = (currentHeroIndex + 1) % slides.length;
    updateHeroCarouselDOM();
  }, HERO_ROTATION_INTERVAL);
}

function stopHeroAutoRotate() {
  if (heroAutoRotateTimer) {
    clearInterval(heroAutoRotateTimer);
    heroAutoRotateTimer = null;
  }
  if (heroProgressAnimation) {
    cancelAnimationFrame(heroProgressAnimation);
    heroProgressAnimation = null;
  }
}

function startHeroProgressBar() {
  if (heroProgressAnimation) {
    cancelAnimationFrame(heroProgressAnimation);
    heroProgressAnimation = null;
  }

  const fillEl = document.getElementById('fg-banner-progress-fill');
  if (!fillEl) return;

  fillEl.style.width = '0%';
  let startTime = performance.now();

  function step(currentTime) {
    if (!isHeroPaused) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(100, (elapsed / HERO_ROTATION_INTERVAL) * 100);
      if (fillEl) fillEl.style.width = `${progress}%`;

      if (elapsed < HERO_ROTATION_INTERVAL) {
        heroProgressAnimation = requestAnimationFrame(step);
      }
    } else {
      startTime = currentTime - (parseFloat(fillEl.style.width || '0') / 100) * HERO_ROTATION_INTERVAL;
      heroProgressAnimation = requestAnimationFrame(step);
    }
  }

  heroProgressAnimation = requestAnimationFrame(step);
}

function updateHeroCarouselDOM() {
  const container = document.getElementById('fg-hero-section-container');
  if (!container) return;
  const slides = getHeroSlides();
  if (slides.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  if (currentHeroIndex >= slides.length) currentHeroIndex = 0;
  container.innerHTML = renderHeroBannerContent(slides[currentHeroIndex], slides);
  attachHeroEventListeners();
  startHeroProgressBar();
}

function attachHeroEventListeners() {
  const container = document.getElementById('fg-hero-section-container');
  if (container) {
    container.onmouseenter = () => { isHeroPaused = true; };
    container.onmouseleave = () => { isHeroPaused = false; };
  }

  const tabs = [
    { id: 'fg-hero-tab-featured', key: 'featured' },
    { id: 'fg-hero-tab-popular', key: 'popular' },
    { id: 'fg-hero-tab-upcoming', key: 'upcoming' },
    { id: 'fg-hero-tab-digest', key: 'digest' }
  ];

  tabs.forEach(({ id, key }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        if (activeHeroTab !== key) {
          activeHeroTab = key;
          currentHeroIndex = 0;
          updateHeroCarouselDOM();
          startHeroAutoRotate();
        }
      });
    }
  });

  const dots = document.querySelectorAll('.fg-hero-dot');
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-hero-dot'), 10);
      if (!isNaN(idx)) {
        currentHeroIndex = idx;
        updateHeroCarouselDOM();
        startHeroAutoRotate();
      }
    });
  });
}
