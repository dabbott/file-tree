import React, { Component, PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import shallowCompare from 'react-addons-shallow-compare'

import Node from './Node'
import { getVisibleNodesByIndex, countVisibleNodes } from '../../../shared/utils/treeUtils'

const styles = {
  container: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#3B3738',
    minHeight: 0,
    minWidth: 0,
    overflow: 'none',
    flexWrap: 'no-wrap',
  },
  autoSizerWrapper: {
    flex: '1 1 auto',
    minHeight: 0,
    minWidth: 0,
    overflow: 'none',
  }
}

export default class extends Component {

  static defaultProps = {
    tree: null,
    ui: null,
    onToggleNode: () => {},
  }

  constructor(props) {
    super()

    this.toggleNode = this.toggleNode.bind(this)
    this.renderNode = this.renderNode.bind(this)

    this.state = this.mapPropsToState(props)
  }

  mapPropsToState(props) {
    const {tree, ui} = props

    return {
      visibleNodes: countVisibleNodes(tree, ui),
    }
  }

  componentWillReceiveProps(nextProps) {
    // const {tree: oldTree, ui: oldUi} = this.props
    // const {tree: newTree, ui: newUi} = nextProps
    //
    // if (oldTree !== newTree || oldUi !== newUi) {
      delete this.indexCache
      delete this.indexOffset
    //
      this.setState(this.mapPropsToState(nextProps))
    // }
  }

  // shouldComponentUpdate(nextProps, nextState) {
  //   return true
  //   // const {tree: oldTree, ui: oldUi} = this.props
  //   // const {tree: newTree, ui: newUi} = nextProps
  //   //
  //   // return oldTree !== newTree || oldUi !== newUi
  //   // return shallowCompare(this, nextProps, nextState)
  // }

  toggleNode(node) {
    const {ui} = this.props
    const {path} = node

    ui[path] ? delete ui[path] : ui[path] = true
    this.props.onToggleNode(node, ui[path])
  }

  renderNode({index}) {
    const {tree, ui} = this.props

    if (! this.indexCache ||
        ! this.indexCache[index - this.indexOffset]) {
      const lowerBound = Math.max(0, index - 20)
      const upperBound = index + 40

      this.indexOffset = lowerBound
      this.indexCache = getVisibleNodesByIndex(
        tree,
        ui,
        lowerBound,
        upperBound
      )

      // console.log('cached', lowerBound, '<-->', upperBound)
    }

    const {node, depth} = this.indexCache[index - this.indexOffset]
    const {path} = node

    // console.log('node', index)

    return (
      <Node
        key={path}
        node={node}
        depth={depth}
        expanded={ui[path]}
        onToggleNode={this.toggleNode}
      />
    )
  }

  render() {
    const {tree} = this.props
    const {visibleNodes} = this.state

    console.log('rendering tree')

    return (
      <div style={styles.container}>
        <div style={styles.autoSizerWrapper}>
          <AutoSizer>
            {({width, height}) => (
              <VirtualScroll
                height={height}
                overscanRowCount={3}
                rowHeight={40}
                rowRenderer={this.renderNode}
                rowCount={visibleNodes}
                width={width}
                // Updates the VirtualScroll when data changes
                tree={tree}
                // force={Math.random()}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    )
  }
}
