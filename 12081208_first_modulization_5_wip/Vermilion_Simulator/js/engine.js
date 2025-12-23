// Vermilion_Simulator/js/engine.js
// ==================================================================================
// [MODULE 9] ENGINE (MAIN LOOP)
// ==================================================================================
const Engine = {
    init: () => {
        State.units = [];
        State.w = DB.map.dimensions.w; State.h = DB.map.dimensions.h;

        let pIdx = 0;
        for (let k in DB.map.entities) {
            const ent = DB.map.entities[k];
            const [x, y] = k.split(',').map(Number);

            if (ent.val && ent.val.startsWith('P')) {
                const charData = DB.chars[pIdx % DB.chars.length];
                State.units.push({
                    id: `p${pIdx}`, type: 'player', name: charData.name, role: charData.role,
                    x, y, hp: charData.hp, maxHp: charData.hp, def: charData.def || 0,
                    hand: charData.cards.map(c => ({
                        ...c,
                        type: c.type || (c.name.includes('Defense') ? 'Defense' : (c.name.includes('Move') ? 'Move' : 'Attack'))
                    })),
                    dicePool: { white: 2, red: 1 },
                    dead: false, threat: 0,
                    equips: [],
                    placedCards: [],
                    concentration: 100, maxConc: 100,
                    pollution: 0
                });
                pIdx++;
            } else if (ent.type === 'enemy') {
                const enemyData = DB.enemies.find(e => e.name === ent.name) || DB.enemies[0];
                State.units.push({
                    id: `e_${k}`, type: 'enemy', name: ent.name,
                    x, y, hp: enemyData ? enemyData.hp : 10, maxHp: enemyData ? enemyData.hp : 10,
                    def: enemyData ? enemyData.def : 0,
                    data: enemyData, dead: false, threat: 0
                });
            }
        }

        Renderer.draw();
        Logger.sys("Simulation Ready. FULL LOGIC ENABLED.");
    },

    next: async () => {
        State.turn++;
        Logger.turn(`TURN ${State.turn}`);

        if (Engine.checkEndCondition()) return;

        // 1. Enemy Phase (Advanced AI)
        const enemies = State.units.filter(u => u.type === 'enemy' && !u.dead);
        for (let e of enemies) {
            const decision = EnemyBrain.decideAction(e, State);
            await EnemyBrain.execute(e, decision);
        }

        // 2. Player Phase (MCTS)
        const players = State.units.filter(u => u.type === 'player' && !u.dead);

        // [Agenda 2] Squad Mind: Intent Declaration Phase
        State.sharedMind.intents = {};
        for (let p of players) {
            SquadMindSystem.declareIntent(p, State);
        }

        for (let p of players) {
            State.activeUnit = p.id;

            // [Agenda 3] Concentration Decay
            ConcentrationSystem.decay(p);

            // [Phase 1] Corruption Check
            CorruptionSystem.checkStartTurn(p);

            // [Agenda 7] Entropy Check (Pollution)
            // If pollution is high, skip turn or limit actions
            if (p.pollution >= 3) {
                // 50% chance to lose turn cleaning up
                if (Math.random() < 0.5) {
                    p.pollution = Math.max(0, p.pollution - 2);
                    Logger.warn(`[Entropy] ${p.name} spends turn clearing Pollution (${p.pollution} left).`);
                    continue;
                }
            }

            const decision = SquadAI.planTurn(p);

            if (decision.type === 'skip') {
                Logger.warn(`[Player] ${p.name} skips turn (${decision.reason})`);
                continue;
            }

            if (State.autoMode) {
                Logger.ai(`🧠 <b>[${p.name}]</b> decides to <b>${decision.type.toUpperCase()}</b>`);
                Logger.log(`&nbsp;&nbsp;↳ Reason: ${decision.reason}`);
            }

            if (decision.move) {
                p.x = decision.move.x; p.y = decision.move.y;
            }
            if (decision.type === 'attack') {
                const t = State.units.find(x => x.id === decision.target);
                if (t) {
                    // Real Combat Execution
                    const diceRes = DiceSystem.rollBatch(2, 1); // 2 White 1 Red
                    const result = CombatEngine.resolveAttack(p, t, decision.card, diceRes);

                    t.hp -= result.damage;

                    // [Trap Check] (For knockback into traps)
                    TrapSystem.check(t);

                    // Log Details
                    const diceStr = diceRes.map(d => `<span class="${d.type === 'red' ? 'log-err' : 'log-dice'}">${d.val}</span>`).join(' ');
                    Logger.log(`[Combat] ${p.name} uses [${decision.card.name}]`);
                    Logger.log(`&nbsp;&nbsp;🎲 Rolls: ${diceStr} (Sum: ${result.diceSum})`);
                    Logger.log(`&nbsp;&nbsp;⚔️ Atk ${result.atkPower} vs Def ${result.defPower} => <b class="log-err">-${result.damage} HP</b>`);

                    if (result.killerId) {
                        LootSystem.recordKill(result.killerId, t);
                    }

                    if (result.threatChange > 0) { p.threat++; Logger.warn("⚠️ Threat Increased (Breakthrough Fail)"); }
                    if (result.threatChange < 0 && p.threat > 0) { p.threat--; Logger.ai("💎 Threat Suppressed (Imprint Crit)"); }

                    if (t.hp <= 0) { t.dead = true; Logger.warn(`${t.name} Defeated!`); }
                }
            }
            Renderer.draw();
            await Engine.sleep(State.autoMode ? 800 : 500);
        }

        if (State.autoMode) setTimeout(Engine.next, 1000);
    },

    checkEndCondition: () => {
        const players = State.units.filter(u => u.type === 'player');
        const enemies = State.units.filter(u => u.type === 'enemy');

        const livePlayers = players.filter(u => !u.dead);
        const liveEnemies = enemies.filter(u => !u.dead);

        if (livePlayers.length === 0) {
            CampaignManager.endQuest(false);
            return true;
        }
        if (liveEnemies.length === 0) {
            CampaignManager.endQuest(true);
            return true;
        }
        if (State.turn >= 20) { // Timeout
            Logger.warn("Quest Timeout (20 Turns)");
            CampaignManager.endQuest(false);
            return true;
        }
        return false;
    },

    toggleAuto: () => {
        State.autoMode = !State.autoMode;
        document.getElementById('btnAuto').innerText = State.autoMode ? "🤖 AUTO ON" : "🤖 AUTO OFF";
        if (State.autoMode) Engine.next();
    },
    sleep: ms => new Promise(r => setTimeout(r, ms))
};
