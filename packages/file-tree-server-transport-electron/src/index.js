import Host from './Host'

export default (ipcMain) => {
  return new Host(ipcMain)
}
