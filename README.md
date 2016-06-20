# Node File Tree

Node file tree comes with two independent parts: the server and the client.

### Server API

##### With socket.io

```JavaScript
import { FileTreeServer } from 'node-file-tree/server/FileTree'
import transport from 'node-file-tree/server/transport/socket.io'
const io = require('socket.io')()

const tree = new FileTreeServer(__dirname, transport(io))

io.listen(3000)
```

##### With Electron

```JavaScript
import { FileTreeServer } from 'node-file-tree/server/FileTree'
import transport from 'node-file-tree/server/transport/electron'
import { ipcMain } from 'electron'

const tree = new FileTreeServer(__dirname, transport(ipcMain))
```

### Client API

##### With socket.io

```JavaScript
import { FileTreeClient, FileTreeComponent } from 'node-file-tree/client/FileTree'
import transport from 'node-file-tree/client/transport/socket.io'
import io from 'socket.io-client'
import React from 'react'
import ReactDOM from 'react-dom'

const socket = io('http://localhost:3000')
const tree = new FileTreeClient(transport(socket))

tree.on('change', ({tree, ui}) => {
  const mountNode = document.querySelector('#app')

  ReactDOM.render(
    <FileTreeComponent tree={tree} ui={ui} />,
    mountNode
  )
})
```

##### With electron

```JavaScript
import { FileTreeClient, FileTreeComponent } from 'node-file-tree/client/FileTree'
import transport from 'node-file-tree/client/transport/socket.io'
import { ipcRenderer } from 'electron'
import React from 'react'
import ReactDOM from 'react-dom'

const tree = new FileTreeClient(transport(ipcRenderer))

tree.on('change', ({tree, ui}) => {
  const mountNode = document.querySelector('#app')

  ReactDOM.render(
    <FileTreeComponent tree={tree} ui={ui} />,
    mountNode
  )
})
```
