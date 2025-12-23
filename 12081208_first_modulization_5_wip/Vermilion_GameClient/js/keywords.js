// Vermilion_GameClient/js/keywords.js
// ==================================================================================
// [MODULE 6.6] KEYWORD SYSTEM
// ==================================================================================
const KeywordSystem = {
    // Main Entry Point
    apply: (attacker, target, card, diceResult) => {
        const logs = [];
        if (!card.keywords) return logs;

        // Parse Keywords (e.g. "Penetrate, Push 1")
        // Check for String or Array
        let keys = [];
        if (typeof card.keywords === 'string') keys = card.keywords.split(',').map(k => k.trim());
        else if (Array.isArray(card.keywords)) keys = card.keywords;

        const totalDmg = (typeof diceResult === 'number') ? diceResult : 0; // Context dependent

        keys.forEach(k => {
            // Split "Name Value" (e.g. "Push 1" -> ["Push", "1"])
            const parts = k.split(' ');
            const keyName = parts[0].toLowerCase();
            const val = parseInt(parts[1]) || 0;

            if (KeywordSystem.handlers[keyName]) {
                const msg = KeywordSystem.handlers[keyName](attacker, target, val, totalDmg, card);
                if (msg) logs.push(msg);
            }
        });
        return logs;
    },

    // Specific Logic Handlers
    handlers: {
        // --- Attack Keywords ---
        'penetrate': (atk, tgt, val, dmg, card) => {
            // Logic handled in Pre-Calc hooks usually.
            // But we Log it here.
            return `Undefined Apply: Penetrate`;
        },

        'push': (atk, tgt, val, dmg, card) => {
            if (!tgt) return;
            // Check for Siege
            let siege = 0;
            if (card && card.keywords && typeof card.keywords === 'string' && card.keywords.toLowerCase().includes('siege')) {
                const m = card.keywords.toLowerCase().match(/siege\s*(\d+)/);
                if (m) siege = parseInt(m[1]);
            }
            KeywordSystem.forcedMove(tgt, atk, val, 'push', siege);
            return `Pushed ${tgt.name} ${val} tiles` + (siege ? ` (Siege ${siege})` : '');
        },

        'pull': (atk, tgt, val, dmg, card) => {
            if (!tgt) return;
            // Check for Siege (Rare but possible)
            let siege = 0;
            if (card && card.keywords && typeof card.keywords === 'string' && card.keywords.toLowerCase().includes('siege')) {
                const m = card.keywords.toLowerCase().match(/siege\s*(\d+)/);
                if (m) siege = parseInt(m[1]);
            }
            KeywordSystem.forcedMove(tgt, atk, val, 'pull', siege);
            return `Pulled ${tgt.name} ${val} tiles`;
        },

        'contagion': (atk, tgt, val, dmg) => {
            if (dmg > 0 && typeof CorruptionSystem !== 'undefined') {
                CorruptionSystem.draw(val, tgt);
                return `Contagion! ${tgt.name} gains ${val} Corruption`;
            }
            return null;
        },

        'scourge': (atk, tgt, val, dmg) => {
            // Logic handled in getModifiers (Damage Bonus)
            const bonus = (tgt.threat || 0) * val;
            return `Scourge (+${bonus} Dmg found)`;
        },

        'exploit': (atk, tgt, val, dmg) => {
            // Logic handled in getModifiers (Damage Bonus)
            const bonus = (tgt.suppress || 0) * val;
            return `Exploit (+${bonus} Dmg found)`;
        }
    },

    // Hook for Pre-Calculation (Damage Modifiers)
    getModifiers: (attacker, target, card) => {
        const mods = { ignoreDef: false, bonusDmg: 0 };
        if (!card.keywords) return mods;

        const keyStr = (typeof card.keywords === 'string') ? card.keywords.toLowerCase() : card.keywords.join(',').toLowerCase();

        if (keyStr.includes('penetrate')) mods.ignoreDef = true;

        // Scourge (Dmg per Threat)
        if (keyStr.includes('scourge')) {
            // Parse value
            const match = keyStr.match(/scourge\s*(\d+)/);
            const factor = match ? parseInt(match[1]) : 1;
            const threat = target.threat || 0;
            mods.bonusDmg += (threat * factor);
        }

        // Exploit (Dmg per Suppress)
        if (keyStr.includes('exploit')) {
            const match = keyStr.match(/exploit\s*(\d+)/);
            const factor = match ? parseInt(match[1]) : 1;
            const suppress = target.suppress || 0;
            mods.bonusDmg += (suppress * factor);
        }

        return mods;
    },

    // Forced Move Logic with Siege
    forcedMove: (unit, origin, dist, type, siegeLvl = 0) => {
        // Calculate Direction vector
        let dx = unit.x - origin.x;
        let dy = unit.y - origin.y;

        // Normalize
        if (dx !== 0) dx = dx > 0 ? 1 : -1;
        if (dy !== 0) dy = dy > 0 ? 1 : -1;

        if (type === 'pull') { dx = -dx; dy = -dy; }

        for (let i = 0; i < dist; i++) {
            const nx = unit.x + dx;
            const ny = unit.y + dy;

            // 1. Terrain Check (Walls)
            const t = Physics.getTile(nx, ny);
            if (t === 3 || t === 4) {
                // Wall Collision!
                if (siegeLvl > 0) {
                    // SIEGE BREACH
                    Logger.log(`🚧💥 <b>SIEGE!</b> Wall at [${nx},${ny}] destroyed!`);
                    State.map[`${nx},${ny}`] = 6; // Convert to Spike

                    // Siege Damage (Penetrating)
                    unit.hp -= siegeLvl;
                    Logger.log(`&nbsp;&nbsp;Shard Dmg: -${siegeLvl} HP`);

                    // Spike Entry Damage
                    unit.hp -= 1;
                    Logger.log(`&nbsp;&nbsp;Spike Entry: -1 HP`);

                    if (unit.hp <= 0) { unit.dead = true; break; }

                    // Continue Movement (Momentum) through the new opening
                    // Update Unit Pos
                    unit.x = nx; unit.y = ny;
                    Renderer.draw();
                    continue; // Proceed to next step of push
                } else {
                    Logger.log(`${unit.name} hit a wall!`);
                    break; // Stop
                }
            }

            // 2. Unit Collision
            if (State.units.find(u => !u.dead && u.x === nx && u.y === ny)) {
                Logger.log(`${unit.name} bumped into someone!`);
                break;
            }

            // 3. Normal Move
            unit.x = nx;
            unit.y = ny;

            // Spike Check on Move
            if (Physics.getTile(nx, ny) === 6) {
                Logger.log(`🩸 ${unit.name} pushed onto Spike! (-1 HP)`);
                unit.hp -= 1;
                if (unit.hp <= 0) unit.dead = true;
            }

            Renderer.draw();
        }
    }
};

