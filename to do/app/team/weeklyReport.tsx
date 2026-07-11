/* ═══ 주간회의 점검표 — 롯데 영업관리팀 ═══ */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Member, Store, WeeklyReport, StorePerf, PartLeadCheck, Vacancy, ActionItem,
  PRIORITIES, CORE_STORES, ymd, mondayOf, achievementRate, changeRate, defaultWeeklyReport, rid, fmtDateTime,
  parseEcountRows, aggregateEcount, mergeEcountIntoReport, fmtWon, normStoreName,
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

  /* ─── 이카운트 매출 업로드 ─── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [upInfo, setUpInfo] = useState<string>("");
  const [showAllStores, setShowAllStores] = useState(false);
  const onUpload = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }) as unknown[][];
      const daily = parseEcountRows(rows);
      if (!daily.length) {
        setUpInfo("⚠ 인식된 매출 데이터가 없습니다. 이카운트 [판매현황] 엑셀인지 확인해주세요.");
        return;
      }
      const dates = daily.map((d) => d.date).sort();
      const aggs = aggregateEcount(daily, weekDate);
      const sun = new Date(weekDate); sun.setDate(weekDate.getDate() + 6);
      const hit = aggs.filter((a) => a.weekTotal > 0).length;
      setDraft((d) => mergeEcountIntoReport(d, aggs));
      setUpInfo(
        `✅ ${dates[0]} ~ ${dates[dates.length - 1]} 자료 · 매장 ${aggs.length}곳 · ` +
        `${ymd(weekDate).slice(5)}~${ymd(sun).slice(5)} 주간 실적 ${hit}곳 반영 (저장 버튼을 눌러 확정)`
      );
    } catch (e) {
      setUpInfo("⚠ 파일을 읽지 못했습니다: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ─── 요약 KPI ─── */
  const rates = draft.storePerf.map((s) => achievementRate(s.target, s.actual));
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

      {/* 1. 핵심매장 주간 실적 */}
      <div className="wr-panel">
        <div className="wr-section-head">
          <div className="dash-section-title">1. 핵심매장 주간 실적 — 달성률 80% 미만은 원인·대응 필수, 목표 임의 하향 금지</div>
          <div className="wr-upload-wrap">
            <input
              ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
            />
            <button className="btn btn-primary wr-upload-btn" onClick={() => fileRef.current?.click()}>
              📥 이카운트 매출 업로드
            </button>
          </div>
        </div>
        {upInfo && <div className={`wr-upload-info ${upInfo.startsWith("⚠") ? "err" : ""}`}>{upInfo}</div>}
        <div className="wr-table-wrap">
          <table className="wr-table">
            <thead>
              <tr>
                <th>매장</th><th>등급</th><th>주간 목표</th><th>주간 실적</th><th>당월 누계</th><th>달성률</th>
                <th>전주대비</th><th>파트장 보고(월)</th><th>원인·대응 (미달 시)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const coreNorms = new Set(CORE_STORES.map(normStoreName));
                const rows = draft.storePerf.map((s) => ({ s, core: coreNorms.has(normStoreName(s.store)) }));
                const restCount = rows.filter((r) => !r.core).length;
                const renderRow = (s: StorePerf, core: boolean) => {
                  const rate = achievementRate(s.target, s.actual);
                  const rc = rateColor(rate);
                  return (
                    <tr key={s.id} className={core ? "wr-core-row" : ""}>
                      <td>
                        {core && <span className="wr-core-tag">핵심</span>}
                        <input list="wr-store-names" value={s.store} onChange={(e) => setStorePerf(s.id, { store: e.target.value })} />
                      </td>
                      <td className="wr-narrow"><input value={s.grade} onChange={(e) => setStorePerf(s.id, { grade: e.target.value })} placeholder="S/A/B" /></td>
                      <td className="wr-num"><input type="number" value={s.target || ""} onChange={(e) => setStorePerf(s.id, { target: Number(e.target.value) || 0 })} /></td>
                      <td className="wr-num"><input type="number" value={s.actual || ""} onChange={(e) => setStorePerf(s.id, { actual: Number(e.target.value) || 0 })} /></td>
                      <td className="wr-num right">
                        <span className="wr-month">{s.monthActual ? fmtWon(s.monthActual) : "-"}</span>
                        {s.weekQty ? <small className="wr-qty">{s.weekQty}개</small> : null}
                      </td>
                      <td className="wr-narrow"><span className="wr-rate-badge" style={{ color: rc.color, background: rc.bg }}>{rate}%</span></td>
                      <td className="wr-narrow"><input value={s.vsLastWeek} onChange={(e) => setStorePerf(s.id, { vsLastWeek: e.target.value })} placeholder="+/-" /></td>
                      <td className="wr-narrow center"><input type="checkbox" checked={s.partLeadReport} onChange={(e) => setStorePerf(s.id, { partLeadReport: e.target.checked })} /></td>
                      <td><input value={s.cause} onChange={(e) => setStorePerf(s.id, { cause: e.target.value })} /></td>
                      <td className="wr-narrow"><button className="wr-del" onClick={() => removeStorePerf(s.id)}>✕</button></td>
                    </tr>
                  );
                };
                const out: React.ReactNode[] = [];
                rows.filter((r) => r.core).forEach((r) => out.push(renderRow(r.s, true)));
                if (restCount > 0) {
                  out.push(
                    <tr key="__toggle" className="wr-toggle-row">
                      <td colSpan={10}>
                        <button className="wr-toggle-btn" onClick={() => setShowAllStores((v) => !v)}>
                          {showAllStores ? `▲ 그 외 매장 접기` : `▼ 그 외 매장 ${restCount}곳 펼치기`}
                        </button>
                      </td>
                    </tr>
                  );
                }
                if (showAllStores) rows.filter((r) => !r.core).forEach((r) => out.push(renderRow(r.s, false)));
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
          <span className="wr-hint">📥 이카운트 [판매현황] 엑셀을 올리면 선택한 주 기준으로 주간 실적·당월 누계·전주대비가 자동 계산됩니다 (목표는 직접 입력)</span>
        </div>
      </div>

      {/* 2. 주간 숫자 점검 */}
      <div className="wr-panel">
        <div className="dash-section-title">2. 주간 숫자 점검 (전주 대비) — 컨디션·갈등·트래픽은 점검 제외</div>
        <div className="wr-split">
          <div className="wr-table-wrap">
            <table className="wr-table">
              <thead><tr><th>지표</th><th>전주</th><th>금주</th><th>증감률</th></tr></thead>
              <tbody>
                {draft.metrics.map((m, i) => {
                  const cr = changeRate(m.lastWeek, m.thisWeek);
                  return (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      <td className="wr-narrow"><input type="number" value={m.lastWeek || ""} onChange={(e) => setDraft((d) => { const metrics = [...d.metrics]; metrics[i] = { ...metrics[i], lastWeek: Number(e.target.value) || 0 }; return { ...d, metrics }; })} /></td>
                      <td className="wr-narrow"><input type="number" value={m.thisWeek || ""} onChange={(e) => setDraft((d) => { const metrics = [...d.metrics]; metrics[i] = { ...metrics[i], thisWeek: Number(e.target.value) || 0 }; return { ...d, metrics }; })} /></td>
                      <td className="wr-narrow"><span className={`wr-rate-badge ${cr >= 0 ? "up" : "down"}`}>{cr > 0 ? "+" : ""}{cr}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="wr-table-wrap">
            <table className="wr-table">
              <thead><tr><th>핵심제품</th><th>주간 판매량</th><th>순위권</th><th>이탈 시 조치</th></tr></thead>
              <tbody>
                {draft.products.map((p, i) => (
                  <tr key={p.key}>
                    <td>{p.label}</td>
                    <td className="wr-narrow"><input type="number" value={p.qty || ""} onChange={(e) => setDraft((d) => { const products = [...d.products]; products[i] = { ...products[i], qty: Number(e.target.value) || 0 }; return { ...d, products }; })} /></td>
                    <td className="wr-narrow"><input value={p.rank} onChange={(e) => setDraft((d) => { const products = [...d.products]; products[i] = { ...products[i], rank: e.target.value }; return { ...d, products }; })} /></td>
                    <td><input value={p.action} onChange={(e) => setDraft((d) => { const products = [...d.products]; products[i] = { ...products[i], action: e.target.value }; return { ...d, products }; })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="wr-note">※ 순위권 이탈 시 확인: ①고객 제안 ②판매루틴 숙지 ③제품 설명 ④체험→구매 연결 ⑤세트·추가판매 → 교육으로 연결</div>
      </div>

      {/* 3. 파트장 보고·이행 체크 */}
      <div className="wr-panel">
        <div className="dash-section-title">3. 파트장 보고·이행 체크 — 보고 미작성·지시 미이행은 명확한 평가 근거 (1회→피드백 / 2주 연속→경고 / 반복→평가 하향)</div>
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
        <div className="dash-section-title">4. 결원·채용 현황 (7월 내 전원 충원)</div>
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
        <div className="dash-section-title">5. 이번 주 액션아이템 — 🔴긴급(오늘/내일) · 🟡중요(이번주 내) · 🟢정기(루틴) · ⚪보류(월말 재검토)</div>
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
