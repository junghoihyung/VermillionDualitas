// Vermilion_GameClient/js/renderer.js
const Renderer = {
    // Draw Map & Units
    draw: () => {
        const l = document.getElementById('gridLayer');
        if (!l || !DB.map) return;

        l.innerHTML = '';
        l.style.gridTemplateColumns = `repeat(${State.w}, 64px)`;

        let moveTiles = [], attackTiles = [];
        const p = State.units.find(u => u.id === State.player.id);

        if (p && !p.dead && State.interaction.mode === 'TARGET_SELECT') {
            const card = State.player.hand[State.interaction.selectedCardIdx];
            const range = (card && card.range) || 1;
            for (let dy = -range; dy <= range; dy++) {
                for (let dx = -range; dx <= range; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) <= range) attackTiles.push({ x: p.x + dx, y: p.y + dy });
                }
            }
        }

        for (let y = 0; y < State.h; y++) for (let x = 0; x < State.w; x++) {
            // Force Checkerboard (Visual Only)
            const isMuscle = (x + y) % 2 === 0;
            const bgClass = isMuscle ? 'muscle' : 'bone';

            const t = State.map[`${x},${y}`];
            let finalClass = bgClass;
            if (t === 3) finalClass = 'wall-s';
            if (t === 4) finalClass = 'wall-b';
            if (t === 6) finalClass = 'spike';

            const d = document.createElement('div');
            d.className = `tile ${finalClass}`;
            if (attackTiles.some(pos => pos.x === x && pos.y === y)) d.classList.add('range-attack');
            d.onclick = () => PlayerInput.handleGridClick(x, y);
            l.appendChild(d);
        }

        // Units
        State.units.forEach(u => {
            if (u.dead) return;
            const el = document.createElement('div');
            el.className = `unit ${u.type}`;
            el.innerText = u.type === 'player' ? '🧙' : '🧟‍♂️';
            el.style.left = (u.x * 64 + 6) + 'px'; el.style.top = (u.y * 64 + 6) + 'px';

            const label = document.createElement('div');
            label.style.cssText = "position:absolute; top:-20px; left:50%; transform:translateX(-50%); white-space:nowrap; font-size:0.7em; color:white; text-shadow:1px 1px 2px black;";
            label.innerText = `${u.name} (${u.hp})`;
            el.appendChild(label);

            l.appendChild(el);
        });

        Renderer.renderDiceUI();
    },

    renderHand: () => {
        const c = document.getElementById('handContainer');
        if (!c) return;
        c.innerHTML = '';

        State.player.hand.forEach((card, idx) => {
            const d = document.createElement('div');
            const isActive = State.interaction.selectedCardIdx === idx;

            let classes = `card ${isActive ? 'active' : ''}`;
            if (card.isNew) {
                classes += ' drawing';
                card.isNew = false;
            }

            d.className = classes;
            d.onclick = () => PlayerInput.selectCard(idx);

            d.innerHTML = `
                <div class="card-cost">?</div>
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
                <div class="card-desc">${card.desc || ''}</div>
                <div class="fire-btn" onclick="event.stopPropagation(); SpecialActions.executeCombustion(${idx})">🔥</div>
            `;
            c.appendChild(d);
        });

        document.getElementById('deckCount').innerText = State.player.deck.length;
        document.getElementById('discardCount').innerText = State.player.discard.length;

        const discTop = document.getElementById('topDiscard');
        if (discTop) {
            if (State.player.discard.length > 0) {
                const top = State.player.discard[State.player.discard.length - 1];
                discTop.innerText = top.name;
                discTop.style.background = '#444';
            } else {
                discTop.innerText = '';
                discTop.style.background = 'transparent';
            }
        }
    },

    renderPlayerInfo: () => {
        const list = document.getElementById('playerEquips');
        if (!list) return;
        list.innerHTML = '';

        const p = State.units.find(u => u.id === State.player.id);
        if (!p) return;

        document.getElementById('pName').innerText = p.name;
        document.getElementById('pDesc').innerText = p.role || "Adventurer";

        const slots = ['head', 'torso', 'arm', 'legs', 'acc'];
        slots.forEach(s => {
            const eq = p.equips[s];
            const div = document.createElement('div');
            div.className = `equip-card ${State.interaction.selectedEquipSlot === s ? 'active' : ''}`;
            div.onclick = () => PlayerInput.selectEquipment(s);
            div.innerHTML = `
                <div style="font-size:0.6rem; color:#888; text-transform:uppercase;">${s}</div>
                <div style="font-weight:bold; color:gold;">${eq ? eq.name : 'Empty'}</div>
                <div style="font-size:0.7rem;">Cap: ${eq ? eq.cap : 0}</div>
            `;
            list.appendChild(div);
        });
    },

    renderEnemyInfo: () => {
        const list = document.getElementById('enemyList');
        if (!list) return;
        list.innerHTML = '';

        const enemies = State.units.filter(u => u.type === 'enemy' && !u.dead);
        enemies.forEach(e => {
            const div = document.createElement('div');
            div.className = 'enemy-card';

            const sum = State.enemyDiceSum || 0;
            const max = 20;
            const pct = Math.min((sum / max) * 100, 100);

            let activeIcon = 0;
            if (sum > 6) activeIcon = 1;
            if (sum > 12) activeIcon = 2;

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <b style="color:#f55;">${e.name}</b>
                    <small>HP ${e.hp} | DEF ${e.def || 0}</small>
                </div>
                <div style="font-size:0.7rem; color:#ccc;">Dice: 2d6 (Rolling...)</div>
                
                <div class="action-bar-container">
                    <div class="bar-indicator" style="left:${pct}%"></div>
                    <div class="action-bar">
                        <div class="bar-seg blue" style="width:30%"></div>
                        <div class="bar-seg green" style="width:30%"></div>
                        <div class="bar-seg red" style="width:40%"></div>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; font-size:1.5rem; margin-top:5px; padding:0 10px;">
                    <span class="action-icon ${activeIcon === 0 ? 'active' : ''}">🛡️</span>
                    <span class="action-icon ${activeIcon === 1 ? 'active' : ''}">⚔️</span>
                    <span class="action-icon ${activeIcon === 2 ? 'active' : ''}">💥</span>
                </div>
            `;
            list.appendChild(div);
        });
    },

    renderDiceUI: () => {
        const ui = document.getElementById('diceUI');
        if (!ui) return;
        ui.innerHTML = '';

        const supply = State.player.diceSupply || { white: 0, red: 0 };

        for (let i = 0; i < supply.white; i++) {
            const b = document.createElement('div');
            b.className = 'dice-box white';
            b.innerHTML = `<div class="water-btn" onclick="SpecialActions.executeCondensation('white', ${i})">💧</div>`;
            ui.appendChild(b);
        }
        for (let i = 0; i < supply.red; i++) {
            const b = document.createElement('div');
            b.className = 'dice-box red';
            b.innerHTML = `<div class="water-btn" onclick="SpecialActions.executeCondensation('red', ${i})">💧</div>`;
            ui.appendChild(b);
        }
    },

    renderSidePanel: () => {
        Renderer.renderPlayerInfo();
        Renderer.renderEnemyInfo();
    }
};
