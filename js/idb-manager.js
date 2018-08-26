let DBPromise;
class IDBManager {
  static get RestaurantsStore() {
    return 'restaurants';
  }
  static get FavoritesUpdate() {
    return 'favorites-update';
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
    DBPromise = idb.open('resto-reviews-db', 3, (db) => {
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
        case 2:
          store = db.createObjectStore(IDBManager.FavoritesUpdate, {keyPath: 'restaurant_id'});
      }
    });
  }
  static getFromIDB(storeName, item_id) {
    if(typeof(item_id) === 'string')
      item_id = parseInt(item_id);
    return DBPromise.then(db => {
        if(!db) return;
        return db.transaction(storeName)
        .objectStore(storeName)
        .get(item_id);
      });
  }
  static putInIDBStore(storeName, obj){
    if(!obj.forEach && typeof(obj) === 'object')
      obj = [obj];
    return DBPromise.then(db => {
      if(!db) return;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      obj.map(item =>
        store.put(item)
      );
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
  static sendOfflineFavorite(){
    console.log('sendign offline favorites')
    return IDBManager.getTableFromIDB(IDBManager.FavoritesUpdate)
    .then(favoritesToUpdate => {
      return Promise.all(favoritesToUpdate.map(item =>{
        console.log(item);
        return fetch(
          `${DBHelper.DATABASE_URL}/restaurants/${item.restaurant_id}/?is_favorite=${item.is_favorite}`,
          {
            method:'PUT'
          }
        ).then(res => {
            if(res.ok){
              return IDBManager.deleteFromStore(IDBManager.FavoritesUpdate, item.restaurant_id);
            }
          })
          .catch(err => {
            console.error(`Something went wrong when trying to post the review with local_id ${review.local_id}`, err);
          });
      }));
  });
}
  static sendOfflineReviews(){
      return IDBManager.getTableFromIDB(IDBManager.ReviewsToSendStore)
      .then(reviews => {
        return Promise.all(reviews.map(review =>{
          console.log(`posting review with local_id ${review.local_id}`);
          return fetch(
            'http://localhost:1337/reviews',
            {
              method:'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(review)
            }).then(res => {
              if(res.ok){
                console.log(`Review with local_id ${review.local_id} succesfully posted!!!`);
                return IDBManager.deleteFromStore(IDBManager.ReviewsToSendStore, review.local_id);
              }
            })
            .catch(err => {
              console.error(`Something went wrong when trying to post the review with local_id ${review.local_id}`, err);
            });
        }));
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
  static processTable(storeName, callback){
    return DBPromise.then(db => {
      if(!db) return;
      return db.transaction(storeName, 'readwrite')
      .objectStore(storeName)
      .openCursor();
     })
     .then(function oneByOne(c) {
       if(!c) return;
       callback(c.value);
       return c.continue().then(oneByOne);
     });
  }
}

IDBManager.init();
