// Vermilion_CharDB/js/data.js
// === 1. AI-Enhanced Data (Pre-loaded) ===
// BQM v5.0 및 규칙서 v25.0 기반 AI 메타데이터 탑재
let CHAR_DB = [
    {
        id: "c01", name: "시체기사", role: "Tanker", hp: 14, def: 0,
        growth: { stat_hp: 1.5, stat_def: 1.2, dice_red: 1.0 }, // 성장 우선순위
        rp: { ignore_pain: true }, // 루도내러티브 설정
        cards: [
            {
                name: "앙갚음: 축적", type: "효과", cost: 2,
                desc: "피격 시 위협 토큰 저장. 턴 종료 시 자해 피해.",
                ai_data: {
                    val_formula: "(tokens < 3) ? 5.0 : -2.0", // 토큰 3개 미만일 때 설치 가치 높음
                    tags: { aggro: 0.8, safety: 0.2 },
                    combo: { type: "setup", res: "token" }
                }
            },
            {
                name: "앙갚음: 방출", type: "공격", cost: 2,
                desc: "저장된 토큰을 소모하여 돌파 주사위 추가.",
                ai_data: {
                    val_formula: "dice_sum + (tokens * 1.67)", // 토큰당 돌파주사위 기댓값
                    tags: { aggro: 1.0, safety: 0.0, finisher: true },
                    req: { token: 1 }
                }
            },
            {
                name: "감내", type: "효과", cost: 2,
                desc: "토큰 생성 또는 지속 피해 무효화.",
                ai_data: {
                    val_formula: "self_dmg_pending > 0 ? self_dmg_pending * 3.5 : 1.5", // 자해 데미지 막을 때 가치 급상승
                    tags: { aggro: 0.5, safety: 0.9 }
                }
            }
        ]
    },
    {
        id: "c02", name: "알바누스 폰즈", role: "Utility", hp: 11, def: 0,
        growth: { stat_def: 1.5, dice_white: 1.5 },
        cards: [
            { name: "무마찰 질주", type: "이동", cost: 2, desc: "근밀도 1 키워드 획득.", ai_data: { val_formula: "move * 1.2", tags: { mobile: 1.0 } } },
            { name: "무한 마찰 타격", type: "공격", cost: 2, desc: "강제 이동 및 관통.", ai_data: { val_formula: "dmg + 2.5", tags: { control: 0.8 }, combo: { type: "push" } } },
            { name: "운동량 반사", type: "방어", cost: 2, desc: "방어력 반사.", ai_data: { val_formula: "(def_roll * 1.2) + (reflected_dmg * 1.0)", tags: { safety: 0.8, counter: true } } }
        ]
    },
    {
        id: "c03", name: "클레오스트라타", role: "Setup", hp: 9, def: 0,
        growth: { dice_white: 1.2, dice_red: 1.2 },
        cards: [
            { name: "레이턴시: 표식", type: "효과", cost: 2, desc: "표식 주사위 설치.", ai_data: { val_formula: "4.0", tags: { setup: 1.0 }, combo: { type: "wall" } } },
            { name: "레이턴시: 격발", type: "효과", cost: 2, desc: "표식 폭발.", ai_data: { val_formula: "mark_count * 5.0", tags: { aggro: 0.9, finisher: true } } },
            { name: "레이턴시: 추진", type: "이동", cost: 2, desc: "도약.", ai_data: { val_formula: "move * 1.5", tags: { mobile: 0.9 } } }
        ]
    },
    {
        id: "c04", name: "그웬돌린 벤투스", role: "Berserker", hp: 9, def: 0,
        growth: { stat_atk: 1.5, dice_red: 1.5 },
        rp: { no_retreat: true },
        cards: [
            { name: "진공의 손아귀", type: "공격", cost: 2, desc: "당기기.", ai_data: { val_formula: "dmg + 1.2", tags: { control: 0.7 }, combo: { type: "pull" } } },
            { name: "충동적 맹공", type: "공격", cost: 2, desc: "방어구 해제 후 휩쓸기.", ai_data: { val_formula: "(dmg * targets) - 4.0", tags: { aggro: 1.0, safety: -0.5, gambit: 1.0 } } },
            { name: "진공 쇄도", type: "이동", cost: 2, desc: "방어구 재활성화.", ai_data: { val_formula: "move + 4.0", tags: { safety: 0.8 } } }
        ]
    },
    {
        id: "c05", name: "피우스 페무르", role: "Defender", hp: 10, def: 1,
        growth: { stat_def: 2.0, stat_hp: 1.5 },
        cards: [
            { name: "움보 아페리오", type: "방어", cost: 2, desc: "벽 설치.", ai_data: { val_formula: "6.0", tags: { safety: 1.0, setup: 0.8 } } },
            { name: "심맥류전술: 격류", type: "공격", cost: 2, desc: "2회 공격.", ai_data: { val_formula: "dmg * 2", tags: { aggro: 0.7 } } },
            { name: "심맥류전술: 연소", type: "효과", cost: 2, desc: "HP 소모 드로우.", ai_data: { val_formula: "(cards * 2.5) - (hp_cost * 3.5)", tags: { efficiency: 1.0 } } }
        ]
    },
    {
        id: "c06", name: "투르발리오", role: "Controller", hp: 12, def: 0,
        growth: { stat_atk: 1.2, stat_def: 1.2 },
        cards: [
            { name: "아르고스: 척력", type: "공격", cost: 2, desc: "밀치기.", ai_data: { val_formula: "dmg + 2.4", tags: { control: 1.0 }, combo: { type: "push" } } },
            { name: "아르고스: 인력", type: "방어", cost: 2, desc: "당기기.", ai_data: { val_formula: "def + 2.4", tags: { control: 1.0 }, combo: { type: "pull" } } },
            { name: "철갑의 본능", type: "효과", cost: 2, desc: "피격 시 방어.", ai_data: { val_formula: "def_card_val + 2.0", tags: { safety: 1.0, efficiency: 1.0 } } }
        ]
    },
    {
        id: "c07", name: "카시우스", role: "Blaster", hp: 8, def: 0,
        growth: { stat_atk: 1.5, dice_red: 1.2 },
        cards: [
            { name: "봄바르다: 확산", type: "공격", cost: 2, desc: "다중 타겟.", ai_data: { val_formula: "dmg * targets", tags: { aggro: 0.9, aoe: true } } },
            { name: "봄바르다: 유도", type: "공격", cost: 2, desc: "시선 무시.", ai_data: { val_formula: "dmg + 2.0", tags: { aggro: 0.8, snipe: true } } },
            { name: "열전도", type: "효과", cost: 2, desc: "카드 회수.", ai_data: { val_formula: "2.5", tags: { efficiency: 0.8 } } }
        ]
    },
    {
        id: "c08", name: "가이우스", role: "Tactician", hp: 10, def: 0,
        growth: { dice_white: 1.5, stat_move: 1.2 },
        cards: [
            { name: "경계 융합", type: "효과", cost: 2, desc: "카드 2장 동시 사용.", ai_data: { val_formula: "(action1 + action2) * 1.0", tags: { efficiency: 1.0, burst: true } } },
            { name: "예지된 인과", type: "효과", cost: 2, desc: "오염 덱 확인.", ai_data: { val_formula: "3.0 + (threat_prevented * 2.0)", tags: { safety: 0.8, support: true } } },
            { name: "무라마사: 발도", type: "공격", cost: 2, desc: "재굴림.", ai_data: { val_formula: "dmg * 1.3", tags: { aggro: 0.8, efficiency: 0.9 } } }
        ]
    },
    {
        id: "c09", name: "헥토르", role: "Juggernaut", hp: 12, def: 1,
        growth: { stat_atk: 1.5, stat_hp: 1.2 },
        cards: [
            { name: "기간테스: 압살", type: "공격", cost: 2, desc: "넘어짐 부여.", ai_data: { val_formula: "dmg + 4.0", tags: { control: 0.9, aggro: 0.8 }, combo: { type: "knockdown" } } },
            { name: "기간테스: 중력장", type: "효과", cost: 2, desc: "이동 방해.", ai_data: { val_formula: "3.0", tags: { control: 1.0, area_denial: true } } },
            { name: "절대 질량", type: "방어", cost: 2, desc: "관통 무시 방어.", ai_data: { val_formula: "def_roll * 1.5", tags: { safety: 1.0, anti_pierce: true } } }
        ]
    },
    {
        id: "c10", name: "헤기오", role: "Madman", hp: 10, def: 0,
        growth: { dice_corr: 1.5, dice_red: 1.2 },
        cards: [
            { name: "만디불라: 결속", type: "공격", cost: 2, desc: "결속 5.", ai_data: { val_formula: "5.0", tags: { control: 1.0 } } },
            { name: "텔룸: 처형", type: "공격", cost: 2, desc: "주사위 동기화.", ai_data: { val_formula: "max_die * dice_count", tags: { aggro: 1.0, gambit: 1.0 } } },
            { name: "광기의 재조립", type: "효과", cost: 2, desc: "방어구 수리.", ai_data: { val_formula: "4.0", tags: { safety: 0.7, gamble: true } } }
        ]
    }
];
