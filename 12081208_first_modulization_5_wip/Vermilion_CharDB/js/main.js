// Vermilion_CharDB/js/main.js
let selectedIdx = -1;

function init() {
    renderList();
}

function renderList() {
    const list = document.getElementById('charList');
    list.innerHTML = '';
    CHAR_DB.forEach((c, idx) => {
        const div = document.createElement('div');
        div.className = `char-item ${selectedIdx === idx ? 'active' : ''}`;
        div.innerHTML = `<span>${c.name}</span> <span class="role-badge">${c.role}</span>`;
        div.onclick = () => selectChar(idx);
        list.appendChild(div);
    });
}

function selectChar(idx) {
    selectedIdx = idx;
    renderList();
    renderDetail(CHAR_DB[idx]);
}

function renderDetail(char) {
    const panel = document.getElementById('detailPanel');

    // Growth Priorities Display
    let growthStr = Object.entries(char.growth).map(([k, v]) => `${k}:${v}`).join(', ');

    panel.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:center;">
    <h2 style="margin:0">${char.name}</h2>
    <span style="color:#aaa; font-size:0.9rem;">Role: ${char.role}</span>
</div>

<div class="stat-row">
    <div><label>HP</label> <input type="number" value="${char.hp}" readonly></div>
    <div><label>DEF</label> <input type="number" value="${char.def}" readonly></div>
    <div style="flex:2"><label>성장 선호도 (Growth AI)</label> <input type="text" value="${growthStr}" readonly></div>
</div>

<h3>고유 행동 카드 (AI Logic 포함)</h3>
<div class="card-grid">
    ${char.cards.map((card, cIdx) => `
        <div class="card-box">
            <div class="card-head">
                <span>${card.name}</span>
                <span style="font-size:0.8rem; color:#aaa;">${card.type}</span>
            </div>
            <label>설명 (Human)</label>
            <div style="font-size:0.8rem; color:#ccc; margin-bottom:10px; height:40px; overflow:hidden;">${card.desc}</div>
            
            <label>AI 메타데이터</label>
            <div class="json-view">${JSON.stringify(card.ai_data, null, 2)}</div>
        </div>
    `).join('')}
</div>

<div class="ai-section">
    <h3 style="margin-top:0">🤖 AI 페르소나 설정 (Hidden)</h3>
    <div style="font-size:0.9rem; color:#ccc;">
        이 캐릭터는 <strong>[${char.role}]</strong> 역할을 수행하도록 코딩되었습니다.<br>
        루도내러티브 제약: ${JSON.stringify(char.rp || {})}
    </div>
</div>
`;
}

init();
