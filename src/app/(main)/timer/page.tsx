import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { Timer } from "@/views/Practice/Timer";
export const metadata = { title: "Timer" };
export default function Page() { return <><ExportPathMarker path="/timer"/><Timer /></>; }
