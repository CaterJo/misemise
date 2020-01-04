import React from 'react'
import { connect } from 'react-redux'
import Map from '../Map'
import 'tui-grid/dist/tui-grid.css'
import Grid from '@toast-ui/react-grid'
import { bindActionCreators } from 'redux'
import { getDataAsync } from '../../store/modules'

const columns = [
  { name: 'id', title: '지역' },
  { name: 'name', title: '수치' },
  { name: 'etc', title: '단계' }
]

// 함수형 컴포넌트
const App = ({ gridData }) => {
  return (
    <>
      <Map ncpClientId="har461wdhc"/>
      <Grid
        data={gridData}
        columns={columns}
        rowHeight={25}
        bodyHeight={100}
        virtualScrolling={true}
        heightResizable={false}
        rowHeaders={['rowNum']}
      />
    </>
  )
}

const mapStateToProps = (state) => ({
  gridData: state.gridData
})

const maDispatchToPrope = (dispatch) => ({
  getDataAsync: bindActionCreators(getDataAsync, dispatch)
})

export default connect(mapStateToProps, maDispatchToPrope)(App)
