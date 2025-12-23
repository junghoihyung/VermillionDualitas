// render.js
window.GAME_RENDER = {};

window.GAME_RENDER.ELEMENTS = {
    // We'll populate this on init because sometimes DOM isnt ready if script runs too early
};

function getEl() {
    return {
        app: document.getElementById('app-container'),
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        charList: document.getElementById('char-list'),
        equipList: document.getElementById('equip-list'),
        map: document.getElementById('grid-map'),
        playerHand: document.getElementById('player-hand'),
        enemyList: document.getElementById('enemy-list'),
        pName: document.getElementById('p-name'),
        pClass: document.getElementById('p-class'),
        pHpBar: document.getElementById('p-hp-bar'),
        pHpText: document.getElementById('p-hp-text'),
        pThreat: document.getElementById('p-threat'),
        pSuppress: document.getElementById('p-suppress'),
        slots: {
            head: document.getElementById('slot-head'),
            arm: document.getElementById('slot-arm'),
            torso: document.getElementById('slot-torso'),
            legs: document.getElementById('slot-legs')
        }
    };
}

window.GAME_RENDER.renderLobby = function (onStart) {
    const els = getEl();
    const chars = window.GAME_DATA.CHARACTERS;
    const equips = window.GAME_DATA.EQUIPMENT_LOADOUTS;

    // Render Characters
    els.charList.innerHTML = '';
    chars.forEach((char, index) => {
        const el = document.createElement('div');
        el.className = 'char-item';
        el.innerHTML = `<strong>${char.name}</strong><br><small>${char.class}</small>`;
        el.style.padding = '10px';
        el.style.borderBottom = '1px solid #333';
        el.style.cursor = 'pointer';

        el.onclick = () => {
            document.querySelectorAll('.char-item').forEach(e => {
                e.style.background = 'transparent';
                e.classList.remove('selected');
            });
            el.style.background = 'rgba(255, 77, 77, 0.2)';
            el.classList.add('selected');
            window.selectedChar = char;
        };
        // Auto-select first
        if (index === 0) el.click();
        els.charList.appendChild(el);
    });

    // Render Equipment
    els.equipList.innerHTML = '';
    equips.forEach((loadout, index) => {
        const el = document.createElement('div');
        el.className = 'equip-item';
        el.innerText = loadout.name;
        el.style.padding = '10px';
        el.style.cursor = 'pointer';

        el.onclick = () => {
            document.querySelectorAll('.equip-item').forEach(e => {
                e.style.background = 'transparent';
                e.classList.remove('selected');
            });
            el.style.background = 'rgba(77, 166, 255, 0.2)';
            el.classList.add('selected');
            window.selectedLoadout = loadout;
        };
        if (index === 0) el.click();
        els.equipList.appendChild(el);
    });

    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.onclick = onStart;
}

window.GAME_RENDER.renderGame = function (state) {
    const els = getEl();
    renderPlayerPanel(state.player, els);
    renderMap(state.map, state.units, els);
    renderHand(state.hand, els);
    renderEnemies(state.enemies, els);
}

function renderPlayerPanel(player, els) {
    if (!player) return;
    els.pName.innerText = player.name;
    els.pClass.innerText = player.class;

    // HP Bar
    const hpPercent = (player.hp / player.maxHp) * 100;
    els.pHpBar.style.width = `${hpPercent}%`;
    els.pHpText.innerText = `${player.hp}/${player.maxHp}`;

    // Slots
    if (window.selectedLoadout) {
        els.slots.head.innerText = window.selectedLoadout.slots.head;
        els.slots.arm.innerText = window.selectedLoadout.slots.arm;
        els.slots.torso.innerText = window.selectedLoadout.slots.torso;
        els.slots.legs.innerText = window.selectedLoadout.slots.legs;
    }
}

function renderMap(grid, units, els) {
    els.map.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const tile = document.createElement('div');
        const isBone = (i === 4);
        tile.className = `map-tile ${isBone ? 'tile-bone' : 'tile-muscle'}`;
        tile.dataset.index = i;
        tile.innerText = isBone ? "🦴" : "";

        // Check for units
        const unit = units.find(u => u.pos === i);
        if (unit) {
            const unitEl = document.createElement('div');
            unitEl.className = 'unit';
            unitEl.innerText = unit.type === 'player' ? '🧙‍♂️' : '🧟';
            if (unit.isShaking) unitEl.classList.add('shake');
            tile.appendChild(unitEl);
        }

        tile.onclick = () => window.handleTileClick(i);
        els.map.appendChild(tile);
    }
}

function renderHand(hand, els) {
    els.playerHand.innerHTML = '';
    hand.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.innerHTML = `
            <div class="card-type">${card.type}</div>
            <div class="card-name">${card.name}</div>
        `;
        cardEl.onclick = () => window.playCard(card);
        els.playerHand.appendChild(cardEl);
    });
}

function renderEnemies(enemies, els) {
    els.enemyList.innerHTML = '';
    enemies.forEach(e => {
        const el = document.createElement('div');
        el.className = 'enemy-item';
        el.innerHTML = `<b>${e.name}</b> (HP: ${e.hp})`;
        el.style.padding = '5px 0';
        els.enemyList.appendChild(el);
    });
}

window.GAME_RENDER.showNotification = function (msg) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '20%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = '#fff';
    div.style.padding = '1rem 2rem';
    div.style.borderRadius = '8px';
    div.style.zIndex = '999';
    div.style.pointerEvents = 'none';
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}
