// Vermilion_Simulator/js/state.js
// ==================================================================================
// [MODULE 1] STATE
// ==================================================================================
const State = {
    turn: 0, phase: 'SETUP', units: [], grid: {}, w: 0, h: 0,
    autoMode: false,
    history: [],
    sharedMind: { intents: {} }, // Key: unitId, Value: { type, target, val, score }
    campaign: {
        active: false,
        questIndex: 0,
        turnsTotal: 0,
        wins: 0,
        losses: 0,
        inventory: []
    }
};
