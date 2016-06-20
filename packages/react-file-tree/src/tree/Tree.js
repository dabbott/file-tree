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

const selectNode = function(e, node, nodeMetadata, index) {
  const {controller} = this.props
  const {path} = node
  const {metadata} = controller

  // Disable all existing selections
  for (let key in metadata) {
    if (metadata[key] && metadata[key].selected) {
      controller.updateNodeMetadata(key, 'selected', false)
    }
  }

  controller.updateNodeMetadata(path, 'selected', true)

  this.props.onSelect && this.props.onSelect.call(this, e, node, nodeMetadata, index)
}

const getSelectionInfo = (tree, metadata) => {
  const nodeInfo = getVisibleNodesByIndex(tree, metadata, 0, Infinity)
  let selectedIndex = 0
  while (selectedIndex < nodeInfo.length) {
    const {path} = nodeInfo[selectedIndex].node
    if (metadata[path] && metadata[path].selected) {
      break
    }
    selectedIndex++
  }

  return {
    nodes: nodeInfo.map(({node}) => node),
    selectedIndex,
  }
}

const PLUGINS = {
  expand: {
    onClick: function (pluginOptions, e, node, nodeMetadata, index) {
      const {controller} = this.props
      const {type, path} = node
      const {expanded} = nodeMetadata

      if (type === 'directory') {
        const next = ! expanded

        controller.updateNodeMetadata(path, 'expanded', next)

        if (next) {
          controller.watchPath(path)
        }

        this.props.onExpand && this.props.onExpand.call(this, e, node, nodeMetadata, index)
      }
    },
  },
  select: {
    onClick: function (pluginOptions, e, node, nodeMetadata, index) {
      const {controller} = this.props
      const {type, path} = node
      const {selected} = nodeMetadata
      const {tree, metadata} = this.state

      if (e.metaKey && pluginOptions.multiple !== false) {
        controller.updateNodeMetadata(path, 'selected', ! selected)
        if (! selected) {
          this.props.onSelect && this.props.onSelect.call(this, e, node, nodeMetadata, index)
        }
      } else if (e.shiftKey && pluginOptions.multiple !== false) {
        // const {nodes, selectedIndex} = getSelectionInfo(tree, metadata)
        // const range = selectedIndex > index ? [index, selectedIndex] : [selectedIndex, index]
        //
        // console.log('selecting', index, '<==>', selectedIndex, range)
        //
        // for (let i = range[0]; i <= range[1]; i++) {
        //   const currentNode = nodes[i]
        //   const currentMetadata = metadata[currentNode.path] || {}
        //   const currentSelected = currentMetadata.selected
        //   controller.updateNodeMetadata(currentNode.path, 'selected', true)
        //   if (! currentSelected) {
        //     this.props.onSelect && this.props.onSelect.call(this, e, currentNode, currentMetadata, i)
        //   }
        // }
      } else if (! selected) {
        selectNode.call(this, e, node, nodeMetadata, index)
      }
    },
  },
  keyboard: {
    onKeyDown: function (pluginOptions, e, node, nodeMetadata, index) {
      const {controller} = this.props
      const {tree, metadata} = this.state
      const {selected} = nodeMetadata

      switch (e.which) {
        // up
        case 38: {
          const {nodes, selectedIndex} = getSelectionInfo(tree, metadata)
          if (selectedIndex > 0) {
            e.preventDefault()
            const nextNode = nodes[selectedIndex - 1]
            selectNode.call(this, e, nextNode, metadata[nextNode.path] || {}, selectedIndex - 1)
          }
          break
        }
        // down
        case 40: {
          const {nodes, selectedIndex} = getSelectionInfo(tree, metadata)
          if (selectedIndex < nodes.length - 1) {
            e.preventDefault()
            const nextNode = nodes[selectedIndex + 1]
            selectNode.call(this, e, nextNode, metadata[nextNode.path] || {}, selectedIndex + 1)
          }
          break
        }
      }
    },
  },
}

export default class extends Component {

  static defaultProps = {
    plugins: [],
  }

  constructor(props) {
    super()

    this.handleClick = this.handleEvent.bind(this, 'onClick')
    this.handleKeyUp = this.handleEvent.bind(this, 'onKeyUp')
    this.handleKeyDown = this.handleEvent.bind(this, 'onKeyDown')
    this.renderNode = this.renderNode.bind(this)

    this.state = this.mapPropsToState(props)
  }

  mapPropsToState(props) {
    const {controller, plugins} = props
    const {tree, metadata, version} = controller.tree.state

    return {
      version,
      tree,
      metadata,
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
    if (nextProps.controller.version !== this.state.version) {
      delete this.indexCache
      delete this.indexOffset

      this.setState(this.mapPropsToState(nextProps))
    }
  }

  runInOperation(f) {
    this.props.controller.startOperation()
    f()
    this.props.controller.finishOperation()
  }

  handleEvent(eventName, e, node, metadata, index) {
    const {plugins} = this.state
    const {controller} = this.props

    this.runInOperation(() => {
      plugins.forEach(([plugin, options]) => {
        plugin[eventName] && plugin[eventName].call(this,
          options,
          e,
          node,
          metadata,
          index
        )
      })
      this.props[eventName] && this.props[eventName].call(this,
        e,
        node,
        metadata,
        index
      )
    })
  }

  renderNode({index}) {
    const {tree, metadata} = this.state

    if (! this.indexCache ||
        ! this.indexCache[index - this.indexOffset]) {
      const lowerBound = Math.max(0, index - 20)
      const count = 40

      this.indexOffset = lowerBound
      this.indexCache = getVisibleNodesByIndex(
        tree,
        metadata,
        lowerBound,
        count
      )

      // console.log('cached', lowerBound, '<-->', upperBound)
    }

    const {node, depth} = this.indexCache[index - this.indexOffset]
    const {path} = node

    // console.log('render node', path, tree, metadata)

    return (
      <Node
        key={path}
        node={node}
        metadata={metadata[path] || {}}
        depth={depth}
        index={index}
        onClick={this.handleClick}
        onKeyUp={this.handleKeyUp}
        onKeyDown={this.handleKeyDown}
      />
    )
  }

  render() {
    const {visibleNodes, version} = this.state

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
