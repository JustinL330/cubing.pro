"use client";

import { Box } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";
import type { Locale } from "@/i18n";

/** Keep the keyboard shortcut understandable in every currently supported locale. */
const skipLabels: Record<Locale, string> = {
  "zh-CN": "跳转到主要内容",
  "zh-TW": "跳至主要內容",
  "en-US": "Skip to main content",
  "ja-JP": "メインコンテンツへスキップ",
  "ko-KR": "본문으로 건너뛰기",
  "es-ES": "Saltar al contenido principal",
};

export function SkipToMainLink() {
  const { locale } = useI18n();

  return (
    <Box
      as="a"
      href="#main-content"
      position="fixed"
      top="3"
      left="3"
      zIndex={2000}
      px="4"
      py="3"
      borderRadius="md"
      borderWidth="2px"
      borderColor="brand.500"
      bg="bg.panel"
      color="fg"
      fontWeight="semibold"
      boxShadow="lg"
      transform="translateY(-200%)"
      _focusVisible={{
        transform: "translateY(0)",
        outline: "3px solid",
        outlineColor: "brand.500",
        outlineOffset: "2px",
      }}
    >
      {skipLabels[locale]}
    </Box>
  );
}
