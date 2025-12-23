// Vermilion_EquipmentCalc/js/lobby.js
// === Lobby & Mode Switching Logic ===

const Lobby = {
    init: () => {
        // Show Lobby, Hide Apps
        document.getElementById('lobby-screen').style.display = 'flex';
        document.getElementById('equipment-app').style.display = 'none';
        document.getElementById('trinket-app').style.display = 'none';
    },

    startEquipment: () => {
        document.getElementById('lobby-screen').style.display = 'none';
        document.getElementById('equipment-app').style.display = 'flex'; // Was 'block' but flex is better for layout from css
        document.getElementById('trinket-app').style.display = 'none';

        // Trigger original init if safe
        if (typeof init === 'function') {
            // Check if already initialized? 
            // Original init() in main.js calls 'updDice' etc.
            // Repetitive calls are likely fine.
            init();
        }
    },

    startTrinket: () => {
        document.getElementById('lobby-screen').style.display = 'none';
        document.getElementById('equipment-app').style.display = 'none';
        document.getElementById('trinket-app').style.display = 'flex';

        // Init Trinket
        if (typeof initTrinketUI === 'function') {
            initTrinketUI();
        }
    }
};

// Auto-run lobby init on load
window.onload = () => {
    Lobby.init();
};
