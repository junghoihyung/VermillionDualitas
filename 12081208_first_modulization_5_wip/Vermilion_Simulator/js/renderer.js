// Vermilion_Simulator/js/renderer.js
// ==================================================================================
// [MODULE 9] RENDERER
// ==================================================================================
const Renderer = {
    draw: () => {
        const l = document.getElementById('gridLayer');
        if (!l) return;
        l.innerHTML = '';
        if (!DB.map) return;

        l.style.gridTemplateColumns = `repeat(${State.w}, 64px)`;
        const checkbox = document.getElementById('chkHeat');
        const showHeat = checkbox ? checkbox.checked : false;

        for (let y = 0; y < State.h; y++) for (let x = 0; x < State.w; x++) {
            const t = DB.map.map[`${x},${y}`];
            const d = document.createElement('div');
            d.className = `tile ${t === 2 ? 'bone' : (t === 3 ? 'wall-s' : (t === 4 ? 'wall-b' : (t === 6 ? 'spike' : 'muscle')))}`;
            if (showHeat) {
                const enemies = State.units.filter(u => u.type === 'enemy' && !u.dead);
                for (let e of enemies) {
                    if (Math.abs(e.x - x) + Math.abs(e.y - y) <= 1) d.classList.add('heat-danger');
                }
            }
            l.appendChild(d);
        }

        State.units.forEach(u => {
            if (u.dead) return;
            const el = document.createElement('div');
            el.className = `unit ${u.type} ${State.activeUnit === u.id ? 'active' : ''}`;
            el.style.left = (u.x * 64 + 6) + 'px'; el.style.top = (u.y * 64 + 6) + 'px';

            let tokens = '';
            if (u.threat) tokens += `💀${u.threat}`;
            if (u.stunned) tokens += `⚡`;

            el.innerHTML = `
        ${tokens ? `<div class="token-badge">${tokens}</div>` : ''}
        <div>${u.name[0]}</div>
        <div class="hp-bar"><div class="hp-fill" style="width:${(u.hp / u.maxHp) * 100}%"></div></div>
    `;
            l.appendChild(el);
        });
    }
};
