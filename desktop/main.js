const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;
const ipc = require('electron').ipcMain

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let recordFlag = false;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1600,
    height: 1200,
    //webPreferences: {partition: 'persist:example'}
  });

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  const ses = win.webContents.session;
  //const ses = electron.session.fromPartition('persist:name');
  ses.cookies.get({}, (error, cookies) => {
    console.log(cookies);
  });
  // Open the DevTools.
  //win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

ipc.on('asynchronous-message', function (event, arg) {
  recordFlag = !recordFlag;
  event.sender.send('asynchronous-reply', recordFlag);
});
