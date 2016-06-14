import memoize from 'lodash.memoize'

const styles = {
  nodeContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  nodeContent: {
    flex: '0',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
  },
  nodeText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'proxima-nova, "Helvetica Neue", Helvetica, Arial, sans-serif',
    lineHeight: '40px',
    height: 40,
  },
  caret: {
    flex: '0 0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: 10,
    fontFamily: 'sans-serif',
    marginRight: 6,
  }
}

export const getPaddedStyle = memoize((depth) => {
  return {
    paddingLeft: depth * 20,
    ...styles.nodeContent,
  }
})

export default styles
