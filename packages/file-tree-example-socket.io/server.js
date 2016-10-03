const FileTreeServer = require('file-tree-server')
const git = require('file-tree-git')
const transport = require('file-tree-server-transport-socket.io')
const io = require('socket.io')()
const path = require('path')

const PORT = 3000
const DIRECTORY = path.dirname(path.dirname(__dirname))

const tree = new FileTreeServer(transport(io), DIRECTORY, {
  scan: true,
  plugins: [git],
})

console.log('socket.io listening on', PORT)

io.listen(PORT)
