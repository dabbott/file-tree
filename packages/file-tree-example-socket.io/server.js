const FileTreeServer = require('file-tree-server')
const transport = require('file-tree-transport/lib/server/socket.io')
const io = require('socket.io')()

const tree = new FileTreeServer(__dirname, transport(io))

io.listen(3000)
