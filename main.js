const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;

// Prevent double-launch
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

function startServer() {
  const serverPath = path.join(process.resourcesPath, "server.js");
  console.log("Requiring server from:", serverPath);
  require(serverPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile("admin/admin.html");
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
