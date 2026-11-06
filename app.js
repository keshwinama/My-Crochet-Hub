/* =========================================
   STITCH & BLOOM 3.0
   Crochet project organiser
   ========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "stitchBloom30";

const defaultData = {
  projects: [],
  patterns: [],
  wishes: [],
  yarn: [],
  events: [],
  palettes: [],
  sessions: [],
  settings: {
    theme: "sage",
    decoration: "flowers",
    dashboard: ["projects", "stitch", "events"]
  },
  counter: 0,
  repeatTotal: 4,
  repeatDone: [],
  currentPattern: null,
  currentPalette: null,
  sketch: null
};

let data = loadData();
let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;
let timerStartedAt = null;
let patternRowsData = [];
let currentSketchDrawing = false;
let lastSketchPoint = null;
let activeProjectPhotos = [];

/* =========================================
   STORAGE
   ========================================= */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultData);

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      }
    };
  } catch (error) {
    console.error("Could not load saved data:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    showToast("Storage is full. Try removing some photos.");
    console.error(error);
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

/* =========================================
   NAVIGATION
   ========================================= */

const pageNames = {
  home: "A little progress, every day.",
  projects: "All your lovely projects.",
  counter: "Keep your place.",
  patterns: "Your pattern notebook.",
  tutorials: "Learn a new stitch.",
  palette: "Find your next colour story.",
  wishlist: "Little things to look forward to.",
  yarn: "Your yarn collection.",
  calendar: "Your creative plans.",
  designer: "Design something new.",
  sketch: "A space for your ideas.",
  calculators: "The maths behind the magic.",
  settings: "Make your space yours."
};

function navigate(view) {
  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  $("pageTitle").textContent = pageNames[view] || "Stitch & Bloom";

  $("sidebar").classList.remove("open");

  if (view === "home") renderDashboard();
  if (view === "projects") renderProjects();
  if (view === "counter") renderCounter();
  if (view === "patterns") renderPatterns();
  if (view === "palette") renderPalettes();
  if (view === "wishlist") renderWishlist();
  if (view === "yarn") renderYarn();
  if (view === "calendar") renderEvents();
  if (view === "tutorials") renderTutorials();
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

$("menuToggle").addEventListener("click", () => {
  $("sidebar").classList.add("open");
});

$("closeNav").addEventListener("click", () => {
  $("sidebar").classList.remove("open");
});

/* =========================================
   DATE
   ========================================= */

function updateDate() {
  const now = new Date();

  $("todayLabel").textContent = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).toUpperCase();
}

/* =========================================
   DASHBOARD
   ========================================= */

function renderDashboard() {
  const active = data.projects.filter(p => p.status === "In progress").length;
  const completed = data.projects.filter(p => p.status === "Completed").length;
  const yarnCount = data.yarn.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const stats = [
    ["🧶", data.projects.length, "Total projects"],
    ["🌱", active, "In progress"],
    ["✿", completed, "Completed"],
    ["🧵", yarnCount, "Yarn balls"]
  ];

  $("statsGrid").innerHTML = stats.map(([icon, number, label]) => `
    <div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <strong>${number}</strong>
      <small>${label}</small>
    </div>
  `).join("");

  const currentProjects = data.projects.filter(p =>
    p.status === "In progress"
  );

  $("homeProjects").innerHTML = currentProjects.length
    ? currentProjects.slice(0, 4).map(project => `
      <div class="mini-project">
        <div class="mini-project-art">🧶</div>
        <div class="mini-project-info">
          <strong>${escapeHTML(project.name)}</strong>
          <small>${escapeHTML(project.category)} · ${escapeHTML(project.difficulty)}</small>
          <div class="progress-track">
            <span style="width:${project.progress || 0}%"></span>
          </div>
        </div>
        <small>${project.progress || 0}%</small>
      </div>
    `).join("")
    : `<p class="muted">Your next project could go here. Start something lovely!</p>`;

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = data.events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  $("homeEvents").innerHTML = upcoming.length
    ? upcoming.map(event => eventHTML(event)).join("")
    : `<p class="muted">No upcoming plans. Add a little milestone!</p>`;

  $("dailyStitch").innerHTML = `
    <strong>${dailyStitch.name}</strong>
    <p>${dailyStitch.description}</p>
    <span class="status-pill">${dailyStitch.level}</span>
  `;

  applyDashboardSettings();
}

const dailyStitch = {
  name: "The shell stitch",
  description: "A pretty textured stitch that creates little fan shapes. Lovely for blankets, bags and tops.",
  level: "INTERMEDIATE"
};

function applyDashboardSettings() {
  const options = data.settings.dashboard || [];

  document.querySelector(".wide-panel").style.display =
    options.includes("projects") ? "" : "none";

  const panels = document.querySelectorAll(".dashboard-grid > .panel");

  if (panels[1]) {
    panels[1].style.display = options.includes("stitch") ? "" : "none";
  }

  if (panels[2]) {
    panels[2].style.display = options.includes("events") ? "" : "none";
  }
}

/* =========================================
   PROJECTS
   ========================================= */

function openProjectForm(project = null) {
  $("projectFormWrap").classList.remove("hidden");

  $("projectFormTitle").textContent = project
    ? "Edit your project"
    : "Add a project";

  $("projectId").value = project?.id || "";
  $("projectName").value = project?.name || "";
  $("projectCategory").value = project?.category || "Wearable";
  $("projectDifficulty").value = project?.difficulty || "Intermediate";
  $("projectStatus").value = project?.status || "In progress";
  $("projectDate").value = project?.date || "";
  $("projectLink").value = project?.link || "";
  $("projectNotes").value = project?.notes || "";

  activeProjectPhotos = [...(project?.photos || [])];
  renderExistingPhotos();

  $("projectFormWrap").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeProjectForm() {
  $("projectFormWrap").classList.add("hidden");
  $("projectForm").reset();
  activeProjectPhotos = [];
}

$("addProjectBtn").addEventListener("click", () => openProjectForm());

$("closeProjectForm").addEventListener("click", closeProjectForm);
$("cancelProject").addEventListener("click", closeProjectForm);

function renderExistingPhotos() {
  $("existingPhotos").innerHTML = activeProjectPhotos.map((photo, index) => `
    <div style="position:relative">
      <img src="${photo}" alt="Project progress photo">
      <button type="button" data-remove-photo="${index}"
        style="position:absolute;top:2px;right:2px;background:white;border-radius:50%;padding:3px 7px">
        ×
      </button>
    </div>
  `).join("");

  document.querySelectorAll("[data-remove-photo]").forEach(button => {
    button.addEventListener("click", () => {
      activeProjectPhotos.splice(Number(button.dataset.removePhoto), 1);
      renderExistingPhotos();
    });
  });
}

$("projectPhotos").addEventListener("change", async event => {
  const files = [...event.target.files];

  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast(`${file.name} is too large. Choose an image under 1.5 MB.`);
      continue;
    }

    const photo = await readFile(file);
    activeProjectPhotos.push(photo);
  }

  renderExistingPhotos();
  event.target.value = "";
});

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

$("projectForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("projectId").value;

  const project = {
    id: id || makeId(),
    name: $("projectName").value.trim(),
    category: $("projectCategory").value,
    difficulty: $("projectDifficulty").value,
    status: $("projectStatus").value,
    date: $("projectDate").value,
    link: $("projectLink").value.trim(),
    notes: $("projectNotes").value.trim(),
    photos: activeProjectPhotos,
    progress: id
      ? data.projects.find(p => p.id === id)?.progress || 0
      : 0
  };

  if (id) {
    data.projects = data.projects.map(p => p.id === id ? project : p);
    showToast("Project updated ✿");
  } else {
    data.projects.push(project);
    showToast("New project added!");
  }

  saveData();
  closeProjectForm();
  renderProjects();
  renderDashboard();
  updateProjectSelects();
});

function renderProjects() {
  const search = $("projectSearch").value.toLowerCase();
  const filter = $("projectFilter").value;

  const projects = data.projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search);
    const matchesFilter = filter === "all" || project.status === filter;

    return matchesSearch && matchesFilter;
  });

  $("projectGrid").innerHTML = projects.length
    ? projects.map(project => `
      <article class="project-card">
        <div class="project-cover">
          ${project.photos?.length
            ? `<img src="${project.photos[0]}" alt="Photo of ${escapeHTML(project.name)}">`
            : "🧶"}
        </div>

        <div class="project-card-content">
          <span class="status-pill">${escapeHTML(project.status)}</span>
          <h3>${escapeHTML(project.name)}</h3>
          <p>${escapeHTML(project.category)} · ${escapeHTML(project.difficulty)}</p>

          <div class="progress-label">
            <span>Progress</span>
            <span>${project.progress || 0}%</span>
          </div>

          <input type="range" min="0" max="100"
            value="${project.progress || 0}"
            data-progress="${project.id}"
            aria-label="Project completion percentage">

          <div class="project-actions">
            <button data-edit="${project.id}">Edit</button>
            <button data-progress-view="${project.id}">Photos (${project.photos?.length || 0})</button>
            <button data-delete="${project.id}">Delete</button>
          </div>
        </div>
      </article>
    `).join("")
    : `<p class="muted">No projects found. Add your first crochet project!</p>`;

  document.querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      const project = data.projects.find(p => p.id === button.dataset.edit);
      if (project) openProjectForm(project);
    });
  });

  document.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;

      if (!confirm("Delete this project?")) return;

      data.projects = data.projects.filter(p => p.id !== id);
      saveData();
      renderProjects();
      renderDashboard();
      updateProjectSelects();
      showToast("Project deleted.");
    });
  });

  document.querySelectorAll("[data-progress]").forEach(input => {
    input.addEventListener("change", () => {
      const project = data.projects.find(p => p.id === input.dataset.progress);
      if (!project) return;

      project.progress = Number(input.value);

      if (project.progress === 100) {
        project.status = "Completed";
      }

      saveData();
      renderProjects();
      renderDashboard();
    });
  });

  document.querySelectorAll("[data-progress-view]").forEach(button => {
    button.addEventListener("click", () => {
      const project = data.projects.find(p => p.id === button.dataset.progressView);

      if (!project?.photos?.length) {
        showToast("Add progress photos when editing your project.");
        return;
      }

      const photoWindow = window.open("", "_blank");

      if (!photoWindow) {
        showToast("Allow pop-ups to view your photos.");
        return;
      }

      photoWindow.document.write(`
        <title>${escapeHTML(project.name)} photos</title>
        <style>
          body{font-family:sans-serif;background:#f5f6ef;padding:25px}
          img{max-width:100%;width:300px;margin:8px;border-radius:15px}
        </style>
        <h2>${escapeHTML(project.name)}</h2>
        ${project.photos.map(photo => `<img src="${photo}" alt="Project progress photo">`).join("")}
      `);
    });
  });
}

$("projectSearch").addEventListener("input", renderProjects);
$("projectFilter").addEventListener("change", renderProjects);

/* =========================================
   PROJECT SELECT MENUS
   ========================================= */

function updateProjectSelects() {
  const options = data.projects.map(project =>
    `<option value="${project.id}">${escapeHTML(project.name)}</option>`
  ).join("");

  $("counterProject").innerHTML =
    `<option value="">Choose a project</option>${options}`;

  $("patternProject").innerHTML =
    `<option value="">No linked project</option>${options}`;
}

/* =========================================
   ROW COUNTER
   ========================================= */

function renderCounter() {
  $("rowNumber").textContent = data.counter || 0;
  $("repeatTotal").value = data.repeatTotal || 4;
  renderRepeatChecks();
}

function updateCounter() {
  $("rowNumber").textContent = data.counter;
  saveData();
}

$("rowPlus").addEventListener("click", () => {
  data.counter++;
  updateCounter();
});

$("rowMinus").addEventListener("click", () => {
  data.counter = Math.max(0, data.counter - 1);
  updateCounter();
});

$("rowReset").addEventListener("click", () => {
  if (!confirm("Reset the row counter to zero?")) return;

  data.counter = 0;
  updateCounter();
});

$("rowSave").addEventListener("click", () => {
  saveData();
  showToast("Row count saved!");
});

$("repeatTotal").addEventListener("change", () => {
  data.repeatTotal = Math.max(1, Math.min(500, Number($("repeatTotal").value) || 1));
  data.repeatDone = data.repeatDone.filter(n => n <= data.repeatTotal);
  saveData();
  renderRepeatChecks();
});

$("repeatLabel").addEventListener("change", saveData);

function renderRepeatChecks() {
  const total = data.repeatTotal || 4;

  $("repeatChecks").innerHTML = Array.from({ length: total }, (_, index) => `
    <button class="${data.repeatDone.includes(index + 1) ? "done" : ""}"
      data-repeat="${index + 1}">
      ${data.repeatDone.includes(index + 1) ? "✓" : index + 1}
    </button>
  `).join("");

  document.querySelectorAll("[data-repeat]").forEach(button => {
    button.addEventListener("click", () => {
      const number = Number(button.dataset.repeat);

      if (data.repeatDone.includes(number)) {
        data.repeatDone = data.repeatDone.filter(n => n !== number);
      } else {
        data.repeatDone.push(number);
      }

      saveData();
      renderRepeatChecks();
    });
  });

  const completed = data.repeatDone.length;
  const percentage = completed / total * 100;

  $("repeatProgressBar").style.width = `${percentage}%`;
  $("repeatStatus").textContent = `${completed} of ${total} completed`;
}

$("resetRepeats").addEventListener("click", () => {
  data.repeatDone = [];
  saveData();
  renderRepeatChecks();
});

/* =========================================
   CROCHET TIMER
   ========================================= */

function updateTimerDisplay() {
  const hours = Math.floor(timerSeconds / 3600);
  const minutes = Math.floor((timerSeconds % 3600) / 60);
  const seconds = timerSeconds % 60;

  $("timerDisplay").textContent = [
    hours,
    minutes,
    seconds
  ].map(n => String(n).padStart(2, "0")).join(":");
}

$("timerStart").addEventListener("click", () => {
  if (timerRunning) return;

  timerRunning = true;
  timerStartedAt = Date.now() - timerSeconds * 1000;

  timerInterval = setInterval(() => {
    timerSeconds = Math.floor((Date.now() - timerStartedAt) / 1000);
    updateTimerDisplay();
  }, 1000);

  $("timerStatus").textContent = "You're in your crochet flow!";
});

$("timerPause").addEventListener("click", () => {
  if (!timerRunning) return;

  clearInterval(timerInterval);
  timerRunning = false;

  $("timerStatus").textContent = "Session paused.";
});

$("timerFinish").addEventListener("click", () => {
  clearInterval(timerInterval);
  timerRunning = false;

  if (timerSeconds > 0) {
    data.sessions.unshift({
      date: new Date().toISOString(),
      seconds: timerSeconds
    });

    data.sessions = data.sessions.slice(0, 20);
    saveData();
    renderSessionHistory();
    showToast("Crochet session saved!");
  }

  timerSeconds = 0;
  updateTimerDisplay();

  $("timerStatus").textContent = "Ready for another session.";
});

function renderSessionHistory() {
  $("sessionHistory").innerHTML = data.sessions.length
    ? `<strong>Recent sessions</strong><br>` +
      data.sessions.slice(0, 5).map(session => {
        const minutes = Math.round(session.seconds / 60);

        return `• ${new Date(session.date).toLocaleDateString()} — ${minutes} minutes`;
      }).join("<br>")
    : "Your crochet sessions will appear here.";
}

/* =========================================
   PATTERN MAKER
   ========================================= */

function renderPatterns() {
  updateProjectSelects();

  $("patternList").innerHTML = data.patterns.length
    ? data.patterns.map(pattern => `
      <button data-pattern="${pattern.id}">
        <strong>${escapeHTML(pattern.title)}</strong>
        <br>
        <small class="muted">${pattern.rows.length} rows</small>
      </button>
    `).join("")
    : `<p class="muted">Your saved patterns will appear here.</p>`;

  document.querySelectorAll("[data-pattern]").forEach(button => {
    button.addEventListener("click", () => {
      const pattern = data.patterns.find(p => p.id === button.dataset.pattern);
      if (pattern) loadPattern(pattern);
    });
  });
}

function loadPattern(pattern) {
  $("patternId").value = pattern.id;
  $("patternTitle").value = pattern.title;
  $("patternProject").value = pattern.projectId || "";
  $("patternDescription").value = pattern.description || "";

  patternRowsData = [...pattern.rows];
  renderPatternRows();
}

function renderPatternRows() {
  $("patternRows").innerHTML = patternRowsData.map((row, index) => `
    <div class="pattern-row">
      <input value="${escapeHTML(row.label)}"
        data-row-label="${index}" aria-label="Row label">
      <input value="${escapeHTML(row.instructions)}"
        data-row-instructions="${index}" aria-label="Row instructions">
      <button type="button" data-remove-row="${index}">×</button>
    </div>
  `).join("");

  document.querySelectorAll("[data-row-label]").forEach(input => {
    input.addEventListener("input", () => {
      patternRowsData[Number(input.dataset.rowLabel)].label = input.value;
    });
  });

  document.querySelectorAll("[data-row-instructions]").forEach(input => {
    input.addEventListener("input", () => {
      patternRowsData[Number(input.dataset.rowInstructions)].instructions = input.value;
    });
  });

  document.querySelectorAll("[data-remove-row]").forEach(button => {
    button.addEventListener("click", () => {
      patternRowsData.splice(Number(button.dataset.removeRow), 1);
      renderPatternRows();
    });
  });
}

$("newPattern").addEventListener("click", () => {
  $("patternId").value = "";
  $("patternTitle").value = "";
  $("patternDescription").value = "";
  $("patternProject").value = "";
  patternRowsData = [];
  renderPatternRows();
});

$("addPatternRow").addEventListener("click", () => {
  patternRowsData.push({
    label: `Row ${patternRowsData.length + 1}`,
    instructions: ""
  });

  renderPatternRows();
});

$("savePattern").addEventListener("click", () => {
  const title = $("patternTitle").value.trim();

  if (!title) {
    showToast("Give your pattern a title first.");
    return;
  }

  const id = $("patternId").value;

  const pattern = {
    id: id || makeId(),
    title,
    projectId: $("patternProject").value,
    description: $("patternDescription").value,
    rows: patternRowsData
  };

  if (id) {
    data.patterns = data.patterns.map(p => p.id === id ? pattern : p);
  } else {
    data.patterns.push(pattern);
  }

  saveData();
  renderPatterns();
  showToast("Pattern saved!");
});

$("deletePattern").addEventListener("click", () => {
  const id = $("patternId").value;

  if (!id) {
    showToast("Choose a saved pattern first.");
    return;
  }

  if (!confirm("Delete this pattern?")) return;

  data.patterns = data.patterns.filter(p => p.id !== id);

  $("patternId").value = "";
  $("patternTitle").value = "";
  $("patternDescription").value = "";
  patternRowsData = [];

  saveData();
  renderPatternRows();
  renderPatterns();
  showToast("Pattern deleted.");
});

/* =========================================
   STITCH LIBRARY
   ========================================= */

const stitches = [
  {
    name: "Chain stitch",
    symbol: "○",
    level: "Beginner",
    description: "The foundation of many crochet projects. Make a loop and pull yarn through it.",
    search: "chain foundation"
  },
  {
    name: "Slip stitch",
    symbol: "⌁",
    level: "Beginner",
    description: "A short stitch used to join rounds or move across stitches.",
    search: "slip join"
  },
  {
    name: "Single crochet",
    symbol: "×",
    level: "Beginner",
    description: "A compact stitch that creates a neat, firm fabric.",
    search: "single crochet sc"
  },
  {
    name: "Half double crochet",
    symbol: "T",
    level: "Beginner",
    description: "A stitch between single and double crochet in height.",
    search: "half double hdc"
  },
  {
    name: "Double crochet",
    symbol: "†",
    level: "Beginner",
    description: "A taller stitch that creates a softer and more flexible fabric.",
    search: "double crochet dc"
  },
  {
    name: "Treble crochet",
    symbol: "‡",
    level: "Intermediate",
    description: "A tall stitch useful for airy patterns and decorative textures.",
    search: "treble tr"
  },
  {
    name: "Moss stitch",
    symbol: "✿",
    level: "Intermediate",
    description: "Alternating chain spaces and single crochet create a woven texture.",
    search: "moss linen"
  },
  {
    name: "Shell stitch",
    symbol: "◠",
    level: "Intermediate",
    description: "Several stitches worked into one space create a fan-like shell.",
    search: "shell fan"
  },
  {
    name: "Granny cluster",
    symbol: "❀",
    level: "Beginner",
    description: "Groups of double crochet stitches create classic granny-square texture.",
    search: "granny square cluster"
  },
  {
    name: "Puff stitch",
    symbol: "●",
    level: "Advanced",
    description: "A raised textured stitch made by gathering several loops together.",
    search: "puff stitch"
  },
  {
    name: "Bobble stitch",
    symbol: "◉",
    level: "Intermediate",
    description: "A rounded raised detail that adds texture to crochet fabric.",
    search: "bobble stitch"
  },
  {
    name: "V stitch",
    symbol: "∨",
    level: "Intermediate",
    description: "A decorative stitch pattern that creates small V-shaped spaces.",
    search: "v stitch crochet"
  }
];

function renderTutorials() {
  const search = $("stitchSearch").value.toLowerCase();
  const level = $("stitchLevel").value;

  const filtered = stitches.filter(stitch => {
    const matchesSearch = stitch.name.toLowerCase().includes(search) ||
      stitch.description.toLowerCase().includes(search);

    return matchesSearch && (level === "all" || stitch.level === level);
  });

  $("stitchGrid").innerHTML = filtered.map(stitch => `
    <article class="stitch-card">
      <div class="stitch-symbol">${stitch.symbol}</div>
      <span class="status-pill">${stitch.level}</span>
      <h3>${stitch.name}</h3>
      <p>${stitch.description}</p>
      <a href="https://www.youtube.com/results?search_query=crochet+${encodeURIComponent(stitch.search)}+tutorial"
        target="_blank" rel="noopener noreferrer">
        Find a video tutorial ↗
      </a>
    </article>
  `).join("") || `<p class="muted">No stitches found. Try another search.</p>`;
}

$("stitchSearch").addEventListener("input", renderTutorials);
$("stitchLevel").addEventListener("change", renderTutorials);

/* =========================================
   COLOUR PALETTE GENERATOR
   ========================================= */

const palettes = [
  {
    name: "Meadow morning",
    colours: ["#a8b99a", "#d5dfc8", "#f4e9d5", "#d5b6a3", "#8b9c83"]
  },
  {
    name: "Strawberry milk",
    colours: ["#f1c8ca", "#e6a8ad", "#fff0e7", "#c7d1b9", "#9eaa91"]
  },
  {
    name: "Lavender fields",
    colours: ["#c8b8dc", "#e4d9ed", "#f5eee7", "#b4c5ad", "#8d9c85"]
  },
  {
    name: "Ocean garden",
    colours: ["#8daaa3", "#bfd4cb", "#e8e7d6", "#d4b6a5", "#526e68"]
  },
  {
    name: "Peach blossom",
    colours: ["#eab8a5", "#f4d5c6", "#fff0dc", "#b5c5a8", "#899b7e"]
  },
  {
    name: "Matcha cream",
    colours: ["#7f9877", "#a9bb9d", "#dce5cf", "#f5eddb", "#c5b89e"]
  }
];

function generatePalette() {
  const selected = palettes[Math.floor(Math.random() * palettes.length)];

  data.currentPalette = selected;
  renderCurrentPalette();
}

function renderCurrentPalette() {
  const selected = data.currentPalette || palettes[0];

  $("paletteName").textContent = selected.name;

  $("paletteSwatches").innerHTML = selected.colours.map(colour => `
    <div class="swatch">
      <div class="swatch-colour" style="background:${colour}"></div>
      <small>${colour}</small>
    </div>
  `).join("");
}

$("generatePalette").addEventListener("click", generatePalette);

$("savePalette").addEventListener("click", () => {
  const selected = data.currentPalette || palettes[0];

  if (data.palettes.some(p => p.name === selected.name)) {
    showToast("You've already saved this palette!");
    return;
  }

  data.palettes.push(selected);
  saveData();
  renderPalettes();
  showToast("Palette saved!");
});

function renderPalettes() {
  if (!data.currentPalette) {
    data.currentPalette = palettes[0];
  }

  renderCurrentPalette();

  $("savedPalettes").innerHTML = data.palettes.length
    ? data.palettes.map((palette, index) => `
      <div class="saved-palette">
        <strong>${escapeHTML(palette.name)}</strong>
        <div class="saved-palette-colours">
          ${palette.colours.map(colour =>
            `<span style="flex:1;background:${colour}"></span>`
          ).join("")}
        </div>
        <button class="soft-btn" data-delete-palette="${index}" style="margin-top:10px">
          Remove
        </button>
      </div>
    `).join("")
    : `<p class="muted">Your saved palettes will appear here.</p>`;

  document.querySelectorAll("[data-delete-palette]").forEach(button => {
    button.addEventListener("click", () => {
      data.palettes.splice(Number(button.dataset.deletePalette), 1);
      saveData();
      renderPalettes();
    });
  });
}

/* =========================================
   WISHLIST
   ========================================= */

$("wishForm").addEventListener("submit", event => {
  event.preventDefault();

  data.wishes.push({
    id: makeId(),
    name: $("wishName").value.trim(),
    type: $("wishType").value,
    price: Number($("wishPrice").value) || 0,
    done: false
  });

  saveData();
  $("wishForm").reset();
  renderWishlist();
  showToast("Added to your wishlist!");
});

function renderWishlist() {
  $("wishList").innerHTML = data.wishes.length
    ? data.wishes.map(item => `
      <div class="wish-item ${item.done ? "done" : ""}">
        <input type="checkbox" data-wish-check="${item.id}"
          ${item.done ? "checked" : ""}
          style="width:17px;height:17px">
        <strong>${escapeHTML(item.name)}</strong>
        <span class="status-pill">${escapeHTML(item.type)}</span>
        <small>${item.price ? `₹${item.price}` : ""}</small>
        <button class="soft-btn" data-wish-delete="${item.id}">×</button>
      </div>
    `).join("")
    : `<p class="muted">Your wishlist is waiting for some lovely ideas!</p>`;

  document.querySelectorAll("[data-wish-check]").forEach(input => {
    input.addEventListener("change", () => {
      const item = data.wishes.find(w => w.id === input.dataset.wishCheck);
      if (!item) return;

      item.done = input.checked;
      saveData();
      renderWishlist();
    });
  });

  document.querySelectorAll("[data-wish-delete]").forEach(button => {
    button.addEventListener("click", () => {
      data.wishes = data.wishes.filter(w => w.id !== button.dataset.wishDelete);
      saveData();
      renderWishlist();
    });
  });
}

/* =========================================
   YARN STASH
   ========================================= */

$("yarnForm").addEventListener("submit", event => {
  event.preventDefault();

  data.yarn.push({
    id: makeId(),
    name: $("yarnName").value.trim(),
    colour: $("yarnColour").value.trim(),
    weight: $("yarnWeight").value.trim(),
    amount: Number($("yarnAmount").value) || 0,
    hex: $("yarnHex").value
  });

  saveData();
  $("yarnForm").reset();
  renderYarn();
  renderDashboard();
  showToast("Yarn added to your stash!");
});

function renderYarn() {
  $("yarnGrid").innerHTML = data.yarn.length
    ? data.yarn.map(item => `
      <div class="yarn-card">
        <div class="yarn-colour" style="background:${item.hex}"></div>
        <strong>${escapeHTML(item.name)}</strong>
        <small>${escapeHTML(item.colour)} · ${escapeHTML(item.weight)}</small>
        <br>
        <small>${item.amount} ball(s)</small>
        <button class="soft-btn" data-yarn-delete="${item.id}" style="margin-top:10px">
          Remove
        </button>
      </div>
    `).join("")
    : `<p class="muted">Your yarn stash is empty. Add your first yarn!</p>`;

  document.querySelectorAll("[data-yarn-delete]").forEach(button => {
    button.addEventListener("click", () => {
      data.yarn = data.yarn.filter(y => y.id !== button.dataset.yarnDelete);
      saveData();
      renderYarn();
      renderDashboard();
    });
  });
}

/* =========================================
   CALENDAR
   ========================================= */

$("eventForm").addEventListener("submit", event => {
  event.preventDefault();

  data.events.push({
    id: makeId(),
    title: $("eventTitle").value.trim(),
    date: $("eventDate").value,
    type: $("eventType").value
  });

  saveData();
  $("eventForm").reset();
  renderEvents();
  renderDashboard();
  showToast("Added to your calendar!");
});

function eventHTML(event) {
  const date = new Date(`${event.date}T12:00:00`);

  return `
    <div class="event-item">
      <div class="event-date">
        ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>
      <div style="flex:1">
        <strong>${escapeHTML(event.title)}</strong>
        <small>${escapeHTML(event.type)}</small>
      </div>
      <button class="soft-btn" data-event-delete="${event.id}">×</button>
    </div>
  `;
}

function renderEvents() {
  const events = [...data.events].sort((a, b) => a.date.localeCompare(b.date));

  $("eventList").innerHTML = events.length
    ? events.map(event => eventHTML(event)).join("")
    : `<p class="muted">No plans yet. Add a reminder or milestone!</p>`;

  document.querySelectorAll("[data-event-delete]").forEach(button => {
    button.addEventListener("click", () => {
      data.events = data.events.filter(e => e.id !== button.dataset.eventDelete);
      saveData();
      renderEvents();
      renderDashboard();
    });
  });
}

/* =========================================
   FILLET CROCHET DESIGNER
   ========================================= */

function createGrid() {
  const rows = Math.max(4, Math.min(40, Number($("gridRows").value) || 12));
  const cols = Math.max(4, Math.min(40, Number($("gridCols").value) || 12));

  $("gridRows").value = rows;
  $("gridCols").value = cols;

  const grid = $("filletGrid");

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${cols}, 23px)`;

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "fillet-cell";
    cell.setAttribute("aria-label", `Grid square ${i + 1}`);

    cell.addEventListener("click", () => {
      cell.classList.toggle("filled");
    });

    grid.appendChild(cell);
  }
}

$("makeGrid").addEventListener("click", createGrid);

$("clearGrid").addEventListener("click", () => {
  document.querySelectorAll(".fillet-cell").forEach(cell => {
    cell.classList.remove("filled");
  });
});

$("exportGrid").addEventListener("click", () => {
  const cells = [...document.querySelectorAll(".fillet-cell")];

  if (!cells.length) {
    showToast("Create a grid first!");
    return;
  }

  const rows = Number($("gridRows").value);
  const cols = Number($("gridCols").value);
  const cellSize = 30;

  const canvas = document.createElement("canvas");

  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  const ctx = canvas.getContext("2d");

  cells.forEach((cell, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    ctx.fillStyle = cell.classList.contains("filled")
      ? "#526d55"
      : "#ffffff";

    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

    ctx.strokeStyle = "#a7b6a0";
    ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
  });

  downloadDataURL(canvas.toDataURL("image/png"), "crochet-chart.png");
  showToast("Chart exported!");
});

function downloadDataURL(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

/* =========================================
   SKETCHBOOK
   ========================================= */

const sketchCanvas = $("sketchCanvas");
const sketchCtx = sketchCanvas.getContext("2d");

function clearSketch() {
  sketchCtx.fillStyle = "#fffefa";
  sketchCtx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);
}

function getSketchPoint(event) {
  const rect = sketchCanvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * sketchCanvas.width / rect.width,
    y: (event.clientY - rect.top) * sketchCanvas.height / rect.height
  };
}

sketchCanvas.addEventListener("pointerdown", event => {
  currentSketchDrawing = true;
  lastSketchPoint = getSketchPoint(event);
  sketchCanvas.setPointerCapture(event.pointerId);
});

sketchCanvas.addEventListener("pointermove", event => {
  if (!currentSketchDrawing) return;

  const point = getSketchPoint(event);

  sketchCtx.beginPath();
  sketchCtx.moveTo(lastSketchPoint.x, lastSketchPoint.y);
  sketchCtx.lineTo(point.x, point.y);

  sketchCtx.strokeStyle = $("penColour").value;
  sketchCtx.lineWidth = Number($("penSize").value);
  sketchCtx.lineCap = "round";
  sketchCtx.lineJoin = "round";
  sketchCtx.stroke();

  lastSketchPoint = point;
});

function stopSketch() {
  currentSketchDrawing = false;
  lastSketchPoint = null;
}

sketchCanvas.addEventListener("pointerup", stopSketch);
sketchCanvas.addEventListener("pointercancel", stopSketch);
sketchCanvas.addEventListener("pointerleave", stopSketch);

$("eraseSketch").addEventListener("click", () => {
  clearSketch();
  showToast("Canvas cleared.");
});

$("saveSketch").addEventListener("click", () => {
  try {
    data.sketch = sketchCanvas.toDataURL("image/png");
    saveData();
    $("sketchStatus").textContent = "Your sketch is saved in this browser.";
    showToast("Sketch saved!");
  } catch (error) {
    showToast("Could not save this sketch.");
  }
});

function loadSketch() {
  clearSketch();

  if (!data.sketch) return;

  const image = new Image();

  image.onload = () => {
    sketchCtx.clearRect(0, 0, sketchCanvas.width, sketchCanvas.height);
    sketchCtx.drawImage(image, 0, 0, sketchCanvas.width, sketchCanvas.height);
  };

  image.src = data.sketch;
}

/* =========================================
   CALCULATORS
   ========================================= */

$("calcGauge").addEventListener("click", () => {
  const stitches = Number($("gaugeStitches").value);
  const rows = Number($("gaugeRows").value);
  const width = Number($("gaugeWidth").value);
  const height = Number($("gaugeHeight").value);

  if ([stitches, rows, width, height].some(n => n <= 0 || !Number.isFinite(n))) {
    $("gaugeResult").textContent = "Please enter positive numbers in every field.";
    return;
  }

  const neededStitches = Math.round(stitches * width / 10);
  const neededRows = Math.round(rows * height / 10);

  $("gaugeResult").textContent =
    `For approximately ${width} × ${height} cm, try ${neededStitches} stitches across and ${neededRows} rows high. Remember to make a gauge swatch!`;
});

$("calcCost").addEventListener("click", () => {
  const yarn = Number($("costYarn").value) || 0;
  const other = Number($("costOther").value) || 0;
  const hours = Number($("costHours").value) || 0;

  if (yarn < 0 || other < 0 || hours < 0) {
    $("costResult").textContent = "Please enter zero or a positive number.";
    return;
  }

  const total = yarn + other;

  $("costResult").textContent =
    `Materials cost: ₹${total.toFixed(2)}. Time spent: ${hours} hour(s).`;
});

/* =========================================
   SETTINGS AND THEMES
   ========================================= */

function applyTheme(theme) {
  document.body.classList.remove(
    "theme-lavender",
    "theme-pink",
    "theme-custom"
  );

  if (theme !== "sage") {
    document.body.classList.add(`theme-${theme}`);
  }

  $("themeSelect").value = theme;
}

function renderSettings() {
  $("decorationStyle").value = data.settings.decoration;
  $("themeSelect").value = data.settings.theme;

  const choices = [
    ["projects", "Current projects"],
    ["stitch", "Stitch of the day"],
    ["events", "Upcoming plans"]
  ];

  $("dashboardOptions").innerHTML = choices.map(([value, label]) => `
    <label>
      <input type="checkbox" value="${value}"
        ${data.settings.dashboard.includes(value) ? "checked" : ""}>
      ${label}
    </label>
  `).join("");
}

$("saveSettings").addEventListener("click", () => {
  data.settings.theme = $("themeSelect").value;
  data.settings.decoration = $("decorationStyle").value;

  data.settings.dashboard = [
    ...$("dashboardOptions").querySelectorAll("input:checked")
  ].map(input => input.value);

  applyTheme(data.settings.theme);
  saveData();
  renderDashboard();

  showToast("Your appearance settings are saved!");
});

$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  $("themeToggle").textContent =
    document.body.classList.contains("dark") ? "☀" : "☾";

  localStorage.setItem(
    "stitchBloomDark",
    document.body.classList.contains("dark") ? "true" : "false"
  );
});

/* =========================================
   BACKUP AND RESTORE
   ========================================= */

$("exportBackup").addEventListener("click", () => {
  const backup = {
    ...data,
    exportedAt: new Date().toISOString(),
    version: "3.0"
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "stitch-and-bloom-backup.json";
  link.click();

  URL.revokeObjectURL(url);

  showToast("Backup downloaded!");
});

$("importBackup").addEventListener("change", async event => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (!imported || !Array.isArray(imported.projects)) {
      throw new Error("Invalid backup");
    }

    if (!confirm("Restore this backup? Your current saved data will be replaced.")) {
      event.target.value = "";
      return;
    }

    data = {
      ...structuredClone(defaultData),
      ...imported,
      settings: {
        ...defaultData.settings,
        ...(imported.settings || {})
      }
    };

    saveData();
    location.reload();
  } catch (error) {
    showToast("That backup file could not be read.");
  }

  event.target.value = "";
});

/* =========================================
   INITIALISE APP
   ========================================= */

function initialiseApp() {
  updateDate();

  applyTheme(data.settings.theme);

  if (localStorage.getItem("stitchBloomDark") === "true") {
    document.body.classList.add("dark");
    $("themeToggle").textContent = "☀";
  }

  updateProjectSelects();

  renderDashboard();
  renderProjects();
  renderCounter();
  renderPatterns();
  renderTutorials();
  renderPalettes();
  renderWishlist();
  renderYarn();
  renderEvents();
  renderSessionHistory();
  renderSettings();

  updateTimerDisplay();
  loadSketch();
  createGrid();

  navigate("home");
}

initialiseApp();