// Vermilion_EquipmentCalc/js/utils.js
// Checks
function hasNKind(arr, n) { let c = {}; for (let x of arr) c[x] = (c[x] || 0) + 1; return Object.values(c).some(v => v >= n); }
function isStraight(arr) { let u = [...new Set(arr)].sort((a, b) => a - b); if (u.length < 3) return false; for (let i = 0; i <= u.length - 3; i++)if (u[i + 1] == u[i] + 1 && u[i + 2] == u[i] + 2) return true; return false; }
function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function countPairs(arr) { let c = {}; for (let x of arr) c[x] = (c[x] || 0) + 1; return Object.values(c).filter(v => v >= 2).length; }
function isSymmetric(arr) { if (arr.length < 2) return true; for (let i = 0; i < Math.floor(arr.length / 2); i++) if (arr[i] !== arr[arr.length - 1 - i]) return false; return true; }

// Helper to extract base stat value
function getBaseStatValue(cont) {
    let val = 0;
    for (let c of cont.children) {
        if (c.dataset.name === "수치 +X") {
            let inp = c.querySelector('input');
            val += inp ? parseFloat(inp.value) || 1 : 1;
        }
    }
    return val;
}

function sumEffects(cont, baseStats, charCtx) {
    if (!cont) return 0;
    let s = 0;
    for (let c of cont.children) {
        let idx = c.dataset.idx; let db = c.dataset.db;
        let data = (db === 'spec' ? SPECIAL_EFFECTS : EFFECTS)[idx];
        let inp = c.querySelector('input');
        let x = inp ? parseFloat(inp.value) || 1 : 1;
        s += data.calc(x, baseStats || { atk: 0, def: 0, move: 0 }, charCtx);
    }
    return s;
}

function getGradeText(v) {
    if (v >= 12) return "T1 신화"; if (v >= 10) return "T2 전설"; if (v >= 8) return "T3 희귀";
    if (v >= 6) return "T4 고급"; if (v >= 4) return "T5 일반"; return "T6 폐급";
}

function getGradeClass(v) {
    if (v >= 10) return "S"; if (v >= 8) return "A"; if (v >= 6) return "B";
    if (v >= 4) return "C";
    if (v >= 2) return "D"; return "F";
}
