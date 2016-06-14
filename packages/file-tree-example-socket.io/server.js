const FileTreeServer = require('file-tree-server')
const transport = require('file-tree-server-transport-socket.io')
const io = require('socket.io')()

const PORT = 3000

const tree = new FileTreeServer(__dirname, transport(io))

console.log('socket.io listening on', PORT)

io.listen(PORT)
