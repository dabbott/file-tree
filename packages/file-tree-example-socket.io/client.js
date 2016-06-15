import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const fileTree = new FileTreeClient(transport(socket))

fileTree.on('change', ({payload: {tree, ui}}) => {
  const mountNode = document.querySelector('#app')
  console.log('tree', tree, 'ui', ui)

  ReactDOM.render(
    <FileTree
      tree={tree}
      ui={ui}
      onToggleNode={({path}, expanded) => {
        console.log('toogled')
        // fileTree._emitChange(fileTree.tree.state)
        // emitChange()
        // if (expanded) {
        //   transport.send({
        //     eventName: 'watchPath',
        //     path: path,
        //   })
        // }
      }}
    />,
    mountNode
  )
})
