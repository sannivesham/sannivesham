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

  // Provide clean Chrome User-Agent without Electron tokens to prevent Google 403 disallowed_useragent
  const rawUA = mainWindow.webContents.getUserAgent();
  const cleanUA = rawUA.replace(/Electron\/[0-9\.]+\s?/g, '').replace(/sannivesham-desktop\/[0-9\.]+\s?/g, '').replace(/Sannivesham\/[0-9\.]+\s?/g, '');
  mainWindow.webContents.setUserAgent(cleanUA);
  app.userAgentFallback = cleanUA;

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

  // Allow Google OAuth & Firebase Auth popups; open general external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isAuthUrl = url.startsWith('https://accounts.google.com') ||
                      url.startsWith('https://sannivesham-b4231.firebaseapp.com') ||
                      url.startsWith('https://apis.google.com') ||
                      url.startsWith('https://ssl.gstatic.com') ||
                      url.startsWith('https://www.gstatic.com');

    if (isAuthUrl || url.startsWith('https://sannivesham.com') || url.startsWith('http://localhost')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          backgroundColor: '#0d0603',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
          }
        }
      };
    }

    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isAuthUrl = url.startsWith('https://accounts.google.com') ||
                      url.startsWith('https://sannivesham-b4231.firebaseapp.com') ||
                      url.startsWith('https://apis.google.com');

    if (!url.startsWith('https://sannivesham.com') && !url.startsWith('file://') && !isAuthUrl) {
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

// Ensure any child popup windows (like Google Auth popups) inherit the clean user agent
app.on('web-contents-created', (event, contents) => {
  if (app.userAgentFallback) {
    contents.setUserAgent(app.userAgentFallback);
  }
});

