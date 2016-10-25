import Ember from 'ember'
import constants from 'ember-geoserver/constants'
const {LAYER_TYPES} = constants
const {inject, get} = Ember

function getLayersFromResponse (xmlDoc) {
  const layers = xmlDoc.querySelectorAll('Layer[queryable="1"]')
  let model = []
  layers.forEach(node => {
    model.push({
      title: node.querySelector('Title').innerHTML,
      name: node.querySelector('Name').innerHTML,
      type: LAYER_TYPES.WMS_LAYER
    })
  })
  return model
}

const osmLayers = [
  {
    name: 'osm_default',
    title: 'OSM default layer',
    url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    type: LAYER_TYPES.OSM_LAYER
  }
]

export default Ember.Route.extend({
  ajax: inject.service(),
  queryParams: {
    lat: { refreshModel: true },
    lng: { refreshModel: true },
    z: { refreshModel: true },
    layers: {refreshModel: true}
  },
  model (params) {
    return get(this, 'ajax').request('/geoserver/wms?service=wms&request=GetCapabilities&version=1.3.0', {
      dataType: 'xml'
    })
    .then(xmlDoc => {
      const layersAvailable = osmLayers.concat(getLayersFromResponse(xmlDoc))
      let layersChosen = []
      if (params.layers) {
        layersChosen = params.layers.split(',').map(layerName => {
          return layersAvailable.find(layer => layer.name === layerName)
        })
      }
      return {
        layersAvailable,
        layersChosen,
        lat: params.lat,
        lng: params.lng,
        zoom: params.z
      }
    })
    .catch(sad => {
      console.error('could not parse data', sad)
    })
  }
})
