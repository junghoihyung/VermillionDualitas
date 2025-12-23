// Vermilion_EquipmentCalc/js/state.js
// === State & Engine ===
const STATE = {
    diceCount: 3, redCount: 1, whiteCount: 2,
    capacity: 3, currentSlot: 'WEP',
    simResults: [],
    improvisation: false,
    charId: 'GENERIC'
};

const FACE_W = [1, 1, 1, 2, 2, 2]; const FACE_R = [0, 0, 1, 3, 3, 3];
