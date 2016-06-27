import memoize from 'fast-memoize'

const styles = {
  treeContainer: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    flexWrap: 'no-wrap',
    position: 'relative',
  },
  autoSizerWrapper: {
    flex: '1 1 auto',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  },
  nodeContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    outline: 'none',
  },
  nodeContent: {
    flex: '1 1 auto',
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

export const getPaddedStyle = memoize((depth, selected, hover) => {
  return {
    paddingLeft: depth * 20,
    ...styles.nodeContent,
    backgroundColor: selected ? '#888' :
        hover ? '#555' : '#333',
  }
})

export default styles
