// data.js - Global Data
// Attached to window to avoid ES6 Module CORS issues on local file system

window.GAME_DATA = {};

window.GAME_DATA.CHARACTERS = [
    {
        id: "c_fleshknight",
        name: "Flesh Knight",
        class: "Tank / Berzerker",
        hp: 12,
        desc: "Gains power from pain. Converts HP to Attack.",
        cards: [
            { id: "fk_1", name: "Flesh Strike", type: "Attack", cost: 1, range: 1, damage: 3 },
            { id: "fk_2", name: "Bone Armor", type: "Defense", cost: 1, shield: 3 },
            { id: "fk_unique", name: "Sanguine Surge", type: "Unique", cost: 2, effect: "Pay 2 HP, Deal 5 DMG" }
        ]
    },
    {
        id: "c_albanus",
        name: "Albanus Pons",
        class: "Support / Tactician",
        hp: 10,
        desc: "Master of positioning and buffs.",
        cards: [
            { id: "ap_1", name: "Command", type: "Support", cost: 1, effect: "Ally gains +1 Action" },
            { id: "ap_2", name: "Shield Wall", type: "Defense", cost: 1, shield: 2, range: 2 },
            { id: "ap_unique", name: "Grand Strategy", type: "Unique", cost: 3, effect: "All Allies Draw 1 Card" }
        ]
    },
    {
        id: "c_cleostrata",
        name: "Cleostrata",
        class: "Ranger / Sniper",
        hp: 8,
        desc: "Deadly from a distance.",
        cards: [
            { id: "cs_1", name: "Snipe", type: "Attack", cost: 2, range: 4, damage: 4 },
            { id: "cs_2", name: "Camouflage", type: "Defense", cost: 1, effect: "Cannot be targeted" },
            { id: "cs_unique", name: "Headshot", type: "Unique", cost: 3, range: 5, damage: 10 }
        ]
    },
    {
        id: "c_gwendolyn",
        name: "Gwendolyn",
        class: "Mage / AoE",
        hp: 9,
        desc: "Harnesses the wind to strike multiple foes.",
        cards: [
            { id: "gw_1", name: "Gust", type: "Attack", cost: 1, range: 2, damage: 2, effect: "Push 1" },
            { id: "gw_2", name: "Wind Walk", type: "Move", cost: 1, move: 4 },
            { id: "gw_unique", name: "Tornado", type: "Unique", cost: 3, range: 3, damage: 3, area: true }
        ]
    },
    {
        id: "c_pius",
        name: "Pius Femur",
        class: "Paladin / Healer",
        hp: 11,
        desc: "Protector of the weak.",
        cards: [
            { id: "pf_1", name: "Smite", type: "Attack", cost: 1, range: 1, damage: 3 },
            { id: "pf_2", name: "Heal", type: "Support", cost: 1, range: 2, heal: 3 },
            { id: "pf_unique", name: "Divine Intervention", type: "Unique", cost: 4, effect: "Revive Ally with 1 HP" }
        ]
    },
    {
        id: "c_turbalio",
        name: "Turbalio",
        class: "Rogue / Assassin",
        hp: 9,
        desc: "Strike from the shadows.",
        cards: [
            { id: "tb_1", name: "Backstab", type: "Attack", cost: 1, range: 1, damage: 5, cond: "Flanking" },
            { id: "tb_2", name: "Dash", type: "Move", cost: 0, move: 2 },
            { id: "tb_unique", name: "Assassinate", type: "Unique", cost: 3, range: 1, damage: 99, cond: "HP < 5" }
        ]
    },
    {
        id: "c_cassius",
        name: "Cassius",
        class: "Warrior / Charger",
        hp: 12,
        desc: "Unstoppable force.",
        cards: [
            { id: "ca_1", name: "Charge", type: "Attack", cost: 2, move: 3, damage: 3 },
            { id: "ca_2", name: "Block", type: "Defense", cost: 1, shield: 4 },
            { id: "ca_unique", name: "Trample", type: "Unique", cost: 3, move: 5, damage: 5 }
        ]
    },
    {
        id: "c_gaius",
        name: "Gaius",
        class: "Summoner",
        hp: 8,
        desc: "Controls the battlefield with minions.",
        cards: [
            { id: "ga_1", name: "Summon Skeleton", type: "Support", cost: 2, effect: "Spawn 1/1 Skeleton" },
            { id: "ga_2", name: "Bone Wall", type: "Support", cost: 1, effect: "Create Wall" },
            { id: "ga_unique", name: "Army of the Dead", type: "Unique", cost: 5, effect: "Fill empty tiles with Skeletons" }
        ]
    },
    {
        id: "c_hector",
        name: "Hector",
        class: "Brawler",
        hp: 14,
        desc: "Pure physical power.",
        cards: [
            { id: "hc_1", name: "Punch", type: "Attack", cost: 1, range: 1, damage: 4 },
            { id: "hc_2", name: "Grapple", type: "Control", cost: 1, range: 1, effect: "Pull 1" },
            { id: "hc_unique", name: "Earthquake", type: "Unique", cost: 3, range: 0, damage: 3, area: true }
        ]
    },
    {
        id: "c_hegio",
        name: "Hegio",
        class: "Alchemist",
        hp: 9,
        desc: "Uses potions for various effects.",
        cards: [
            { id: "hg_1", name: "Acid Flask", type: "Attack", cost: 1, range: 3, damage: 2, effect: "Corrode" },
            { id: "hg_2", name: "Healing Potion", type: "Support", cost: 1, heal: 4 },
            { id: "hg_unique", name: "Transmute", type: "Unique", cost: 2, effect: "Key -> Gold" }
        ]
    }
];

window.GAME_DATA.ENEMIES = [
    {
        id: "e_kynodon",
        name: "Kynodon",
        hp: 10,
        def: 1,
        dicePool: ["white", "white", "red"],
        actions: {
            blue: { min: 0, max: 5, action: "Move", icon: "🦵" },
            green: { min: 6, max: 10, action: "Attack", icon: "⚔️" },
            red: { min: 11, max: 99, action: "Critical!", icon: "💥" }
        }
    },
    {
        id: "e_ungulus",
        name: "Ungulus",
        hp: 8,
        def: 0,
        dicePool: ["white", "red", "red"],
        actions: {
            blue: { min: 0, max: 4, action: "Hide", icon: "🙈" },
            green: { min: 5, max: 8, action: "Ambush", icon: "🗡️" },
            red: { min: 9, max: 99, action: "Execute", icon: "💀" }
        }
    }
];

window.GAME_DATA.EQUIPMENT_LOADOUTS = [
    {
        name: "Standard Knight Set",
        slots: {
            head: "Iron Helm (+1 DEF)",
            arm: "Longsword (3 DMG)",
            torso: "Chainmail (+2 HP)",
            legs: "Leather Boots (Move+1)"
        }
    },
    {
        name: "Mage Robes Set",
        slots: {
            head: "Wizard Hat (+1 MP)",
            arm: "Wooden Staff (2 DMG, Range+1)",
            torso: "Silk Robe (+1 Dodge)",
            legs: "Sandals (Move+1)"
        }
    },
    {
        name: "Assassin Gear",
        slots: {
            head: "Hood",
            arm: "Daggers (Dual Wield)",
            torso: "Leather Armor",
            legs: "Silent Shoes"
        }
    }
];
