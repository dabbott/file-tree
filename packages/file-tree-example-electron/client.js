import electron from 'electron'
const { ipcRenderer } = electron

import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-electron'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const fileTree = new FileTreeClient(transport(ipcRenderer))

fileTree.on('change', () => {
  ReactDOM.render(
    <FileTree
      controller={fileTree}
      plugins={['expand', 'select', 'actionsheet']}
    />,
    document.querySelector('#app')
  )
})
