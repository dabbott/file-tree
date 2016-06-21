import 'react-virtualized/styles.css'

import React, { Component, PropTypes } from 'react'
import { AutoSizer, VirtualScroll } from 'react-virtualized'
import shallowCompare from 'react-addons-shallow-compare'
import nodePath from 'path'

import DefaultNode from './Node'
import { treeUtils } from 'file-tree-common'
const { getVisibleNodesByIndex, countVisibleNodes } = treeUtils

const styles = {
  container: {
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
  node: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.1)',
    outline: 'none',
  },
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

      // Only expand directories if no meta or shift key is pressed
      if (type === 'directory' && ! e.metaKey && ! e.shiftKey) {
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
        const {nodes, selectedIndex} = getSelectionInfo(tree, metadata)
        const range = selectedIndex > index ? [index, selectedIndex] : [selectedIndex, index]

        // console.log('selecting', index, '<==>', selectedIndex, range)

        for (let i = range[0]; i <= range[1]; i++) {
          const currentNode = nodes[i]
          const currentMetadata = metadata[currentNode.path] || {}
          const currentSelected = currentMetadata.selected
          controller.updateNodeMetadata(currentNode.path, 'selected', true)
          if (! currentSelected) {
            this.props.onSelect && this.props.onSelect.call(this, e, currentNode, currentMetadata, i)
          }
        }
      } else {
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
  actionsheet: {
    onContextMenu: function (pluginOptions, e, node, nodeMetadata, index) {
      e.preventDefault()

      const {controller} = this.props
      const {tree, metadata} = this.state
      const {type, path} = node
      const {selected} = nodeMetadata

      const actions = []

      // if (type === 'directory') [
      //   actions.push(['Create file', () => {
      //     controller.run('writeFile', nodePath.join(path, 'test.txt'), '').then((info) => {
      //       console.log('wrote file', info)
      //     }).catch((e) => {
      //       console.log('failed to write file', e)
      //     })
      //   }])
      // ]

      const style = {
        position: 'absolute',
        top: 40,
        left: 40,
        right: 40,
        zIndex: 1000,
        borderRadius: 10,
        backgroundColor: 'white',
        border: '1px solid black',
      }

      const overlay = (
        <div style={style}>
          {actions.map(([name, f]) => {
            return (
              <div
                key={name}
                onClick={f}
              >{name}</div>
            )
          })}
        </div>
      )

      this.setState({overlay})
    }
  }
}

export default class extends Component {

  static defaultProps = {
    plugins: [],
    nodeHeight: 40,
    NodeComponent: DefaultNode,
  }

  constructor(props) {
    super()

    this.handleClick = this.handleEvent.bind(this, 'onClick')
    this.handleKeyUp = this.handleEvent.bind(this, 'onKeyUp')
    this.handleKeyDown = this.handleEvent.bind(this, 'onKeyDown')
    this.handleContextMenu = this.handleEvent.bind(this, 'onContextMenu')
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
      plugins: this.normalizePlugins(plugins),
    }
  }

  normalizePlugins(plugins) {
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
    const {NodeComponent} = this.props
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
    const nodeMetadata = metadata[path] || {}

    // console.log('render node', path, tree, metadata)

    return (
      <div style={styles.node}
        tabIndex={'0'}
        onClick={this.handleClick.bind(this, node, nodeMetadata, index)}
        onKeyUp={this.handleKeyUp.bind(this, node, nodeMetadata, index)}
        onKeyDown={this.handleKeyDown.bind(this, node, nodeMetadata, index)}
        onContextMenu={this.handleContextMenu.bind(this, node, nodeMetadata, index)}
      >
        <NodeComponent
          key={path}
          node={node}
          metadata={nodeMetadata}
          depth={depth}
          index={index}
        />
      </div>
    )
  }

  render() {
    const {nodeHeight} = this.props
    const {visibleNodes, version, overlay} = this.state

    // console.log('rendering tree', visibleNodes)

    return (
      <div style={styles.container}>
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
