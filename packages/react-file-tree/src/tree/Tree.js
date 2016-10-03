import 'react-virtualized/styles.css'

import React, { Component, PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import shallowCompare from 'react-addons-shallow-compare'
import nodePath from 'path'

import DefaultNode from './Node'
import { treeUtils, normalizePlugins } from 'file-tree-common'
const { getVisibleNodesByIndex, countVisibleNodes } = treeUtils
import styles from './styles'
import selectPlugin from './plugins/select'
import expandPlugin from './plugins/expand'
import actionsheetPlugin from './plugins/actionsheet'

const PLUGIN_MAP = {
  select: selectPlugin,
  expand: expandPlugin,
  actionsheet: actionsheetPlugin,
}

export default class extends Component {

  static defaultProps = {
    plugins: [],
    nodeHeight: 40,
    renderNode: (props) => <DefaultNode {...props} />,
  }

  constructor(props) {
    super()

    this.handleClick = this.handleEvent.bind(this, 'onClick')
    this.handleDoubleClick = this.handleEvent.bind(this, 'onDoubleClick')
    this.handleMouseEnter = this.handleEvent.bind(this, 'onMouseEnter')
    this.handleMouseLeave = this.handleEvent.bind(this, 'onMouseLeave')
    this.handleKeyUp = this.handleEvent.bind(this, 'onKeyUp')
    this.handleKeyDown = this.handleEvent.bind(this, 'onKeyDown')
    this.handleContextMenu = this.handleEvent.bind(this, 'onContextMenu')
    this.renderNode = this.renderNode.bind(this)

    this.state = this.mapPropsToState(props)
  }

  mapPropsToState(props) {
    const {controller, plugins} = props
    const {tree, metadata, stat, version} = controller.tree.state

    return {
      version,
      tree,
      metadata,
      stat,
      visibleNodes: countVisibleNodes(tree, metadata),
      indexCache: getVisibleNodesByIndex(tree, metadata),
      plugins: normalizePlugins(plugins, PLUGIN_MAP),
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.controller.version !== this.state.version) {
      this.setState(this.mapPropsToState(nextProps))
    }
  }

  runInOperation(f) {
    this.props.controller.startOperation()
    try {
      f()
    } catch (e) {
      console.error('file-tree-client operation failed.')
      console.error(e)
    }
    this.props.controller.finishOperation()
  }

  handleEvent(eventName, node, metadata, index, e) {
    const {plugins} = this.state
    const {controller} = this.props

    this.runInOperation(() => {

      // Run each plugin for this event
      plugins.forEach(([plugin, options]) => {
        if (plugin[eventName]) {
          plugin[eventName].call(this, options, e, node, metadata, index)
        }
      })

      // Run handlers passed as props
      if (this.props[eventName]) {
        this.props[eventName].call(this, e, node, metadata, index)
      }
    })
  }

  renderNode({index}) {
    const {renderNode} = this.props
    const {metadata, stat, indexCache} = this.state
    const {node, depth} = indexCache[index]
    const {path} = node
    const nodeMetadata = metadata[path] || {}

    return (
      <div
        style={styles.nodeContainer}
        tabIndex={'0'}
        onClick={this.handleClick.bind(this, node, nodeMetadata, index)}
        onDoubleClick={this.handleDoubleClick.bind(this, node, nodeMetadata, index)}
        onMouseEnter={this.handleMouseEnter.bind(this, node, nodeMetadata, index)}
        onMouseLeave={this.handleMouseLeave.bind(this, node, nodeMetadata, index)}
        onKeyUp={this.handleKeyUp.bind(this, node, nodeMetadata, index)}
        onKeyDown={this.handleKeyDown.bind(this, node, nodeMetadata, index)}
        onContextMenu={this.handleContextMenu.bind(this, node, nodeMetadata, index)}
      >
        {
          renderNode({
            key: path,
            node,
            metadata: nodeMetadata,
            stat: stat[path],
            depth,
            index,
          })
        }
      </div>
    )
  }

  render() {
    const {nodeHeight} = this.props
    const {visibleNodes, version, overlay} = this.state

    return (
      <div style={styles.treeContainer}>
        <div style={styles.autoSizerWrapper}>
          <AutoSizer>
            {({width, height}) => (
              <VirtualScroll
                height={height}
                overscanRowCount={3}
                rowHeight={nodeHeight}
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
        {overlay}
      </div>
    )
  }
}
