// Vermilion_EquipmentCalc/js/trinket_io.js
// === Trinket I/O (Custom State) ===

function exportTrinketDB() {
    let name = document.getElementById('trinketName').value.trim();
    if (!name) name = "무제_장신구";

    const data = {
        type: "trinket",
        version: "5.5-custom",
        name: name,
        flavorText: document.getElementById('trinketFlavor').value || "",
        state: {
            capacity: TrinketState.capacity,
            rechargeEnabled: TrinketState.rechargeEnabled,
            recharge: TrinketState.recharge, // { idx, x }
            effects: TrinketState.effects // [ {idx, val, die, from, to, count} ]
        },
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

function importTrinketDB(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);

            if (data.type !== "trinket") {
                alert("이 파일은 장신구 데이터가 아닙니다.");
                return;
            }

            document.getElementById('trinketName').value = data.name || "";
            document.getElementById('trinketFlavor').value = data.flavorText || "";

            TrinketState.capacity = data.state.capacity;
            TrinketState.rechargeEnabled = (data.state.rechargeEnabled !== undefined) ? data.state.rechargeEnabled : true;
            TrinketState.recharge = data.state.recharge;
            TrinketState.effects = data.state.effects || [];

            // Render UI
            renderTrinketCap();

            document.getElementById('chkTrRecharge').checked = TrinketState.rechargeEnabled;
            // Trigger toggle update visually
            if (typeof toggleTrRecharge === 'function') toggleTrRecharge();

            // Render Effects
            const effZone = document.getElementById('dropTrinketEff');
            effZone.innerHTML = '';
            TrinketState.effects.forEach(eff => {
                if (typeof createDroppedTrinketItem === 'function') {
                    const d = TRINKET_EFFECTS[eff.idx];
                    // Pass eff as state object directly to restore inputs
                    createDroppedTrinketItem(effZone, d, eff.idx, eff);
                }
            });

            // Render Recharge
            const recZone = document.getElementById('dropTrinketRec');
            recZone.innerHTML = '';
            if (TrinketState.recharge) {
                if (typeof createDroppedRechargeItem === 'function') {
                    const idx = TrinketState.recharge.idx;
                    const d = RECHARGE_TYPES[idx];
                    createDroppedRechargeItem(recZone, d, idx, TrinketState.recharge);
                }
            }

            calcTrinket();
            alert(`[${data.name}] 장신구 불러오기 완료!`);

        } catch (err) {
            console.error(err);
            alert("파일 형식이 올바르지 않습니다.");
        }
    };
    reader.readAsText(file);
}
