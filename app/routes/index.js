import Ember from 'ember'
const {inject, get} = Ember

function getLayersFromResponse (xmlDoc) {
  const layers = xmlDoc.querySelectorAll('Layer[queryable="1"]')
  let model = []
  layers.forEach(node => {
    model.push({
      title: node.querySelector('Title').innerHTML,
      name: node.querySelector('Name').innerHTML
    })
  })
  return model
}

export default Ember.Route.extend({
  ajax: inject.service(),
  queryParams: {
    lat: { refreshModel: true },
    lng: { refreshModel: true },
    z: { refreshModel: true },
    layers: {refreshModel: true}
  },
  model (params) {
    console.log('le params', params)
    return get(this, 'ajax').request('/geoserver/wms?service=wms&request=GetCapabilities&version=1.3.0', {
      dataType: 'xml'
    })
    .then(xmlDoc => {
      const layersAvailable = getLayersFromResponse(xmlDoc)
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
        z: params.z
      }
    })
    .catch(sad => {
      console.error('could not parse data', sad)
    })
  }
})
