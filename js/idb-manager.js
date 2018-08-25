let DBPromise;
class IDBManager {
  static get RestaurantsStore() {
    return 'restaurants';
  }
  static get ReviewsStore() {
    return 'reviews';
  }
  static get ReviewsToSendStore() {
    return 'reviews-to-send';
  }
  static get RestaurantNameIndex() {
    return 'resto-name';
  }
  static get RestaurantIdOnReviewIndex() {
    return 'resto';
  }
  static init() {
    DBPromise = idb.open('resto-reviews-db', 2, (db) => {
      let store;
      switch (db.oldVersion) {
        case 0:
          store = db.createObjectStore(IDBManager.RestaurantsStore, {keyPath: 'id'});
        case 1:
          store = db.createObjectStore(IDBManager.ReviewsStore, {keyPath: 'id'});
          store.createIndex(IDBManager.RestaurantIdOnReviewIndex, 'restaurant_id');
          store = db.createObjectStore(
              IDBManager.ReviewsToSendStore, {keyPath: 'local_id', autoIncrement: true});
          store.createIndex(IDBManager.RestaurantIdOnReviewIndex, 'restaurant_id');
      }
    });
  }
  static getFromIDB(storeName, restaurant_id) {
    if(typeof(restaurant_id) === 'string')
      restaurant_id = parseInt(restaurant_id);
    return DBPromise.then(db => {
        if(!db) return;
        return db.transaction(storeName)
        .objectStore(storeName)
        .get(restaurant_id);
      });
  }
  static putInIDBStore(storeName, obj){
    return DBPromise.then(db => {
      if(!db) return;
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(obj);
      return tx.complete;
    });
  }
  static getTableFromIDB(storeName){
    return DBPromise.then(db => {
      if(!db) return;
      const tx = db.transaction(storeName);
      return tx.objectStore(storeName).getAll();
    });
  }
  static getValueOnIndex(indexName, storeName, selector){
    return DBPromise.then(db => {
      return db.transaction(storeName)
      .objectStore(storeName)
      .index(indexName)
      .getAll(selector);
    });
  }
  static deleteFromStore(storeName, item){
    return DBPromise.then(db => {
      if(!db) return;
      return db.transaction(storeName, 'readwrite')
      .objectStore(storeName)
      .delete(item);
    });
  }
}

IDBManager.init();
