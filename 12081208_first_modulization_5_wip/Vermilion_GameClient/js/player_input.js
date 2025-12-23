// Vermilion_GameClient/js/player_input.js
const PlayerInput = {
    isImprovising: false,

    activateImprov: () => {
        PlayerInput.isImprovising = true;
        Logger.sys("💡 IMPROVISATION MODE: Select a Card to use as fuel (Costs 1 White Die).");
        // Visual feedback needed?
        document.querySelector('.btn-improv').style.background = 'gold';
        document.querySelector('.btn-improv').style.color = 'black';
    },

    selectCard: (idx) => {
        if (State.interaction.mode === 'BURN_SELECT') {
            SpecialActions.executeBurn(idx);
            return;
        }

        const card = State.player.hand[idx];

        if (PlayerInput.isImprovising) {
            // Improv Logic: Select Card -> Requires White Die -> Select Equip
            if (State.player.diceSupply.white < 1) {
                Logger.warn("Need 1 White Die to improvise!");
                PlayerInput.isImprovising = false;
                document.querySelector('.btn-improv').style.background = ''; // Reset
                return;
            }
            State.interaction.selectedCardIdx = idx;
            State.interaction.mode = 'EQUIP_SELECT';
            Logger.sys(`Improvising with [${card.name}]. Select Equipment.`);
            return;
        }

        // AUTO-EQUIP LOGIC
        State.interaction.selectedCardIdx = idx;

        if (card.type === '공격' || card.type === 'Attack') {
            // Auto-Equip Arm
            State.interaction.selectedEquipSlot = 'arm';
            State.interaction.mode = 'TARGET_SELECT';
            Logger.sys(`Selected [${card.name}] (Auto-Arm). Choose Target.`);
        } else if (card.type === '이동' || card.type === 'Move') {
            // Auto-Equip Legs
            State.interaction.selectedEquipSlot = 'legs';
            State.interaction.mode = 'DICE_PICK_MOVE';
            // Open Dice Picker Immediately
            DicePicker.open(card, null, 'legs');
        } else {
            // Default / Defense / Other
            State.interaction.mode = 'EQUIP_SELECT'; // Fallback
            Logger.sys("Select Equipment.");
        }

        Renderer.renderHand();
        Renderer.renderSidePanel();
        Renderer.draw(); // Update Grid Highlights
    },

    selectEquipment: (slot) => {
        // Only used for Manual Selection (Improv, or non-auto types)
        if (State.interaction.mode !== 'EQUIP_SELECT') return;

        const card = State.player.hand[State.interaction.selectedCardIdx];
        State.interaction.selectedEquipSlot = slot;

        if (PlayerInput.isImprovising) {
            // Spend Cost
            State.player.diceSupply.white--;
            PlayerInput.isImprovising = false;
            document.querySelector('.btn-improv').style.background = '';

            // Open Dice Picker with Improv Context
            // Note: Improv usually forces 1 Inscription Die. 
            // We'll let DicePicker handle the 'force 1 white' logic 
            // or just pass standard context and let user roll.
            // User said: "Selected card uses 1 Inscription die to activate".
            DicePicker.open(card, null, slot);
        } else {
            // Standard Manual Flow
            if (card.type === '공격' || card.type === 'Attack') {
                State.interaction.mode = 'TARGET_SELECT';
            } else {
                DicePicker.open(card, null, slot);
            }
        }

        Renderer.renderSidePanel();
        Renderer.draw();
    },

    handleGridClick: async (x, y) => {
        const p = State.units.find(u => u.id === State.player.id);
        if (!p || p.dead) return;

        // 1. Attack Target Selection
        if (State.interaction.mode === 'TARGET_SELECT') {
            const target = State.units.find(u => u.type === 'enemy' && !u.dead && u.x === x && u.y === y);
            if (target) {
                const card = State.player.hand[State.interaction.selectedCardIdx];

                // Vantage Check (Bone Tile = Range +1)
                const myTile = Physics.getTile(p.x, p.y);
                const rangeBonus = (myTile === 2) ? 1 : 0;

                const dist = Physics.getDist(p, target);
                // Vantage Check (Bone Tile = Range +1) implemented in Range Check
                // LOS Check
                if (dist <= (card.range || 1) + rangeBonus) {
                    if (Physics.hasLOS(p, target)) {
                        // Open Dice Picker
                        DicePicker.open(card, target, State.interaction.selectedEquipSlot);
                    } else {
                        Logger.warn("Target blocked by Obstacle (LOS).");
                    }
                } else {
                    Logger.warn("Target out of range.");
                }
            }
            return;
        }

        // 2. Active Movement (Using MP)
        if (State.player.movePoints > 0) {
            const dist = Physics.getDist(p, { x, y });
            if (dist === 1) { // 1 Step at a time
                const cost = Physics.getCost(x, y);
                if (cost > 900) { Logger.warn("Blocked!"); return; }

                if (State.player.movePoints >= cost) {
                    State.player.movePoints -= cost;
                    p.x = x; p.y = y;
                    Logger.log(`Moved. MP Left: ${State.player.movePoints}`);

                    // Tile Effects (Spike)
                    const t = Physics.getTile(x, y);
                    if (t === 6) {
                        Logger.warn("Stepped on Spike! -1 HP");
                        p.hp -= 1;
                    }
                    Renderer.draw();
                } else {
                    Logger.warn(`Not enough MP! Need ${cost}, Have ${State.player.movePoints}`);
                }
            }
        }
    }
};
