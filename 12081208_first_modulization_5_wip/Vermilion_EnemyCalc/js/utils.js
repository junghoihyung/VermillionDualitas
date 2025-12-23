// Vermilion_EnemyCalc/js/utils.js
function convolve(dist, face) {
    let next = {};
    for (let s in dist) {
        let p = dist[s];
        for (let f of face) { let ns = parseInt(s) + f; next[ns] = (next[ns] || 0) + (p / 6.0); }
    }
    return next;
}

function getTier(v) {
    if (v < 3.0) return ["T6 - 잡몹", 0];
    if (v < 4.5) return ["T5 - 정예", (v - 3.0) / 1.5 * 16.6 + 16.6];
    if (v < 6.0) return ["T4 - 중보", (v - 4.5) / 1.5 * 16.6 + 33.2];
    if (v < 8.0) return ["T3 - 위협", (v - 6.0) / 2.0 * 16.6 + 49.8];
    if (v < 10.0) return ["T2 - 재앙", (v - 8.0) / 2.0 * 16.6 + 66.4];
    return ["T1 - 보스", Math.min(100, (v - 10.0) / 2.0 * 16.6 + 83.0)];
}
