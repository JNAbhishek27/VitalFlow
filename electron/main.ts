import 'dotenv/config';
import path from 'node:path';
import { app, BrowserWindow, ipcMain, session } from 'electron';
import { bindSmartSpectraIpc, SmartSpectraSDK } from '@smartspectra/node-sdk/main';

let mainWindow: BrowserWindow | null = null;
let sessionApiKey: string | null = null;
let cameraConsentGranted = false;

function resolveActiveApiKey(): string | null {
  const envKey = process.env.SMARTSPECTRA_API_KEY?.trim();
  if (envKey && envKey !== 'YOUR_PRESAGE_SMARTSPECTRA_API_KEY') {
    return envKey;
  }
  return sessionApiKey?.trim() || null;
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#050814',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'VITALFLOW',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Official Presage SmartSpectra Electron IPC bridge
  bindSmartSpectraIpc(mainWindow, {
    logger: (level, msg) => {
      if (level === 'error') console.error(`[VITALFLOW/SmartSpectra] ${msg}`);
      else if (level === 'warn') console.warn(`[VITALFLOW/SmartSpectra] ${msg}`);
      else if (process.env.SMARTSPECTRA_DIAGNOSTICS === '1') {
        console.log(`[VITALFLOW/SmartSpectra] ${msg}`);
      }
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    cameraConsentGranted = false;
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Enforce explicit user consent before granting camera media permission
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(cameraConsentGranted);
      return;
    }
    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'media') {
      return cameraConsentGranted;
    }
    return false;
  });

  ipcMain.handle('vitalflow:get-runtime-info', () => {
    const envKey = process.env.SMARTSPECTRA_API_KEY?.trim();
    const hasEnvApiKey = Boolean(envKey && envKey !== 'YOUR_PRESAGE_SMARTSPECTRA_API_KEY');
    return {
      isElectron: true,
      hasEnvApiKey,
      hasSessionApiKey: Boolean(sessionApiKey),
      hasActiveApiKey: Boolean(resolveActiveApiKey()),
      cameraConsentGranted,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      sdkVersion: SmartSpectraSDK.version,
    };
  });

  ipcMain.handle('vitalflow:authorize-camera', (_event, granted: boolean) => {
    cameraConsentGranted = Boolean(granted);
    return cameraConsentGranted;
  });

  ipcMain.handle('vitalflow:set-session-api-key', (_event, key: string) => {
    if (typeof key !== 'string') {
      sessionApiKey = null;
      return false;
    }
    const trimmed = key.trim();
    sessionApiKey = trimmed.length > 0 ? trimmed : null;
    return Boolean(sessionApiKey);
  });

  ipcMain.handle('vitalflow:clear-session-api-key', () => {
    sessionApiKey = null;
    return true;
  });

  ipcMain.handle('vitalflow:get-sdk-api-key', (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) {
      return null;
    }
    return resolveActiveApiKey();
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  sessionApiKey = null;
  cameraConsentGranted = false;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
