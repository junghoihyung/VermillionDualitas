// Vermilion_EquipmentCalc/js/trinket_calc.js
// === Trinket Scoring Logic (BQM 4-Beat v1.2 Standard Cycle) ===

function calcTrinket() {
    let v_vec = { min: 0, std: 0, max: 0, stb: 0 };
    let v_base_stat_sum = 0; // For scalar fallback

    // 1. Calculate Effects Vector (Base Power per Usage)
    TrinketState.effects.forEach(eff => {
        const data = TRINKET_EFFECTS[eff.idx];
        if (!data) return;

        let val = 0;

        // <치환> (Substitute)
        if (data.isSubstitute) {
            const dieType = eff.die || 'red';
            const fromFace = (eff.from !== undefined) ? eff.from : 0;
            const toFace = (eff.to !== undefined) ? eff.to : 1;
            const probs = DICE_PROBS[dieType];
            const p = probs[fromFace] || 0;

            let v_target = toFace;
            if (toFace > 3) v_target = 3 + ((toFace - 3) * 1.5);

            let v_from = fromFace;
            let riskBonus = (dieType === 'red' && fromFace === 0) ? 5.0 : 0;
            let gain = Math.max(0, (v_target - v_from) + riskBonus);

            val = p * gain;
        }
        // <변조> (Modulate)
        else if (data.isModulate) {
            const dieType = eff.die || 'red';
            const probs = DICE_PROBS[dieType];
            let ev_sum = 0;

            const getVal = (f) => f;
            const getFlipVal = (f, type) => {
                if (type === 'white') {
                    if (f === 1) return 2; if (f === 2) return 1; return f;
                } else { // red
                    if (f === 0) return 3; if (f === 1) return 3; if (f === 3) return 0.333; return f;
                }
            };

            for (const [faceStr, p] of Object.entries(probs)) {
                let f = parseFloat(faceStr);
                let v_curr = getVal(f);
                let v_new = getFlipVal(f, dieType);
                let r_bonus = (dieType === 'red' && f === 0) ? 5.0 : 0;
                let gain = (v_new - v_curr) + r_bonus;
                if (gain > 0) ev_sum += p * gain;
            }
            val = ev_sum;
        }
        // Others
        else if (data.isReroll) val = (eff.die === 'red') ? 3.2 : 0.5;
        else if (data.isInversion) val = 3.5;
        else if (data.isHand) {
            let count = eff.count || 1;
            for (let i = 1; i <= count; i++) val += 2.0 * Math.pow(0.7, i - 1);
        }
        else if (data.isCatalyst) val = (eff.type === 'combustion') ? 2.0 : 1.6;
        else if (data.isCycle) {
            let x = eff.count || 1; val = 0.5 * x * (1 + (x / 10));
        }
        else if (data.isInitiative) val = 6.0;
        else if (data.isScryCorrupt) val = 1.0 + Math.log(eff.count || 1);
        else if (data.isScryDeck) val = 0.8 * (eff.count || 1);
        else if (data.hasCount) val = data.val * (eff.count || 1);
        else val = data.val * (eff.val || 1);

        // Type Alpha
        let alpha = 1.0;
        if (data.type === 'meta') alpha = 1.2;
        else if (data.type === 'conditional') alpha = 0.8;

        val *= alpha;

        // Sum to Base Stats (Per Cast Value)
        v_base_stat_sum += val;
    });

    // 2. Recharge & Cycle Theory (BQM 1.2 Section 10)
    // Standard Combat Constant: 8 Turns.
    // N_eff = 1.5 * P (weighted average activity)

    let P = 0; // Probability per turn
    let Cost = 0; // Cost per activation

    if (TrinketState.rechargeEnabled && TrinketState.recharge) {
        const rItem = TrinketState.recharge;
        const rType = RECHARGE_TYPES[rItem.idx];
        const calcRes = rType.calc(rItem.x);

        let D = calcRes.d;
        Cost = calcRes.cost;

        if (D > 0) P = 1.0 / D;
    }

    // 3. Calculating Score Components (Weighted N_eff)
    // 3. Calculating Score Components (Weighted N_eff)
    let net_val = Math.max(0, v_base_stat_sum - Cost);

    // Standard Cycle Theory (8 Turns) Weights
    const WEIGHTS = [3.0, 3.0, 1.5, 1.5, 1.5, 0.5, 0.5, 0.5]; // Sum = 12.0
    // Avg Weight = 1.5

    let scoreGuaranteed = 0;
    let scoreRecharge = 0;

    // Capacity defines how many initial charges are available "Guaranteed" without recharge.
    // T1 is always guaranteed (initial loadout).
    // T2..T8: If t <= Capacity, it's Guaranteed. Else, it requires Recharge (P).

    let currentCap = TrinketState.capacity || 1;

    for (let t = 1; t <= 8; t++) {
        let w = WEIGHTS[t - 1];

        if (t <= currentCap) {
            // Guaranteed Use (Consumes a charge)
            scoreGuaranteed += v_base_stat_sum * w;
        } else {
            // Requires Recharge (Prob P)
            // If P is probability of activity per turn:
            scoreRecharge += net_val * P * w;
        }
    }

    // Convert to Averages (div by 8)
    let avgGuaranteed = scoreGuaranteed / 8.0;
    let avgRecharge = scoreRecharge / 8.0;

    // Final Average Value Per Turn
    let avgVal = avgGuaranteed + avgRecharge;

    // Scale by Duration (8) and Gravity (1.1)
    let final_score = avgVal * 8.0 * 1.1;

    // Max Potential (Infinite Capacity or Perfect Recharge)
    // All turns are guaranteed base value.
    let max_potential_avg = (v_base_stat_sum * 12.0) / 8.0;
    // max_score = max_potential_avg * 8.0 * 1.1;

    TrinketState.score = final_score;

    // Define n_eff (Effective Activity Factor)
    // n_eff = Sum(Weights * P_active) / 8.0? No, usually scale factor.
    // Let's approximate: n_eff = (avgVal / v_base_stat_sum) * 8.0 ??
    // Or just use the weighted sum logic directly:
    // n_eff = (Sum(Guaranteed Weights) + Sum(Recharge Weights)*P) / 8.0
    let sumW_G = 0;
    let sumW_R = 0;
    for (let t = 1; t <= 8; t++) {
        if (t <= currentCap) sumW_G += WEIGHTS[t - 1];
        else sumW_R += WEIGHTS[t - 1];
    }
    let n_eff = (sumW_G + sumW_R * P) / 8.0;
    // Display purposes: "Effective Charges per Turn"? Usually "Effective Turns active".
    // Actually previous code was 0.375 + ...
    // Let's keep it consistent.

    // UI Update
    if (typeof updateTrinketUIResults === 'function') {
        updateTrinketUIResults(final_score, avgVal, n_eff, avgRecharge * 8.0, avgGuaranteed * 8.0, {
            baseAvg: avgGuaranteed, // Avg per turn from Guaranteed
            recAvg: avgRecharge,    // Avg per turn from Recharge
            duration: 8.0,
            gravity: 1.1,
            score: final_score
        });
    }
}

