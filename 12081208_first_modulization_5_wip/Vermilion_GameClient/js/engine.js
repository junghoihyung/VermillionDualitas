// Vermilion_GameClient/js/engine.js
// ==================================================================================
// [MODULE 9] CLIENT ENGINE
// ==================================================================================
const Engine = {
    init: () => {
        State.units = [];
        State.w = DB.map.dimensions.w; State.h = DB.map.dimensions.h;
        State.map = { ...DB.map.map }; // Mutable Clone of terrain

        let pIdx = 0;
        for (let k in DB.map.entities) {
            const ent = DB.map.entities[k];
            const [x, y] = k.split(',').map(Number);

            if (ent.val && ent.val.startsWith('P')) {
                const charData = DB.chars[pIdx % DB.chars.length];

                // Auto-Equip Logic: Find first valid item for each slot from DB.equips
                const slots = ['head', 'torso', 'arm', 'legs', 'acc'];
                const equipped = {};

                slots.forEach(s => {
                    let targetSlot = null;
                    if (s === 'arm') targetSlot = 'WEP';
                    else if (s === 'torso') targetSlot = 'ARM';
                    else if (s === 'legs') targetSlot = 'BOOT';
                    else if (s === 'acc') targetSlot = 'ACC';

                    if (targetSlot && DB.equips && DB.equips.length) {
                        const item = DB.equips.find(e => e.slot === targetSlot);
                        if (item) {
                            equipped[s] = item;
                            Logger.sys(`Equipped [${s.toUpperCase()}]: ${item.name}`);
                        }
                    }
                });

                // Fallback / Default for empty slots
                if (!equipped.arm) equipped.arm = { name: "Rusty Blade (Mock)", cap: 3, type: 'WEP', slot: 'WEP', val: 0 };
                if (!equipped.torso) equipped.torso = { name: "Leather Vest (Mock)", cap: 3, type: 'ARM', slot: 'ARM', val: 0 };

                const playerUnit = {
                    id: `p${pIdx}`, type: 'player', name: charData.name, role: charData.role,
                    x, y, hp: charData.hp, maxHp: charData.hp, def: charData.def || 0,
                    dead: false, threat: 0,
                    equips: equipped
                };

                State.units.push(playerUnit);
                State.player.id = playerUnit.id;
                // BQM 1.2 Compendium Rule: Character Cards + 7 Basic Cards
                State.player.deck = [...charData.cards, ...DB.basicCards];
                Engine.shuffle(State.player.deck);
                State.player.hand = [];
                State.player.discard = [];
                State.player.diceSupply = { white: 3, red: 1 }; // Default Start Supply
                State.player.movePoints = 0; // [NEW] Movement Points

                Engine.drawCard(4);
                pIdx++;
            } else if (ent.type === 'enemy') {
                // Find matching enemy data in DB.enemies
                const enemyData = (DB.enemies || []).find(e => e.name === ent.name);

                // If not found, use a default fallback or the first available one to prevent crash
                const baseData = enemyData || (DB.enemies && DB.enemies[0]) || { name: ent.name || "Unknown", hp: 10, def: 0 };

                State.units.push({
                    id: `e_${k}`, type: 'enemy', name: baseData.name,
                    x, y,
                    hp: baseData.hp || 10,
                    maxHp: baseData.hp || 10,
                    def: baseData.def || 0,
                    data: baseData,
                    dead: false
                });
            }
        }

        Renderer.draw();
        Renderer.renderHand();
        Renderer.renderSidePanel();
        Logger.sys("System: Dice Supply & Improvisation Rules Active.");
    },

    shuffle: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    drawCard: async (n = 1) => {
        for (let i = 0; i < n; i++) {
            if (State.player.deck.length === 0) {
                if (State.player.discard.length > 0) {
                    // SHUFFLE ANIMATION TRIGGER
                    const dZone = document.getElementById('discardArea');
                    const cFace = document.getElementById('topDiscard');
                    if (dZone && cFace) {
                        dZone.classList.add('discard-anim');
                        // Wait for anim
                        await Engine.sleep(800);
                        dZone.classList.remove('discard-anim');
                    }

                    State.player.deck = [...State.player.discard];
                    State.player.discard = [];
                    Engine.shuffle(State.player.deck);
                    Logger.sys("Deck Reshuffled.");
                } else break;
            }
            const card = State.player.deck.pop();
            if (card) {
                card.isNew = true; // Triggers slide animation in Renderer
                State.player.hand.push(card);
            }
        }
        Renderer.renderHand();
        Renderer.renderSidePanel(); // Update piles
    },

    endPlayerTurn: async () => {
        // 4.6 Cleanup Phase Check
        // Hand Limit: Max 6. If exceeded, enter Interactive Discard Mode.
        if (State.player.hand.length > 6) {
            Logger.sys(`[Cleanup] Hand limit exceeded (${State.player.hand.length}/6). Select cards to discard.`);
            State.interaction.mode = 'CLEANUP_DISCARD';
            State.interaction.pendingDiscards = [];
            Renderer.renderHand();
            Renderer.renderSidePanel();
            Renderer.draw();
            return; // Stop execution
        }

        Logger.turn("End Turn. Enemy Phase.");
        // Reset Selection
        State.interaction.mode = 'IDLE';
        State.interaction.selectedCardIdx = -1;
        State.interaction.selectedEquipSlot = null;
        Renderer.renderHand();
        Renderer.draw();

        const enemies = State.units.filter(u => u.type === 'enemy' && !u.dead);
        // 4.3 Threat Phase (Simplified: Enemy rolls happened implicitly in logic, visualizing now)
        // 4.4 Enemy Action Phase
        for (let e of enemies) {
            // AI Logic with Wait
            await new Promise(r => setTimeout(r, 600));
            await CombatEngine.executeEnemyTurn(e);
        }

        Engine.startPlayerTurn();
    },

    confirmDiscard: () => {
        if (State.interaction.mode !== 'CLEANUP_DISCARD') return;

        const currentSize = State.player.hand.length;
        const discardCount = State.interaction.pendingDiscards.length;
        const newSize = currentSize - discardCount;

        if (newSize > 6) {
            Logger.warn(`Must discard down to 6! (Selected: ${discardCount}, New Size: ${newSize})`);
            return;
        }

        // Execute Discard
        // Sort indices descending to avoid splice shifting issues
        const sortedIndices = [...State.interaction.pendingDiscards].sort((a, b) => b - a);

        sortedIndices.forEach(idx => {
            const c = State.player.hand.splice(idx, 1)[0];
            State.player.discard.push(c);
        });

        Logger.sys(`Discarded ${discardCount} cards.`);
        State.interaction.pendingDiscards = [];
        State.interaction.mode = 'IDLE';

        // Resume Turn End
        Engine.endPlayerTurn();
    },

    startPlayerTurn: () => {
        Logger.turn("=== ROUND START ===");
        const p = State.units.find(u => u.id === State.player.id);

        // 4.0 Corruption Phase
        // Roll Black Die (1-4 Safety, 5-6 Corruption)
        CorruptionSystem.checkStartTurn(p);

        // 4.1 Ready Phase
        Engine.drawCard(2);

        // Refresh Supply (Mock Rule: Duality Track - Default 3W 1R)
        // TODO: Read Duality Track state
        State.player.diceSupply = { white: 3, red: 1 };
        State.player.movePoints = 0;

        Logger.sys("Player Turn Ready.");

        Renderer.draw();
        Renderer.renderHand();
        Renderer.renderSidePanel();
    },

    sleep: ms => new Promise(r => setTimeout(r, ms))
};
