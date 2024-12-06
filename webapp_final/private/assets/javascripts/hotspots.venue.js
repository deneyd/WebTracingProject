// init vue instance
var vm = new Vue({
  el: "#app",
  data: {
    hotspots: [],
    user: {},
    status: true,
    hasAddress: false,
    map: null,
    search: '',
    sortBy: '1',
  },
  computed: {
    // compute the array after filter with search and sorted
    hotspotsShown: function() {
      let newHotspots = [];
      // create search array
      if (this.search !== '') {
        for (let hotspot of this.hotspots) {
          if (hotspot.name.toUpperCase().indexOf(this.search.toUpperCase()) >= 0)  {
            newHotspots.push(hotspot);
          }
        }
      } else {
        this.hotspots.forEach((el, ind) => newHotspots.push(el));
      }
      if (this.sortBy == '2') {
        //do date sort
        newHotspots.sort((a, b) => b.beginDate.getTime() - a.beginDate.getTime() );
      } else if ((this.sortBy == '3') && (this.hasAddress)) {
        // do distance sort
        newHotspots.sort((a, b) => a.distanceToHome - b.distanceToHome );
      }
      return newHotspots;
    }
  },
  methods: {
    togglePopup: function (hotspot) {
      this.hotspots.forEach(function(h,i) {
        if (hotspot == h) {
          if (!hotspot.popup.isOpen()) {
            hotspot.marker.togglePopup();
          }
        } else {
          if (h.popup.isOpen()) {
            h.marker.togglePopup();
          }
        }
      });
    },
  }
});

// init map
mapboxgl.accessToken = 'pk.eyJ1Ijoid2RjZ3BhcGkiLCJhIjoiY2tvbDZ6aTN6MDYzNzJwcHJ0cW0zbm1rbyJ9.Ri2eAzlWdPBvPtPptM50GA';
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [138.6007, -34.928], // starting position [lng, lat]
    zoom: 9.6 // starting zoom
});
vm.map = map;

// rendering markers on the map and add relevant info
function renderHotspot(hotspots) {
  hotspots.forEach(function(hotspot, index) {
    hotspot.beginDate = new Date(hotspot.beginDate);
    hotspot.popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
    })
    .setHTML(`
      <div>
        <h4 class="text-center text-white bg-primary">${hotspot.name}</h4>
        <p>Starting at: ${hotspot.beginDate.toLocaleDateString()}</p>
      </div>
    `);
    hotspot.marker = new mapboxgl.Marker({
      color: '#FF0000',
    }).setLngLat(hotspot.address.location).setPopup(hotspot.popup).addTo(map);
  });

}

// get the hotspots list from server
function fetchHotspotsInfo() {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        vm.hotspots = JSON.parse(this.responseText);
        renderHotspot(vm.hotspots);
      } else {
        vm.status = false;
      }
    }
  };
  xhttp.open('GET', '/users/get/hotspots', true);
  xhttp.send();
}

fetchHotspotsInfo();
