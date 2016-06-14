import React, { Component, PropTypes } from 'react'
import shallowCompare from 'react-addons-shallow-compare'
import nodePath from 'path'

import NodeCaret from './NodeCaret'
import styles, { getPaddedStyle } from './styles'

const isDirectory = (type) => {
  return type === 'directory'
}

export default class Node extends Component {

  constructor() {
    super()

    this.handleClick = this.handleClick.bind(this)
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    const shouldUpdate = shallowCompare(this, nextProps, nextState)

    // console.log('update', shouldUpdate, nextProps.node.path)

    return shouldUpdate
  }

  handleClick() {
    const {node, onToggleNode} = this.props
    const {type} = node

    if (isDirectory(type)) {
      onToggleNode(node)
    }
  }

  render() {
    const {node, depth, expanded, onToggleNode} = this.props
    const {type, name, path} = node

    // console.log('rendering', 'expanded', expanded, path, node)

    return (
      <div style={styles.nodeContainer}>
        <div style={getPaddedStyle(depth)}
          onClick={this.handleClick}>
          {isDirectory(type) && (
            <NodeCaret
              expanded={expanded}
            />
          )}
          <div style={styles.nodeText}>{name}</div>
        </div>
      </div>
    )
  }
}
