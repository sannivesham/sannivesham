const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

const LIVE_URL = 'https://sannivesham.com/';
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 640,
    title: 'సన్నివేశం - Sannivesham',
    icon: path.join(__dirname, 'icon.ico'),
    backgroundColor: '#0d0603',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false // Keep devotional audio/chanting playing smoothly even if minimized
    }
  });

  // Load the live website so any site updates reflect immediately!
  mainWindow.loadURL(LIVE_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Offline or network error handling
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // If main frame fails to load due to no internet
    if (errorCode !== -3) { // -3 is ABORTED
      console.log('Failed to load live website:', errorCode, errorDescription);
      mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    }
  });

  // Open external links (e.g. YouTube, Instagram, WhatsApp) in the system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://sannivesham.com') && !url.startsWith('http://localhost')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://sannivesham.com') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Set up a clean desktop application menu
  const menuTemplate = [
    {
      label: 'సన్నివేశం',
      submenu: [
        { label: 'ప్రారంభం (Home)', click: () => mainWindow.loadURL(LIVE_URL) },
        { label: 'గ్రంథాలయం (Library)', click: () => mainWindow.loadURL(LIVE_URL + 'library/') },
        { label: 'క్యాలెండర్ (Panchangam)', click: () => mainWindow.loadURL(LIVE_URL + 'calendar/') },
        { type: 'separator' },
        { label: 'నిష్క్రమించు (Exit)', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'వీక్షణ (View)',
      submenu: [
        { label: 'తిరిగి లోడ్ చేయండి (Reload)', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'హార్డ్ రీఫ్రెష్ (Force Reload)', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'వెనుకకు (Back)', accelerator: 'Alt+Left', click: () => { if (mainWindow.webContents.canGoBack()) mainWindow.webContents.goBack(); } },
        { label: 'ముందుకు (Forward)', accelerator: 'Alt+Right', click: () => { if (mainWindow.webContents.canGoForward()) mainWindow.webContents.goForward(); } },
        { type: 'separator' },
        { label: 'పూర్తి స్క్రీన్ (Toggle Full Screen)', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock - prevent multiple windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
