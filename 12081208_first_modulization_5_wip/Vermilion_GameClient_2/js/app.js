const STATE = {
  phase: 'player',
  round: 1,
  player: null,
  loadout: null,
  deck: [],
  hand: [],
  discard: [],
  enemies: [],
  map: null,
  units: [],
  diceOverlay: {
    active: false,
    dice: [],
    card: null
  },
  validTiles: [],
  targetTiles: [],
  actionBar: null
};

const DATA = {
  map: {
    name: 'Vermilion: Trial Arena',
    tiles: [
      { type: 'muscle' }, { type: 'muscle' }, { type: 'bone' },
      { type: 'muscle' }, { type: 'bone' }, { type: 'muscle' },
      { type: 'muscle' }, { type: 'muscle' }, { type: 'muscle' }
    ]
  },
  characters: [
    {
      id: 'flesh_knight',
      name: '시체기사',
      class: 'Tank / Berzerker',
      hp: 14,
      desc: '고통을 위력으로 전환하는 전방 탱커.',
      unique: [
        { id: 'fk_1', name: '앙갚음: 축적', type: 'unique', icon: '✨', base: 0, dice: 0 },
        { id: 'fk_2', name: '앙갚음: 방출', type: 'attack', icon: '💪', range: 1, base: 2, dice: 2 },
        { id: 'fk_3', name: '감내', type: 'unique', icon: '✨', base: 0, dice: 0 }
      ]
    },
    {
      id: 'albanus',
      name: '알바누스 폰즈',
      class: 'Support / Tactician',
      hp: 11,
      desc: '이동과 방어를 유연하게 전환하는 전술가.',
      unique: [
        { id: 'ap_1', name: '무마찰 질주', type: 'move', icon: '🦵', base: 2, dice: 1 },
        { id: 'ap_2', name: '무한 마찰 타격', type: 'attack', icon: '💪', range: 1, base: 2, dice: 2 },
        { id: 'ap_3', name: '운동량 반사', type: 'defense', icon: '🫀', base: 3, dice: 1 }
      ]
    },
    {
      id: 'cleostrata',
      name: '클레오스트라타',
      class: 'Ranger / Marker',
      hp: 9,
      desc: '표식과 기동으로 전장을 컨트롤한다.',
      unique: [
        { id: 'cs_1', name: '레이턴시: 표식', type: 'unique', icon: '✨', base: 0, dice: 1 },
        { id: 'cs_2', name: '레이턴시: 격발', type: 'attack', icon: '💪', range: 2, base: 1, dice: 2 },
        { id: 'cs_3', name: '레이턴시: 추진', type: 'move', icon: '🦵', base: 2, dice: 1 }
      ]
    },
    {
      id: 'gwendolyn',
      name: '그웬돌린 벤투스',
      class: 'Mage / AoE',
      hp: 9,
      desc: '진공으로 적을 끌어당긴다.',
      unique: [
        { id: 'gw_1', name: '진공의 손아귀', type: 'attack', icon: '💪', range: 2, base: 1, dice: 2 },
        { id: 'gw_2', name: '충동적 맹공', type: 'attack', icon: '💪', range: 1, base: 2, dice: 3 },
        { id: 'gw_3', name: '진공 쇄도', type: 'move', icon: '🦵', base: 2, dice: 2 }
      ]
    },
    {
      id: 'pius',
      name: '피우스 페무르',
      class: 'Guardian',
      hp: 10,
      desc: '방어를 통한 전장 장악에 특화.',
      unique: [
        { id: 'pf_1', name: '움보 아페리오', type: 'defense', icon: '🫀', base: 3, dice: 1 },
        { id: 'pf_2', name: '심맥류전술: 격류', type: 'attack', icon: '💪', range: 1, base: 2, dice: 2 },
        { id: 'pf_3', name: '심맥류전술: 연소', type: 'unique', icon: '✨', base: 0, dice: 0 }
      ]
    },
    {
      id: 'turbalio',
      name: '투르발리오 겔리우스',
      class: 'Bruiser',
      hp: 12,
      desc: '중력을 활용한 공격과 방어.',
      unique: [
        { id: 'tg_1', name: '아르고스: 척력', type: 'attack', icon: '💪', range: 1, base: 2, dice: 2 },
        { id: 'tg_2', name: '아르고스: 인력', type: 'defense', icon: '🫀', base: 2, dice: 2 },
        { id: 'tg_3', name: '철갑의 본능', type: 'unique', icon: '✨', base: 0, dice: 0 }
      ]
    },
    {
      id: 'cassius',
      name: '카시우스 라티시무스',
      class: 'Artillery',
      hp: 8,
      desc: '원거리 화력으로 전장을 지배한다.',
      unique: [
        { id: 'ca_1', name: '봄바르다: 확산', type: 'attack', icon: '💪', range: 3, base: 1, dice: 2 },
        { id: 'ca_2', name: '봄바르다: 유도', type: 'attack', icon: '💪', range: 4, base: 1, dice: 2 },
        { id: 'ca_3', name: '열전도', type: 'unique', icon: '✨', base: 0, dice: 0 }
      ]
    },
    {
      id: 'gaius',
      name: '가이우스 마르켈루스',
      class: 'Tactician',
      hp: 10,
      desc: '예지와 결단의 검객.',
      unique: [
        { id: 'gm_1', name: '경계 융합', type: 'unique', icon: '✨', base: 0, dice: 1 },
        { id: 'gm_2', name: '예지된 인과', type: 'unique', icon: '✨', base: 0, dice: 0 },
        { id: 'gm_3', name: '무라마사: 발도', type: 'attack', icon: '💪', range: 1, base: 2, dice: 3 }
      ]
    },
    {
      id: 'hector',
      name: '헥토르',
      class: 'Brawler',
      hp: 12,
      desc: '절대 질량으로 적을 제압한다.',
      unique: [
        { id: 'hc_1', name: '기간테스: 압살', type: 'attack', icon: '💪', range: 1, base: 2, dice: 2 },
        { id: 'hc_2', name: '기간테스: 중력장', type: 'unique', icon: '✨', base: 0, dice: 0 },
        { id: 'hc_3', name: '절대 질량', type: 'defense', icon: '🫀', base: 3, dice: 2 }
      ]
    },
    {
      id: 'hegio',
      name: '헤기오 고르디안',
      class: 'Controller',
      hp: 10,
      desc: '결속과 처형을 활용한다.',
      unique: [
        { id: 'hg_1', name: '만디불라: 결속', type: 'attack', icon: '💪', range: 1, base: 1, dice: 1 },
        { id: 'hg_2', name: '텔룸: 처형', type: 'attack', icon: '💪', range: 1, base: 2, dice: 3 },
        { id: 'hg_3', name: '광기의 재조립', type: 'unique', icon: '✨', base: 0, dice: 0 }
      ]
    }
  ],
  baseCards: [
    { id: 'atk1', name: '공격', type: 'attack', icon: '💪', range: 1, base: 1, dice: 1 },
    { id: 'atk2', name: '공격', type: 'attack', icon: '💪', range: 1, base: 1, dice: 1 },
    { id: 'atk3', name: '공격', type: 'attack', icon: '💪', range: 1, base: 1, dice: 1 },
    { id: 'def1', name: '방어', type: 'defense', icon: '🫀', base: 2, dice: 1 },
    { id: 'def2', name: '방어', type: 'defense', icon: '🫀', base: 2, dice: 1 },
    { id: 'mov1', name: '이동', type: 'move', icon: '🦵', base: 2, dice: 1 },
    { id: 'mov2', name: '이동', type: 'move', icon: '🦵', base: 2, dice: 1 }
  ],
  enemies: [
    {
      id: 'kynodon',
      name: '퀴노돈',
      hp: 10,
      def: 1,
      dicePool: ['imprint', 'imprint', 'breakthrough'],
      attackRange: 1,
      actions: {
        blue: { min: 0, max: 3, label: '탐색', icon: '🦵4', type: 'move', value: 4 },
        green: { min: 4, max: 6, label: '추적 사냥', icon: '🦵2+⚔️3', type: 'attack', value: 3 },
        red: { min: 7, max: 99, label: '핏빛 쇄도', icon: '🦵4+⚔️4', type: 'attack', value: 4 },
        yellow: { min: 5, max: 5, label: '과부하', icon: '🟡', type: 'special', value: 0 }
      }
    },
    {
      id: 'ungulus',
      name: '웅굴루스',
      hp: 8,
      def: 0,
      dicePool: ['imprint', 'breakthrough', 'breakthrough'],
      attackRange: 3,
      actions: {
        blue: { min: 0, max: 3, label: '거리 벌리기', icon: '🦵2', type: 'move', value: 2 },
        green: { min: 4, max: 6, label: '전술 사격', icon: '🦵1+🏹3', type: 'attack', value: 3 },
        red: { min: 7, max: 99, label: '마비 침', icon: '🏹4', type: 'attack', value: 4 },
        yellow: { min: 5, max: 5, label: '약점', icon: '🟡', type: 'special', value: 0 }
      }
    }
  ]
};

const DICE_FACES = {
  imprint: [1, 1, 1, 2, 2, 2],
  breakthrough: [0, 0, 1, 3, 3, 3]
};

const DOM = {
  lobby: document.getElementById('lobby'),
  game: document.getElementById('game'),
  characterList: document.getElementById('character-list'),
  loadoutList: document.getElementById('loadout-list'),
  summary: document.getElementById('selection-summary'),
  startBtn: document.getElementById('start-game'),
  playerName: document.getElementById('player-name'),
  playerClass: document.getElementById('player-class'),
  playerDesc: document.getElementById('player-desc'),
  playerHpBar: document.getElementById('player-hp-bar'),
  playerHpText: document.getElementById('player-hp-text'),
  playerThreat: document.getElementById('player-threat'),
  playerSuppress: document.getElementById('player-suppress'),
  slotHead: document.getElementById('slot-head'),
  slotArm: document.getElementById('slot-arm'),
  slotTorso: document.getElementById('slot-torso'),
  slotLegs: document.getElementById('slot-legs'),
  enemyList: document.getElementById('enemy-list'),
  barBlue: document.getElementById('bar-blue'),
  barGreen: document.getElementById('bar-green'),
  barRed: document.getElementById('bar-red'),
  barYellow: document.getElementById('bar-yellow'),
  enemySum: document.getElementById('enemy-sum'),
  enemyIntent: document.getElementById('enemy-intent'),
  mapName: document.getElementById('map-name'),
  roundCount: document.getElementById('round-count'),
  phaseIndicator: document.getElementById('phase-indicator'),
  endTurn: document.getElementById('end-turn'),
  mapGrid: document.getElementById('map-grid'),
  deckCount: document.getElementById('deck-count'),
  hand: document.getElementById('hand'),
  discard: document.getElementById('discard'),
  diceOverlay: document.getElementById('dice-overlay'),
  dicePool: document.getElementById('dice-pool'),
  rollAll: document.getElementById('roll-all'),
  condense: document.getElementById('condense'),
  improvise: document.getElementById('improvise'),
  overlayHint: document.getElementById('overlay-hint'),
  defenseModal: document.getElementById('defense-modal'),
  defenseOptions: document.getElementById('defense-options'),
  defenseSkip: document.getElementById('defense-skip')
};

const CARTESIAN = {
  toGridRow: (y) => 6 - y,
  toGridCol: (x) => x
};

const GRID_SIZE = 3;
const DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1]
];

const SELECTION = {
  character: null,
  loadout: null
};

initLobby();

async function initLobby() {
  renderList(DOM.characterList, DATA.characters, (item) => item.name, (item) => {
    SELECTION.character = item;
    updateSummary();
  });

  const loadouts = await loadLoadouts();
  renderList(DOM.loadoutList, loadouts, (item) => item.name, (item) => {
    SELECTION.loadout = item;
    updateSummary();
  });

  DOM.startBtn.addEventListener('click', () => {
    if (!SELECTION.character || !SELECTION.loadout) {
      notify('캐릭터와 로드아웃을 선택하세요.');
      return;
    }
    startGame();
  });
}

async function loadLoadouts() {
  try {
    const res = await fetch('./veq-manifest.json');
    if (!res.ok) throw new Error('manifest missing');
    const manifest = await res.json();
    const loadouts = await Promise.all(
      manifest.files.map(async (file) => {
        const fileRes = await fetch(`./${file}`);
        const data = await fileRes.json();
        return buildLoadout(file, data);
      })
    );
    return loadouts;
  } catch (error) {
    DOM.loadoutList.innerHTML = '<div class="list-item">.veq 로드 실패 (manifest 필요)</div>';
    return [];
  }
}

function buildLoadout(file, items) {
  const slots = { head: 'Empty', arm: 'Empty', torso: 'Empty', legs: 'Empty' };
  items.forEach((item) => {
    if (slots[item.slot] !== undefined) slots[item.slot] = item.name;
  });
  return {
    name: file.replace('.veq', ''),
    items,
    slots
  };
}

function renderList(container, list, labelFn, onSelect) {
  container.innerHTML = '';
  list.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<strong>${labelFn(item)}</strong>`;
    if (item.desc) {
      div.innerHTML += `<div class="muted">${item.desc}</div>`;
    }
    div.addEventListener('click', () => {
      container.querySelectorAll('.list-item').forEach((el) => el.classList.remove('selected'));
      div.classList.add('selected');
      onSelect(item);
    });
    if (index === 0) div.click();
    container.appendChild(div);
  });
}

function updateSummary() {
  if (!SELECTION.character || !SELECTION.loadout) return;
  const { character, loadout } = SELECTION;
  DOM.summary.innerHTML = `
    <strong>${character.name}</strong><br />
    ${character.class}<br />
    HP ${character.hp}<br /><br />
    <strong>장비</strong><br />
    🧠 ${loadout.slots.head}<br />
    💪 ${loadout.slots.arm}<br />
    🫀 ${loadout.slots.torso}<br />
    🦵 ${loadout.slots.legs}
  `;
}

function startGame() {
  STATE.phase = 'player';
  STATE.round = 1;
  STATE.player = {
    ...SELECTION.character,
    maxHp: SELECTION.character.hp,
    hp: SELECTION.character.hp,
    threat: 0,
    suppress: 0
  };
  STATE.loadout = SELECTION.loadout;
  STATE.map = JSON.parse(JSON.stringify(DATA.map));
  STATE.enemies = DATA.enemies.map((enemy) => ({ ...enemy, maxHp: enemy.hp }));
  STATE.units = [
    { id: 'player', type: 'player', pos: 6, hp: STATE.player.hp, maxHp: STATE.player.maxHp },
    { id: 'enemy1', type: 'enemy', pos: 2, hp: STATE.enemies[0].hp, maxHp: STATE.enemies[0].maxHp },
    { id: 'enemy2', type: 'enemy', pos: 8, hp: STATE.enemies[1].hp, maxHp: STATE.enemies[1].maxHp }
  ];
  STATE.deck = shuffle([...DATA.baseCards, ...SELECTION.character.unique]);
  STATE.hand = [];
  STATE.discard = [];
  drawCards(4);
  DOM.lobby.classList.add('hidden');
  DOM.game.classList.remove('hidden');
  bindGameEvents();
  renderGame();
}

function bindGameEvents() {
  DOM.endTurn.onclick = () => {
    if (STATE.phase !== 'player') return;
    endPlayerTurn();
  };
  DOM.rollAll.onclick = rollAllDice;
  DOM.condense.onclick = condenseDice;
  DOM.improvise.onclick = improviseDice;
  DOM.defenseSkip.onclick = () => resolveDefense(null);
}

function renderGame() {
  renderPlayerPanel();
  renderEnemies();
  renderMap();
  renderHand();
  renderTopBar();
  renderDeck();
  renderActionBar();
  renderDiceOverlay();
}

function renderPlayerPanel() {
  DOM.playerName.textContent = STATE.player.name;
  DOM.playerClass.textContent = STATE.player.class;
  DOM.playerDesc.textContent = STATE.player.desc;
  DOM.playerHpText.textContent = `${STATE.player.hp}/${STATE.player.maxHp}`;
  DOM.playerHpBar.style.width = `${(STATE.player.hp / STATE.player.maxHp) * 100}%`;
  DOM.playerThreat.textContent = STATE.player.threat;
  DOM.playerSuppress.textContent = STATE.player.suppress;

  DOM.slotHead.textContent = STATE.loadout.slots.head;
  DOM.slotArm.textContent = STATE.loadout.slots.arm;
  DOM.slotTorso.textContent = STATE.loadout.slots.torso;
  DOM.slotLegs.textContent = STATE.loadout.slots.legs;
}

function renderEnemies() {
  DOM.enemyList.innerHTML = '';
  STATE.enemies.forEach((enemy) => {
    const card = document.createElement('div');
    card.className = 'list-item';
    card.innerHTML = `
      <strong>${enemy.name}</strong> (DEF ${enemy.def})<br />
      HP ${enemy.hp}/${enemy.maxHp}<br />
      Dice: ${enemy.dicePool.map((d) => (d === 'imprint' ? '⬜' : '🟥')).join('')}
    `;
    DOM.enemyList.appendChild(card);
  });
}

function renderMap() {
  DOM.mapGrid.innerHTML = '';
  STATE.map.tiles.forEach((tile, index) => {
    const div = document.createElement('div');
    div.className = `tile ${tile.type}`;
    div.dataset.index = index;

    if (STATE.validTiles.includes(index)) div.classList.add('highlight-move');
    if (STATE.targetTiles.includes(index)) div.classList.add('highlight-attack');

    const unit = STATE.units.find((u) => u.pos === index);
    if (unit) {
      const unitEl = document.createElement('div');
      unitEl.className = `unit ${unit.type}`;
      unitEl.innerHTML = `
        <div>${unit.type === 'player' ? '🧙' : '🧟‍♂️'}</div>
        <div class="unit-hp"><div class="unit-hp-fill" style="width:${(unit.hp / unit.maxHp) * 100}%"></div></div>
      `;
      if (unit.isShaking) unitEl.classList.add('shake');
      div.appendChild(unitEl);
    }

    div.onclick = () => handleTileClick(index);
    DOM.mapGrid.appendChild(div);
  });
}

function renderHand() {
  DOM.hand.innerHTML = '';
  STATE.hand.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'card';
    if (card.resonance) el.classList.add('resonance');
    el.dataset.cardId = card.id;
    el.innerHTML = `
      <div>${card.icon} ${card.type.toUpperCase()}</div>
      <div>${card.name}</div>
      <button class="burn">🔥</button>
    `;
    el.onclick = () => playCard(card);
    el.querySelector('.burn').onclick = (event) => {
      event.stopPropagation();
      burnCard(card, el);
    };
    DOM.hand.appendChild(el);
  });
}

function renderTopBar() {
  DOM.mapName.textContent = STATE.map.name;
  DOM.roundCount.textContent = `Round ${STATE.round}`;
  DOM.phaseIndicator.textContent = STATE.phase === 'player' ? 'PLAYER TURN' : 'ENEMY TURN';
}

function renderDeck() {
  DOM.deckCount.textContent = STATE.deck.length;
}

function renderActionBar() {
  const bars = [DOM.barBlue, DOM.barGreen, DOM.barRed, DOM.barYellow];
  bars.forEach((bar) => bar.classList.remove('active'));
  if (!STATE.actionBar) {
    DOM.enemySum.textContent = 'Sum: -';
    DOM.enemyIntent.textContent = 'Waiting...';
    return;
  }
  DOM.enemySum.textContent = `Sum: ${STATE.actionBar.sum}`;
  DOM.enemyIntent.textContent = STATE.actionBar.intent;
  if (STATE.actionBar.zone === 'blue') DOM.barBlue.classList.add('active');
  if (STATE.actionBar.zone === 'green') DOM.barGreen.classList.add('active');
  if (STATE.actionBar.zone === 'red') DOM.barRed.classList.add('active');
  if (STATE.actionBar.zone === 'yellow') DOM.barYellow.classList.add('active');
}

function renderDiceOverlay() {
  if (!STATE.diceOverlay.active) {
    DOM.diceOverlay.classList.add('hidden');
    return;
  }
  DOM.diceOverlay.classList.remove('hidden');
  DOM.dicePool.innerHTML = '';
  STATE.diceOverlay.dice.forEach((die) => {
    const el = document.createElement('div');
    el.className = `die ${die.type}`;
    if (die.rolling) el.classList.add('rolling');
    el.innerHTML = `<div>${die.type === 'imprint' ? '⬜' : '🟥'}</div><div>${die.value ?? '-'}</div>`;
    el.onclick = () => rollSingleDie(die.id);
    DOM.dicePool.appendChild(el);
  });
}

function drawCards(count) {
  for (let i = 0; i < count; i += 1) {
    if (STATE.deck.length === 0) {
      STATE.deck = shuffle(STATE.discard.splice(0));
    }
    const card = STATE.deck.shift();
    if (card) STATE.hand.push({ ...card });
  }
}

function playCard(card) {
  if (STATE.phase !== 'player') {
    notify('적 턴입니다.');
    return;
  }
  if (card.type === 'defense') {
    notify('방어 카드는 적 턴에 사용합니다.');
    return;
  }
  if (card.type === 'unique') {
    notify(`${card.name} 효과 발동`);
    discardCard(card);
    renderGame();
    return;
  }

  STATE.diceOverlay.active = true;
  STATE.diceOverlay.card = card;
  STATE.diceOverlay.dice = buildDice(card.dice ?? 1);
  STATE.validTiles = [];
  STATE.targetTiles = [];
  renderGame();
}

function buildDice(count) {
  const dice = [];
  for (let i = 0; i < count; i += 1) {
    dice.push({
      id: `${Date.now()}-${i}`,
      type: i < 2 ? 'imprint' : 'breakthrough',
      value: null,
      rolling: false
    });
  }
  return dice;
}

function rollAllDice() {
  STATE.diceOverlay.dice.forEach((die) => rollDie(die));
  setTimeout(applyDiceResult, 350);
}

function rollSingleDie(id) {
  const die = STATE.diceOverlay.dice.find((d) => d.id === id);
  if (!die) return;
  rollDie(die);
  setTimeout(applyDiceResult, 350);
}

function rollDie(die) {
  die.rolling = true;
  renderDiceOverlay();
  setTimeout(() => {
    const faces = DICE_FACES[die.type] || DICE_FACES.imprint;
    die.value = faces[Math.floor(Math.random() * faces.length)];
    die.rolling = false;
    renderDiceOverlay();
  }, 280);
}

function applyDiceResult() {
  const card = STATE.diceOverlay.card;
  if (!card) return;
  if (STATE.diceOverlay.dice.some((d) => d.value === null)) return;
  const sum = STATE.diceOverlay.dice.reduce((acc, d) => acc + d.value, 0);
  const playerPos = getPlayerUnit().pos;
  const blockers = new Set(STATE.units.map((u) => u.pos));
  blockers.delete(playerPos);

  if (card.type === 'move') {
    const movePoints = sum + card.base;
    STATE.validTiles = bfsMove(playerPos, movePoints, blockers);
    STATE.targetTiles = [];
    notify(`이동력 ${movePoints}`);
  }

  if (card.type === 'attack') {
    const range = card.range + (isOnBone(playerPos) ? 1 : 0);
    const attackable = losAttack(playerPos, range, blockers);
    STATE.targetTiles = attackable;
    STATE.validTiles = [];
    notify(`사거리 ${range}`);
  }
  renderGame();
}

function handleTileClick(index) {
  if (!STATE.diceOverlay.card) return;
  if (STATE.diceOverlay.dice.some((d) => d.value === null)) {
    notify('주사위를 굴리세요.');
    return;
  }

  const card = STATE.diceOverlay.card;
  if (card.type === 'move' && STATE.validTiles.includes(index)) {
    getPlayerUnit().pos = index;
    finishCard(card);
    notify('이동 완료');
    return;
  }

  if (card.type === 'attack' && STATE.targetTiles.includes(index)) {
    const enemyUnit = STATE.units.find((u) => u.type === 'enemy' && u.pos === index);
    if (!enemyUnit) {
      notify('대상이 없습니다.');
      return;
    }
    const enemyIndex = STATE.units.indexOf(enemyUnit) - 1;
    const enemy = STATE.enemies[enemyIndex];
    const sum = STATE.diceOverlay.dice.reduce((acc, d) => acc + d.value, 0);
    const raw = sum + card.base;
    const damage = Math.max(0, raw - (enemy?.def ?? 0));
    applyDamage(enemyUnit, damage);
    finishCard(card);
    return;
  }
}

function finishCard(card) {
  STATE.diceOverlay.active = false;
  STATE.diceOverlay.card = null;
  STATE.diceOverlay.dice = [];
  STATE.validTiles = [];
  STATE.targetTiles = [];
  discardCard(card);
  renderGame();
}

function discardCard(card) {
  const idx = STATE.hand.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    const [removed] = STATE.hand.splice(idx, 1);
    STATE.discard.push(removed);
  }
}

function burnCard(card, element) {
  if (STATE.phase !== 'player') return;
  element.classList.add('burning');
  setTimeout(() => {
    const idx = STATE.hand.findIndex((c) => c.id === card.id);
    if (idx >= 0) STATE.hand.splice(idx, 1);
    STATE.diceOverlay.active = true;
    STATE.diceOverlay.card = null;
    STATE.diceOverlay.dice = [{ id: `burn-${Date.now()}`, type: 'imprint', value: null, rolling: false }];
    notify('🔥 연소: 주사위 +1');
    renderGame();
  }, 350);
}

function condenseDice() {
  if (!STATE.diceOverlay.active) return;
  if (STATE.discard.length === 0) {
    notify('버린 카드가 없습니다.');
    return;
  }
  const recovered = STATE.discard.pop();
  recovered.resonance = true;
  STATE.hand.push(recovered);
  if (STATE.diceOverlay.dice.length > 0) STATE.diceOverlay.dice.pop();
  notify('응축: 카드 회수');
  renderGame();
}

function improviseDice() {
  if (!STATE.diceOverlay.active) return;
  STATE.diceOverlay.dice = [{ id: `improv-${Date.now()}`, type: 'imprint', value: null, rolling: false }];
  notify('임기응변: 각인 1개');
  renderGame();
}

function endPlayerTurn() {
  STATE.phase = 'enemy';
  STATE.diceOverlay.active = false;
  STATE.diceOverlay.card = null;
  STATE.validTiles = [];
  STATE.targetTiles = [];
  renderGame();
  runEnemyTurn();
}

async function runEnemyTurn() {
  for (let i = 0; i < STATE.enemies.length; i += 1) {
    const enemy = STATE.enemies[i];
    if (enemy.hp <= 0) continue;
    const sum = rollEnemyDice(enemy.dicePool);
    const zone = resolveZone(enemy.actions, sum);
    const action = enemy.actions[zone];
    STATE.actionBar = {
      zone,
      sum,
      intent: `${enemy.name}: ${action.label} ${action.icon}`
    };
    renderGame();

    if (action.type === 'move') {
      moveEnemyTowards(enemy, action.value);
    } else if (action.type === 'attack') {
      await enemyAttack(enemy, action.value);
    }
    await wait(400);
  }
  STATE.phase = 'player';
  STATE.round += 1;
  drawCards(2);
  STATE.actionBar = null;
  renderGame();
}

function rollEnemyDice(pool) {
  return pool.reduce((acc, type) => {
    const faces = DICE_FACES[type] || DICE_FACES.imprint;
    return acc + faces[Math.floor(Math.random() * faces.length)];
  }, 0);
}

async function enemyAttack(enemy, baseDamage) {
  const enemyUnit = getEnemyUnit(enemy);
  const playerUnit = getPlayerUnit();
  if (!enemyUnit || !playerUnit) return;
  const dist = gridDistance(enemyUnit.pos, playerUnit.pos);
  if (dist > enemy.attackRange) {
    moveEnemyTowards(enemy, 2);
    return;
  }

  const defenseCards = STATE.hand.filter((card) => card.type === 'defense');
  let damage = baseDamage;
  if (defenseCards.length > 0) {
    const chosen = await openDefenseModal(defenseCards);
    if (chosen) {
      const roll = rollEnemyDice(['imprint']);
      damage = Math.max(0, baseDamage - (chosen.base + roll));
      discardCard(chosen);
    }
  }
  applyDamage(playerUnit, damage);
}

function moveEnemyTowards(enemy, movePoints) {
  const enemyUnit = getEnemyUnit(enemy);
  const playerUnit = getPlayerUnit();
  const blockers = new Set(STATE.units.map((u) => u.pos));
  blockers.delete(enemyUnit.pos);
  const options = bfsMove(enemyUnit.pos, movePoints, blockers);
  if (options.length === 0) return;
  let best = options[0];
  let bestDist = 99;
  options.forEach((pos) => {
    const dist = gridDistance(pos, playerUnit.pos);
    if (dist < bestDist) {
      best = pos;
      bestDist = dist;
    }
  });
  enemyUnit.pos = best;
}

function openDefenseModal(cards) {
  DOM.defenseOptions.innerHTML = '';
  return new Promise((resolve) => {
    window.pendingDefenseResolve = resolve;
    cards.forEach((card) => {
      const button = document.createElement('button');
      button.className = 'secondary';
      button.textContent = `${card.name} (기본 ${card.base})`;
      button.onclick = () => resolveDefense(card);
      DOM.defenseOptions.appendChild(button);
    });
    DOM.defenseModal.classList.remove('hidden');
  });
}

function resolveDefense(card) {
  DOM.defenseModal.classList.add('hidden');
  if (window.pendingDefenseResolve) {
    window.pendingDefenseResolve(card);
    window.pendingDefenseResolve = null;
  }
}

function applyDamage(unit, amount) {
  if (amount <= 0) return;
  unit.hp = Math.max(0, unit.hp - amount);
  unit.isShaking = true;
  if (unit.type === 'player') STATE.player.hp = unit.hp;
  if (unit.type === 'enemy') {
    const idx = STATE.units.indexOf(unit) - 1;
    if (STATE.enemies[idx]) STATE.enemies[idx].hp = unit.hp;
  }
  setTimeout(() => {
    unit.isShaking = false;
    renderGame();
  }, 300);
  notify(`-${amount} 피해`);
}

function bfsMove(start, points, blockers) {
  const queue = [{ pos: start, cost: 0 }];
  const visited = new Map();
  const valid = new Set();
  visited.set(start, 0);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.cost <= points) valid.add(current.pos);
    if (current.cost >= points) continue;

    const { x, y } = toXY(current.pos);
    DIRS.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny)) return;
      const next = toIndex(nx, ny);
      if (blockers.has(next)) return;
      const cost = current.cost + tileCost(next);
      if (cost > points) return;
      const known = visited.get(next);
      if (known === undefined || cost < known) {
        visited.set(next, cost);
        queue.push({ pos: next, cost });
      }
    });
  }
  valid.delete(start);
  return [...valid];
}

function losAttack(start, range, blockers) {
  const targets = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i += 1) {
    if (i === start) continue;
    if (gridDistance(start, i) <= range && hasLineOfSight(start, i, blockers)) targets.push(i);
  }
  return targets;
}

function hasLineOfSight(a, b, blockers) {
  const { x: x0, y: y0 } = toXY(a);
  const { x: x1, y: y1 } = toXY(b);
  const points = bresenham(x0, y0, x1, y1);
  for (let i = 1; i < points.length - 1; i += 1) {
    const idx = toIndex(points[i].x, points[i].y);
    if (blockers.has(idx)) return false;
  }
  return true;
}

function bresenham(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

function tileCost(index) {
  return STATE.map.tiles[index].type === 'bone' ? 2 : 1;
}

function gridDistance(a, b) {
  const ax = a % GRID_SIZE;
  const ay = Math.floor(a / GRID_SIZE);
  const bx = b % GRID_SIZE;
  const by = Math.floor(b / GRID_SIZE);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

function toIndex(x, y) {
  return y * GRID_SIZE + x;
}

function toXY(index) {
  return { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) };
}

function inBounds(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

function isOnBone(pos) {
  return STATE.map.tiles[pos].type === 'bone';
}

function resolveZone(actions, sum) {
  if (actions.yellow && sum >= actions.yellow.min && sum <= actions.yellow.max) return 'yellow';
  if (sum >= actions.red.min) return 'red';
  if (sum >= actions.green.min) return 'green';
  return 'blue';
}

function getPlayerUnit() {
  return STATE.units.find((u) => u.type === 'player');
}

function getEnemyUnit(enemy) {
  const idx = STATE.enemies.findIndex((e) => e.id === enemy.id);
  return STATE.units[idx + 1];
}

function notify(message) {
  DOM.overlayHint.textContent = message;
  DOM.overlayHint.classList.remove('hidden');
  setTimeout(() => DOM.overlayHint.classList.add('hidden'), 1500);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
