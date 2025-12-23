// Vermilion_MapEditor/js/tools.js
function applyTool() {
    const { x, y } = hoveredCell;
    if (x < 0 || x >= mapSize.w || y < 0 || y >= mapSize.h) return;
    const key = `${x},${y}`;

    let changed = false;

    if (currentTool.mode === 'erase') {
        if (entities[key]) { delete entities[key]; changed = true; }
        else if (mapData[key]) { delete mapData[key]; changed = true; }
    } else if (currentTool.mode === 'tile') {
        if (currentTool.val === 5) { // Dead Tree unique check
            for (let k in mapData) if (mapData[k] === 5) mapData[k] = 1;
        }
        if (mapData[key] !== currentTool.val) {
            mapData[key] = currentTool.val;
            changed = true;
        }
    } else {
        if (!mapData[key]) mapData[key] = 1;
        if (currentTool.mode === 'obj' && currentTool.val === 'carriage') {
            for (let k in entities) if (entities[k].val === 'carriage') delete entities[k];
        }

        // Entity equality check is harder, just apply
        let ent = { type: currentTool.mode, scaling: 1 };
        if (currentTool.mode === 'enemy') {
            ent.name = currentTool.val.name;
            ent.displayETV = currentTool.val.etv;
        } else {
            ent.val = currentTool.val;
        }

        // Simple check to avoid spamming history on same tile drag
        if (JSON.stringify(entities[key]) !== JSON.stringify(ent)) {
            entities[key] = ent;
            changed = true;
        }
    }

    if (changed) updateCounts();
    // History is pushed on mouseup, not every frame
}
