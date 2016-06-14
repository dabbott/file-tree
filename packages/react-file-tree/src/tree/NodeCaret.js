import React, { Component } from 'react'
import shallowCompare from 'react-addons-shallow-compare'

import styles from './styles'

export default class extends Component {

  static defaultProps = {
    expanded: false,
  }

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  }

  render() {
    const {expanded} = this.props

    return (
      <div style={styles.caret}>
        {expanded ? '▼' : '►'}
      </div>
    )
  }
}
