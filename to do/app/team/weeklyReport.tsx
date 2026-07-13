/* ═══ 주간회의 점검표 — 롯데 영업관리팀 ═══ */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Member, Store, WeeklyReport, StorePerf, PartLeadCheck, Vacancy, ActionItem,
  StoreItem,
  PRIORITIES, CORE_STORES, ymd, mondayOf, achievementRate, defaultWeeklyReport, rid, fmtDateTime,
  parseEcountSheet, aggregateEcount, mergeEcountIntoReport, fmtWon, normStoreName,
  aggregateItems, mergeItemsIntoReport,
  parseScheduleSheet, aggregateSchedule, mergeScheduleIntoReport, aovOf, perHeadOf, headcountOf,
} from "./lib";

function rateColor(rate: number) {
  if (rate >= 100) return { color: "#16a34a", bg: "#f0fdf4" };
  if (rate >= 80) return { color: "#d97706", bg: "#fffbeb" };
  return { color: "#dc2626", bg: "#fef2f2" };
}

export function WeeklyReportView({
  reports, members, stores, me, onSave,
}: {
  reports: WeeklyReport[]; members: Member[]; stores: Store[]; me: string;
  onSave: (r: WeeklyReport) => void;
}) {
  const [weekDate, setWeekDate] = useState(() => mondayOf(new Date()));
  const weekId = ymd(weekDate);
  const saved = useMemo(() => reports.find((r) => r.id === weekId) || null, [reports, weekId]);
  const [draft, setDraft] = useState<WeeklyReport>(() => saved || defaultWeeklyReport(weekDate, me));

  useEffect(() => {
    setDraft(reports.find((r) => r.id === weekId) || defaultWeeklyReport(weekDate, me));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  const move = (n: number) => {
    const d = new Date(weekDate); d.setDate(d.getDate() + n * 7);
    setWeekDate(mondayOf(d));
  };

  const save = () => {
    const next = { ...draft, updated_at: Date.now(), updated_by: me };
    setDraft(next);
    onSave(next);
  };

  /* ─── 이카운트 업로드 (일별 매출 · 품목별 자동 판별) ─── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [upInfo, setUpInfo] = useState<string>("");
  const [showAllStores, setShowAllStores] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const onUpload = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as unknown[][];
      const { daily, items } = parseEcountSheet(rows);

      if (!daily.length && !items.length) {
        // 이카운트가 아니면 근무 스케줄로 시도
        const recs = parseScheduleSheet(rows, weekDate.getFullYear());
        if (recs.length) {
          const sched = aggregateSchedule(recs, weekDate);
          setDraft((d) => mergeScheduleIntoReport(d, sched));
          const hit = sched.filter((s) => s.staff.length).length;
          const memCnt = new Set(recs.map((r) => r.member)).size;
          setUpInfo(`✅ 근무 스케줄 반영 · 담당자 ${memCnt}명 · 근무 잡힌 매장 ${hit}곳 (매장을 펼쳐 인당 매출 확인 · 저장 버튼을 눌러 확정)`);
          return;
        }
        setUpInfo("⚠ 인식된 데이터가 없습니다. 이카운트 [판매현황] 또는 근무 스케줄 엑셀인지 확인해주세요.");
        return;
      }

      const parts: string[] = [];
      if (daily.length) {
        const dates = daily.map((d) => d.date).sort();
        const aggs = aggregateEcount(daily, weekDate);
        const sun = new Date(weekDate); sun.setDate(weekDate.getDate() + 6);
        const hit = aggs.filter((a) => a.weekTotal > 0).length;
        setDraft((d) => mergeEcountIntoReport(d, aggs));
        parts.push(`매출 ${dates[0].slice(5)}~${dates[dates.length - 1].slice(5)} · ${ymd(weekDate).slice(5)}~${ymd(sun).slice(5)} 주간 실적 ${hit}곳`);
      }
      if (items.length) {
        const itemMap = aggregateItems(items);
        setDraft((d) => mergeItemsIntoReport(d, itemMap));
        parts.push(`품목 ${new Set(items.map((i) => i.name)).size}종`);
      }
      setUpInfo(`✅ ${parts.join(" · ")} 반영 (매장을 펼쳐 확인 · 저장 버튼을 눌러 확정)`);
    } catch (e) {
      setUpInfo("⚠ 파일을 읽지 못했습니다: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ─── 요약 KPI ─── */
  const rates = draft.storePerf.map((s) => achievementRate(s.target, s.monthActual || 0));
  const avgRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  const belowCount = rates.filter((r) => r < 80 && r > 0).length;
  const doneItems = draft.actionItems.filter((a) => a.done).length;
  const totalVacancy = draft.vacancies.reduce((s, v) => s + (Number(v.count) || 0), 0);
  const nonCompliant = draft.partLeadChecks.filter((p) => !p.reportWritten || !p.compliance).length;

  /* ─── 매장 실적 행 ─── */
  const setStorePerf = (id: string, patch: Partial<StorePerf>) =>
    setDraft((d) => ({ ...d, storePerf: d.storePerf.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const addStorePerf = () =>
    setDraft((d) => ({ ...d, storePerf: [...d.storePerf, { id: rid("sp"), store: "", grade: "", target: 0, actual: 0, vsLastWeek: "", partLeadReport: false, cause: "" }] }));
  const removeStorePerf = (id: string) =>
    setDraft((d) => ({ ...d, storePerf: d.storePerf.filter((s) => s.id !== id) }));

  /* ─── 파트장 체크 ─── */
  const setPartLead = (id: string, patch: Partial<PartLeadCheck>) =>
    setDraft((d) => ({ ...d, partLeadChecks: d.partLeadChecks.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const addPartLead = () =>
    setDraft((d) => ({ ...d, partLeadChecks: [...d.partLeadChecks, { id: rid("pl"), partLead: "", store: "", reportWritten: false, feedback: false, compliance: false, note: "" }] }));
  const removePartLead = (id: string) =>
    setDraft((d) => ({ ...d, partLeadChecks: d.partLeadChecks.filter((p) => p.id !== id) }));

  /* ─── 결원 현황 ─── */
  const setVacancy = (id: string, patch: Partial<Vacancy>) =>
    setDraft((d) => ({ ...d, vacancies: d.vacancies.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  const addVacancy = () =>
    setDraft((d) => ({ ...d, vacancies: [...d.vacancies, { id: rid("vc"), store: "", count: 0, progress: "", targetDate: "", note: "" }] }));
  const removeVacancy = (id: string) =>
    setDraft((d) => ({ ...d, vacancies: d.vacancies.filter((v) => v.id !== id) }));

  /* ─── 액션아이템 ─── */
  const setAction = (id: string, patch: Partial<ActionItem>) =>
    setDraft((d) => ({ ...d, actionItems: d.actionItems.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const addAction = () =>
    setDraft((d) => ({ ...d, actionItems: [...d.actionItems, { id: rid("ai"), priority: "중요", task: "", assignee: members[0]?.name || "", deadline: "", done: false, note: "" }] }));
  const removeAction = (id: string) =>
    setDraft((d) => ({ ...d, actionItems: d.actionItems.filter((a) => a.id !== id) }));

  return (
    <section className="wr-root">
      <div className="wr-header">
        <div>
          <div className="dash-title">La Rosée 영업관리팀 주간회의 점검표</div>
          <div className="dash-sub">롯데 · 매주 월요일 · {draft.round} ({weekId} ~ )</div>
        </div>
        <div className="wr-nav">
          <button className="btn btn-ghost" onClick={() => move(-1)}>◀ 전주</button>
          <button className="btn btn-ghost" onClick={() => setWeekDate(mondayOf(new Date()))}>이번주</button>
          <button className="btn btn-ghost" onClick={() => move(1)}>다음주 ▶</button>
        </div>
      </div>

      {/* 요약 KPI */}
      <div className="dash-kpis dash-kpis-5">
        <div className="kpi-card"><div className="kpi-label">평균 달성률</div><div className={`kpi-value ${avgRate < 80 ? "danger" : "good"}`}>{avgRate}%</div><div className="kpi-sub">핵심매장 기준</div></div>
        <div className="kpi-card"><div className="kpi-label">미달성 매장</div><div className={`kpi-value ${belowCount ? "danger" : ""}`}>{belowCount}</div><div className="kpi-sub">80% 미만</div></div>
        <div className="kpi-card"><div className="kpi-label">파트장 미이행</div><div className={`kpi-value ${nonCompliant ? "warn" : ""}`}>{nonCompliant}</div><div className="kpi-sub">보고/지시 기준</div></div>
        <div className="kpi-card"><div className="kpi-label">결원</div><div className={`kpi-value ${totalVacancy ? "warn" : ""}`}>{totalVacancy}</div><div className="kpi-sub">명</div></div>
        <div className="kpi-card"><div className="kpi-label">액션아이템</div><div className="kpi-value good">{doneItems}/{draft.actionItems.length}</div><div className="kpi-sub">완료</div></div>
      </div>

      {/* 메타 */}
      <div className="wr-panel">
        <div className="wr-meta-grid">
          <label>회차<input value={draft.round} onChange={(e) => setDraft((d) => ({ ...d, round: e.target.value }))} /></label>
          <label>회의일자<input type="date" value={draft.meetingDate} onChange={(e) => setDraft((d) => ({ ...d, meetingDate: e.target.value }))} /></label>
          <label>작성자
            <select value={draft.author} onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}>
              <option value="">선택</option>
              {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </label>
          <label>소요시간<input value={draft.duration} onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))} /></label>
        </div>
      </div>

      {/* 1. 매장별 실적 & 숫자 점검 (통합) */}
      <div className="wr-panel">
        <div className="wr-section-head">
          <div className="dash-section-title">1. 매장별 실적 &amp; 숫자 점검 — 달성률 80% 미만은 원인·대응 필수 · 매장을 펼치면 숫자 점검·품목별 판매</div>
          <div className="wr-upload-wrap">
            <input
              ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
            />
            <button className="btn btn-primary wr-upload-btn" onClick={() => fileRef.current?.click()}>
              📥 이카운트 업로드 (매출·품목)
            </button>
          </div>
        </div>
        {upInfo && <div className={`wr-upload-info ${upInfo.startsWith("⚠") ? "err" : ""}`}>{upInfo}</div>}
        <div className="wr-table-wrap">
          <table className="wr-table wr-store-table">
            <thead>
              <tr>
                <th className="wr-exp-th">상세</th>
                <th className="wr-store-th">매장</th><th>등급</th><th>월간 목표</th><th>주간 실적</th><th>전월 누계</th><th>당월 누계</th><th>달성률</th>
                <th>전주대비</th><th>파트장 보고(주간)</th><th>원인·대응 (미달 시)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const coreNorms = new Set(CORE_STORES.map(normStoreName));
                const rows = draft.storePerf.map((s) => ({ s, core: coreNorms.has(normStoreName(s.store)) }));
                const restCount = rows.filter((r) => !r.core).length;
                const COLS = 12;
                const renderRows = (s: StorePerf, core: boolean) => {
                  const rate = achievementRate(s.target, s.monthActual || 0);
                  const rc = rateColor(rate);
                  const open = expanded.has(s.id);
                  const down = s.vsLastWeek.trim().startsWith("-");
                  const els: React.ReactNode[] = [
                    <tr key={s.id} className={`${core ? "wr-core-row" : ""} ${open ? "wr-open-row" : ""}`}>
                      <td className="wr-exp-td">
                        <button className={`wr-exp-btn ${open ? "open" : ""}`} onClick={() => toggleExpand(s.id)} title="숫자 점검·품목별 판매 펼치기">
                          <span className="wr-exp-ic">{open ? "▾" : "▸"}</span>
                          <span className="wr-exp-lbl">품목·숫자</span>
                          {s.items && s.items.length ? <span className="wr-exp-badge">{s.items.length}</span> : null}
                        </button>
                      </td>
                      <td className="wr-store-cell">
                        {core && <span className="wr-core-tag">핵심</span>}
                        <input className="wr-store-name" list="wr-store-names" value={s.store} onChange={(e) => setStorePerf(s.id, { store: e.target.value })} />
                      </td>
                      <td className="wr-narrow"><input value={s.grade} onChange={(e) => setStorePerf(s.id, { grade: e.target.value })} placeholder="S/A/B" /></td>
                      <td className="wr-num"><input type="number" value={s.target || ""} onChange={(e) => setStorePerf(s.id, { target: Number(e.target.value) || 0 })} /></td>
                      <td className="wr-num right"><span className="wr-actual">{s.actual ? fmtWon(s.actual) : "-"}</span></td>
                      <td className="wr-num right"><span className="wr-month">{s.prevMonthActual ? fmtWon(s.prevMonthActual) : "-"}</span></td>
                      <td className="wr-num right">
                        <span className="wr-month">{s.monthActual ? fmtWon(s.monthActual) : "-"}</span>
                        {s.weekQty ? <small className="wr-qty">{s.weekQty}개</small> : null}
                      </td>
                      <td className="wr-narrow"><span className="wr-rate-badge" style={{ color: rc.color, background: rc.bg }}>{rate}%</span></td>
                      <td className="wr-narrow"><input value={s.vsLastWeek} onChange={(e) => setStorePerf(s.id, { vsLastWeek: e.target.value })} placeholder="+/-" /></td>
                      <td className="wr-narrow center"><input type="checkbox" checked={s.partLeadReport} onChange={(e) => setStorePerf(s.id, { partLeadReport: e.target.checked })} /></td>
                      <td><input value={s.cause} onChange={(e) => setStorePerf(s.id, { cause: e.target.value })} /></td>
                      <td className="wr-narrow"><button className="wr-del" onClick={() => removeStorePerf(s.id)}>✕</button></td>
                    </tr>,
                  ];
                  if (open) {
                    els.push(
                      <tr key={s.id + "_d"} className="wr-detail-row">
                        <td colSpan={COLS}>
                          <div className="wr-detail">
                            <div className="wr-detail-col">
                              <div className="wr-detail-title">📊 숫자 점검 (전주 대비)</div>
                              <div className="wr-metric-grid">
                                <div className="wr-metric"><span>매출(합계)</span><b>{fmtWon(s.actual)}</b></div>
                                <div className="wr-metric"><span>순매출</span><b>{s.netSales ? fmtWon(s.netSales) : "-"}</b></div>
                                <div className="wr-metric"><span>판매 수량</span><b>{(s.weekQty || 0).toLocaleString()}개</b></div>
                                <div className="wr-metric"><span>판매 건수</span><b>{s.count ? `${s.count.toLocaleString()}건` : "-"}</b></div>
                                <div className="wr-metric"><span>객단가</span><b>{aovOf(s) ? fmtWon(aovOf(s)) : "-"}</b></div>
                                <div className="wr-metric"><span>전주대비</span><b className={down ? "wr-dn" : "wr-up"}>{s.vsLastWeek || "-"}</b></div>
                                <div className="wr-metric wr-metric-head">
                                  <span>인당 매출</span>
                                  <b>{perHeadOf(s) ? fmtWon(perHeadOf(s)) : "-"}</b>
                                  {s.staff && s.staff.length
                                    ? <small className="wr-head-note">근무 {s.staff.length}명</small>
                                    : <label>인원 <input type="number" value={s.headcount || ""} onChange={(e) => setStorePerf(s.id, { headcount: Number(e.target.value) || 0 })} /></label>}
                                </div>
                              </div>
                            </div>
                            <div className="wr-detail-col">
                              <div className="wr-detail-title">🏆 품목별 판매 TOP</div>
                              {s.items && s.items.length ? (
                                <ol className="wr-item-list">
                                  {s.items.map((it: StoreItem, idx: number) => (
                                    <li key={idx}>
                                      <span className="wr-item-rank">{idx + 1}</span>
                                      <span className="wr-item-name">{it.name}</span>
                                      <span className="wr-item-qty">{it.qty.toLocaleString()}개</span>
                                      <span className="wr-item-total">{fmtWon(it.total)}</span>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <div className="wr-item-empty">품목별 엑셀을 업로드하면 이 매장의 상위 품목이 표시됩니다.</div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return els;
                };
                const out: React.ReactNode[] = [];
                rows.filter((r) => r.core).forEach((r) => out.push(...renderRows(r.s, true)));
                if (restCount > 0) {
                  out.push(
                    <tr key="__toggle" className="wr-toggle-row">
                      <td colSpan={COLS}>
                        <button className="wr-toggle-btn" onClick={() => setShowAllStores((v) => !v)}>
                          {showAllStores ? `▲ 그 외 매장 접기` : `▼ 그 외 매장 ${restCount}곳 펼치기`}
                        </button>
                      </td>
                    </tr>
                  );
                }
                if (showAllStores) rows.filter((r) => !r.core).forEach((r) => out.push(...renderRows(r.s, false)));
                return out;
              })()}
            </tbody>
          </table>
          <datalist id="wr-store-names">
            {stores.map((st) => <option key={st.name} value={st.name} />)}
          </datalist>
        </div>
        <div className="wr-row-actions">
          <button className="btn btn-ghost wr-add" onClick={addStorePerf}>+ 매장 추가</button>
          <span className="wr-hint">📥 이카운트(전표별) 엑셀 → 매출·순매출·건수·객단가·품목 / 근무 스케줄 엑셀 → 인당 매출(매출÷근무인원) · 파일 종류 자동 인식 · 매장 펼치면 상세</span>
        </div>
      </div>

      {/* 지점 순위 & 인사이트 */}
      {(() => {
        const withSales = draft.storePerf.filter((s) => s.actual > 0);
        if (!withSales.length) return null;
        const ranked = [...withSales].sort((a, b) => b.actual - a.actual);
        const lines: React.ReactNode[] = [];
        const top = ranked[0];
        lines.push(<>이번 주 매출 1위는 <b>{top.store}</b> — {fmtWon(top.actual)}.</>);
        const withAov = withSales.filter((s) => aovOf(s));
        if (withAov.length >= 2) {
          const hi = [...withAov].sort((a, b) => aovOf(b) - aovOf(a))[0];
          const lo = [...withAov].sort((a, b) => aovOf(a) - aovOf(b))[0];
          if (hi.id !== lo.id) lines.push(<>객단가는 <b>{hi.store}</b> {fmtWon(aovOf(hi))} 최고 / <b>{lo.store}</b> {fmtWon(aovOf(lo))} 최저 — 낮은 곳은 세트·추가판매 점검.</>);
        }
        const withHead = withSales.filter((s) => headcountOf(s));
        if (withHead.length) {
          const hi = [...withHead].sort((a, b) => perHeadOf(b) - perHeadOf(a))[0];
          lines.push(<>인당 매출 최고는 <b>{hi.store}</b> — {fmtWon(perHeadOf(hi))}.</>);
        }
        const drops = withSales.filter((s) => s.vsLastWeek.startsWith("-") && parseInt(s.vsLastWeek) <= -20);
        if (drops.length) lines.push(<span>전주 대비 20%↓ 하락: <b style={{ color: "var(--urgent)" }}>{drops.map((d) => `${d.store}(${d.vsLastWeek})`).join(", ")}</b> — 원인 확인 필요.</span>);
        const conc = withSales.filter((s) => s.items && s.items.length && s.actual)
          .map((s) => ({ s, pct: Math.round((s.items![0].total / s.actual) * 100), item: s.items![0].name }))
          .filter((x) => x.pct >= 50).sort((a, b) => b.pct - a.pct);
        if (conc.length) lines.push(<><b>{conc[0].s.store}</b>는 '{conc[0].item}' 한 품목이 매출의 {conc[0].pct}% — 품목 다변화 검토.</>);

        return (
          <div className="wr-panel">
            <div className="dash-section-title">📊 지점 순위 &amp; 인사이트</div>
            <div className="insight-panel wr-insight">
              {lines.map((l, i) => <div key={i} className="insight-line">{l}</div>)}
            </div>
            <div className="wr-table-wrap">
              <table className="wr-table wr-rank-table">
                <thead>
                  <tr><th className="wr-narrow center">순위</th><th>매장</th><th className="right">매출</th><th className="right">순매출</th><th className="right">건수</th><th className="right">객단가</th><th className="right">인당 매출</th><th className="wr-rank-sp"></th></tr>
                </thead>
                <tbody>
                  {ranked.map((s, i) => (
                    <tr key={s.id}>
                      <td className="wr-narrow center"><span className={`wr-rank ${i < 3 ? "top" : ""}`}>{i + 1}</span></td>
                      <td>{s.store}</td>
                      <td className="wr-num right"><b>{fmtWon(s.actual)}</b></td>
                      <td className="wr-num right">{s.netSales ? fmtWon(s.netSales) : "-"}</td>
                      <td className="wr-num right">{s.count ? s.count.toLocaleString() : "-"}</td>
                      <td className="wr-num right">{aovOf(s) ? fmtWon(aovOf(s)) : "-"}</td>
                      <td className="wr-num right">{perHeadOf(s) ? fmtWon(perHeadOf(s)) : "-"}</td>
                      <td className="wr-rank-sp"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 3. 파트장 보고·이행 체크 */}
      <div className="wr-panel">
        <div className="dash-section-title">2. 파트장 보고·이행 체크 — 보고 미작성·지시 미이행은 명확한 평가 근거 (1회→피드백 / 2주 연속→경고 / 반복→평가 하향)</div>
        <div className="wr-table-wrap">
          <table className="wr-table">
            <thead>
              <tr><th>파트장</th><th>담당 매장</th><th>주간보고 작성</th><th>댓글 피드백</th><th>지시 이행(전주)</th><th>비고</th><th></th></tr>
            </thead>
            <tbody>
              {draft.partLeadChecks.map((p) => (
                <tr key={p.id}>
                  <td><input value={p.partLead} onChange={(e) => setPartLead(p.id, { partLead: e.target.value })} /></td>
                  <td><input value={p.store} onChange={(e) => setPartLead(p.id, { store: e.target.value })} /></td>
                  <td className="wr-narrow center"><input type="checkbox" checked={p.reportWritten} onChange={(e) => setPartLead(p.id, { reportWritten: e.target.checked })} /></td>
                  <td className="wr-narrow center"><input type="checkbox" checked={p.feedback} onChange={(e) => setPartLead(p.id, { feedback: e.target.checked })} /></td>
                  <td className="wr-narrow center"><input type="checkbox" checked={p.compliance} onChange={(e) => setPartLead(p.id, { compliance: e.target.checked })} /></td>
                  <td><input value={p.note} onChange={(e) => setPartLead(p.id, { note: e.target.value })} /></td>
                  <td className="wr-narrow"><button className="wr-del" onClick={() => removePartLead(p.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-ghost wr-add" onClick={addPartLead}>+ 파트장 추가</button>
      </div>

      {/* 4. 결원·채용 현황 */}
      <div className="wr-panel">
        <div className="dash-section-title">3. 결원·채용 현황 (7월 내 전원 충원)</div>
        <div className="wr-table-wrap">
          <table className="wr-table">
            <thead><tr><th>결원 매장</th><th>결원(명)</th><th>충원 진행상황</th><th>완료 목표일</th><th>특이사항</th><th></th></tr></thead>
            <tbody>
              {draft.vacancies.map((v) => (
                <tr key={v.id}>
                  <td><input value={v.store} onChange={(e) => setVacancy(v.id, { store: e.target.value })} /></td>
                  <td className="wr-narrow"><input type="number" value={v.count || ""} onChange={(e) => setVacancy(v.id, { count: Number(e.target.value) || 0 })} /></td>
                  <td><input value={v.progress} onChange={(e) => setVacancy(v.id, { progress: e.target.value })} /></td>
                  <td className="wr-narrow"><input type="date" value={v.targetDate} onChange={(e) => setVacancy(v.id, { targetDate: e.target.value })} /></td>
                  <td><input value={v.note} onChange={(e) => setVacancy(v.id, { note: e.target.value })} /></td>
                  <td className="wr-narrow"><button className="wr-del" onClick={() => removeVacancy(v.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-ghost wr-add" onClick={addVacancy}>+ 결원 매장 추가</button>
      </div>

      {/* 5. 이번 주 액션아이템 */}
      <div className="wr-panel">
        <div className="dash-section-title">4. 이번 주 액션아이템 — 🔴긴급(오늘/내일) · 🟡중요(이번주 내) · 🟢정기(루틴) · ⚪보류(월말 재검토)</div>
        <div className="wr-table-wrap">
          <table className="wr-table">
            <thead><tr><th>완료</th><th>우선순위</th><th>업무 내용</th><th>담당자</th><th>기한</th><th>비고</th><th></th></tr></thead>
            <tbody>
              {draft.actionItems.map((a) => (
                <tr key={a.id} className={a.done ? "wr-row-done" : ""}>
                  <td className="wr-narrow center">
                    <button className={`row-check ${a.done ? "checked" : ""}`} onClick={() => setAction(a.id, { done: !a.done })}>{a.done ? "✓" : ""}</button>
                  </td>
                  <td className="wr-narrow">
                    <select value={a.priority} onChange={(e) => setAction(a.id, { priority: e.target.value })}>
                      {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </td>
                  <td><input value={a.task} onChange={(e) => setAction(a.id, { task: e.target.value })} /></td>
                  <td className="wr-narrow">
                    <select value={a.assignee} onChange={(e) => setAction(a.id, { assignee: e.target.value })}>
                      {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                  </td>
                  <td className="wr-narrow"><input type="date" value={a.deadline} onChange={(e) => setAction(a.id, { deadline: e.target.value })} /></td>
                  <td><input value={a.note} onChange={(e) => setAction(a.id, { note: e.target.value })} /></td>
                  <td className="wr-narrow"><button className="wr-del" onClick={() => removeAction(a.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-ghost wr-add" onClick={addAction}>+ 액션아이템 추가</button>
      </div>

      {/* 6. 다음 주 일정 / 특이사항 */}
      <div className="wr-panel">
        <div className="dash-section-title">다음 주 일정 / 특이사항</div>
        <div className="wr-notes-grid">
          <label>다음 주 일정<textarea value={draft.nextWeekSchedule} onChange={(e) => setDraft((d) => ({ ...d, nextWeekSchedule: e.target.value }))} /></label>
          <label>특이사항<textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} /></label>
          <label>상위 보고 예정<textarea value={draft.reportToMgmt} onChange={(e) => setDraft((d) => ({ ...d, reportToMgmt: e.target.value }))} /></label>
        </div>
      </div>

      <div className="wr-footer">
        {draft.updated_at && <span className="wr-saved">마지막 저장 · {fmtDateTime(draft.updated_at)}{draft.updated_by ? ` · ${draft.updated_by}` : ""}</span>}
        <button className="btn btn-primary" onClick={save}>💾 저장</button>
      </div>
    </section>
  );
}
