function setupBackgrounds() {
  const uploadInput = document.getElementById("backgroundUploadInput");
  const uploadBtn = document.getElementById("backgroundUploadBtn");
  const listEl = document.getElementById("backgroundGrid"); // FIXED ID

  if (!listEl) return; // Prevent crash if element missing

  function renderBackgrounds() {
    const backgrounds = loadJSON(LS_KEYS.backgrounds, []);
    listEl.innerHTML = ""; // SAFE because listEl is guaranteed

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
