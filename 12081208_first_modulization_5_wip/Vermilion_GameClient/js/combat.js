// Vermilion_GameClient/js/combat.js
// ==================================================================================
// [MODULE 6] COMBAT ENGINE
// ==================================================================================
const CombatEngine = {
    resolveAttack: (attacker, target, card, diceResults, isImprov = false, equipment = null) => {
        let atkPower = 0;
        if (!isImprov) {
            atkPower = card ? (card.power || 0) : 0;

            // --- Substitute (치환) Logic ---
            const keys = (card && card.keywords) ? (typeof card.keywords === 'string' ? card.keywords : card.keywords.join(' ')) : "";
            if (keys.toLowerCase().includes('substitute') || keys.includes('치환')) {
                // Determine Stat. Default/Existing Example: "Substitute Defense"
                // For now, if Substitute is present, we might add DEF to ATK? Or Replace?
                // Rule: "Use [Stat] instead of [Power]". 
                // Let's implement: Base Power = Player.Def (if available) + Dice.
                if (attacker.def !== undefined) {
                    atkPower = attacker.def;
                    Logger.log(`🔄 <b>Substitute!</b> Using DEF (${attacker.def}) as Base Power.`);
                }
            }

            if (equipment && equipment.val) {
                atkPower += parseFloat(equipment.val);
            }
        }
        let diceSum = diceResults.reduce((a, b) => a + b.val, 0);
        atkPower += diceSum;

        // --- Keyword Modifiers (Pre-Calc) ---
        let kwMods = { ignoreDef: false, bonusDmg: 0 };
        if (typeof KeywordSystem !== 'undefined' && card) {
            kwMods = KeywordSystem.getModifiers(attacker, target, card);
            if (kwMods.bonusDmg) {
                atkPower += kwMods.bonusDmg;
                Logger.log(`✨ <b>Keyword Bonus:</b> +${kwMods.bonusDmg} Dmg`);
            }
        }

        // --- 7.3 Close Range Disadvantage ---
        // If Equip Range >= 2 (Ranged) AND Distance <= 1 (Adjacent) -> Halve Atk
        const range = (equipment && equipment.range) ? equipment.range : 1;
        const dist = Physics.getDist(attacker, target);

        if (range >= 2 && dist <= 1) {
            atkPower = Math.floor(atkPower / 2);
            Logger.log(`⚠️ <b>Close Range Penalty!</b> ATK Halved.`);
        }

        let defPower = target.def || 0;

        // Penetrate Check
        if (kwMods.ignoreDef) {
            defPower = 0;
            Logger.log(`💉 <b>Penetrate!</b> Ignoring Defense.`);
        } else {
            if (target.shield) defPower += target.shield;
            const tile = Physics.getTile(target.x, target.y);
            if (tile === 2) defPower += 1; // Bone cover

            // --- Corruption: Corroded Armor ---
            if (target.statuses && target.statuses.find(s => s.id === 'corroded_armor')) {
                defPower = 0;
                Logger.warn(`🛡️🚫 <b>Corroded Armor!</b> Defense reduced to 0.`);
            }
        }

        let damage = Math.max(0, atkPower - defPower);
        return { damage, diceSum, atkPower, defPower };
    },

    executeEnemyTurn: async (enemy) => {
        // Use Real AI from Simulator
        if (typeof EnemyBrain !== 'undefined') {
            const decision = EnemyBrain.decideAction(enemy, State);
            Logger.ai(`🧠 ${enemy.name} decides: ${decision.zone.toUpperCase()} (${decision.totalPower})`);

            // Execute using the shared logic, or reimplement visual steps if needed.
            // EnemyBrain.execute relies on Engine.sleep(). Ensure GameClient Engine has it.
            await EnemyBrain.execute(enemy, decision);
        } else {
            console.error("EnemyBrain not found! Check imports.");
        }
    },

    promptDefense: (attacker, defender, incomingDmg) => {
        return new Promise(resolve => {
            // Show Defense Modal
            const m = document.getElementById('modalOverlay');
            const c = document.getElementById('modalContent');
            m.style.display = 'flex';

            c.innerHTML = `
                <h3>🛡️ DEFENSE REACTION</h3>
                <div style="color:#f55; font-size:1.2rem; margin-bottom:10px;">
                    Incoming Damage: <b>${incomingDmg}</b>
                </div>
                <div style="margin-bottom:15px; color:#aaa;">
                    Select a Defense Card from your hand to mitigate damage, or take the hit.
                </div>
                <button class="btn primary" style="width:100%" onclick="CombatEngine.resolveDefenseAction('DEFEND', ${incomingDmg})">✋ DEFEND (Select Card)</button>
                <button class="btn" style="width:100%; margin-top:10px; border-color:#f55; color:#f55;" onclick="CombatEngine.resolveDefenseAction('TAKE', ${incomingDmg})">🩸 TAKE HIT</button>
            `;

            // We need to store the resolve function to call it later
            State.interaction.defenseResolve = resolve;
        });
    },

    resolveDefenseAction: (action, dmg) => {
        const m = document.getElementById('modalOverlay');
        if (action === 'TAKE') {
            m.style.display = 'none';
            const p = State.units.find(u => u.id === State.player.id);
            p.hp -= dmg;
            Logger.log(`🩸 Took ${dmg} Damage. HP: ${p.hp}`);
            Renderer.draw();
            if (State.interaction.defenseResolve) State.interaction.defenseResolve();
        } else {
            // DEFEND Mode
            m.style.display = 'none'; // Hide modal to allow card selection
            State.interaction.mode = 'DEFENSE_SELECT';
            State.interaction.pendingDamage = dmg;
            Logger.sys("🛡️ Select a DEFENSE Card.");
            // Verify: Does User pick card -> Dice -> Calc? Yes.
            // We keep defenseResolve pending until DicePicker confirms.
        }
    }
};
