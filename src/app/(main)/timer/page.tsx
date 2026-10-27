import { ExportPathMarker } from "@/components/routing/ExportPathMarker";
import { Timer } from "@/views/Practice/Timer";
export const metadata = {
  title: "Cube Timer",
  description:
    "Free cube timer with scrambles, 15-second inspection, +2 and DNF penalties, and Ao5/Ao12 averages. Practice without an account; solves stay in this session.",
};
export default function Page() { return <><ExportPathMarker path="/timer"/><Timer /></>; }
