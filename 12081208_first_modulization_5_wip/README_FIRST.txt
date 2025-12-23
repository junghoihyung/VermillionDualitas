
# 작업 지시서: BQM 엔진 마이그레이션 (v5.5 to 4Beat v1.2)

## 1\. 개요 (Overview)

본 작업은 기존 `Vermilion_EquipmentCalc`와 `Vermilion_EnemyCalc`의 레거시 로직(몬테카를로 시뮬레이션, 단순 평균)을 제거하고, **BQM 4-Beat v1.2 (벡터 합산 및 동적 임계값)** 알고리즘으로 대체하는 것을 목표로 한다.
**주의:** HTML 구조, CSS 스타일, 파일 입출력(I/O), 드래그 앤 드롭 UI 로직은 **100% 유지**해야 한다. 오직 계산 로직(`sim.js`, `calc.js`)과 데이터 정의(`data.js`)만 수정한다.

-----

## 2\. 공통 변경 원칙 (General Principles)

1.  **Simulation Loop 삭제:** `for (i=0; i<3000; i++)`와 같은 확률 시뮬레이션 루프를 전면 제거한다.
2.  **Vectorization (벡터화):** 모든 수치는 단일 값(Scala)이 아닌 `{ min, std, max, stb }` 객체로 처리한다.
3.  **Deterministic (결정론적):** 주사위 굴림 함수(`roll`) 대신, 확률 상수 테이블(LUT)을 참조하여 결과를 즉시 산출한다.

-----

## 3\. 모듈별 상세 지시사항

### Vermilion\_EquipmentCalc (장비 등급 계산기)

#### 3.1. `js/data.js` (데이터 구조 재정의)

기존의 `calc` 함수와 `THRESHOLDS` 정의를 4Beat v1.2 사양에 맞춰 변경하라.

  * **`EFFECTS` / `SPECIAL_EFFECTS`**: 리턴 값을 4박자 벡터로 변경.
    ```javascript
    // 변경 전
    calc: (x) => x * 1.0

    // 변경 후 (예시: 공격력)
    // std, max는 정직하게 오르지만, min은 보장됨. stb는 기본 1.0
    calc: (x) => ({ min: x, std: x, max: x, stb: 1.0 })

    // 변경 후 (예시: 도박)
    // min은 마이너스, max는 2배, stb는 낮음
    calc: (x) => ({ min: -5.0, std: 1.0, max: 10.0, stb: 0.3 })
    ```
  * **`THRESHOLDS`**: `check`(시뮬레이션 검증 함수)를 삭제하고, \*\*조합별 확률 테이블(LUT)\*\*을 추가.
    ```javascript
    // 4Beat v1.2 $S_opt 동기화를 위한 확률 테이블
    { 
        name: "[No 0]", 
        probTable: { 
            'SMD': 0.85,  // 표준
            '3W': 1.0,    // 각인 3개 (안정)
            '3R': 0.296   // 돌파 3개 (위험)
        } 
    }
    ```

#### 3.2. `js/sim.js` (핵심 엔진 교체)

기존 `runSimulation` 함수를 삭제하고, 다음 단계의 알고리즘을 구현하라.

1.  **상수 정의:**
      * **Role Weights:** 무기, 방어구 등 슬롯별 가중치($W_{min}, W_{std}, W_{max}$) 정의.
      * **Tier Spec:** T6\~T1 적의 HP/DEF 표준 스펙 정의 (동적 임계값용).
2.  **`calc()` 함수 재작성:**
      * **Input:** 현재 장착된 `Base Items`와 `Logic Rows`.
      * **Process ($S_{opt}$ Logic):**
          * 가능한 주사위 조합(예: `3W`, `2W1R`...)을 순회.
          * 각 조합별로 \*\*Max(출력)\*\*와 \*\*Stb(확률 - probTable 참조)\*\*를 동기화하여 계산.
          * 가장 점수가 높은 조합을 선택.
      * **Process (Dynamic Threshold):**
          * UI에 \*\*Target Tier 슬라이더(T6\~T1)\*\*가 있다고 가정(없으면 기본 T4).
          * `Max` 데미지가 해당 티어의 원샷 기준(`Threshold`)을 넘으면 보너스 부여.
      * **Output:** 최종 점수 계산 후 UI(`resScore` 등) 업데이트.

#### 3.3. `index.html` (UI 소폭 수정)

  * **Target Tier 슬라이더 추가:** 사용자가 목표 적 등급을 설정할 수 있도록 `<select id="targetTier">` 또는 슬라이더를 사이드바에 추가. (기존 UI 흐름을 해치지 않는 위치에 삽입)

-----

### Vermilion\_EnemyCalc (적 위협도 계산기)

#### 3.4. `js/data.js` (값 튜닝)

  * **키워드 가치 업데이트:** 문서의 '통합 키워드 가치 사전'을 참조하여 수치 조정 (예: `<넘어짐>` 4.0V → 5.0V).
  * **성장형 키워드 태그:** `<격분>`, `<위협적 존재>` 등에 `grow` 태그를 추가하여 엔진이 식별할 수 있게 함.

#### 3.5. `js/calc.js` (로직 개선)

기존의 단순 합산 로직을 **압축률 및 공포 계수** 로직으로 변경하라.

1.  **행동 압축률 (Action Compression):**
      * 각 Zone(파랑/초록/빨강) 내에 포함된 행동 유형(이동, 공격, 방어)의 가짓수를 카운트.
      * 2가지 혼합 시 $\times 1.2$, 3가지 혼합 시 $\times 1.5$ 승수 적용.
2.  **공포 계수 (Horror Factor):**
      * 적의 `Max` 데미지(빨강 구간 + 성장형 키워드 보정치)와 `Min` 데미지(파랑 구간)의 격차(Gap)를 계산.
      * 격차가 클수록 변동성 보너스를 추가하여 ETV를 상향 조정.

-----

## 4\. 구현 시 주의사항 (Critical Checkpoints)

1.  **확률 동기화 ($S_{opt}$ Sync):** 장비 계산 시, 데미지는 `All Red` 기준으로 계산하고 확률은 `SMD` 기준으로 계산하는 **체리피킹 오류**를 절대 범하지 말 것. 반드시 주사위 조합에 맞는 확률을 `probTable`에서 가져와야 한다.
2.  **UI 호환성:** 기존 `createDroppedItem`, `handleDrop` 함수는 그대로 사용하여, 사용자가 드래그 앤 드롭으로 아이템을 구성하는 UX를 유지할 것.
3.  **결과 표시:** 결과창의 `MAX` 값은 $S_{opt}$ 로직에 의해 선택된 \*\*'최적 주사위 조합에서의 고점'\*\*을 표시해야 한다.

-----

## 5\. 참고용 상수 테이블 (Reference Constants)

코딩 시 다음 상수값을 하드코딩하여 사용하라.

**[역할별 가중치 (Role Weights)]**

```javascript
const SLOT_WEIGHTS = {
    'WEP': { min: 0.8, std: 1.5, max: 1.2 }, // 무기: 평균과 고점 중시
    'ARM': { min: 2.0, std: 1.2, max: 0.2 }, // 방어구: 저점(생존) 중시
    'BOOT': { min: 2.0, std: 1.2, max: 0.5 }, // 신발: 이동 실패는 치명적
    'ACC': { min: 0.5, std: 1.2, max: 1.5 }  // 장신구: 변수 창출 중시
};
```

**[동적 임계값 (Dynamic Thresholds)]**

```javascript
const TIER_THRESHOLDS = {
    'T6': 12.1, // 잡몹
    'T5': 17.6, // 정예
    'T4': 26.4, // 중보스
    'T3': 35.2, // 위협
    'T2': 999,  // 원샷 불가
    'T1': 999   // 신
};
```

코딩 AI에게 전달할 **[버밀리온 퀘스트 분석기: BQM 4-Beat v1.3 엔진 마이그레이션 및 데이터 무결성 지침서]**입니다.

이 보고서는 귀하의 요구사항인 **"컨펜디움 데이터의 완벽한 이식"**, **"대상별 키워드 분리 적용"**, **"원본 텍스트 유지"**, 그리고 **"BQM 1.3 알고리즘의 완전한 구현"**을 강제하는 데 목적이 있습니다.

---

# 기술 작업 지시서: BQM 4-Beat v1.2 엔진 마이그레이션

**수신:** 개발 담당 AI
**발신:** BQM 아키텍트
**주제:** 적/장비 계산기 엔진 교체 (BQM v5.5 $\to$ BQM 4-Beat v1.2) 및 데이터 표준화
**긴급도:** Critical

---

## 1. 개요 (Executive Summary)
본 작업은 `Vermilion_EquipmentCalc`와 `Vermilion_EnemyCalc`의 구형 연산 로직(몬테카를로 시뮬레이션, 단순 평균)을 폐기하고, **BQM 4-Beat Model v1.2**의 **결정론적 벡터 연산(Vector Arithmetic)**으로 대체하는 마이그레이션 프로젝트다.
특히 `BQM_4Beat_컨펜디움_v1.txt`에 명시된 모든 정량적 가치와 텍스트를 손실 없이 이식하여, 시뮬레이터의 신뢰성을 확보해야 한다.

---

## 2. 데이터 무결성 및 분류 지침 (Data Integrity)

### 2.1. 키워드 데이터베이스 분리 및 적재
`BQM_4Beat_컨펜디움_v1.txt`의 데이터를 계산기 목적에 맞게 엄격히 분리하여 `js/data.js`에 하드코딩하라.

* **장비 등급 계산기 (`Vermilion_EquipmentCalc`)**
    * **로드 대상:**
        1.  **공용 키워드 (Shared):** '플레이어 기준(Player Side)' 가치 적용.
        2.  **플레이어 전용 키워드 (Player-Only):** 전량 로드.
    * **제외 대상:** 적 전용 키워드, 공용 키워드의 '적 기준' 가치.

* **적 위협도 계산기 (`Vermilion_EnemyCalc`)**
    * **로드 대상:**
        1.  **공용 키워드 (Shared):** '적 기준(Enemy Side)' 가치 적용.
        2.  **적 전용 키워드 (Enemy-Only):** 전량 로드.
    * **제외 대상:** 플레이어 전용 키워드, 공용 키워드의 '플레이어 기준' 가치.

### 2.2. UI/UX: 툴팁 원문 유지 (Full-Text Tooltip)
사용자에게 노출되는 정보는 요약본이 아닌 **'규칙서/컨펜디움 원문'**이어야 한다.
* **지시 사항:** `data.js` 내 `desc` 속성에는 `컨펜디움_v25.txt` 또는 `BQM_4Beat_컨펜디움_v1.txt`에 기재된 **설명 텍스트 전체**를 토씨 하나 틀리지 않고 삽입하라.
* **구현:** 마우스 호버 시 CSS `white-space: pre-wrap` 속성을 활용하여 줄바꿈까지 포함된 전체 텍스트를 렌더링할 것.

---

## 3. 알고리즘 구현 검증 체크리스트 (Implementation Verification)

코딩 AI는 코드를 작성할 때, 아래 체크리스트의 공식이 지정된 파일 및 함수 내에 정확히 구현되었는지 확인해야 한다.

### A. 장비 등급 계산기 (`Vermilion_EquipmentCalc`)

| 항목 | BQM 4-Beat v1.2 공식 / 로직 | 구현 위치 | 검증 |
| :--- | :--- | :--- | :--- |
| **4박자 벡터** | 모든 효과는 스칼라 값이 아닌 `{min, std, max, stb}` 객체로 반환되어야 함. | `js/data.js` > `EFFECTS` | □ |
| **SMD 모델** | 기본 확률($Stb$)은 **SMD(표준 믹스 주사위)** 기준 상수를 사용함. | `js/data.js` > `THRESHOLDS` | □ |
| **최적 적합성** | **$S_{opt}$**: 가능한 주사위 조합(`3W`, `2W1R` 등)을 순회하며 Max가 가장 높은 조합을 찾음. | `js/sim.js` > `calc()` | □ |
| **확률 동기화** | **Probability Sync**: $S_{opt}$ 계산 시, 선택된 주사위 조합에 맞는 확률을 `probTable`에서 가져와야 함. (SMD 확률 사용 금지) | `js/data.js` > `probTable` | □ |
| **역할 가중치** | **Role Weights**: 슬롯별(무기/방어구 등)로 $W_{min}, W_{std}, W_{max}$ 가중치를 다르게 적용. | `js/sim.js` > `WEIGHTS` | □ |
| **동적 임계값** | **One-Shot Threshold**: 타겟 적 티어(T6~T1)에 따라 `12.1` ~ `35.2` V의 유동적 기준을 적용하여 보너스 지급. | `js/sim.js` > `getThreshold()` | □ |
| **장신구 평가** | **Cycle Theory**: 장신구는 8턴 사이클 기준 기대 충전 횟수($N_{eff}$)를 산출하여 가치 평가. | `js/trinket_calc.js` | □ |

### B. 적 위협도 계산기 (`Vermilion_EnemyCalc`)

| 항목 | BQM 4-Beat v1.2 공식 / 로직 | 구현 위치 | 검증 |
| :--- | :--- | :--- | :--- |
| **행동 압축률** | **Action Compression**: 한 턴에 [이동/공격/방어] 중 2개 이상 수행 시 $\times 1.2$, 3개 시 $\times 1.5$. | `js/calc.js` > `sumZone()` | □ |
| **공포 계수** | **Horror Factor**: 성장형 키워드(`<격분>` 등) 보유 시 $Max$ 값에 보정치(예: +3)를 강제 주입하여 $Gap$을 벌림. | `js/data.js` > `calc()` | □ |
| **키워드 숙주** | **Host-Modifier**: 공격력(Host)이 0이면 `<관통>`(Modifier) 등의 효과도 0으로 처리됨. | `js/calc.js` > `sumZone()` | □ |

---

## 4. 작업 실행 명령

위 지침을 준수하여 **`Vermilion_EquipmentCalc`**와 **`Vermilion_EnemyCalc`**의 `index.html` (UI 수정 포함), `js/data.js` (데이터 및 로직), `js/sim.js` / `js/calc.js` (계산 엔진) 코드를 작성하라.

**[제약 사항]**
* 파일 분할 구조를 유지할 것.
* 기존의 `export/import` 기능을 100% 보존할 것.
* 시뮬레이션 루프(`for`문 반복)를 사용하지 말고, **상수 테이블 조회(LUT)** 방식으로 구현할 것.

### **핵심 보존 명령 (Preservation Mandate)**
**주의:** 아래 명시된 기능은 **절대 수정하거나 삭제하지 말고 원본 로직을 100% 유지**하라. 이 기능들은 BQM 4-Beat v1.2 엔진의 '입력값'을 생성하는 필수 UI다.

#### **1. Vermilion_EnemyCalc (적 위협도 계산기) - 그래프 및 슬라이더**
* **보존 대상:** `main.js` 내의 `startDrag`, `onDrag`, `stopDrag` 이벤트 핸들러 및 `renderGraphAndSlider` 함수.
* **이유:** 사용자가 슬라이더를 움직여 파랑/초록/빨강 구간의 경계(`cut1`, `cut2`)를 조절하면, 그에 따라 **각 구간의 확률 총합(Probability Sum)이 실시간으로 변동**되는 기존 로직은 BQM 1.3에서도 여전히 유효한 **'핵심 입력 메커니즘'**이다.
* **제약:** 엔진 교체 시, `STATE.cut1`, `STATE.cut2` 값을 받아와서 계산하는 부분만 변경하고, **이 값을 조절하는 UI 로직은 단 한 줄도 건드리지 마라.**
* **주사위 확률 생성기 유지:** `utils.js` (또는 `calc.js`) 내의 `convolve` 함수(주사위 눈금 확률 분포 생성기)는 삭제하지 말고 그대로 유지하여 사용하라.

#### **2. Vermilion_EquipmentCalc (장비 등급 계산기) - 드래그 앤 드롭**
* **보존 대상:** `ui.js` 내의 `handleDrop`, `createDroppedItem` 및 HTML의 `drop-area` 구조.
* **이유:** 사용자가 아이템을 드래그하여 장비를 구성하는 UX는 엔진 버전과 무관하다.
* **제약:** 아이템이 드롭되었을 때 호출되는 `calc()` 함수 내부만 BQM 4-Beat v1.2 로직으로 교체하고, **DOM 요소를 생성하고 관리하는 코드는 재활용**하라.

---

# 🛡️ 코드 보존 상세 가이드 (Code Preservation Manifest)

본 섹션은 BQM 엔진 교체 작업 중 **절대 수정, 삭제, 또는 변경하지 말아야 할** 기존 코드의 목록이다. 이 코드들은 UI 동작, 사용자 입력 처리, 파일 입출력을 담당하는 핵심 인프라이며, 엔진 로직과 독립적으로 유지되어야 한다.

## 1\. Vermilion\_EnemyCalc (적 위협도 계산기)

### 1.1. 🎚️ 슬라이더 및 확률 그래프 UI (User Input Logic)

사용자가 파랑/초록/빨강 구간을 조절하는 로직은 BQM 1.3의 입력값을 결정하는 핵심이므로 100% 보존해야 한다.

  * **파일:** `js/main.js`
      * **보존 대상:** `h1.onmousedown`, `h2.onmousedown`, `startDrag`, `onDrag`, `stopDrag` 함수 전체.
      * **이유:** 이 코드는 마우스 움직임을 `STATE.cut1`, `STATE.cut2` 수치로 변환하는 물리적 인터페이스다. 엔진 버전과 무관하게 작동해야 한다.
  * **파일:** `js/render.js`
      * **보존 대상:** `renderGraphAndSlider()` 함수.
      * **이유:** `STATE.probMap` 데이터를 기반으로 SVG 그래프와 슬라이더 핸들 위치를 시각화하는 로직이다.

### 1.2. 🏗️ 드래그 앤 드롭 및 아이템 관리 (DOM Manipulation)

  * **파일:** `js/render.js`
      * **보존 대상:** `renderZones()`, `bindDropZones()`, `handleDrop()`, `createItem()`, `removeItem()`.
      * **이유:** 사용자가 행동(`ACT`)이나 키워드(`KEY`)를 특정 구간(Zone)에 배치하는 행위 자체를 관장한다. 엔진은 배치된 결과물(`dropB`, `dropG` 등의 자식 요소)만 읽어가면 된다.

### 1.3. 💾 파일 입출력 (Data Persistence)

  * **파일:** `js/io.js`
      * **보존 대상:** `addToRamList()`, `exportEnemyDB()`, `importEnemyDB()` 및 내부의 `extract` 헬퍼 함수.
      * **이유:** `.ven` 파일의 JSON 구조를 정의하고 파싱하는 로직이다. 이 구조가 바뀌면 기존 데이터와 호환되지 않는다.

-----

## 2\. Vermilion\_EquipmentCalc (장비 등급 계산기)

### 2.1. 🖱️ UI 인터랙션 (Interaction)

  * **파일:** `js/ui.js`
      * **보존 대상:** `setSlot()` (슬롯 변경), `cycleCap()` (용량 변경), `addLogicRow()` (특수 로직 행 추가).
      * **이유:** 장비의 기본 스펙(용량, 슬롯)을 설정하고, 복잡한 조건부 로직을 입력받는 UI 컨테이너를 생성하는 코드다.

### 2.2. 📦 드래그 앤 드롭 시스템 (Item Management)

  * **파일:** `js/ui.js`
      * **보존 대상:** `handleDrop()`, `createDroppedItem()`, `bindDropZone()`.
      * **주의:** `handleDrop` 내부에서 호출되는 `calc()`는 변경된 엔진을 가리키도록 해야 하지만, 함수 자체의 구조(데이터 전송, DOM 생성)는 유지해야 한다.

### 2.3. 💾 파일 입출력 (Data Persistence)

  * **파일:** `js/io.js`
      * **보존 대상:** `exportEquipDB()`, `importEquipDB()`.
      * **이유:** `.veq` 파일 포맷(Base Items, Logic Rows 구조)을 유지해야 한다. 엔진이 바뀌어도 저장되는 데이터의 형태(어떤 아이템이 어디에 있는지)는 동일하다.

-----

## 3\. 공통 유틸리티 (Utilities)

### 3.1. 🎲 확률 생성기 (Probability Generator)

  * **파일:** `Vermilion_EnemyCalc/js/utils.js` (또는 해당 로직이 있는 곳)
      * **보존 대상:** `convolve(dist, face)` 함수.
      * **이유:** 주사위 눈금의 확률 분포(Convolution)를 계산하는 순수 수학 함수다. 적 위협도 계산기의 그래프를 그리는 데 여전히 필요하다.

### 3.2. 💬 툴팁 시스템 (Tooltip System)

  * **파일:** 각 폴더의 `js/render.js` 또는 `js/ui.js`
      * **보존 대상:** `showTooltip`, `moveTooltip`, `hideTooltip`.
      * **이유:** 사용자가 원문 텍스트를 확인하는 필수 기능이다.

-----

## 4\. 엔진 교체 시 접합 지점 (Integration Point)

개발 AI는 위 코드들을 건드리지 않고, 오직 **`calc()` 함수가 호출되는 시점**에서만 개입해야 한다.

  * **기존 흐름:** `UI 이벤트` $\rightarrow$ `DOM 업데이트` $\rightarrow$ `calc()` 호출 $\rightarrow$ `UI 결과 업데이트`
  * **수정 전략:** `calc()` 함수의 **내부 내용물만** BQM 1.3 로직으로 교체한다. `calc()`가 데이터를 읽어오는 방식(DOM 탐색 `document.getElementById...`)은 기존 코드를 그대로 참조하여 유지한다.

**예시 (EquipmentCalc):**

```javascript
// js/sim.js (수정 시)

// [보존] 기존 DOM에서 데이터를 긁어오는 방식 유지
function calc() {
    // 1. INPUT: 기존 UI 요소에서 상태 읽기 (코드 재사용)
    let currentSlot = STATE.currentSlot;
    let baseContainer = document.getElementById('dropBase');
    // ...

    // 2. PROCESS: 여기만 BQM 1.3 엔진으로 교체!
    // (기존의 runSimulation 호출 삭제 -> 새로운 4-Beat 벡터 연산 수행)

    // 3. OUTPUT: 결과를 기존 UI ID에 뿌리기 (코드 재사용)
    document.getElementById('resScore').innerText = finalScore;
}
```
