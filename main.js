const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

// Prevent double-launch
if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

/* -------------------------------------------------------
   START SERVER (SAFE REQUIRE WITH ERROR LOGGING)
------------------------------------------------------- */
function startServer() {
  const resources = process.resourcesPath;
  const serverPath = path.join(resources, "server.js");

  console.log("DEBUG: process.resourcesPath =", resources);
  console.log("DEBUG: serverPath =", serverPath);

  try {
    if (!require("fs").existsSync(serverPath)) {
      console.error("DEBUG: server.js NOT FOUND at:", serverPath);
      return;
    }

    require(serverPath);
    console.log("DEBUG: server.js loaded successfully");
  } catch (err) {
    console.error("DEBUG: server.js failed to load:", err);
  }
}

/* -------------------------------------------------------
   CREATE MAIN WINDOW
------------------------------------------------------- */
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

/* -------------------------------------------------------
   APP READY
------------------------------------------------------- */
app.whenReady().then(() => {
  startServer();
  createWindow();
});

/* -------------------------------------------------------
   QUIT HANDLING
------------------------------------------------------- */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
