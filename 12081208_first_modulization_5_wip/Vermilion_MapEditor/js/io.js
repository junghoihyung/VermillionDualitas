// Vermilion_MapEditor/js/io.js
// === Save & Load ===
function saveQuestFile() {
    const qName = document.getElementById('qName').value.trim();
    const qType = document.getElementById('qType').value;
    if (!qName) return alert("퀘스트 이름을 입력하세요.");

    let hasP1 = false;
    for (let k in entities) if (entities[k].type === 'marker' && entities[k].val === 'P1') hasP1 = true;
    if (!hasP1) return alert("오류: P1 시작점이 없습니다.");

    if (qType === 'escort') {
        let hasCarriage = false, hasTree = false;
        for (let k in entities) if (entities[k].val === 'carriage') hasCarriage = true;
        for (let k in mapData) if (mapData[k] === 5) hasTree = true;
        if (!hasCarriage) return alert("오류: '마차'가 없습니다.");
        if (!hasTree) return alert("오류: '폐나무' 타일이 없습니다.");
    }
    if (qType === 'stabilize') {
        let tCount = 0;
        for (let k in entities) if (entities[k].val === 'target') tCount++;
        if (tCount !== 4) return alert(`오류: '돌파력의 땅'은 정확히 4개여야 합니다. (현재 ${tCount}개)`);
    }

    const questData = {
        meta: {
            name: qName,
            type: qType,
            limit: parseInt(document.getElementById('qLimit').value),
            threatMod: parseInt(document.getElementById('qThreat').value),
            created: new Date().toISOString(),
            carriageHp: (qType === 'escort') ? parseInt(document.getElementById('carriageHP').value) : null,
            targetCount: (qType === 'stabilize') ? 4 : 0
        },
        dimensions: mapSize,
        map: mapData,
        entities: entities
    };

    const blob = new Blob([JSON.stringify(questData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = qName.replace(/\s+/g, '_') + ".vmp";
    a.click();
}

function loadQuestFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('qName').value = data.meta.name;
            document.getElementById('qType').value = data.meta.type;
            document.getElementById('qLimit').value = data.meta.limit;
            document.getElementById('qThreat').value = data.meta.threatMod || 0;
            if (data.meta.carriageHp) document.getElementById('carriageHP').value = data.meta.carriageHp;

            document.getElementById('mapW').value = data.dimensions.w;
            document.getElementById('mapH').value = data.dimensions.h;
            mapSize = data.dimensions;
            mapData = data.map;
            entities = data.entities;

            // Push loaded state to history
            historyStack = [];
            historyIndex = -1;
            pushHistory();

            updateQuestUI();
            alert("퀘스트 로드 완료!");
        } catch (err) { alert("파일 오류"); }
    };
    reader.readAsText(file);
}

function loadVenFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                loadedEnemies = data;
                renderEnemyList();
            }
        } catch (err) { alert("파일 형식 오류"); }
    };
    reader.readAsText(file);
}
