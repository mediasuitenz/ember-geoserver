import Ember from 'ember'
const {get, set} = Ember
export default Ember.Controller.extend({
  queryParams: ['lat', 'lng', 'z', 'layers'],
  lat: null,
  lng: null,
  z: null,
  layers: null,
  actions: {
    onLayerUpdate (chosenOptions) {
      get(this, 'layers')
      set(this, 'layers', chosenOptions.map(l => l.name).join(','))
    },
    mapViewChanged ({zoom, latLng}) {
      set(this, 'z', zoom)
      set(this, 'lat', latLng.lat)
      set(this, 'lng', latLng.lng)
    }
  }
})
