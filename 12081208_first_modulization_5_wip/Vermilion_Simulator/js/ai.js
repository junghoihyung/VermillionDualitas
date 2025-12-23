// Vermilion_Simulator/js/ai.js
// ==================================================================================
// [MODULE 7, 7.5, 8] AI SYSTEMS
// ==================================================================================

// --- Persona System ---
const PersonaSystem = {
    ARCHETYPES: {
        'Tanker': { aggro: 0.5, safety: 2.0, support: 2.0, efficiency: 1.0, gambit: 0.5, noise: 0.0 },
        'Berserker': { aggro: 2.5, safety: 0.0, support: 0.0, efficiency: 0.8, gambit: 2.0, noise: 1.5 },
        'Utility': { aggro: 0.8, safety: 1.2, support: 1.5, efficiency: 1.5, gambit: 0.5, noise: 0.0 },
        'Blaster': { aggro: 1.8, safety: 0.8, support: 0.2, efficiency: 1.2, gambit: 1.0, noise: 0.5 },
        'Standard': { aggro: 1.0, safety: 1.0, support: 1.0, efficiency: 1.0, gambit: 1.0, noise: 0.5 },
        'Survivor': { aggro: 0.1, safety: 4.0, support: 0.0, efficiency: 0.5, gambit: 0.0, noise: 0.5 },
        'Hyena': { aggro: 3.0, safety: 0.5, support: 0.0, efficiency: 2.0, gambit: 1.0, noise: 0.0 },
        'Gambler': { aggro: 1.5, safety: 0.2, support: 0.0, efficiency: 0.2, gambit: 4.0, noise: 4.0 },
        'Saint': { aggro: 0.0, safety: -1.0, support: 4.0, efficiency: 0.5, gambit: 0.0, noise: 0.0 },
        'Calculator': { aggro: 1.0, safety: 1.5, support: 0.5, efficiency: 3.0, gambit: 0.0, noise: 0.0 }
    },

    blend: (base, target, weight) => {
        const result = {};
        for (let key in base) {
            const v1 = base[key] || 0;
            const v2 = target[key] || 0;
            result[key] = v1 * (1 - weight) + v2 * weight;
        }
        return result;
    },

    resolve: (unit, state) => {
        const role = unit.role || 'Standard';
        let current = { ...PersonaSystem.ARCHETYPES[role] };
        if (!current) current = { ...PersonaSystem.ARCHETYPES['Standard'] };

        const logs = [];

        // A. Low HP -> Survivor
        const hpRatio = unit.hp / unit.maxHp;
        if (hpRatio < 0.4) {
            const weight = (0.4 - hpRatio) * 2.0;
            current = PersonaSystem.blend(current, PersonaSystem.ARCHETYPES['Survivor'], weight);
            if (weight > 0.3) logs.push(`😨 Fear(${Math.round(weight * 100)}%)`);
        }

        // B. Kill Opportunity -> Hyena
        const weakEnemy = state.units.find(u => u.type === 'enemy' && !u.dead && u.hp <= 4);
        if (weakEnemy) {
            const dist = Physics.getDist(unit, weakEnemy);
            if (dist <= 4) {
                const weight = 0.5;
                current = PersonaSystem.blend(current, PersonaSystem.ARCHETYPES['Hyena'], weight);
                logs.push(`🩸 Bloodthirst`);
            }
        }

        // C. Ally Critical -> Saint
        if (role !== 'Berserker') {
            const dyingAlly = state.units.find(u => u.type === 'player' && !u.dead && u.id !== unit.id && u.hp <= 3);
            if (dyingAlly) {
                const weight = 0.4;
                current = PersonaSystem.blend(current, PersonaSystem.ARCHETYPES['Saint'], weight);
                logs.push(`🛡️ Protect`);
            }
        }

        // D. Desperation -> Gambler
        const deadAllies = state.units.filter(u => u.type === 'player' && u.dead).length;
        if (deadAllies >= 1) {
            const weight = 0.3 * deadAllies;
            current = PersonaSystem.blend(current, PersonaSystem.ARCHETYPES['Gambler'], weight);
            logs.push(`🎲 Desperation`);
        }

        if (logs.length > 0 && Math.random() < 0.3) {
            Logger.ai(`[Persona] ${unit.name} shifts: ${logs.join(', ')}`);
        }

        return current;
    }
};

// --- Squad Mind System ---
const SquadMindSystem = {
    declareIntent: (unit, state) => {
        let bestIntent = null;
        let maxVal = -1;

        if (unit.hand) {
            unit.hand.forEach(card => {
                if (card.ai_data && card.ai_data.combo) {
                    const val = 5.0;
                    if (val > maxVal) {
                        bestIntent = { type: card.ai_data.combo.type, val: val, desc: `Wants to ${card.ai_data.combo.type}` };
                        maxVal = val;
                    }
                }
            });
        }

        if (bestIntent) {
            State.sharedMind.intents[unit.id] = bestIntent;
            Logger.ai(`[SquadMind] ${unit.name} pings: "${bestIntent.desc}"`);
        }
    },

    getSynergyBonus: (unit, action) => {
        let bonus = 0;
        const intents = State.sharedMind.intents;

        Object.entries(intents).forEach(([uid, intent]) => {
            if (uid === unit.id) return;
            if (intent.type === 'push' && action.type === 'attack') bonus += 2.0;
            if (intent.type === 'wall' && action.type === 'move') {
                const ally = State.units.find(u => u.id === uid);
                if (ally && Physics.getDist(action.move, ally) <= 2) bonus += 1.5;
            }
        });
        return bonus;
    }
};

// --- Enemy Brain ---
const EnemyBrain = {
    decideAction: (enemy, state) => {
        // 1. Roll Dice (Dynamic Pool)
        // Default to "R R" if no data
        const diceStr = (enemy.data && enemy.data.dice) ? enemy.data.dice : "R R";

        let wCount = 0;
        let rCount = 0;

        // Parse "2R 1W" or "R R W" formats
        // Simplified parser: count 'W' and 'R' chars, or digits before them
        // Let's assume space separated like "R R W" for now based on previous context
        const tokens = diceStr.split(' ');
        tokens.forEach(t => {
            if (t.includes('W') || t.includes('White') || t === '⬜') wCount++;
            else if (t.includes('R') || t.includes('Red') || t === '🟥') rCount++;
        });

        // Fallback if parsing failed
        if (wCount === 0 && rCount === 0) rCount = 2;

        const dice = DiceSystem.rollBatch(wCount, rCount);
        const sum = dice.reduce((a, b) => a + b.val, 0);

        // 2. Add Threat - Suppress (BQM 1.2)
        // Ensure enemy has threat/suppress properties
        const threat = enemy.threat || 0;
        const suppress = enemy.suppress || 0; // New Property

        const totalPower = sum + threat - suppress;

        // 3. Determine Zone
        // BQM 1.2 Rules:
        // Blue: < 4
        // Green: 4 <= x < 8
        // Red: 8 <= x < 12
        // Yellow: >= 12 OR Special Trigger

        let zone = 'blue';

        // Yellow Trigger Logic (Probability Void)
        // If enemy.data.yellow_trigger matches totalPower (e.g. 5), force Yellow
        const yellowTrigger = (enemy.data && enemy.data.yellow_trigger) ? enemy.data.yellow_trigger : null;

        if (yellowTrigger !== null && totalPower === yellowTrigger) {
            zone = 'yellow';
        } else if (totalPower >= 12) {
            zone = 'yellow';
        } else if (totalPower >= 8) {
            zone = 'red';
        } else if (totalPower >= 4) {
            zone = 'green';
        }

        // 4. Fetch Action from Data
        let actionDef = null;
        if (enemy.data && enemy.data.zones && enemy.data.zones[zone]) {
            actionDef = enemy.data.zones[zone];
        } else {
            // Fallback Defaults (Mock)
            if (zone === 'blue') actionDef = "M1";
            else if (zone === 'green') actionDef = "M2 A2";
            else if (zone === 'red') actionDef = "M3 A3";
            else actionDef = "M3 A4";
        }

        return { zone, totalPower, dice, actionDef, rawSum: sum, threat, suppress };
    },

    selectTarget: (enemy, candidates) => {
        if (!candidates || candidates.length === 0) return null;

        // Rule 4.3.2 Priority: Distance -> HP -> Hand -> Threat
        return candidates.sort((a, b) => {
            // 1. Distance (Ascending)
            const dA = Physics.getDist(enemy, a);
            const dB = Physics.getDist(enemy, b);
            if (dA !== dB) return dA - dB;

            // 2. HP (Ascending)
            if (a.hp !== b.hp) return a.hp - b.hp;

            // 3. Hand Size (Ascending)
            const hA = a.hand ? a.hand.length : 0;
            const hB = b.hand ? b.hand.length : 0;
            if (hA !== hB) return hA - hB;

            // 4. Tactical Threat (Random or Threat Priority)
            // Simulating "Player choice" or "Most Threatening"
            // Let's use internal 'threat' value if exists, else random deterministic (ID)
            return (b.threat || 0) - (a.threat || 0); // Higher threat targeted? Or ID?
            // Rule says "Players decide". AI should pick usually the one who acted most or is most dangerous.
        })[0];
    },

    execute: async (enemy, decision) => {
        if (decision.type === 'skip') {
            Logger.warn(`${enemy.name} is Stunned and skips turn.`);
            return;
        }

        // Detailed Log for BQM 1.2 Transparency
        Logger.log(`[Enemy] ${enemy.name} Rolls: ${decision.rawSum} + 💢${decision.threat} - 💤${decision.suppress} = <b>${decision.totalPower} (${decision.zone.toUpperCase()})</b>`);

        // Reset Round Temp stats if needed? (Shield usually reset at start of turn, implemented in engine cycle?)
        // Let's assume Engine resets shield.

        // Split by '+' for Chain Actions (e.g. "M2 + A3")
        // Also handle space separation as implicit chain or parallel?
        // Rules say: ➕ is sequential. Data format usually "M2+A3" or "M2 + A3".
        // Current fallback data uses space "M2 A2". We should handle both.
        const rawAction = decision.actionDef.replace(/\+/g, ' '); // Treat + as space separator
        const parts = rawAction.split(' ').filter(p => p.length > 0);

        for (let part of parts) {
            const type = part[0];
            const valStr = part.substring(1);
            const val = parseInt(valStr) || 1;

            if (type === 'M') { // Move
                const candidates = State.units.filter(u => u.type === 'player' && !u.dead);
                const target = EnemyBrain.selectTarget(enemy, candidates);

                if (target) {
                    // Logic 4.3.1: Movement AI
                    const reachable = SquadAI.bfs(State, enemy, val);

                    const isRanged = decision.actionDef.includes('Range') || enemy.name.includes('Ungulus');

                    reachable.sort((a, b) => {
                        const dA = Physics.getDist(a, target);
                        const dB = Physics.getDist(b, target);

                        if (isRanged) {
                            if (dA <= 4) { // In range?
                                const tA = Physics.getTile(a.x, a.y);
                                const tB = Physics.getTile(b.x, b.y);
                                if (tA === 2 && tB !== 2) return -1;
                                if (tB === 2 && tA !== 2) return 1;
                            }
                        }

                        if (dA === dB) {
                            const tA = Physics.getTile(a.x, a.y);
                            const tB = Physics.getTile(b.x, b.y);
                            return tA - tB; // Prefer Muscle (1) over Bone (2)
                        }
                        return dA - dB;
                    });

                    if (reachable.length > 0) {
                        const dest = reachable[0];
                        enemy.x = dest.x; enemy.y = dest.y;
                        Renderer.draw();
                        await Engine.sleep(300); // Visual Delay
                    }
                }
            }
            else if (type === 'A' || type === 'R') { // Attack (Melee or Ranged)
                // Ranged (R) logic might differ slightly (LOS check), but for now treat similarly
                const range = (type === 'R') ? 4 : 1;
                const candidates = State.units.filter(u => u.type === 'player' && !u.dead && Physics.getDist(u, enemy) <= range);
                const target = EnemyBrain.selectTarget(enemy, candidates);

                if (target) {
                    const dmg = Math.max(0, val - (target.def || 0));

                    // TODO: Prompt Player Defense Reaction Here?
                    // Currently Simulator just applies damage. GameClient handles interaction.
                    // If running in Client Mode, we should pause?
                    // But GameClient's Engine calls this. 
                    // To support Defense, we might need a callback or wait.
                    // For now, auto-resolve to keep simulation flows valid.

                    target.hp -= dmg;
                    Logger.warn(`${enemy.name} Attacks ${target.name}! (${val} vs Def ${target.def || 0}) => -${dmg} HP`);
                    if (target.hp <= 0) { target.dead = true; Logger.warn(`${target.name} Collapsed!`); }
                    Renderer.draw();
                    await Engine.sleep(300);
                }
            }
            else if (type === 'S' || part.includes('🛡️')) { // Shield
                enemy.shield = (enemy.shield || 0) + val;
                Logger.log(`${enemy.name} gains 🛡️${val} Shield.`);
                Renderer.draw();
            }
            else if (type === 'T' || part.includes('💢')) { // Threaten (Self-Buff Threat)
                enemy.threat = (enemy.threat || 0) + val;
                Logger.warn(`${enemy.name} Enrages! (💢+${val})`);
                Renderer.draw();
            }
            else if (part.startsWith('Pull')) {
                const pullVal = parseInt(part.replace('Pull', '')) || 1;
                const candidates = State.units.filter(u => u.type === 'player' && !u.dead && Physics.getDist(u, enemy) <= pullVal + 1);
                const target = EnemyBrain.selectTarget(enemy, candidates);
                if (target) KeywordSystem.forcedMove(target, enemy, pullVal, 'pull');
            }
        }
    }
};

// --- MCTS Class ---
class MCTSNode {
    constructor(state, parent = null, action = null) {
        this.state = state;
        this.parent = parent;
        this.action = action;
        this.children = [];
        this.visits = 0;
        this.score = 0;
    }
    isLeaf() { return this.children.length === 0; }
    select() {
        let best = null, bestVal = -Infinity;
        for (let c of this.children) {
            const uct = (c.score / c.visits) + 1.41 * Math.sqrt(Math.log(this.visits) / c.visits);
            if (uct > bestVal) { bestVal = uct; best = c; }
        }
        return best;
    }
    expand(possibleActions) {
        for (let act of possibleActions) {
            const nextState = VirtualWorld.apply(this.state, act);
            this.children.push(new MCTSNode(nextState, this, act));
        }
    }
    update(val) { this.visits++; this.score += val; }
}

// --- Squad AI (MCTS Manager) ---
const SquadAI = {
    planTurn: (unit) => {
        if (unit.stunned) {
            unit.stunned = false;
            return { type: 'skip', reason: 'Stunned' };
        }
        if (unit.knockedDown) {
            unit.knockedDown = false;
            return { type: 'skip', reason: 'Standing Up (Knocked Down)' };
        }

        Logger.ai(`[MCTS] Planning for ${unit.name}...`);
        const rootState = VirtualWorld.clone(State);
        const root = new MCTSNode(rootState);

        const start = performance.now();
        let iter = 0;

        const conc = ConcentrationSystem.getPenalty(unit);
        const maxIter = Math.floor(RULES.MCTS_ITER * conc.iterMod);
        const searchRange = 3 + conc.rangeMod;

        while (performance.now() - start < 100 && iter < maxIter) {
            let node = root;
            while (!node.isLeaf() && node.visits > 0) node = node.select();

            if (node.visits > 0 || node === root) {
                const moves = SquadAI.getValidMoves(node.state, unit.id, searchRange);
                if (moves.length > 0) {
                    node.expand(moves);
                    node = node.children[0];
                }
            }

            const val = SquadAI.evaluate(node.state, unit.id, conc.noise);
            let curr = node;
            while (curr) { curr.update(val); curr = curr.parent; }
            iter++;
        }

        if (root.children.length === 0) return { type: 'skip', reason: "No valid moves." };
        const best = root.children.reduce((a, b) => a.visits > b.visits ? a : b);
        const score = (best.score / best.visits).toFixed(1);
        const act = best.action;
        let reason = `(Score: ${score}) `;

        if (act.type === 'attack') {
            const t = rootState.units.find(u => u.id === act.target);
            reason += `Calculated efficient trade against ${t ? t.name : 'Target'}.`;
        } else if (act.type === 'move') {
            const tile = Physics.getTile(act.move.x, act.move.y);
            const tName = tile === 2 ? "Bone(Vantage)" : "Muscle";
            reason += `Tactical move to ${tName} [${act.move.x},${act.move.y}].`;
        }

        act.reason = reason;
        Logger.ai(`[MCTS] ${iter} iters. Selected: ${act.type} ${reason}`);
        return act;
    },

    getValidMoves: (state, uid, range = 3) => {
        const u = state.units.find(x => x.id === uid);
        if (!u) return [];
        let acts = [];
        const reach = SquadAI.bfs(state, u, range);

        reach.forEach(pos => {
            const enemies = state.units.filter(e => e.type === 'enemy' && !e.dead);
            enemies.forEach(e => {
                if (Physics.getDist(pos, e) <= 1) {
                    if (u.hand && u.hand.length > 0) {
                        u.hand.forEach(card => {
                            acts.push({ type: 'attack', move: pos, target: e.id, card: card });
                        });
                    } else {
                        acts.push({ type: 'attack', move: pos, target: e.id, card: { name: 'Basic', power: 2 } });
                    }
                }
            });
            acts.push({ type: 'move', move: pos });
        });
        return acts;
    },

    bfs: (state, u, range) => {
        // [Bind Check]
        if (u.bindVal !== undefined) {
            range = Math.min(range, u.bindVal);
        }

        let q = [{ x: u.x, y: u.y, c: 0 }];
        let visited = new Set([`${u.x},${u.y}`]);
        let res = [{ x: u.x, y: u.y }];

        while (q.length > 0) {
            let curr = q.shift();
            if (curr.c >= range) continue;
            [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dx, dy]) => {
                let nx = curr.x + dx, ny = curr.y + dy;
                let cost = Physics.getCost(nx, ny, u);

                if (cost < 900 && curr.c + cost <= range) {
                    if (!visited.has(`${nx},${ny}`)) {
                        visited.add(`${nx},${ny}`);
                        q.push({ x: nx, y: ny, c: curr.c + cost });
                        res.push({ x: nx, y: ny });
                    }
                }
            });
        }
        return res;
    },

    evaluate: (state, uid, noise = 0) => {
        let score = 0;
        const u = state.units.find(x => x.id === uid);
        if (!u || u.dead) return -1000;

        const persona = PersonaSystem.resolve(u, state);

        score += u.hp * RULES.VAL_HP * persona.safety;

        const enemies = state.units.filter(e => e.type === 'enemy');
        enemies.forEach(e => {
            if (e.dead) score += RULES.VAL_KILL * persona.aggro;
            else {
                score -= e.hp * 2 * persona.aggro;
                if (e.threat > 2) score -= 10 * persona.safety;
            }
        });

        const tile = Physics.getTile(u.x, u.y);
        if (tile === 2) score += 5 * persona.efficiency;

        if (noise > 0) {
            score += (Math.random() * noise * 2) - noise;
        }
        return score;
    }
};
