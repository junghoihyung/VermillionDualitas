// Vermilion_EquipmentCalc/js/trinket_ui.js
// === Trinket UI Logic ===

function initTrinketUI() {
    renderTrinketPalette();
    renderRechargePalette(); // New
    renderTrinketCap();
    bindTrinketDropZone();
    bindRechargeDropZone(); // New
    calcTrinket();
}

// 1. Palette Rendering
function renderTrinketPalette() {
    const pEff = document.getElementById('tr-pal-eff');
    if (!pEff) return;
    pEff.innerHTML = '';

    TRINKET_EFFECTS.forEach((e, i) => {
        let el = document.createElement('div');
        el.className = 'token eff';
        el.draggable = true;
        el.innerHTML = `<span class="token-name">${e.name}</span>`;

        el.dataset.idx = i;
        el.onmouseenter = ev => showTrinketTooltip(ev, e.name, e.desc);
        el.onmousemove = moveTrinketTooltip;
        el.onmouseleave = hideTrinketTooltip;
        el.ondragstart = ev => {
            ev.dataTransfer.setData('idx', i);
            ev.dataTransfer.setData('type', 'trEff');
            hideTrinketTooltip();
        };
        pEff.appendChild(el);
    });
}

function renderRechargePalette() {
    const pRec = document.getElementById('tr-pal-rec');
    if (!pRec) return;
    pRec.innerHTML = '';

    RECHARGE_TYPES.forEach((r, i) => {
        let el = document.createElement('div');
        el.className = 'token th'; // Reuse threshold style for color
        el.draggable = true;
        el.innerHTML = `<span class="token-name">${r.name}</span>`;

        el.dataset.idx = i;
        el.onmouseenter = ev => showTrinketTooltip(ev, r.name, r.desc);
        el.onmousemove = moveTrinketTooltip;
        el.onmouseleave = hideTrinketTooltip;
        el.ondragstart = ev => {
            ev.dataTransfer.setData('idx', i);
            ev.dataTransfer.setData('type', 'trRec');
            hideTrinketTooltip();
        };
        pRec.appendChild(el);
    });
}

// 2. Capacity UI
function renderTrinketCap() {
    const slotContainer = document.getElementById('trCapSlots');
    const valLabel = document.getElementById('trCapVal');
    if (!slotContainer) return;

    slotContainer.innerHTML = '';
    for (let i = 1; i <= 4; i++) {
        let slot = document.createElement('div');
        slot.className = 'cap-slot';
        if (i <= TrinketState.capacity) slot.classList.add('active');
        slot.onclick = () => {
            TrinketState.capacity = i;
            renderTrinketCap();
            calcTrinket();
        };
        slotContainer.appendChild(slot);
    }
    valLabel.innerText = `${TrinketState.capacity}회`;
}

// 3. Toggle Recharge
function toggleTrRecharge() {
    const chk = document.getElementById('chkTrRecharge');
    const dropArea = document.getElementById('dropTrinketRec');
    if (!chk || !dropArea) return;

    if (chk.checked) {
        dropArea.style.opacity = '1.0';
        dropArea.style.pointerEvents = 'auto'; // Enable interaction
    } else {
        dropArea.style.opacity = '0.3';
        dropArea.style.pointerEvents = 'none'; // Disable interaction
    }
    updateTrinketState();
    calcTrinket();
}


// 4. Drop Zones
function bindTrinketDropZone() {
    const el = document.getElementById('dropTrinketEff');
    if (!el) return;

    el.ondragover = e => { e.preventDefault(); el.classList.add('drag-over'); };
    el.ondragleave = () => el.classList.remove('drag-over');
    el.ondrop = (e) => {
        e.preventDefault(); el.classList.remove('drag-over');
        let idx = e.dataTransfer.getData('idx');
        let type = e.dataTransfer.getData('type');
        if (type !== 'trEff') return;

        const data = TRINKET_EFFECTS[idx];
        createDroppedTrinketItem(el, data, idx);

        updateTrinketState();
        calcTrinket();
    };
}

function bindRechargeDropZone() {
    const el = document.getElementById('dropTrinketRec');
    if (!el) return;

    el.ondragover = e => { e.preventDefault(); el.classList.add('drag-over'); };
    el.ondragleave = () => el.classList.remove('drag-over');
    el.ondrop = (e) => {
        e.preventDefault(); el.classList.remove('drag-over');
        let idx = e.dataTransfer.getData('idx');
        let type = e.dataTransfer.getData('type');
        if (type !== 'trRec') return;

        // Clear existing (Single recharge condition usually?)
        // User said "area" implying maybe multiple? 
        // Typically recharge is one condition. Let's allow one for simplicity/safety closer to logic.
        // But if user drags another, replace it? Or append? 
        // Logic says "Cost" vs "Gain". Multiple conditions = AND? OR?
        // Let's assume Single Condition for now based on BQM structure.
        el.innerHTML = '';

        const data = RECHARGE_TYPES[idx];
        createDroppedRechargeItem(el, data, idx);

        updateTrinketState();
        calcTrinket();
    };
}

// Create Item Helpers
// Create Item Helpers
function createDroppedTrinketItem(parent, data, idx, state = {}) {
    let div = document.createElement('div');
    div.className = 'd-item eff';
    div.dataset.idx = idx;

    let leftPart = `<span>${data.name}</span>`;
    let rightPart = '';

    // Specialized Inputs
    if (data.isSubstitute) { // <치환> A -> B
        let die = state.die || 'red';
        let from = (state.from !== undefined) ? state.from : (die === 'red' ? 0 : 1);
        let to = (state.to !== undefined) ? state.to : (die === 'red' ? 1 : 2);

        rightPart += `
            <select class="spec-inp die-sel" style="width:50px; margin-right:5px;" onchange="updateTrinketState(); calcTrinket()">
                <option value="red" ${die === 'red' ? 'selected' : ''}>🟥</option>
                <option value="white" ${die === 'white' ? 'selected' : ''}>⬜</option>
            </select>
            <input type="number" class="spec-inp from-val" value="${from}" min="0" max="6" style="width:35px;" oninput="updateTrinketState(); calcTrinket()">
            <span>➜</span>
            <input type="number" class="spec-inp to-val" value="${to}" min="0" max="6" style="width:35px; margin-left:5px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()">
        `;
    } else if (data.isModulate) { // <변조> Flip (EV)
        let die = state.die || 'red';

        rightPart += `
            <select class="spec-inp die-sel" style="width:50px; margin-right:5px;" onchange="updateTrinketState(); calcTrinket()">
                <option value="red" ${die === 'red' ? 'selected' : ''}>🟥</option>
                <option value="white" ${die === 'white' ? 'selected' : ''}>⬜</option>
            </select>
            <span style="font-size:0.8rem; color:#888;">(Auto EV)</span>
        `;
    } else if (data.isReroll) { // 1. Reroll (Red vs White)
        let die = state.die || 'red';
        rightPart += `
            <select class="spec-inp die-sel" style="width:50px; margin-right:5px;" onchange="updateTrinketState(); calcTrinket()">
                <option value="red" ${die === 'red' ? 'selected' : ''}>🟥</option>
                <option value="white" ${die === 'white' ? 'selected' : ''}>⬜</option>
            </select>
        `;
    } else if (data.isHand) { // 3. Hand Size
        let count = state.count || 1;
        rightPart += `+<input type="number" class="spec-inp count-val" value="${count}" min="1" max="5" style="width:35px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()"> 장`;
    } else if (data.isCatalyst) { // 4. Catalyst
        let type = state.type || 'combustion';
        rightPart += `
            <select class="spec-inp type-sel" style="width:60px; margin-right:5px;" onchange="updateTrinketState(); calcTrinket()">
                <option value="combustion" ${type === 'combustion' ? 'selected' : ''}>🔥연소</option>
                <option value="condensation" ${type === 'condensation' ? 'selected' : ''}>💧응축</option>
            </select>
        `;
    } else if (data.isCycle) { // 5. Cycle
        let count = state.count || 1;
        rightPart += `<input type="number" class="spec-inp count-val" value="${count}" min="1" style="width:35px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()"> 장`;
    } else if (data.isScryCorrupt || data.isScryDeck) { // 7 & 8. Scry
        let count = state.count || 3;
        rightPart += `<input type="number" class="spec-inp count-val" value="${count}" min="1" style="width:35px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()"> 장`;
    } else if (data.isInversion || data.isInitiative) { // 2 & 6. Fixed/Simple
        // No inputs needed
    } else if (data.hasCount) { // Card Draw (Legacy/Generic)
        let count = state.count || 1;
        rightPart += `<input type="number" class="spec-inp count-val" value="${count}" min="1" style="width:40px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()"> 장`;
    } else {
        // Standard Amount
        let qty = state.val || 1;
        rightPart += `<input type="number" value="${qty}" min="1" style="width:40px; margin-right:5px;" oninput="updateTrinketState(); calcTrinket()">`;
    }

    // Fix deletion bug: Use closest('.d-item')
    rightPart += `<span class="del-btn" onclick="this.closest('.d-item').remove(); updateTrinketState(); calcTrinket()">×</span>`;

    div.innerHTML = leftPart + '<div style="display:flex; align-items:center;">' + rightPart + '</div>';

    div.onmouseenter = e => showTrinketTooltip(e, data.name, data.desc);
    div.onmousemove = moveTrinketTooltip;
    div.onmouseleave = hideTrinketTooltip;

    parent.appendChild(div);
}

function createDroppedRechargeItem(parent, data, idx, state = {}) {
    let div = document.createElement('div');
    div.className = 'd-item th'; // Use TH style (blue/green)
    div.dataset.idx = idx;

    // Name + Input X
    let xVal = (state.x !== undefined) ? state.x : data.defaultX;

    let html = `<span>${data.name.replace('X', '')}</span>`;

    if (!data.isBinary) {
        html += `<span style="font-size:0.8rem; margin:0 5px;">Val:</span>`;
        html += `<input type="number" class="th-val" value="${xVal}" style="width:40px;" oninput="updateTrinketState(); calcTrinket()">`;
    }

    html += `<span class="del-btn" onclick="this.closest('.d-item').remove(); updateTrinketState(); calcTrinket()">×</span>`;

    div.innerHTML = html;
    div.onmouseenter = e => showTrinketTooltip(e, data.name, data.desc);
    div.onmousemove = moveTrinketTooltip;
    div.onmouseleave = hideTrinketTooltip;

    parent.appendChild(div);
}

function updateTrinketState() {
    // Effects
    const effEl = document.getElementById('dropTrinketEff');
    const newEffects = [];
    for (let child of effEl.children) {
        let idx = parseInt(child.dataset.idx);
        let itemData = { idx };

        // Check for special inputs
        let dieSel = child.querySelector('.die-sel');
        if (dieSel) itemData.die = dieSel.value;

        let fromInp = child.querySelector('.from-val');
        if (fromInp) itemData.from = parseInt(fromInp.value);

        let toInp = child.querySelector('.to-val');
        if (toInp) itemData.to = parseInt(toInp.value);

        let countInp = child.querySelector('.count-val');
        if (countInp) itemData.count = parseInt(countInp.value);

        let typeSel = child.querySelector('.type-sel');

        // Generic val

        if (typeSel) itemData.type = typeSel.value;  // For Catalyst

        // Generic val
        let genInp = child.querySelector('input:not(.spec-inp)');
        if (!dieSel && !countInp && !fromInp && !toInp && !typeSel) {
            let inp = child.querySelector('input');
            if (inp) itemData.val = parseFloat(inp.value);
        }

        newEffects.push(itemData);
    }
    TrinketState.effects = newEffects;

    // Recharge
    TrinketState.rechargeEnabled = document.getElementById('chkTrRecharge').checked;

    const recEl = document.getElementById('dropTrinketRec');
    if (recEl.children.length > 0) {
        let child = recEl.children[0];
        let idx = parseInt(child.dataset.idx);
        let xInp = child.querySelector('.th-val');
        let x = xInp ? parseFloat(xInp.value) : RECHARGE_TYPES[idx].defaultX;

        TrinketState.recharge = { idx, x };
    } else {
        TrinketState.recharge = null;
    }
}

// 5. Results
function updateTrinketUIResults(score, v_base, n_exp, e_recharge, term_base, fData) {
    document.getElementById('trResScore').innerText = score.toFixed(1);

    document.getElementById('trResVal').innerText = term_base.toFixed(1) + " V";
    document.getElementById('trResVal').previousElementSibling.innerText = "기본 잠재력 (Base)";

    document.getElementById('trResUses').innerText = "+" + e_recharge.toFixed(1) + " V";
    document.getElementById('trResUses').previousElementSibling.innerText = "충전 이득 (Recharge)";
    // n_exp passed here is actually N_eff or similar? In calc it was passed as n_eff.
    // Let's keep display logic as is for specific text
    document.getElementById('trResUses').nextElementSibling.innerText = `N_eff: ${n_exp.toFixed(1)}`;

    updateTrinketTier(score);

    if (fData) {
        renderTrinketFormula(fData);
    }
}

function renderTrinketFormula(f) {
    const el = document.getElementById('trinketFormulaDisplay');
    if (!el) return;

    let html = '';

    // Base Avg
    html += `<span class="f-op">(</span>`;
    html += createTermHtml(f.baseAvg.toFixed(1), "Base", "기본 위협", "장신구 효과의 턴당 평균 기대 위협도입니다.");
    html += `<span class="f-op">+</span>`;

    // Recharge Avg
    html += createTermHtml(f.recAvg.toFixed(1), "Rec", "충전 이득", "충전 조건 달성 시 얻는 턴당 추가 이득입니다.");
    html += `<span class="f-op">)</span>`;

    html += `<span class="f-op">×</span>`;

    // Duration
    html += createTermHtml(f.duration.toFixed(1), "Turn", "전투 지속", "표준 사이클 이론(8턴)에 따른 전투 지속 시간입니다.");

    html += `<span class="f-op">×</span>`;

    // Gravity
    html += createTermHtml("1.1", "Gravity", "슬롯 보정", "무자원 슬롯 가치에 대한 10% 프리미엄 보정입니다.");

    html += `<span class="f-op">=</span>`;
    html += createTermHtml(f.score.toFixed(1), "Score", "최종 점수", "장신구의 최종 가치 평가 점수입니다.");

    el.innerHTML = html;

    // Tooltips (Reuse ui.js logic referenced by main window scope or duplicate helpers if needed)
    // Trinket mode is same window, so ui.js globals might overlap if named same.
    // ui.js has createTermHtml? Yes.
    // Let's rely on global createTermHtml if valid, or ensure we have access.
    // Actually ui.js is loaded in index.html, so createTermHtml should be available.

    // Bind events
    el.querySelectorAll('.f-term').forEach(t => {
        t.onmouseenter = e => showTooltip(e, t.dataset.title, t.dataset.desc); // UI.js global?
        t.onmousemove = moveTooltip;
        t.onmouseleave = hideTooltip;
    });
}

function updateTrinketTier(score) {
    let tierDef = TRINKET_TIERS[0];
    for (let i = TRINKET_TIERS.length - 1; i >= 0; i--) {
        if (score >= TRINKET_TIERS[i].min) {
            tierDef = TRINKET_TIERS[i];
            break;
        }
    }
    const labelEl = document.getElementById('trResGrade');
    labelEl.innerText = tierDef.label;
    labelEl.style.color = tierDef.color;

    // Marker position
    const max = 45.0;
    let p = Math.min(100, Math.max(0, (score / max) * 100));
    document.getElementById('trTierMarker').style.left = p + '%';
    document.getElementById('trTierLabel').innerText = score.toFixed(1);
}

// Tooltips
const trTt = document.getElementById('tooltip');
function showTrinketTooltip(e, t, d) {
    if (!trTt) return;
    trTt.innerHTML = `<strong>${t}</strong>${d}`;
    trTt.style.display = 'block';
    moveTrinketTooltip(e);
}
function moveTrinketTooltip(e) {
    if (!trTt) return;
    trTt.style.left = (e.clientX + 15) + 'px';
    trTt.style.top = (e.clientY + 15) + 'px';
}
function hideTrinketTooltip() {
    if (!trTt) return;
    trTt.style.display = 'none';
}
