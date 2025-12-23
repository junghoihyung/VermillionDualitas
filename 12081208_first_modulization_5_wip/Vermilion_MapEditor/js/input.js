// Vermilion_MapEditor/js/input.js
// === Map Interaction ===
function bindEvents() {
    const container = document.getElementById('canvasContainer');
    const cvs = document.getElementById('cvs');

    container.addEventListener('wheel', e => {
        e.preventDefault();
        const zoomIntensity = 0.001;
        camera.zoom += e.deltaY * -zoomIntensity;
        camera.zoom = Math.min(Math.max(0.5, camera.zoom), 4);
    }, { passive: false });

    let isDown = false;
    let isPanning = false;
    let startPan = { x: 0, y: 0 };
    let isDrawing = false;

    // Prevent context menu on right click
    cvs.addEventListener('contextmenu', e => e.preventDefault());

    cvs.addEventListener('mousedown', e => {
        hideContextMenu();

        // Right Click
        if (e.button === 2) {
            openContextMenu(e);
            return;
        }

        // Calculate clicked cell
        const rect = cvs.getBoundingClientRect();
        const mx = (e.clientX - rect.left - camera.x) / camera.zoom;
        const my = (e.clientY - rect.top - camera.y) / camera.zoom;
        const hx = Math.floor(mx / TILE_SIZE);
        const hy = Math.floor(my / TILE_SIZE);
        const key = `${hx},${hy}`;

        const isVoid = !mapData[key];
        const isEmptyMap = Object.keys(mapData).length === 0;

        // Determine Action: Pan vs Draw
        let shouldPan = false;

        // Middle Mouse always Pans
        if (e.button === 1) {
            shouldPan = true;
        }
        // Logic: Empty map always draws. Otherwise, Void=Pan, Tile=Draw. Shift inverts.
        else if (!isEmptyMap) {
            if (e.shiftKey) {
                // Shift: Void=Draw, Tile=Pan
                shouldPan = !isVoid;
            } else {
                // Default: Void=Pan, Tile=Draw
                shouldPan = isVoid;
            }
        }

        if (shouldPan) {
            e.preventDefault();
            isPanning = true;
            startPan = { x: e.clientX, y: e.clientY };
            cvs.style.cursor = 'grabbing';
            return;
        }

        // Left Click for Drawing (Default if not panning)
        if (e.button === 0) {
            isDown = true;
            isDrawing = true;
            applyTool();
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDrawing) {
            pushHistory(); // Commit history
        }
        isDown = false;
        isDrawing = false;
        isPanning = false;
        cvs.style.cursor = 'default';
    });

    window.addEventListener('mousemove', e => {
        const rect = cvs.getBoundingClientRect();

        // Update Hover Coords
        const mx = (e.clientX - rect.left - camera.x) / camera.zoom;
        const my = (e.clientY - rect.top - camera.y) / camera.zoom;
        hoveredCell.x = Math.floor(mx / TILE_SIZE);
        hoveredCell.y = Math.floor(my / TILE_SIZE);

        const coordEl = document.getElementById('coords');
        if (coordEl) coordEl.innerText = `${hoveredCell.x}, ${hoveredCell.y}`;

        // Pan Logic
        if (isPanning) {
            camera.x += e.clientX - startPan.x;
            camera.y += e.clientY - startPan.y;
            startPan = { x: e.clientX, y: e.clientY };
            return;
        }

        // Draw Logic
        if (isDrawing) {
            applyTool();
        }
    });
}
