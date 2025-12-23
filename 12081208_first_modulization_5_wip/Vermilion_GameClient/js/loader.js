// Vermilion_GameClient/js/loader.js
const Loader = {
    handleFiles: (input) => {
        Array.from(input.files).forEach(f => {
            const r = new FileReader();
            r.onload = e => Loader.parse(f.name, JSON.parse(e.target.result));
            r.readAsText(f);
        });
    },
    parse: (fname, data) => {
        // 1. Map Data (.vmap)
        if (fname.endsWith('.vmap') || data.map || (data.dimensions && data.entities)) {
            DB.map = data;
            Logger.sys(`Map Loaded: ${fname}`);
        }
        // 2. Enemy Data (.ven)
        else if (fname.endsWith('.ven') || (Array.isArray(data) && data.length > 0 && data[0].etv !== undefined)) {
            // Validate and Cleanup
            const enemies = data.filter(e => e.name && e.hp);
            if (enemies.length > 0) {
                DB.enemies = enemies;
                Logger.sys(`Enemies Loaded: ${enemies.length} types (${enemies.map(e => e.name).join(', ')})`);
            }
        }
        // 3. Equipment Data (.veq)
        else if (fname.endsWith('.veq') || (Array.isArray(data) && data.length > 0 && data[0].slot)) {
            // Validate: Must have name, slot, and logicRows?
            const equips = data.filter(e => e.name && e.slot);
            if (equips.length > 0) {
                DB.equips = equips;
                Logger.sys(`Equips Loaded: ${equips.length} items (${equips.map(e => e.name).join(', ')})`);
            }
        }
        // 4. Character Data (.vchar)
        else if (fname.endsWith('.vchar') || (Array.isArray(data) && data.length > 0 && data[0].role)) {
            DB.chars = data;
            Logger.sys(`Chars Loaded: ${data.length} personas`);
        }

        // Auto-Init if minimum requirements met (Map + 1 Enemy type + 1 Equip?)
        // Actually, let's wait for user to click "Start" or just re-init if Map exists.
        if (DB.map && DB.map.dimensions) {
            Logger.sys("Database Updated. Re-Initializing Engine...");
            Engine.init();
        }
    }
};
