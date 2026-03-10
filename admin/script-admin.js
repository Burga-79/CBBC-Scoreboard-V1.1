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
  displayStyle: "cbbcDisplayStyle",
  sponsorSpeed: "cbbcSponsorSpeed"
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
  setupTeams();
  setupResults();
  setupSponsors();
  setupBackgrounds();
  setupLogo();
  setupScoring();
  setupDisplayStyle();
  setupSponsorSpeed();
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

  if (previewIntervalId) clearInterval(previewIntervalId);
  previewIntervalId = setInterval(refreshPreview, 15000);
}

/* TEAMS */

function setupTeams() {
  const nameInput = document.getElementById("teamNameInput");
  const addBtn = document.getElementById("addTeamBtn");
  const tableBody = document.getElementById("teamsTableBody");
  const sortSelect = document.getElementById("teamsSortSelect");

  function getTeams() {
    return loadJSON(LS_KEYS.teams, []);
  }

  function setTeams(teams) {
    saveJSON(LS_KEYS.teams, teams);
    updateStats();
    refreshResultsTeamDropdowns();
  }

  function parseLeadingNumber(name) {
    const match = name.match(/^(\d+)/);
    if (!match) return null;
    return Number(match[1]);
  }

  function getSortedTeams(teams) {
    const mode = sortSelect.value || "none";
    if (mode === "none") return teams.slice();

    const copy = teams.slice();

    if (mode === "az" || mode === "za") {
      copy.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      if (mode === "za") copy.reverse();
      return copy;
    }

    if (mode === "numAsc" || mode === "numDesc") {
      copy.sort((a, b) => {
        const na = parseLeadingNumber(a);
        const nb = parseLeadingNumber(b);

        if (na == null && nb == null) {
          return a.localeCompare(b, undefined, { sensitivity: "base" });
        }
        if (na == null) return 1;
        if (nb == null) return -1;
        return na - nb;
      });
      if (mode === "numDesc") copy.reverse();
      return copy;
    }

    return teams.slice();
  }

  function renderTeams() {
    const teams = getTeams();
    const sorted = getSortedTeams(teams);
    tableBody.innerHTML = "";

    sorted.forEach((teamName, index) => {
      const tr = document.createElement("tr");

      const idxTd = document.createElement("td");
      idxTd.textContent = index + 1;

      const nameTd = document.createElement("td");
      nameTd.textContent = teamName;

      const actionsTd = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "primary";
      editBtn.textContent = "Edit";
      editBtn.style.marginRight = "4px";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Delete";

      editBtn.addEventListener("click", () => {
        const newName = prompt("Edit team name / skipper:", teamName);
        if (!newName) return;
        const allTeams = getTeams();
        const originalIndex = allTeams.indexOf(teamName);
        if (originalIndex >= 0) {
          allTeams[originalIndex] = newName.trim();
          setTeams(allTeams);
          renderTeams();
        }
      });

      deleteBtn.addEventListener("click", () => {
        const ok = confirm(`Delete team "${teamName}"?`);
        if (!ok) return;
        const allTeams = getTeams().filter((t) => t !== teamName);
        setTeams(allTeams);
        renderTeams();
      });

      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);

      tr.appendChild(idxTd);
      tr.appendChild(nameTd);
      tr.appendChild(actionsTd);

      tableBody.appendChild(tr);
    });
  }

  addBtn.addEventListener("click", () => {
    const value = (nameInput.value || "").trim();
    if (!value) return;
    const teams = getTeams();
    teams.push(value);
    setTeams(teams);
    nameInput.value = "";
    sortSelect.value = "none";
    renderTeams();
  });

  sortSelect.addEventListener("change", () => {
    renderTeams();
  });

  renderTeams();
}

/* RESULTS */

function setupResults() {
  const roundInput = document.getElementById("resultRoundInput");
  const sheetInput = document.getElementById("resultSheetInput");
  const team1Select = document.getElementById("resultTeam1Select");
  const team2Select = document.getElementById("resultTeam2Select");
  const shots1Input = document.getElementById("resultShots1Input");
  const shots2Input = document.getElementById("resultShots2Input");
  const addBtn = document.getElementById("addResultBtn");
  const tableBody = document.getElementById("resultsTableBody");

  function getTeams() {
    return loadJSON(LS_KEYS.teams, []);
  }

  function getResults() {
    return loadJSON(LS_KEYS.results, []);
  }

  function setResults(results) {
    saveJSON(LS_KEYS.results, results);
    updateStats();
  }

  function getScoring() {
    return loadJSON(LS_KEYS.scoring, {
      win: 4,
      draw: 2,
      loss: 0,
      usePercentage: true,
      autoWinner: true
    });
  }

  function refreshTeamDropdowns() {
    const teams = getTeams();
    [team1Select, team2Select].forEach((select) => {
      select.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select team --";
      select.appendChild(placeholder);

      teams.forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
      });
    });
  }

  window.refreshResultsTeamDropdowns = refreshTeamDropdowns;

  function computeResultOutcome(shots1, shots2, scoring) {
    if (!scoring.autoWinner) return null;
    if (shots1 > shots2) return "team1";
    if (shots2 > shots1) return "team2";
    return "draw";
  }

  function renderResults() {
    const results = getResults();
    const sorted = results
      .slice()
      .sort(
        (a, b) =>
          (b.round || 0) - (a.round || 0) ||
          (b.timestamp || 0) - (a.timestamp || 0)
      );

    tableBody.innerHTML = "";

    sorted.forEach((r) => {
      const tr = document.createElement("tr");

      const roundTd = document.createElement("td");
      roundTd.textContent = r.round || "";

      const team1Td = document.createElement("td");
      team1Td.textContent = r.team1;

      const scoreTd = document.createElement("td");
      scoreTd.textContent = `${r.shots1} - ${r.shots2}`;

      const team2Td = document.createElement("td");
      team2Td.textContent = r.team2;

      const sheetTd = document.createElement("td");
      sheetTd.textContent = r.sheet || "";

      const actionsTd = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "primary";
      editBtn.textContent = "Edit";
      editBtn.style.marginRight = "4px";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "danger";
      deleteBtn.textContent = "Delete";

      editBtn.addEventListener("click", () => {
        const newRound = prompt("Round:", r.round ?? "");
        if (newRound === null) return;

        const newSheet = prompt("Sheet / Rink:", r.sheet ?? "");
        if (newSheet === null) return;

        const newShots1 = prompt("Shots (Team 1):", r.shots1);
        if (newShots1 === null) return;

        const newShots2 = prompt("Shots (Team 2):", r.shots2);
        if (newShots2 === null) return;

        const roundVal = Number(newRound) || 0;
        const s1 = Number(newShots1);
        const s2 = Number(newShots2);
        if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
          alert("Invalid scores.");
          return;
        }

        const scoring = getScoring();
        const outcome = computeResultOutcome(s1, s2, scoring);

        const all = getResults();
        const originalIndex = all.findIndex(
          (x) =>
            x.team1 === r.team1 &&
            x.team2 === r.team2 &&
            x.timestamp === r.timestamp
        );
        if (originalIndex >= 0) {
          all[originalIndex] = {
            ...all[originalIndex],
            round: roundVal,
            sheet: newSheet || "",
            shots1: s1,
            shots2: s2,
            result: outcome ?? all[originalIndex].result
          };
          setResults(all);
          renderResults();
        }
      });

      deleteBtn.addEventListener("click", () => {
        const ok = confirm(
          `Delete result: ${r.team1} ${r.shots1} - ${r.shots2} ${r.team2}?`
        );
        if (!ok) return;
        const all = getResults().filter(
          (x) =>
            !(
              x.team1 === r.team1 &&
              x.team2 === r.team2 &&
              x.shots1 === r.shots1 &&
              x.shots2 === r.shots2 &&
              x.round === r.round &&
              x.sheet === r.sheet &&
              x.timestamp === r.timestamp
            )
        );
        setResults(all);
        renderResults();
      });

      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);

      tr.appendChild(roundTd);
      tr.appendChild(team1Td);
      tr.appendChild(scoreTd);
      tr.appendChild(team2Td);
      tr.appendChild(sheetTd);
      tr.appendChild(actionsTd);

      tableBody.appendChild(tr);
    });
  }

  addBtn.addEventListener("click", () => {
    const roundVal = Number(roundInput.value) || 0;
    const sheetVal = (sheetInput.value || "").trim();
    const team1 = team1Select.value;
    const team2 = team2Select.value;
    const s1 = Number(shots1Input.value);
    const s2 = Number(shots2Input.value);

    if (!team1 || !team2) {
      alert("Please select both teams.");
      return;
    }
    if (team1 === team2) {
      alert("Team 1 and Team 2 must be different.");
      return;
    }
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      alert("Please enter valid non-negative scores.");
      return;
    }

    const scoring = getScoring();
    const outcome = computeResultOutcome(s1, s2, scoring);

    const results = getResults();
    results.push({
      team1,
      team2,
      shots1: s1,
      shots2: s2,
      round: roundVal,
      sheet: sheetVal,
      timestamp: Date.now(),
      result: outcome
    });
    setResults(results);

    shots1Input.value = "";
    shots2Input.value = "";
    sheetInput.value = "";

    renderResults();
  });

  refreshTeamDropdowns();
  renderResults();
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
      img.alt = sponsor.name || sponsor.filename;

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
        const file = uploadInput.files[0];
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/sponsor`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data || !data.url) {
        alert("Upload failed.");
        return;
      }

      const sponsors = loadJSON(LS_KEYS.sponsors, []);
      sponsors.push({
        url: data.url,
        filename: data.filename,
        name: file.name,
        active: true
      });

      saveJSON(LS_KEYS.sponsors, sponsors);
      uploadInput.value = "";
      renderSponsors();
      updateStats();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    }
  });

  renderSponsors();
}

/* BACKGROUNDS */

function setupBackgrounds() {
  const uploadInput = document.getElementById("backgroundUploadInput");
  const uploadBtn = document.getElementById("backgroundUploadBtn");
  const listEl = document.getElementById("backgroundList");

  function renderBackgrounds() {
    const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
    listEl.innerHTML = "";

    backgrounds.forEach((bg, index) => {
      const item = document.createElement("div");
      item.className = "thumb-item";

      const img = document.createElement("img");
      img.src = `${API_BASE}${bg.url}`;
      img.alt = bg.filename;

      const meta = document.createElement("div");
      meta.className = "thumb-meta";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = bg.filename;

      meta.appendChild(nameSpan);

      const actions = document.createElement("div");
      actions.className = "thumb-actions";

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
      visibleLabel.appendChild(document.createTextNode("Visible"));

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

      actions.appendChild(visibleLabel);
      actions.appendChild(deleteBtn);

      item.appendChild(img);
      item.appendChild(meta);
      item.appendChild(actions);

      listEl.appendChild(item);
    });
  }

  uploadBtn.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/background`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data || !data.url) {
        alert("Upload failed.");
        return;
      }

      const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
      backgrounds.push({
        url: data.url,
        filename: data.filename,
        active: true
      });

      saveJSON(LS_KEYS.backgrounds, backgrounds);
      uploadInput.value = "";
      renderBackgrounds();
      updateStats();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    }
  });

  renderBackgrounds();
}

/* CLUB LOGO */

function setupLogo() {
  const uploadInput = document.getElementById("logoUploadInput");
  const uploadBtn = document.getElementById("logoUploadBtn");
  const preview = document.getElementById("logoPreview");

  function renderLogo() {
    const logo = loadJSON(LS_KEYS.logo, null);
    if (logo && logo.url) {
      preview.src = `${API_BASE}${logo.url}`;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  }

  uploadBtn.addEventListener("click", async () => {
    const file = uploadInput.files[0];
    if (!file) {
      alert("Please select a logo image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/logo`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data || !data.url) {
        alert("Upload failed.");
        return;
      }

      saveJSON(LS_KEYS.logo, {
        url: data.url,
        filename: data.filename
      });

      uploadInput.value = "";
      renderLogo();
      updateStats();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    }
  });

  renderLogo();
}

/* SCORING SETTINGS */

function setupScoring() {
  const winInput = document.getElementById("scoringWinInput");
  const drawInput = document.getElementById("scoringDrawInput");
  const lossInput = document.getElementById("scoringLossInput");
  const usePctCheckbox = document.getElementById("scoringUsePct");
  const autoWinnerCheckbox = document.getElementById("scoringAutoWinner");
  const saveBtn = document.getElementById("saveScoringBtn");

  function loadScoring() {
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
    usePctCheckbox.checked = scoring.usePercentage;
    autoWinnerCheckbox.checked = scoring.autoWinner;
  }

  saveBtn.addEventListener("click", () => {
    const win = Number(winInput.value);
    const draw = Number(drawInput.value);
    const loss = Number(lossInput.value);

    if ([win, draw, loss].some((v) => isNaN(v) || v < 0)) {
      alert("Invalid scoring values.");
      return;
    }

    const scoring = {
      win,
      draw,
      loss,
      usePercentage: usePctCheckbox.checked,
      autoWinner: autoWinnerCheckbox.checked
    };

    saveJSON(LS_KEYS.scoring, scoring);
    alert("Scoring settings saved.");
  });

  loadScoring();
}

/* DISPLAY STYLE */

function setupDisplayStyle() {
  const styleRadios = document.querySelectorAll('input[name="displayStyle"]');

  function applyDisplayStyle() {
    const style = localStorage.getItem(LS_KEYS.displayStyle) || "default";
    const radio = document.querySelector(
      `input[name="displayStyle"][value="${style}"]`
    );
    if (radio) radio.checked = true;
  }

  styleRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      localStorage.setItem(LS_KEYS.displayStyle, e.target.value);
      alert("Display style saved. Refresh the display to apply.");
    });
  });

  applyDisplayStyle();
}

/* SPONSOR SPEED */

function setupSponsorSpeed() {
  const speedRadios = document.querySelectorAll('input[name="sponsorSpeed"]');

  function applySpeed() {
    const speed = localStorage.getItem(LS_KEYS.sponsorSpeed) || "slow";
    const radio = document.querySelector(
      `input[name="sponsorSpeed"][value="${speed}"]`
    );
    if (radio) radio.checked = true;
  }

  speedRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      localStorage.setItem(LS_KEYS.sponsorSpeed, e.target.value);
      alert("Sponsor scroll speed saved.");
    });
  });

  applySpeed();
}

/* STATS */

function setupStats() {
  const teamsCountEl = document.getElementById("statTeams");
  const resultsCountEl = document.getElementById("statResults");

  window.updateStats = function () {
    const teams = loadJSON(LS_KEYS.teams, []);
    const results = loadJSON(LS_KEYS.results, []);

    if (teamsCountEl) teamsCountEl.textContent = teams.length;
    if (resultsCountEl) resultsCountEl.textContent = results.length;
  };

  updateStats();
}

/* RESET EVENT */

function setupReset() {
  const resetBtn = document.getElementById("resetEventBtn");

  resetBtn.addEventListener("click", () => {
    const ok = confirm(
      "This will clear ALL teams and ALL results.\nSponsors, backgrounds, logo, and settings will remain.\n\nAre you sure?"
    );
    if (!ok) return;

    saveJSON(LS_KEYS.teams, []);
    saveJSON(LS_KEYS.results, []);

    updateStats();

    if (typeof refreshResultsTeamDropdowns === "function") {
      refreshResultsTeamDropdowns();
    }

    alert("Event data cleared (teams and results).");
  });
}
