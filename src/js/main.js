let restaurants,
  neighborhoods,
  cuisines;
var map;
var markers = [];
var myLazyLoad = new LazyLoad();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();

  console.log('test');
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    // console.log('fetchNeighborhoods:', neighborhoods);
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines()
  .then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
  .then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();

  myLazyLoad.update();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
	const article = document.createElement('article');
  article.className = 'flex-container';
  article.setAttribute('aria-label', restaurant.name);
	const articleThumb = document.createElement('div');
	articleThumb.className = 'col-12 col-sm-6 col-md-5';
	const articleContent = document.createElement('div');
	articleContent.className = 'col-12 col-sm-6 col-md-7 restaurant-content';

	/* Thumbnail */
  const image = document.createElement('img');
  let imageSrc = DBHelper.imageUrlForRestaurant(restaurant);
  image.className = 'restaurant-img';
  image.alt = `${restaurant.name} restaurant's photo`;
	
	// Set srcset for responsive
  const imageSrc480 = imageSrc.replace(/(\.[\w\d_-]+)$/i, '-480$1');
  image.setAttribute('data-src', imageSrc); //old 'src'
	image.setAttribute('data-srcset', `${imageSrc480} 480w, ${imageSrc480} 800w, ${imageSrc} 1600w`); //old 'srcset'
	image.setAttribute('sizes', '(max-width: 576px) 480px, (max-width: 1600px) 480px');

	articleThumb.append(image);
	article.append(articleThumb);

	/* Content */
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  articleContent.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  articleContent.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  articleContent.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View Details about '+ restaurant.name);
  articleContent.append(more);
  
  const favorite = document.createElement('span');
  favorite.classList.add('favorite', 'pull-right');
  if(restaurant.is_favorite) favorite.classList.add('active');
  favorite.innerHTML = '☆';
  favorite.setAttribute('data-id', restaurant.id);
  favorite.setAttribute('role', 'button');
  favorite.title = (restaurant.is_favorite) ? 'Remove from Favorites' : 'Add to Favorites';
  favorite.addEventListener('click', updateFavorite);
  articleContent.append(favorite);

	article.append(articleContent);

  return article;
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * 
 * @param {*} event 
 * Toggle restaurant as Favorite
 */
const updateFavorite = (event) => {
  const id = Number(event.target.getAttribute('data-id'));
  const is_favorite = !event.target.classList.contains('active');

  DBHelper.setFavorite(id, is_favorite)
  .then(response => {
    event.target.classList.toggle('active');
    event.target.title = (response.is_favorite) ? 'Remove from Favorites' : 'Add to Favorites';    
  })
  .catch(error => {
    console.log(error);
  });
}