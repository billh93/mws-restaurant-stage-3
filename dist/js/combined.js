const registerServiceWorker = () => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('sw.js', {
			scope: './'
		}).then((registration) => {
      var serviceWorker;
      if (registration.installing) {
          serviceWorker = registration.installing;
          console.log('installing');
      } else if (registration.waiting) {
          serviceWorker = registration.waiting;
          console.log('waiting');
      } else if (registration.active) {
          serviceWorker = registration.active;
          console.log('active');
      }
      if (serviceWorker) {
          // logState(serviceWorker.state);
          serviceWorker.addEventListener('statechange', function (e) {
              // logState(e.target.state);
              console.log(e.target.state);
          });
      }
    }).catch(error => {
      console.log(error);
    });
	}
}

registerServiceWorker();
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL for restaurants.
   * Change this to restaurants.json file location on your server.
   */
  static get API_RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Database URL for reviews.
   * Change this to restaurants.json file location on your server.
   */
  static get API_REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    // console.log('fetchRestaurants');

    // Using fetch
    return fetch(DBHelper.API_RESTAURANTS_URL, {
      method: 'GET'
    })
    .then(response => response.json())
    .catch(error => { console.error(error)});
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    // Using fetch
    return fetch(DBHelper.API_RESTAURANTS_URL+'/'+id, {
      method: 'GET'
    })
    .then(response => {
      let json = response.json()
      if(!json) {
        return Promise.reject(new Error('Restaurant does not exist'));
      }
      return json;
    })
    .catch(error => { 
      console.error(error)
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchReviewsById(id) {
    // fetch all reviews with proper error handling.
    // Using fetch
    return fetch(DBHelper.API_REVIEWS_URL+'/?restaurant_id='+id, {
      method: 'GET'
    })
    .then(response => {
      let json = response.json()
      if(!json) {
        return Promise.reject(new Error('Restaurant does not exist'));
      }
      return json;
    })
    .catch(error => { 
      console.error(error)
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      const results = restaurants.filter(r => r.cuisine_type == cuisine);
      return Promise.resolve(results);
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      const results = restaurants.filter(r => r.neighborhood == neighborhood);
      return Promise.resolve(results);
    })
    .catch(error => console.error(error));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      let results = restaurants
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return Promise.resolve(results);
    })
    .catch(error => console.error(error));
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      // callback(null, uniqueNeighborhoods);
      // console.log('DBHelper.fetchRestaurants');
      return Promise.resolve(uniqueNeighborhoods);
    }).catch(error => {
      console.error(error);
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
    .then(restaurants => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      return Promise.resolve(uniqueCuisines);
    })
    .catch(error => console.error(error));
  }

  /**
   * 
   * @param {*} data 
   * Send Review to server
   */
  static sendReview(data){
    return fetch(DBHelper.API_REVIEWS_URL, {
      body: JSON.stringify(data),
      method: 'POST'
    })
    .then(response => response.json())
    .catch(error => console.log(error));
  }

  /**
   * Set Restaurant as Favorite
   */
  static setFavorite(id, is_favorite){
    let data = {
      "is_favorite": is_favorite
    };

    return fetch(DBHelper.API_RESTAURANTS_URL+'/'+id+'/', {
      body: JSON.stringify(data),
      method: 'PUT'
    })
    .then(response => response.json())
    .catch(error => console.log(error));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph || '1'}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
