import type { Locale } from "@/i18n";

type CarouselLabels = {
  carousel: string;
  carouselDescription: string;
  slideDescription: string;
  pause: string;
  resume: string;
  slideLabel: (index: number, total: number) => string;
  goToSlide: (index: number, total: number) => string;
};

const labels: Record<Locale, CarouselLabels> = {
  "zh-CN": {
    carousel: "首页广告轮播",
    carouselDescription: "轮播",
    slideDescription: "幻灯片",
    pause: "暂停自动轮播",
    resume: "继续自动轮播",
    slideLabel: (index, total) => `第 ${index} 张，共 ${total} 张`,
    goToSlide: (index, total) => `跳转到第 ${index} 张，共 ${total} 张`,
  },
  "zh-TW": {
    carousel: "首頁廣告輪播",
    carouselDescription: "輪播",
    slideDescription: "投影片",
    pause: "暫停自動輪播",
    resume: "繼續自動輪播",
    slideLabel: (index, total) => `第 ${index} 張，共 ${total} 張`,
    goToSlide: (index, total) => `前往第 ${index} 張，共 ${total} 張`,
  },
  "en-US": {
    carousel: "Homepage advertisements",
    carouselDescription: "carousel",
    slideDescription: "slide",
    pause: "Pause automatic rotation",
    resume: "Resume automatic rotation",
    slideLabel: (index, total) => `Slide ${index} of ${total}`,
    goToSlide: (index, total) => `Go to slide ${index} of ${total}`,
  },
  "ja-JP": {
    carousel: "ホームページの広告",
    carouselDescription: "カルーセル",
    slideDescription: "スライド",
    pause: "自動切り替えを一時停止",
    resume: "自動切り替えを再開",
    slideLabel: (index, total) => `全${total}枚中${index}枚目`,
    goToSlide: (index, total) => `全${total}枚中${index}枚目に移動`,
  },
  "ko-KR": {
    carousel: "홈페이지 광고",
    carouselDescription: "캐러셀",
    slideDescription: "슬라이드",
    pause: "자동 전환 일시정지",
    resume: "자동 전환 다시 시작",
    slideLabel: (index, total) => `전체 ${total}개 중 ${index}번째 슬라이드`,
    goToSlide: (index, total) => `전체 ${total}개 중 ${index}번째 슬라이드로 이동`,
  },
  "es-ES": {
    carousel: "Anuncios de la página de inicio",
    carouselDescription: "carrusel",
    slideDescription: "diapositiva",
    pause: "Pausar el cambio automático",
    resume: "Reanudar el cambio automático",
    slideLabel: (index, total) => `Diapositiva ${index} de ${total}`,
    goToSlide: (index, total) => `Ir a la diapositiva ${index} de ${total}`,
  },
};

export function carouselCopy(locale: Locale): CarouselLabels {
  return labels[locale] ?? labels["en-US"];
}
