const STORAGE_KEY = "loopBloomCrochetStudio";


// ======================================================
// DATA
// ======================================================

function createProject() {

  return {

    id: crypto.randomUUID(),

    name: "My first project",

    desc: "A little space for your next handmade thing.",

    rows: 0,

    targetRows: 0,

    elapsed: 0,

    running: false,

    timerStartedAt: null,

    grid: {
      rows: 20,
      cols: 20,
      filled: []
    },

    notes: {
      title: "",
      yarn: "",
      difficulty: "Beginner",
      materials: "",
      text: ""
    },

    drawing: null,

    finished: []

  };

}


let state =
  JSON.parse(localStorage.getItem(STORAGE_KEY))
  ||
  {
    projects: [createProject()],
    currentProjectId: null
  };


if (!state.currentProjectId) {

  state.currentProjectId =
    state.projects[0].id;

}


let calendarDate = new Date();

let drawing = {
  canvas: null,
  ctx: null,
  drawing: false,
  eraser: false,
  lastX: 0,
  lastY: 0
};


const $ = id =>
  document.getElementById(id);


function currentProject() {

  return state.projects.find(
    project =>
      project.id === state.currentProjectId
  ) || state.projects[0];

}


// ======================================================
// SAVE
// ======================================================

function save(showToast = false) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

  $("saveStatus").textContent =
    "● Saved automatically";

  if (showToast) {

    showToastMessage("Saved ♡");

  }

}


function showToastMessage(message) {

  const toast = $("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer =
    setTimeout(
      () => toast.classList.remove("show"),
      1200
    );

}


// ======================================================
// TIME
// ======================================================

function getProjectTime(project) {

  let time = project.elapsed;

  if (
    project.running &&
    project.timerStartedAt
  ) {

    time += Math.floor(
      (Date.now() - project.timerStartedAt) / 1000
    );

  }

  return time;

}


function formatTime(seconds) {

  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );

}


// ======================================================
// PROJECTS
// ======================================================

function renderProjects() {

  const select =
    $("projectSelect");

  select.innerHTML = "";

  state.projects.forEach(project => {

    const option =
      document.createElement("option");

    option.value = project.id;

    option.textContent =
      project.name;

    select.appendChild(option);

  });

  select.value =
    state.currentProjectId;

}


function renderHome() {

  const project =
    currentProject();

  const time =
    getProjectTime(project);

  let percentage = 0;

  if (project.targetRows) {

    percentage =
      Math.min(
        100,
        Math.round(
          project.rows /
          project.targetRows *
          100
        )
      );

  }


  $("heroProjectName").textContent =
    project.name;

  $("heroProjectDesc").textContent =
    project.desc ||
    "Your crochet project.";


  $("heroRows").textContent =
    project.rows;

  $("heroTime").textContent =
    formatTime(time);

  $("heroProgress").textContent =
    percentage + "%";


  $("rowValue").textContent =
    project.rows;

  $("timerDisplay").textContent =
    formatTime(time);

  $("timerProjectLabel").textContent =
    project.name;


  $("targetRows").value =
    project.targetRows || "";


  $("progressBar").style.width =
    percentage + "%";


  $("timerStart").textContent =
    project.running
      ? "Pause"
      : "Start";

}


function renderAll() {

  renderProjects();

  renderHome();

  renderGrid();

  renderNotes();

  renderCalendar();

}


// ======================================================
// PAGE NAVIGATION
// ======================================================

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(section =>
      section.classList.remove("active")
    );


  $("page-" + page)
    .classList.add("active");


  document
    .querySelectorAll(".nav-btn")
    .forEach(button =>
      button.classList.toggle(
        "active",
        button.dataset.page === page
      )
    );


  if (page === "grid")
    renderGrid();

  if (page === "notes")
    renderNotes();

  if (page === "calendar")
    renderCalendar();

  if (page === "design")
    initCanvas();


  document
    .querySelector(".sidebar")
    .classList.remove("open");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.onclick =
      () => showPage(button.dataset.page);

  });


document
  .querySelectorAll("[data-go]")
  .forEach(button => {

    button.onclick =
      () => showPage(button.dataset.go);

  });


// ======================================================
// MOBILE MENU
// ======================================================

$("mobileMenu").onclick = () => {

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

};


$("mobileProject").onclick = () => {

  document
    .querySelector(".sidebar")
    .classList.toggle("open");

};


// ======================================================
// PROJECT SELECT
// ======================================================

$("projectSelect").onchange = event => {

  state.currentProjectId =
    event.target.value;

  save();

  renderAll();

};


// ======================================================
// NEW PROJECT
// ======================================================

$("newProjectBtn").onclick = () => {

  $("projectModal")
    .classList.add("open");

  $("newProjectName").focus();

};


$("closeModal").onclick =
$("cancelProject").onclick =
() => {

  $("projectModal")
    .classList.remove("open");

};


$("createProject").onclick = () => {

  const name =
    $("newProjectName")
      .value
      .trim()
      ||
      "Untitled project";


  const project =
    createProject();

  project.name = name;

  project.desc =
    $("newProjectDesc")
      .value
      .trim();


  state.projects.push(project);

  state.currentProjectId =
    project.id;


  $("newProjectName").value = "";

  $("newProjectDesc").value = "";


  $("projectModal")
    .classList.remove("open");


  save();

  renderAll();

  showToastMessage(
    "New project created ♡"
  );

};


// ======================================================
// ROW COUNTER
// ======================================================

$("rowPlus").onclick = () => {

  currentProject().rows++;

  save();

  renderHome();

};


$("rowMinus").onclick = () => {

  currentProject().rows =
    Math.max(
      0,
      currentProject().rows - 1
    );

  save();

  renderHome();

};


$("rowReset").onclick = () => {

  if (
    confirm(
      "Reset the row counter to 0?"
    )
  ) {

    currentProject().rows = 0;

    save(true);

    renderHome();

  }

};


$("rowSaveCheckpoint").onclick =
() => {

  save(true);

};


$("targetRows").oninput =
event => {

  currentProject().targetRows =
    Number(event.target.value) || 0;

  save();

  renderHome();

};


// ======================================================
// TIMER
// ======================================================

$("timerStart").onclick = () => {

  const project =
    currentProject();


  if (project.running) {

    project.elapsed =
      getProjectTime(project);

    project.running = false;

    project.timerStartedAt = null;

    showToastMessage("Timer paused");

  }

  else {

    project.running = true;

    project.timerStartedAt =
      Date.now();

    showToastMessage("Timer started");

  }


  save();

  renderHome();

};


$("timerReset").onclick = () => {

  if (
    confirm(
      "Reset this project's timer?"
    )
  ) {

    const project =
      currentProject();

    project.elapsed = 0;

    project.running = false;

    project.timerStartedAt = null;

    save(true);

    renderHome();

  }

};


// ======================================================
// FILET CROCHET GRID
// ======================================================

function renderGrid() {

  const project =
    currentProject();

  const grid =
    project.grid;

  const container =
    $("filetGrid");


  container.innerHTML = "";


  $("gridRows").value =
    grid.rows;

  $("gridCols").value =
    grid.cols;


  container.style.gridTemplateColumns =
    `repeat(${grid.cols}, 25px)`;


  const filled =
    new Set(grid.filled || []);


  for (
    let row = 0;
    row < grid.rows;
    row++
  ) {

    for (
      let column = 0;
      column < grid.cols;
      column++
    ) {

      const cell =
        document.createElement("button");


      const key =
        `${row},${column}`;


      cell.className =
        "grid-cell";


      if (filled.has(key))
        cell.classList.add("filled");


      cell.onclick = () => {

        if (filled.has(key)) {

          filled.delete(key);

          cell.classList.remove(
            "filled"
          );

        }

        else {

          filled.add(key);

          cell.classList.add(
            "filled"
          );

        }


        grid.filled =
          [...filled];

        save();

      };


      container.appendChild(cell);

    }

  }

}


$("resizeGrid").onclick = () => {

  const project =
    currentProject();


  project.grid.rows =
    Math.max(
      1,
      Math.min(
        60,
        Number($("gridRows").value)
        || 20
      )
    );


  project.grid.cols =
    Math.max(
      1,
      Math.min(
        60,
        Number($("gridCols").value)
        || 20
      )
    );


  const valid =
    new Set();


  (project.grid.filled || [])
    .forEach(key => {

      const [
        row,
        column
      ] =
        key
          .split(",")
          .map(Number);


      if (
        row < project.grid.rows &&
        column < project.grid.cols
      ) {

        valid.add(key);

      }

    });


  project.grid.filled =
    [...valid];


  save();

  renderGrid();

};


$("clearGrid").onclick = () => {

  if (
    confirm(
      "Clear this filet chart?"
    )
  ) {

    currentProject()
      .grid
      .filled = [];

    save(true);

    renderGrid();

  }

};


$("gridLines").onchange =
event => {

  $("filetGrid")
    .classList.toggle(
      "bold-grid",
      event.target.checked
    );

};


// ======================================================
// DOWNLOAD FILET GRID
// ======================================================

$("downloadGrid").onclick = () => {

  const project =
    currentProject();

  const grid =
    project.grid;

  const size = 25;

  const canvas =
    document.createElement("canvas");


  canvas.width =
    grid.cols * size;

  canvas.height =
    grid.rows * size;


  const ctx =
    canvas.getContext("2d");


  ctx.fillStyle = "white";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const filled =
    new Set(grid.filled);


  for (
    let row = 0;
    row < grid.rows;
    row++
  ) {

    for (
      let column = 0;
      column < grid.cols;
      column++
    ) {

      if (
        filled.has(
          `${row},${column}`
        )
      ) {

        ctx.fillStyle =
          "#d99ab8";

        ctx.fillRect(
          column * size,
          row * size,
          size,
          size
        );

      }


      ctx.strokeStyle =
        "#c9b9c2";

      ctx.strokeRect(
        column * size,
        row * size,
        size,
        size
      );

    }

  }


  const link =
    document.createElement("a");

  link.download =
    project.name +
    "-filet-chart.png";

  link.href =
    canvas.toDataURL();

  link.click();

};


// ======================================================
// PATTERN NOTES
// ======================================================

function renderNotes() {

  const notes =
    currentProject().notes;


  $("patternTitle").value =
    notes.title || "";

  $("yarnInfo").value =
    notes.yarn || "";

  $("difficulty").value =
    notes.difficulty ||
    "Beginner";

  $("materials").value =
    notes.materials || "";

  $("patternNotes").value =
    notes.text || "";


  updateWordCount();

}


function saveNotes() {

  const project =
    currentProject();


  project.notes = {

    title:
      $("patternTitle").value,

    yarn:
      $("yarnInfo").value,

    difficulty:
      $("difficulty").value,

    materials:
      $("materials").value,

    text:
      $("patternNotes").value

  };


  save();

  updateWordCount();

}


[
  "patternTitle",
  "yarnInfo",
  "difficulty",
  "materials",
  "patternNotes"
]
.forEach(id => {

  $(id).addEventListener(
    "input",
    saveNotes
  );

});


function updateWordCount() {

  const text =
    $("patternNotes")
      .value
      .trim();


  const words =
    text
      ? text.split(/\s+/).length
      : 0;


  $("wordCount").textContent =
    words + " words";

}


// Simple pattern formatting

document
  .querySelectorAll(
    ".editor-toolbar button"
  )
  .forEach(button => {

    button.onclick = () => {

      const textarea =
        $("patternNotes");


      const start =
        textarea.selectionStart;

      const end =
        textarea.selectionEnd;


      const selected =
        textarea.value.slice(
          start,
          end
        );


      let replacement =
        selected;


      if (
        button.dataset.format ===
        "bold"
      ) {

        replacement =
          "**" +
          selected +
          "**";

      }


      if (
        button.dataset.format ===
        "italic"
      ) {

        replacement =
          "*" +
          selected +
          "*";

      }


      if (
        button.dataset.format ===
        "h2"
      ) {

        replacement =
          "# " +
          selected;

      }


      if (
        button.dataset.format ===
        "bullet"
      ) {

        replacement =
          "• " +
          selected;

      }


      textarea.setRangeText(
        replacement,
        start,
        end,
        "end"
      );


      textarea.dispatchEvent(
        new Event("input")
      );


      textarea.focus();

    };

  });


// ======================================================
// CALENDAR
// ======================================================

function getDateKey(date) {

  return date
    .toISOString()
    .slice(0,10);

}


function renderCalendar() {

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();


  $("calendarTitle")
    .textContent =
    calendarDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric"
      }
    );


  const calendar =
    $("calendarGrid");


  calendar.innerHTML = "";


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const startDate =
    new Date(firstDay);


  startDate.setDate(
    1 - firstDay.getDay()
  );


  const today =
    getDateKey(new Date());


  const events = {};


  state.projects.forEach(
    project => {

      (project.finished || [])
        .forEach(event => {

          if (!events[event.date])
            events[event.date] = [];

          events[event.date]
            .push({
              project:
                project.name,

              time:
                event.time
            });

        });

    }
  );


  for (
    let i = 0;
    i < 42;
    i++
  ) {

    const date =
      new Date(startDate);


    date.setDate(
      startDate.getDate() + i
    );


    const key =
      getDateKey(date);


    const cell =
      document.createElement("div");


    cell.className =
      "day";


    if (
      date.getMonth() !==
      month
    ) {

      cell.classList.add(
        "other"
      );

    }


    if (key === today) {

      cell.classList.add(
        "today"
      );

    }


    cell.innerHTML =
      `<span class="day-number">
        ${date.getDate()}
      </span>`;


    const dayEvents =
      events[key] || [];


    dayEvents.forEach(
      event => {

        cell.innerHTML +=
          `
          <span class="day-dot"></span>

          <div class="day-event">
            ${escapeHTML(event.project)}
            ·
            ${formatTime(event.time)}
          </div>
          `;

      }
    );


    calendar.appendChild(cell);

  }


  renderFinishedList();

}


function renderFinishedList() {

  const list =
    $("finishedList");


  const projects = [];


  state.projects.forEach(
    project => {

      (project.finished || [])
        .forEach(event => {

          projects.push({

            project:
              project.name,

            date:
              event.date,

            time:
              event.time

          });

        });

    }
  );


  projects.sort(
    (a,b) =>
      b.date.localeCompare(
        a.date
      )
  );


  if (!projects.length) {

    list.innerHTML =
      `
      <p class="muted">
        No finished projects yet.
        Mark one finished from the
        Studio page.
      </p>
      `;

    return;

  }


  list.innerHTML =
    projects
      .map(
        project =>
          `
          <div class="finish-item">

            <span>
              ♡ ${escapeHTML(project.project)}
            </span>

            <small>
              ${project.date}
              ·
              ${formatTime(project.time)}
            </small>

          </div>
          `
      )
      .join("");

}


function escapeHTML(text) {

  return String(text)
    .replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[character])
    );

}


$("prevMonth").onclick = () => {

  calendarDate.setMonth(
    calendarDate.getMonth() - 1
  );

  renderCalendar();

};


$("nextMonth").onclick = () => {

  calendarDate.setMonth(
    calendarDate.getMonth() + 1
  );

  renderCalendar();

};


$("calendarToday").onclick = () => {

  calendarDate =
    new Date();

  renderCalendar();

};


// ======================================================
// FINISH PROJECT
// ======================================================

$("finishProjectBtn").onclick = () => {

  const project =
    currentProject();


  const date =
    getDateKey(new Date());


  const time =
    getProjectTime(project);


  if (!project.finished)
    project.finished = [];


  project.finished =
    project.finished.filter(
      event =>
        event.date !== date
    );


  project.finished.push({

    date: date,

    time: time

  });


  save(true);

  renderCalendar();


  showToastMessage(
    "Finished piece added to calendar ♡"
  );

};


// ======================================================
// DRAWING BOARD
// ======================================================

function initCanvas() {

  const canvas =
    $("designCanvas");


  if (drawing.canvas === canvas)
    return;


  drawing.canvas =
    canvas;

  drawing.ctx =
    canvas.getContext("2d");


  resizeCanvas();


  if (currentProject().drawing) {

    const image =
      new Image();


    image.onload = () => {

      drawing.ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

    };


    image.src =
      currentProject().drawing;

  }


  function getPointerPosition(event) {

    const rect =
      canvas.getBoundingClientRect();


    return {

      x:
        (event.clientX - rect.left)
        *
        canvas.width /
        rect.width,

      y:
        (event.clientY - rect.top)
        *
        canvas.height /
        rect.height

    };

  }


  canvas.onpointerdown =
    event => {

      canvas.setPointerCapture(
        event.pointerId
      );


      const position =
        getPointerPosition(event);


      drawing.drawing = true;

      drawing.lastX =
        position.x;

      drawing.lastY =
        position.y;

    };


  canvas.onpointermove =
    event => {

      if (!drawing.drawing)
        return;


      const position =
        getPointerPosition(event);


      const ctx =
        drawing.ctx;


      ctx.beginPath();

      ctx.moveTo(
        drawing.lastX,
        drawing.lastY
      );

      ctx.lineTo(
        position.x,
        position.y
      );


      ctx.lineWidth =
        Number(
          $("brushSize").value
        );


      ctx.lineCap =
        "round";

      ctx.lineJoin =
        "round";


      ctx.strokeStyle =
        drawing.eraser
          ? "#ffffff"
          : $("brushColor").value;


      ctx.stroke();


      drawing.lastX =
        position.x;

      drawing.lastY =
        position.y;

    };


  canvas.onpointerup =
  canvas.onpointercancel =
    () => {

      drawing.drawing = false;

      saveDrawing();

    };

}


function resizeCanvas() {

  const canvas =
    $("designCanvas");


  if (!canvas)
    return;


  const rect =
    canvas.getBoundingClientRect();


  const ratio =
    window.devicePixelRatio || 1;


  canvas.width =
    rect.width * ratio;

  canvas.height =
    rect.height * ratio;


  drawing.ctx =
    canvas.getContext("2d");

}


function saveDrawing() {

  try {

    currentProject().drawing =
      $("designCanvas")
        .toDataURL("image/png");


    save();

  }

  catch (error) {

    console.log(
      "Could not save drawing",
      error
    );

  }

}


$("clearDrawing").onclick = () => {

  if (
    confirm(
      "Clear this design sketch?"
    )
  ) {

    const canvas =
      $("designCanvas");


    const ctx =
      canvas.getContext("2d");


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    currentProject().drawing =
      null;


    save(true);

  }

};


$("eraserBtn").onclick = () => {

  drawing.eraser =
    !drawing.eraser;


  $("eraserBtn")
    .textContent =
    drawing.eraser
      ? "Eraser: on"
      : "Eraser";

};


$("downloadDrawing").onclick = () => {

  saveDrawing();


  const link =
    document.createElement("a");


  link.download =
    currentProject().name +
    "-design.png";


  link.href =
    $("designCanvas")
      .toDataURL("image/png");


  link.click();

};


// ======================================================
// AUTO SAVE TIMER DISPLAY
// ======================================================

setInterval(
  () => {

    renderHome();

  },
  1000
);


// ======================================================
// START APP
// ======================================================

renderAll();