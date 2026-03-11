const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

// Prevent double-launch
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

function startServer() {
  const unpacked = path.join(process.resourcesPath, "app.asar.unpacked");
  const serverPath = path.join(unpacked, "server.js");

  console.log("DEBUG: process.resourcesPath =", process.resourcesPath);
  console.log("DEBUG: unpacked =", unpacked);
  console.log("DEBUG: serverPath =", serverPath);

  try {
    if (!fs.existsSync(serverPath)) {
      console.error("DEBUG: server.js NOT FOUND at:", serverPath);
      return;
    }

    require(serverPath);
    console.log("DEBUG: server.js loaded successfully");
  } catch (err) {
    console.error("DEBUG: server.js failed to load:", err);
  }
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
