import type { Locale } from "@/i18n";

interface AnalyticsCopy {
  heading: string;
  description: string;
  allow: string;
  deny: string;
  enabled: string;
  disabled: string;
  unavailable: string;
}

export const analyticsCopy: Record<Locale, AnalyticsCopy> = {
  "zh-CN": {
    heading: "可选的访问统计",
    description: "仅在您同意后使用 Google Analytics 统计公开页面的访问情况。不发送搜索词、WCA ID、账户信息或私密内容。您可随时在设置中撤回同意。",
    allow: "同意统计",
    deny: "拒绝统计",
    enabled: "已同意，可随时撤回",
    disabled: "未同意，不会加载统计脚本",
    unavailable: "站点管理员尚未启用访问统计",
  },
  "zh-TW": {
    heading: "可選的網站統計",
    description: "僅在您同意後使用 Google Analytics 統計公開頁面的瀏覽情況。不傳送搜尋詞、WCA ID、帳號資訊或私密內容。您可隨時在設定中撤回同意。",
    allow: "同意統計",
    deny: "拒絕統計",
    enabled: "已同意，可隨時撤回",
    disabled: "未同意，不會載入統計程式",
    unavailable: "網站管理員尚未啟用網站統計",
  },
  "en-US": {
    heading: "Optional website analytics",
    description: "With your permission, Google Analytics measures visits to public pages only. Search terms, WCA IDs, account details and private content are not sent. You can withdraw consent in Settings.",
    allow: "Allow analytics",
    deny: "Decline analytics",
    enabled: "Allowed; you can withdraw consent",
    disabled: "Not allowed; analytics scripts are not loaded",
    unavailable: "Analytics have not been configured by the site owner",
  },
  "ja-JP": {
    heading: "任意のアクセス解析",
    description: "同意した場合のみ、Google Analytics で公開ページの閲覧を計測します。検索語句、WCA ID、アカウント情報、非公開の内容は送信しません。設定から同意を撤回できます。",
    allow: "同意する",
    deny: "同意しない",
    enabled: "同意済み。いつでも撤回できます",
    disabled: "未同意。解析スクリプトは読み込まれません",
    unavailable: "サイト管理者が解析を設定していません",
  },
  "ko-KR": {
    heading: "선택적 웹사이트 분석",
    description: "동의한 경우에만 Google Analytics로 공개 페이지 방문을 측정합니다. 검색어, WCA ID, 계정 정보 및 비공개 콘텐츠는 전송하지 않습니다. 설정에서 언제든 동의를 철회할 수 있습니다.",
    allow: "분석 동의",
    deny: "분석 거부",
    enabled: "동의함. 언제든 철회할 수 있습니다",
    disabled: "동의하지 않음. 분석 스크립트를 불러오지 않습니다",
    unavailable: "사이트 관리자가 분석을 설정하지 않았습니다",
  },
  "es-ES": {
    heading: "Analítica web opcional",
    description: "Solo con tu consentimiento, Google Analytics mide las visitas a páginas públicas. No enviamos búsquedas, identificadores WCA, datos de cuenta ni contenido privado. Puedes retirar tu consentimiento en Ajustes.",
    allow: "Aceptar analítica",
    deny: "Rechazar analítica",
    enabled: "Aceptada; puedes retirar tu consentimiento",
    disabled: "No aceptada; no se carga el script",
    unavailable: "El propietario aún no ha configurado la analítica",
  },
};
