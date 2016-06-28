### `socket.io` Quick Start

##### Server

```JavaScript
import FileTreeServer from 'file-tree-server'
import transport from 'file-tree-server-transport-socket.io'
import Server from 'socket.io'

const io = Server()
const tree = new FileTreeServer(transport(io), __dirname)

io.listen(3000)
```

##### Client

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
