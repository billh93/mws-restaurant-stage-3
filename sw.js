self.importScripts("js/lib/dexie.js");

// config Dexie() for IndexedDB
var db = new Dexie("restaurants");
db.version(1).stores({
  urls: 'url,data',
  reviews_pending: '++id,data'
});
db.open();

// config for cache
var cacheWhitelist = ['cache-and-update-v1'];
var CACHE = cacheWhitelist[0];

self.addEventListener('install', function(event) {
	console.log('The service worker is being installed.');	
	event.waitUntil(precache());
});

self.addEventListener('activate', function(event) {
  console.log('Activating new service worker...', event);

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
	//console.log('The service worker is serving the asset.', event.request);
  
  switch(event.request.method) {
    case 'GET':
      console.log('GET request!');
      // check if the request is for JSON
      if(event.request.url.includes(':1337')){
        event.respondWith(fromDB(event.request).catch((error) => {
          console.log(error);
        }));
        event.waitUntil(updateDB(event.request));
      }else{
        event.respondWith(fromCache(event.request).catch((error) => {
          console.log(error);
        }));
      
        event.waitUntil(updateCache(event.request));
      }
      break;
    case 'POST':
      console.log("POST request!", event.request);
      if(!navigator.onLine){
        // offline | add data to IndexedDB
        console.log('OFFLINE:', event.request);
        event.respondWith(fakeResponse(event.request).catch(error => {
          console.log(error);
        }));
        
        event.waitUntil(addReviewOffline(event.request));
      }else{
        // online but for now don't do anything special
      }
      break;
  }
  
  if(navigator.onLine){
    // online | check if there are data in pending in IndexedDB
    event.waitUntil(flushReviewsOffline());
  }
});

function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
			'./',
			'./index.html',
			'./restaurant.html',
			//'./css/styles.css',
      //'./css/responsive.css',
      './css/combined.css',
			'./js/main.js',
			'./js/restaurant_info.js',
			'./js/dbhelper.js',
      './js/register_sw.js',
      './js/combined.js',
			'./img/1.jpg', './img/1-480.jpg',
			'./img/2.jpg', './img/2-480.jpg',
			'./img/3.jpg', './img/3-480.jpg',
			'./img/4.jpg', './img/4-480.jpg',
			'./img/5.jpg', './img/5-480.jpg',
			'./img/6.jpg', './img/6-480.jpg',
			'./img/7.jpg', './img/7-480.jpg',
			'./img/8.jpg', './img/8-480.jpg',
			'./img/9.jpg', './img/9-480.jpg',
			'./img/10.jpg', './img/10-480.jpg'
    ]);
  });
}

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      return matching || fetch(request); //Promise.reject('no-match'); 
    });
  });
}

function updateCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
}


// functions for IndexedDB
function updateDB(request){
  return fetch(request).then(function (response) {
    //console.log(response);
    return response.json();
  }).then( response => {
    //console.log('updateDB:', response);
    return db.urls.put({url: request.url, data: response});
  }).catch(error => {
    console.log(error);
  });
}

function fromDB(request){
  return  db.urls.get(request.url).then(function (matching) {
    return (matching) ? new Response(JSON.stringify(matching.data)) : fetch(request);
  });
}

// add review to IndexedDB
function addReviewOffline(request){
  return serialize(request).then(serialized => {
    return db.reviews_pending.put({data: serialized});
  });
}

// send all offline reviews to server
function flushReviewsOffline(){
  console.log('Flush Reviews from IndexedDB!');
  db.reviews_pending.toArray().then(reviews => {
    let sending = reviews.reduce((prevPromise, serialized) => {
      return prevPromise.then(() => {
        return deserialize(serialized).then(request => {
          return fetch(request);
        });
      });
    }, Promise.resolve());
    return sending;
  }).then(() => {
    console.log('Clear IndexedDB!');
    db.reviews_pending.clear();
  }).catch(error => {
    console.log(error);
  });
  
}

function fakeResponse(request){
  return serialize(request).then(serialized => {
    serialized.body = JSON.parse(serialized.body);
    serialized.body.createdAt = 'in pending';
    serialized.body.updatedAt = 'in pending';
    serialized.body.id = 0;
    return new Response( 
      JSON.stringify(serialized.body),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    ); 

  }).catch(error => {
    console.log(error);
  });  
}

function serialize(request){
  let headers = {};

  for(let entry of request.headers.entries()){
    headers[entry[0]] = entry[1];
  }

  let serialized = {
    url: request.url,
    headers: headers,
    method: request.method,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  };

  if(request.method !== 'GET' && request.method !== 'HEAD'){
    return request.clone().text().then(body => {
      serialized.body = body;
      return Promise.resolve(serialized);
    });
  }
  return Promise.resolve(serialized);
}

function deserialize(data){
  return Promise.resolve(new Request(data.data.url, data.data));
}