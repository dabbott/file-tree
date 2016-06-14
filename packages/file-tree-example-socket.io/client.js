import FileTreeClient from 'node-file-tree-client'
import transport from 'node-file-tree-client-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const tree = new FileTreeClient(transport(socket))

tree.on('change', ({tree, ui}) => {
  const mountNode = document.querySelector('#app')

  ReactDOM.render(
    <FileTree tree={tree} ui={ui} />,
    mountNode
  )
})
