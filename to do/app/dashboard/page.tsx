import { parseHqSheet, SHEET_ID, GID } from "./parser";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    data = parseHqSheet(csv);
  } catch (e) {
    return (
      <div style={{ padding: 40, color: "var(--danger)" }}>
        <h2>시트 불러오기 실패</h2>
        <p style={{ marginTop: 8, color: "var(--muted)" }}>
          구글 시트가 &apos;링크가 있는 모든 사용자&apos;에게 공개되어 있는지 확인하세요.
        </p>
        <pre style={{ marginTop: 12, fontSize: 12 }}>{String(e)}</pre>
      </div>
    );
  }

  return <DashboardClient data={data} />;
}
