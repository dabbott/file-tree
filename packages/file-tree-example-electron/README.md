### `electron` Quick Start

##### Main Thread

```JavaScript
import FileTreeServer from 'file-tree-server'
import transport from 'file-tree-server-transport-electron'
import electron from 'electron'

const { ipcMain } = electron

const tree = new FileTreeServer(transport(ipcMain), __dirname)
```

##### Renderer Thread

```JavaScript
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
      plugins={['expand', 'select']}
    />,
    document.querySelector('#app')
  )
})
```
