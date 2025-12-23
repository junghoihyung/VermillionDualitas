// Vermilion_EquipmentCalc/js/trinket_state.js
// === Trinket Calculator State ===

const TrinketState = {
    capacity: 1, // 1 ~ 4
    effects: [], // Array of objects: { idx: 0, val: 1 } (index in TRINKET_EFFECTS)
    recharge: 0, // Index in RECHARGE_CONDITIONS

    // Calculated Values
    score: 0.0
};
