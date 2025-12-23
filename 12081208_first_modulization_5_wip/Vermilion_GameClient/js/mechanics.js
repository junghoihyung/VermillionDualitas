// mechanics.js
window.GAME_MECHANICS = {};

// BFS
const ADJ = {
    0: [1, 3], 1: [0, 2, 4], 2: [1, 5],
    3: [0, 4, 6], 4: [1, 3, 5, 7], 5: [2, 4, 8],
    6: [3, 7], 7: [4, 6, 8], 8: [5, 7]
};

window.GAME_MECHANICS.getMoveableTiles = function (startPos, movePoints) {
    let validals = new Set();
    let queue = [{ pos: startPos, cost: 0 }];
    let visited = new Set();

    while (queue.length > 0) {
        let curr = queue.shift();

        if (curr.cost <= movePoints) {
            validals.add(curr.pos);
        }

        if (curr.cost >= movePoints) continue;

        const neighbors = ADJ[curr.pos];
        if (!neighbors) continue;

        neighbors.forEach(n => {
            const isBone = (n === 4); // Center is Bone
            const moveCost = isBone ? 2 : 1;
            const newCost = curr.cost + moveCost;

            if (!visited.has(n) && newCost <= movePoints) {
                visited.add(n);
                queue.push({ pos: n, cost: newCost });
            }
        });
    }
    return Array.from(validals).filter(p => p !== startPos);
}

window.GAME_MECHANICS.rollDice = function (count = 1) {
    let result = 0;
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 6);
        const val = [0, 0, 1, 1, 2, 3][roll]; // SMD
        result += val;
    }
    return result;
}

window.GAME_MECHANICS.getAttackableTiles = function (startPos, range) {
    const targetSet = new Set();
    const getXY = (i) => ({ x: i % 3, y: Math.floor(i / 3) });
    const p1 = getXY(startPos);

    for (let i = 0; i < 9; i++) {
        if (i === startPos) continue;
        const p2 = getXY(i);
        const dist = Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
        if (dist <= range) {
            targetSet.add(i);
        }
    }
    return Array.from(targetSet);
}
