// Vermilion_EnemyCalc/js/data.js
// === Data & Config (BQM 4-Beat v1.2 Enemy Side) ===

const ACTIONS = [
    { name: "이동", type: 'move', tags: ['move'], icon: "🦵", calc: x => x * 1.0, desc: "대상에게 도달하기 위해(원거리는 사거리 유지를 위해) 최단 경로로 **최대 X칸 이동합니다**." },
    { name: "공격", type: 'atk', tags: ['dmg'], icon: "⚔️", calc: x => x * 1.0, desc: "대상에게 **X의 피해를 입힙니다.**" },
    { name: "원거리", type: 'atk', tags: ['dmg'], icon: "🏹", hasRange: true, calc: x => x * 1.0, desc: "시선(LoS)이 닿는 사거리 내 대상에게 **X의 피해를 입힙니다.**" },
    { name: "방어", type: 'def', tags: ['def'], icon: "🛡️", calc: x => x * 3.5, desc: "받는 피해량을 **X만큼 줄입니다.** (BQM: 1 Def = 3.5 V)" },
    { name: "연계", type: 'util', tags: [], icon: "➕", calc: x => 0.5, noX: true, desc: "앞의 행동을 수행한 후, 이어서 다음 행동을 수행합니다." },
    { name: "위협화", type: 'util', tags: ['buff', 'grow'], icon: "💀", calc: x => x * 2.5, desc: "이 행동을 마친 후, 즉시 자신에게 **💀**위협 토큰을 **X개 부여합니다.**" }
];

// Keywords: Enemy Side Values (From BQM_4Beat_컨펜디움_v1.txt)
const KEYWORDS = [
    { name: "<관통>", role: 'modifier', tags: ['pen'], type: 'key', noX: true, calc: x => 3.50, desc: "이 공격은 대상의 **[최종 방어력]을 0으로 취급**하고 피해를 줍니다. (Enemy Side: 3.50 V)" },
    { name: "<밀치기 X>", role: 'modifier', tags: ['cc'], type: 'key', calc: x => x * 3.50, desc: "대상을 공격자로부터 멀어지는 방향으로 **X칸**만큼 직선으로 밀어냅니다. (Enemy Side: 3.50 V)" },
    { name: "<당기기 X>", role: 'modifier', tags: ['cc'], type: 'key', calc: x => x * 4.50, desc: "대상을 공격자 쪽으로 **X칸**만큼 직선으로 끌어당깁니다. (Enemy Side: 4.50 V)" },
    { name: "<넘어짐>", role: 'standalone', tags: ['cc'], type: 'key', noX: true, calc: x => 6.00, desc: "해당 유닛의 피규어를 **물리적으로 쓰러뜨려** 눕혀둡니다. (이동 불가) (Enemy Side: 6.00 V)" },
    { name: "<도약 X>", role: 'modifier', tags: ['leap'], type: 'key', calc: x => 2.50 + (x - 1) * 1.0, desc: "이동 시 경로상의 장애물, 유닛, 표식을 모두 무시하고 X칸 이동합니다. (Enemy Side: 2.50 V)" },
    { name: "<휩쓸기 X>", role: 'modifier', tags: ['aoe'], type: 'key', calc: x => x * 2.00, desc: "자신에게 인접한 **X개의 연결된 타일**에 있는 모든 적을 동시에 공격합니다. (Enemy Side: 2.00 V)" },
    { name: "<공성 X>", role: 'modifier', tags: ['dmg'], type: 'key', calc: x => 3.00 + (x * 1.0), desc: "이 공격으로 대상이 **'뼈 벽'**에 부딪히면, 벽을 **파괴**하고 대상에게 **X의 추가 피해**를 입힙니다. (Enemy Side: 3.00 V)" },
    { name: "<반격>", role: 'standalone', tags: ['def'], type: 'key', noX: true, calc: x => 1.00, desc: "방어 행동으로 공격 피해를 **0**으로 만들었다면, 공격자에게 즉시 **X만큼의 `<관통>` 피해**를 입힙니다. (Enemy Side: 1.00 V)" },
    { name: "<조망>", role: 'modifier', tags: ['range'], type: 'key', noX: true, calc: x => 7.00, desc: "기본 사거리가 **2 이상**인 공격 및 스킬의 **사거리가 +1 증가**합니다. (시선 무시) (Enemy Side: 7.00 V)" },
    { name: "<고지대>", role: 'modifier', tags: ['util'], type: 'key', noX: true, calc: x => 1.5, desc: "뼈 타일 위에서 근접 공격 시 불리점(피해 반감)을 무시합니다." },
    { name: "<골전도>", role: 'modifier', tags: ['cc'], type: 'key', noX: true, calc: x => 5.00, desc: "타격받은 뼈 타일과 **대각선으로 연결된 인접한 모든 뼈 타일**로 진동이 퍼져, 위에 있는 유닛을 떨어뜨립니다. (Enemy Side: 5.00 V)" },
    { name: "<근밀도 X>", role: 'modifier', tags: ['move'], type: 'key', calc: x => x * 1.0, desc: "한 턴에 **'근육 타일'** 간의 이동을 연속으로 **X칸** 수행했을 때 발동합니다. (Enemy Side: 1.00 V)" },
    { name: "<원거리 X>", role: 'modifier', tags: ['range'], type: 'key', calc: x => 6.60 + (x - 1) * 0.5, desc: "이 공격은 **사거리 X**를 가집니다. (Enemy Side: 6.60 V)" },
    { name: "<결속 X>", role: 'standalone', tags: ['cc'], type: 'key', calc: x => 3.0 + (x * 0.2), desc: "대상을 **이동 불가** 상태로 만듭니다." },
    { name: "<오염 X>", role: 'standalone', tags: ['debuff'], type: 'key', calc: x => x * 5.50, desc: "대상은 즉시 오염 덱에서 **'오염 카드' X장**을 획득합니다. (Enemy Side: 5.50 V)" },
    { name: "<전염 X>", role: 'modifier', tags: ['debuff'], type: 'key', calc: x => 5.50 + x, desc: "이 공격이 1 이상의 피해를 입혔다면, 대상은 즉시 **`<오염 X>`** 효과를 받습니다. (BQM: 6.5 V Base)" },
    { name: "<자극 X>", role: 'modifier', tags: ['buff'], type: 'key', calc: x => x * 2.50, desc: "이 공격이 대상에게 1 이상의 피해를 입힌다면, 대상은 즉시 **💀 위협 토큰 X개**를 획득합니다." },
    { name: "<진정 X>", role: 'modifier', tags: ['debuff'], type: 'key', calc: x => x * 2.50, desc: "이 공격이 대상에게 1 이상의 피해를 입힌다면, 대상은 즉시 **💎 억제 토큰 X개**를 획득합니다." },

    // Enemy Only Keywords (Passives & Growths)
    { name: "<과부하 X>", role: 'standalone', isGrowth: true, maxBonus: 4.8, tags: ['pas', 'grow'], type: 'pas', calc: x => x * 4.80, desc: "대상에게 **💀 위협 토큰 X개**를 강제로 부여합니다. (BQM: 4.80 V)" },
    { name: "<격분 X>", role: 'standalone', isGrowth: true, maxBonus: 5.0, tags: ['pas', 'grow'], type: 'pas', noX: true, calc: (x) => 5.00, desc: "전장에서 아군이 사망할 때마다, 즉시 **💀** 위협 토큰 1개를 얻습니다. (Horror Factor: +5.00 V/Stack)" },
    { name: "<무리 사냥>", role: 'modifier', tags: ['pas'], type: 'pas', noX: true, calc: x => 2.40, desc: "공격 대상과 인접한 타일에 **동일한 종류의 아군**이 있다면, 공격은 **`<관통>`** 키워드를 얻습니다. (BQM: 2.40 V)" },
    { name: "<약자 도태>", role: 'modifier', tags: ['pas'], type: 'pas', noX: true, calc: x => 3.50, desc: "대상의 현재 HP가 10 이하일 경우, 공격은 **`<관통>`** 키워드를 얻습니다. (Enemy Side: 3.50 V)" },
    { name: "<유착>", role: 'standalone', tags: ['pas'], type: 'pas', noX: true, calc: x => 2.00, desc: "이 유닛과 인접한 타일에서 벗어나려면, 이동력 **1 대신 2를 소모**해야 합니다. (Enemy Side: 2.00 V)" },
    { name: "<파열 X>", role: 'standalone', tags: ['pas'], type: 'pas', calc: x => x * 3.00, desc: "이 유닛이 처치될 때, 인접한 모든 유닛에게 **X만큼의 `<관통>` 피해**를 줍니다. (BQM: 3.00 V)" },
    { name: "<위협적 존재>", role: 'standalone', isGrowth: true, maxBonus: 4.0, tags: ['pas', 'grow'], type: 'pas', noX: true, calc: x => 4.00, desc: "이 유닛은 전투 시작 시 **💀 위협 토큰 1개**를 가지고 시작합니다. (Horror Factor: +4.00 V)" },

    // New / Request Fallbacks
    { name: "<여파 X>", role: 'modifier', tags: ['aoe'], type: 'key', calc: x => x * 2.00, desc: "공격 대상과 인접한 모든 적에게 X만큼의 피해를 입힙니다. (Enemy Side: 2.00 V)" }
];

const PRIORITIES = [
    { id: 'dist', name: "최단 거리", desc: "이동 거리가 가장 짧은 대상" },
    { id: 'hp_min', name: "최소 HP", desc: "현재 체력이 가장 낮은 대상" },
    { id: 'hand_min', name: "최소 손패", desc: "손패 장수가 가장 적은 대상" },
    { id: 'threat', name: "전술적 위협", desc: "플레이어에게 가장 불리한 대상 (Tactical Alert)" },
    { id: 'dice_max_w', name: "각인 우위", desc: "각인 주사위(⬜)가 더 많은 대상" },
    { id: 'dice_max_r', name: "돌파 우위", desc: "돌파 주사위(🟥)가 더 많은 대상" },
    { id: 'faction_order', name: "기사단 혐오", desc: "기사단(The Order) 파벌 우선" },
    { id: 'faction_elder', name: "엘더 혐오", desc: "엘더스파이어(Elderspire) 파벌 우선" },
    { id: 'polluted', name: "오염도", desc: "오염 카드(버림패+손패) 최다 대상" },
    { id: 'armor_down', name: "방어구 비활성", desc: "몸통 방어구가 뒤집힌 대상" },
    { id: 'dist_max', name: "최장 거리", desc: "가장 멀리 있는 대상" },
    { id: 'hand_max', name: "최대 손패", desc: "손패가 가장 많은 대상" },
    { id: 'hp_max', name: "최대 HP", desc: "현재 체력이 가장 많은 대상" }
];

// === PRESETS (Maintained for Legacy Support) ===
const PRESETS = [
    {
        name: "퀴노돈 (Kynodon)",
        flavor: "혈림 우림에 서식하는 근접 추적자.",
        hp: 10, def: 1,
        dice: { c: 3, r: 1 },
        cuts: { c1: 3, c2: 6 },
        yellows: [],
        zones: {
            B: { load: [{ db: 'ACT', idx: 0, val: 3 }] },
            G: { load: [{ db: 'ACT', idx: 0, val: 2 }, { db: 'ACT', idx: 1, val: 3 }] },
            R: { load: [{ db: 'ACT', idx: 0, val: 2 }, { db: 'ACT', idx: 1, val: 4 }, { db: 'KEY', idx: 15, val: 1 }] },
            P: { load: [{ db: 'KEY', idx: 19, val: 1 }, { db: 'KEY', idx: 20, val: 1 }] } // Updated Indices based on new List order (Furious, Pack Tactics)
        }
    },
    {
        name: "웅굴루스 (Ungulus)",
        flavor: "개활지에 서식하는 원거리 저격수.",
        hp: 8, def: 0,
        dice: { c: 3, r: 2 },
        cuts: { c1: 3, c2: 6 },
        yellows: [],
        zones: {
            B: { load: [{ db: 'ACT', idx: 0, val: 2 }] },
            G: { load: [{ db: 'ACT', idx: 0, val: 1 }, { db: 'ACT', idx: 2, val: 3 }] },
            R: { load: [{ db: 'ACT', idx: 2, val: 4 }, { db: 'KEY', idx: 13, val: 3 }] },
            P: { load: [{ db: 'KEY', idx: 24, val: 1 }, { db: 'KEY', idx: 9, val: 1 }] }
        }
    }
];
