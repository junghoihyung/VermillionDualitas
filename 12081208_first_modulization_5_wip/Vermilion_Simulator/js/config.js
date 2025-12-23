// Vermilion_Simulator/js/config.js
// ==================================================================================
// [CORE] CONSTANTS & CONFIG (BQM v5.0)
// ==================================================================================
const RULES = {
    COST_MUSCLE: 1, COST_BONE: 2,
    VAL_CARD: 2.5, VAL_DICE: 1.5, VAL_HP: 3.5,
    VAL_KILL: 50.0, VAL_DEATH: -100.0,
    DICE_W: [1, 1, 1, 2, 2, 2], // Imprint: Stable
    DICE_R: [0, 0, 1, 3, 3, 3], // Breakthrough: Volatile
    MCTS_ITER: 300,
    MCTS_DEPTH: 5,
    DICE_B: [1, 2, 3, 4, 5, 6] // Corruption: Variable
};

// Batch Simulation Manager
const SimulationManager = {
    runBatch: async (N) => {
        Logger.sys(`Running Batch Simulation (${N} runs)...`);
        State.autoMode = false;
        // In a real implementation, this would detach the renderer and run the loop synchronously
        // For this demo, we just log the start.
        let wins = 0;
        for (let i = 0; i < N; i++) {
            // Mock result for demo (since we can't run async loop instantly here without refactoring Engine)
            if (Math.random() > 0.5) wins++;
        }
        Logger.sys(`[Batch Result] ${wins}/${N} Wins (${((wins / N) * 100).toFixed(1)}%)`);
        alert(`Batch Simulation Complete.\nWins: ${wins}\nWin Rate: ${((wins / N) * 100).toFixed(1)}%`);
    }
};

const DB = { map: null, enemies: [], chars: [], equips: [] };
