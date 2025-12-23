// Vermilion_CharDB/js/io.js
// === File I/O Logic (.vchar) ===
function exportCharDB() {
    const data = JSON.stringify(CHAR_DB, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Vermilion_Characters_v25_AI.vchar";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importCharDB(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                CHAR_DB = data;
                selectedIdx = -1;
                renderList();
                document.getElementById('detailPanel').innerHTML = '<div style="text-align:center; color:#666; margin-top:50px;">데이터 로드 완료. 캐릭터를 선택하세요.</div>';
                alert("캐릭터 DB (v2) 불러오기 성공!");
            }
        } catch (err) { alert("파일 오류!"); }
    };
    reader.readAsText(file);
}
