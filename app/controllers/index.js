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
      console.log('chosen Options', chosenOptions, chosenOptions.map(l => l.name).join(','))
      set(this, 'layers', chosenOptions.map(l => l.name).join(','))
    }
  }
})
