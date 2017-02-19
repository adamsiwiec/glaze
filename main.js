 const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain
const autoUpdater = require("electron-updater").autoUpdater

let template = [{
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
    }, {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
    }, {
        type: 'separator'
    }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(function(win) {
                        if (win.id > 1) {
                            win.close()
                        }
                    })
                }
                focusedWindow.reload()
            }
        }
    }, {
        label: 'Toggle Full Screen',
        accelerator: (function() {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }, {
        type: 'separator'
    }, {
        label: 'App Menu Demo',
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                const options = {
                    type: 'info',
                    title: 'Application Menu Demo',
                    buttons: ['Ok'],
                    message: 'This demo is for the Menu section, showing how to create a clickable menu item in the application menu.'
                }
                electron.dialog.showMessageBox(focusedWindow, options, function() {})
            }
        }
    }]
}, {
    label: 'Window',
    role: 'window',
    submenu: [{
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
    }, {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
    }, {
        type: 'separator'
    }, {
        label: 'Reopen Window',
        accelerator: 'CmdOrCtrl+Shift+T',
        enabled: false,
        key: 'reopenMenuItem',
        click: function() {
            app.emit('activate')
        }
    }]
}, {
    label: 'Help',
    role: 'help',
    submenu: [{
        label: 'Learn More',
        click: function() {
            electron.shell.openExternal('https://siwiec.us/glaze')
        }
    }]
}]

function addUpdateMenuItems(items, position) {
    if (process.mas) return

    const version = electron.app.getVersion()
    let updateItems = [{
        label: `Version ${version}`,
        enabled: false
    }, {
        label: 'Checking for Update',
        enabled: false,
        key: 'checkingForUpdate'
    }, {
        label: 'Check for Update',
        visible: false,
        key: 'checkForUpdate',
        click: function() {
            require('electron').autoUpdater.checkForUpdates()
        }
    }, {
        label: 'Restart and Install Update',
        enabled: true,
        visible: false,
        key: 'restartToUpdate',
        click: function() {
            require('electron').autoUpdater.quitAndInstall()
        }
    }]

    items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem() {
    const menu = Menu.getApplicationMenu()
    if (!menu) return

    let reopenMenuItem
    menu.items.forEach(function(item) {
        if (item.submenu) {
            item.submenu.items.forEach(function(item) {
                if (item.key === 'reopenMenuItem') {
                    reopenMenuItem = item
                }
            })
        }
    })
    return reopenMenuItem
}

if (process.platform === 'darwin') {
    const name = electron.app.getName()
    template.unshift({
        label: name,
        submenu: [{
            label: `About ${name}`,
            role: 'about'
        }, {
            type: 'separator'
        }, {
            label: 'Services',
            role: 'services',
            submenu: []
        }, {
            type: 'separator'
        }, {
            label: `Hide ${name}`,
            accelerator: 'Command+H',
            role: 'hide'
        }, {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
        }, {
            label: 'Show All',
            role: 'unhide'
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
                app.quit()
            }
        }]
    })

    // Window menu.
    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    })

    addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
    const helpMenu = template[template.length - 1].submenu
    addUpdateMenuItems(helpMenu, 0)
}



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let introWindow
let win = null

function createWindow() {
    // Create the browser window.
    introWindow = new BrowserWindow({
            width: 600,
            height: 480,
            title: "Glaze",
            resizable: false
        })
        // and load the index.html of the app.


    introWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'src/html/start.html'),
            protocol: 'file:',
            slashes: true
        }))

    // Emitted when the window is closed.
    introWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        introWindow = null
    })
}

function createMainWindow(arg) {
    const htmlPath = path.join('file://', __dirname, 'src/html/index.html?room=' + arg.room + "&nick=" + arg.nick)
    win = new BrowserWindow({
           width: 800,
           height: 700,
           title: "Glaze"
       })
    win.on('closed', function () {
         win = null;
    })

   win.loadURL(htmlPath)
   win.show()

win.webContents.on('dom-ready', () => {


   autoUpdater.on('update-available', (ev, info) => {
       win.webContents.send('message', "Update Available")

   })
   autoUpdater.on('download-progress', (ev, progressObj) => {
       win.webContents.send('message', "Download in progress")
   })
   autoUpdater.on('update-downloaded', (ev, info) => {
     win.webContents.send('message', 'Update downloaded.  Will quit and install in 5 seconds.');
     // Wait 5 seconds, then quit and install
     setTimeout(function() {
       autoUpdater.quitAndInstall();
     }, 5000)
   })
   // Wait a second for the window to exist before checking for updates.
   setTimeout(function() {
     autoUpdater.checkForUpdates()
 }, 3000);
})


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
        createWindow()

})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = true
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (introWindow === null && win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.on('browser-window-created', function() {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = false
})



ipc.on('close-starter', function(event, arg) {
    createMainWindow(arg);
})





function sendStatus(text) {
  log.info(text);
  win.webContents.on('dom-ready', () => {
      win.webContents.send('message', text);

  })
}

function getWindow(windowName) {
  for (var i = 0; i < windowArray.length; i++) {
    if (windowArray[i].name == windowName) {
      return windowArray[i].window;
    }
  }
  return null;
}
