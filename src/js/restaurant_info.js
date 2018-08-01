let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL().then(restaurant => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false
    });
    fillBreadcrumb();
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }).catch(error => console.error(error));
}

const sendReview = (event) => {
  //console.log('Send Review', event);
  const reviewName = document.querySelector('#review-name');
  const reviewRating = document.querySelector('#review-rating');
  const reviewComment = document.querySelector('#review-comment');

  const reviewNameVal = reviewName.value;
  const reviewRatingVal = Number(reviewRating.value);
  const reviewCommentVal = reviewComment.value;

  const id = Number(getParameterByName('id'));

  // validation
  if(!validateForm()) return;

  let data = {
    "restaurant_id": id,
    "name": reviewNameVal,
    "rating": reviewRatingVal,
    "comments": reviewCommentVal
  };

  DBHelper.sendReview(data)
  .then(response => {
    document.getElementById('reviews-list').appendChild(createReviewHTML(response));
    // clear form
    reviewName.value = '';
    reviewRating.value = -1;
    reviewComment.value = '';
  }).catch(error => {
    console.log(error);
  });
}

/**
 * 
 * @param {*} event 
 * Toggle restaurant as Favorite
 */
const updateFavorite = (event) => {
  const id = Number(getParameterByName('id'));
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

document.getElementById('send-review').addEventListener('click', sendReview);

/**
 * Add event 'change' on every input from form.
 */
const formControls = document.querySelectorAll('.form-control');
Array.from(formControls).forEach(input => {
  input.addEventListener('change', (event) => {
    let elem = event.path[0]; 
    validateElement(elem);
  });
});

/**
 * Validate element.
 */
const validateElement = (elem) => {
  // clear error
  elem.classList.remove('error');
  const type = elem.getAttribute('data-validation');
  switch(type){
    case 'string':
      if(elem.value.length < 3){
        elem.classList.add('error');
        return false;
      }
      break;
    case 'number':
      if(elem.value < 0){
        elem.classList.add('error');
        return false;
      }
      break;
  }
  return true;
}

/**
 * Validate form.
 */
const validateForm = () => {
  const formControls = document.querySelectorAll('.form-control');
  for(elem of Array.from(formControls)){
    if(!validateElement(elem)){
      return false;
    }
  }
  return true;
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    let error = 'No restaurant id in URL'
    return Promise.reject(new Error(error));
  } else {
    return DBHelper.fetchRestaurantById(id)
    .then(restaurant => {
      self.restaurant = restaurant;
      return DBHelper.fetchReviewsById(id);
    })
    .then(reviews => {
      self.restaurant.reviews = reviews;
      fillRestaurantHTML();
      return Promise.resolve(self.restaurant);
    })
    .catch(error => {
      console.error(error);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('favorite');
  if(restaurant.is_favorite) favorite.classList.add('active');
  favorite.title = (restaurant.is_favorite) ? 'Remove from Favorites' : 'Add to Favorites';
  favorite.addEventListener('click', updateFavorite);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.alt = `${restaurant.name} restaurant's photo`;
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	
	// Set srcset for responsive
	const image480 = image.src.replace(/(\.[\w\d_-]+)$/i, '-480$1')
	image.setAttribute('srcset', `${image480} 480w, ${image.src} 800w`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-content');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
	const li = document.createElement('li');
	const reviewTitle = document.createElement('div');
	reviewTitle.className = 'flex-container review-title';

  const name = document.createElement('p');
  name.innerHTML = review.name;
	name.className = 'col';
	reviewTitle.appendChild(name);

  const date = document.createElement('p');
  if(review.updatedAt !== 'in pending'){
    const reviewDate = new Date(review.updatedAt);
    const reviewDay = String(reviewDate.getDay()+1).padStart(2, '0');
    const reviewMonth = String(reviewDate.getMonth()+1).padStart(2, '0');
    const reviewYear = reviewDate.getFullYear();
    

    date.innerHTML = `${reviewDay}.${reviewMonth}.${reviewYear}`;
  }else{
    date.innerHTML = review.updatedAt;
  }
	date.className = 'col text-right';
	reviewTitle.appendChild(date);

	li.appendChild(reviewTitle);

	const reviewContent = document.createElement('div');
	reviewContent.className = 'review-content';

  const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.classList.add('badge');
  reviewContent.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
	reviewContent.appendChild(comments);
	
	li.appendChild(reviewContent);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
	li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}