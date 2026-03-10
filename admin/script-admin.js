// Simple keys for localStorage
const LS_KEYS = {
  sponsors: "cbbcSponsors",
  backgrounds: "cbbcBackgrounds",
  logo: "cbbcLogo",
  theme: "cbbcTheme",
  contentTheme: "cbbcContentTheme",
  scoring: "cbbcScoring",
  teams: "cbbcTeams",
  results: "cbbcResults",
  displayStyle: "cbbcDisplayStyle"
};

const API_BASE = "http://localhost:3000";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupThemes();
  setupPreview();
  setupSponsors();
  setupBackgrounds();
  setupLogo();
  setupScoring();
  setupDisplayStyle();
  setupStats();
  setupReset();
});

/* NAVIGATION */

function setupNavigation() {
  const buttons = document.querySelectorAll(".sidebar-nav button");
  const panels = document.querySelectorAll(".panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const panelId = btn.getAttribute("data-panel");

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      panels.forEach((p) => {
        p.classList.toggle("active", p.id === `panel-${panelId}`);
      });
    });
  });
}

/* THEMES */

function applyTheme() {
  const theme = localStorage.getItem(LS_KEYS.theme) || "dark";
  const contentTheme = localStorage.getItem(LS_KEYS.contentTheme) || "light";

  document.body.classList.remove(
    "theme-dark",
    "theme-accent-blue",
    "theme-accent-green",
    "theme-accent-dual"
  );
  document.body.classList.add(`theme-${theme}`);

  document.body.classList.remove("content-light", "content-dark");
  document.body.classList.add(`content-${contentTheme}`);

  // Sync radio buttons
  const themeRadio = document.querySelector(
    `input[name="themeSelect"][value="${theme}"]`
  );
  if (themeRadio) themeRadio.checked = true;

  const contentRadio = document.querySelector(
    `input[name="contentTheme"][value="${contentTheme}"]`
  );
  if (contentRadio) contentRadio.checked = true;
}

function setupThemes() {
  // Default values if not set
  if (!localStorage.getItem(LS_KEYS.theme)) {
    localStorage.setItem(LS_KEYS.theme, "dark");
  }
  if (!localStorage.getItem(LS_KEYS.contentTheme)) {
    localStorage.setItem(LS_KEYS.contentTheme, "light");
  }

  applyTheme();

  document.querySelectorAll('input[name="themeSelect"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      localStorage.setItem(LS_KEYS.theme, e.target.value);
      applyTheme();
    });
  });

  document.querySelectorAll('input[name="contentTheme"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      localStorage.setItem(LS_KEYS.contentTheme, e.target.value);
      applyTheme();
    });
  });
}

/* PREVIEW */

let previewIntervalId = null;

function setupPreview() {
  const frame = document.getElementById("previewFrame");
  const wrapper = document.getElementById("previewFrameWrapper");
  const container = document.getElementById("previewContainer");
  const refreshBtn = document.getElementById("previewRefreshBtn");

  function refreshPreview() {
    if (!frame) return;
    const base = "../display/display.html";
    const url = `${base}?ts=${Date.now()}`;
    frame.src = url;
  }

  function resizePreview() {
    if (!container || !wrapper) return;
    const containerWidth = container.clientWidth;
    const scale = containerWidth / 1920;
    wrapper.style.transform = `scale(${scale})`;
  }

  window.addEventListener("resize", resizePreview);
  resizePreview();

  refreshBtn.addEventListener("click", () => {
    refreshPreview();
  });

  // Auto-refresh every 15 seconds
  if (previewIntervalId) clearInterval(previewIntervalId);
  previewIntervalId = setInterval(refreshPreview, 15000);
}

/* SPONSORS */

function setupSponsors() {
  const uploadInput = document.getElementById("sponsorUploadInput");
  const uploadBtn = document.getElementById("sponsorUploadBtn");
  const listEl = document.getElementById("sponsorList");

  function renderSponsors() {
    const sponsors = loadJSON(LS_KEYS.sponsors, []);
    listEl.innerHTML = "";

    sponsors.forEach((sponsor, index) => {
      const item = document.createElement("div");
      item.className = "thumb-item";

      const img = document.createElement("img");
      img.src = `${API_BASE}${sponsor.url}`;
      img.alt = sponsor.name || `Sponsor ${index + 1}`;

      const meta = document.createElement("div");
      meta.className = "thumb-meta";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = sponsor.name || sponsor.filename;

      const pathSpan = document.createElement("span");
      pathSpan.textContent = sponsor.filename;
      pathSpan.style.fontSize = "11px";
      pathSpan.style.color = "var(--muted)";

      meta.appendChild(nameSpan);
      meta.appendChild(pathSpan);

      const actions = document.createElement("div");
      actions.className = "thumb-actions";

      const visibleLabel = document.createElement("label");
      const visibleCheckbox = document.createElement("input");
      visibleCheckbox.type = "checkbox";
      visibleCheckbox.checked = !!sponsor.active;
      visibleCheckbox.addEventListener("change", () => {
        const sponsors = loadJSON(LS_KEYS.sponsors, []);
        sponsors[index].active = visibleCheckbox.checked;
        saveJSON(LS_KEYS.sponsors, sponsors);
        updateStats();
      });
      visibleLabel.appendChild(visibleCheckbox);
      visibleLabel.appendChild(document.createTextNode("Visible"));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        const sponsors = loadJSON(LS_KEYS.sponsors, []);
        sponsors.splice(index, 1);
        saveJSON(LS_KEYS.sponsors, sponsors);
        renderSponsors();
        updateStats();
      });

      actions.appendChild(visibleLabel);
      actions.appendChild(deleteBtn);

      item.appendChild(img);
      item.appendChild(meta);
      item.appendChild(actions);

      listEl.appendChild(item);
    });
  }

  uploadBtn.addEventListener("click", async () => {
    if (!uploadInput.files || !uploadInput.files[0]) return;
    const file = uploadInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/sponsor`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const sponsors = loadJSON(LS_KEYS.sponsors, []);
      sponsors.push({
        filename: data.filename,
        url: data.url,
        active: true,
        name: data.filename
      });
      saveJSON(LS_KEYS.sponsors, sponsors);
      uploadInput.value = "";
      renderSponsors();
      updateStats();
    } catch (err) {
      console.error("Sponsor upload error", err);
      alert("Sponsor upload failed.");
    }
  });

  renderSponsors();
}

/* BACKGROUNDS */

function setupBackgrounds() {
  const uploadInput = document.getElementById("backgroundUploadInput");
  const uploadBtn = document.getElementById("backgroundUploadBtn");
  const gridEl = document.getElementById("backgroundGrid");

  function renderBackgrounds() {
    const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
    gridEl.innerHTML = "";

    backgrounds.forEach((bg, index) => {
      const item = document.createElement("div");
      item.className = "bg-item";

      const img = document.createElement("img");
      img.src = `${API_BASE}${bg.url}`;
      img.alt = bg.filename;

      const footer = document.createElement("div");
      footer.className = "bg-item-footer";

      const visibleLabel = document.createElement("label");
      const visibleCheckbox = document.createElement("input");
      visibleCheckbox.type = "checkbox";
      visibleCheckbox.checked = !!bg.active;
      visibleCheckbox.addEventListener("change", () => {
        const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
        backgrounds[index].active = visibleCheckbox.checked;
        saveJSON(LS_KEYS.backgrounds, backgrounds);
        updateStats();
      });
      visibleLabel.appendChild(visibleCheckbox);
      visibleLabel.appendChild(document.createTextNode("Use"));

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
        backgrounds.splice(index, 1);
        saveJSON(LS_KEYS.backgrounds, backgrounds);
        renderBackgrounds();
        updateStats();
      });

      footer.appendChild(visibleLabel);
      footer.appendChild(deleteBtn);

      item.appendChild(img);
      item.appendChild(footer);

      gridEl.appendChild(item);
    });
  }

  uploadBtn.addEventListener("click", async () => {
    if (!uploadInput.files || !uploadInput.files[0]) return;
    const file = uploadInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/background`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
      backgrounds.push({
        filename: data.filename,
        url: data.url,
        active: true
      });
      saveJSON(LS_KEYS.backgrounds, backgrounds);
      uploadInput.value = "";
      renderBackgrounds();
      updateStats();
    } catch (err) {
      console.error("Background upload error", err);
      alert("Background upload failed.");
    }
  });

  renderBackgrounds();
}

/* LOGO */

function setupLogo() {
  const uploadInput = document.getElementById("logoUploadInput");
  const uploadBtn = document.getElementById("logoUploadBtn");
  const logoImg = document.getElementById("logoPreview");

  function renderLogo() {
    const logo = loadJSON(LS_KEYS.logo, null);
    if (logo && logo.url) {
      logoImg.src = `${API_BASE}${logo.url}`;
      logoImg.style.display = "block";
    } else {
      logoImg.style.display = "none";
    }
  }

  uploadBtn.addEventListener("click", async () => {
    if (!uploadInput.files || !uploadInput.files[0]) return;
    const file = uploadInput.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/logo`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const logo = {
        filename: data.filename,
        url: data.url
      };
      saveJSON(LS_KEYS.logo, logo);
      uploadInput.value = "";
      renderLogo();
    } catch (err) {
      console.error("Logo upload error", err);
      alert("Logo upload failed.");
    }
  });

  renderLogo();
}

/* SCORING */

function setupScoring() {
  const winInput = document.getElementById("pointsWin");
  const drawInput = document.getElementById("pointsDraw");
  const lossInput = document.getElementById("pointsLoss");
  const percCheckbox = document.getElementById("usePercentageTiebreak");
  const autoCheckbox = document.getElementById("autoDetermineWinner");
  const saveBtn = document.getElementById("saveScoringBtn");

  const scoring = loadJSON(LS_KEYS.scoring, {
    win: 4,
    draw: 2,
    loss: 0,
    usePercentage: true,
    autoWinner: true
  });

  winInput.value = scoring.win;
  drawInput.value = scoring.draw;
  lossInput.value = scoring.loss;
  percCheckbox.checked = scoring.usePercentage;
  autoCheckbox.checked = scoring.autoWinner;

  saveBtn.addEventListener("click", () => {
    const newScoring = {
      win: Number(winInput.value) || 0,
      draw: Number(drawInput.value) || 0,
      loss: Number(lossInput.value) || 0,
      usePercentage: percCheckbox.checked,
      autoWinner: autoCheckbox.checked
    };
    saveJSON(LS_KEYS.scoring, newScoring);
    alert("Scoring settings saved.");
  });
}

/* DISPLAY STYLE */

function setupDisplayStyle() {
  const defaultStyle = "sport";
  if (!localStorage.getItem(LS_KEYS.displayStyle)) {
    localStorage.setItem(LS_KEYS.displayStyle, defaultStyle);
  }

  const current = localStorage.getItem(LS_KEYS.displayStyle) || defaultStyle;

  const radios = document.querySelectorAll('input[name="displayStyle"]');
  radios.forEach((radio) => {
    if (radio.value === current) {
      radio.checked = true;
    }
    radio.addEventListener("change", (e) => {
      localStorage.setItem(LS_KEYS.displayStyle, e.target.value);
    });
  });
}

/* STATS */

function setupStats() {
  updateStats();
}

function updateStats() {
  const teams = loadJSON(LS_KEYS.teams, []);
  const results = loadJSON(LS_KEYS.results, []);
  const sponsors = loadJSON(LS_KEYS.sponsors, []);
  const backgrounds = loadJSON(LS_KEYS.backgrounds, []);

  const statTeams = document.getElementById("statTeams");
  const statResults = document.getElementById("statResults");
  const statSponsors = document.getElementById("statSponsors");
  const statBackgrounds = document.getElementById("statBackgrounds");

  if (statTeams) statTeams.textContent = teams.length;
  if (statResults) statResults.textContent = results.length;
  if (statSponsors)
    statSponsors.textContent = sponsors.filter((s) => s.active).length;
  if (statBackgrounds)
    statBackgrounds.textContent = backgrounds.filter((b) => b.active).length;
}

/* RESET */

function setupReset() {
  const btn = document.getElementById("resetEventBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const ok = confirm(
      "This will clear local event data (teams/results/sponsors/backgrounds). Continue?"
    );
    if (!ok) return;

    localStorage.removeItem(LS_KEYS.teams);
    localStorage.removeItem(LS_KEYS.results);
    localStorage.removeItem(LS_KEYS.sponsors);
    localStorage.removeItem(LS_KEYS.backgrounds);

    updateStats();
    alert("Event data cleared (localStorage).");
  });
}
