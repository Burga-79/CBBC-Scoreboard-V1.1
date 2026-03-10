const LS_KEYS = {
  sponsors: "cbbcSponsors",
  backgrounds: "cbbcBackgrounds",
  logo: "cbbcLogo",
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

/* DISPLAY STYLE */

function applyDisplayStyle() {
  const body = document.body;
  const style = localStorage.getItem(LS_KEYS.displayStyle) || "sport";
  body.classList.remove("style-sport", "style-fluent");
  if (style === "fluent") {
    body.classList.add("style-fluent");
  } else {
    body.classList.add("style-sport");
  }
}

/* LADDER */

function computeLadder(teams, results, scoring) {
  const stats = {};
  teams.forEach((t) => {
    stats[t] = {
      team: t,
      gp: 0,
      w: 0,
      d: 0,
      l: 0,
      sf: 0,
      sa: 0,
      sd: 0,
      pct: 0,
      pts: 0
    };
  });

  results.forEach((r) => {
    const t1 = stats[r.team1];
    const t2 = stats[r.team2];
    if (!t1 || !t2) return;

    t1.gp++;
    t2.gp++;
    t1.sf += r.shots1;
    t1.sa += r.shots2;
    t2.sf += r.shots2;
    t2.sa += r.shots1;

    if (r.result === "team1") {
      t1.w++;
      t2.l++;
      t1.pts += scoring.win;
      t2.pts += scoring.loss;
    } else if (r.result === "team2") {
      t2.w++;
      t1.l++;
      t2.pts += scoring.win;
      t1.pts += scoring.loss;
    } else if (r.result === "draw") {
      t1.d++;
      t2.d++;
      t1.pts += scoring.draw;
      t2.pts += scoring.draw;
    }
  });

  Object.values(stats).forEach((s) => {
    s.sd = s.sf - s.sa;
    if (s.sa > 0) {
      s.pct = (s.sf / s.sa) * 100;
    } else if (s.sf > 0) {
      s.pct = 999;
    } else {
      s.pct = 0;
    }
  });

  const ladder = Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.sd !== a.sd) return b.sd - a.sd;
    if (b.sf !== a.sf) return b.sf - a.sf;
    if (scoring.usePercentage && b.pct !== a.pct) {
      return b.pct - a.pct;
    }
    return a.team.localeCompare(b.team);
  });

  return ladder;
}

function renderLadder(teams, results, scoring) {
  const ladder = computeLadder(teams, results, scoring);
  const tbody = document.querySelector("#ladderTable tbody");
  tbody.innerHTML = "";

  ladder.forEach((row, index) => {
    const tr = document.createElement("tr");
    const cells = [
      index + 1,
      row.team,
      row.gp,
      row.w,
      row.d,
      row.l,
      row.sf,
      row.sa,
      row.sd,
      row.pct ? row.pct.toFixed(1) : "-",
      row.pts
    ];
    cells.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

/* RESULTS */

function renderResults(results) {
  const container = document.getElementById("resultsList");
  container.innerHTML = "";

  const sorted = [...results].sort(
    (a, b) => (b.round || 0) - (a.round || 0) || (b.timestamp || 0) - (a.timestamp || 0)
  );

  sorted.forEach((r) => {
    const div = document.createElement("div");
    div.className = "result-item";

    const teamsSpan = document.createElement("span");
    teamsSpan.className = "result-teams";
    teamsSpan.textContent = `${r.team1} vs ${r.team2}`;

    const scoreSpan = document.createElement("span");
    scoreSpan.className = "result-score";
    const sheetText = r.sheet ? ` • ${r.sheet}` : "";
    scoreSpan.textContent = `R${r.round || "?"}${sheetText}: ${r.shots1} - ${r.shots2}`;

    div.appendChild(teamsSpan);
    div.appendChild(scoreSpan);
    container.appendChild(div);
  });
}

/* LOGOS + SPONSOR CAROUSEL */

let sponsorCarouselState = {
  sponsors: [],
  startIndex: 0,
  visibleCount: 0,
  timer: null
};

function renderLogos(logo, sponsors) {
  const clubLogo = document.getElementById("clubLogo");
  if (clubLogo) {
    if (logo && logo.url) {
      clubLogo.src = `${API_BASE}${logo.url}`;
    } else {
      clubLogo.src = `${API_BASE}/images/club-logo.png`;
    }
  }

  const sponsorsBar = document.getElementById("sponsorsBar");
  sponsorsBar.innerHTML = "";

  const enabledSponsors = (sponsors || []).filter((s) => s.active);
  sponsorCarouselState.sponsors = enabledSponsors;
  sponsorCarouselState.startIndex = 0;

  if (enabledSponsors.length === 0) return;

  computeVisibleSponsors();
  renderSponsorStrip();
  startSponsorCarousel();
}

function computeVisibleSponsors() {
  const bar = document.getElementById("sponsorsBar");
  const barWidth = bar.clientWidth || window.innerWidth;
  const approxLogoWidth = 160;
  const total = sponsorCarouselState.sponsors.length;
  let visible = Math.floor(barWidth / approxLogoWidth);
  if (visible < 1) visible = 1;
  if (visible > total) visible = total;
  sponsorCarouselState.visibleCount = visible;
}

function renderSponsorStrip() {
  const bar = document.getElementById("sponsorsBar");
  bar.innerHTML = "";

  const { sponsors, startIndex, visibleCount } = sponsorCarouselState;
  if (!sponsors.length) return;

  for (let i = 0; i < visibleCount; i++) {
    const idx = (startIndex + i) % sponsors.length;
    const s = sponsors[idx];

    const img = document.createElement("img");
    img.src = `${API_BASE}${s.url}`;
    img.className = "sponsor-logo";
    img.alt = "Sponsor";

    bar.appendChild(img);
  }

  const centreIndex = Math.floor(visibleCount / 2);
  const logos = bar.querySelectorAll(".sponsor-logo");
  if (logos[centreIndex]) {
    logos[centreIndex].classList.add("active");
  }
}

function startSponsorCarousel() {
  if (sponsorCarouselState.timer) {
    clearInterval(sponsorCarouselState.timer);
    sponsorCarouselState.timer = null;
  }

  if (sponsorCarouselState.sponsors.length <= 1) {
    renderSponsorStrip();
    return;
  }

  sponsorCarouselState.timer = setInterval(() => {
    sponsorCarouselState.startIndex =
      (sponsorCarouselState.startIndex + 1) %
      sponsorCarouselState.sponsors.length;
    renderSponsorStrip();
  }, 5000);
}

/* BACKGROUNDS */

let bgTimer = null;

function applyBackgroundOverlay(value) {
  const overlay = document.getElementById("backgroundOverlay");
  if (overlay) {
    overlay.style.background = `rgba(0,0,0,${value})`;
  }
}

function setBackgroundImage(url) {
  const bg = document.getElementById("backgroundImage");
  if (bg) {
    bg.style.backgroundImage = url ? `url("${url}")` : "none";
  }
}

function startBackgroundRotation(backgrounds) {
  if (bgTimer) {
    clearInterval(bgTimer);
    bgTimer = null;
  }

  const enabledImages = (backgrounds || []).filter((img) => img.active);
  const interval = 30000; // 30s
  const overlay = 0.4;

  applyBackgroundOverlay(overlay);

  if (enabledImages.length === 0) {
    setBackgroundImage("");
    return;
  }

  let currentIndex = 0;

  function updateSequential() {
    if (currentIndex >= enabledImages.length) currentIndex = 0;
    const img = enabledImages[currentIndex];
    setBackgroundImage(`${API_BASE}${img.url}`);
    currentIndex++;
  }

  updateSequential();
  if (enabledImages.length > 1) {
    bgTimer = setInterval(updateSequential, interval);
  }
}

/* MAIN REFRESH */

function refreshDisplay() {
  applyDisplayStyle();

  const teams = loadJSON(LS_KEYS.teams, []);
  const results = loadJSON(LS_KEYS.results, []);
  const scoring = loadJSON(LS_KEYS.scoring, {
    win: 4,
    draw: 2,
    loss: 0,
    usePercentage: true,
    autoWinner: true
  });
  const sponsors = loadJSON(LS_KEYS.sponsors, []);
  const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
  const logo = loadJSON(LS_KEYS.logo, null);

  renderLadder(teams, results, scoring);
  renderResults(results);
  renderLogos(logo, sponsors);
  startBackgroundRotation(backgrounds);
}

window.addEventListener("resize", () => {
  if (!sponsorCarouselState.sponsors.length) return;
  computeVisibleSponsors();
  renderSponsorStrip();
});

document.addEventListener("DOMContentLoaded", () => {
  refreshDisplay();
  setInterval(refreshDisplay, 15000);
});
