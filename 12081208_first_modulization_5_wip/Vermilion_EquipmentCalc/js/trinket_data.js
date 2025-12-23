// Vermilion_EquipmentCalc/js/trinket_data.js
// === BQM v5.5 Trinket Data (TVE Ready - Custom 1209) ===

const TRINKET_EFFECTS = [
    // type: 'immediate' (1.0), 'meta' (1.2), 'conditional' (0.8)
    // synergy: true if stacking provides geometric benefit

    // 2. Advanced Control (New Keywords 1209)
    {
        name: "<치환> (Substitute)",
        val: 0, // Dynamic
        type: 'substitute',
        synergy: true,
        isSubstitute: true, // UI Flag
        desc: "<치환 A→B> (Substitute A→B): 주사위를 굴려 눈금 ‘A’가 나왔을 때, 이를 물리적 눈금과 무관하게 ‘B’로 간주하여 적용합니다."
    },
    {
        name: "<변조> (Modulate)",
        val: 0, // Dynamic
        type: 'modulate',
        synergy: true,
        isModulate: true, // UI Flag
        desc: "<변조> (Modulate): 굴린 주사위 1개를 물리적으로 반대편 눈금으로 뒤집어 적용합니다."
    },

    // 3. New Advanced Effects (User Request 1209)
    {
        name: "🎲 리롤 (Reroll)",
        val: 0, // Dynamic (0.5 or 3.2)
        type: 'immediate',
        synergy: true,
        isReroll: true,
        desc: "굴린 주사위 1개를 다시 굴립니다. 무조건 다시 굴린 값을 사용해야 합니다. (각인/돌파 주사위 종류에 따라 가치가 달라집니다.)"
    },
    {
        name: "🔄 반전 (Inversion)",
        val: 3.5, // Fixed Avg
        type: 'immediate',
        synergy: false,
        isInversion: true,
        desc: "<반전> (Inversion): 대상이 가진 모든 토큰을 뒤집습니다. (위협 ↔ 억제)"
    },
    {
        name: "✋ 손패 증가 (Hand Size)",
        val: 0, // Dynamic (Diminishing)
        type: 'meta',
        synergy: true,
        isHand: true,
        desc: "손패의 최대 장수를 증가시킵니다. (기본 5장, 한계 효용 체감 적용)"
    },
    {
        name: "🔥 촉매 (Catalyst)",
        val: 0, // Dynamic (2.0 or 1.6)
        type: 'passive',
        synergy: true,
        isCatalyst: true,
        desc: "<촉매:🔥연소/💧응축> (Catalyst): 당신이 🔥연소/💧응축을 수행할때 비용(카드 1장 제거/주사위 1개 제거)을 지불하지 않아도 됩니다."
    },
    {
        name: "🔄 순환 (Cycle)",
        val: 0, // Dynamic
        type: 'immediate',
        synergy: true,
        isCycle: true,
        desc: "<순환 X> (Cycle X): 사용 즉시 남은 손패 X장을 택하여 버리고, 버린 만큼 덱에서 뽑습니다."
    },
    {
        name: "⚡ 선제권 (Initiative)",
        val: 6.0, // Fixed High Value
        type: 'meta',
        synergy: false,
        isInitiative: true,
        desc: "적보다 먼저 행동할 수 있는 권한을 얻습니다. (적의 선제 공격 무효화 및 1턴 추가 효과)"
    },
    {
        name: "👁️ 오염 예지 (Scry Corruption)",
        val: 0, // Dynamic (Log)
        type: 'meta',
        synergy: false,
        isScryCorrupt: true,
        desc: "오염 카드 위에서부터 X장을 미리 보고 순서를 변경합니다."
    },
    {
        name: "🃏 덱 예지 (Scry Deck)",
        val: 0, // Dynamic (Linear)
        type: 'meta',
        synergy: true,
        isScryDeck: true,
        desc: "자신의 행동 카드 위에서부터 X장을 미리 보고 순서를 변경합니다."
    }
];

// Recharge Types (Generic with Scaling Logic)
const RECHARGE_TYPES = [
    {
        name: "<고비 X> (Crisis)",
        id: 'crisis',
        desc: "<고비 X> (Crisis X): 자신의 턴 시작 시, 현재 체력(HP)이 X 이하라면 발동합니다.",
        defaultX: 3,
        calc: (x) => {
            // HP Scale: Low X = High Risk.
            return { d: 12.0 / Math.max(0.1, x), cost: Math.max(0, 3.5 - (0.5 * x)) };
        }
    },
    {
        name: "<과보호 X> (Overguard)",
        id: 'overguard',
        desc: "<과보호 X> (Over-guard X): 방어 리액션을 수행하여, 최종 방어력이 적의 피해량을 X 이상 초과하여 방어했을 때 발동합니다. (최종 방어력 - 받는 피해량 ≥ X)",
        defaultX: 2,
        calc: (x) => {
            return { d: 2.5 * x, cost: 0.5 * x };
        }
    },
    {
        name: "<정밀 타격> (Precision)",
        id: 'precision',
        desc: "<정밀 타격> (Precision Strike): 적에게 피해를 입혀, 적의 남은 체력을 정확히 0으로 만들어 처치했을 때 발동합니다. (초과 피해 발생 시 미발동)",
        defaultX: 0,
        isBinary: true,
        calc: (x) => { return { d: 10.0, cost: 0.5 }; }
    },
    {
        name: "<자원 비축> (Stockpile)",
        id: 'stockpile',
        desc: "<자원 비축: 연소 / 응축> (Resource Stockpile): 행동 카드를 연소하여 얻은 주사위, 또는 주사위를 응축하여 얻은 카드를 이번 턴에 하나도 사용하지 않고 남겼을 때 발동합니다.",
        defaultX: 1,
        isBinary: true,
        calc: (x) => { return { d: 6.0, cost: 2.5 }; }
    },
    {
        name: "<번아웃> (Burnout)",
        id: 'burnout',
        desc: "<번아웃> (Burnout): 자신의 턴 종료 시, 손패에 남은 카드가 0장이라면 발동합니다.",
        defaultX: 0,
        isBinary: true,
        calc: (x) => { return { d: 8.0, cost: 1.5 }; } // Estimated: D=8 (Hard to control), Cost=1.5 (Risk)
    },
    {
        name: "<포위 X> (Encircled)",
        id: 'encircled',
        desc: "<포위 X> (Encircled X): 자신의 턴 종료 시, 자신과 인접한 적 유닛의 수가 정확히 X기라면 발동합니다.",
        defaultX: 1,
        calc: (x) => { return { d: 3.0 * x, cost: 1.5 * x }; }
    }
];

const DICE_PROBS = {
    'red': { 0: 2 / 6, 1: 1 / 6, 2: 0, 3: 3 / 6 }, // 0(33%), 1(17%), 3(50%)
    'white': { 1: 3 / 6, 2: 2 / 6, 3: 1 / 6 } // 1(50%), 2(33%), 3(17%)
};

const TRINKET_TIERS = [
    { label: "T6 폐급 (F)", min: -Infinity, color: "#52525b" },
    { label: "T5 일반 (Common)", min: 5.0, color: "#4d7c0f" },
    { label: "T4 고급 (Uncommon)", min: 10.0, color: "#a16207" },
    { label: "T3 희귀 (Rare)", min: 18.0, color: "#b45309" },
    { label: "T2 전설 (Legendary)", min: 28.0, color: "#c2410c" },
    { label: "T1 신화 (God)", min: 40.0, color: "#b91c1c" }
];
