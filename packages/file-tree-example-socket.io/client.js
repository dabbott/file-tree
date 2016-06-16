import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const fileTree = new FileTreeClient(transport(socket))

fileTree.on('change', ({payload: {tree, ui, version}}) => {
  const mountNode = document.querySelector('#app')
  console.log('version', version, 'tree', tree, 'ui', ui)

  ReactDOM.render(
    <FileTree
      version={version}
      tree={tree}
      metadata={ui}
      onToggleNode={({path}) => {
        console.log('toogled')
        fileTree.updateNodeMetadata(path, 'expanded', ! ui[path])
        // if (! ui[path]) {
        console.log('emitting')
          socket.send({
            type: 'watchPath',
            payload: { path },
          })
        // }
      }}
    />,
    mountNode
  )
})
