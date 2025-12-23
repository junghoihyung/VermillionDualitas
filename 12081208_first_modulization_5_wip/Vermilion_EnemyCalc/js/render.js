// Vermilion_EnemyCalc/js/render.js
function renderPalette() {
    const actBox = document.getElementById('pal-act');
    const keyBox = document.getElementById('pal-key');
    const pasBox = document.getElementById('pal-pas');
    const prioBox = document.getElementById('pal-prio');

    ACTIONS.forEach((d, i) => createToken(actBox, d, 'act', i));
    KEYWORDS.forEach((d, i) => {
        let target = d.type === 'pas' ? pasBox : keyBox;
        createToken(target, d, d.type || 'key', i);
    });
    PRIORITIES.forEach((d, i) => createToken(prioBox, d, 'prio', i));
}

function createToken(parent, data, type, idx) {
    let el = document.createElement('div');
    el.className = `token ${type}`;
    el.draggable = true;
    el.innerHTML = type === 'act' ? `${data.icon} ${data.name}` : data.name;
    el.dataset.idx = idx;
    el.dataset.db = type === 'act' ? 'ACT' : (type === 'prio' ? 'PRIO' : 'KEY');
    el.dataset.tooltip = data.desc;

    el.ondragstart = (e) => {
        e.dataTransfer.setData('idx', idx);
        e.dataTransfer.setData('db', el.dataset.db);
        document.getElementById('global-tooltip').style.display = 'none';
    };
    el.onmouseenter = (e) => showTooltip(e, data.name, data.desc);
    el.onmousemove = moveTooltip;
    el.onmouseleave = hideTooltip;
    parent.appendChild(el);
}

const tooltip = document.getElementById('global-tooltip');
function showTooltip(e, title, desc) { if (!desc) return; tooltip.innerHTML = `<strong>${title}</strong>${desc}`; tooltip.style.display = 'block'; moveTooltip(e); }
function moveTooltip(e) { tooltip.style.left = (e.clientX + 15) + 'px'; tooltip.style.top = (e.clientY + 15) + 'px'; }
function hideTooltip() { tooltip.style.display = 'none'; }

function renderGraphAndSlider() {
    const svg = document.getElementById('graphSvg'); const pts = document.getElementById('graphPoints');
    const h1 = document.getElementById('h1'); const h2 = document.getElementById('h2');
    const zb = document.getElementById('zoneB'); const zg = document.getElementById('zoneG'); const zr = document.getElementById('zoneR');

    // Get Context for Visualization Shift
    const threat = parseInt(document.getElementById('ctxThreat').value) || 0;
    const suppress = parseInt(document.getElementById('ctxSuppress').value) || 0;
    const shift = threat - suppress;

    // Shift Cuts: "Effective Sum" triggers, so on "Raw Sum" axis, the cut moves LEFT by threat, RIGHT by suppress.
    // e.g. Base Cut1=3. If Threat=2, Sum 1 becomes Eff 3. So Visual Cut1 is 1.
    let vCat1 = Math.max(0, Math.min(STATE.maxSum, STATE.cut1 - shift));
    let vCat2 = Math.max(0, Math.min(STATE.maxSum, STATE.cut2 - shift));

    let p1 = (vCat1 / STATE.maxSum) * 100; let p2 = (vCat2 / STATE.maxSum) * 100;

    // Update handles and zones
    h1.style.left = p1 + '%'; h2.style.left = p2 + '%';
    zb.style.width = p1 + '%'; zg.style.width = (p2 - p1) + '%'; zr.style.width = (100 - p2) + '%';

    // Update colors for shifted zones? 
    // The CSS .zone.b/g/r handles colors. We just changed widths.
    // However, we should also update the text "Standard", "Weak" if they get squeezed? No, css handles overflow usually.

    pts.innerHTML = ''; let pointsStr = "";
    // Collect points for SVG line
    let svgPoints = [];

    for (let s = 0; s <= STATE.maxSum; s++) {
        let prob = STATE.probMap[s] || 0;
        let x = (s / STATE.maxSum) * 100; let y = 100 - ((prob / STATE.maxProb) * 90);

        // Add to SVG path data (convert % to coordinate approx or use native svg coords if viewbox set, 
        // but here we are using absolute positioning for points. 
        // Better to use a polyline inside the SVG element which should scale with CSS)
        // The graphSvg element needs to have a polyline added.
        svgPoints.push(`${x},${y}`);

        let el = document.createElement('div'); el.className = 'g-point';
        if (STATE.yellows.includes(s)) el.classList.add('yellow');
        el.style.left = x + '%'; el.style.top = y + '%'; el.innerHTML = s;
        el.onclick = () => toggleYellow(s);
        let lb = document.createElement('div'); lb.className = 'g-label'; lb.innerText = (prob * 100).toFixed(1) + '%';
        el.appendChild(lb); pts.appendChild(el);
    }

    // Draw Line
    svg.innerHTML = `<polyline points="${svgPoints.join(' ')}" fill="none" stroke="#666" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
    // Note: for this to work, the polyline points must interpret x,y as coordinate system matching 0-100 range if viewbox is set 0 0 100 100.
    // Assuming graphSvg has viewBox="0 0 100 100" in CSS or HTML. If not, this might fail scaling.
    // Let's ensure SVG has viewBox. I can't see HTML but I can force it here just in case, or use % if supported (points don't support % usually).
    // Actually, points="0,100 10,90..." works in user units. If I set viewBox="0 0 100 100" on the SVG element in JS, it will map correctly.
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
}

function renderZones() {
    const container = document.getElementById('zonesContainer');
    if (!container.querySelector('.action-column.b')) {
        container.innerHTML = `
<div class="action-column b"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;"><strong id="hdB">🟦 약화</strong><input type="text" id="flavB" placeholder="Flv" style="width:100px; font-size:0.7rem; padding:2px; background:#222; border:1px solid #444; color:#aaa;"><span id="vb">0V</span></div><div class="drop-area" id="dropB"></div></div>
<div class="action-column g"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;"><strong id="hdG">🟩 표준</strong><input type="text" id="flavG" placeholder="Flv" style="width:100px; font-size:0.7rem; padding:2px; background:#222; border:1px solid #444; color:#aaa;"><span id="vg">0V</span></div><div class="drop-area" id="dropG"></div></div>
<div class="action-column r"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;"><strong id="hdR">🟥 강화</strong><input type="text" id="flavR" placeholder="Flv" style="width:100px; font-size:0.7rem; padding:2px; background:#222; border:1px solid #444; color:#aaa;"><span id="vr">0V</span></div><div class="drop-area" id="dropR"></div></div>
<div class="action-column p"><div style="display:flex; justify-content:space-between;"><strong>🧬 패시브</strong><span id="vp">0V</span></div><div class="drop-area" id="dropP"></div></div>
`;
        bindDropZones(['dropB', 'dropG', 'dropR', 'dropP']);

        // Also bind Prio Container if exists
        const prio = document.getElementById('prioContainer');
        if (prio) {
            prio.ondragover = (e) => { e.preventDefault(); prio.classList.add('drag-over'); };
            prio.ondragleave = () => prio.classList.remove('drag-over');
            prio.ondrop = handleDrop;
        }
    }
    let existingYs = container.querySelectorAll('.action-column.y'); existingYs.forEach(el => el.remove());
    let pasCol = container.querySelector('.action-column.p');
    STATE.yellows.forEach(sum => {
        let div = document.createElement('div'); div.className = 'action-column y';
        div.innerHTML = `<div style="display:flex; justify-content:space-between; color:var(--yellow); align-items:center;">
<strong id="hdY${sum}">🟡 특수 [${sum}]</strong>
<div style="display:flex; flex-direction:column; align-items:flex-end;">
<span id="vy${sum}">0V</span>
<label style="font-size:0.7rem; color:#ef4444; cursor:pointer; display:flex; align-items:center; gap:3px;">
<input type="checkbox" id="chkWeak${sum}" onchange="calc()" style="width:auto; height:auto; margin:0;"> 약점
</label>
</div>
</div>
<input type="text" id="flavY${sum}" placeholder="Flv" style="width:100%; font-size:0.7rem; padding:2px; background:#2a2210; border:1px solid #555; color:#fbbf24; margin-bottom:5px;">
<div class="drop-area" id="dropY${sum}"></div>`;
        container.insertBefore(div, pasCol); bindDropZones([`dropY${sum}`]);
    });
}

function bindDropZones(ids) {
    ids.forEach(id => {
        let el = document.getElementById(id); if (!el) return;
        el.ondragover = (e) => { e.preventDefault(); el.classList.add('drag-over'); };
        el.ondragleave = () => el.classList.remove('drag-over');
        el.ondrop = handleDrop;
    });
}

function handleDrop(e) {
    e.preventDefault(); this.classList.remove('drag-over');
    let idx = e.dataTransfer.getData('idx'); let db = e.dataTransfer.getData('db'); if (!idx) return;

    // PRIORITY DROP
    if (this.id === 'prioContainer') {
        if (db !== 'PRIO') return;
        let data = PRIORITIES[idx];
        let item = createItem(this, data, db, idx);
        STATE.priorityList.push(data.id);
        updatePrioNumbers();
        return;
    }

    let data = (db === 'ACT' ? ACTIONS : KEYWORDS)[idx]; let isPas = data.type === 'pas';
    if (this.id === 'dropP' && !isPas) return; if (this.id !== 'dropP' && isPas) return;
    if (db === 'PRIO') return; // Can't drop prio in action zones

    createItem(this, data, db, idx); calc();
}


function createItem(parent, data, db, idx) {
    let el = document.createElement('div');
    el.className = `dropped-item ${db === 'ACT' ? 'act' : (db === 'PRIO' ? 'prio' : (data.type === 'pas' ? 'pas' : 'key'))}`;
    el.dataset.idx = idx; el.dataset.db = db;
    el.dataset.id = data.id || ''; // For Prio

    let html = `<span>${db === 'ACT' ? data.icon + ' ' : ''}${data.name}</span>`;
    if (db === 'PRIO') {
        html = `<span class="prio-num" style="font-weight:bold; color:var(--accent); margin-right:5px;">#</span>` + html;
    }
    if (db !== 'PRIO' && !data.noX) html += `<input type="number" value="1" min="1" oninput="calc()">`;
    if (db !== 'PRIO' && data.hasRange) html += `<input type="number" class="range-input" value="2" min="2" placeholder="R" title="사거리" style="width:30px; margin-left:2px; color:#fbbf24; border-color:#fbbf24;" oninput="calc()">`;

    html += `<span class="del-btn" onclick="removeItem(this)">×</span>`;
    el.innerHTML = html;
    el.onmouseenter = (e) => showTooltip(e, data.name, data.desc);
    el.onmousemove = moveTooltip;
    el.onmouseleave = hideTooltip;
    parent.appendChild(el);
    return el;
}

function removeItem(btn) {
    let el = btn.parentElement;
    let parent = el.parentElement;
    el.remove();
    if (parent.id === 'prioContainer') {
        updatePrioNumbers();
    } else {
        calc();
    }
}

function updatePrioNumbers() {
    // Re-read from DOM
    const container = document.getElementById('prioContainer');
    STATE.priorityList = [];
    Array.from(container.children).forEach((child, i) => {
        child.querySelector('.prio-num').innerText = `#${i + 1}`;
        let id = PRIORITIES[child.dataset.idx].id;
        STATE.priorityList.push(id);
    });
}
