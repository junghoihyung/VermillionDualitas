// Vermilion_GameClient/js/lobby.js
const Lobby = {
    selectedChar: null,
    selectedMap: null,
    equipped: {
        head: null,
        torso: null,
        arm: null,
        legs: null,
        acc: null
    },

    init: () => {
        // Pre-Select Defaults
        Lobby.selectedChar = ASSETS.chars[0];
        Lobby.selectedMap = ASSETS.maps[0];

        Lobby.render();
    },

    render: () => {
        const root = document.getElementById('lobby-screen');
        if (!root) return;

        root.innerHTML = `
            <div class="lobby-container">
                <div class="lobby-header">
                    <h1>VERMILION: DUALITAS</h1>
                    <button class="btn primary" onclick="Lobby.startGame()">⚔️ ENTER BATTLE</button>
                </div>
                
                <div class="lobby-content">
                    <!-- Column 1: Character Select -->
                    <div class="lobby-panel">
                        <h3>1. Select Persona</h3>
                        <div class="list-container">
                            ${ASSETS.chars.map(c => `
                                <div class="list-item ${Lobby.selectedChar.id === c.id ? 'active' : ''}" 
                                     onclick="Lobby.selectChar('${c.id}')">
                                    <b>${c.name}</b><br>
                                    <small>Role: ${c.role} | HP: ${c.hp}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Column 2: Equipment Loadout -->
                    <div class="lobby-panel">
                        <h3>2. Equipment</h3>
                        <div class="equip-slots">
                             <!-- Drop Targets -->
                             ${Lobby.renderSlot('acc', 'Head/Acc')}
                             ${Lobby.renderSlot('torso', 'Torso')}
                             ${Lobby.renderSlot('arm', 'Arm (Weapon)')}
                             ${Lobby.renderSlot('legs', 'Legs')}
                        </div>
                        <hr>
                        <h4>Warehouse</h4>
                        <div class="warehouse-container">
                            ${ASSETS.equips.map(e => `
                                <div class="equip-item" draggable="true" ondragstart="Lobby.dragStart(event, '${e.id}')">
                                    ${e.name} <small>[${e.slot}]</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Column 3: Mission -->
                    <div class="lobby-panel">
                        <h3>3. Mission Select</h3>
                        <select onchange="Lobby.selectMap(this.value)">
                            ${ASSETS.maps.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                        <div class="map-preview">
                            <p><b>${Lobby.selectedMap.name}</b></p>
                            <small>Grid: ${Lobby.selectedMap.dimensions.w}x${Lobby.selectedMap.dimensions.h}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSlot: (slot, label) => {
        const item = Lobby.equipped[slot];
        return `
            <div class="equip-slot" ondragover="event.preventDefault()" ondrop="Lobby.drop(event, '${slot}')">
                <span class="slot-label">${label}</span>
                <div class="slot-content">
                    ${item ? `<b>${item.name}</b> <button class="tiny-btn" onclick="Lobby.unequip('${slot}')">x</button>` : '<small>Empty</small>'}
                </div>
            </div>
        `;
    },

    selectChar: (id) => {
        Lobby.selectedChar = ASSETS.chars.find(c => c.id === id);
        Lobby.render();
    },

    selectMap: (id) => {
        Lobby.selectedMap = ASSETS.maps.find(m => m.id === id);
        Lobby.render();
    },

    dragStart: (ev, id) => {
        ev.dataTransfer.setData("text/plain", id);
    },

    drop: (ev, slot) => {
        ev.preventDefault();
        const id = ev.dataTransfer.getData("text/plain");
        const item = ASSETS.equips.find(e => e.id === id);

        if (!item) return;
        if (item.slot !== slot && !(slot === 'acc' && item.type === 'ACC')) { // Strict Slot check?
            // "Arm" vs "WEP". Mapping check.
            // ASSETS has 'arm', 'torso', 'legs'.
            if (item.slot !== slot) {
                alert(`Cannot equip ${item.slot} item in ${slot} slot!`);
                return;
            }
        }

        Lobby.equipped[slot] = item;
        Lobby.render();
    },

    unequip: (slot) => {
        Lobby.equipped[slot] = null;
        Lobby.render();
    },

    startGame: () => {
        // Transfer Lobby State to Engine DB/State
        DB.map = Lobby.selectedMap;
        DB.chars = [Lobby.selectedChar]; // Engine uses single player mainly
        DB.equips = Object.values(Lobby.equipped).filter(e => e !== null);

        // Hide Lobby, Show Game
        document.getElementById('lobby-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block'; // Assuming standard container

        // Init Engine
        Engine.init();
    }
};
