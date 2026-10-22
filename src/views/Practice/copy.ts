import type { Locale } from "@/i18n";
const en = {
    title: "Make every solve count.", intro: "Practice at your pace. Time a solve, explore algorithms, and build your next personal best.",
    timer: "Practice timer", timerInfo: "Scrambles, penalties and averages. No account needed.", learnInfo: "Explore algorithms and find your next technique to practice.",
    local: "Temporary session only. Results disappear when you refresh or leave this page. Nothing is saved or uploaded.",
    scramble: "New scramble", loading: "Generating scramble…", ready: "Hold Space to get ready; release to start. Press Space to stop.", armed: "Ready — release to start", running: "Solving…", cancel: "Cancel (Esc)", start: "Start", stop: "Stop", reset: "Clear session", confirm: "Delete all solves in this session?", empty: "Your first solve starts here.", best: "Best", solves: "Solves", session: "Session", inspection: "15-second inspection", inspect: "Inspect — press Space or tap to start", remove: "Delete", penalty: "Penalty", normal: "None", event: "Puzzle", unsupported: "Scramble unavailable. Retry to enable the timer.",
};
type Copy = typeof en;
const zhTW: Copy = {
    title: "讓每一次復原都有收穫。", intro: "按照自己的步調練習。記錄本次成績、探索公式，挑戰個人最佳。", timer: "練習計時器", timerInfo: "打亂、懲罰與平均成績，無需帳號。", learnInfo: "探索魔方公式，找到下一個練習目標。", local: "僅限本次頁面的臨時紀錄。重新整理或離開即清除，不儲存或上傳資料。", scramble: "重新打亂", loading: "正在生成打亂…", ready: "按住空白鍵準備，鬆開開始，再按停止。", armed: "準備完成，鬆開開始", running: "計時中…", cancel: "取消 (Esc)", start: "開始", stop: "停止", reset: "清空此分組", confirm: "刪除此分組的全部成績？", empty: "從第一次復原開始。", best: "最佳", solves: "次數", session: "分組", inspection: "15 秒觀察", inspect: "觀察中，按空白鍵或點擊開始", remove: "刪除", penalty: "懲罰", normal: "無", event: "項目", unsupported: "無法生成打亂，請重試後開始。",
};
const zhCN: Copy = {
    title: "让每一次复原都有收获。", intro: "按照自己的步调练习。记录本次成绩、探索公式，挑战个人最佳。", timer: "练习计时器", timerInfo: "打乱、惩罚与平均成绩，无需账号。", learnInfo: "探索魔方公式，找到下一个练习目标。", local: "仅限本次页面的临时记录。刷新或离开即清除，不保存或上传数据。", scramble: "重新打乱", loading: "正在生成打乱…", ready: "按住空格键准备，松开开始，再按停止。", armed: "准备完成，松开开始", running: "计时中…", cancel: "取消 (Esc)", start: "开始", stop: "停止", reset: "清空此分组", confirm: "删除此分组的全部成绩？", empty: "从第一次复原开始。", best: "最佳", solves: "次数", session: "分组", inspection: "15 秒观察", inspect: "观察中，按空格键或点击开始", remove: "删除", penalty: "惩罚", normal: "无", event: "项目", unsupported: "无法生成打乱，请重试后开始。",
};
const ja: Copy = {
    title: "一回のソルブを、大切に。", intro: "自分のペースで練習し、手順を学び、自己ベストに挑戦しよう。", timer: "練習タイマー", timerInfo: "スクランブル、ペナルティと平均。アカウント不要。", learnInfo: "手順を調べて、次の練習目標を見つけよう。", local: "このページ内の一時的な記録です。再読み込みや移動で消えます。保存・送信しません。", scramble: "新しいスクランブル", loading: "生成中…", ready: "スペースを長押しし、離すと開始。再度押すと停止。", armed: "準備完了 — 離すと開始", running: "計測中…", start: "開始", stop: "停止", cancel: "キャンセル (Esc)", reset: "履歴を消去", confirm: "このセッションの記録をすべて削除しますか？", best: "ベスト", solves: "回数", session: "セッション", inspection: "15秒のインスペクション", inspect: "観察中 — スペースまたはタップで開始", empty: "最初のソルブを始めよう。", remove: "削除", penalty: "ペナルティ", normal: "なし", event: "種目", unsupported: "スクランブルを生成できません。再試行してください。",
};
const es: Copy = {
    title: "Haz que cada resolución cuente.", intro: "Practica a tu ritmo, explora algoritmos y mejora tu marca personal.", timer: "Cronómetro", timerInfo: "Mezclas, penalizaciones y medias. Sin cuenta.", learnInfo: "Explora algoritmos y encuentra tu próximo objetivo.", local: "Sesión temporal. Los resultados se pierden al recargar o salir. No se guardan ni se suben datos.", scramble: "Nueva mezcla", loading: "Generando…", ready: "Mantén Espacio; suelta para empezar. Pulsa para parar.", armed: "Listo — suelta para empezar", running: "Resolviendo…", start: "Empezar", stop: "Parar", cancel: "Cancelar (Esc)", reset: "Vaciar sesión", confirm: "¿Eliminar todos los resultados de esta sesión?", best: "Mejor", solves: "Resoluciones", session: "Sesión", inspection: "Inspección de 15 segundos", inspect: "Inspección — pulsa Espacio o toca para empezar", empty: "Empieza tu primera resolución.", remove: "Eliminar", penalty: "Penalización", normal: "Ninguna", event: "Prueba", unsupported: "Mezcla no disponible. Vuelve a intentarlo.",
};
const ko: Copy = {
    title: "한 번의 솔브도 소중하게.", intro: "자신의 속도로 연습하세요. 시간을 재고 공식을 익히며 개인 최고 기록에 도전하세요.",
    timer: "연습 타이머", timerInfo: "스크램블, 페널티와 평균 기록. 계정이 필요하지 않습니다.", learnInfo: "큐브 공식을 찾아보고 다음 연습 목표를 정하세요.",
    local: "현재 페이지에서만 사용하는 임시 기록입니다. 새로고침하거나 페이지를 나가면 사라지며, 저장하거나 업로드하지 않습니다.",
    scramble: "새 스크램블", loading: "스크램블 생성 중…", ready: "스페이스바를 누른 채 준비하고 놓으면 시작합니다. 다시 누르면 멈춥니다.", armed: "준비 완료 — 놓으면 시작", running: "측정 중…",
    cancel: "취소 (Esc)", start: "시작", stop: "정지", reset: "세션 비우기", confirm: "이 세션의 모든 기록을 삭제할까요?", empty: "첫 번째 솔브를 시작해 보세요.",
    best: "최고 기록", solves: "횟수", session: "세션", inspection: "15초 인스펙션", inspect: "인스펙션 중 — 스페이스바 또는 터치로 시작", remove: "삭제", penalty: "페널티", normal: "없음", event: "종목", unsupported: "스크램블을 생성할 수 없습니다. 다시 시도해 주세요.",
};
export function practiceCopy(locale: Locale): Copy {
    return ({ "en-US": en, "zh-CN": zhCN, "zh-TW": zhTW, "ja-JP": ja, "es-ES": es, "ko-KR": ko })[locale];
}
