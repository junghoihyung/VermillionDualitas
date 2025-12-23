// Vermilion_EnemyCalc/js/calc.js
// === BQM 4-Beat v1.2 Enemy Engine ===

function updateDiceEngine() {
    let cnt = parseInt(document.getElementById('slCount').value);
    let ratio = parseInt(document.getElementById('slRatio').value);
    document.getElementById('slRatio').max = cnt;
    if (ratio > cnt) { ratio = cnt; document.getElementById('slRatio').value = cnt; }

    STATE.diceCount = cnt; STATE.redCount = ratio; STATE.whiteCount = cnt - ratio;
    document.getElementById('dispCount').innerText = cnt; document.getElementById('dispComp').innerText = `⬜${STATE.whiteCount} : 🟥${STATE.redCount}`;

    let dist = { 0: 1.0 };
    for (let i = 0; i < STATE.whiteCount; i++) dist = convolve(dist, FACES.W);
    for (let i = 0; i < STATE.redCount; i++) dist = convolve(dist, FACES.R);

    STATE.probMap = dist; STATE.maxSum = (STATE.whiteCount * 2) + (STATE.redCount * 3);
    let maxP = 0; for (let k in dist) if (dist[k] > maxP) maxP = dist[k]; STATE.maxProb = maxP;

    document.getElementById('distInfo').innerText = `Max: ${STATE.maxSum}`;
    STATE.cut1 = Math.floor(STATE.maxSum * 0.3); STATE.cut2 = Math.floor(STATE.maxSum * 0.7);
    STATE.yellows = STATE.yellows.filter(s => s <= STATE.maxSum);

    renderZones(); renderGraphAndSlider(); calc();
}

function toggleAddMode() { STATE.isAddMode = !STATE.isAddMode; document.getElementById('btnAddYellow').classList.toggle('active', STATE.isAddMode); }
function toggleYellow(sum) {
    if (!STATE.isAddMode) return;
    let idx = STATE.yellows.indexOf(sum);
    if (idx >= 0) { STATE.yellows.splice(idx, 1); delete STATE.zoneValues.y[sum]; }
    else { STATE.yellows.push(sum); STATE.yellows.sort((a, b) => a - b); if (!STATE.zoneValues.y[sum]) STATE.zoneValues.y[sum] = 0; }
    renderZones(); renderGraphAndSlider(); calc();
}

function togglePrioMode() {
    STATE.useCustomPriority = !STATE.useCustomPriority;
    const btn = document.getElementById('btnTogglePrio');
    const cont = document.getElementById('prioContainer');
    if (btn && cont) {
        if (STATE.useCustomPriority) {
            btn.classList.add('active'); btn.innerText = "⚡ 사용자 우선순위 사용"; cont.classList.remove('disabled');
        } else {
            btn.classList.remove('active'); btn.innerText = "🛑 기본값 사용"; cont.classList.add('disabled');
        }
    }
}

// === BQM 1.2 Calculation Logic ===
function calc() {
    // 1. Base DV (Defensive Value)
    // Formula: HP + (Def * 3.5) + Synergy
    let dv = STATE.hp + (STATE.def * 3.5) + (STATE.hp * STATE.def * 0.1);
    document.getElementById('dispDV').innerText = dv.toFixed(2) + " V";

    // 2. Dynamic Context
    const ctx = {
        deadAllies: parseInt(document.getElementById('ctxDead').value) || 0,
        threat: parseInt(document.getElementById('ctxThreat').value) || 0,
        suppress: parseInt(document.getElementById('ctxSuppress').value) || 0
    };

    // 3. Zone Calculation (Action Compression & Host-Modifier)
    let vB = sumZone('dropB', ctx); document.getElementById('vb').innerText = vB.toFixed(1) + 'V';
    let vG = sumZone('dropG', ctx); document.getElementById('vg').innerText = vG.toFixed(1) + 'V';
    let vR = sumZone('dropR', ctx); document.getElementById('vr').innerText = vR.toFixed(1) + 'V';
    let vP = sumZone('dropP', ctx); document.getElementById('vp').innerText = vP.toFixed(1) + 'V'; // Passives

    STATE.yellows.forEach(sum => {
        let v = sumZone(`dropY${sum}`, ctx);
        let el = document.getElementById(`vy${sum}`);
        if (el) el.innerText = v.toFixed(1) + 'V';
        STATE.zoneValues.y[sum] = v;
    });

    // 4. ETV Calculation (Horror Factor)
    // Horror Factor: Gap between Max Power (Red + Growth) and Min Power (Blue)
    let growthValue = 0;

    // Find 'grow' tags and use 'maxBonus'
    const allZones = ['dropB', 'dropG', 'dropR', 'dropP'];
    allZones.forEach(zid => {
        let z = document.getElementById(zid);
        if (z) {
            for (let c of z.children) {
                let dbName = c.dataset.db;
                let db = (dbName === 'ACT' ? ACTIONS : KEYWORDS);
                let d = db[c.dataset.idx];
                // Check if it's a growth keyword
                if (d.isGrowth && d.maxBonus) {
                    // e.g. Furious (+5.0) or Threatening Presence (+4.0)
                    growthValue += d.maxBonus;
                }
            }
        }
    });

    // Max Power: Red Zone + Growth Bonus
    let maxPower = vR + growthValue;
    // Min Power: Blue Zone (Floor)
    let minPower = vB;

    // Gap Calculation
    let gap = Math.max(0, maxPower - minPower);

    // Horror Bonus: 30% of Gap
    // "Variable-based Fear": Large variance adds theoretical threat.
    let horrorBonus = gap * 0.3;

    // Weighted Expectation (Inverse Stb)
    // Using BQM 1.2 "Weighted Expectation" formula: Sum of (Prob * ZoneValue)
    let meanOV = 0;
    let pB = 0, pG = 0, pR = 0;

    for (let s = 0; s <= STATE.maxSum; s++) {
        let p = STATE.probMap[s] || 0;
        let effS = s + ctx.threat - ctx.suppress;

        // Clamp effS? Actually BQM allows negative or over-max shifting, 
        // effectively mapping to Blue (<= cut1) or Red (> cut2) logic is safe if out of bounds?
        // No, BQM engine usually treats extreme outputs as mapped to extreme zones.
        // But logic below handles it: if (effS <= cut1) etc.

        let val = 0;
        if (STATE.yellows.includes(effS)) val = STATE.zoneValues.y[effS];
        else if (effS <= STATE.cut1) { pB += p; val = vB; }
        else if (effS <= STATE.cut2) { pG += p; val = vG; }
        else { pR += p; val = vR; }

        meanOV += p * val;
    }

    // Final ETV Formula:
    // ETV = DV + WeightedMean + Passives + HorrorBonus
    let etv = dv + meanOV + vP + horrorBonus;

    STATE.calculatedETV = parseFloat(etv.toFixed(1));

    // Update Headers
    let hdB = document.getElementById('hdB');
    if (hdB) hdB.innerHTML = `🟦 약화 <span class="header-prob">(${(pB * 100).toFixed(0)}%)</span>`;
    let hdG = document.getElementById('hdG');
    if (hdG) hdG.innerHTML = `🟩 표준 <span class="header-prob">(${(pG * 100).toFixed(0)}%)</span>`;
    let hdR = document.getElementById('hdR');
    if (hdR) hdR.innerHTML = `🟥 강화 <span class="header-prob">(${(pR * 100).toFixed(0)}%)</span>`;

    STATE.yellows.forEach(sum => {
        let hdY = document.getElementById(`hdY${sum}`);
        let probY = 0;
        for (let s = 0; s <= STATE.maxSum; s++) {
            if (s + ctx.threat - ctx.suppress === sum) probY += STATE.probMap[s] || 0;
        }
        if (hdY) hdY.innerHTML = `🟡 특수 [${sum}] <span class="header-prob">(${(probY * 100).toFixed(1)}%)</span>`;
    });

    document.getElementById('bigETV').innerText = etv.toFixed(1) + " V";
    updateTier(etv);
    renderGraphAndSlider();

    // Render Formula Breakdown (BQM 1.2)
    renderEnemyFormula({
        dv: dv,
        meanOV: meanOV,
        passives: vP,
        bestGap: gap,
        horror: horrorBonus,
        etv: etv,
        // Breakdown Data
        breakdown: {
            blue: { p: pB, v: vB },
            green: { p: pG, v: vG },
            red: { p: pR, v: vR },
            yellows: STATE.yellows.map(sum => ({
                sum: sum,
                p: getProbForSum(sum, ctx),
                v: STATE.zoneValues.y[sum] || 0
            })).filter(y => y.p > 0.001) // Only show relevant yellows
        }
    });
}

function getProbForSum(sum, ctx) {
    let p = 0;
    for (let s = 0; s <= STATE.maxSum; s++) {
        if (s + ctx.threat - ctx.suppress === sum) p += STATE.probMap[s] || 0;
    }
    return p;
}

function renderEnemyFormula(f) {
    const el = document.getElementById('formulaDisplay');
    if (!el) return;

    let html = '';

    // DV (Defense Value)
    html += createTermHtml(f.dv.toFixed(1), "DV", "방어 가치", "체력, 방어력, 시너지를 포함한 적의 기초 생존 스펙입니다.");
    html += `<span class="f-op">+</span>`;

    // MeanOV Expanded ( (Pb*Vb) + ... )
    html += `<span class="f-op">[</span>`;

    // Blue
    html += createTermHtml(f.breakdown.blue.v.toFixed(1), "V_blue", "약화 구간", "낮은 주사위 값일 때의 위협도입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml(`${(f.breakdown.blue.p * 100).toFixed(0)}%`, "P_blue", "확률", "약화 구간이 발생할 확률입니다.");

    html += `<span class="f-op">+</span>`;

    // Green
    html += createTermHtml(f.breakdown.green.v.toFixed(1), "V_std", "표준 구간", "일반적인 주사위 값일 때의 위협도입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml(`${(f.breakdown.green.p * 100).toFixed(0)}%`, "P_std", "확률", "표준 구간이 발생할 확률입니다.");

    html += `<span class="f-op">+</span>`;

    // Red
    html += createTermHtml(f.breakdown.red.v.toFixed(1), "V_red", "강화 구간", "높은 주사위 값일 때의 위협도입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml(`${(f.breakdown.red.p * 100).toFixed(0)}%`, "P_red", "확률", "강화 구간이 발생할 확률입니다.");

    // Yellows
    f.breakdown.yellows.forEach(y => {
        html += `<span class="f-op">+</span>`;
        html += createTermHtml(y.v.toFixed(1), `V_y${y.sum}`, `특수 [${y.sum}]`, "특정 눈금 합계에서 발생하는 특수 행동의 위협도입니다.");
        html += `<span class="f-op">×</span>`;
        html += createTermHtml(`${(y.p * 100).toFixed(0)}%`, "Prob", "확률", "특수 행동이 발생할 확률입니다.");
    });

    html += `<span class="f-op">]</span>`;
    html += `<span class="f-op">+</span>`;

    // Passives
    if (Math.abs(f.passives) > 0.01) {
        html += createTermHtml(f.passives.toFixed(1), "Passive", "패시브", "상시 적용되는 특수 능력 및 아우라 효과입니다.");
        html += `<span class="f-op">+</span>`;
    }

    // Horror
    html += `<span class="f-op">(</span>`;
    html += createTermHtml(f.bestGap.toFixed(1), "Gap", "변동폭", "최대 위협과 최소 위협의 차이입니다.");
    html += `<span class="f-op">×</span>`;
    html += createTermHtml("30%", "Factor", "심리 보정", "변동폭의 30%가 공포 점수로 가산됩니다.");
    html += `<span class="f-op">)</span>`;

    html += `<span class="f-op">=</span>`;
    html += createTermHtml(f.etv.toFixed(1), "ETV", "최종 위협", "적의 종합적인 전투력 지표입니다.");

    el.innerHTML = html;

    el.querySelectorAll('.f-term').forEach(t => {
        t.onmouseenter = e => showTooltip(e, t.dataset.title, t.dataset.desc);
        t.onmousemove = moveTooltip;
        t.onmouseleave = hideTooltip;
    });
}

// Helper for UI (Duplicate of EquipmentCalc logic for standalone safety)
function createTermHtml(val, sub, title, desc) {
    return `<div class="f-term" data-title="${title}" data-desc="${desc}">
        <span class="f-val">${val}</span>
        <span class="f-sub">${sub}</span>
    </div>`;
}

// Tooltip helpers (if not in scope, add them)
const tt = document.getElementById('global-tooltip');
function showTooltip(e, t, d) { if (tt) { tt.innerHTML = `<strong>${t}</strong>${d}`; tt.style.display = 'block'; moveTooltip(e); } }
function moveTooltip(e) { if (tt) { tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px'; } }
function hideTooltip() { if (tt) { tt.style.display = 'none'; } }

// === Action Compression & Host-Modifier Logic ===
function sumZone(id, ctx) {
    let z = document.getElementById(id); if (!z) return 0;

    let hostSum = 0;
    let modSum = 0; // Factors to add IF host exists
    let standaloneSum = 0; // Always added
    let actionCount = 0;
    let actionTypes = new Set();
    let hasHostAction = false;

    // 1. Gather Values
    for (let c of z.children) {
        let dbName = c.dataset.db;
        let db = (dbName === 'ACT' ? ACTIONS : KEYWORDS);
        let d = db[c.dataset.idx];
        let inp = c.querySelector('input');
        let x = inp ? parseFloat(inp.value) || 1 : 1;
        let val = d.calc(x, ctx);

        if (dbName === 'ACT') {
            hasHostAction = true;
            hostSum += val;
            if (d.type) actionTypes.add(d.type);
            actionCount++;
        } else {
            // Keyword
            if (d.role === 'modifier') {
                modSum += val;
            } else {
                // Standalone (Passives, Independent CC like Fall)
                standaloneSum += val;
            }
        }
    }

    // 2. Apply Host-Modifier Logic
    // "Modifier" is only valid if there is a Host Action.
    // Logic: Total = HostSum + (HostExists ? ModSum : 0) + StandaloneSum
    let rawTotal = hostSum + standaloneSum;
    if (hasHostAction) {
        // Here we implement the additive "Boost" logic for modifiers (since data is flat V)
        rawTotal += modSum;
    }

    // 3. Action Compression (Multiplier)
    // Count distinct action types (Move, Atk, Def)
    let multiplier = 1.0;
    let typeCount = actionTypes.size;

    if (typeCount >= 3) multiplier = 1.5;      // Triple Compression (e.g. Move+Atk+Def)
    else if (typeCount >= 2) multiplier = 1.2; // Double Compression (e.g. Move+Atk)

    // Result
    return rawTotal * multiplier;
}

function updateTier(v) {
    let max = 100;
    let p = Math.min(100, Math.max(0, (v / max) * 100));
    let tm = document.getElementById('tierMarker');
    if (tm) tm.style.left = p + '%';
    let tl = document.getElementById('tierLabel');
    if (tl) tl.innerText = v.toFixed(1);

    // Grade Color
    let gel = document.getElementById('tierGrade'); // If exists
}
