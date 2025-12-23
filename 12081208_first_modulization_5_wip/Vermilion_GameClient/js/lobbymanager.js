// lobbymanager.js
window.GAME_LOBBY = {};

window.GAME_LOBBY.initLobby = function () {
    window.GAME_RENDER.renderLobby(startGame);
}

function startGame() {
    if (!window.selectedChar) {
        alert("Select a Character!");
        return;
    }

    // Transition
    const els = {
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen')
    };

    els.lobby.classList.add('hidden');
    els.game.classList.remove('hidden');

    // Init Logic
    window.GAME_MAIN.initGame(window.selectedChar, window.selectedLoadout);
}
