import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const fileTree = new FileTreeClient(transport(socket))

fileTree.on('change', ({payload: {tree, metadata, version}}) => {
  const mountNode = document.querySelector('#app')
  console.log('version', version, 'tree', tree, 'metadata', metadata)

  ReactDOM.render(
    <FileTree
      controller={fileTree}
      version={version}
      tree={tree}
      metadata={metadata}
      onOperationStart={fileTree.startOperation}
      onOperationFinish={fileTree.finishOperation}
      plugins={['expand', 'select']}
      onClick={(e, node, metadata, controller) => console.log('clicked', node.path)}
      onExpand={(e, node, metadata, controller) => console.log('expanded', node.path)}
      onSelect={(e, node, metadata, controller) => console.log('select', node.path)}
    />,
    mountNode
  )
})
