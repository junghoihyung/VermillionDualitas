// Vermilion_Simulator/js/utils.js
// ==================================================================================
// [MODULE 1] DATA LOADER & UTILS
// ==================================================================================
const Logger = {
    log: (m) => Logger.add(m),
    sys: (m) => Logger.add(m, 'log-sys'),
    turn: (m) => Logger.add(m, 'log-turn'),
    ai: (m) => Logger.add(m, 'log-ai'),
    warn: (m) => Logger.add(m, 'log-warn'),
    combat: (m) => Logger.add(m, 'log-combat'),
    add: (msg, cls = '') => {
        const d = document.createElement('div');
        d.className = `log-row ${cls}`;
        const t = new Date().toLocaleTimeString().split(' ')[0];
        d.innerHTML = `<span class="log-time">[${t}]</span><span>${msg}</span>`;
        const b = document.getElementById('gameLog');
        if (b) {
            b.appendChild(d); b.scrollTop = b.scrollHeight;
        }
    }
};

const Loader = {
    handleFiles: (input) => {
        Array.from(input.files).forEach(f => {
            const r = new FileReader();
            r.onload = e => Loader.parse(f.name, JSON.parse(e.target.result));
            r.readAsText(f);
        });
    },
    parse: (fname, data) => {
        if (fname.endsWith('.vmp') || data.map) { DB.map = data; Logger.sys(`Map Loaded: ${fname}`); }
        else if (fname.endsWith('.ven') || (Array.isArray(data) && data[0].etv)) { DB.enemies = data; Logger.sys(`Enemies Loaded: ${data.length} types`); }
        else if (fname.endsWith('.vchar') || (Array.isArray(data) && data[0].growth)) { DB.chars = data; Logger.sys(`Chars Loaded: ${data.length} personas`); }
        else if (fname.endsWith('.veq') || (Array.isArray(data) && data[0].logicRows)) { DB.equips = data; Logger.sys(`Equips Loaded: ${data.length} items`); }

        if (DB.map && DB.enemies.length && DB.chars.length) Engine.init();
    }
};

const VirtualWorld = {
    clone: (s) => JSON.parse(JSON.stringify(s)),
    apply: (s, act) => {
        const u = s.units.find(x => x.id === (act.uid || s.activeUnit));
        if (!u) return s;

        if (act.move) { u.x = act.move.x; u.y = act.move.y; }

        if (act.type === 'attack') {
            const t = s.units.find(x => x.id === act.target);
            if (t) {
                const expectedDice = DiceSystem.getExpected(2, 1);
                const atk = (act.card ? act.card.power : 2) + expectedDice;
                const def = t.def || 0;
                const dmg = Math.max(0, atk - def);
                t.hp -= dmg;
                if (t.hp <= 0) t.dead = true;
            }
        }
        return s;
    }
};
