"use client";

import { useState } from "react";
import type { ParsedSheet, StoreData, ManagerGroup } from "./parser";

function fmt(v: string): string {
  if (!v || v === "#DIV/0!" || v === "#VALUE!" || v.trim() === "") return "-";
  return v;
}

function toEok(raw: string): string {
  if (!raw || raw === "-") return "-";
  const n = parseFloat(raw.replace(/[,₩\s]/g, ""));
  if (isNaN(n) || n === 0) return "-";
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (n >= 1e4) return Math.round(n / 1e4) + "만";
  return n.toLocaleString("ko-KR");
}

function latestRate(store: StoreData): number | null {
  for (let i = store.juneDays.length - 1; i >= 0; i--) {
    const r = store.juneDays[i].rate;
    if (r && r !== "#DIV/0!") {
      const n = parseFloat(r);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

function latestSales(store: StoreData): string {
  const june = store.monthSales[5];
  if (june) return june;
  for (let i = store.juneDays.length - 1; i >= 0; i--) {
    if (store.juneDays[i].sales) return store.juneDays[i].sales;
  }
  return "";
}

function hasIssue(s: StoreData) {
  return !!(s.latestIssueFirst || s.latestIssueDept || s.latestHire);
}
function isUnresolved(s: StoreData) {
  if (s.latestHire) return true;
  if (s.latestIssueFirst && !s.latestResultFirst) return true;
  if (s.latestIssueDept && !s.latestResultDept) return true;
  return false;
}

function rateColor(r: number | null) {
  if (r === null) return "#bcc2ce";
  if (r >= 90) return "#1a7f4b";
  if (r >= 70) return "#2563c8";
  if (r >= 50) return "#d07000";
  return "#c0392b";
}

// ── 매장 카드 ──────────────────────────────────────────────────
function StoreCard({ store }: { store: StoreData }) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const rate = latestRate(store);
  const sales = latestSales(store);
  const goal = store.monthGoal[5] || "";
  const color = rateColor(rate);
  const name = store.name.replace(/백화점백화점/g, "백화점");
  const unresolved = isUnresolved(store);

  const displayDays = showAll ? store.juneDays : store.juneDays.slice(-5);

  return (
    <div className={`org-store-card ${unresolved ? "org-card-alert" : ""}`}>
      {/* 이름 + 배지 */}
      <div className="org-card-top">
        <span className="org-card-name">{name}</span>
        {unresolved && <span className="org-bdg org-bdg-warn">미조치</span>}
        {hasIssue(store) && !unresolved && <span className="org-bdg org-bdg-issue">이슈</span>}
      </div>

      {/* 달성률 */}
      <div className="org-rate-row">
        <span className="org-rate-num" style={{ color }}>{rate !== null ? `${rate}%` : "-"}</span>
        <div className="org-bar">
          <div className="org-bar-fill" style={{ width: `${Math.min(rate ?? 0, 100)}%`, background: color }} />
        </div>
      </div>

      {/* 목표 / 누계 */}
      <div className="org-kpi">
        <div className="org-kpi-item">
          <span className="org-kpi-label">목표</span>
          <span className="org-kpi-val">{toEok(goal) !== "-" ? toEok(goal) : "-"}</span>
        </div>
        <div className="org-kpi-sep" />
        <div className="org-kpi-item">
          <span className="org-kpi-label">누계</span>
          <span className="org-kpi-val">{toEok(sales)}</span>
        </div>
      </div>

      {/* 일별 현황 펼치기 */}
      {store.juneDays.length > 0 && (
        <button className="org-toggle" onClick={() => setOpen(v => !v)}>
          {open ? "▲ 닫기" : "▼ 일별 현황"}
        </button>
      )}

      {open && (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>일자</th><th>EDI</th><th>누계</th><th>달성</th><th>유입</th><th>구매</th><th>전환</th>
              </tr>
            </thead>
            <tbody>
              {displayDays.map(d => {
                const dr = parseFloat(d.rate);
                return (
                  <tr key={d.day}>
                    <td className="org-td-day">{d.day}일</td>
                    <td>{fmt(d.edi)}</td>
                    <td>{fmt(d.sales)}</td>
                    <td className={!isNaN(dr) && dr >= 90 ? "org-td-good" : !isNaN(dr) && dr < 30 ? "org-td-bad" : ""}>{fmt(d.rate)}</td>
                    <td>{fmt(d.inflow)}</td>
                    <td>{fmt(d.purchase)}</td>
                    <td>{fmt(d.conversion)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {store.juneDays.length > 5 && (
            <button className="org-show-all" onClick={() => setShowAll(v => !v)}>
              {showAll ? "최근 5일만" : `전체 ${store.juneDays.length}일`}
            </button>
          )}
        </div>
      )}

      {/* 이슈 */}
      {hasIssue(store) && (
        <div className="org-issues">
          {store.latestIssueFirst && <IssueRow label="이슈" text={store.latestIssueFirst} warn={!store.latestResultFirst} />}
          {store.latestResultFirst && <IssueRow label="조치" text={store.latestResultFirst} />}
          {store.latestIssueDept && <IssueRow label="이슈(백화점)" text={store.latestIssueDept} warn={!store.latestResultDept} />}
          {store.latestResultDept && <IssueRow label="조치(백화점)" text={store.latestResultDept} />}
          {store.latestHire && <IssueRow label="채용" text={store.latestHire} warn />}
          {store.latestTop3 && <IssueRow label="TOP3" text={store.latestTop3} />}
        </div>
      )}
    </div>
  );
}

function IssueRow({ label, text, warn }: { label: string; text: string; warn?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const clean = text.replace(/\t+/g, " ").replace(/\n+/g, " · ");
  const LIMIT = 70;
  const long = clean.length > LIMIT;
  return (
    <div className={`org-issue-row ${warn ? "org-issue-warn" : ""}`}>
      <span className="org-issue-label">{label}</span>
      <span className="org-issue-text">
        {expanded ? clean : clean.slice(0, LIMIT)}
        {long && <button className="org-issue-more" onClick={() => setExpanded(v => !v)}>{expanded ? " 접기" : "…"}</button>}
      </span>
    </div>
  );
}

// ── 담당자 컬럼 ────────────────────────────────────────────────
function ManagerColumn({ mg }: { mg: ManagerGroup }) {
  const unresolvedCount = mg.stores.filter(isUnresolved).length;
  return (
    <div className="org-manager-col">
      <div className="org-manager-header">
        <span className="org-manager-name">{mg.manager}</span>
        <div className="org-manager-meta">
          {unresolvedCount > 0 && <span className="org-bdg org-bdg-warn">{unresolvedCount}건</span>}
          <span className="org-manager-count">{mg.stores.length}개 매장</span>
        </div>
      </div>
      <div className="org-store-list">
        {mg.stores.map(store => (
          <StoreCard key={store.name} store={store} />
        ))}
      </div>
    </div>
  );
}

// ── 그룹 패널 ──────────────────────────────────────────────────
const GROUP_LEADERS: Record<string, string> = {
  "퍼스트 그룹1": "김경민 그룹장",
  "퍼스트 그룹2": "박상준 그룹장",
};

function GroupPanel({ name, managers }: { name: string; managers: ManagerGroup[] }) {
  const totalStores = managers.reduce((s, m) => s + m.stores.length, 0);
  const totalAlerts = managers.flatMap(m => m.stores).filter(isUnresolved).length;
  return (
    <div className="org-group-panel">
      <div className="org-group-header">
        <div className="org-group-title-row">
          <span className="org-group-name">{name}</span>
          <span className="org-group-leader">{GROUP_LEADERS[name]}</span>
        </div>
        <div className="org-group-stats">
          <span className="org-group-stat">{managers.length}명 · {totalStores}개 매장</span>
          {totalAlerts > 0 && <span className="org-bdg org-bdg-warn">미조치 {totalAlerts}건</span>}
        </div>
      </div>
      <div className="org-manager-row">
        {managers.map(mg => (
          <ManagerColumn key={mg.manager} mg={mg} />
        ))}
      </div>
    </div>
  );
}

// ── 이슈 탭 ────────────────────────────────────────────────────
function IssueView({ data }: { data: ParsedSheet }) {
  const [filter, setFilter] = useState("전체");
  const managers = ["전체", ...data.managers.map(m => m.manager)];
  const rows = data.managers.flatMap(mg =>
    mg.stores
      .filter(s => hasIssue(s) && (filter === "전체" || mg.manager === filter))
      .map(s => ({ manager: mg.manager, group: mg.group, store: s }))
  );
  return (
    <div className="org-issue-view">
      <div className="org-filter-row">
        {managers.map(m => (
          <button key={m} className={`org-filter-btn ${filter === m ? "active" : ""}`} onClick={() => setFilter(m)}>{m}</button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="org-empty">이슈 내역이 없습니다.</div>
      ) : (
        <div className="org-issue-grid">
          {rows.map(({ manager, group, store }) => (
            <div key={`${manager}-${store.name}`} className={`org-issue-card ${isUnresolved(store) ? "org-issue-card-alert" : ""}`}>
              <div className="org-issue-card-head">
                <span className="org-issue-card-store">{store.name.replace(/백화점백화점/g, "백화점")}</span>
                <span className="org-issue-card-manager">{group} · {manager}</span>
                {isUnresolved(store) ? <span className="org-bdg org-bdg-warn">미조치</span> : <span className="org-bdg org-bdg-done">완료</span>}
              </div>
              {store.latestIssueFirst && <IssueRow label="이슈" text={store.latestIssueFirst} warn={!store.latestResultFirst} />}
              {store.latestResultFirst && <IssueRow label="조치" text={store.latestResultFirst} />}
              {store.latestIssueDept && <IssueRow label="이슈(백화점)" text={store.latestIssueDept} warn={!store.latestResultDept} />}
              {store.latestResultDept && <IssueRow label="조치(백화점)" text={store.latestResultDept} />}
              {store.latestHire && <IssueRow label="채용" text={store.latestHire} warn />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function DashboardClient({ data }: { data: ParsedSheet }) {
  const [mode, setMode] = useState<"stores" | "issues">("stores");

  const groups = data.managers.reduce<{ name: string; managers: ManagerGroup[] }[]>((acc, m) => {
    const g = acc.find(g => g.name === m.group);
    if (g) g.managers.push(m);
    else acc.push({ name: m.group, managers: [m] });
    return acc;
  }, []);

  const totalIssues = data.managers.flatMap(m => m.stores).filter(isUnresolved).length;

  return (
    <div className="org-root">
      {/* 헤더 */}
      <div className="org-header">
        <div>
          <h1 className="org-title">라로제 HQ 통합 업무</h1>
          <p className="org-subtitle">담당자별 · 매장별 6월 현황 · 시트 실시간 연동</p>
        </div>
        <div className="org-mode-switch">
          <button className={`org-mode-btn ${mode === "stores" ? "active" : ""}`} onClick={() => setMode("stores")}>매장 현황</button>
          <button className={`org-mode-btn ${mode === "issues" ? "active" : ""}`} onClick={() => setMode("issues")}>
            이슈 현황
            {totalIssues > 0 && <span className="org-issue-badge">{totalIssues}</span>}
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div className="org-body">
        {mode === "issues" ? (
          <IssueView data={data} />
        ) : (
          <div className="org-groups">
            {groups.map(g => (
              <GroupPanel key={g.name} name={g.name} managers={g.managers} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
