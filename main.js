const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let adminWindow;
let displayWindow;
let serverProcess = null;

/* -------------------------------------------------------
   PREVENT MULTIPLE APP INSTANCES
------------------------------------------------------- */
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
  process.exit(0);
}

/* -------------------------------------------------------
   START EXPRESS SERVER (ONLY ONCE)
------------------------------------------------------- */
function startServerPackaged() {
  if (serverProcess) return; // HARD STOP: never start twice

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

  // ADMIN WINDOW
  adminWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Comet Bay – Admin",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  adminWindow.loadFile(path.join(__dirname, "admin", "admin.html"));

  // DISPLAY WINDOW
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
    startServerPackaged();   // server starts ONCE
  } else {
    require("./server.js");  // dev mode
  }

  createWindows();
});

/* -------------------------------------------------------
   SECOND INSTANCE HANDLER
------------------------------------------------------- */
app.on("second-instance", () => {
  // If someone tries to open the app again, DO NOT create windows
  if (adminWindow) {
    adminWindow.focus();
  }
});

/* -------------------------------------------------------
   QUIT HANDLING
------------------------------------------------------- */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
