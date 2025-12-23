// Vermilion_Simulator/js/dice.js
// ==================================================================================
// [MODULE 2] DICE SYSTEM (REAL PHYSICS)
// ==================================================================================
const DiceSystem = {
    roll: (type) => {
        const faces = type === 'red' ? RULES.DICE_R : (type === 'black' ? RULES.DICE_B : RULES.DICE_W);
        return faces[Math.floor(Math.random() * faces.length)];
    },
    rollBatch: (nWhite, nRed) => {
        let results = [];
        for (let i = 0; i < nWhite; i++) results.push({ type: 'white', val: DiceSystem.roll('white') });
        for (let i = 0; i < nRed; i++) results.push({ type: 'red', val: DiceSystem.roll('red') });
        return results;
    },
    // For AI Simulation (Expected Values)
    getExpected: (nWhite, nRed) => {
        return (nWhite * 1.5) + (nRed * 1.67); // Based on BQM stats
    }
};
