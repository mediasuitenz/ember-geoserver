import Ember from 'ember'
import L from 'npm:leaflet'
const {set, get} = Ember
const auckland = L.latLng(-36.85, 174.76)

export default Ember.Component.extend({
  tileLayer: null,
  map: null,
  // update the map wiht the new layers, or just update the new
  updateMapWithLayer (map, layers, tileLayer) {
    if (layers.length) {
      const layerConfig = layers.map(l => l.name).join(',')
      if (!tileLayer) {
        tileLayer = L.tileLayer.wms('/geoserver/wms', {
          layers: layerConfig,
          format: 'image/png',
          attribution: 'Sourced from Mediasuite'
        })
        set(this, 'tileLayer', tileLayer)
        map.addLayer(tileLayer)
      } else {
        tileLayer.setParams({layers: layerConfig})
      }
    }
  },
  didInsertElement () {
    this._super(...arguments)
    const map = L.map(this.$('.leaflet-map-instance').get(0), {
      center: L.latLng(auckland),
      zoom: 10,
      continuousWorld: true,
      worldCopyJump: false
    })
    set(this, 'map', map)
    const layers = get(this, 'layers')
    this.updateMapWithLayer(map, layers)
  },
  didUpdate () {
    const map = get(this, 'map')
    const layers = get(this, 'layers')
    let tileLayer = get(this, 'tileLayer')
    // TODO: only update mapWithLayer if layers have changed
    this.updateMapWithLayer(map, layers, tileLayer)
  }
})
