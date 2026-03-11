console.log("SERVER: Starting server.js");

const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");
const app = express();

/* -------------------------------------------------------
   RESOURCES PATH (PACKAGED OR DEV)
------------------------------------------------------- */
const baseDir = process.resourcesPath
  ? path.join(process.resourcesPath)
  : path.join(__dirname);

console.log("SERVER: baseDir =", baseDir);

/* -------------------------------------------------------
   IMAGE FOLDERS (ALWAYS OUTSIDE ASAR)
------------------------------------------------------- */
const imagesRoot = process.resourcesPath
  ? path.join(process.resourcesPath, "images")
  : path.join(__dirname, "images");

const logoDir = path.join(imagesRoot, "logo");
const sponsorDir = path.join(imagesRoot, "sponsors");
const backgroundDir = path.join(imagesRoot, "backgrounds");

console.log("SERVER: imagesRoot =", imagesRoot);

/* -------------------------------------------------------
   ENSURE DIRECTORIES EXIST
------------------------------------------------------- */
function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      console.log("SERVER: Creating directory:", dir);
      fs.mkdirSync(dir, { recursive: true });
    } else {
      console.log("SERVER: Directory exists:", dir);
    }
  } catch (err) {
    console.error("SERVER: Failed to create directory:", dir, err);
  }
}

ensureDir(imagesRoot);
ensureDir(logoDir);
ensureDir(sponsorDir);
ensureDir(backgroundDir);

/* -------------------------------------------------------
   DATA STORAGE (TEAMS + RESULTS)
------------------------------------------------------- */
const dataDir = path.join(baseDir, "data");
ensureDir(dataDir);

const teamsFile = path.join(dataDir, "teams.json");
const resultsFile = path.join(dataDir, "results.json");

console.log("SERVER: teamsFile =", teamsFile);
console.log("SERVER: resultsFile =", resultsFile);

app.get("/data/teams", (req, res) => {
  res.sendFile(teamsFile);
});

app.post("/data/teams", express.json(), (req, res) => {
  fs.writeFileSync(teamsFile, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.get("/data/results", (req, res) => {
  res.sendFile(resultsFile);
});

app.post("/data/results", express.json(), (req, res) => {
  fs.writeFileSync(resultsFile, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

/* -------------------------------------------------------
   STATIC FILES
------------------------------------------------------- */
app.use("/images", express.static(imagesRoot));

/* -------------------------------------------------------
   MULTER STORAGE
------------------------------------------------------- */
function makeStorage(targetDir) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const safeBase = base.replace(/[^a-z0-9_\-]/gi, "_");
      const stamp = Date.now();
      cb(null, `${safeBase}_${stamp}${ext}`);
    }
  });
}

const uploadLogo = multer({ storage: makeStorage(logoDir) });
const uploadSponsor = multer({ storage: makeStorage(sponsorDir) });
const uploadBackground = multer({ storage: makeStorage(backgroundDir) });

/* -------------------------------------------------------
   LOGO UPLOAD
------------------------------------------------------- */
app.post("/upload/logo", uploadLogo.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    filename: req.file.filename,
    url: `/images/logo/${req.file.filename}`
  });
});

/* -------------------------------------------------------
   SPONSOR UPLOAD
------------------------------------------------------- */
app.post("/upload/sponsor", uploadSponsor.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    filename: req.file.filename,
    url: `/images/sponsors/${req.file.filename}`
  });
});

/* -------------------------------------------------------
   BACKGROUND UPLOAD
------------------------------------------------------- */
app.post("/upload/background", uploadBackground.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    filename: req.file.filename,
    url: `/images/backgrounds/${req.file.filename}`
  });
});

/* -------------------------------------------------------
   START SERVER
------------------------------------------------------- */
console.log("SERVER: About to listen on port 3000");

app
  .listen(3000, () => {
    console.log("SERVER: Listening on port 3000");
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log("SERVER: Port 3000 already in use — server already running.");
    } else {
      console.error("SERVER: Server error:", err);
    }
  });
