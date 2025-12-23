// Vermilion_EquipmentCalc/js/sim.js
// === BQM 4-Beat v1.2 Engine ===

const TIER_THRESHOLDS = {
    'T6': 12.1, 'T5': 17.6, 'T4': 26.4, 'T3': 35.2,
    'T2': 999, 'T1': 999
};

// Deprecated inputs (for compatibility)
function updDice() { calc(); }
function runSimulation() { console.log("Simulation removed in BQM v1.2"); }

/* === BQM v1.2 Main Logic === */
function calc() {
    // 1. Context & Setup
    const currentSlot = STATE.currentSlot || 'WEP';
    const weights = SLOTS[currentSlot] || SLOTS['WEP'];
    const capacity = STATE.capacity || 3;

    // 2. Generate Optimization Candidates (S_opt)
    let candidates = generateCandidates(capacity);
    let bestResult = { score: -Infinity };
    let mixResult = null; // S_mix for Penalty Calculation

    // 3. Iterate & Evaluate
    candidates.forEach(combo => {
        let stats = evaluateCombo(combo, capacity, currentSlot, weights);

        // Track S_mix (Standard Mix)
        if (combo.isMix) {
            mixResult = stats;
        }

        if (stats.score > bestResult.score) {
            bestResult = stats;
        }
    });

    // 4. Optimization Penalty (Sec 9.5)
    // Score = S_opt - max(0, S_opt - S_mix) * 0.2
    if (mixResult && bestResult.score > -Infinity) {
        let s_opt = bestResult.score;
        let s_mix = mixResult.score;
        let penalty = Math.max(0, s_opt - s_mix) * 0.2;
        bestResult.score -= penalty;
        bestResult.penaltyApplied = penalty; // For debug/display if needed
    }

    // 5. Update UI
    updateUI(bestResult);
}

function generateCandidates(n) {
    let res = [];
    // 1. Standard Mix (Baseline) - Marked as isMix
    res.push({ w: 0, r: 0, key: `SMD_${n}`, label: "Standard Mix", isMix: true });

    // 2. All Combinations
    for (let r = 0; r <= n; r++) {
        let w = n - r;
        let key = w > 0 && r > 0 ? `${w}W${r}R` : (w > 0 ? `${w}W` : `${r}R`);
        res.push({ w, r, key: key, label: `${w}각 ${r}돌`, isMix: false });
    }
    return res;
}

function evaluateCombo(combo, capacity, slot, weights) {
    // 4-Beat Vector
    let vecMin = 0, vecStd = 0, vecMax = 0;

    // 7.1. Capacity Coefficient (Sec 7.1)
    // Multiplier for Keywords based on Capacity
    // Cap 2: 1.0x, Cap 3: 1.5x, Cap 4: 2.0x, Cap 5: 2.5x
    let capCoeff = 1.0;
    if (capacity >= 5) capCoeff = 2.5;
    else if (capacity === 4) capCoeff = 2.0;
    else if (capacity === 3) capCoeff = 1.5;

    // A. Capacity Value (Linear) - Base Stats don't use multiplier?
    // "Determined by product of Potential(Capacity) and Keywords".
    // "Capacity Value itself... linearly treated."
    // Let's keep CapVal basic linear as floor.
    let capVal = capacity * 1.5;
    vecMin += capVal; vecStd += capVal; vecMax += capVal;

    // B. Base Effects (Always Active)
    const baseContainer = document.getElementById('dropBase');
    const baseEffects = getEffects(baseContainer);

    // Almanus Limit: +1 Die equivalent (approx 2.17V) if Armor
    if (document.getElementById('selChar').value === 'ALBANUS' && slot === 'ARM') {
        vecMin += 2.17; vecStd += 2.17; vecMax += 2.17;
    }

    // Apply Effects with Capacity Coefficient
    baseEffects.forEach(e => {
        vecMin += e.min * capCoeff;
        vecStd += e.std * capCoeff;
        vecMax += e.max * capCoeff;
    });

    // C. Logic Rows (Conditional)
    let logicRows = document.querySelectorAll('.logic-row');

    logicRows.forEach(row => {
        let thItem = row.querySelector('.th-drop .d-item.th');
        if (!thItem) return;

        let thIdx = thItem.dataset.idx;
        let thData = THRESHOLDS[thIdx];
        if (!thData) return;

        // Lookup Probability (Synchronized with Combo)
        let prob = 0;
        if (thData.probTable) {
            if (thData.probTable[combo.key] !== undefined) prob = thData.probTable[combo.key];
            else if (thData.probTable['Generic'] !== undefined) prob = thData.probTable['Generic'];
        }

        // Apply
        let specContainer = row.querySelector('.spec-drop');
        let specEffects = getEffects(specContainer);

        specEffects.forEach(e => {
            // Min: Only if guaranteed (Prob >= 1.0)
            if (prob >= 0.99) vecMin += e.min * capCoeff;

            // Std: Expected Value
            // Std += (Std_Effect * Coeff) * Prob
            vecStd += e.std * capCoeff * prob;

            // Max: Potential (Full power if triggered)
            if (prob > 0) vecMax += e.max * capCoeff;
        });
    });

    // D. Dynamic Threshold Bonus (Target Tier) & Stb Mitigation (Sec 3.2)
    const targetTier = document.getElementById('selTargetTier') ? document.getElementById('selTargetTier').value : 'T4';
    const limit = TIER_THRESHOLDS[targetTier] || 26.4;

    let bonus = 0;
    let stbMitigation = false;

    if (vecMax >= limit) {
        bonus = 2.5; // Turn Compression Bonus (Sec 3.3)
        stbMitigation = true; // One-Shot Capability mitigates Stb penalty
    }

    // E. Final Score Calculation (Sec 3. Formula)
    // Score = (Min * W_min) + (Std * W_std) + Bonus_pot
    // Bonus_pot = (Max - Std) * Stb * W_max

    // Calculate Stb (Stability)
    // "Gatekeeper determining the reflection ratio of Max score."
    // Stb = Std / Max (heuristic? Or explicit Stb property?)
    // Text says: "Stb (0.0~1.0)... Gatekeeper." and "Effect has Stb."
    // Here we use the *resultant* Stb of the build.
    // If Max > 0, Stb = Std / Max is a reasonable proxy for "Reliability" of the output.
    let stb = (vecMax > 0) ? (vecStd / vecMax) : 0;
    if (stb > 1.0) stb = 1.0;

    // Apply Stb Mitigation (Sec 3.2): "Mitigate Stb penalty by 50%."
    // "Penalty" usually means (1 - Stb). So Penalty * 0.5 means Stb increases.
    // Effective Stb = 1.0 - ((1.0 - Stb) * 0.5) = 0.5 + 0.5 * Stb
    if (stbMitigation) {
        stb = 0.5 + (0.5 * stb);
        if (stb > 1.0) stb = 1.0;
    }

    // Weighted Formula
    let termMin = vecMin * weights.min;
    let termStd = (vecStd + bonus) * weights.std;
    let bonusPot = (vecMax - vecStd) * stb * weights.max;
    let finalScore = (termMin + termStd + bonusPot) / 3.0;

    if (bonus > 0) {
        // Turn Compression Bonus is included in termStd above or added separately?
        // Logic above: `(vecStd + bonus)`. So it is inside termStd.
    }

    return {
        score: finalScore,
        min: vecMin,
        std: vecStd + bonus, // Effective Std for formula display
        max: vecMax,
        stb: stb, // Raw ratio (0.0~1.0)
        combo: combo,
        // Formula Data
        formula: {
            min: vecMin,
            wMin: weights.min,
            std: vecStd + bonus, // Displayed Std includes bonus
            wStd: weights.std,
            max: vecMax,
            wMax: weights.max,
            stb: stb, // 0.0-1.0
            bonus: bonus,
            role: weights.name,
            score: finalScore
        }
    };
}

function getEffects(container) {
    if (!container) return [];
    let res = [];
    for (let c of container.children) {
        let idx = c.dataset.idx; let db = c.dataset.db;
        let data = (db === 'spec' ? SPECIAL_EFFECTS : EFFECTS)[idx];
        let inp = c.querySelector('input');
        let x = inp ? parseFloat(inp.value) || 1 : 1;
        if (data && typeof data.calc === 'function') {
            res.push(data.calc(x));
        }
    }
    return res;
}

function updateUI(res) {
    if (!res) return;

    document.getElementById('resScore').innerText = res.score.toFixed(1);
    document.getElementById('resMax').innerText = res.max.toFixed(1);
    document.getElementById('resStb').innerText = (res.stb * 100).toFixed(0) + "%"; // fix scale

    let gradeText = getGradeText(res.score);
    document.getElementById('resMaxContext').innerText = `등급 (${gradeText.split(' ')[0]})`;

    updateTier(res.score);

    let dispComp = document.getElementById('dispComp');
    if (dispComp) {
        if (res.combo) {
            dispComp.innerHTML = `<span style="color:var(--accent); font-weight:bold;">${res.combo.label}</span> 추천`;
        }
    }

    // Call Formula Render
    if (typeof renderFormula === 'function' && res.formula) {
        renderFormula(res.formula);
    }
}

function updateTier(v) {
    let max = 40; // T1 starts at 40
    let p = Math.min(100, Math.max(0, (v / max) * 100));
    let tm = document.getElementById('tierMarker');
    if (tm) tm.style.left = p + '%';
    document.getElementById('tierLabel').innerText = v.toFixed(1);

    let g = getGradeText(v);
    let gel = document.getElementById('resGrade');
    gel.innerText = g.split(' ')[0];

    // Color code
    let color = '#4d7c0f'; // T6
    if (v >= 40) color = '#b91c1c'; // T1 Red
    else if (v >= 25) color = '#c2410c'; // T2 Orange
    else if (v >= 15) color = '#b45309'; // T3 Amber
    else if (v >= 10) color = '#a16207'; // T4 Gold
    else if (v >= 5) color = '#15803d'; // T5 Green

    gel.style.color = color;
}

function getGradeText(v) {
    if (v >= 40) return "T1 신화";
    if (v >= 25) return "T2 전설";
    if (v >= 15) return "T3 희귀";
    if (v >= 10) return "T4 고급";
    if (v >= 5) return "T5 일반";
    return "T6 폐급";
}
