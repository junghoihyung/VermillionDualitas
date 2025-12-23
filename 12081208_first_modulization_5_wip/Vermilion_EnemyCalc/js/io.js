// Vermilion_EnemyCalc/js/io.js
function addToRamList() {
    let name = document.getElementById('enemyName').value || "No Name";
    let flavor = document.getElementById('enemyFlavor').value || "";
    // Capture Config
    let config = {
        name: name,
        flavor: flavor,
        hp: STATE.hp, def: STATE.def,
        dice: { c: STATE.diceCount, r: STATE.redCount },
        cuts: { c1: STATE.cut1, c2: STATE.cut2 },
        yellows: [...STATE.yellows],
        priorities: { use: movablePrio(), list: [...STATE.priorityList] },
        zones: {} // Extract zone items
    };

    // Helper to extract items
    const extract = (zid) => {
        let el = document.getElementById(zid);
        if (!el) return [];
        return Array.from(el.children).map(c => {
            let db = c.dataset.db; let idx = c.dataset.idx;
            // For export, store name/type/x/range
            // But to be safe, store Name and X.
            let name = c.querySelector('span').innerText.trim();
            if (db === 'ACT') name = name.substring(3); // remove icon
            let inp = c.querySelector('input[type=number]');
            let val = inp ? parseInt(inp.value) : 1;
            let rngInp = c.querySelector('.range-input');
            let rng = rngInp ? parseInt(rngInp.value) : null;
            return { db, idx, val, rng };
        });
    };

    config.zones['B'] = { load: extract('dropB'), flavor: document.getElementById('flavB').value };
    config.zones['G'] = { load: extract('dropG'), flavor: document.getElementById('flavG').value };
    config.zones['R'] = { load: extract('dropR'), flavor: document.getElementById('flavR').value };
    config.zones['P'] = { load: extract('dropP') };
    STATE.yellows.forEach(y => {
        config.zones['Y' + y] = {
            load: extract(`dropY${y}`),
            flavor: document.getElementById(`flavY${y}`).value,
            weak: document.getElementById(`chkWeak${y}`).checked
        };
    });

    currentEnemyList.push(config);
    renderDBList();
    // Animation feedback
    let btn = document.querySelector('.btn.save');
    let old = btn.innerText; btn.innerText = "✅ 저장됨!"; setTimeout(() => btn.innerText = old, 1000);
}

function movablePrio() {
    return STATE.useCustomPriority;
}

function renderDBList() {
    const list = document.getElementById('dbList');
    list.innerHTML = '';
    document.getElementById('savedCount').innerText = currentEnemyList.length;

    currentEnemyList.forEach((item, i) => {
        let d = document.createElement('div');
        d.className = 'db-list-item';
        d.innerHTML = `<span>${i + 1}. ${item.name}</span> <span style="color:#ef4444" onclick="currentEnemyList.splice(${i},1); renderDBList()">[삭제]</span>`;
        d.onclick = (e) => { if (e.target.tagName !== 'SPAN') loadEnemy(item); };
        list.appendChild(d);
    });
}

// Init Presets
if (typeof PRESETS !== 'undefined' && currentEnemyList.length === 0) {
    // Convert simplified preset format to full config format if needed?
    // The Presets in data.js seem to match the structure 'loadEnemy' expects, EXCEPT 'zones' structure.
    // 'loadEnemy' expects zones.B = { load: [...] }.
    // My preset in data.js matches this.
    // Let's push them.
    // We need complete structure for 'loadEnemy' to work (cuts, priorities, etc).
    // I added cuts/dice in data.js.
    // Presets might need 'priorities': { use: false, list: [] } defaults
    PRESETS.forEach(p => {
        p.priorities = { use: false, list: [] };
        p.dice.c = p.dice.c || 3;
        p.dice.r = p.dice.r || 1;
        currentEnemyList.push(p);
    });
    renderDBList();
}

function loadEnemy(data) {
    document.getElementById('enemyName').value = data.name;
    document.getElementById('enemyFlavor').value = data.flavor || "";
    STATE.hp = data.hp; document.getElementById('inpHP').value = data.hp;
    STATE.def = data.def; document.getElementById('inpDEF').value = data.def;

    document.getElementById('slCount').value = data.dice.c;
    document.getElementById('slRatio').value = data.dice.r;
    updateDiceEngine();

    STATE.cut1 = data.cuts.c1; STATE.cut2 = data.cuts.c2;
    STATE.yellows = data.yellows || [];
    updateDiceEngine(); // render zones
    // Load Items
    const loadZone = (zid, zData) => {
        let el = document.getElementById(zid);
        if (!el || !zData) return;
        el.innerHTML = '';
        (zData.load || []).forEach(item => {
            let db = item.db; let idx = item.idx;
            let meta = (db === 'ACT' ? ACTIONS : KEYWORDS)[idx];
            let div = createItem(el, meta, db, idx);
            if (item.val) {
                let inp = div.querySelector('input[type=number]');
                if (inp) inp.value = item.val;
            }
            if (item.rng) {
                let r = div.querySelector('.range-input');
                if (r) r.value = item.rng;
            }
        });
    };

    loadZone('dropB', data.zones.B); document.getElementById('flavB').value = data.zones.B.flavor || "";
    loadZone('dropG', data.zones.G); document.getElementById('flavG').value = data.zones.G.flavor || "";
    loadZone('dropR', data.zones.R); document.getElementById('flavR').value = data.zones.R.flavor || "";
    loadZone('dropP', data.zones.P);
    STATE.yellows.forEach(y => {
        let z = data.zones['Y' + y];
        loadZone(`dropY${y}`, z);
        document.getElementById(`flavY${y}`).value = z.flavor || "";
        document.getElementById(`chkWeak${y}`).checked = z.weak || false;
    });

    // Load Prio
    STATE.priorityList = [];
    document.getElementById('prioContainer').innerHTML = '';
    if (data.priorities && data.priorities.use) {
        if (!STATE.useCustomPriority) togglePrioMode();
        (data.priorities.list || []).forEach(pid => {
            let idx = PRIORITIES.findIndex(p => p.id === pid);
            if (idx >= 0) {
                let meta = PRIORITIES[idx];
                createItem(document.getElementById('prioContainer'), meta, 'PRIO', idx);
                STATE.priorityList.push(pid);
            }
        });
        updatePrioNumbers();
    } else {
        if (STATE.useCustomPriority) togglePrioMode();
    }

    calc();
}

function exportEnemyDB() {
    let json = JSON.stringify(currentEnemyList, null, 2);
    let blob = new Blob([json], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = `enemy_data_${Date.now()}.ven`;
    a.click();
}

function importEnemyDB(input) {
    let file = input.files[0];
    if (!file) return;
    let fr = new FileReader();
    fr.onload = (e) => {
        try {
            let json = JSON.parse(e.target.result);
            if (Array.isArray(json)) {
                currentEnemyList = json;
                renderDBList();
                alert("불러오기 성공: " + json.length + "개");
            }
        } catch (err) {
            alert("파일 형식 오류!");
        }
    };
    fr.readAsText(file);
}
