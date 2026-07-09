import type { Metadata } from "next";
import TeamBoard from "./TeamBoard";

export const metadata: Metadata = {
  title: "La Rosée · 팀 업무 보드",
  description: "라로제 팀 업무 보드 — 실시간 공유",
  icons: { icon: "/team-icon.png" },
};

export default function TeamPage() {
  return <TeamBoard />;
}
