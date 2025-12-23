// Vermilion_EquipmentCalc/js/ui.js
// === UI & Logic ===
function renderPalette() {
    const pTh = document.getElementById('pal-th');
    THRESHOLDS.forEach((t, i) => createToken(pTh, t, 'th', i));
    const pEff = document.getElementById('pal-eff');
    EFFECTS.forEach((e, i) => createToken(pEff, e, 'eff', i));
    const pSpec = document.getElementById('pal-spec');
    SPECIAL_EFFECTS.forEach((e, i) => createToken(pSpec, e, 'spec', i));
}

function createToken(p, d, type, idx) {
    let el = document.createElement('div');
    el.className = `token ${type} ${d.type || ''}`;
    el.draggable = true;

    let name = d.name;
    let html = `<span class="token-name">${name}</span>`;
    if (type === 'th') html += ``;
    el.innerHTML = html;

    el.dataset.idx = idx; el.dataset.db = type;
    el.onmouseenter = e => showTooltip(e, d.name, d.desc);
    el.onmousemove = moveTooltip; el.onmouseleave = hideTooltip;
    el.ondragstart = e => { e.dataTransfer.setData('idx', idx); e.dataTransfer.setData('db', type); hideTooltip(); };
    p.appendChild(el);
}

function setSlot(s) {
    STATE.currentSlot = s;
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.slot-btn[data-slot="${s}"]`).classList.add('active');
    document.getElementById('cardUI').className = `equip-card ${s}`;
    updateSlotText(); calc();
}

function updateSlotText() {
    let txt = SLOTS[STATE.currentSlot].effName + " +X";
    document.querySelectorAll('.d-item').forEach(el => {
        if (el.dataset.name === "수치 +X") el.querySelector('span').innerText = txt;
    });
}

function cycleCap() {
    STATE.capacity = (STATE.capacity >= 5) ? 2 : STATE.capacity + 1;
    updateCapUI(); calc();
}

function updateCapUI() {
    // Capacity Value: Logarithmic 1.0 -> 0.8 -> 0.6 -> 0.4
    let val = 0;
    if (STATE.capacity >= 2) val += 1.0;
    if (STATE.capacity >= 3) val += 0.8;
    if (STATE.capacity >= 4) val += 0.6;
    if (STATE.capacity >= 5) val += 0.4;

    document.getElementById('valCap').innerText = val.toFixed(1) + "V";
    document.querySelectorAll('.cap-slot').forEach((s, i) => {
        if (i < STATE.capacity) s.classList.add('active'); else s.classList.remove('active');
    });
}

function bindEvents() { bindDropZone(document.getElementById('dropBase'), ['eff']); }
function bindDropZone(el, allowedTypes) {
    el.ondragover = e => { e.preventDefault(); el.classList.add('drag-over'); };
    el.ondragleave = () => el.classList.remove('drag-over');
    el.ondrop = (e) => handleDrop(e, el, allowedTypes);
}

function handleDrop(e, target, allowedTypes) {
    e.preventDefault(); target.classList.remove('drag-over');
    let idx = e.dataTransfer.getData('idx'); let db = e.dataTransfer.getData('db');
    if (!idx) return;
    if (allowedTypes) {
        if (!allowedTypes.includes(db)) {
            if (allowedTypes.includes('spec') && (db === 'eff')) {
                // Allowed
            } else {
                return;
            }
        }
    }

    if (db === 'th' && target.children.length > 0) target.innerHTML = '';
    let data;
    if (db === 'th') data = THRESHOLDS[idx];
    else if (db === 'eff') data = EFFECTS[idx];
    else data = SPECIAL_EFFECTS[idx];

    createDroppedItem(target, data, db, idx);
    if (db === 'th') updateThresholdProbs();
    calc();
}

function createDroppedItem(p, d, db, idx) {
    let div = document.createElement('div');
    div.className = `d-item ${db} ${d.type || ''}`;
    div.dataset.db = db; div.dataset.idx = idx; div.dataset.name = d.name;

    let dispName = d.name;
    if (d.name === "수치 +X") dispName = SLOTS[STATE.currentSlot].effName + " +X";

    let html = `<span>${dispName}</span>`;
    if (db === 'th') html += ``;
    if (d.hasX) html += `<input type="number" value="1" min="1" oninput="calc(); if('${db}'==='th') updateThresholdProbs()">`;

    html += `<span class="del-btn" onclick="this.parentElement.remove(); calc();">×</span>`;
    div.innerHTML = html;
    div.onmouseenter = e => showTooltip(e, d.name, d.desc);
    div.onmousemove = moveTooltip; div.onmouseleave = hideTooltip;
    p.appendChild(div);
}

function addLogicRow() {
    let row = document.createElement('div'); row.className = 'logic-row';
    row.style.flexWrap = 'wrap'; // Allow wrapping for flavor text

    let topContainer = document.createElement('div');
    topContainer.style.display = 'flex';
    topContainer.style.width = '100%';
    topContainer.style.gap = '10px';
    topContainer.style.alignItems = 'stretch';

    let c1 = document.createElement('div'); c1.className = 'logic-col';
    c1.innerHTML = `<div class="logic-header">3. 임계값 (Condition)</div><div class="drop-area th-drop"></div>`;
    bindDropZone(c1.querySelector('.drop-area'), ['th']);

    let arr = document.createElement('div'); arr.className = 'logic-arrow'; arr.innerText = '➜';
    let c2 = document.createElement('div'); c2.className = 'logic-col';
    c2.innerHTML = `<div class="logic-header res">4. 특수 효과 (Result)</div><div class="drop-area spec-drop"></div>`;
    bindDropZone(c2.querySelector('.drop-area'), ['spec', 'eff']);

    let del = document.createElement('div');
    del.style.cursor = 'pointer'; del.style.color = '#ef4444'; del.style.fontWeight = 'bold'; del.innerText = 'X';
    del.style.display = 'flex'; del.style.alignItems = 'center';
    del.onclick = () => { row.remove(); calc(); };

    topContainer.appendChild(c1);
    topContainer.appendChild(arr);
    topContainer.appendChild(c2);
    topContainer.appendChild(del);

    let flav = document.createElement('input');
    flav.type = 'text';
    flav.className = 'logic-flavor';
    flav.placeholder = '조건부 효과 설명 (Flavor Text)';
    flav.style.width = '100%';
    flav.style.marginTop = '8px';
    flav.style.fontSize = '0.8rem';
    flav.style.color = '#888';
    flav.style.background = '#1a1a1a';
    flav.style.border = '1px solid #333';
    flav.style.padding = '4px 8px';

    row.appendChild(topContainer);
    row.appendChild(flav);

    document.getElementById('logicContainer').appendChild(row);
}

function updateThresholdProbs() {
    // Hidden by user request (BQM 1.2 Absolute Standards)
    calc();
}

function updateTier(v) {
    let max = 12;
    let p = Math.min(100, Math.max(0, (v / max) * 100));
    document.getElementById('tierMarker').style.left = p + '%';
    document.getElementById('tierLabel').innerText = v.toFixed(1);

    let g = "T6";
    if (v >= 10) g = "T1"; else if (v >= 8) g = "T2"; else if (v >= 6) g = "T3";
    else if (v >= 4) g = "T4";
    else if (v >= 2) g = "T5";
    let gel = document.getElementById('resGrade');
    gel.innerText = g;
    gel.className = `res-grade ${getGradeClass(v)}`;
}

// Tooltip
const tt = document.getElementById('tooltip');
function showTooltip(e, t, d) { tt.innerHTML = `<strong>${t}</strong>${d}`; tt.style.display = 'block'; moveTooltip(e); }
function moveTooltip(e) { tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px'; }
function hideTooltip() { tt.style.display = 'none'; }

// Formula Display
function renderFormula(fData) {
    const el = document.getElementById('formulaDisplay');
    if (!el || !fData) return;

    // Structure: (Min * W) + (Std * W) + Bonus...
    let html = '';

    // Min Term
    html += createTermHtml(fData.min.toFixed(1), "Min", "최소값 (Low Roll)", "안정성을 결정하는 바닥점입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml(fData.wMin.toFixed(1), "W_min", "역할 가중치", `${fData.role} 역할의 최소값 중요도입니다.`);
    html += `<span class="f-op">+</span>`;

    // Std Term
    // Note: Std in Formula includes Bonus Turn Compression?
    // sim.js: termStd = (vecStd + bonus) * weights.std
    let displayStd = fData.std;
    let bonusTxt = (fData.bonus > 0) ? ` (+${fData.bonus} Bonus)` : "";
    html += createTermHtml(displayStd.toFixed(1), "Std", `평균값${bonusTxt}`, "기대값 + 턴 압축 보너스입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml(fData.wStd.toFixed(1), "W_std", "역할 가중치", `${fData.role} 역할의 평균값 중요도입니다.`);
    html += `<span class="f-op">+</span>`;

    // Bonus Potential Term
    // (Max - Std) * Stb * W_max
    if (fData.wMax > 0) {
        let gap = fData.max - fData.std;
        html += `<span class="f-op">(</span>`;
        html += createTermHtml(fData.max.toFixed(1), "Max", "최대값", "잠재적 최고점입니다.");
        html += `<span class="f-op">-</span>`;
        html += createTermHtml(displayStd.toFixed(1), "Std", "평균값", "Gap 계산용");
        html += `<span class="f-op">)</span>`;
        html += `<span class="f-op">×</span>`;
        html += createTermHtml((fData.stb * 100).toFixed(0) + "%", "Stb", "안정성", "신뢰도 계수(Gatekeeper)입니다.");
        html += `<span class="f-op">×</span>`;
        html += createTermHtml(fData.wMax.toFixed(1), "W_max", "역할 가중치", `${fData.role} 역할의 고점 중요도입니다.`);
    }

    // Normalization
    html += `<span class="f-op">÷</span>`;
    html += createTermHtml("3.0", "Norm", "정규화", "Tier Scale(12.0V) 환산을 위한 정규화 상수입니다.");

    html += `<span class="f-op">=</span>`;
    html += createTermHtml(fData.score.toFixed(1), "Score", "최종 점수", "최종 등급 산출 점수입니다.");

    el.innerHTML = html;

    // Re-bind tooltips
    el.querySelectorAll('.f-term').forEach(t => {
        t.onmouseenter = e => showTooltip(e, t.dataset.title, t.dataset.desc);
        t.onmousemove = moveTooltip;
        t.onmouseleave = hideTooltip;
    });
}

function createTermHtml(val, sub, title, desc) {
    return `<div class="f-term" data-title="${title}" data-desc="${desc}">
        <span class="f-val">${val}</span>
        <span class="f-sub">${sub}</span>
    </div>`;
}
