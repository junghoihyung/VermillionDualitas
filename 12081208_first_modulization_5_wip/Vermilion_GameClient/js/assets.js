// Vermilion_GameClient/js/assets.js
// ==================================================================================
// [MODULE 0] ASSET DATABASE (Synthesized)
// ==================================================================================
// Acts as a File System Registry for the Lobby.

const ASSETS = {
    // 1. Characters (Full Implementation of 30 Unique Cards)
    chars: [
        {
            id: "c01", name: "The Flesh Knight (시체기사)", role: "Tanker", hp: 14, def: 0,
            cards: [
                {
                    name: "Vendetta: Accumulation (앙갚음: 축적)", type: "Effect", cost: 2,
                    desc: "Deploy. Place Threat Token when hit. End Turn: Take Dmg per Token.",
                    keywords: "Deploy, Persistentn"
                },
                {
                    name: "Vendetta: Release (앙갚음: 방출)", type: "Attack", cost: 2,
                    desc: "Consume Threat Tokens. +1 Red Die per Token. Bone Resonance.",
                    keywords: "Bone Resonance"
                },
                {
                    name: "Endure (감내)", type: "Effect", cost: 2,
                    desc: "Add 1 Threat Token OR Nullify Token Dmg this round.",
                    keywords: "Nullify Pain"
                }
            ]
        },
        {
            id: "c02", name: "Albanus Pons (알바누스)", role: "Utility", hp: 11, def: 0,
            cards: [
                { name: "0-Friction Dash (무마찰 질주)", type: "Move", cost: 2, desc: "Gain Muscle Density 1.", keywords: "Muscle Density 1" },
                { name: "Infinity Strike (무한 마찰 타격)", type: "Attack", cost: 2, desc: "Flip Enemy to opposite side. Penetrate on Wall.", keywords: "Flip Enemy" },
                { name: "Momentum Reflection (운동량 반사)", type: "Defense", cost: 2, desc: "Add 1 White Die. Reflect excess Def as Penetrating Dmg.", keywords: "Reflect Dmg" }
            ]
        },
        {
            id: "c03", name: "Cleostrata (클레오스트라타)", role: "Setup", hp: 9, def: 0,
            cards: [
                { name: "Latency: Mark (표식)", type: "Effect", cost: 2, desc: "Place Die as Wall/Mark within Range 2.", keywords: "Deploy Mark" },
                { name: "Latency: Detonate (격발)", type: "Effect", cost: 2, desc: "Explode Marks. Adjacent Dmg = Die Val. Suppress.", keywords: "Detonate Marks" },
                { name: "Latency: Propulsion (추진)", type: "Move", cost: 2, desc: "If near Mark, gain Jump.", keywords: "Jump" } // Condition handled in logic
            ]
        },
        {
            id: "c04", name: "Gwendolyn (그웬돌린)", role: "Berserker", hp: 9, def: 0,
            cards: [
                { name: "Vacuum Grasp (진공의 손아귀)", type: "Attack", cost: 2, desc: "Pull 2. If Adjacent, Penetrate.", keywords: "Pull 2" },
                { name: "Impulsive Smash (충동적 맹공)", type: "Attack", cost: 2, desc: "Disable Torso. Sweep 6. Destroy Walls.", keywords: "Disable Torso, Sweep 6, Siege 99" },
                { name: "Vacuum Surge (진공 쇄도)", type: "Move", cost: 2, desc: "Straight Line. Pass Units. Re-enable Torso.", keywords: "Pass Units, Enable Torso" }
            ]
        },
        {
            id: "c05", name: "Pius Femur (피우스)", role: "Defender", hp: 10, def: 1,
            cards: [
                { name: "Umbo Aperio", type: "Defense", cost: 2, desc: "Deploy Wall. Immobilize Self. Ignore Wall LOS.", keywords: "Deploy Wall" },
                { name: "VFA: Torrent (격류)", type: "Attack", cost: 2, desc: "If Deployed: Fix Red Die to 3. If Undeploy: Attack x2.", keywords: "Combo Wall" },
                { name: "VFA: Combustion (연소)", type: "Effect", cost: 2, desc: "Pay HP, Draw Cards.", keywords: "Blood Draw" }
            ]
        },
        {
            id: "c06", name: "Turvalio (투르발리오)", role: "Controller", hp: 12, def: 0,
            cards: [
                { name: "Argos: Repulsion (척력)", type: "Attack", cost: 2, desc: "Push 2. If blocked, Penetrate.", keywords: "Push 2" },
                { name: "Argos: Attraction (인력)", type: "Defense", cost: 2, desc: "Pull 2. If blocked, Dmg = Def Sum.", keywords: "Pull 2" },
                { name: "Ironclad Instinct (철갑의 본능)", type: "Effect", cost: 2, desc: "Reaction: Discard to Condense (Search Defense).", keywords: "Reaction Search" }
            ]
        },
        {
            id: "c07", name: "Cassius (카시우스)", role: "Blaster", hp: 8, def: 0,
            cards: [
                { name: "Bombarda: Scatter (확산)", type: "Attack", cost: 2, desc: "Split Dmg among X targets (X=Dice Count). If Suppressed, Penetrate.", keywords: "Split Fire" },
                { name: "Bombarda: Homing (유도)", type: "Attack", cost: 2, desc: "Ignore LOS. If No LOS, Penetrate.", keywords: "Indirect Fire" },
                { name: "Heat Conduction (열전도)", type: "Effect", cost: 2, desc: "Deploy. When Burning, Retrieve Attack Card.", keywords: "Deploy, Recycle" }
            ]
        },
        {
            id: "c08", name: "Gaius (가이우스)", role: "Tactician", hp: 10, def: 0,
            cards: [
                { name: "Fusion (경계 융합)", type: "Effect", cost: 2, desc: "Play 2 Cards. Roll 1 Die for both.", keywords: "Double Cast" },
                { name: "Causality (예지된 인과)", type: "Effect", cost: 2, desc: "Scry Corruption. Suppress Range 3.", keywords: "Scry, Suppress 2" },
                { name: "Muramasa (발도)", type: "Attack", cost: 2, desc: "Reroll Dice. Choose parameters.", keywords: "Reroll" }
            ]
        },
        {
            id: "c09", name: "Hector (헥토르)", role: "Juggernaut", hp: 12, def: 1,
            cards: [
                { name: "Gigantes: Press (압살)", type: "Attack", cost: 2, desc: "Knockdown. If Knocked down, Penetrate.", keywords: "Knockdown" },
                { name: "Gravity Well (중력장)", type: "Effect", cost: 2, desc: "Deploy. Area Denial (Move Cost +1). Prevent Stand Up.", keywords: "Deploy Gravity" },
                { name: "Absolute Mass (절대 질량)", type: "Defense", cost: 2, desc: "Ignore all Keywords.", keywords: "Unstoppable" }
            ]
        },
        {
            id: "c10", name: "Hegio (헤기오)", role: "Madman", hp: 10, def: 0,
            cards: [
                { name: "Mandibula: Bind (결속)", type: "Attack", cost: 2, desc: "Place Black Die (5). Bind 5.", keywords: "Bind 5" },
                { name: "Telum: Execution (처형)", type: "Attack", cost: 2, desc: "Disable Torso. Sync Dice to Max. Gambit.", keywords: "Disable Torso, Sync Dice, Gambit" },
                { name: "Manic Reassembly (재조립)", type: "Effect", cost: 2, desc: "Roll Black Die. 4+ Re-enable Torso.", keywords: "Re-enable Torso" }
            ]
        }
    ],

    // 2. Equipment (Starter Set)
    equips: [
        { id: "w01", name: "Iron Sword", slot: "arm", type: "WEP", val: 1, range: 1, desc: "Basic melee weapon. (+1 Atk)" },
        { id: "w02", name: "Long Bow", slot: "arm", type: "WEP", val: 1, range: 3, desc: "Ranged weapon. (+1 Atk, Range 3)" },
        { id: "a01", name: "Leather Vest", slot: "torso", type: "ARM", val: 0, def: 1, desc: "Light armor. (+1 Def)" },
        { id: "a02", name: "Plate Mail", slot: "torso", type: "ARM", val: 0, def: 2, desc: "Heavy armor. (+2 Def)" },
        { id: "b01", name: "Scout Boots", slot: "legs", type: "BOOT", val: 0, cap: 3, desc: "Standard boots. (Cap 3)" },
        { id: "b02", name: "Greaves", slot: "legs", type: "BOOT", val: 0, cap: 2, desc: "Heavy boots. (Cap 2)" },
        { id: "t01", name: "Ruby Ring", slot: "acc", type: "ACC", val: 0, desc: "Basic trinket." }
    ],

    // 3. Maps (Training Hall)
    maps: [
        {
            id: "m01", name: "Training Hall",
            dimensions: { w: 6, h: 6 },
            map: {
                "0,0": 1, "1,0": 2, "2,0": 1, "3,0": 3, "4,0": 1, "5,0": 1,
                "0,1": 2, "1,1": 1, "2,1": 1, "3,1": 2, "4,1": 1, "5,1": 2,
                "0,2": 1, "1,2": 1, "2,2": 1, "3,2": 1, "4,2": 1, "5,2": 1,
                "0,3": 3, "1,3": 2, "2,3": 1, "3,3": 2, "4,3": 1, "5,3": 3,
                "0,4": 1, "1,4": 1, "2,4": 1, "3,4": 1, "4,4": 1, "5,4": 1,
                "0,5": 1, "1,5": 2, "2,5": 1, "3,5": 3, "4,5": 1, "5,5": 1
            },
            entities: {
                "0,0": { type: "marker", val: "P1" },
                "4,2": { type: "enemy", name: "Training Dummy", hp: 10, val: "E1" }
            }
        }
    ]
};
