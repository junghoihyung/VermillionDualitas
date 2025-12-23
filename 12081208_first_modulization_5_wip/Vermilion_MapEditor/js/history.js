// Vermilion_MapEditor/js/history.js
// === History System ===
function pushHistory() {
    // If we are in the middle of the stack, cut off the future
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    // Clone state
    const state = {
        mapData: JSON.parse(JSON.stringify(mapData)),
        entities: JSON.parse(JSON.stringify(entities)),
        mapSize: { ...mapSize }
    };

    historyStack.push(state);
    if (historyStack.length > MAX_HISTORY) historyStack.shift();
    else historyIndex++;

    updateHistoryUI();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyStack[historyIndex]);
        updateHistoryUI();
    }
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreState(historyStack[historyIndex]);
        updateHistoryUI();
    }
}

function restoreState(state) {
    if (!state) return;
    mapData = JSON.parse(JSON.stringify(state.mapData));
    entities = JSON.parse(JSON.stringify(state.entities));
    mapSize = { ...state.mapSize };
    updateCounts();
}

function updateHistoryUI() {
    document.getElementById('btnUndo').disabled = (historyIndex <= 0);
    document.getElementById('btnRedo').disabled = (historyIndex >= historyStack.length - 1);
}
