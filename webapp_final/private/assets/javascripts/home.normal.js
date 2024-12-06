var vm = new Vue({
  el: '#app',
  data: {
    mapInfo: 'the map show the user\'s top 10 most frequently visited venue, try clicking on the marker'
  }
});

mapboxgl.accessToken = 'pk.eyJ1Ijoid2RjZ3BhcGkiLCJhIjoiY2tvbDZ6aTN6MDYzNzJwcHJ0cW0zbm1rbyJ9.Ri2eAzlWdPBvPtPptM50GA';
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [138.6007, -34.928], // starting position [lng, lat]
    zoom: 9.6 // starting zoom
});

var marker1 = new mapboxgl.Marker().setLngLat([138.6045858633759,-34.91969326695324]);
var popup1 = new mapboxgl.Popup().setHTML('<h6>University of Adelaide</h6><p>confirmed cases: 0</p>');
marker1.setPopup(popup1).addTo(map);
popup1.on('open', function() {
  vm.mapInfo = "some information related to the venue you clicked";
});

var marker2 = new mapboxgl.Marker().setLngLat([138.57150268554688,-35.027435302734375]);
var popup2 = new mapboxgl.Popup().setHTML('<h6>University of Flinders</h6><p>confirmed cases: 0</p>');
marker2.setPopup(popup2).addTo(map);
popup2.on('open', function() {
  vm.mapInfo = "some information related to flinders";
});
