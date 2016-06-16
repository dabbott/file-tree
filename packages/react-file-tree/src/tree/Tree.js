import 'react-virtualized/styles.css'

import React, { Component, PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import shallowCompare from 'react-addons-shallow-compare'

import Node from './Node'
import { treeUtils } from 'file-tree-common'
const { getVisibleNodesByIndex, countVisibleNodes } = treeUtils

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
    version: 0,
    tree: null,
    metadata: null,
    onToggleNode: () => {},
  }

  constructor(props) {
    super()

    this.toggleNode = this.toggleNode.bind(this)
    this.renderNode = this.renderNode.bind(this)

    this.state = this.mapPropsToState(props)
  }

  mapPropsToState(props) {
    const {tree, metadata} = props

    return {
      visibleNodes: countVisibleNodes(tree, metadata),
    }
  }

  componentWillReceiveProps(nextProps) {
    // const {tree: oldTree, metadata: oldUi} = this.props
    // const {tree: newTree, metadata: newUi} = nextProps
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
  //   // const {tree: oldTree, metadata: oldUi} = this.props
  //   // const {tree: newTree, metadata: newUi} = nextProps
  //   //
  //   // return oldTree !== newTree || oldUi !== newUi
  //   // return shallowCompare(this, nextProps, nextState)
  // }

  toggleNode(node) {
    const {metadata} = this.props
    const {path} = node

    // metadata[path] ? delete metadata[path] : metadata[path] = true
    this.props.onToggleNode(node, metadata[path])
  }

  renderNode({index}) {
    const {tree, metadata} = this.props

    if (! this.indexCache ||
        ! this.indexCache[index - this.indexOffset]) {
      const lowerBound = Math.max(0, index - 20)
      const upperBound = index + 40

      this.indexOffset = lowerBound
      this.indexCache = getVisibleNodesByIndex(
        tree,
        metadata,
        lowerBound,
        upperBound
      )

      // console.log('cached', lowerBound, '<-->', upperBound)
    }

    const {node, depth} = this.indexCache[index - this.indexOffset]
    const {path} = node

    // console.log('node', metadata[path], path)

    return (
      <Node
        key={path}
        node={node}
        depth={depth}
        expanded={metadata[path]}
        onToggleNode={this.toggleNode}
      />
    )
  }

  render() {
    const {tree, version} = this.props
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
                // Updates the VirtualScroll when data changes.
                // Prop is not actually used.
                force={version}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    )
  }
}
