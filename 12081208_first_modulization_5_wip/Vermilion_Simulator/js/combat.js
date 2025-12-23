// Vermilion_Simulator/js/combat.js
// ==================================================================================
// [MODULE 4, 5, 6, 6.7] COMBAT & KEYWORDS
// ==================================================================================

// --- Keyword System ---
const KeywordSystem = {
    apply: (effectStr, source, target) => {
        if (!effectStr) return;
        const tokens = effectStr.split(' ');

        tokens.forEach(token => {
            // 1. PUSH X
            if (token.startsWith('Push')) {
                const val = parseInt(token.replace('Push', '')) || 1;
                KeywordSystem.forcedMove(target, source, val, 'push');
            }
            // 2. PULL X
            else if (token.startsWith('Pull')) {
                const val = parseInt(token.replace('Pull', '')) || 1;
                KeywordSystem.forcedMove(target, source, val, 'pull');
            }
            // 3. STUN
            else if (token === 'Stun') {
                target.stunned = true;
                Logger.warn(`${target.name} is STUNNED!`);
            }
            // 4. PIERCE
            else if (token === 'Pierce') {
                target.pierced = true; // Flag for CombatEngine
            }
            // 5. CORRUPTION X
            else if (token.startsWith('Corrupt')) {
                const val = parseInt(token.replace('Corrupt', '')) || 1;
                if (typeof CorruptionSystem !== 'undefined' && !target.numb) CorruptionSystem.draw(val, target);
            }
            // 6. CONTAGION X
            else if (token.startsWith('Contagion')) {
                const val = parseInt(token.replace('Contagion', '')) || 1;
                source.nextAttackContagion = val;
            }
            // 7. NUMB
            else if (token === 'Numb') {
                target.numb = true;
                Logger.warn(`${target.name} is NUMB!`);
            }
            // 8. KNOCKED DOWN
            else if (token === 'KnockDown') {
                target.knockedDown = true;
                Logger.warn(`${target.name} was KNOCKED DOWN!`);
            }
            // 9. BIND X
            else if (token.startsWith('Bind')) {
                const val = parseInt(token.replace('Bind', '')) || 5;
                target.bindVal = val;
                Logger.warn(`${target.name} is BOUND (Val ${val})!`);
            }
            // 10. RETALIATE X
            else if (token.startsWith('Retaliate')) {
                const val = parseInt(token.replace('Retaliate', '')) || 0;
                target.retaliate = val;
            }
            // 11. RUPTURE X
            else if (token.startsWith('Rupture')) {
                const val = parseInt(token.replace('Rupture', '')) || 0;
                target.rupture = val;
            }
        });
    },

    forcedMove: (unit, origin, dist, type) => {
        let dx = unit.x - origin.x;
        let dy = unit.y - origin.y;

        // Normalize
        if (dx !== 0) dx = dx / Math.abs(dx);
        if (dy !== 0) dy = dy / Math.abs(dy);

        // Invert for Pull
        if (type === 'pull') { dx = -dx; dy = -dy; }

        for (let i = 0; i < dist; i++) {
            const nx = unit.x + dx;
            const ny = unit.y + dy;
            const cost = Physics.getCost(nx, ny, unit);

            if (cost < 900) { // Valid Move
                unit.x = nx; unit.y = ny;
                Logger.log(`${unit.name} was ${type}ed to (${nx},${ny})`);
            } else {
                // Collision Damage
                unit.hp -= 1;
                Logger.warn(`${unit.name} hit a wall! (-1 HP)`);
                break;
            }
        }
    }
};

// --- Equipment System ---
const EquipmentSystem = {
    getBonus: (unit, diceResults) => {
        let bonus = { atk: 0, def: 0 };
        if (!unit.equips) return bonus;

        unit.equips.forEach(eq => {
            // Passive
            if (eq.passiveAtk) bonus.atk += eq.passiveAtk;
            if (eq.passiveDef) bonus.def += eq.passiveDef;

            // Thresholds
            if (eq.thresholds && diceResults) {
                eq.thresholds.forEach(th => {
                    if (EquipmentSystem.checkThreshold(th.cond, diceResults)) {
                        if (th.effect === 'Atk') bonus.atk += th.val;
                        if (th.effect === 'Def') bonus.def += th.val;
                        if (th.effect === 'Heal') unit.hp = Math.min(unit.maxHp, unit.hp + th.val);
                        Logger.log(`[Equip] ${eq.name} triggers ${th.cond}!`);
                    }
                });
            }
        });
        return bonus;
    },

    checkThreshold: (cond, dice) => {
        const vals = dice.map(d => d.val);
        if (cond === 'Pair') {
            return new Set(vals).size < vals.length;
        }
        if (cond.startsWith('Sum>=')) {
            const target = parseInt(cond.split('>=')[1]);
            return vals.reduce((a, b) => a + b, 0) >= target;
        }
        return false;
    }
};

// --- Custom Card Logic ---
const CustomCardLogic = {
    // --- FLESH KNIGHT ---
    'Vendetta: Accumulation': (source, target, card, dice) => {
        if (!source.placedCards) source.placedCards = [];
        if (source.placedCards.find(c => c.name === card.name)) return { log: "Already active." };
        source.placedCards.push({ name: card.name, tokens: 0, active: true });
        Logger.sys(`[Skill] ${source.name} places [${card.name}] (Accumulating Threat).`);
        return { custom: true };
    },
    'Vendetta: Release': (source, target, card, dice) => {
        const placed = source.placedCards ? source.placedCards.find(c => c.name === 'Vendetta: Accumulation') : null;
        let extraDice = 0;
        if (placed && placed.tokens > 0) {
            extraDice = placed.tokens;
            placed.tokens = 0;
            Logger.sys(`[Skill] ${source.name} consumes ${extraDice} tokens for Extra Dice!`);
        }
        const extraRolls = DiceSystem.rollBatch(0, extraDice);
        const allDice = [...dice, ...extraRolls];
        return CombatEngine.resolveAttack(source, target, card, allDice);
    },

    // --- GWENDOLYN ---
    "Vacuum's Grasp": (source, target, card, dice) => {
        KeywordSystem.forcedMove(target, source, 2, 'pull');
        const dist = Physics.getDist(source, target);
        if (dist <= 1) {
            Logger.sys(`[Skill] Vacuum Pull successful! Gaining PIERCE.`);
            target.pierced = true;
        }
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- CLEOSTRATA ---
    "Latency: Mark": (source, target, card, dice) => {
        if (!State.traps) State.traps = [];
        State.traps.push({ x: target.x, y: target.y, type: 'mark', damage: 3, owner: source.id });
        Logger.sys(`[Skill] Cleostrata places a Latency Mark at (${target.x}, ${target.y}).`);
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- ALBANUS PONS ---
    "0-Friction Dash": (source, target, card, dice) => {
        if (Physics.getDist(source, target) > 1) {
            KeywordSystem.forcedMove(source, target, 5, 'pull');
            Logger.sys(`[Skill] Albanus Slides towards ${target.name}!`);
        }
        source.evasion = true;
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- TURBALIO GELLIUS ---
    "Argos: Repulsion": (source, target, card, dice) => {
        KeywordSystem.forcedMove(target, source, 3, 'push');
        Logger.sys(`[Skill] Turbalio BLASTS ${target.name} back 3 tiles!`);
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- CASSIUS LATISSIMUS ---
    "Bombarda: Scatter": (source, target, card, dice) => {
        const result = CombatEngine.resolveAttack(source, target, card, dice);
        const splashDmg = Math.floor(result.damage / 2);
        if (splashDmg > 0) {
            Logger.sys(`[Skill] Bombarda Explodes! (${splashDmg} Splash DMG)`);
            State.units.forEach(u => {
                if (u.id !== target.id && u.id !== source.id && !u.dead && Physics.getDist(u, target) <= 1) {
                    u.hp -= splashDmg;
                    if (u.hp <= 0) { u.dead = true; Logger.warn(`${u.name} caught in explosion!`); }
                }
            });
        }
        return result;
    },

    // --- HEGIO GORDIAN ---
    "Mandibula: Bind": (source, target, card, dice) => {
        target.bindVal = 3;
        Logger.warn(`[Skill] Hegio BINDS ${target.name} (Movement restricted to 1).`);
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- GAIUS MARCELLUS ---
    "Fusion of Boundaries": (source, target, card, dice) => {
        if (!source.dicePool) source.dicePool = { white: 0, red: 0 };
        source.dicePool.white += 2;
        Logger.sys(`[Skill] Gaius enters Fusion state! (+2 White Dice)`);
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- HECTOR ---
    "Gigantes: Heavy Press": (source, target, card, dice) => {
        target.knockedDown = true;
        Logger.warn(`[Skill] Hector CRUSHES ${target.name}! (Knocked Down)`);
        return CombatEngine.resolveAttack(source, target, card, dice);
    },

    // --- PIUS FEMUR ---
    "Umbo Aperio": (source, target, card, dice) => {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (let d of dirs) {
            const nx = source.x + d[0], ny = source.y + d[1];
            if (Physics.createWall(nx, ny, 3)) break;
        }
        return CombatEngine.resolveAttack(source, target, card, dice);
    }
};

// --- Combat Engine ---
const CombatEngine = {
    resolveAttack: (attacker, target, card, diceResults) => {
        // [Phase 3] Custom Logic Hook
        if (card && CustomCardLogic[card.name]) {
            // Custom Logic calls logic, or we return standard 
            const res = CustomCardLogic[card.name](attacker, target, card, diceResults);
            if (res.custom) return { damage: 0, threatChange: 0, diceSum: 0, atkPower: 0, defPower: 0 }; // Abstract return
            return res;
        }

        return CombatEngine._resolveCore(attacker, target, card, diceResults);
    },

    _resolveCore: (attacker, target, card, diceResults) => {
        // 0. Apply Keywords (Pre-Damage)
        if (card && card.keywords) KeywordSystem.apply(card.keywords, attacker, target);

        // 1. Calculate Attack Power
        let atkPower = card ? (card.power || 2) : 2; // Base
        let diceSum = diceResults.reduce((a, b) => a + b.val, 0);
        atkPower += diceSum;

        // Equipment Modifiers
        const equipBonus = EquipmentSystem.getBonus(attacker, diceResults);
        atkPower += equipBonus.atk;

        // 2. Calculate Defense
        let defPower = target.def || 0;
        if (target.shield) defPower += target.shield;
        const targetEquip = EquipmentSystem.getBonus(target, null); // Passive only
        defPower += targetEquip.def;

        // Cover Bonus (Bone Tile)
        if (Physics.getTile(target.x, target.y) === 2) defPower += 1;

        // Pierce Check
        if (target.pierced) { defPower = 0; target.pierced = false; }

        // 3. Final Damage
        let damage = Math.max(0, atkPower - defPower);

        // [Agenda 9] Siege Mechanic
        if (card && card.keywords) {
            if (card.keywords.includes('Siege')) Physics.destroyWall(target.x, target.y);
            if (attacker.nextAttackContagion) {
                if (damage > 0 && typeof CorruptionSystem !== 'undefined') CorruptionSystem.draw(attacker.nextAttackContagion, target);
                attacker.nextAttackContagion = 0;
            }
        }

        // [Keyword: Retaliate]
        if (damage <= 0 && target.retaliate && target.retaliate > 0) {
            // Deal pure damage back
            attacker.hp -= target.retaliate;
            Logger.combat(`[Retaliate] ${target.name} deals ${target.retaliate} damage to ${attacker.name}!`);
        }

        // [Keyword: Rupture] (On Death)
        if (target.hp - damage <= 0 && target.rupture) {
            // AoE Damage
            Logger.combat(`[Rupture] ${target.name} EXPLODES! (${target.rupture} DMG to neighbors)`);
            State.units.forEach(u => {
                if (u.id !== target.id && !u.dead && Physics.getDist(u, target) <= 1) {
                    u.hp -= target.rupture;
                    if (u.hp <= 0) u.dead = true;
                }
            });
        }

        // 4. Side Effects (Ripple)
        let threatChange = 0;
        diceResults.forEach(d => {
            if (d.type === 'red' && d.val === 0) threatChange++; // Threatening
            if (d.type === 'white' && d.val === 2) threatChange--; // Suppressing
        });

        return { damage, threatChange, diceSum, atkPower, defPower, killerId: (target.hp - damage <= 0) ? attacker.id : null };
    }
};
