/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(response => response.json())
      .then(json => {
        json.map(restaurant => {
          if(restaurant.photograph) restaurant.photograph = `${restaurant.photograph}.jpg`;
          IDBManager.putInIDBStore(IDBManager.RestaurantsStore, restaurant);
        });
        if(callback)
          callback(null, json);
      })
      .catch(err => {
        console.error(`Request failed. Returned status of ${err.status}`);
        IDBManager
          .getTableFromIDB(IDBManager.RestaurantsStore)
          .then(restos => {
            if(callback)
              callback(null, restos);
          });
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }
  static putFavorite(restaurant, callback){
    fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`,
      {
        method:'PUT'
      }
    )
    .then(res => res.json())
    .then(json => {
      IDBManager.putInIDBStore(IDBManager.RestaurantsStore, json);
      if(callback)
        callback(json);
    })
    .catch(err => {
      IDBManager.putInIDBStore(IDBManager.FavoritesUpdate, {
        restaurant_id: restaurant.id,
        is_favorite: restaurant.is_favorite
      }).then(() => {
        IDBManager.getFromIDB(IDBManager.RestaurantsStore, restaurant.id)
        .then((resto) =>{
          resto.is_favorite = restaurant.is_favorite;
          IDBManager.putInIDBStore(IDBManager.RestaurantsStore, restaurant)
          .then(()=> {
            if(callback)
              callback(restaurant);
          });
        });
      });
      console.error(err);
    });
  }
  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      });
      marker.addTo(map);
    return marker;
  }
  static fetchAndStoreAllReviews(){
    fetch(`${DBHelper.DATABASE_URL}/reviews`)
    .then(res => res.json())
    .then(json => IDBManager.putInIDBStore(IDBManager.ReviewsStore,json))
    .catch(err => console.error(err));
  }
  static fetchReviewsById(restaurantId, callback){
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurantId}`)
    .then(res => res.json())
    .then(json => {
      IDBManager.putInIDBStore(IDBManager.ReviewsStore,json);
      if(callback)
        callback(json);
    })
    .catch(err => {
      console.error(err);
      IDBManager.getValueOnIndex(IDBManager.RestaurantIdOnReviewIndex,IDBManager.ReviewsStore,restaurantId)
      .then(res => {
        IDBManager.getValueOnIndex(IDBManager.RestaurantIdOnReviewIndex,IDBManager.ReviewsToSendStore,restaurantId)
        .then(toSend => {
          if(callback)
            callback([...res,...toSend]);
        });
      });
    });
  }
  static postReview(review, callback){
    fetch(
      `${DBHelper.DATABASE_URL}/reviews`,
      {
        method:'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(review)
      })
      .then(res => res.json())
      .then(json => {
        IDBManager
        .putInIDBStore(IDBManager.ReviewsStore, json)
        .then(() => {
          if(callback)
            callback(json);
        });
      })
      .catch(err =>
      {
        console.error(err);
        review['createdAt'] = Date.now();
        review['updatedAt'] = Date.now();
        IDBManager
        .putInIDBStore(IDBManager.ReviewsToSendStore, review)
        .then(() => {
          if(callback)
          callback(review);
        });
      });
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}


