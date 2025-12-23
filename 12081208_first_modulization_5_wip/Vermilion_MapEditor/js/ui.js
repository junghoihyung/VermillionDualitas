// Vermilion_MapEditor/js/ui.js
// === UI Handling ===
function setTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`pnl-${name}`).classList.add('active');
}

function setTool(mode, val, el) {
    currentTool = { mode, val };
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.enemy-item').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}

function updateQuestUI() {
    const type = document.getElementById('qType').value;
    document.getElementById('ui-escort').style.display = 'none';
    document.getElementById('ui-stabilize').style.display = 'none';
    document.getElementById('ui-annihilation').style.display = 'none';
    document.getElementById('tool-deadtree').style.display = 'none';

    if (type === 'escort') {
        document.getElementById('ui-escort').style.display = 'block';
        document.getElementById('tool-deadtree').style.display = 'flex';
    } else if (type === 'stabilize') {
        document.getElementById('ui-stabilize').style.display = 'block';
        updateCounts();
    } else {
        document.getElementById('ui-annihilation').style.display = 'block';
    }
}

function updateCounts() {
    const el = document.getElementById('targetCount');
    if (!el) return;

    let tCount = 0;
    if (entities) {
        for (let k in entities) if (entities[k].val === 'target') tCount++;
    }
    el.innerText = `${tCount} / 4`;
    el.style.color = (tCount === 4) ? '#10b981' : (tCount > 4 ? '#ef4444' : 'white');
}

function renderEnemyList() {
    const list = document.getElementById('enemyList');
    list.innerHTML = '';
    loadedEnemies.forEach((e, idx) => {
        const div = document.createElement('div');
        div.className = 'enemy-item';
        div.innerHTML = `<span>${e.name}</span> <span>${e.etv}V</span>`;
        div.onclick = () => setTool('enemy', { name: e.name, etv: e.etv }, div);
        list.appendChild(div);
    });
}

// === Context Menu ===
function openContextMenu(e) {
    const { x, y } = hoveredCell;
    const key = `${x},${y}`;
    if (entities[key]) {
        selectedEntityPos = key;
        const menu = document.getElementById('contextMenu');
        menu.style.display = 'block';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
    }
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

function setScaling(n) {
    if (selectedEntityPos && entities[selectedEntityPos]) {
        pushHistory(); // State change
        entities[selectedEntityPos].scaling = n;
        hideContextMenu();
    }
}

function deleteEntity() {
    if (selectedEntityPos && entities[selectedEntityPos]) {
        pushHistory();
        delete entities[selectedEntityPos];
        updateCounts();
        hideContextMenu();
    }
}
