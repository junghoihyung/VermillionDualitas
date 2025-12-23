// Vermilion_GameClient/js/dice_system.js
// ==================================================================================
// [MODULE 2] DICE SYSTEM
// ==================================================================================
const DiceSystem = {
    roll: (type) => {
        const faces = type === 'red' ? RULES.DICE_R : RULES.DICE_W;
        return faces[Math.floor(Math.random() * faces.length)];
    },
    rollBatch: (nWhite, nRed) => {
        let results = [];
        for (let i = 0; i < nWhite; i++) results.push({ type: 'white', val: DiceSystem.roll('white') });
        for (let i = 0; i < nRed; i++) results.push({ type: 'red', val: DiceSystem.roll('red') });
        return results;
    }
};
