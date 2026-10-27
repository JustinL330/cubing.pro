import { Suspense } from "react";

import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { homepageMetadata } from "@/lib/homepageMetadata";
import { WelcomePageView } from "@/views/Welcome/WelcomePageView";

export const metadata = homepageMetadata;

export default function WelcomePage() {
  return (
    <>
      <ExportPathMarker path="/welcome" />
      <Suspense fallback={null}>
        <WelcomePageView />
      </Suspense>
    </>
  );
}
