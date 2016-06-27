# File Tree

File tree is a collection of packages to display and manipulate a file system.

## How it works

There are 3 core packages:
* file-tree-server - runs a file system watcher and builds an up-to-date tree data structure. The server passes the initial state and subsequent updates to the client.
* file-tree-client - displays the tree data structure from the server, as well as applying updates as they happen. Allows operating on the tree (e.g. creating, renaming, deleting files), applying them locally, and then updating with the definitive state from the server.
* react-file-tree - a react component to display the file tree in a flexible, performant way.

To sync server and client, you'll need to transport the events from the server to the client. Currently supported servers and clients are:
* electron
* socket.io

### Server API

##### With socket.io

```JavaScript
const FileTreeServer = require('file-tree-server')
const transport = require('file-tree-server-transport-socket.io')
const io = require('socket.io')()

const tree = new FileTreeServer(transport(io), __dirname)

io.listen(3000)
```

##### With Electron

```JavaScript
import FileTreeServer from 'file-tree-server'
import transport from 'file-tree-server-transport-electron'
import electron from 'electron'

const { ipcMain } = electron

const tree = new FileTreeServer(transport(ipcMain), __dirname)
```

### Client API

##### With socket.io

```JavaScript
import FileTreeClient from 'file-tree-client'
import transport from 'file-tree-client-transport-socket.io'
import io from 'socket.io-client'

import React from 'react'
import ReactDOM from 'react-dom'
import FileTree from 'react-file-tree'

const socket = io('http://localhost:3000')
const fileTree = new FileTreeClient(transport(socket))

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

##### With electron

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
