// Vermilion_Simulator/js/systems.js
// ==================================================================================
// [MODULE 2.5, 6.5, 6.6, 7.6] SYSTEMS
// ==================================================================================

// --- Corruption System ---
const CorruptionSystem = {
    deck: [
        { id: 'static_shock', type: 'immediate', name: 'Static Shock', effect: 'Remove 1 Die' },
        { id: 'slip', type: 'immediate', name: 'Slip', effect: 'Random Move 1' },
        { id: 'memory_wipe', type: 'immediate', name: 'Memory Wipe', effect: 'Discard Best Card' },
        { id: 'blood_backflow', type: 'immediate', name: 'Blood Backflow', effect: '2 DMG' },
        { id: 'mad_whisper', type: 'immediate', name: 'Mad Whisper', effect: 'Convert White->Red' },

        { id: 'broken_bone', type: 'persistent', name: 'Broken Bone', effect: 'Heal 3 to Remove' },
        { id: 'muscle_spasm', type: 'persistent', name: 'Muscle Spasm', effect: 'Pay 2 Dice to Remove' },
        { id: 'phantom_pain', type: 'persistent', name: 'Phantom Pain', effect: '1 DMG per Turn' },
        { id: 'mucus', type: 'persistent', name: 'Mucus', effect: 'Roll Red 3 to Remove' },
        { id: 'rusty_blade', type: 'parasite', name: 'Rusty Blade', slot: 'Arm', effect: '+1 Threshold' },
        { id: 'shackle', type: 'parasite', name: 'Shackle', slot: 'Legs', effect: 'Move = 1 DMG' },
        { id: 'corroded_armor', type: 'parasite', name: 'Corroded Armor', slot: 'Torso', effect: 'DEF = 0' }
    ],

    draw: (amount, unit) => {
        for (let i = 0; i < amount; i++) {
            const card = CorruptionSystem.deck[Math.floor(Math.random() * CorruptionSystem.deck.length)];
            Logger.warn(`[Corruption] ${unit.name} drew [${card.name}]!`);
            CorruptionSystem.apply(unit, card);
        }
    },

    apply: (unit, card) => {
        if (card.type === 'immediate') {
            if (card.id === 'blood_backflow') { unit.hp -= 2; Logger.warn(`${unit.name} took 2 DMG from Blood Backflow.`); }
            else if (card.id === 'slip') {
                // Random Move
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                const d = dirs[Math.floor(Math.random() * dirs.length)];
                if (typeof KeywordSystem !== 'undefined') {
                    KeywordSystem.forcedMove(unit, { x: unit.x - d[0], y: unit.y - d[1] }, 1, 'slip');
                }
            }
            else if (card.id === 'static_shock') {
                // Remove die from supply implementation needed later
                Logger.warn(`${unit.name} lost a die (Static Shock) - TODO Impl`);
            }
        } else {
            // Persistent / Parasite
            if (!unit.statuses) unit.statuses = [];
            unit.statuses.push(card);
            Logger.warn(`${card.name} attached to ${unit.name}.`);
        }
    },

    checkStartTurn: (unit) => {
        // Roll Resistance
        const roll = DiceSystem.roll('black');
        Logger.log(`[Corruption] ${unit.name} Resistance Roll: 🎲${roll}`);
        if (roll >= 5) {
            Logger.warn(`${unit.name} Failed Resistance!`);
            CorruptionSystem.draw(1, unit);
        }

        // Process Persistent Effects
        if (unit.statuses) {
            unit.statuses.forEach(s => {
                if (s.id === 'phantom_pain') {
                    unit.hp -= 1;
                    Logger.warn(`[Phantom Pain] ${unit.name} takes 1 DMG.`);
                }
            });
        }
    }
};

// --- Loot System ---
const LootSystem = {
    pendingLoot: [], // { itemId: 'bone_large', ownerId: 'p0' }

    recordKill: (killerId, enemy) => {
        // Simple Drop Logic
        const loot = { start: 'bone_small', end: 'bone_large' }; // Mock
        LootSystem.pendingLoot.push({ item: 'bone_small', ownerId: killerId });
        Logger.sys(`[Loot] ${killerId} looted [Small Bone] from ${enemy.name}`);
    },

    distributeAll: (units) => {
        LootSystem.pendingLoot.forEach(l => {
            const u = units.find(x => x.id === l.ownerId);
            if (u) {
                if (!u.inventory) u.inventory = [];
                u.inventory.push(l.item);
            }
        });
        LootSystem.pendingLoot = [];
    }
};

// --- Trade System ---
const TradeSystem = {
    run: (players) => {
        Logger.sys("=== TRADE PHASE ===");
        // Simple Ring Trade
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                TradeSystem.negotiate(players[i], players[j]);
            }
        }
    },

    negotiate: (giver, receiver) => {
        // Logic: Does Receiver need it more than Giver? 
        // Persona Check
        if (typeof PersonaSystem === 'undefined') return;

        const pGiver = PersonaSystem.resolve(giver, State);

        if (giver.inventory && giver.inventory.length > 0) {
            // Check Selfishness
            if (pGiver.support > 1.5 || (pGiver.efficiency > 1.0 && receiver.role === 'Tanker')) {
                const item = giver.inventory.pop();
                if (!receiver.inventory) receiver.inventory = [];
                receiver.inventory.push(item);
                Logger.sys(`[Trade] ${giver.name} gave [${item}] to ${receiver.name} (Altruism)`);
            }
        }
    }
};

// --- Action System ---
const ActionSystem = {
    combustion: (unit, cardIndex) => {
        // Burn 1 Card -> Gain Dice
        if (!unit.hand || unit.hand.length <= cardIndex) return false;
        const card = unit.hand.splice(cardIndex, 1)[0];
        const val = card.burnVal || 1;

        // Rule: "Add White or Red". We'll add Red for aggression.
        if (!unit.dicePool) unit.dicePool = { white: 0, red: 0 };
        unit.dicePool.red += val;

        Logger.sys(`[Combustion] ${unit.name} burned [${card.name}] for +${val} Red Dice.`);
        return true;
    },

    condensation: (unit, diceType) => {
        // Spend 1 Die -> Search Card
        if (!unit.dicePool || unit.dicePool[diceType] <= 0) return false;
        unit.dicePool[diceType]--;

        // Logic: Search top card for now
        unit.hand.push({ name: 'Condensed Strike', power: 4, keywords: 'Pierce' });

        Logger.sys(`[Condensation] ${unit.name} condensed ${diceType} die into [Condensed Strike].`);
        return true;
    },

    meditation: (unit) => {
        // Spend ALL Dice -> Heal
        if (!unit.dicePool) return false;
        const total = unit.dicePool.white + unit.dicePool.red;
        if (total <= 0) return false;

        unit.dicePool.white = 0;
        unit.dicePool.red = 0;

        unit.hp = Math.min(unit.maxHp, unit.hp + total);
        Logger.sys(`[Meditation] ${unit.name} converted ${total} dice into ${total} HP.`);
        return true;
    }
};

// --- Concentration System ---
const ConcentrationSystem = {
    init: (unit) => {
        unit.concentration = 100;
        unit.maxConc = 100;
    },
    decay: (unit) => {
        let decay = 5;
        if (unit.hp < unit.maxHp) decay += 2;
        unit.concentration = Math.max(0, unit.concentration - decay);
        if (unit.concentration < 30) Logger.warn(`[Concentration] ${unit.name} is losing focus! (${unit.concentration}%)`);
    },
    getPenalty: (unit) => {
        if (unit.concentration >= 70) return { iterMod: 1.0, noise: 0.0, rangeMod: 0 };
        if (unit.concentration >= 30) return { iterMod: 0.7, noise: 2.0, rangeMod: 0 };
        return { iterMod: 0.4, noise: 5.0, rangeMod: -1 };
    }
};

// --- Breathe System (Campaign) ---
const BreatheSystem = {
    resolve: (unit, result) => {
        // Return string describing what happened
        Logger.sys(`[Breathe Phase] ${unit.name} (HP: ${unit.hp}/${unit.maxHp}) is deciding...`);

        if (typeof PersonaSystem === 'undefined') return "Skipped";

        const persona = PersonaSystem.resolve(unit, State);
        let choice = 'grow';

        // Logic: Recover if HP is critical
        // Safe Persona: < 70% HP -> Recover
        // Berserker Persona: Always Grow unless 1 HP
        // Efficient Persona: Calc survival probability (simplified to < 50% HP)

        const hpRatio = unit.hp / unit.maxHp;

        if (unit.hp <= 1) choice = 'recover'; // Forced by Rules
        else if (persona.safety > 1.5 && hpRatio < 0.7) choice = 'recover';
        else if (persona.efficiency > 1.5 && hpRatio < 0.5) choice = 'recover';
        else if (persona.gambit > 2.0 && unit.hp > 1) choice = 'grow';

        if (choice === 'recover') {
            unit.hp = unit.maxHp;
            return `Recovered to Full HP`;
        } else {
            // Growth: Choose Dice Color
            // Red (Breakthrough) vs White (Imprint)
            let diceType = 'white';
            if (persona.gambit > 1.5 || persona.aggro > 1.5) diceType = 'red';

            if (!unit.dicePool) unit.dicePool = { white: 2, red: 1 }; // Base
            unit.dicePool[diceType]++;

            return `Grew Power (+1 ${diceType.toUpperCase()} Dice)`;
        }
    }
};

const CampaignManager = {
    start: () => {
        State.campaign.active = true;
        State.campaign.questIndex = 1;
        Logger.sys("=== CAMPAIGN STARTED ===");
        // Note: Real implementation would load Quest 1 map here
    },

    endQuest: (victory) => {
        Logger.turn(`=== QUEST ENDED: ${victory ? "VICTORY" : "DEFEAT"} ===`);
        State.campaign.turnsTotal += State.turn;

        if (victory) {
            State.campaign.wins++;
            // Breathe Phase
            setTimeout(() => {
                // Reset for next (Demo Loop)
                // In real app, load next quest file
                Logger.sys("Simulation Resetting for next run...");
                // Location.reload() or internal reset
            }, 3000);
        }
    }
};
