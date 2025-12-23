// Vermilion_GameClient/js/physics.js
// ==================================================================================
// [MODULE 3] PHYSICS
// ==================================================================================
const Physics = {
    getTile: (x, y) => (State.map ? State.map[`${x},${y}`] : 99), // Read from Mutable State
    getCost: (x, y, u) => {
        if (x < 0 || x >= State.w || y < 0 || y >= State.h) return 999;
        const t = Physics.getTile(x, y);
        if (t === 3 || t === 4) return 999; // Walls
        const blocker = State.units.find(u => u.x === x && u.y === y && !u.dead);
        if (blocker) return 999; // Any unit blocks
        return (t === 2 || t === 6) ? 2 : 1; // Bone(2)/Spike(6)=2, Muscle(1)=1
    },
    getDist: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),

    // Check Line of Sight
    hasLOS: (a, b) => {
        const path = Physics.getLine(a.x, a.y, b.x, b.y);
        const startTile = Physics.getTile(a.x, a.y);
        const isVantage = (startTile === 2); // Bone Tile grants Vantage

        // Check path (exclude start and end for blocking usually, but BQM might be strict?
        // Usually unit at 'a' shoots unit at 'b'. 'a' and 'b' are occupied so they don't block themselves.)
        // We iterate from 1 to length-2.
        for (let i = 1; i < path.length - 1; i++) {
            const p = path[i];
            const t = Physics.getTile(p.x, p.y);

            // Wall Checks
            if (t === 3 || t === 4) return false; // Walls always block shots through them

            // Unit Checks
            if (!isVantage) {
                const blocker = State.units.find(u => u.x === p.x && u.y === p.y && !u.dead);
                if (blocker) return false;
            }
        }
        return true;
    },

    // Bresenham's Algorithm for Line Tracing
    getLine: (x0, y0, x1, y1) => {
        const points = [];
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
            points.push({ x: x0, y: y0 });
            if ((x0 === x1) && (y0 === y1)) break;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
        return points;
    }
};

