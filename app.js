const container = document.querySelector('.container');
const mapContainer = document.querySelector('#map');
const button = document.querySelector('.button');
const search = document.querySelector('.left__search--input');
const searchBtn = document.querySelector('.left__search--button');

let marker;
let map;
let searchValue;

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
    addMarker(lat, lng);
  } catch (err) {
    alert(err);
  }
};

const locationDetails = async function (lat, lng) {
  try {
    // Getting data from API
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);

    // If response is not ok, throw error
    if (!response.ok) throw new Error(`Problem with geocoding ${response.status}`);
    // Converting response to json if response is ok
    const data = await response.json();
    console.log(data);
    if (data.error) alert(`${data.error}, location not found!`);
  } catch (err) {
    alert(err);
  }
};

const addMarker = function (lat, lng) {
  if (marker) map.removeLayer(marker);

  marker = L.marker([lat, lng]).addTo(map);
  marker.setLatLng([lat, lng], {
    duration: 2000,
    easing: 'linear',
  });
  marker.bindPopup('Hi').openPopup();
};

navigator.geolocation.getCurrentPosition(
  res => {
    const lat = res.coords.latitude;
    const lng = res.coords.longitude;

    map = L.map('map', {
      center: [lat, lng],
      zoom: 5,
      inertia: true,
      inertiaDeceleration: 2000,
    });

    // Adding tile layer to map (like a template)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

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
