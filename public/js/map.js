/* Foundry — search map (Leaflet + OpenStreetMap, no billing) */
(function () {
  var el = document.getElementById('map');
  if (!el || typeof L === 'undefined') return;

  var map = L.map(el, { scrollWheelZoom: true }).setView(
    [parseFloat(el.dataset.centerLat), parseFloat(el.dataset.centerLng)],
    parseInt(el.dataset.zoom, 10)
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var star = L.divIcon({
    className: 'foundry-pin',
    html: '<svg width="30" height="30" viewBox="0 0 32 32"><polygon points="16,1 20,12 31,16 20,20 16,31 12,20 1,16 12,12" fill="#0E5A4A" stroke="#EFE8DB" stroke-width="1.5"/></svg>',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  var bounds = [];
  var markers = {};

  document.querySelectorAll('.card[data-lat]').forEach(function (card) {
    var lat = parseFloat(card.dataset.lat);
    var lng = parseFloat(card.dataset.lng);
    if (!lat || !lng) return;
    var m = L.marker([lat, lng], { icon: star }).addTo(map);
    m.bindPopup(
      '<div class="map-popup"><strong>' + card.dataset.price + '</strong><br>' +
      card.dataset.title + '<br><a href="' + card.dataset.url + '">Voir l\u2019annonce \u2192</a></div>'
    );
    markers[card.dataset.id] = m;
    bounds.push([lat, lng]);

    card.addEventListener('mouseenter', function () { m.openPopup(); });
  });

  if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  else if (bounds.length === 1) map.setView(bounds[0], 14);
})();
