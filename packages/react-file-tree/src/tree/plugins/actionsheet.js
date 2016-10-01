import React, { Component, PropTypes } from 'react'
import nodePath from 'path'

const style = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.5)',
  border: '1px solid black',
  padding: 40,
}

const buttonStyle = {
  backgroundColor: 'white',
  color: 'black',
  paddingLeft: 15,
  lineHeight: '40px',
}

// Prompt doesn't exist in electron, so just default to 'test' for now
const maybePrompt = (instructions) => {
  try {
    return prompt(instructions)
  } catch (e) {
    return 'test'
  }
}

const operations = {
  createFile: function (controller, node) {
    const {path} = node

    this.setState({overlay: null})

    const newFileName = maybePrompt('Enter a name for the new file')
    if (! newFileName) { return }

    const newPath = nodePath.join(path, newFileName)
    if (! confirm(`Write ${newPath}?`)) { return }

    controller.run('writeFile', newPath, '')
  },
  createDirectory: function (controller, node) {
    const {path} = node

    this.setState({overlay: null})

    const newFileName = maybePrompt('Enter a name for the new directory')
    if (! newFileName) { return }

    const newPath = nodePath.join(path, newFileName)
    if (! confirm(`Write ${newPath}?`)) { return }

    controller.run('mkdir', newPath)
  },
  rename: function (controller, node) {
    const {path} = node

    this.setState({overlay: null})

    const newFileName = maybePrompt(`Enter a new name for ${name}`)
    if (! newFileName) { return }

    const newPath = nodePath.join(nodePath.dirname(path), newFileName)
    if (! confirm(`Rename to ${newPath}?`)) { return }

    controller.run('rename', path, newPath)
  },
  delete: function (controller, node) {
    const {path} = node

    this.setState({overlay: null})

    if (! confirm(`Are you sure you want to delete ${path}?`)) { return }

    controller.run('remove', path)
  },
  setRootPath: function (controller, node) {
    const {path} = node

    this.setState({overlay: null})

    const newPath = maybePrompt(`Enter a new root path`, path)
    if (! newPath) { return }
    if (! confirm(`Set root path to ${newPath}?`)) { return }

    controller.setRootPath(newPath)
  },
  search: function (controller, node) {
    this.setState({overlay: null})

    const text = maybePrompt(`Search filenames`)

    const startTime = +new Date()
    console.log(controller.search(text, 'file', 30).map(node => node.path))
    console.log('took', +new Date() - startTime)
  },

}

export default {
  onContextMenu: function (pluginOptions, e, node, nodeMetadata, index) {
    e.preventDefault()

    const {controller} = this.props
    const {type, path, name} = node

    let actions = []

    if (type === 'directory') {
      actions.push(['Create file', operations.createFile])
      actions.push(['Create directory', operations.createDirectory])
    }
    actions.push([`Rename ${name}`, operations.rename])
    actions.push([`Delete ${name}`, operations.delete])
    actions.push([`Set root path`, operations.setRootPath])
    actions.push([`Search filenames`, operations.search])

    actions = actions.map(([title, f]) => [title, f.bind(this, controller, node)])

    const overlay = (
      <div style={style}
        onClick={() => this.setState({overlay: null})}>
        {actions.map(([name, f]) => {
          return (
            <div
              style={buttonStyle}
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
