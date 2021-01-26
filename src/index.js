require('aframe-lensflare-component');
require('aframe-star-system-component');
require('aframe-orbit-controls');
require('aframe-geojson-component');
require('aframe-state-component');
require('aframe-post-message-component');
require('aframe-toggle-controls-component');

function requireAll(req) {
  req.keys().forEach(req);
}

// Require all components.
requireAll(require.context('./components/', true, /\.js$/));

require('./scene.html');
