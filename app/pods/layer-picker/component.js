import Ember from 'ember'
const { get, set } = Ember

export default Ember.Component.extend({
  hasSelectedNewLayers: false,
  currentSelection: {},
  didReceiveAttrs () {
    const layersChosen = get(this, 'layersChosen')
    const layersAvailable = get(this, 'layersAvailable')
    layersAvailable.forEach(layer => {
      const foundLayer = layersChosen.find(l => layer.name === l.name)
      if (foundLayer) {
        set(foundLayer, 'disabled', true)
      }
    })
    set(this, 'layersAvailable', layersAvailable)
  },
  actions: {
    dropLayer (layer) {
      set(layer, 'disabled', false)
      set(this, 'hasSelectedNewLayers', true)
      get(this, 'layersChosen').removeObject(layer)
    },
    didChooseLayer (layer) {
      set(this, 'currentSelection', null)
      set(layer, 'disabled', true)
      let options = get(this, 'layersChosen')
      options.pushObject(layer)
      set(this, 'hasSelectedNewLayers', true)
    },
    sortEndAction () {
      set(this, 'hasSelectedNewLayers', true)
    },
    layersUpdated (chosenOptions) {
      set(this, 'hasSelectedNewLayers', false)
      get(this, 'onLayerUpdate')(chosenOptions)
    }
  }
})
