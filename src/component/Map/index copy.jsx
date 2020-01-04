import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { getDataAsync } from '../../store/modules'
import loadJs from 'load-js'

const styleOptions = {
  fillOpacity: 0.6,
  fillColor: '#ff0000',
  strokeColor: '#ff0000',
  strokeWeight: 2,
  strokeOpacity: 0.5
}

class Map extends Component {
  constructor () {
    super()
    this.map = React.createRef()
  }

  loadScriptPromise (_ncpClientId) {
    const requestUrl = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${_ncpClientId}&submodules=geocoder`
    return loadJs(requestUrl).then(() =>
      new Promise(resolve => {
        window.naver.maps.onJSContentLoaded = () => {
          resolve(window.naver)
        }
      })
    )
  }

  componentDidMount () {
    const { ncpClientId, getDataAsync, _lat, _lng, zoomLevel } = this.props

    this.loadScriptPromise(ncpClientId).then((naver) => {
      let zoomRange = [2, 4, 6]
      let maxZoom = zoomRange[zoomRange.length - 1]
      let minZoom = zoomRange[0]

      // 전국 : 2, 시군구 :4  읍면동 : 7
      // naver.maps. PointBounds 경계 생성.
      // 인터렉션 옵션.
      const mapOptions = {
        logoControl: false,
        mapDataControl: false,
        scaleControl: false,
        center: new naver.maps.LatLng(_lat, _lng), // 충주
        draggable: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: true,
        disableDoubleClickZoom: true,
        disableTwoFingerTapZoom: true,
        zoom: zoomLevel,
        // baseTileOpacity: 0.5,
        maxZoom: maxZoom,
        minZoom: minZoom
      }
      const map = new naver.maps.Map('map', mapOptions)

      this.setState((prevState) => {
        return ({
          ...prevState,
          newMap: map,
          parentCd: []
        })
      })

      map.data.setStyle(function (feature) {
        const korLv = feature.property_KOR_LV

        switch (korLv) {
          case '좋음':
            styleOptions.fillColor = '#117cf6'
            break
          case '보통':
            styleOptions.fillColor = '#50af32'
            break
          case '나쁨':
            styleOptions.fillColor = '#c4b341'
            break
          case '매우나쁨':
            styleOptions.fillColor = '#d36f36'
            break
        }

        return styleOptions
      })

      map.data.addListener('mouseover', function (e) {
        map.data.overrideStyle(e.feature, {
          strokeWeight: 8
        })

        map.data.addListener('mouseout', function (e) {
          map.data.revertStyle()
        })
      })

      // zoom UP
      map.data.addListener('click', (e) => {
        const feature = e.feature
        const { x: _lng, y: _lat } = e.feature.bounds.getCenter()
        const currentZoom = map.getZoom()

        if (maxZoom > currentZoom) {
          const parentCd = feature.property_LOC_CD
          const zoomLevel = zoomRange[zoomRange.indexOf(currentZoom) + 1] || currentZoom
          const tempArr = this.state.parentCd.slice()

          this.setState({ 'parentCd': tempArr })
          tempArr.push(parentCd)
          map.setZoom(zoomLevel)
          map.setCenter(new naver.maps.LatLng(_lat, _lng))
          getDataAsync({ _lat, _lng, zoomLevel, naver, map, parentCd, feature })
        }
      })

      // zoom Down
      map.data.addListener('rightclick', (e) => {
        const { x: _lng, y: _lat } = e.feature.bounds.getCenter()
        const currentZoom = map.getZoom()

        if (minZoom < currentZoom) {
          const nextIdx = zoomRange.indexOf(currentZoom) - 1
          const zoomLevel = zoomRange[nextIdx] || currentZoom
          map.setZoom(zoomLevel)
          map.setCenter(new naver.maps.LatLng(_lat, _lng))

          const parentCd = this.state.parentCd.shift()
          getDataAsync({ _lat, _lng, zoomLevel, naver, map, parentCd })
        }
      })

      return getDataAsync({ _lat, _lng, zoomLevel, naver, map })
    }).catch((ex) => {
      console.error(ex)
    })// END _promise
  }

  shouldComponentUpdate (props, state) {
    const { data } = props

    if (data && data.geoData) {
      let allFeature = state.newMap.data.getAllFeature()

      if (allFeature.length > 0) {
        while (allFeature.length > 0) {
          let item = allFeature[0]
          state.newMap.data.removeFeature(item)
        }
      }

      data.geoData.forEach(element => {
        state.newMap.data.addGeoJson(element)
      })
    }
    return true
  }

  render () {
    return (
      <>
        <div id="map" style={{ width: '100%', height: 600 + 'px' }} ref={this.map}></div>
        {/* {JSON.stringify(data)} */}
      </>
    )
  }
}

const mapStateToProps = (state) => ({
  mapObj: state.mapObj,
  _lat: state.lat,
  _lng: state.lng,
  zoomLevel: state.zoomLevel,
  data: state.data
})

const maDispatchToPrope = (dispatch) => ({
  getDataAsync: bindActionCreators(getDataAsync, dispatch)
})

export default connect(mapStateToProps, maDispatchToPrope)(Map)
