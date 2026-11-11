
const KEY = 'stitchBloom5Data';

const blank = () => ({
    projects: [],
    events: [],
    yarn: [],
    patterns: [],
    stitches: [
        {
            name: 'Single crochet',
            abbr: 'SC',
            category: 'Beginner',
            difficulty: 'Beginner',
            instructions: 'Insert hook into stitch, yarn over and pull up a loop. Yarn over and pull through both loops.',
            notes: 'Creates a short, dense fabric.'
        },
        {
            name: 'Half double crochet',
            abbr: 'HDC',
            category: 'Beginner',
            difficulty: 'Beginner',
            instructions: 'Yarn over, insert hook, yarn over and pull up a loop. Yarn over and pull through all three loops.',
            notes: ''
        },
        {
            name: 'Double crochet',
            abbr: 'DC',
            category: 'Beginner',
            difficulty: 'Beginner',
            instructions: 'Yarn over, insert hook, yarn over and pull up a loop. Yarn over and pull through two loops, then yarn over and pull through the remaining two.',
            notes: ''
        },
        {
            name: 'Treble crochet',
            abbr: 'TR',
            category: 'Intermediate',
            difficulty: 'Intermediate',
            instructions: 'Yarn over twice, insert hook, yarn over and pull up a loop. Work through two loops at a time three times.',
            notes: ''
        }
    ],
    counter: {
        value: 0,
        target: 0,
        notes: []
    },
    counterSections: [],
    timerSeconds: 0,
    timerRunning: false,
    timerStarted: null,
    logs: [],
    grid: {
        rows: 20,
        cols: 20,
        cells: []
    },
    sketches: [],
    settings: {}
});

let data;

try {
    data = {
        ...blank(),
        ...JSON.parse(localStorage.getItem(KEY) || '{}')
    };
} catch {
    data = blank();
}

const save = () =>
    localStorage.setItem(KEY, JSON.stringify(data));

const $ = s => document.querySelector(s);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

const today = new Date();

let page = 'home';
let calendarDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
);

let timerInterval = null;
let activeProject = '';

const titleMap = {
    home: 'Good day, maker ✿',
    projects: 'My projects',
    counter: 'Row counter',
    timer: 'Crochet timer',
    stash: 'Yarn stash',
    patterns: 'Pattern library',
    stitches: 'Stitch dictionary',
    grid: 'Fillet crochet designer',
    calendar: 'Crochet calendar',
    calculators: 'Crochet calculators',
    sketchbook: 'Sketchbook & design studio',
    stats: 'Your crochet journey'
};

$('#today-label').textContent = today.toLocaleDateString(
    undefined,
    {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }
);

const uid = () =>
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);

const empty = (
    msg,
    sub = 'Add your first entry to get started.'
) => `
    <div class="empty">
        <b>${msg}</b>
        ${sub}
    </div>
`;

const section = (name, sub, btn = '') => `
    <div class="section-head">
        <div>
            <h2>${name}</h2>
            <p>${sub}</p>
        </div>
        ${btn}
    </div>
`;

function go(p) {
    page = p;

    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.page === p);
    });

    $('#page-title').textContent = titleMap[p];
    $('#eyebrow').textContent =
        p === 'home'
            ? 'YOUR CREATIVE SPACE'
            : 'STITCH & BLOOM STUDIO';

    render();
}

$('#navigation').addEventListener('click', e => {
    const b = e.target.closest('[data-page]');
    if (b) go(b.dataset.page);
});

$('#quick-add').onclick = () => openEditor('project');

function openEditor(type, item = null, extra = {}) {

    const schemas = {

        project: [
            ['name', 'Project name', 'text', true],
            ['category', 'Category', 'select', false,
                ['Clothing', 'Accessories', 'Plushies', 'Home decor', 'Other']],
            ['status', 'Status', 'select', false,
                ['Planning', 'In Progress', 'Paused', 'Completed']],
            ['difficulty', 'Difficulty', 'select', false,
                ['Beginner', 'Intermediate', 'Advanced']],
            ['start', 'Start date', 'date'],
            ['completion', 'Completion date', 'date'],
            ['cover', 'Cover photo URL', 'url'],
            ['pattern', 'Pattern / tutorial link', 'url'],
            ['yarnInfo', 'Yarn information', 'text'],
            ['hook', 'Hook size', 'text'],
            ['notes', 'Personal notes', 'textarea']
        ],

        event: [
            ['title', 'Event title', 'text', true],
            ['date', 'Date', 'date', true],
            ['time', 'Time', 'time'],
            ['kind', 'Type', 'select', false,
                ['Crochet session', 'Deadline', 'Reminder', 'Project milestone', 'Other']],
            ['project', 'Related project', 'select', false,
                data.projects.map(x => x.name)],
            ['notes', 'Notes', 'textarea']
        ],

        yarn: [
            ['name', 'Yarn name', 'text', true],
            ['colour', 'Colour', 'text'],
            ['weight', 'Weight', 'text'],
            ['amount', 'Amount per ball', 'text'],
            ['material', 'Material', 'text'],
            ['quantity', 'Number of balls', 'number'],
            ['hook', 'Suggested hook', 'text'],
            ['status', 'Status', 'select', false,
                ['Available', 'Reserved', 'Used up']],
            ['notes', 'Notes', 'textarea']
        ],

        pattern: [
            ['name', 'Pattern name', 'text', true],
            ['category', 'Category', 'select', false,
                ['Clothing', 'Accessories', 'Plushies', 'Home decor', 'Other']],
            ['type', 'Resource type', 'select', false,
                ['PDF', 'YouTube tutorial', 'Website', 'My own design', 'Photo']],
            ['url', 'Link', 'url'],
            ['difficulty', 'Difficulty', 'select', false,
                ['Beginner', 'Intermediate', 'Advanced']],
            ['favourite', 'Favourite?', 'select', false,
                ['No', 'Yes']],
            ['notes', 'Pattern notes', 'textarea']
        ],

        stitch: [
            ['name', 'Stitch name', 'text', true],
            ['abbr', 'Abbreviation', 'text'],
            ['category', 'Category', 'select', false,
                ['Beginner', 'Intermediate', 'Advanced', 'Decorative', 'Lace']],
            ['difficulty', 'Difficulty', 'select', false,
                ['Beginner', 'Intermediate', 'Advanced']],
            ['instructions', 'Step-by-step instructions', 'textarea'],
            ['notes', 'Extra notes', 'textarea']
        ],

        note: [
            ['text', 'Row note', 'text', true]
        ],

        manualTime: [
            ['minutes', 'Minutes to add', 'number', true],
            ['date', 'Date', 'date']
        ],

        sketch: [
            ['name', 'Sketch name', 'text', true],
            ['notes', 'Design notes', 'textarea']
        ]
    };

    const schema = schemas[type];

    if (!schema) return;

    const names = {
        project: 'project',
        event: 'calendar event',
        yarn: 'yarn',
        pattern: 'pattern',
        stitch: 'stitch',
        note: 'row note',
        manualTime: 'crochet time',
        sketch: 'sketch'
    };

    $('#dialog-title').textContent =
        (item ? 'Edit ' : 'Add ') + names[type];

    $('#dialog-fields').innerHTML = schema.map(
        ([key, label, kind, required, opts]) => {

            const val = item?.[key] ?? extra[key] ?? '';

            let control;

            if (kind === 'select') {
                control = `
                    <select name="${key}">
                        ${(opts || []).map(o => `
                            <option ${String(val) === o ? 'selected' : ''}>
                                ${esc(o)}
                            </option>
                        `).join('')}
                    </select>
                `;
            } else if (kind === 'textarea') {
                control = `
                    <textarea name="${key}">${esc(val)}</textarea>
                `;
            } else {
                control = `
                    <input
                        class="field"
                        name="${key}"
                        type="${kind}"
                        value="${esc(val)}"
                        ${required ? 'required' : ''}
                    >
                `;
            }

            return `
                <div class="form-field ${kind === 'textarea' ? 'full' : ''}">
                    <label>${label}</label>
                    ${control}
                </div>
            `;
        }
    ).join('');

    $('#editor-dialog').showModal();

    $('#editor-form').onsubmit = e => {
        e.preventDefault();

        const obj = Object.fromEntries(
            new FormData(e.target).entries()
        );

        if (type === 'manualTime') {
            data.logs.push({
                minutes: Number(obj.minutes) || 0,
                date: obj.date || new Date().toISOString().slice(0, 10),
                project: activeProject
            });

        } else if (type === 'note') {

            data.counter.notes.push({
                row: data.counter.value,
                text: obj.text
            });

        } else if (type === 'sketch') {

            data.sketches.push({
                ...obj,
                id: uid(),
                date: new Date().toISOString()
            });

        } else {

            const lists = {
                project: 'projects',
                event: 'events',
                yarn: 'yarn',
                pattern: 'patterns',
                stitch: 'stitches'
            };

            const list = data[lists[type]];

            if (item) {
                Object.assign(item, obj);
            } else {
                list.push({
                    ...obj,
                    id: uid(),
                    created: new Date().toISOString()
                });
            }
        }

        save();
        $('#editor-dialog').close();
        render();
    };
}

function editItem(type, id) {

    const lists = {
        project: 'projects',
        event: 'events',
        yarn: 'yarn',
        pattern: 'patterns',
        stitch: 'stitches'
    };

    const item = data[lists[type]].find(x => x.id === id);

    openEditor(type, item);
}

function del(type, id) {

    if (!confirm('Delete this entry?')) return;

    const lists = {
        project: 'projects',
        event: 'events',
        yarn: 'yarn',
        pattern: 'patterns',
        stitch: 'stitches'
    };

    data[lists[type]] =
        data[lists[type]].filter(x => x.id !== id);

    save();
    render();
}

function projectCard(p) {

    return `
        <article class="item-card">

            <div class="cover">
                ${p.cover
                    ? `<img src="${esc(p.cover)}"
                        onerror="this.parentNode.textContent='🧶'">`
                    : '🧶'}
            </div>

            <div class="item-body">

                <h3>${esc(p.name)}</h3>

                <div class="muted">
                    ${esc(p.category || 'Project')} ·
                    ${esc(p.difficulty || '')}
                </div>

                <span class="pill">${esc(p.status || 'Planning')}</span>

                <p class="muted">
                    ${esc(p.notes || 'No notes added yet.')}
                </p>

                <div class="item-actions">

                    <button class="btn secondary small"
                        onclick="editItem('project','${p.id}')">
                        Edit
                    </button>

                    <button class="btn secondary small"
                        onclick="openProjectDetails('${p.id}')">
                        Details
                    </button>

                    <button class="btn danger small"
                        onclick="del('project','${p.id}')">
                        Delete
                    </button>

                </div>
            </div>
        </article>
    `;
}

function renderHome() {

    const completed = data.projects.filter(
        p => p.status === 'Completed'
    ).length;

    const mins = data.logs.reduce(
        (s, x) => s + (+x.minutes || 0), 0
    ) + Math.floor(data.timerSeconds / 60);

    const recent = data.projects.slice(-3).reverse();

    return `
        <div class="hero">

            <div>
                <span class="eyebrow">A LITTLE SPACE FOR BIG IDEAS</span>

                <h2>Every stitch tells a story.</h2>

                <p>
                    Pick up your hook, make a little progress
                    and enjoy the process.
                </p>

                <div class="item-actions">
                    <button class="btn primary"
                        onclick="openEditor('project')">
                        ＋ New project
                    </button>

                    <button class="btn secondary"
                        onclick="go('calendar')">
                        Open calendar
                    </button>
                </div>
            </div>

            <div class="hero-art">🧶 ✿</div>
        </div>

        <div class="stats-grid">

            <div class="stat-card">
                <small>Total projects</small>
                <strong>${data.projects.length}</strong>
            </div>

            <div class="stat-card">
                <small>Completed projects</small>
                <strong>${completed}</strong>
            </div>

            <div class="stat-card">
                <small>Tracked crochet time</small>
                <strong>${Math.floor(mins / 60)}h ${mins % 60}m</strong>
            </div>

            <div class="stat-card">
                <small>Saved stitches</small>
                <strong>${data.stitches.length}</strong>
            </div>

        </div>

        ${section(
            'Currently on your hook',
            'Your latest projects',
            '<button class="btn secondary" onclick="go(\\'projects\\')">View all</button>'
        )}

        <div class="cards-grid">
            ${recent.length
                ? recent.map(projectCard).join('')
                : empty('Your project shelf is waiting',
                    'Create a project to see it here.')}
        </div>

        <div class="two-col" style="margin-top:18px">

            <div class="panel">
                <h2>Quick tools</h2>
                <div class="item-actions">
                    <button class="btn secondary" onclick="go('counter')">
                        ＋ Row counter
                    </button>

                    <button class="btn secondary" onclick="go('timer')">
                        ◷ Start timer
                    </button>

                    <button class="btn secondary" onclick="go('grid')">
                        ▦ Design a chart
                    </button>
                </div>
            </div>

            <div class="panel">
                <h2>Daily inspiration</h2>
                <p style="font:italic 17px 'Playfair Display';color:#806b9b">
                    “A few stitches are still progress.”
                </p>
            </div>

        </div>
    `;
}

function renderProjects() {

    return `
        ${section(
            'Your project shelf',
            'Create, organise and revisit every project',
            '<button class="btn primary" onclick="openEditor(\\'project\\')">＋ Add project</button>'
        )}

        <div class="cards-grid">
            ${data.projects.length
                ? data.projects.map(projectCard).join('')
                : empty('Nothing on your hook just yet',
                    'Add a project and keep all its details in one place.')}
        </div>
    `;
}

function openProjectDetails(id) {

    const p = data.projects.find(x => x.id === id);

    if (!p) return;

    activeProject = p.name;

    alert(`
${p.name}

Category: ${p.category || '—'}
Status: ${p.status || '—'}
Started: ${p.start || '—'}
Completed: ${p.completion || '—'}
Yarn: ${p.yarnInfo || '—'}
Hook: ${p.hook || '—'}
Pattern: ${p.pattern || '—'}
Notes: ${p.notes || '—'}
    `);
}

// ROW COUNTER

let counterHistory = [];

function renderCounter() {

    const c = data.counter;

    return `
        <div class="counter-layout">

            <div class="panel">

                <div class="eyebrow">CURRENT ROW</div>

                <div class="counter-number" id="counter-number">
                    ${c.value}
                </div>

                <div class="counter-controls">
                    <button onclick="changeCounter(-1)">−</button>
                    <button class="plus" onclick="changeCounter(1)">＋</button>
                </div>

                <div style="text-align:center;margin-top:18px">
                    <button class="btn secondary" onclick="resetCounter()">
                        Reset
                    </button>

                    <button class="btn secondary" onclick="undoCounter()">
                        Undo
                    </button>
                </div>

                <div style="margin-top:20px">
                    <label class="muted">Row target</label>

                    <input class="field"
                        type="number"
                        min="0"
                        value="${c.target || 0}"
                        onchange="data.counter.target=+this.value;save();render()">
                </div>

                ${c.target ? `
                    <div class="progress">
                        <span style="width:${Math.min(100,c.value/c.target*100)}%"></span>
                    </div>
                    <p class="muted">${c.value} of ${c.target} rows</p>
                ` : ''}

            </div>

            <div class="panel">

                <h2>Counter notes</h2>

                <button class="btn primary"
                    onclick="openEditor('note')">
                    ＋ Add note
                </button>

                ${c.notes.slice().reverse().map(n => `
                    <p class="tip">
                        <b>Row ${n.row}:</b> ${esc(n.text)}
                    </p>
                `).join('') || empty('No row notes yet')}

                <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">

                <h2>Section counters</h2>

                <p class="muted">
                    Keep front panel, back panel and sleeves separate.
                </p>

                <input id="section-name"
                    class="field"
                    placeholder="e.g. Front panel">

                <button class="btn secondary"
                    onclick="addCounterSection()">
                    Add section
                </button>

                ${(data.counterSections || []).map((s,i) => `
                    <div class="item-actions"
                        style="align-items:center;justify-content:space-between">

                        <b>${esc(s.name)}</b>

                        <span>
                            <button class="btn secondary small"
                                onclick="sectionChange(${i},-1)">−</button>

                            <b>${s.value}</b>

                            <button class="btn secondary small"
                                onclick="sectionChange(${i},1)">＋</button>
                        </span>

                    </div>
                `).join('')}

            </div>
        </div>
    `;
}

function changeCounter(n) {
    counterHistory.push(data.counter.value);
    data.counter.value = Math.max(0, data.counter.value + n);
    save();
    render();
}

function undoCounter() {
    if (counterHistory.length) {
        data.counter.value = counterHistory.pop();
    }
    save();
    render();
}

function resetCounter() {
    if (confirm('Reset the main row counter to zero?')) {
        counterHistory.push(data.counter.value);
        data.counter.value = 0;
        save();
        render();
    }
}

function addCounterSection() {
    const n = $('#section-name').value.trim();

    if (n) {
        data.counterSections.push({
            name: n,
            value: 0
        });

        save();
        render();
    }
}

function sectionChange(i,n) {
    data.counterSections[i].value =
        Math.max(0, data.counterSections[i].value + n);

    save();
    render();
}

// TIMER

function fmtTime(s) {
    return [
        Math.floor(s / 3600),
        Math.floor(s % 3600 / 60),
        s % 60
    ].map(x => String(x).padStart(2,'0')).join(':');
}

function renderTimer() {

    return `
        <div class="panel"
            style="max-width:760px;margin:auto;text-align:center">

            <span class="eyebrow">A LITTLE TIME FOR MAKING</span>

            <div class="timer-display" id="timer-display">
                ${fmtTime(data.timerSeconds || 0)}
            </div>

            <div class="timer-actions">

                <button class="btn primary" onclick="toggleTimer()">
                    ${data.timerRunning ? 'Pause' : 'Start'}
                </button>

                <button class="btn secondary" onclick="stopTimer()">
                    Stop & save
                </button>

                <button class="btn secondary"
                    onclick="openEditor('manualTime')">
                    ＋ Add time
                </button>

            </div>

            <div style="max-width:330px;margin:25px auto 0;text-align:left">

                <label class="muted">Project</label>

                <select class="field" id="timer-project">
                    <option value="">No project selected</option>

                    ${data.projects.map(p => `
                        <option ${activeProject === p.name ? 'selected' : ''}>
                            ${esc(p.name)}
                        </option>
                    `).join('')}

                </select>

            </div>

        </div>
    `;
}

function toggleTimer() {

    if (data.timerRunning) {

        data.timerSeconds += Math.floor(
            (Date.now() - data.timerStarted) / 1000
        );

        data.timerRunning = false;
        data.timerStarted = null;

        clearInterval(timerInterval);

    } else {

        data.timerRunning = true;
        data.timerStarted = Date.now();

        timerInterval = setInterval(() => {

            const el = $('#timer-display');

            if (el) {
                el.textContent = fmtTime(
                    data.timerSeconds +
                    Math.floor((Date.now() - data.timerStarted) / 1000)
                );
            }

        }, 1000);
    }

    save();
    render();
}

function stopTimer() {

    if (data.timerRunning) {

        data.timerSeconds += Math.floor(
            (Date.now() - data.timerStarted) / 1000
        );

        data.timerRunning = false;
        data.timerStarted = null;

        clearInterval(timerInterval);
    }

    const mins = Math.floor(data.timerSeconds / 60);

    if (mins) {
        data.logs.push({
            minutes: mins,
            date: new Date().toISOString().slice(0,10),
            project: $('#timer-project')?.value || activeProject
        });
    }

    data.timerSeconds = 0;

    save();
    render();
}

// YARN STASH

function renderStash() {

    return `
        ${section(
            'Your yarn collection',
            'Keep track of colours, fibres and quantities',
            '<button class="btn primary" onclick="openEditor(\\'yarn\\')">＋ Add yarn</button>'
        )}

        <div class="table-wrap panel">

            <table class="data-table">

                <thead>
                    <tr>
                        <th>Yarn</th>
                        <th>Colour</th>
                        <th>Weight / material</th>
                        <th>Quantity</th>
                        <th>Hook</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    ${data.yarn.map(y => `
                        <tr>
                            <td><b>${esc(y.name)}</b></td>
                            <td>${esc(y.colour)}</td>
                            <td>${esc(y.weight)} / ${esc(y.material)}</td>
                            <td>${esc(y.quantity)} × ${esc(y.amount)}</td>
                            <td>${esc(y.hook)}</td>
                            <td><span class="pill">${esc(y.status)}</span></td>
                            <td>
                                <button class="btn secondary small"
                                    onclick="editItem('yarn','${y.id}')">Edit</button>

                                <button class="btn danger small"
                                    onclick="del('yarn','${y.id}')">×</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>

            </table>

            ${data.yarn.length ? '' : empty('Your stash is empty')}
        </div>
    `;
}

// PATTERNS

function renderPatterns() {

    return `
        ${section(
            'Pattern library',
            'Save tutorials, PDFs, links and your own designs',
            '<button class="btn primary" onclick="openEditor(\\'pattern\\')">＋ Add pattern</button>'
        )}

        <div class="cards-grid">

            ${data.patterns.map(p => `
                <article class="item-card">

                    <div class="cover">📖</div>

                    <div class="item-body">

                        <h3>
                            ${esc(p.name)}
                            ${p.favourite === 'Yes' ? '♡' : ''}
                        </h3>

                        <div class="muted">
                            ${esc(p.category)} ·
                            ${esc(p.type)} ·
                            ${esc(p.difficulty)}
                        </div>

                        ${p.url ? `
                            <p>
                                <a class="link"
                                    href="${esc(p.url)}"
                                    target="_blank"
                                    rel="noopener">
                                    Open pattern / tutorial ↗
                                </a>
                            </p>
                        ` : ''}

                        <p class="muted">${esc(p.notes || '')}</p>

                        <button class="btn secondary small"
                            onclick="editItem('pattern','${p.id}')">
                            Edit
                        </button>

                        <button class="btn danger small"
                            onclick="del('pattern','${p.id}')">
                            Delete
                        </button>

                    </div>
                </article>
            `).join('') || empty('Your library is ready for patterns')}

        </div>
    `;
}

// STITCH DICTIONARY

function stitchCards(arr) {

    return arr.map(s => `
        <article class="panel stitch-entry">

            <h3 style="font:600 18px 'Playfair Display'">
                ${esc(s.name)}
            </h3>

            <span class="pill">${esc(s.abbr || 'No abbreviation')}</span>
            <span class="pill">${esc(s.category || '')}</span>

            <p class="muted">
                ${esc(s.instructions || 'No instructions added yet.')}
            </p>

            ${s.notes ? `<p class="tip">${esc(s.notes)}</p>` : ''}

            <button class="btn secondary small"
                onclick="editItem('stitch','${s.id}')">
                Edit
            </button>

            <button class="btn danger small"
                onclick="del('stitch','${s.id}')">
                Delete
            </button>

        </article>
    `).join('') || empty('No matching stitches');
}

function renderStitches() {

    return `
        ${section(
            'Stitch dictionary',
            'Build your own crochet reference library',
            '<button class="btn primary" onclick="openEditor(\\'stitch\\')">＋ Add stitch</button>'
        )}

        <div class="toolbar">
            <input class="field"
                id="stitch-search"
                placeholder="Search stitch name or abbreviation..."
                oninput="filterStitches()">
        </div>

        <div id="stitch-list" class="cards-grid">
            ${stitchCards(data.stitches)}
        </div>
    `;
}

function filterStitches() {

    const q = $('#stitch-search').value.toLowerCase();

    $('#stitch-list').innerHTML = stitchCards(
        data.stitches.filter(s =>
            (s.name + s.abbr + s.instructions + s.category)
                .toLowerCase().includes(q)
        )
    );
}

// CALENDAR

function renderCalendar() {

    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();

    const first = new Date(y,m,1);

    const start = new Date(
        y,m,1-first.getDay()
    );

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    let cells = '';

    for (let i = 0; i < 42; i++) {

        const d = new Date(start);

        d.setDate(start.getDate() + i);

        const iso = d.toISOString().slice(0,10);

        const ev = data.events.filter(e => e.date === iso);

        cells += `
            <button class="day-cell
                ${d.getMonth() !== m ? 'muted-day' : ''}
                ${d.toDateString() === today.toDateString() ? 'today-cell' : ''}"
                onclick="openEditor('event',null,{date:'${iso}'})">

                <b>${d.getDate()}</b>

                ${ev.slice(0,2).map(e => `
                    <span class="event-dot">
                        ${esc(e.title)}
                    </span>
                `).join('')}

            </button>
        `;
    }

    return `
        <div class="panel">

            <div class="calendar-head">

                <div>
                    <span class="eyebrow">PLAN YOUR MAKING TIME</span>

                    <h2>
                        ${calendarDate.toLocaleDateString(undefined,{
                            month:'long',
                            year:'numeric'
                        })}
                    </h2>
                </div>

                <div>
                    <button class="btn secondary"
                        onclick="moveMonth(-1)">‹</button>

                    <button class="btn secondary"
                        onclick="moveMonth(1)">›</button>

                    <button class="btn primary"
                        onclick="openEditor('event')">
                        ＋ Add event
                    </button>
                </div>

            </div>

            <div class="calendar-grid">

                ${days.map(d => `
                    <div class="day-name">${d}</div>
                `).join('')}

                ${cells}

            </div>
        </div>

        ${section('Upcoming events','Your saved crochet sessions and deadlines')}

        <div class="panel">

            ${data.events.map(e => `
                <div class="item-actions"
                    style="justify-content:space-between">

                    <div>
                        <b>${esc(e.title)}</b>
                        <div class="muted">
                            ${esc(e.date)} ${esc(e.time)} · ${esc(e.kind)}
                        </div>
                        <div class="muted">${esc(e.notes)}</div>
                    </div>

                    <span>
                        <button class="btn secondary small"
                            onclick="editItem('event','${e.id}')">
                            Edit
                        </button>

                        <button class="btn danger small"
                            onclick="del('event','${e.id}')">
                            ×
                        </button>
                    </span>

                </div>
            `).join('') || empty('No events planned')}

        </div>
    `;
}

function moveMonth(n) {
    calendarDate.setMonth(calendarDate.getMonth() + n);
    render();
}

// FILLET DESIGNER

function renderGrid() {

    const g = data.grid;

    if (!g.cells || g.cells.length !== g.rows * g.cols) {
        g.cells = Array(g.rows * g.cols).fill(0);
    }

    return `
        <div class="panel">

            <h2>Your chart canvas</h2>

            <p class="muted">
                Tap squares to switch between filled and empty.
            </p>

            <div class="grid-tools">

                <label>Rows
                    <input id="grid-rows" type="number"
                        min="2" max="60" value="${g.rows}">
                </label>

                <label>Columns
                    <input id="grid-cols" type="number"
                        min="2" max="60" value="${g.cols}">
                </label>

                <button class="btn secondary"
                    onclick="resizeGrid()">Resize</button>

                <button class="btn secondary"
                    onclick="clearGrid()">Clear</button>

                <button class="btn primary"
                    onclick="exportGrid()">Export chart</button>

            </div>

            <div class="pixel-grid"
                style="grid-template-columns:repeat(${g.cols},22px)">

                ${g.cells.map((v,i) => `
                    <button class="${v ? 'filled' : ''}"
                        onclick="toggleCell(${i})"></button>
                `).join('')}

            </div>

        </div>
    `;
}

function toggleCell(i) {
    data.grid.cells[i] = data.grid.cells[i] ? 0 : 1;
    save();
    render();
}

function clearGrid() {
    data.grid.cells.fill(0);
    save();
    render();
}

function resizeGrid() {

    const r = Math.max(2,Math.min(60,+$('#grid-rows').value || 20));
    const c = Math.max(2,Math.min(60,+$('#grid-cols').value || 20));

    const old = data.grid;
    const cells = Array(r*c).fill(0);

    for (let y = 0; y < Math.min(r,old.rows); y++) {
        for (let x = 0; x < Math.min(c,old.cols); x++) {
            cells[y*c+x] = old.cells[y*old.cols+x] || 0;
        }
    }

    data.grid = {rows:r,cols:c,cells};

    save();
    render();
}

function exportGrid() {

    const c = document.createElement('canvas');
    const g = data.grid;
    const scale = 20;

    c.width = g.cols * scale;
    c.height = g.rows * scale;

    const x = c.getContext('2d');

    x.fillStyle = '#fff';
    x.fillRect(0,0,c.width,c.height);

    for (let i = 0; i < g.cells.length; i++) {

        const row = Math.floor(i/g.cols);
        const col = i%g.cols;

        x.fillStyle = g.cells[i] ? '#806b9b' : '#fff';

        x.fillRect(
            col*scale,
            row*scale,
            scale,
            scale
        );

        x.strokeStyle = '#d9d0e0';

        x.strokeRect(
            col*scale,
            row*scale,
            scale,
            scale
        );
    }

    const a = document.createElement('a');

    a.download = 'stitch-and-bloom-chart.png';
    a.href = c.toDataURL();
    a.click();
}

// CALCULATORS

function renderCalculators() {

    return `
        <div class="two-col">

            <div class="panel">
                <h2>Yarn estimate</h2>

                <label>Swatch yarn (metres)</label>
                <input class="field" id="swatch-yarn" type="number" value="20">

                <label>Swatch area (cm²)</label>
                <input class="field" id="swatch-area" type="number" value="100">

                <label>Project area (cm²)</label>
                <input class="field" id="project-area" type="number" value="1200">

                <button class="btn primary" onclick="calcYarn()">
                    Calculate
                </button>

                <div class="calculator-result" id="yarn-result">—</div>
            </div>

            <div class="panel">
                <h2>Gauge calculator</h2>

                <label>Your stitches across 10 cm</label>
                <input class="field" id="your-gauge" type="number" value="18">

                <label>Pattern stitches across 10 cm</label>
                <input class="field" id="pattern-gauge" type="number" value="20">

                <label>Pattern width (cm)</label>
                <input class="field" id="pattern-width" type="number" value="40">

                <button class="btn primary" onclick="calcGauge()">
                    Calculate
                </button>

                <div class="calculator-result" id="gauge-result">—</div>
            </div>

            <div class="panel">
                <h2>Hook size converter</h2>

                <select class="field" id="hook-select"
                    onchange="hookConvert()">
                    <option value="2.25">B/1</option>
                    <option value="2.75">C/2</option>
                    <option value="3.25">D/3</option>
                    <option value="3.5">E/4</option>
                    <option value="3.75">F/5</option>
                    <option value="4">G/6</option>
                    <option value="4.5">7</option>
                    <option value="5">H/8</option>
                    <option value="5.5">I/9</option>
                    <option value="6">J/10</option>
                    <option value="6.5">K/10.5</option>
                    <option value="8">L/11</option>
                    <option value="9">M/13</option>
                    <option value="10">N/15</option>
                </select>

                <div class="calculator-result" id="hook-result">
                    2.25 mm
                </div>
            </div>

            <div class="panel">
                <h2>Project cost calculator</h2>

                <label>Yarn cost (₹)</label>
                <input class="field" id="cost-yarn" type="number" value="400">

                <label>Other materials (₹)</label>
                <input class="field" id="cost-other" type="number" value="50">

                <label>Hours spent</label>
                <input class="field" id="cost-hours" type="number" value="5">

                <label>Hourly rate (₹)</label>
                <input class="field" id="cost-rate" type="number" value="50">

                <button class="btn primary" onclick="calcCost()">
                    Calculate cost
                </button>

                <div class="calculator-result" id="cost-result">—</div>
            </div>

        </div>
    `;
}

function calcYarn() {

    const a = +$('#swatch-area').value;
    const b = +$('#project-area').value;
    const y = +$('#swatch-yarn').value;

    $('#yarn-result').textContent =
        a > 0
            ? `${(y*b/a).toFixed(1)} metres`
            : 'Enter a valid swatch area.';
}

function calcGauge() {

    const y = +$('#your-gauge').value;
    const p = +$('#pattern-gauge').value;
    const w = +$('#pattern-width').value;

    $('#gauge-result').textContent =
        y > 0 && p > 0
            ? `Approx. ${(w*y/p).toFixed(1)} cm using your gauge`
            : 'Enter valid gauge values.';
}

function hookConvert() {
    $('#hook-result').textContent =
        $('#hook-select').value + ' mm';
}

function calcCost() {

    const total =
        +$('#cost-yarn').value +
        +$('#cost-other').value +
        +$('#cost-hours').value *
        +$('#cost-rate').value;

    $('#cost-result').textContent = '₹' + total.toFixed(2);
}

// SKETCHBOOK

function renderSketchbook() {

    return `
        <div class="panel">

            <h2>Freehand sketchpad</h2>

            <p class="muted">
                Draw with your mouse, trackpad or finger.
            </p>

            <div class="canvas-wrap">
                <canvas id="draw-canvas"
                    width="1100" height="420"></canvas>
            </div>

            <div class="item-actions">

                <label>Pen colour
                    <input id="pen-colour" type="color" value="#806b9b">
                </label>

                <label>Brush
                    <input id="pen-size" type="range" min="1" max="18" value="4">
                </label>

                <button class="btn secondary" onclick="clearCanvas()">
                    Clear
                </button>

                <button class="btn primary" onclick="saveCanvas()">
                    Save drawing
                </button>

            </div>

        </div>

        ${section(
            'Design notes',
            'Save ideas for your future crochet projects',
            '<button class="btn primary" onclick="openEditor(\\'sketch\\')">＋ Add notes</button>'
        )}

        ${data.sketches.map(s => `
            <div class="panel">
                <h3>${esc(s.name)}</h3>
                <p class="muted">${esc(s.notes)}</p>
            </div>
        `).join('')}
    `;
}

let drawing = false;
let ctx = null;

function setupCanvas() {

    const c = $('#draw-canvas');

    if (!c) return;

    ctx = c.getContext('2d');

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    c.onpointerdown = e => {

        drawing = true;

        const r = c.getBoundingClientRect();

        ctx.beginPath();

        ctx.moveTo(
            (e.clientX-r.left)*c.width/r.width,
            (e.clientY-r.top)*c.height/r.height
        );

        c.setPointerCapture(e.pointerId);
    };

    c.onpointermove = e => {

        if (!drawing) return;

        const r = c.getBoundingClientRect();

        ctx.strokeStyle = $('#pen-colour').value;
        ctx.lineWidth = $('#pen-size').value;

        ctx.lineTo(
            (e.clientX-r.left)*c.width/r.width,
            (e.clientY-r.top)*c.height/r.height
        );

        ctx.stroke();
    };

    c.onpointerup = () => drawing = false;
    c.onpointercancel = () => drawing = false;
}

function clearCanvas() {

    const c = $('#draw-canvas');

    if (c) {
        ctx.clearRect(0,0,c.width,c.height);
    }
}

function saveCanvas() {

    const c = $('#draw-canvas');

    const a = document.createElement('a');

    a.download = 'my-crochet-sketch.png';
    a.href = c.toDataURL();

    a.click();
}

// STATISTICS

function renderStats() {

    const completed = data.projects.filter(
        p => p.status === 'Completed'
    );

    const mins = data.logs.reduce(
        (s,x) => s + (+x.minutes || 0), 0
    );

    const achievements = [
        ['First project',data.projects.length >= 1],
        ['First completed project',completed.length >= 1],
        ['First wearable',completed.some(p => p.category === 'Clothing')],
        ['First amigurumi',completed.some(p => p.category === 'Plushies')],
        ['10 projects',completed.length >= 10],
        ['First original pattern',data.patterns.some(p => p.type === 'My own design')]
    ];

    return `
        <div class="stats-grid">

            <div class="stat-card">
                <small>Projects completed</small>
                <strong>${completed.length}</strong>
            </div>

            <div class="stat-card">
                <small>Total crochet time</small>
                <strong>${Math.floor(mins/60)}h ${mins%60}m</strong>
            </div>

            <div class="stat-card">
                <small>Saved patterns</small>
                <strong>${data.patterns.length}</strong>
            </div>

            <div class="stat-card">
                <small>Saved stitches</small>
                <strong>${data.stitches.length}</strong>
            </div>

        </div>

        <div class="panel">

            <h2>Achievements</h2>

            <div class="cards-grid">

                ${achievements.map(([name,ok]) => `
                    <div class="tip">
                        <span style="font-size:22px">
                            ${ok ? '🏅' : '♡'}
                        </span>

                        <b style="display:block;color:#6f5d86">
                            ${name}
                        </b>

                        <small>
                            ${ok ? 'Unlocked!' : 'Keep creating to unlock this.'}
                        </small>
                    </div>
                `).join('')}

            </div>

        </div>
    `;
}

// MAIN RENDERER

function render() {

    const pages = {
        home: renderHome,
        projects: renderProjects,
        counter: renderCounter,
        timer: renderTimer,
        stash: renderStash,
        patterns: renderPatterns,
        stitches: renderStitches,
        grid: renderGrid,
        calendar: renderCalendar,
        calculators: renderCalculators,
        sketchbook: renderSketchbook,
        stats: renderStats
    };

    $('#page-content').innerHTML = pages[page]();

    if (page === 'sketchbook') {
        setupCanvas();
    }
}

window.addEventListener('beforeunload', save);

render();
