// Vermilion_MapEditor/js/state.js
// === State ===
const TILE_SIZE = 60;
let mapSize = { w: 10, h: 10 };
let mapData = {}; // x,y -> tileType (undefined = void)
let entities = {};
let camera = { x: 50, y: 50, zoom: 1 };

// History State
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

let loadedEnemies = [];
let currentTool = { mode: 'tile', val: 1 };
let hoveredCell = { x: -1, y: -1 };
let selectedEntityPos = null;

// Tile Definitions
const TILES = {
    1: { color: '#8b1c1c', name: 'Muscle' },
    2: { color: '#e5e5e5', name: 'Bone' },
    3: { color: '#e5e5e5', name: 'Small Wall' }, // Base color is bone
    4: { color: '#e5e5e5', name: 'Big Wall' },   // Base color is bone
    5: { color: '#22c55e', name: 'Dead Tree' },
    6: { color: '#e5e5e5', name: 'Bone Spike' }  // Base color is bone
};
