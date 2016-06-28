# File Tree

File tree is a collection of packages to display and manipulate the file system.

![electron example](http://i.imgur.com/e8fhDJx.png)

### Quick Start

* [electron](./packages/file-tree-example-electron)
* [socket.io](./packages/file-tree-example-socket.io)

### How it works

There are 3 core packages:
* [file-tree-server](./packages/file-tree-server) - runs a file system watcher and builds an up-to-date tree data structure. The server passes the initial state and subsequent updates to the client.
* [file-tree-client](./packages/file-tree-client) - mirrors the tree data structure from the server, as well as applying updates as they happen. Allows operating on the tree (e.g. creating, renaming, deleting files), applying changes locally, and then updating with the definitive state from the server.
* [react-file-tree](./packages/react-file-tree) - a react component to display the file tree in a flexible, performant way.

To sync server and client, you'll need to transport the events from the server to the client. Currently supported servers and clients are:
* electron - [example](./packages/file-tree-example-electron) - ([main thread adapter](./packages/file-tree-server-transport-electron), [renderer thread adapter](./packages/file-tree-client-transport-electron))
* socket.io - [example](./packages/file-tree-example-socket.io) - ([server adapter](./packages/file-tree-server-transport-socket.io), [browser adapter](./packages/file-tree-client-transport-socket.io))

### Building for development/examples

First, clone this repository
```
git clone https://github.com/dabbott/file-tree.git
cd file-tree
```

Make sure you have [lerna](https://lernajs.io/) v2 installed globally
```
npm i -g lerna
```

Install dependencies for all packages
```
lerna bootstrap
```

`npm install` depencies of the root project, and build
```
npm i
npm run build
```
