import FileTreeServer from 'file-tree-server'
import transport from 'file-tree-server-transport-electron'
import electron from 'electron'

const { ipcMain } = electron

const tree = new FileTreeServer(transport(ipcMain), __dirname)
