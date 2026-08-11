const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken = mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/spaceunicorn98/cm0jjuixt005c01qu6n515mie',
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds(); // Corrected line

locations.forEach((loc) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup()
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map); // Add this line to actually add the popup to the map

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
