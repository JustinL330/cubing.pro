import { Suspense } from "react";
import type { Metadata } from "next";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { LoginPage } from "@/views/admin/LoginPage";

export const metadata: Metadata = {
  title: "WCA 登录",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <ExportPathMarker path="/login" />
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </>
  );
}
