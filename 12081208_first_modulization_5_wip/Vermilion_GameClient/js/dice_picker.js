// Vermilion_GameClient/js/dice_picker.js
const DicePicker = {
    currentAction: null,
    open: (card, target, slotName) => {
        const p = State.units.find(u => u.id === State.player.id);
        const equip = p.equips[slotName];

        // Check Improvisation
        // Mapping Card Icon to Slot. 
        // Card Types: '공격'(Attack) -> 'arm', '이동'(Move) -> 'legs', '방어'(Def) -> 'torso'
        let requiredSlot = '';
        if (card.type === '공격' || card.type === 'Attack') requiredSlot = 'arm';
        else if (card.type === '이동' || card.type === 'Move') requiredSlot = 'legs';
        else if (card.type === '방어' || card.type === 'Defense') requiredSlot = 'torso';

        const isImprov = (requiredSlot && requiredSlot !== slotName);

        const m = document.getElementById('modalOverlay');
        m.style.display = 'flex';

        DicePicker.currentAction = {
            card, target, equip,
            isImprov,
            selected: { white: 0, red: 0 }
        };
        DicePicker.render();
    },

    close: () => {
        document.getElementById('modalOverlay').style.display = 'none';
        DicePicker.currentAction = null;
    },

    add: (type) => {
        const act = DicePicker.currentAction;
        const total = act.selected.white + act.selected.red;

        if (act.isImprov) {
            // Improv: Only 1 White Die allowed TOTAL.
            if (total >= 1) return;
            if (type === 'red') return; // Cannot use Red in Improv (Rule 5.2: Only 1 White Imprint Die)
        } else {
            if (total >= act.equip.cap) return;
        }

        if (State.player.diceSupply[type] > act.selected[type]) {
            act.selected[type]++;
            DicePicker.render();
        }
    },

    remove: (type) => {
        const act = DicePicker.currentAction;
        if (act.selected[type] > 0) {
            act.selected[type]--;
            DicePicker.render();
        }
    },

    confirm: async () => {
        const act = DicePicker.currentAction;
        const count = act.selected.white + act.selected.red;
        if (count === 0) return;

        // Deduct Supply
        State.player.diceSupply.white -= act.selected.white;
        State.player.diceSupply.red -= act.selected.red;

        // Execute Logic
        const diceRes = DiceSystem.rollBatch(act.selected.white, act.selected.red);

        // --- Dice Keyword Processing (Step 7) ---
        const keys = (act.card.keywords || "").toLowerCase();

        // 1. Gambit (도박)
        // Rule: If using Red Dice, fail on 0. Else Red Sum * 2.
        if (keys.includes('gambit') || keys.includes('도박')) {
            const redDice = diceRes.filter(d => d.type === 'red');
            if (redDice.length > 0) {
                const hasZero = redDice.some(d => d.val === 0);
                if (hasZero) {
                    Logger.warn(`🎰💀 <b>GAMBIT FAIL!</b> Rolled a 0. Action Cancelled.`);
                    // Consume Supply but do nothing else
                    State.player.diceSupply.white -= act.selected.white;
                    State.player.diceSupply.red -= act.selected.red;
                    DicePicker.close();
                    Renderer.draw();
                    return; // EXIT ACTION
                } else {
                    Logger.log(`🎰✨ <b>GAMBIT SUCCESS!</b> Red Dice values Doubled!`);
                    redDice.forEach(d => d.val *= 2);
                }
            }
        }

        // 2. Modulate (변조)
        // Rule: Change lowest die to Max Value automatically
        if (keys.includes('modulate') || keys.includes('변조')) {
            // Find lowest
            let lowest = null;
            let minVal = 999;
            diceRes.forEach(d => {
                if (d.val < minVal) { minVal = d.val; lowest = d; }
            });

            if (lowest) {
                const maxVal = (lowest.type === 'white') ? 2 : 3;
                Logger.log(`🔧 <b>Modulate:</b> Changed [${lowest.val}] -> [${maxVal}]`);
                lowest.val = maxVal;
            }
        }

        // 3. Cycle (순환) - Executed after action, but note it here
        if (keys.includes('cycle') || keys.includes('순환')) {
            // Parse count
            const m = keys.match(/(?:cycle|순환)\s*(\d+)/);
            const cycleCount = m ? parseInt(m[1]) : 1;
            // We'll execute this after the main action block
            // Store in 'act' for later? Or just execute now?
            // Drawing cards is safe to do now.
            setTimeout(() => {
                Logger.log(`🔄 <b>Cycle ${cycleCount}:</b> Drawing cards...`);
                Engine.drawCard(cycleCount);
            }, 1000);
        }

        // 4. Deploy (배치) Logic
        if (keys.includes('deploy') || keys.includes('배치')) {
            Logger.log(`📌 <b>Deployed:</b> ${act.card.name}`);

            // Remove from Hand handled by caller logic? No, typically caller puts in discard.
            // We need to Intercept Discard logic or manually move it.
            // 'DicePicker' doesn't usually move cards; 'Engine.playCard'? 
            // Currently `DicePicker.confirm` is the end of the action.

            // Let's assume standard flow sends to discard. We will override this by adding a flag to `act`.
            act.isDeployed = true;

            // Add to Deployed State
            // Clone card to deployed to avoid reference issues if needed, but ref is fine.
            const deployedCard = { ...act.card, tokens: 0 }; // Initialize Tokens
            State.player.deployed.push(deployedCard);

            // Initial Effects on Deploy
            if (act.card.name.includes("Vendetta: Accumulation")) {
                deployedCard.tokens = 1;
                Logger.log("💢 Initial Threat Token placed on Vendetta.");
            }
        }

        // --- End Dice Keywords ---

        // --- Ripple Effects (BQM 1.2) ---
        let suppressedCount = 0;

        // 1. Threatening (Red 0)
        diceRes.forEach(d => {
            if (d.type === 'red' && d.val === 0) {
                // Determine target to Threaten
                // If Attacking: Target Enemy
                // If Defending: Attacking Enemy (which is stored where? Need context.)
                // Defending Context: 'act.target' might be null in defense mode?
                // In DEFENSE_SELECT mode, we need to know who is attacking.
                // Currently `State.interaction.pendingAttacker` is not explicitly saved, only `pendingDamage`.
                // For simplified V1: Only apply if `act.target` exists (Attack Mode).

                if (act.target && act.target.threat !== undefined) {
                    act.target.threat = (act.target.threat || 0) + 1;
                    Logger.warn(`💥 <b>Threatening!</b> Red [0] rolled. ${act.target.name} gains +1 💢Threat (Total: ${act.target.threat})`);
                }
            }
        });

        // 2. Suppressing (White 2)
        // Check for White 2s
        const whiteTwos = diceRes.filter(d => d.type === 'white' && d.val === 2);

        if (whiteTwos.length > 0 && act.target && (act.target.threat || 0) > 0) {
            // Ask Player: "Use '2' for Power OR Suppress Threat?"
            // Using browser confirm for simplicity in Step 3 Prototype
            // In a real app, this should be a nice UI modal.
            // BQM Rule: 1 White Die with '2' can flip 1 Threat -> Suppress.
            // We ask for EACH or ALL? checking all.

            // Allow suppressing up to N threats (min of Twos or Threats)
            // For simplicity: Ask to suppress ALL possible.
            const possible = Math.min(whiteTwos.length, act.target.threat);

            if (possible > 0) {
                // This `await` requires `confirm` to be async.
                await new Promise(r => setTimeout(r, 50)); // Render delay
                const doSuppress = window.confirm(`[Suppressing Opportunity]\nRolled ${whiteTwos.length}x '2'. Enemy has ${act.target.threat} Threat.\n\nConvert ${possible} Threat to Suppression?\n(This will reduce your Dice Sum by ${possible * 2})`);

                if (doSuppress) {
                    for (let i = 0; i < possible; i++) {
                        // Flip Token
                        act.target.threat--;
                        act.target.suppress = (act.target.suppress || 0) + 1;
                        // Reduce Value from Sum (set val to 0 or remove)
                        // Note: Dice objects in `diceRes` need to be modified or filtered.
                        // We need to modify the `diceRes` array values to 0 effectively for the sum calculation.
                        // Find a white 2 and zero it out.
                        const d = diceRes.find(x => x.type === 'white' && x.val === 2 && !x.suppressed);
                        if (d) {
                            d.val = 0;
                            d.suppressed = true;
                        }
                    }
                    suppressedCount = possible;
                    Logger.log(`💤 <b>Suppressing!</b> Converted ${possible} Threat -> Suppression.`);
                }
            }
        }

        // Calculate Final Sum (after Suppression zeros)
        const diceSum = diceRes.reduce((a, b) => a + b.val, 0);

        // Defense Logic (Updated with Ripple)
        if (State.interaction.mode === 'DEFENSE_SELECT') {
            const p = State.units.find(u => u.id === State.player.id);
            const cardPower = act.isImprov ? 0 : (act.card.power || 0); // Improv rule logic
            const totalDef = diceSum + cardPower + (act.equip.def || 0); // Assuming equip has def

            const dmg = Math.max(0, State.interaction.pendingDamage - totalDef);
            p.hp -= dmg;

            Logger.log(`🛡️ <b>Defended!</b> Roll: ${diceSum} + Card: ${cardPower}. Total Block: ${totalDef}. Taken: ${dmg}`);

            // Perfect Guard Check (BQM 1.2)
            // If damage prevented fully (dmg === 0) AND incoming (pendingDamage > 0)
            if (dmg === 0 && State.interaction.pendingDamage > 0) {
                // Recover 1 Die (Prefer Red if spent, else White)
                if (act.selected.red > 0) State.player.diceSupply.red++;
                else if (act.selected.white > 0) State.player.diceSupply.white++;
                Logger.log(`✨ <b>Perfect Guard!</b> Recovered 1 Die.`);
            }

            Renderer.draw();

            // Discard used card
            // In DicePicker.open, it stores 'card'. We can find it in hand and remove it.
            const cIdx = State.player.hand.indexOf(act.card);
            if (cIdx >= 0) State.player.hand.splice(cIdx, 1);

            State.interaction.mode = 'IDLE';
            State.interaction.pendingDamage = 0;
            DicePicker.close();

            Renderer.renderHand();
            Renderer.renderSidePanel();

            // Resume Enemy Turn
            if (State.interaction.defenseResolve) State.interaction.defenseResolve();
            return;
        }

        if (act.target) {
            // Combat
            const p = State.units.find(u => u.id === State.player.id);
            const result = CombatEngine.resolveAttack(p, act.target, act.card, diceRes, act.isImprov, act.equip);

            act.target.hp -= result.damage;
            if (act.target.hp <= 0) act.target.dead = true;

            const typeStr = act.isImprov ? "⚠️IMPROVISATION" : "Standard";
            Logger.log(`⚔️ [${typeStr}] <b>${act.card.name}</b> + [${act.equip.name}]`);
            Logger.log(`&nbsp;&nbsp;🎲 Sum: ${result.diceSum} -> Dmg: ${result.damage}`);

            // --- Keyword Logic Integration ---
            if (typeof KeywordSystem !== 'undefined') {
                const logs = KeywordSystem.apply(p, act.target, act.card, result.diceSum);
                if (logs.length > 0) {
                    Logger.log(`&nbsp;&nbsp;✨ Effect: ${logs.join(', ')}`);
                }
            }
        }
        else {
            // Move Action
            State.player.movePoints += diceSum;
            Logger.log(`🦵 <b>Move Action</b>: Gained ${diceSum} MP.`);

            // --- Corruption: Shackle ---
            // ID: 'shackle', Slot: Legs
            // Effect: 1 DMG per Move Action
            const p = State.units.find(u => u.id === State.player.id); // Re-fetch or use context
            if (p && p.statuses && p.statuses.find(s => s.id === 'shackle')) {
                p.hp -= 1;
                Logger.warn(`⛓️ <b>Shackle!</b> Took 1 DMG from moving.`);
                Renderer.draw(); // Update HP bar
            }

            State.interaction.mode = 'IDLE'; // Allow moving immediately
        }

        // Discard (Unless Deployed)
        if (!act.isDeployed) {
            if (State.interaction.selectedCardIdx !== -1) {
                State.player.discard.push(State.player.hand.splice(State.interaction.selectedCardIdx, 1)[0]);
            } else {
                // If dragging from hand directly, index might not be set in interaction state but we know the card
                const idx = State.player.hand.indexOf(act.card);
                if (idx >= 0) State.player.discard.push(State.player.hand.splice(idx, 1)[0]);
            }
        } else {
            // Remove from Hand but DO NOT add to Discard (It's in Deployed)
            if (State.interaction.selectedCardIdx !== -1) {
                State.player.hand.splice(State.interaction.selectedCardIdx, 1);
            } else {
                const idx = State.player.hand.indexOf(act.card);
                if (idx >= 0) State.player.hand.splice(idx, 1);
            }
        }

        // Reset
        State.interaction.selectedCardIdx = -1;
        State.interaction.selectedEquipSlot = null;
        State.interaction.mode = 'IDLE';
        DicePicker.close();

        Renderer.renderHand();
        Renderer.renderSidePanel();
        Renderer.draw();
    },

    render: () => {
        const act = DicePicker.currentAction;
        const total = act.selected.white + act.selected.red;
        const div = document.getElementById('modalContent');

        let warning = "";
        if (act.isImprov) warning = `<div style="color:var(--warn); margin-bottom:10px;">⚠️ <b>IMPROVISATION</b><br>Mismatch! Only 1 White Die allowed.<br>Effects Disabled.</div>`;

        div.innerHTML = `
            <h3>Dice Selection</h3>
            ${warning}
            <div style="margin-bottom:10px; color:#aaa;">Equip: ${act.equip.name} (Cap: ${act.isImprov ? 1 : act.equip.cap})</div>
            
            <div style="display:flex; gap:20px; justify-content:center; margin: 20px 0;">
                <div class="dice-col">
                    <div class="dice-icon white">⬜</div>
                    <div>${act.selected.white} / ${State.player.diceSupply.white}</div>
                    <div class="btn-group">
                        <button onclick="DicePicker.add('white')">+</button>
                        <button onclick="DicePicker.remove('white')">-</button>
                    </div>
                </div>
                <div class="dice-col">
                    <div class="dice-icon red" style="opacity:${act.isImprov ? 0.3 : 1}">🟥</div>
                    <div>${act.selected.red} / ${State.player.diceSupply.red}</div>
                    <div class="btn-group">
                        <button onclick="DicePicker.add('red')" ${act.isImprov ? 'disabled' : ''}>+</button>
                        <button onclick="DicePicker.remove('red')">-</button>
                    </div>
                </div>
            </div>
            
            <button class="btn primary" style="width:100%" onclick="DicePicker.confirm()">ROLL</button>
            <button class="btn" style="width:100%; margin-top:5px;" onclick="DicePicker.close()">CANCEL</button>
        `;
    }
};
