import Ember from 'ember'
import L from 'npm:leaflet'
import constants from 'ember-geoserver/constants'
const {LAYER_TYPES} = constants
const {set, get, inject, run} = Ember
const auckland = L.latLng(-36.85, 174.76)


const osmTileLayer = layers => layers.filter(({type}) => type === LAYER_TYPES.OSM_LAYER)

export default Ember.Component.extend({
  wmsLayer: null,
  osmLayer: null,
  map: null,
  ajax: inject.service(),
  updateWMSLayer (map, layers, wmsLayer) {
    const layerConfig = layers
      .filter(({type}) => type === LAYER_TYPES.WMS_LAYER)
      .map(l => l.name).join(',')
    if (!wmsLayer) {
      wmsLayer = L.tileLayer.wms('/geoserver/wms', {
        layers: layerConfig,
        format: 'image/png',
        transparent: true,
        zIndex: 2,
        attribution: 'Sourced from Mediasuite'
      })
      set(this, 'wmsLayer', wmsLayer)
      map.addLayer(wmsLayer)
    } else {
      wmsLayer.setParams({layers: layerConfig})
    }
  },
  updateOSMLayer(map, layers, osmLayer) {
    const osmLayerSelection = layers.filter(({type}) => type === LAYER_TYPES.OSM_LAYER)[0]
    if (osmLayer) {
      osmLayer.remove()
      set(this, 'osmLayer', null)
    }
    if (osmLayerSelection) {
      osmLayer = L.tileLayer(osmLayerSelection.url, {
        zIndex: 1
      })
      set(this, 'osmLayer', osmLayer)
      map.addLayer(osmLayer)
    }
  },
  // update the map wiht the new layers, or just update the new
  updateMapWithLayer (map, layers, wmsLayer, osmLayer) {
    if (layers.length) {
      this.updateOSMLayer(map, layers, osmLayer)
      this.updateWMSLayer(map, layers, wmsLayer)
    }
  },

  didInsertElement () {
    this._super(...arguments)
    const lat = get(this, 'lat') || auckland.lat
    const lng = get(this, 'lng') || auckland.lng
    const zoom = get(this, 'zoom') || 10

    const map = L.map(this.$('.leaflet-map-instance').get(0), {
      center: L.latLng(lat, lng),
      zoom: zoom,
      continuousWorld: true,
      worldCopyJump: false
    })
    map.on('zoomend', e => this.zoomOrMove(e))
    map.on('moveend', e => this.zoomOrMove(e))
    map.on('click', e => this.mapClicked(e))
    set(this, 'map', map)
    const layers = get(this, 'layers')
    this.updateMapWithLayer(map, layers)
  },
  didUpdate () {
    const map = get(this, 'map')
    const layers = get(this, 'layers')
    const wmsLayer = get(this, 'wmsLayer')
    const osmLayer = get(this, 'osmLayer')
    // TODO: only update mapWithLayer if layers have changed
    this.updateMapWithLayer(map, layers, wmsLayer, osmLayer)

    // update map position from attribute change
    const lat = get(this, 'lat')
    const lng = get(this, 'lng')
    const zoom = get(this, 'zoom')

    if (lat && lng && zoom) {
      map.setView(L.latLng(lat, lng), zoom)
    }
  },
  renderPopup (popupData) {
    const leafletPopup = L.popup()
    const map = get(this, 'map')
    if (popupData && map) {
      if (popupData.position) {
        leafletPopup.setLatLng(popupData.position)
      } else {
        console.warn('expected popupdata on map to have a position field')
      }
      const makeFeatureTable = (rows) => `
        <table>
            <tr><th>Key</th><th>Value</th></tr>
          <tbody>
            ${rows.join('\n')}
          </tbody>
        </table>
      `
      const makeRow = (key, val) => `
          <tr>
            <td>${key}</td>
            <td>${val}</td>
          </tr>
      `
      const featureTemplate = popupData.features.map(feature => {
        const attributeRows = Object.keys(feature).map(key => {
          if (typeof feature[key] === 'string') {
            return {key, val: feature[key]}
          } else {
            return false
          }
        })
        .filter(o => o)
        .map(data => {
          return makeRow(data.key, data.val)
        })
        return makeFeatureTable(attributeRows)
      }).join('\n')

      leafletPopup.setContent(featureTemplate)
      map.addLayer(leafletPopup)
    }
  },
  invokeViewChangeDebounced () {
    const map = get(this, 'map')
    const latLng = map.getCenter()
    const zoom = map.getZoom()
    const viewChanged = get(this, 'mapViewChanged')
    get(this, 'mapViewChanged')({latLng, zoom})
  },
  zoomOrMove (e) {
    run.debounce(this, this.invokeViewChangeDebounced, 700)
  },
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
        maxFeatures="100"
        outputFormat="text/xml; subtype=gml/3.1.1">
      <wfs:Query
          srsName="EPSG:4326" typeName="${layername}">
        <ogc:Filter>
          <DWithin>
            <PropertyName>shape</PropertyName>
            <gml:Point>
              <gml:pos>${lng} ${lat}</gml:pos>
            </gml:Point>
            <Distance>0.0001</Distance>
          </DWithin>
        </ogc:Filter>
      </wfs:Query>
    </wfs:GetFeature>`

    return get(this, 'ajax').request('/geoserver/wfs', {
      dataType: 'xml',
      type: 'POST',
      contentType: 'text/xml',
      data: bboxQuery
    })
    .then(win => {
      const exception = win.querySelector('ExceptionText')
      if (exception) {
        console.error('success response but error case', exception.innerHTML)
        return Promise.reject(exception)
      }
      const featureMembers = win.querySelector('featureMembers')
      let features = []
      featureMembers.childNodes.forEach(el => {
        features.push(getDataFromFeatureDoc(el))
      })
      this.renderPopup({
        features,
        position: e.latlng
      })
    })
    .catch(err => {
      console.log('itbroke', err)
    })
  }
})


// TODO needs tests
// take an xml doc, parse it into a javascript object that makes sense for displaying as a layer popup
// domElement -> {}
function getDataFromFeatureDoc (el) {
  // recursively get attributes for dom elements
  function getAttrsRecursive (el) {
    // if this is just the parent of a single text node, render it as a <nodename>: "string"
    if (el.prefix === 'gml') {
      return {
        [el.localName]: el
      }
    } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      return {
        [el.localName]: el.childNodes[0].nodeValue
      }
    } else {
      let datums = []
      el.childNodes.forEach(d => datums.push(getAttrsRecursive(d)))
      return {
        [el.localName]: datums
      }
    }
  }

  const model = getAttrsRecursive(el)
  const mergeAttrsToObject = (previous, current) => {
    var key = Object.keys(current)[0]
    // if value is an array, objectificate it
    if (Array.isArray(current[key])) {
      if (current[key][0].prefix === 'GML') {
        return Object.assign(previous, {[key]: current[key][0]})
      } else {
        const objectificate = current[key].reduce(mergeAttrsToObject, {})
        return Object.assign(previous, objectificate)
      }
    } else {
      // does previous already have this?
      if (previous[key]) {
        if (Array.isArray(previous[key])) {
          previous[key].push(current[key])
          return previous
        } else {
          previous[key] = [previous[key], current[key]]
          return previous
        }
      }
      return Object.assign(previous, current)
    }
  }
  // for each attribute that is an array

  const objectificated = Object.keys(model)
    .map(key => ({[key]: model[key]}))
    .reduce(mergeAttrsToObject, {})
  return objectificated
}
