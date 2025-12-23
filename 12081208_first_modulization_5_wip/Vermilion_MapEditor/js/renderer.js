// Vermilion_MapEditor/js/renderer.js
// === High Ground & Range Calc ===
function getTilesInRange(sx, sy, rng) {
    let tiles = [];
    for (let y = 0; y < mapSize.h; y++) {
        for (let x = 0; x < mapSize.w; x++) {
            let dist = Math.abs(sx - x) + Math.abs(sy - y);
            if (dist <= rng && dist > 0) tiles.push({ x, y });
        }
    }
    return tiles;
}

// === VISUAL RENDERING LOOP (Fix: Layer separation) ===
function loop() {
    const cvs = document.getElementById('cvs');
    // Ensure canvas exists
    if (!cvs) return requestAnimationFrame(loop);

    const ctx = cvs.getContext('2d');

    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // PASS 1: Floor (Backgrounds)
    for (let x = 0; x < mapSize.w; x++) {
        for (let y = 0; y < mapSize.h; y++) {
            const key = `${x},${y}`;
            const type = mapData[key];
            if (!type) { // Void
                ctx.fillStyle = '#111';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                continue;
            }
            // Draw Base Tile Background
            ctx.fillStyle = TILES[type] ? TILES[type].color : '#fff';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // PASS 2: Walls & Structures (Draws ON TOP of adjacent floors)
    for (let x = 0; x < mapSize.w; x++) {
        for (let y = 0; y < mapSize.h; y++) {
            const key = `${x},${y}`;
            const type = mapData[key];
            if (!type) continue;

            if (type === 3) { // Small Wall
                ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
                ctx.strokeRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                ctx.strokeRect(x * TILE_SIZE + 20, y * TILE_SIZE + 20, TILE_SIZE - 40, TILE_SIZE - 40);
            }
            else if (type === 4) { // Big Wall (Extended X Visual)
                ctx.strokeStyle = '#444'; ctx.lineWidth = 6;
                const cx = x * TILE_SIZE + TILE_SIZE / 2;
                const cy = y * TILE_SIZE + TILE_SIZE / 2;
                const offset = TILE_SIZE; // Reach center of neighbor

                // Draw X (Extending out)
                ctx.beginPath();
                ctx.moveTo(cx - offset, cy - offset);
                ctx.lineTo(cx + offset, cy + offset);
                ctx.moveTo(cx + offset, cy - offset);
                ctx.lineTo(cx - offset, cy + offset);
                ctx.stroke();

                // Center Box (Anchor)
                ctx.fillStyle = '#222';
                ctx.fillRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                ctx.strokeRect(x * TILE_SIZE + 10, y * TILE_SIZE + 10, TILE_SIZE - 20, TILE_SIZE - 20);
            }
            else if (type === 6) { // Spike
                ctx.fillStyle = '#9ca3af';
                ctx.beginPath();
                ctx.moveTo(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + 10);
                ctx.lineTo(x * TILE_SIZE + 10, y * TILE_SIZE + TILE_SIZE - 10);
                ctx.lineTo(x * TILE_SIZE + TILE_SIZE - 10, y * TILE_SIZE + TILE_SIZE - 10);
                ctx.fill();
            }
        }
    }

    // PASS 3: Overlays & Entities
    // High Ground Overlay
    if (hoveredCell.x >= 0) {
        const hx = hoveredCell.x, hy = hoveredCell.y;
        const hKey = `${hx},${hy}`;
        if (mapData[hKey] === 2) { // Is Bone Tile
            const baseRng = parseInt(document.getElementById('previewRange').value) || 3;

            // Draw Base Range (Blue)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            getTilesInRange(hx, hy, baseRng).forEach(t => {
                if (mapData[`${t.x},${t.y}`]) ctx.fillRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            });

            // Draw Bonus Range (Yellow)
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
            getTilesInRange(hx, hy, baseRng + 1).forEach(t => {
                let dist = Math.abs(hx - t.x) + Math.abs(hy - t.y);
                if (dist > baseRng && mapData[`${t.x},${t.y}`]) {
                    ctx.fillRect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.font = 'bold 10px Arial'; ctx.fillStyle = 'white'; ctx.textAlign = 'center';
                    ctx.fillText('+1', t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
                }
            });
        }
    }

    // Draw Entities
    if (entities) {
        for (let key in entities) {
            if (!mapData[key]) continue;
            const [x, y] = key.split(',').map(Number);
            const ent = entities[key];
            const cx = x * TILE_SIZE + TILE_SIZE / 2;
            const cy = y * TILE_SIZE + TILE_SIZE / 2;

            if (ent.type === 'enemy') {
                ctx.beginPath(); ctx.arc(cx, cy, TILE_SIZE * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444'; ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(ent.name[0], cx, cy);
                if (ent.scaling > 1) {
                    ctx.fillStyle = '#f59e0b'; ctx.font = '10px Arial'; ctx.fillText(`${ent.scaling}P+`, cx, cy + 15);
                }
            } else if (ent.type === 'marker') {
                ctx.fillStyle = '#3b82f6'; ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, 20, 20);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial';
                ctx.fillText(ent.val, x * TILE_SIZE + 15, y * TILE_SIZE + 18);
            } else if (ent.type === 'obj') {
                if (ent.val === 'carriage') {
                    ctx.fillStyle = '#8b5cf6'; // Violet
                    ctx.fillRect(cx - 15, cy - 12, 30, 24);
                    ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.fillText('🐴', cx, cy + 5);
                } else if (ent.val === 'target') {
                    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fillStyle = '#22d3ee'; ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                } else {
                    ctx.fillRect(cx - 10, cy - 10, 20, 20);
                    ctx.fillStyle = '#10b981'; ctx.font = '10px Arial'; ctx.fillText('GOAL', cx, cy - 15);
                }
            }
        }
    }

    // Hover Selection Box
    const hx = hoveredCell.x, hy = hoveredCell.y;
    if (hx >= 0 && hx < mapSize.w && hy >= 0 && hy < mapSize.h) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
        ctx.strokeRect(hx * TILE_SIZE, hy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    ctx.restore();
    requestAnimationFrame(loop);
}
