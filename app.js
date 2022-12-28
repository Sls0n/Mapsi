'use strict';
// Main Selectors
const container = document.querySelector('.container');
const mapContainer = document.querySelector('map');
// Button selectors
const button = document.querySelector('.button');
const defaultView = document.querySelector('.button-1');
const aerialView = document.querySelector('.button-2');
const liveWeather = document.querySelector('.button-3');
const defaultMode = document.querySelector('.button-5');
const hyperMode = document.querySelector('.button-6');
// Other selectors
const search = document.querySelector('.left__search--input');
const searchBtn = document.querySelector('.left__search--button');
const buttons = document.querySelectorAll('[data-button]');
const locationBox = document.querySelector('.left__country');
const box = document.querySelector('.left__box');
const weather = document.querySelector('.right__weather');
const information = document.querySelector('.right__information');
const silson = document.querySelector('.left__logo--icon');
const weatherIconHTML = document.querySelector('.right__weather--icon');
const weatherTypeHTML = document.querySelector('.weather-type');
const temperatureHTML = document.querySelector('.right__weather--temperature');

class Mapsi {
  map;
  marker;
  searchValue;

  constructor() {
    this._getPosition();

    // Event listeners
    searchBtn.addEventListener('click', this._getSearchValue.bind(this));
    search.addEventListener('keydown', this._getSearchValueOnEnter.bind(this));
    defaultMode.addEventListener('click', this._toggleDefaultMode.bind(this));
    hyperMode.addEventListener('click', this._toggleHyperMode.bind(this));
    defaultView.addEventListener('click', this._toggleDefaultView.bind(this));
    aerialView.addEventListener('click', this._toggleAerialView.bind(this));
    liveWeather.addEventListener('click', this._toggleLiveWeather.bind(this));
    locationBox.addEventListener('click', this._flyToMarker.bind(this));
  }

  //------------------ Getting the user's current location ------------------//

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      function (res) {
        const lat = res.coords.latitude;
        const lng = res.coords.longitude;

        this.map = L.map('map', {
          center: [lat, lng],
          zoom: 16,
          inertia: true,
          inertiaDeceleration: 2000,
          minZoom: 2,
        });

        // add a max bounds to the map
        this.map.setMaxBounds([
          [-180, -360], //
          [180, 360],
        ]);

        // Adding tile layer to map (like a template)
        this._mapTemplate();
        // Ading default marker to map, with flyto animation set to false
        this._addMarker(lat, lng, false);

        // On click event on the map, it will add a marker and popup
        this.map.on(
          'click',
          function (e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            // if marker exists, remove it (basically removing the old marker when the user clicks on a new location on the map, so there is only one marker at a time on the map, not multiple markers on the map at the same time). A guard clause

            this._addMarker(lat, lng);
            this._locationDetails(lat, lng);
          }.bind(this)
        );
      }.bind(this),
      function (err) {
        const error = `${err.message}! Allow location to continue`;
        alert(error);
        console.error(err);
      }
    );
  }

  //------------------ Choosing map template ------------------//

  _mapTemplate() {
    // Remove previous tile layer
    const tileLayer = this.map._layers;
    for (const key in tileLayer) {
      if (tileLayer[key]._url) {
        this.map.removeLayer(tileLayer[key]);
      }
    }

    // Normal view
    if (defaultView.classList.contains('hidden-button'))
      L.tileLayer('https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

    // Satellite view
    if (aerialView.classList.contains('hidden-button'))
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }).addTo(this.map);

    this._addMarker(this.map.getCenter().lat, this.map.getCenter().lng, false);
  }

  //------------------ Adding marker to map ------------------//

  _addMarker(lat, lng, flyTo = true) {
    // flyTo = true, to make the default marker not use the flyTo animation when the user loads the page. But it will use the flyTo animation when the user clicks on the map to add a marker.
    if (this.marker) this.map.removeLayer(this.marker);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    if (flyTo) {
      // map.flyTo([lat, lng], map._zoom, {
      //   duration: 4,
      //   easeLinearity: 0.5,
      // });
      this.map.flyTo([lat, lng]);
    }
    this._weatherDetails(lat, lng);
    this._locationDetails(lat, lng);
  }

  //------------------ Searching for location ------------------//

  async _locationSearch(searchValue) {
    try {
      // Getting data from API
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${searchValue}&format=json&limit=1`);

      // If response is not ok, throw error
      if (!response.ok) throw new Error(`Problem with geocoding ${response.status}`);
      // Converting response to json if response is ok
      // if data is not found, throw error
      const data = await response.json();
      if (data.length === 0) {
        locationBox.innerHTML = 'Location not found! Please try again with a different search term or check the spelling.';
        throw new Error('Location not found!');
      }

      // Getting lat and lng
      const lat = data[0].lat;
      const lng = data[0].lon;
      const importance = data[0].importance;

      // Setting zoom level according to importance of the given location
      if (data[0].class === 'tourism' || data[0].class === 'road' || data[0].class === 'amenity') this.map.setZoom(18);
      else if (importance > 0.85) this.map.setZoom(5);
      else if (importance > 0.8) this.map.setZoom(8);
      else if (importance > 0.7) this.map.setZoom(14);
      else if (importance > 0.6) this.map.setZoom(15);
      else if (importance > 0.5) this.map.setZoom(16);
      else if (importance > 0.4) this.map.setZoom(17);
      else this.map.setZoom(18);

      this._addMarker(lat, lng);
    } catch (err) {
      console.error(err);
    }
  }

  //------------------ Fetching location details ------------------//

  async _locationDetails(lat, lng) {
    try {
      // Getting data from API
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=${this.map._zoom}`);

      // If response is not ok, throw error
      if (!response.ok) {
        alert(`${response.status} Too many requests`);
        throw new Error(`${response.status} Too many requests`);
      }
      // Converting response to json if response is ok
      const data = await response.json();

      const html = `${data.display_name}`;
      locationBox.innerHTML = html;

      if (data.error) {
        locationBox.innerHTML = 'Location not found! Please try again with a different search term or check the spelling.';
        throw new Error('Location not found!');
      }

      if (data.class === 'tourism') this.map.setZoom(18);
    } catch (err) {
      console.error(err);
    }
  }

  //------------------ Fetching weather details ------------------//

  async _weatherDetails(lat, lng) {
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=2dad590f3f45d847cf92171de9848662&units=metric`);
      if (!response.ok) {
        weatherIconHTML.innerHTML = 'Weather not found!';
        weatherIconHTML.style.fontSize = '1.5rem';
        temperatureHTML.textContent = `ERROR`;
        throw new Error(`${response.status} ERROR`);
      }

      const data = await response.json();

      const main = data.weather[0].main;
      const temp = data.main.temp;

      temperatureHTML.textContent = `${temp}°C`;

      // Changing weather icon according to weather type
      const iconHTML = `
      <svg class="weather-icon">
         <use xlink:href="img/symbol-defs.svg#icon-${main}"></use>
      </svg>
      <div class="weather-type">${main}</div>`;
      weatherIconHTML.innerHTML = iconHTML;
    } catch (err) {
      console.error(err);
    }
  }

  //------------------ Event listeners ------------------//

  _getSearchValue() {
    // Storing the value of search input and using it in the locationSearch function.
    this.searchValue = search.value;
    this._locationSearch(this.searchValue);
  }

  _getSearchValueOnEnter(e) {
    // Storing the value of search input and using it in the locationSearch function if user enters the search value and presses enter.
    if (e.key === 'Enter') {
      this.searchValue = search.value;
      this._locationSearch(this.searchValue);
    }
  }

  _setElementStatus(element, status) {
    element.style.cursor = status ? 'pointer' : 'default';
    element.style.pointerEvents = status ? 'auto' : 'none';
    element.style.opacity = status ? '1' : '0.4';
  }

  _toggleDefaultMode() {
    defaultMode.classList.add('hidden-button-2');
    hyperMode.classList.remove('hidden-button-2');

    this._setElementStatus(defaultView, true);
    this._setElementStatus(aerialView, true);
    this._setElementStatus(liveWeather, true);

    this._mapTemplate();

    this.map.setZoom(16);
    this.map.setMinZoom(2);
  }

  _toggleHyperMode() {
    hyperMode.classList.add('hidden-button-2');
    defaultMode.classList.remove('hidden-button-2');
    defaultView.classList.remove('hidden-button');
    aerialView.classList.add('hidden-button');
    liveWeather.classList.remove('hidden-button');
    information.classList.add('hidden');
    weather.classList.add('hidden');

    this._setElementStatus(defaultView, false);
    this._setElementStatus(aerialView, false);
    this._setElementStatus(liveWeather, false);

    box.style.cursor = 'no-drop';

    this._mapTemplate();
    this.map.setZoom(18);
    this.map.setMinZoom(15);
  }

  _toggleDefaultView() {
    defaultView.classList.add('hidden-button');
    aerialView.classList.remove('hidden-button');
    this._mapTemplate();
  }

  _toggleAerialView() {
    aerialView.classList.add('hidden-button');
    defaultView.classList.remove('hidden-button');
    this._mapTemplate();
  }

  _toggleLiveWeather() {
    weather.classList.toggle('hidden');
  }

  _flyToMarker() {
    this.map.flyTo(this.marker.getLatLng(), this.map._zoom, {
      duration: 1,
    });
  }
}

buttons.forEach(btn => {
  // skip the first, second, secondlast and last button
  if (btn.classList.contains('button-1') || btn.classList.contains('button-2') || btn.classList.contains('button-5') || btn.classList.contains('button-6')) return;

  btn.addEventListener('click', function () {
    btn.classList.toggle('hidden-button');
  });
});

silson.addEventListener('click', function (e) {
  // Silson's github profile in new tab
  window.open('https://www.github.com/Sls0n/mapsi', '_blank');
});

const mapsi = new Mapsi();
