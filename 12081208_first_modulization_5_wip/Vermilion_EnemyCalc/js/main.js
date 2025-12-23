// Vermilion_EnemyCalc/js/main.js
function init() {
    renderPalette();
    bindEvents();
    updateDiceEngine();
    renderDBList();
}

function bindEvents() {
    document.getElementById('inpHP').onchange = (e) => { STATE.hp = parseFloat(e.target.value) || 0; calc(); };
    document.getElementById('inpDEF').onchange = (e) => { STATE.def = parseFloat(e.target.value) || 0; calc(); };
    document.getElementById('slCount').oninput = updateDiceEngine;
    document.getElementById('slRatio').oninput = updateDiceEngine;
    document.getElementById('enemyFlavor').onchange = calc; // Save flavor trigger

    const track = document.querySelector('.prob-slider-container');
    const h1 = document.getElementById('h1'); const h2 = document.getElementById('h2');
    let activeHandle = null;

    h1.onmousedown = (e) => { activeHandle = 'h1'; startDrag(e); };
    h2.onmousedown = (e) => { activeHandle = 'h2'; startDrag(e); };

    function startDrag(e) { e.preventDefault(); window.addEventListener('mousemove', onDrag); window.addEventListener('mouseup', stopDrag); }
    function onDrag(e) {
        if (!activeHandle) return;
        const rect = track.getBoundingClientRect();
        let p = (e.clientX - rect.left) / rect.width;
        p = Math.max(0, Math.min(1, p));
        let val = Math.round(p * STATE.maxSum);
        if (activeHandle === 'h1') { if (val >= STATE.cut2) val = STATE.cut2 - 1; STATE.cut1 = val; }
        else { if (val <= STATE.cut1) val = STATE.cut1 + 1; STATE.cut2 = val; }
        renderGraphAndSlider(); calc();
    }
    function stopDrag() { activeHandle = null; window.removeEventListener('mousemove', onDrag); window.removeEventListener('mouseup', stopDrag); }
}

// Start
init();
