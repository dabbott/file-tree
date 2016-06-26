import path from 'path'
import electron from 'electron'
import './tree'

const { app, BrowserWindow } = electron

let win

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(`http://localhost:3001`)

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)
app.on('window-all-closed', () => app.quit())
