import { handleActions, createAction } from 'redux-actions'
import axios from 'axios'



//2020.0104 : naver map 신버전 기준.
const zoomRange = [7,9,11];
const minZoomLevel = zoomRange[0];
const maxZoomLevel = zoomRange[zoomRange.length-1];


const getMiseDate = (otp) => {
  console.log('getMiose', otp)

  // parentCd : 사용자가 클릭한 geoJSON의 코드값.
  // zoomLevel : 요청 레벨.
  let serverUrl = process.env.REACT_APP_SERVER_URL
  let sig = `/sig?zoomLevel=${otp.zoomLevel}&parentCd=${otp.parentCd}`
  let emd = `/emd?zoomLevel=${otp.zoomLevel}&parentCd=${otp.parentCd}`
  let country = `/country?zoomLevel=${otp.zoomLevel}&parentCd=${otp.parentCd}`

  let url = serverUrl +
  (otp.zoomLevel === minZoomLevel ? country
  : otp.zoomLevel === maxZoomLevel ? emd : sig)
  
  return axios.request({
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    method: 'GET',
    url: url
  })
}

// 한글 주소로 변환한다.
const converLatLngToAddr = (otp) => {
  const { naver, _lat, _lng } = otp

  return new Promise((resolve) => {
    naver.maps.Service.reverseGeocode({ location: new naver.maps.LatLng(_lat, _lng) }, (status, response) => {
      if (status === naver.maps.Service.Status.OK) {
        let addr = response.result.items[0]
        resolve(addr)
      }
    })
  })
}

// Action
const GET_MISE_DATA = 'GET_MISE_DATA'

// React에서 호출하는 부분
export const getData = createAction(GET_MISE_DATA)

export const getDataAsync = (otp) => dispatch => {
  // 주소변환.
  converLatLngToAddr(otp).then(rtn => 
     getMiseDate({ ...otp, addr: rtn })
  ).then(rtn => {
    // 요청이 성공했을경우, 서버 응답내용을 payload 로 설정하여 GET_POST_SUCCESS 액션을 디스패치합니다.

    dispatch({
      type: GET_MISE_DATA,
      payload: { ...rtn, ...otp }
    })
  }).catch(error => {
    // 에러가 발생했을 경우, 에로 내용을 payload 로 설정하여 GET_POST_FAILURE 액션을 디스패치합니다.
    dispatch({
      type: GET_MISE_DATA,
      payload: { ...error, ...otp }
    })
  })
}

// 행정구역의 레벨. (줌 레벨)
// 중앙 : 충주.
const counterInitialState = {
  data: {},
  mapObj: {},
  zoomLevel: 2,
  lat: 36.9257913,
  lng: 127.87798
}

// 리듀서.
export default handleActions({
  [GET_MISE_DATA]: (state, action) => {
    const { data, _lat, _lng, map, zoomLevel } = action.payload

    let gridData = []
    if (data&& data.geoData) {
      gridData = data.geoData.map(i => {
        return { 'id': i.properties.LOC_KOR_NM, 'name': i.properties.AIR_LV, 'etc': i.properties.KOR_LV }
      })
    }

    return {
      ...state,
      'zoomLevel': zoomLevel,
      'mapObj': map,
      'lat': _lat,
      'lng': _lng,
      'data': data,
      'gridData': gridData
    }
  }
}, counterInitialState)
