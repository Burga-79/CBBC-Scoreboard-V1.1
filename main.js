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
  const serverPath = path.join(process.resourcesPath, "server.js");
  console.log("Requiring server from:", serverPath);

  try {
    require(serverPath);
    console.log("SERVER: require() completed");
  } catch (err) {
    console.error("SERVER FAILED TO START:", err);
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
