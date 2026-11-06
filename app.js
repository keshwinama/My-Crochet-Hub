
const $ = id => document.getElementById(id);
const STORE = "stitchBloom40";

const prompts = [
  "Make a tiny crochet creature with a very big personality.",
  "Design a colour palette inspired by your favourite dessert.",
  "Try a stitch you've never used before.",
  "Make something small enough to finish in one afternoon.",
  "Create a project using only three colours.",
  "Invent a flower that doesn't exist in nature.",
  "Turn a leftover yarn scrap into something useful.",
  "Make a mini version of something you love.",
  "Give your current project a silly name.",
  "Sketch your dream crochet outfit."
];

const tutorials = [
  ["🪢","Chain stitch","The foundation of many crochet projects. Make a slip knot, yarn over and pull through the loop.","https://www.youtube.com/results?search_query=how+to+crochet+chain+stitch"],
  ["➰","Slip stitch","A small joining stitch, useful for joining rounds and moving across stitches.","https://www.youtube.com/results?search_query=how+to+crochet+slip+stitch"],
  ["🌱","Single crochet","A compact stitch that creates a neat, firm fabric.","https://www.youtube.com/results?search_query=how+to+crochet+single+crochet"],
  ["🌷","Half double crochet","A stitch with a little more height than single crochet.","https://www.youtube.com/results?search_query=how+to+crochet+half+double+crochet"],
  ["🌼","Double crochet","A taller stitch often used in blankets, garments and granny squares.","https://www.youtube.com/results?search_query=how+to+crochet+double+crochet"],
  ["🌀","Magic ring","A way to begin crocheting in the round with a closed centre.","https://www.youtube.com/results?search_query=how+to+crochet+magic+ring"],
  ["🧶","Granny square","A classic motif that can become blankets, bags and clothing.","https://www.youtube.com/results?search_query=how+to+crochet+granny+square"],
  ["🕸️","Mesh stitch","An open, airy stitch pattern for lightweight crochet projects.","https://www.youtube.com/results?search_query=how+to+crochet+mesh+stitch"]
];

const defaults = {
  profile: { name: "Crochet Club", avatar: "🐸" },
  theme: "sage", customAccent: "#ee8ba7", dark: false, sound: true, animations: true,
  projects: [], patterns: [], memories: [], photos: [], wishlist: [],
  yarn: ["#f2a6b8","#f7d9a7","#c7d9bd","#d9c8ed"].map((c,i)=>({color:c,name:["Strawberry","Buttercream","Sage","Lilac"][i]})),
  paletteNotes: "", rows: {}, repeatSize: 4, repeatOffset: 0,
  timerSeconds: 0, totalMinutes: 0, grid: [], gridCols: 12, gridRows: 12,
  calendarDate: new Date().toISOString().slice(0,10), widgetOrder: ["projects","prompt","memory","stickers"]
};

let data;
try { data = { ...structuredClone(defaults), ...JSON.parse(localStorage.getItem(STORE) || "{}") }; }
catch { data = structuredClone(defaults); }

let timerInterval = null;
let timerRunning = false;
let timerStartedAt = 0;
let activeMonth = new Date();

function save() {
  try { localStorage.setItem(STORE, JSON.stringify(data)); }
  catch { toast("Storage is full. Try removing some large photos."); }
}
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toast.timeout); toast.timeout = setTimeout(()=>el.classList.remove("show"),2300);
}
function sound() {
  if (!data.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 660; gain.gain.value = .045;
    osc.start(); osc.stop(ctx.currentTime + .07);
    osc.onended = () => ctx.close();
  } catch {}
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function todayString() {
  return new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
}
function applyTheme() {
  const themes = {
    sage: ["#df8298","#bd5d79"],
    berry: ["#e66b91","#bf3c6b"],
    lavender: ["#a88acb","#8061a9"],
    sunshine: ["#e9ad4e","#bd812b"]
  };
  const pair = themes[data.theme] || [data.customAccent,data.customAccent];
  document.documentElement.style.setProperty("--accent",pair[0]);
  document.documentElement.style.setProperty("--accent-dark",pair[1]);
  document.body.classList.toggle("dark",!!data.dark);
  document.body.classList.toggle("no-motion",!data.animations);
}
function setPage(page) {
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const names = {home:"The scrapbook ✿",projects:"My projects 🧶",counter:"Row counter 🔢",patterns:"Pattern notebook 📒",palette:"Yarn studio 🎨",grid:"Fillet crochet grid ▦",tutorials:"Stitch library 🪡",wishlist:"The wishlist 🛍️",calendar:"Memories calendar 📅",settings:"My little settings ⚙️"};
  $("pageTitle").textContent = names[page] || "Stitch & Bloom";
  if(page==="calendar") renderCalendar();
  if(page==="counter") renderCounter();
  window.scrollTo({top:0,behavior:"smooth"});
}
function openModal(html) {
  $("modalContent").innerHTML = html;
  $("modalBackdrop").classList.add("open");
}
function closeModal() { $("modalBackdrop").classList.remove("open"); }
function readImage(file, callback) {
  if(!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function renderHome() {
  $("todayLabel").textContent = todayString().toUpperCase();
  $("profileName").textContent = data.profile.name;
  $("smallAvatar").textContent = data.profile.avatar;
  $("topAvatar").textContent = data.profile.avatar;
  const active = data.projects.filter(p=>!p.finished);
  $("statProjects").textContent = active.length;
  $("statRows").textContent = Object.values(data.rows).reduce((a,b)=>a+(Number(b)||0),0);
  $("statFinished").textContent = data.projects.filter(p=>p.finished).length;
  $("statMinutes").textContent = data.totalMinutes || 0;
  $("homeProjects").innerHTML = active.length ? active.slice(0,4).map(p=>`
    <div class="mini-project"><span class="project-emoji">${escapeHTML(p.emoji||"🧶")}</span><div><strong>${escapeHTML(p.name)}</strong><small>${Number(p.progress)||0}% complete</small></div></div>`).join("") : `<p class="empty-state">Your next masterpiece goes here. ✨</p>`;
  $("memoryList").innerHTML = data.memories.slice(-3).reverse().map(m=>`<div class="memory-note">${escapeHTML(m.text)}</div>`).join("");
  $("homeGallery").innerHTML = data.photos.length ? data.photos.slice(-6).reverse().map(p=>`<div class="gallery-photo"><img src="${p.src}" alt="Crochet memory"><small>${escapeHTML(p.caption||"A little memory ♡")}</small></div>`).join("") : `<div class="gallery-placeholder">Your project memories will live here. Take photos as you go! 📸</div>`;
  $("promptText").textContent = data.dailyPrompt || prompts[Math.floor(Math.random()*prompts.length)];
  renderStickerTray();
  arrangeWidgets();
}
function renderStickerTray() {
  $("stickerTray").querySelectorAll("button").forEach(btn=>btn.onclick=()=>placeSticker(btn.textContent));
}
function placeSticker(emoji) {
  const el=document.createElement("span"); el.className="floating-deco"; el.textContent=emoji;
  el.style.left=(8+Math.random()*82)+"vw"; el.style.top=(12+Math.random()*75)+"vh";
  $("stickerLayer").appendChild(el);
  setTimeout(()=>el.remove(),4500); sound();
}
function arrangeWidgets() {
  const parent=document.querySelector(".home-columns");
  data.widgetOrder.forEach(name=>{
    const el=document.querySelector(`[data-widget="${name}"]`);
    if(el) parent.appendChild(el);
  });
}
function setupDragDrop() {
  let dragged=null;
  document.querySelectorAll(".widget").forEach(widget=>{
    widget.addEventListener("dragstart",()=>{dragged=widget;widget.classList.add("dragging");});
    widget.addEventListener("dragend",()=>{widget.classList.remove("dragging");});
    widget.addEventListener("dragover",e=>e.preventDefault());
    widget.addEventListener("drop",e=>{
      e.preventDefault();
      if(!dragged||dragged===widget)return;
      const parent=widget.parentNode;
      const children=[...parent.children];
      if(children.indexOf(dragged)<children.indexOf(widget)) parent.insertBefore(dragged,widget.nextSibling);
      else parent.insertBefore(dragged,widget);
      data.widgetOrder=[...parent.children].map(x=>x.dataset.widget);
      save();
    });
  });
}
function renderProjects() {
  $("projectGrid").innerHTML = data.projects.length ? data.projects.map(p=>`
    <article class="project-card">
      <div class="project-cover">${p.photo?`<img src="${p.photo}" alt="">`:escapeHTML(p.emoji||"🧶")}</div>
      <div class="project-body"><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description||"A work in progress.")}</p>
      <div class="progress-track"><div style="width:${Math.min(100,Math.max(0,Number(p.progress)||0))}%"></div></div>
      <div class="project-meta"><span>${p.finished?"Finished ✨":"In progress"}</span><strong>${Number(p.progress)||0}%</strong></div>
      <div class="card-actions"><button data-edit="${p.id}">Edit</button><button data-photo="${p.id}">Add photo</button><button data-finish="${p.id}">${p.finished?"Reopen":"Finish ✿"}</button><button data-delete="${p.id}">Delete</button></div></div>
    </article>`).join("") : `<div class="gallery-placeholder">No projects yet. Tap “New project” to start your crochet story! 🧶</div>`;
  $("projectGrid").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>projectModal(b.dataset.edit));
  $("projectGrid").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteProject(b.dataset.delete));
  $("projectGrid").querySelectorAll("[data-finish]").forEach(b=>b.onclick=()=>{const p=data.projects.find(x=>x.id===b.dataset.finish);p.finished=!p.finished;if(p.finished)p.progress=100;save();renderAll();toast(p.finished?"Project finished! You did it! ✨":"Project reopened.");});
  $("projectGrid").querySelectorAll("[data-photo]").forEach(b=>b.onclick=()=>projectPhoto(b.dataset.photo));
}
function projectModal(id=null) {
  const p=data.projects.find(x=>x.id===id)||{name:"",description:"",emoji:"🧶",progress:0};
  openModal(`<h2>${id?"Edit your project":"A new project!"}</h2>
    <label>Project name<input id="pName" value="${escapeHTML(p.name)}" placeholder="e.g. Strawberry tote bag"></label>
    <label>Little description<textarea id="pDesc">${escapeHTML(p.description||"")}</textarea></label>
    <label>Emoji / project icon<input id="pEmoji" value="${escapeHTML(p.emoji||"🧶")}" maxlength="4"></label>
    <label>Progress (%)<input id="pProgress" type="number" min="0" max="100" value="${Number(p.progress)||0}"></label>
    <div class="modal-actions"><button class="primary-button" id="saveProject">Save project ♡</button></div>`);
  $("saveProject").onclick=()=>{
    const name=$("pName").value.trim(); if(!name){toast("Give your project a name first!");return;}
    const item={...p,id:p.id||crypto.randomUUID(),name,description:$("pDesc").value,emoji:$("pEmoji").value||"🧶",progress:Math.min(100,Math.max(0,Number($("pProgress").value)||0)),finished:p.finished||false};
    if(id)data.projects=data.projects.map(x=>x.id===id?item:x);else data.projects.push(item);
    save();closeModal();renderAll();toast("Project saved! ✨");sound();
  };
}
function deleteProject(id) {
  if(!confirm("Delete this project?"))return;
  data.projects=data.projects.filter(p=>p.id!==id);delete data.rows[id];save();renderAll();toast("Project removed.");
}
function projectPhoto(id) {
  openModal(`<h2>Add a project photo 📸</h2><p class="helper-text">Choose a photo from your device.</p><label>Photo<input id="projectImage" type="file" accept="image/*"></label><button class="primary-button" id="saveProjectImage">Add photo</button>`);
  $("saveProjectImage").onclick=()=>{
    const file=$("projectImage").files[0];if(!file){toast("Choose a photo first.");return;}
    readImage(file,src=>{const p=data.projects.find(x=>x.id===id);p.photo=src;save();closeModal();renderAll();toast("Photo added!");});
  };
}
function renderCounter() {
  const select=$("counterProject");
  const old=select.value;
  select.innerHTML=data.projects.length?data.projects.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join(""):`<option value="">Create a project first</option>`;
  if(data.projects.some(p=>p.id===old))select.value=old;
  const id=select.value;
  $("rowNumber").textContent=id?(data.rows[id]||0):0;
  updateRepeat();
}
function selectedProject() { return $("counterProject").value; }
function changeRows(amount) {
  const id=selectedProject();if(!id){toast("Create a project first!");return;}
  data.rows[id]=Math.max(0,(data.rows[id]||0)+amount);
  save();renderCounter();renderHome();sound();
}
function updateRepeat() {
  const size=Math.max(1,Number($("repeatSize").value)||1);
  const rows=data.rows[selectedProject()]||0;
  const inRepeat=rows%size;
  $("repeatFill").style.width=(inRepeat/size*100)+"%";
  $("repeatLabel").textContent=`${inRepeat} of ${size} rows in this repeat${inRepeat===0&&rows>0?" — repeat complete!":""}`;
}
function updateTimerDisplay() {
  const total=data.timerSeconds||0;
  const h=String(Math.floor(total/3600)).padStart(2,"0");
  const m=String(Math.floor(total%3600/60)).padStart(2,"0");
  const s=String(total%60).padStart(2,"0");
  $("timerDisplay").textContent=`${h}:${m}:${s}`;
}
function startTimer() {
  if(timerRunning)return;
  timerRunning=true;timerStartedAt=Date.now();
  timerInterval=setInterval(()=>{
    data.timerSeconds++;
    if(data.timerSeconds%60===0){data.totalMinutes++;save();renderHome();}
    updateTimerDisplay();
  },1000);
}
function stopTimer() {
  if(!timerRunning)return;
  clearInterval(timerInterval);timerRunning=false;
  const elapsed=Math.floor((Date.now()-timerStartedAt)/60000);
  if(elapsed>0){data.totalMinutes+=elapsed;save();renderHome();}
}
function renderPatterns() {
  $("patternList").innerHTML=data.patterns.length?data.patterns.map(p=>`<div class="pattern-item"><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.body)}</p><button class="text-button" data-pattern-delete="${p.id}">Delete pattern ×</button></div>`).join(""):`<p class="empty-state">Your pattern notebook is waiting for its first idea. 📒</p>`;
  $("patternList").querySelectorAll("[data-pattern-delete]").forEach(b=>b.onclick=()=>{data.patterns=data.patterns.filter(p=>p.id!==b.dataset.patternDelete);save();renderPatterns();});
}
function patternModal() {
  openModal(`<h2>New pattern note 📒</h2><label>Pattern title<input id="patternTitle" placeholder="e.g. My flower granny square"></label><label>Pattern instructions<textarea id="patternBody" rows="8" placeholder="Round 1: ...&#10;Round 2: ..."></textarea></label><button class="primary-button" id="savePattern">Save to notebook</button>`);
  $("savePattern").onclick=()=>{const title=$("patternTitle").value.trim();if(!title){toast("Add a title first!");return;}data.patterns.push({id:crypto.randomUUID(),title,body:$("patternBody").value});save();closeModal();renderPatterns();toast("Pattern saved!");};
}
function renderPalette() {
  $("yarnPalette").innerHTML=data.yarn.map((y,i)=>`<div class="yarn-swatch"><button style="background:${y.color}" title="${escapeHTML(y.name)}" data-swatch="${i}"></button>${escapeHTML(y.name)}<br><button class="text-button" data-remove-swatch="${i}">remove</button></div>`).join("");
  $("yarnPalette").querySelectorAll("[data-remove-swatch]").forEach(b=>b.onclick=()=>{data.yarn.splice(Number(b.dataset.removeSwatch),1);save();renderPalette();});
  $("paletteNotes").value=data.paletteNotes||"";
}
function addYarn() {
  if(data.yarn.length>=12){toast("Your palette is full! Remove a colour to add another.");return;}
  data.yarn.push({color:$("yarnColour").value,name:$("colourName").value.trim()||"Mystery yarn"});
  $("colourName").value="";save();renderPalette();toast("A new colour! 🎨");sound();
}
function randomPalette() {
  const palettes=[
    [["#f4b7c5","Blush"],["#f4d99b","Butter"],["#b7cdb2","Sage"],["#b7a4d2","Lilac"]],
    [["#ed8798","Berry"],["#f6c3a5","Peach"],["#d3d9a2","Pistachio"],["#a8c6d7","Sky"]],
    [["#f6e9d3","Oat"],["#c47b79","Terracotta"],["#e7b9c5","Rose"],["#839b82","Moss"]]
  ];
  data.yarn=palettes[Math.floor(Math.random()*palettes.length)].map(([color,name])=>({color,name}));
  save();renderPalette();toast("Fresh colour inspiration! ✨");
}
function renderGrid() {
  const cols=data.gridCols,rows=data.gridRows;
  $("gridCols").value=cols;$("gridRows").value=rows;
  $("filletGrid").style.gridTemplateColumns=`repeat(${cols}, minmax(14px,30px))`;
  if(data.grid.length!==cols*rows)data.grid=Array(cols*rows).fill(false);
  $("filletGrid").innerHTML=data.grid.map((filled,i)=>`<button class="${filled?"filled":""}" data-cell="${i}" aria-label="Grid square ${i+1}"></button>`).join("");
  $("filletGrid").querySelectorAll("[data-cell]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.cell);data.grid[i]=!data.grid[i];b.classList.toggle("filled",data.grid[i]);save();
  });
}
function renderTutorials() {
  $("tutorialGrid").innerHTML=tutorials.map(t=>`<article class="tutorial-card"><div class="tutorial-icon">${t[0]}</div><h3>${t[1]}</h3><p>${t[2]}</p><a href="${t[3]}" target="_blank" rel="noopener">Find a video tutorial ↗</a></article>`).join("");
}
function renderWishlist() {
  $("wishlistItems").innerHTML=data.wishlist.length?data.wishlist.map((w,i)=>`<div class="wishlist-item"><span>♡ ${escapeHTML(w)}</span><button data-wish="${i}">Remove ×</button></div>`).join(""):`<p class="empty-state">Your yarn dreams go here. 💭</p>`;
  $("wishlistItems").querySelectorAll("[data-wish]").forEach(b=>b.onclick=()=>{data.wishlist.splice(Number(b.dataset.wish),1);save();renderWishlist();});
}
function addWish() {
  const v=$("wishInput").value.trim();if(!v)return;
  data.wishlist.push(v);$("wishInput").value="";save();renderWishlist();toast("Added to your wishlist!");
}
function renderCalendar() {
  const y=activeMonth.getFullYear(),m=activeMonth.getMonth();
  $("monthLabel").textContent=activeMonth.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const today=new Date();
  let html=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="calendar-day head">${d}</div>`).join("");
  for(let i=0;i<first;i++)html+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const date=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const has=data.memories.some(x=>x.date===date)||data.photos.some(x=>x.date===date);
    const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+=`<div class="calendar-day ${has?"has-memory":""} ${isToday?"today":""}" title="${has?"You saved a memory this day":""}">${d}${has?" ♡":""}</div>`;
  }
  $("calendarGrid").innerHTML=html;
}
function renderPhotos() {
  $("photoGallery").innerHTML=data.photos.length?data.photos.slice().reverse().map(p=>`<div class="gallery-photo"><img src="${p.src}" alt="Saved crochet memory"><small>${escapeHTML(p.caption||"A little memory ♡")}</small></div>`).join(""):`<p class="empty-state">Your photo memories will appear here. 📷</p>`;
}
function saveMemory() {
  const text=$("memoryInput").value.trim();if(!text)return;
  data.memories.push({text,date:new Date().toISOString().slice(0,10)});
  $("memoryInput").value="";save();renderHome();renderCalendar();toast("Memory tucked into your jar. ♡");sound();
}
function renderSettings() {
  $("nameSetting").value=data.profile.name;
  $("avatarSetting").value=data.profile.avatar;
  $("darkMode").checked=!!data.dark;
  $("soundSetting").checked=!!data.sound;
  $("animationSetting").checked=!!data.animations;
  $("customAccent").value=data.customAccent||"#ee8ba7";
}
function saveProfile() {
  data.profile.name=$("nameSetting").value.trim()||"Crochet Club";
  data.profile.avatar=$("avatarSetting").value;
  save();renderHome();toast("Your profile is updated!");
}
function exportBackup() {
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="stitch-and-bloom-backup.json";a.click();URL.revokeObjectURL(url);
  toast("Your backup is ready!");
}
function importBackup(file) {
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try {
      const incoming=JSON.parse(reader.result);
      if(!incoming||!Array.isArray(incoming.projects))throw new Error("Invalid backup");
      data={...structuredClone(defaults),...incoming};
      save();applyTheme();renderAll();renderSettings();toast("Backup imported! Welcome back. ♡");
    } catch {toast("That file doesn't look like a Stitch & Bloom backup.");}
  };
  reader.readAsText(file);
}
function renderAll() {
  renderHome();renderProjects();renderCounter();renderPatterns();renderPalette();
  renderGrid();renderTutorials();renderWishlist();renderPhotos();renderSettings();
  updateTimerDisplay();applyTheme();
}

document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.go)));
$("addProject").onclick=()=>projectModal();
$("rowPlus").onclick=()=>changeRows(1);
$("rowMinus").onclick=()=>changeRows(-1);
$("counterProject").onchange=renderCounter;
$("repeatSize").onchange=()=>{data.repeatSize=Math.max(1,Number($("repeatSize").value)||1);save();updateRepeat();};
$("resetRows").onclick=()=>{const id=selectedProject();if(id&&confirm("Reset this project's row count?")){data.rows[id]=0;save();renderCounter();renderHome();}};
$("resetRepeat").onclick=()=>{const id=selectedProject();if(id){data.rows[id]=0;save();renderCounter();renderHome();}};
$("timerStart").onclick=startTimer;
$("timerStop").onclick=stopTimer;
$("timerReset").onclick=()=>{stopTimer();data.timerSeconds=0;updateTimerDisplay();save();};
$("addPattern").onclick=patternModal;
$("addColour").onclick=addYarn;
$("randomPalette").onclick=randomPalette;
$("savePaletteNotes").onclick=()=>{data.paletteNotes=$("paletteNotes").value;save();toast("Palette notes saved!");};
$("resizeGrid").onclick=()=>{
  data.gridCols=Math.min(30,Math.max(4,Number($("gridCols").value)||12));
  data.gridRows=Math.min(30,Math.max(4,Number($("gridRows").value)||12));
  data.grid=Array(data.gridCols*data.gridRows).fill(false);save();renderGrid();
};
$("clearGrid").onclick=()=>{data.grid=Array(data.gridCols*data.gridRows).fill(false);save();renderGrid();};
$("addWish").onclick=addWish;
$("wishInput").addEventListener("keydown",e=>{if(e.key==="Enter")addWish();});
$("saveMemory").onclick=saveMemory;
$("newPrompt").onclick=$("randomPrompt").onclick=()=>{
  data.dailyPrompt=prompts[Math.floor(Math.random()*prompts.length)];
  $("promptText").textContent=data.dailyPrompt;save();sound();
};
$("stickerToggle").onclick=()=>{setPage("home");toast("Choose a sticker from your tray to decorate! 🌼");};
$("topAvatar").onclick=()=>setPage("settings");
$("prevMonth").onclick=()=>{activeMonth.setMonth(activeMonth.getMonth()-1);renderCalendar();};
$("nextMonth").onclick=()=>{activeMonth.setMonth(activeMonth.getMonth()+1);renderCalendar();};
$("memoryPhotos").onchange=e=>{
  [...e.target.files].forEach(file=>readImage(file,src=>{
    data.photos.push({src,caption:file.name,date:new Date().toISOString().slice(0,10)});
    save();renderPhotos();renderHome();renderCalendar();
  }));
  e.target.value="";
};
$("saveProfile").onclick=saveProfile;
$("darkMode").onchange=e=>{data.dark=e.target.checked;save();applyTheme();};
$("soundSetting").onchange=e=>{data.sound=e.target.checked;save();};
$("animationSetting").onchange=e=>{data.animations=e.target.checked;save();applyTheme();};
$("soundToggle").onclick=()=>{data.sound=!data.sound;save();$("soundToggle").textContent=data.sound?"🔊 Sounds on":"🔇 Sounds off";$("soundSetting").checked=data.sound;sound();};
document.querySelectorAll("[data-theme]").forEach(b=>b.onclick=()=>{
  data.theme=b.dataset.theme;save();applyTheme();toast("New theme, new energy! ✨");
});
$("customAccent").onchange=e=>{data.theme="custom";data.customAccent=e.target.value;save();applyTheme();};
$("exportData").onclick=exportBackup;
$("importData").onchange=e=>{importBackup(e.target.files[0]);e.target.value="";};
$("modalClose").onclick=closeModal;
$("modalBackdrop").onclick=e=>{if(e.target===$("modalBackdrop"))closeModal();};

document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
$("soundToggle").textContent=data.sound?"🔊 Sounds on":"🔇 Sounds off";
$("repeatSize").value=data.repeatSize||4;
$("paletteNotes").value=data.paletteNotes||"";
renderAll();
setupDragDrop();
