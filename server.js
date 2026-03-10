const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");
const app = express();

/* -------------------------------------------------------
   RESOURCES PATH (PACKAGED OR DEV)
------------------------------------------------------- */
const baseDir = process.resourcesPath || __dirname;

/* -------------------------------------------------------
   IMAGE FOLDERS (OUTSIDE ASAR)
------------------------------------------------------- */
const imagesRoot = path.join(baseDir, "images");
const logoDir = path.join(imagesRoot, "logo");
const sponsorDir = path.join(imagesRoot, "sponsors");
const backgroundDir = path.join(imagesRoot, "backgrounds");

/* -------------------------------------------------------
   ENSURE DIRECTORIES EXIST
------------------------------------------------------- */
function ensureDir(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create directory:", dir, err);
  }
}

ensureDir(imagesRoot);
ensureDir(logoDir);
ensureDir(sponsorDir);
ensureDir(backgroundDir);

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
app
  .listen(3000, () => {
    console.log("Scoreboard server running on port 3000");
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log("Port 3000 already in use — server already running.");
    } else {
      console.error("Server error:", err);
    }
  });
