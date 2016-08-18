import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const fileTree = new FileTreeClient(transport(socket))

const Node = ({node, metadata, depth}) => {
  const {type, name, path} = node
  const {expanded, selected} = metadata

  const caret = type !== 'directory' ? null : expanded ? '▼' : '►'

  const style = {
    height: 20,
    lineHeight: '20px',
    paddingLeft: 10 * depth,
    WebkitUserSelect: 'none',
    cursor: 'default',
    color: selected ? 'blue' : 'black',
  }

  return (
    <div style={style}>{caret}{name}</div>
  )
}

fileTree.on('change', () => {
  ReactDOM.render(
    <FileTree
      controller={fileTree}
      plugins={['expand', 'select', 'actionsheet']}
      //onClick={(e, node, metadata, controller) => console.log('clicked', node.path)}
      //onExpand={(e, node, metadata, controller) => console.log('expanded', node.path)}
      //onSelect={(e, node, metadata, controller) => console.log('select', node.path)}
      nodeHeight={20}
      renderNode={(props) => {
        return <Node {...props}/>
      }}
    />,
    document.querySelector('#app')
  )
})
