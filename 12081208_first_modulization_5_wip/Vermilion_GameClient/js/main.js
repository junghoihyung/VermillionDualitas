// main.js
window.GAME_MAIN = {};

let STATE = {
    turn: 1,
    phase: 'player',
    player: null,
    hand: [],
    deck: [],
    discard: [],
    enemies: [],
    map: [],
    units: [],
    selectedCard: null,
    validTiles: []
};

// Initialize on Load (called by script tag order or event)
window.onload = function () {
    window.GAME_LOBBY.initLobby();
};

window.GAME_MAIN.initGame = function (charData, loadoutData) {
    STATE.player = { ...charData, maxHp: charData.hp };
    STATE.hand = charData.cards.slice(0, 5);
    STATE.deck = charData.cards.slice(5);

    STATE.enemies = JSON.parse(JSON.stringify(window.GAME_DATA.ENEMIES));
    STATE.enemies[0].pos = 2;
    STATE.enemies[1].pos = 8;

    STATE.units = [
        { id: 'player', type: 'player', pos: 6 },
        { id: 'e1', type: 'enemy', pos: 2 },
        { id: 'e2', type: 'enemy', pos: 8 }
    ];

    window.GAME_RENDER.renderGame(STATE);
    window.GAME_RENDER.showNotification("QUEST START: Rounds 1/10");

    // Hook globals
    window.playCard = fit_playCard;
    window.handleTileClick = fit_handleTileClick;
}

function fit_playCard(card) {
    if (STATE.phase !== 'player') {
        window.GAME_RENDER.showNotification("Not your turn!");
        return;
    }

    STATE.selectedCard = card;

    if (card.type === 'Move') {
        const roll = card.move || window.GAME_MECHANICS.rollDice(1);
        window.GAME_RENDER.showNotification(`Rolled: ${roll} Movement Points`);

        const currentPos = STATE.units.find(u => u.type === 'player').pos;
        STATE.validTiles = window.GAME_MECHANICS.getMoveableTiles(currentPos, roll);

        document.querySelectorAll('.map-tile').forEach(el => {
            el.classList.remove('highlight-move', 'highlight-attack');
            if (STATE.validTiles.includes(parseInt(el.dataset.index))) {
                el.classList.add('highlight-move');
            }
        });

    } else if (card.type === 'Attack') {
        const rng = card.range || 1;
        const currentPos = STATE.units.find(u => u.type === 'player').pos;
        STATE.validTiles = window.GAME_MECHANICS.getAttackableTiles(currentPos, rng);

        document.querySelectorAll('.map-tile').forEach(el => {
            el.classList.remove('highlight-move', 'highlight-attack');
            if (STATE.validTiles.includes(parseInt(el.dataset.index))) {
                el.classList.add('highlight-attack');
            }
        });
    }
}

function fit_handleTileClick(index) {
    if (!STATE.selectedCard) return;

    if (!STATE.validTiles.includes(index)) {
        window.GAME_RENDER.showNotification("Invalid Target!");
        return;
    }

    const card = STATE.selectedCard;
    const playerUnit = STATE.units.find(u => u.type === 'player');

    if (card.type === 'Move') {
        playerUnit.pos = index;
        window.GAME_RENDER.showNotification("Moved!");
    } else if (card.type === 'Attack') {
        const targets = STATE.units.filter(u => u.type === 'enemy' && u.pos === index);
        if (targets.length > 0) {
            targets.forEach(t => {
                t.isShaking = true;
                setTimeout(() => { t.isShaking = false; window.GAME_RENDER.renderGame(STATE); }, 500);
            });
            window.GAME_RENDER.showNotification(`Attacked for ${card.damage || 2} DMG!`);
        } else {
            window.GAME_RENDER.showNotification("Missed!");
        }
    }

    STATE.selectedCard = null;
    STATE.validTiles = [];
    document.querySelectorAll('.map-tile').forEach(el => el.classList.remove('highlight-move', 'highlight-attack'));

    window.GAME_RENDER.renderGame(STATE);
}
