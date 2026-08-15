const FG_DB_NAME = 'FitGirlModernDB';
const FG_DB_VERSION = 1;
const FG_STORE_GAMES = 'games';
const FG_STORE_META = 'meta';

const FGDatabase = {
  db: null,

  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(FG_DB_NAME, FG_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(FG_STORE_GAMES)) {
          const store = db.createObjectStore(FG_STORE_GAMES, { keyPath: 'id' });
          store.createIndex('pageUrl', 'pageUrl', { unique: false });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('repackSizeBytes', 'repackSizeBytes', { unique: false });
        }
        if (!db.objectStoreNames.contains(FG_STORE_META)) {
          db.createObjectStore(FG_STORE_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  async getAllGames() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_GAMES], 'readonly');
      const store = tx.objectStore(FG_STORE_GAMES);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getGameCount() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_GAMES], 'readonly');
      const store = tx.objectStore(FG_STORE_GAMES);
      const req = store.count();

      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  },

  async saveGames(gamesList) {
    if (!gamesList || gamesList.length === 0) return 0;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_GAMES], 'readwrite');
      const store = tx.objectStore(FG_STORE_GAMES);

      gamesList.forEach(game => {
        if (game && game.id) {
          store.put(game);
        }
      });

      tx.oncomplete = () => resolve(gamesList.length);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getMeta(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_META], 'readonly');
      const store = tx.objectStore(FG_STORE_META);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  },

  async setMeta(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_META], 'readwrite');
      const store = tx.objectStore(FG_STORE_META);
      const req = store.put({ key, value });

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  async clearDatabase() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([FG_STORE_GAMES, FG_STORE_META], 'readwrite');
      tx.objectStore(FG_STORE_GAMES).clear();
      tx.objectStore(FG_STORE_META).clear();

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
