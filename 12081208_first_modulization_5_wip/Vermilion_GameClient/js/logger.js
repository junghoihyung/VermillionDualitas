// Vermilion_GameClient/js/logger.js
const Logger = {
    init: () => {
        document.getElementById('gameLog').innerHTML = ''; // Clear Log
        Logger.sys("Logger Initialized.");
    },
    log: (m) => Logger.add(m),
    sys: (m) => Logger.add(m, 'log-sys'),
    turn: (m) => Logger.add(m, 'log-turn'),
    ai: (m) => Logger.add(m, 'log-ai'),
    warn: (m) => Logger.add(m, 'log-warn'),
    add: (msg, cls = '') => {
        const d = document.createElement('div');
        d.className = `log-row ${cls}`;
        const t = new Date().toLocaleTimeString().split(' ')[0];
        d.innerHTML = `<span class="log-time">[${t}]</span><span>${msg}</span>`;
        const b = document.getElementById('gameLog');
        b.appendChild(d); b.scrollTop = b.scrollHeight;
    }
};
