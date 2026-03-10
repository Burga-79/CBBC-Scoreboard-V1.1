const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let adminWindow;
let displayWindow;
let serverProcess = null;

/* -------------------------------------------------------
   START EXPRESS SERVER
------------------------------------------------------- */
function startServerPackaged() {
  if (serverProcess) return;

  const serverPath = path.join(process.resourcesPath || __dirname, "server.js");

  serverProcess = spawn(process.execPath, [serverPath], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  serverProcess.unref();
}

/* -------------------------------------------------------
   CREATE WINDOWS
------------------------------------------------------- */
function createWindows() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const external = displays.find((d) => d.id !== primary.id);
  const targetDisplay = external || primary;

  adminWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Comet Bay – Admin",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  adminWindow.loadFile(path.join(__dirname, "admin", "admin.html"));

  displayWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.size.width,
    height: targetDisplay.size.height,
    frame: false,
    fullscreen: true,
    title: "Comet Bay – Display",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  displayWindow.loadFile(path.join(__dirname, "display", "display.html"));
}

/* -------------------------------------------------------
   APP READY
------------------------------------------------------- */
app.whenReady().then(() => {
  if (app.isPackaged) {
    startServerPackaged();
  } else {
    require("./server.js");
  }

  createWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

/* -------------------------------------------------------
   QUIT HANDLING
------------------------------------------------------- */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
