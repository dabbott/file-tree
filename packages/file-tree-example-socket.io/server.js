const FileTreeServer = require('node-file-tree-server')
const transport = require('node-file-tree-server-socket.io')
const io = require('socket.io')()

const tree = new FileTreeServer(__dirname, transport(io))

io.listen(3000)
