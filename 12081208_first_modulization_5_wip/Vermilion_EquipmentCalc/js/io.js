// Vermilion_EquipmentCalc/js/io.js
// === FILE I/O Logic (.veq) ===
function exportEquipDB() {
    let name = document.getElementById('eqName').value.trim();
    if (!name) { name = "무제_장비"; } // 기본 이름

    const getItems = (id) => {
        const el = document.getElementById(id);
        const items = [];
        for (let child of el.children) {
            items.push({
                db: child.dataset.db,
                idx: child.dataset.idx,
                val: child.querySelector('input') ? child.querySelector('input').value : 1
            });
        }
        return items;
    };

    const logicRowsData = [];
    document.querySelectorAll('.logic-row').forEach(row => {
        let thItem = row.querySelector('.th-drop .d-item.th');
        if (!thItem) return;

        let thData = {
            idx: thItem.dataset.idx,
            val: thItem.querySelector('input') ? thItem.querySelector('input').value : 1
        };

        let resItems = [];
        let specDrop = row.querySelector('.spec-drop');
        for (let child of specDrop.children) {
            resItems.push({
                db: child.dataset.db,
                idx: child.dataset.idx,
                val: child.querySelector('input') ? child.querySelector('input').value : 1
            });
        }

        let flav = row.querySelector('.logic-flavor') ? row.querySelector('.logic-flavor').value : "";

        logicRowsData.push({ th: thData, results: resItems, flavorText: flav });
    });

    const data = {
        name: name,
        flavorText: document.getElementById('eqFlavor').value || "",
        state: {
            diceCount: STATE.diceCount,
            redCount: STATE.redCount,
            capacity: STATE.capacity,
            currentSlot: STATE.currentSlot
        },
        baseItems: getItems('dropBase'),
        logicRows: logicRowsData,
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.veq`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importEquipDB(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            document.getElementById('eqName').value = data.name || "";
            document.getElementById('eqFlavor').value = data.flavorText || "";

            if (data.state) {
                document.getElementById('slCount').value = data.state.diceCount;
                document.getElementById('slRatio').value = data.state.redCount;
                STATE.capacity = data.state.capacity;
                updateCapUI();
                setSlot(data.state.currentSlot);
                updDice();
            }

            const dropBase = document.getElementById('dropBase');
            dropBase.innerHTML = '';
            if (data.baseItems) {
                data.baseItems.forEach(item => {
                    let d = (item.db === 'eff' ? EFFECTS : SPECIAL_EFFECTS)[item.idx];
                    createDroppedItem(dropBase, d, item.db, item.idx);
                    let lastChild = dropBase.lastElementChild;
                    let inp = lastChild.querySelector('input');
                    if (inp) inp.value = item.val;
                });
            }

            document.getElementById('logicContainer').innerHTML = '';
            if (data.logicRows) {
                data.logicRows.forEach(row => {
                    addLogicRow();
                    let newRow = document.getElementById('logicContainer').lastElementChild;

                    let flavInp = newRow.querySelector('.logic-flavor');
                    if (flavInp) flavInp.value = row.flavorText || "";

                    let thDrop = newRow.querySelector('.th-drop');
                    let thD = THRESHOLDS[row.th.idx];
                    createDroppedItem(thDrop, thD, 'th', row.th.idx);
                    let thInp = thDrop.lastElementChild.querySelector('input');
                    if (thInp) thInp.value = row.th.val;

                    let specDrop = newRow.querySelector('.spec-drop');
                    row.results.forEach(res => {
                        let d = (res.db === 'eff' ? EFFECTS : SPECIAL_EFFECTS)[res.idx];
                        createDroppedItem(specDrop, d, res.db, res.idx);
                        let inp = specDrop.lastElementChild.querySelector('input');
                        if (inp) inp.value = res.val;
                    });
                });
            }

            updateThresholdProbs();
            calc();
            alert(`[${data.name}] 장비 불러오기 완료!`);

        } catch (err) {
            console.error(err);
            alert("파일 형식이 올바르지 않습니다.");
        }
    };
    reader.readAsText(file);
}
