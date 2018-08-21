const _dbPromise = idb.open('resto-reviews-db', 1, (db) => {
  switch (db.oldVersion) {
    case 0:
      const store = db.createObjectStore('restaurants', { keyPath: 'id' });
      store.createIndex('resto-name', 'name');
      break;
  }
});