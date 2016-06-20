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

    this.state = {}

    this.handleClick = this.handleEvent.bind(this, 'onClick')
    this.handleKeyUp = this.handleEvent.bind(this, 'onKeyUp')
    this.handleKeyDown = this.handleEvent.bind(this, 'onKeyDown')
  }

  // shouldComponentUpdate(nextProps, nextState, nextContext) {
  //   const shouldUpdate = shallowCompare(this, nextProps, nextState)
  //
  //   // console.log('update', shouldUpdate, nextProps.node.path)
  //
  //   return shouldUpdate
  // }

  handleEvent(eventName, e) {
    const {node, metadata, index} = this.props
    this.props[eventName](e, node, metadata, index)
  }

  render() {
    const {node, metadata, depth} = this.props
    const {type, name, path} = node
    const {expanded, selected} = metadata
    const {hover} = this.state

    // console.log('rendering', 'expanded', expanded, path, node)

    return (
      <div style={styles.nodeContainer}
        tabIndex={'0'}
        onClick={this.handleClick}
        onKeyUp={this.handleKeyUp}
        onKeyDown={this.handleKeyDown}
        onMouseEnter={() => this.setState({hover: true})}
        onMouseLeave={() => this.setState({hover: false})}
      >
        <div style={getPaddedStyle(depth, selected, hover)}>
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
