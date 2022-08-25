
const path = require('path');
const { app, ipcMain, BrowserWindow } = require('electron');

const Store = require('./store.js');
const LedConnection = require('./ledconnection.js');

const store = new Store({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: { width: 800, height: 600 }
  }
});

var ipcEvent;

LedConnection.scanned = function(ip) {
  ipcEvent.reply('scan-result', { ip: ip });
};

LedConnection.get = function(msg) {
  ipcEvent.reply('get', msg);
};

ipcMain.on('scan', (e, msg) => {
  ipcEvent = e;

  LedConnection.scan(msg.ip);
});

ipcMain.on('set-ip', (e, msg) => {
  ipcEvent = e;

  LedConnection.set_ip(msg.ip);
});

ipcMain.on('set', (e, msg) => LedConnection.set(msg));

function createWindow () {
  let { width, height } = store.get('windowBounds');

  // Create the browser window.
  const win = new BrowserWindow({
    backgroundColor: '#fff',
    width: width,
    height: height,
    favicon: path.join(__dirname, "./src/favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      nodeIntegration: false,
      enableRemoteModule: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.on('resize', () => {
    // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
    // the height, width, and x and y coordinates.
    let { width, height } = win.getBounds();
    // Now that we have them, save them using the `set` method.
    store.set('windowBounds', { width, height });
  });

  // Load the index.html of the app
  // From the dist folder which is created
  // After running the build command
  win.loadFile('dist/site/index.html');

  // Open the DevTools.
  // win.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// This method is equivalent to 'app.on('ready', function())'
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their
  // menu bar to stay active until the user quits
  // explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the
  // app when the dock icon is clicked and there are
  // no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file, you can include the rest of your app's
// specific main process code. You can also put them in
// separate files and require them here.
