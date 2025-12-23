// Vermilion_EnemyCalc/js/state.js
const STATE = {
    hp: 10, def: 1,
    diceCount: 3, redCount: 1, whiteCount: 2,
    probMap: {}, maxSum: 12, maxProb: 0,
    cut1: 3, cut2: 6,
    yellows: [],
    isAddMode: false,
    zoneValues: { b: 0, g: 0, r: 0, p: 0, y: {} },
    calculatedETV: 0,
    useCustomPriority: false,
    priorityList: []
};

let currentEnemyList = [];

const FACES = { W: [1, 1, 1, 2, 2, 2], R: [0, 0, 1, 3, 3, 3] };
