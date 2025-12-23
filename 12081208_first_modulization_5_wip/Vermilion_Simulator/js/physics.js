// Vermilion_Simulator/js/physics.js
// ==================================================================================
// [MODULE 3] PHYSICS & RULE ENGINE
// ==================================================================================
const Physics = {
    getTile: (x, y) => DB.map.map[`${x},${y}`] || 99,
    getDist: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
    getCost: (x, y, unit) => {
        if (x < 0 || x >= State.w || y < 0 || y >= State.h) return 999;
        const t = Physics.getTile(x, y);
        if (t >= 3 && t !== 6) return 999;
        const blocker = State.units.find(u => u.x === x && u.y === y && !u.dead && u.id !== unit.id);
        if (blocker) return 999;
        return t === 2 ? RULES.COST_BONE : RULES.COST_MUSCLE;
    },
    checkLoS: (a, b) => {
        let x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
        let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        let sx = (x1 < x2) ? 1 : -1, sy = (y1 < y2) ? 1 : -1;
        let err = dx - dy;
        const onBone = Physics.getTile(x1, y1) === 2;

        while (true) {
            if (x1 === x2 && y1 === y2) return true;
            if (x1 !== a.x || y1 !== a.y) {
                const t = Physics.getTile(x1, y1);
                if (t >= 3 && t !== 6 && t !== 99) return false; // 99=Out, 6=Spike(Transparent)
                if (!onBone) {
                    const u = State.units.find(u => u.x === x1 && u.y === y1 && !u.dead);
                    if (u) return false;
                }
            }
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x1 += sx; }
            if (e2 < dx) { err += dx; y1 += sy; }
        }
    },

    destroyWall: (x, y) => {
        const key = `${x},${y}`;
        if (DB.map.map[key] === 3 || DB.map.map[key] === 4) { // Wall-S or Wall-B
            DB.map.map[key] = 6; // To Spike
            Logger.warn(`[Physics] Wall at (${x},${y}) was DESTROYED! Now it's a Spike field.`);
            Renderer.draw();
            return true;
        }
        return false;
    },

    createWall: (x, y, type = 3) => {
        // 3: Wall-S, 4: Wall-B
        const key = `${x},${y}`;
        const current = DB.map.map[key];
        // Can only build on Empty (1: Muscle, 2: Bone, 6: Spike)
        if (!current || current >= 3 && current !== 6) return false;

        // Check for units
        if (State.units.find(u => u.x === x && u.y === y && !u.dead)) return false;

        DB.map.map[key] = type;
        Logger.sys(`[Physics] Wall constructed at (${x},${y}).`);
        Renderer.draw();
        return true;
    }
};

const TrapSystem = {
    check: (unit) => {
        if (!State.traps || State.traps.length === 0) return;
        const triggered = State.traps.filter(t => t.x === unit.x && t.y === unit.y);
        triggered.forEach(t => {
            if (t.type === 'mark') {
                unit.hp -= t.damage;
                Logger.warn(`[Trap] ${unit.name} triggered Latency Mark! (-${t.damage} HP)`);
                if (unit.hp <= 0) unit.dead = true;
            }
        });
        State.traps = State.traps.filter(t => t.x !== unit.x || t.y !== unit.y);
    }
};
