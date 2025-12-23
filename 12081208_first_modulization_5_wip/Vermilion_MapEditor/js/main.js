// Vermilion_MapEditor/js/main.js
// === Core Functions ===
function init() {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Bind keys
    window.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        }
    });

    bindEvents(); // Bind first to ensure functionality
    createMap(true); // Initial creation with history push
    updateQuestUI();
    requestAnimationFrame(loop);
}

function resizeCanvas() {
    const cont = document.getElementById('canvasContainer');
    if (cont) {
        const cvs = document.getElementById('cvs');
        if (cvs) {
            cvs.width = cont.clientWidth;
            cvs.height = cont.clientHeight;
        }
    }
}

function createMap(recordHistory = false) {
    try {
        mapSize.w = parseInt(document.getElementById('mapW').value) || 10;
        mapSize.h = parseInt(document.getElementById('mapH').value) || 10;
        mapData = {};
        entities = {};
        for (let x = 0; x < mapSize.w; x++) {
            for (let y = 0; y < mapSize.h; y++) mapData[`${x},${y}`] = (x + y) % 2 === 0 ? 1 : 2;
        }

        const cvs = document.getElementById('cvs');
        if (cvs) {
            camera.x = cvs.width / 2 - (mapSize.w * TILE_SIZE) / 2;
            camera.y = cvs.height / 2 - (mapSize.h * TILE_SIZE) / 2;
        }
        updateCounts();

        if (recordHistory) {
            // Reset history
            historyStack = [];
            historyIndex = -1;
            pushHistory();
        }
    } catch (e) { console.error("Map creation failed", e); }
}

init();
