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

    this.handleClick = this.handleClick.bind(this)
  }

  // shouldComponentUpdate(nextProps, nextState, nextContext) {
  //   const shouldUpdate = shallowCompare(this, nextProps, nextState)
  //
  //   // console.log('update', shouldUpdate, nextProps.node.path)
  //
  //   return shouldUpdate
  // }

  handleClick(e) {
    const {node, metadata, onClick} = this.props
    onClick(e, node, metadata)
  }

  render() {
    const {node, metadata, depth, onClick} = this.props
    const {type, name, path} = node
    const {expanded, selected} = metadata
    const {hover} = this.state

    // console.log('rendering', 'expanded', expanded, path, node)

    return (
      <div style={styles.nodeContainer}>
        <div style={getPaddedStyle(depth, selected, hover)}
          onClick={this.handleClick}
          onMouseEnter={() => this.setState({hover: true})}
          onMouseLeave={() => this.setState({hover: false})}>
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
