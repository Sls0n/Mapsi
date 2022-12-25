// Selectors
const container = document.querySelector('.container');
const mapContainer = document.querySelector('#map');
const button = document.querySelector('.button');
const button_1 = document.querySelector('.button-1');
const button_2 = document.querySelector('.button-2');
const button_5 = document.querySelector('.button-5');
const button_6 = document.querySelector('.button-6');
const search = document.querySelector('.left__search--input');
const searchBtn = document.querySelector('.left__search--button');
const buttons = document.querySelectorAll('[data-button]');

// Variables
let marker;
let map;
let searchValue;

// Main Logic

const mapTemplate = function () {
  // Remove previous tile layer
  map.eachLayer(function (layer) {
    map.removeLayer(layer);
  });

  // Normal view
  if (button_1.classList.contains('hidden-button'))
    L.tileLayer('https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

  // Satellite view
  if (button_2.classList.contains('hidden-button'))
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }).addTo(map);

  addMarker(map.getCenter().lat, map.getCenter().lng, false);
};

const addMarker = function (lat, lng, flyTo = true) {
  // flyTo = true, to make the default marker not use the flyTo animation when the user loads the page. But it will use the flyTo animation when the user clicks on the map to add a marker.
  if (marker) map.removeLayer(marker);

  marker = L.marker([lat, lng]).addTo(map);

  if (flyTo) {
    // map.flyTo([lat, lng], map._zoom, {
    //   duration: 4,
    //   easeLinearity: 0.5,
    // });
    map.flyTo([lat, lng]);
  }
  locationDetails(lat, lng);
};

const locationSearch = async function (searchValue) {
  try {
    // Getting data from API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchValue}&format=json&limit=1`);

    // If response is not ok, throw error
    if (!response.ok) throw new Error(`Problem with geocoding ${response.status}`);
    // Converting response to json if response is ok
    const data = await response.json();
    // Getting lat and lng
    const lat = data[0].lat;
    const lng = data[0].lon;
    const importance = data[0].importance;
    // Setting zoom level according to importance of the given location
    if (importance > 0.85) map.setZoom(5);
    else if (importance > 0.8) map.setZoom(8);
    else if (importance > 0.7) map.setZoom(14);
    else if (importance > 0.6) map.setZoom(15);
    else if (importance > 0.5) map.setZoom(16);
    else if (importance > 0.4) map.setZoom(17);
    else map.setZoom(18);
    addMarker(lat, lng);
  } catch (err) {
    console.error(err);
    alert(err);
  }
};

const locationDetails = async function (lat, lng) {
  try {
    // Getting data from API
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${map._zoom}`);

    // If response is not ok, throw error
    if (!response.ok) throw new Error(`${response.status} Too many requests`);
    // Converting response to json if response is ok
    const data = await response.json();

    const html = `${data.display_name}`;
    document.querySelector('.left__country').innerHTML = html;

    if (data.error) alert(`${data.error}, location not found!`);
  } catch (err) {
    console.error(err);
    alert(err);
  }
};

navigator.geolocation.getCurrentPosition(
  res => {
    const lat = res.coords.latitude;
    const lng = res.coords.longitude;

    map = L.map('map', {
      center: [lat, lng],
      zoom: 16,
      inertia: true,
      inertiaDeceleration: 2000,
      enableHighAccuracy: true,
      minZoom: 2,
    });

    // add a max bounds to the map
    map.setMaxBounds([
      [-180, -360], //
      [180, 360],
    ]);

    // Adding tile layer to map (like a template)
    mapTemplate();
    // Ading default marker to map, with flyto animation set to false
    addMarker(lat, lng, false);

    // On click event on the map, it will add a marker and popup
    map.on('click', function (e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // if marker exists, remove it (basically removing the old marker when the user clicks on a new location on the map, so there is only one marker at a time on the map, not multiple markers on the map at the same time). A guard clause

      addMarker(lat, lng);
      locationDetails(lat, lng);
    });
  },
  err => {
    const error = `${err.message}! Allow location to continue`;
    alert(error);
    console.error(err);
  }
);

searchBtn.addEventListener('click', function (e) {
  // Storing the value of search input and using it in the locationSearch function.
  searchValue = search.value;
  locationSearch(searchValue);
});

search.addEventListener('keypress', function (e) {
  // Storing the value of search input and using it in the locationSearch function if user enters the search value and presses enter.
  if (e.key === 'Enter') {
    searchValue = search.value;
    locationSearch(searchValue);
  }
});

// Button 1 and button 2 event listeners to change the map template
button_1.addEventListener('click', function (e) {
  button_1.classList.add('hidden-button');
  button_2.classList.remove('hidden-button');
  mapTemplate();
});

button_2.addEventListener('click', function (e) {
  button_2.classList.add('hidden-button');
  button_1.classList.remove('hidden-button');
  mapTemplate();
});

// Looping through all the buttons and adding event listener to each button
buttons.forEach(btn => {
  // skip the first, second, secondlast and last button
  if (btn.classList.contains('button-1') || btn.classList.contains('button-2') || btn.classList.contains('button-5') || btn.classList.contains('button-6')) return;
  btn.addEventListener('click', function (e) {
    btn.classList.toggle('hidden-button');
  });
});

// Button 5 and button 6 event listeners to make the map maxed out and minned out
button_5.addEventListener('click', function (e) {
  map.setZoom(18);
});

button_6.addEventListener('click', function (e) {
  map.setZoom(3);
});
