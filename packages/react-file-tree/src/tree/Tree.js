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
    overflow: 'hidden',
    flexWrap: 'no-wrap',
  },
  autoSizerWrapper: {
    flex: '1 1 auto',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  }
}

const PLUGINS = {
  expand: {
    onClick: function (pluginOptions, e, node, nodeMetadata, fileTree) {
      const {type, path} = node
      const {expanded} = nodeMetadata

      if (type === 'directory') {
        const next = ! expanded

        fileTree.updateNodeMetadata(path, 'expanded', next)

        if (next) {
          fileTree.watchPath(path)
        }

        this.props.onExpand && this.props.onExpand.call(this, e, node, nodeMetadata, fileTree)
      }
    },
  },
  select: {
    onClick: function (pluginOptions, e, node, nodeMetadata, fileTree) {
      const {type, path} = node
      const {selected} = nodeMetadata
      const {metadata} = fileTree

      if (e.metaKey && pluginOptions.multiple !== false) {
        fileTree.updateNodeMetadata(path, 'selected', ! selected)
      } else if (! selected) {
        for (let key in metadata) {
          if (metadata[key] && metadata[key].selected) {
            fileTree.updateNodeMetadata(key, 'selected', false)
          }
        }

        fileTree.updateNodeMetadata(path, 'selected', true)

        this.props.onSelect && this.props.onSelect.call(this, e, node, nodeMetadata, fileTree)
      }
    },
  },
}

export default class extends Component {

  static defaultProps = {
    version: 0,
    tree: null,
    metadata: null,
    plugins: [],
    onClick: () => {},
    onOperationStart: () => {},
    onOperationFinish: () => {},
  }

  constructor(props) {
    super()

    this.handleClick = this.handleClick.bind(this)
    this.renderNode = this.renderNode.bind(this)

    this.state = this.mapPropsToState(props)
  }

  mapPropsToState(props) {
    const {tree, metadata, plugins} = props

    return {
      visibleNodes: countVisibleNodes(tree, metadata),
      plugins: this.resolvePlugins(plugins),
    }
  }

  resolvePlugins(plugins) {
    return plugins.map(plugin => {
      if (! Array.isArray(plugin)) {
        plugin = [plugin, {}]
      }

      if (typeof plugin[0] === 'string') {
        return [PLUGINS[plugin[0]], plugin[1] || {}]
      }

      return plugin
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.version !== this.props.version) {
      delete this.indexCache
      delete this.indexOffset

      this.setState(this.mapPropsToState(nextProps))
    }
  }

  runInOperation(f) {
    this.props.onOperationStart()
    console.log('running operation')
    f()
    this.props.onOperationFinish()
  }

  handleClick(e, node, metadata) {
    const {plugins} = this.state
    const {controller} = this.props

    this.runInOperation(() => {
      plugins.forEach(([plugin, options]) => plugin.onClick && plugin.onClick.call(this, options, e, node, metadata, controller))
      this.props.onClick.call(this, e, node, metadata, controller)
    })
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

    // console.log('render node', metadata[path], path)

    return (
      <Node
        key={path}
        node={node}
        metadata={metadata[path] || {}}
        depth={depth}
        onClick={this.handleClick}
      />
    )
  }

  render() {
    const {version} = this.props
    const {visibleNodes} = this.state

    // console.log('rendering tree', visibleNodes)

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
