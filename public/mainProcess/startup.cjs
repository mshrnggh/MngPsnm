const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
let startupWindow = null;
let subConfigWindow = null;

function startUp() {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity');
  app.commandLine.appendSwitch('enable-software-rasterizer');
  startupWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      useAngle:false,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload_startup.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline';"
    },});
    startupWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../render/startup.html'),
    protocol: 'file:',
    slashes: true
  }));
  return startupWindow;
};

function subConfig() {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity');
  app.commandLine.appendSwitch('enable-software-rasterizer');
  subConfigWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      useAngle:false,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload_subconfig.cjs'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' file:; style-src 'self' 'unsafe-inline';"
    },});
    subConfigWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../render/subConfig.html'),
      protocol: 'file:',
      slashes: true
    }));
};
module.exports={startUp,subConfig, getStartupWindow:()=>startupWindow,getSubConfigWindow:()=>subConfigWindow}