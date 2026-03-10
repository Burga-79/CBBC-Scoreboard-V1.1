const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

// Start Express server (uploads + images)
require("./server");

let adminWindow;
let displayWindow;

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

app.whenReady().then(() => {
  createWindows();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
