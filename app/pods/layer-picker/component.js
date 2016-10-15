import Ember from 'ember'
const { computed, get } = Ember

// is layer in list of layers?
// {name, title} -> [{name, title}] -> bool
const containsLayer = (layer, layers) => {
  const didFind = layers.find(l => l.name === layer.name)
  return !!didFind
}
export default Ember.Component.extend({
  hasSelectedNewLayers: false,
  layerOptions: computed('layersAvailable', 'layersChosen', function () {
    const layersAvailable = get(this, 'layersAvailable')
    const layersChosen = get(this, 'layersChosen')
    if (layersAvailable && layersChosen) {
      return layersAvailable.filter(layer => {
        return containsLayer(layer, layersChosen)
      })
    } else {
      return layersAvailable
    }
  }),
  actions: {
    didChooseLayer (layer) {
      console.log('whatup, we chose layer', layer)
    }
  }
})
