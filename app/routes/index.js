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
        zoom: params.z
      }
    })
    .catch(sad => {
      console.error('could not parse data', sad)
    })
  },
  actions: {
    mapClicked (e) {
      // console.log("we're sick nerds :nerdface:", e)
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      const layername = 'mediasuite-public:landparcel-reprojection'
      const bboxQuery = `
      <wfs:GetFeature
        xmlns:ogc="http://www.opengis.net/ogc"
        xmlns:gml="http://www.opengis.net/gml"
        xmlns:wfs="http://www.opengis.net/wfs"
        service="WFS"
        version="1.1.0"
        maxFeatures="10"
        outputFormat="text/xml; subtype=gml/3.1.1">
        <wfs:Query
          srsName="EPSG:4326" typeName="${layername}">
          <ogc:Filter>
            <ogc:BBOX>
              <ogc:PropertyName>shape</ogc:PropertyName>
              <gml:Envelope srsName="EPSG:4326">
                <gml:lowerCorner>${lng - 0.05} ${lat - 0.05}</gml:lowerCorner>
                <gml:upperCorner>${lng + 0.05}  ${lat + 0.05}</gml:upperCorner>
              </gml:Envelope>
            </ogc:BBOX>
          </ogc:Filter>
        </wfs:Query>
      </wfs:GetFeature>`

      // return get(this, 'ajax').request('/geoserver/wfs', {
      //   dataType: 'xml',
      //   type: 'POST',
      //   contentType: 'text/xml',
      //   data: bboxQuery
      // })
      // .then(win => {
      //   const exception = win.querySelector('ExceptionText')
      //   if (exception) {
      //     console.error('success response but error case', exception.innerHTML)
      //     return Promise.reject(exception)
      //   }
      //   debugger
      // })
      // .catch(err => {
      //   console.log('itbroke', err)
      // })
    }
  }
})
