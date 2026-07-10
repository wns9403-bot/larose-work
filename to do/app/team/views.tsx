/* ═══ 팀 업무 보드 — 뷰 컴포넌트 ═══ */
"use client";

import React from "react";
import {
  Task, Member, Store, Issue, MemberStat,
  priOf, freqOf, avatarGlyph, memberOf, taskProgress, ymd, daysLeft, dueLabel,
  fmtDate, isOverdue, storeInfo, memberStats, taskUrgencyRank,
  scoreMember, scoreGrade, ROUTINES, DAYS_KR, cleanStore,
} from "./lib";

/* ─── 공용 소품 ─── */
export function Avatar({ m, size = "md" }: { m: Member; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`av av-${size}`} style={{ background: m.color }}>
      {avatarGlyph(m)}
    </span>
  );
}

export function TaskCard({
  t, stores, onEdit, onCycle, onRecheck,
}: {
  t: Task; stores: Store[];
  onEdit: (t: Task) => void; onCycle: (id: string) => void; onRecheck: (id: string) => void;
}) {
  const p = priOf(t.priority);
  const fl = freqOf(t.freq || "비정기");
  const over = isOverdue(t);
  const prog = taskProgress(t);
  const sinfo = storeInfo(stores, t.store);
  return (
    <div className="task-card" onClick={() => onEdit(t)}>
      <div className="tc-top">
        <span className="pri-badge" style={{ color: p.color, background: p.bg }}>{p.label}</span>
        <button
          className={`status-pill sp-${t.status}`}
          onClick={(e) => { e.stopPropagation(); onCycle(t.id); }}
        >
          {t.status}
        </button>
      </div>
      <div className="tc-title">{t.title}</div>
      <div className="tc-meta">
        <span className="mini-tag mt-freq">{fl.label}</span>
        {t.store && t.store !== "-" && <span className="mini-tag mt-store">🏬 {t.store}</span>}
        {sinfo.name && sinfo.partLead && <span className="mini-tag mt-store">파트장 {sinfo.partLead}</span>}
        {t.created_at ? <span className="mini-tag mt-created">✎ {fmtDate(t.created_at)} 등록</span> : null}
        {t.due_date && (
          <span className={`mini-tag mt-due ${over ? "over" : ""}`}>
            📅 {t.due_date.slice(5)} {dueLabel(t.due_date)}
          </span>
        )}
        {t.status === "완료" && (
          <span
            className={`mini-tag mt-recheck ${t.rechecked ? "ok" : ""}`}
            onClick={(e) => { e.stopPropagation(); onRecheck(t.id); }}
          >
            {t.rechecked ? "☑ 리체크 완료" : "□ 리체크 필요"}
          </span>
        )}
      </div>
      <div className="prog-track"><div className="prog-fill" style={{ width: `${prog}%` }} /></div>
      <div className="prog-label">{prog}%</div>
    </div>
  );
}

function DashTaskRow({ t, showAssignee, onEdit }: { t: Task; showAssignee: boolean; onEdit: (t: Task) => void }) {
  const p = priOf(t.priority);
  const due = t.due_date ? ` · ${dueLabel(t.due_date)}` : "";
  const storeText = t.store && t.store !== "-" ? ` · ${t.store}` : "";
  return (
    <div className="dash-task-row" onClick={() => onEdit(t)}>
      <div style={{ minWidth: 0 }}>
        <b>{t.title}</b>
        <span>{showAssignee ? `${t.assignee} · ` : ""}{p.label} · {t.status}{due}{storeText}</span>
      </div>
      <strong>{taskProgress(t)}%</strong>
    </div>
  );
}

function RingChart({ pct, color }: { pct: number; color: string }) {
  const r = 28, cx = 32, cy = 32, sw = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0e8ec" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ.toFixed(2)} strokeDashoffset={offset.toFixed(2)}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  );
}

function RingCardRow({ stats }: { stats: MemberStat[] }) {
  return (
    <div className="ring-row">
      {stats.map((s, i) => (
        <div key={s.member.name} className={`ring-card ${i === 0 ? "leader-card" : ""}`}>
          <div className="ring-wrap">
            <RingChart pct={s.avg} color={s.member.color} />
            <div className="ring-inner">
              <span className="ring-pct" style={{ color: s.member.color }}>{s.avg}%</span>
            </div>
          </div>
          <div className="ring-body">
            <div className="ring-name-row">
              <Avatar m={s.member} size="sm" />
              <span className="ring-name">{s.member.name}</span>
              <span className="ring-role-tag">{s.role}</span>
            </div>
            <div className="ring-chips">
              <span className="rc rc-total">{s.total}개</span>
              {s.waiting > 0 && <span className="rc rc-wait">대기 {s.waiting}</span>}
              <span className="rc rc-prog">진행 {s.doing}</span>
              <span className="rc rc-done">완료 {s.done}</span>
              {s.overdue > 0 && <span className="rc rc-over">지연 {s.overdue}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightPanel({ stats, f }: { stats: MemberStat[]; f: Task[] }) {
  const total = f.length;
  if (!total) return null;
  const lines: React.ReactNode[] = [];
  const avg = Math.round(f.reduce((s, t) => s + taskProgress(t), 0) / total);
  const grade = avg >= 70 ? { t: "양호", c: "var(--routine)" } : avg >= 40 ? { t: "보통", c: "var(--impt)" } : { t: "주의", c: "var(--urgent)" };
  lines.push(<>팀 평균 진행률은 <b style={{ color: grade.c }}>{avg}% ({grade.t})</b> 수준입니다.</>);
  const withTasks = stats.filter((s) => s.total > 0);
  if (withTasks.length >= 2) {
    const top = [...withTasks].sort((a, b) => b.avg - a.avg)[0];
    const low = [...withTasks].sort((a, b) => a.avg - b.avg)[0];
    if (top.member.name !== low.member.name) {
      lines.push(<><b>{top.member.name}</b>님이 {top.avg}%로 가장 앞서 있고, <b>{low.member.name}</b>님이 {low.avg}%로 지원이 필요할 수 있습니다.</>);
    }
  }
  const worstOver = [...stats].sort((a, b) => b.overdue - a.overdue)[0];
  if (worstOver && worstOver.overdue > 0) {
    lines.push(<>지연 업무가 가장 많은 담당자는 <b style={{ color: "var(--urgent)" }}>{worstOver.member.name}({worstOver.overdue}건)</b>입니다. 우선 처리가 필요합니다.</>);
  }
  const noTask = stats.filter((s) => s.total === 0);
  if (noTask.length) lines.push(<>{noTask.map((s) => s.member.name).join(", ")}님은 배정된 업무가 없습니다. 업무 분배를 검토해 보세요.</>);
  const recheck = f.filter((t) => t.status === "완료" && !t.rechecked).length;
  if (recheck) lines.push(<>완료 처리됐지만 아직 리체크되지 않은 업무가 <b>{recheck}건</b> 있습니다.</>);
  return (
    <div className="insight-panel">
      <div className="dash-section-title">💡 업무 처리 인사이트</div>
      {lines.map((l, i) => <div key={i} className="insight-line">{l}</div>)}
    </div>
  );
}

function ComparePanel({ stats }: { stats: MemberStat[] }) {
  return (
    <div className="compare-panel">
      <div className="compare-head">
        <div className="compare-title">팀원별 진행률 비교</div>
        <div className="compare-hint">막대 길이 = 평균 진행률 · 0~100%</div>
      </div>
      {stats.map((s) => {
        const has = s.total > 0;
        return (
          <div key={s.member.name} className="compare-row">
            <div className="compare-name-cell">
              <Avatar m={s.member} size="sm" />
              <span className="compare-name-text">{s.member.name}</span>
            </div>
            {has ? (
              <div className="sbar">
                <div className="sbar-scale" style={{ left: "25%" }} />
                <div className="sbar-scale" style={{ left: "50%" }} />
                <div className="sbar-scale" style={{ left: "75%" }} />
                <div className="sbar-fill" style={{ width: `${s.avg}%`, background: s.member.color }} title={`평균 진행률 ${s.avg}%`} />
              </div>
            ) : (
              <div className="sbar sbar-empty"><span className="sbar-empty-label">배정 업무 없음</span></div>
            )}
            <div>
              <div className="compare-pct">{has ? `${s.avg}%` : "-"}</div>
              {has && <div className="compare-sub">완료 {s.done}/{s.total}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── ① 업무 현황 대시보드 ─── */
export function DashboardView({
  members, tasks, me, onEdit,
}: {
  members: Member[]; tasks: Task[]; me: string; onEdit: (t: Task) => void;
}) {
  const isLeader = me === members[0]?.name;
  const f = isLeader ? tasks : tasks.filter((t) => t.assignee === me);
  const now = new Date();
  const updated = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} 기준`;

  if (!isLeader) {
    /* 개인 대시보드 */
    const m = memberOf(members, me);
    const mi = members.findIndex((x) => x.name === me);
    const todayStr = ymd(new Date());
    const total = f.length;
    const done = f.filter((t) => t.status === "완료").length;
    const doing = f.filter((t) => t.status === "진행중").length;
    const waiting = f.filter((t) => t.status === "대기").length;
    const overdue = f.filter(isOverdue);
    const today = f.filter((t) => (t.freq === "일일" || t.due_date === todayStr) && t.status !== "완료");
    const seen = new Set<string>();
    const focus = [...overdue.sort((a, b) => taskUrgencyRank(a) - taskUrgencyRank(b)),
      ...f.filter((t) => t.status !== "완료").sort((a, b) => taskUrgencyRank(a) - taskUrgencyRank(b) || taskProgress(a) - taskProgress(b))]
      .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
      .slice(0, 5);
    const avg = total ? Math.round(f.reduce((s, t) => s + taskProgress(t), 0) / total) : 0;
    return (
      <section>
        <div className="dash-header">
          <div>
            <div className="dash-title">내 업무 대시보드</div>
            <div className="dash-sub">{me}님의 개인 업무 현황</div>
          </div>
          <div className="dash-updated">{updated}</div>
        </div>
        <div className="personal-hero">
          <div>
            <div className="personal-name">
              <Avatar m={m} size="lg" />
              <div>
                <div className="personal-role">{mi === 0 ? "그룹장" : "매니저 " + mi}</div>
                <div className="personal-title">{me}님, 현재 진행률은 {avg}%입니다</div>
                <div className="personal-copy">
                  {done}/{total}개 완료 · 진행 {doing}개 · 대기 {waiting}개
                  {overdue.length > 0 && <> · <b style={{ color: "#fff" }}>지연 {overdue.length}개</b></>}
                </div>
              </div>
            </div>
            <div className="dash-bar"><div className="dash-bar-fill" style={{ width: `${avg}%` }} /></div>
          </div>
          <div className="personal-percent"><b>{avg}%</b><span>내 업무 진행률</span></div>
        </div>
        <div className="dash-kpis dash-kpis-5">
          <div className="kpi-card"><div className="kpi-label">오늘 할 일</div><div className="kpi-value">{today.length}</div><div className="kpi-sub">일일/오늘 마감</div></div>
          <div className="kpi-card"><div className="kpi-label">대기</div><div className="kpi-value">{waiting}</div><div className="kpi-sub">착수 전</div></div>
          <div className="kpi-card"><div className="kpi-label">진행중</div><div className="kpi-value warn">{doing}</div><div className="kpi-sub">처리 중인 업무</div></div>
          <div className="kpi-card"><div className="kpi-label">지연</div><div className={`kpi-value ${overdue.length ? "danger" : ""}`}>{overdue.length}</div><div className="kpi-sub">마감 초과</div></div>
          <div className="kpi-card"><div className="kpi-label">완료</div><div className="kpi-value good">{done}</div><div className="kpi-sub">{total ? Math.round((done / total) * 100) : 0}% 완료</div></div>
        </div>
        <div className="personal-panels">
          <div className="dash-panel">
            <div className="dash-section-title">오늘 바로 볼 업무</div>
            <div className="dash-task-rows">
              {today.length
                ? today.slice(0, 6).map((t) => <DashTaskRow key={t.id} t={t} showAssignee={false} onEdit={onEdit} />)
                : <div className="dash-task-empty">오늘 표시할 업무가 없습니다.</div>}
            </div>
          </div>
          <div className="dash-panel">
            <div className="dash-section-title">우선 확인할 업무</div>
            <div className="dash-task-rows">
              {focus.length
                ? focus.map((t) => <DashTaskRow key={t.id} t={t} showAssignee={false} onEdit={onEdit} />)
                : <div className="dash-task-empty">확인 필요한 미완료 업무가 없습니다.</div>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* 그룹장 대시보드 */
  const stats = members.map((m, i) => memberStats(m, i, f));
  const total = f.length;
  const done = f.filter((t) => t.status === "완료").length;
  const doing = f.filter((t) => t.status === "진행중").length;
  const waiting = f.filter((t) => t.status === "대기").length;
  const overdue = f.filter(isOverdue).length;
  const avg = total ? Math.round(f.reduce((s, t) => s + taskProgress(t), 0) / total) : 0;
  const attention = f
    .filter((t) => (isOverdue(t) || t.priority === "긴급") && t.status !== "완료")
    .sort((a, b) => taskUrgencyRank(a) - taskUrgencyRank(b) || taskProgress(a) - taskProgress(b))
    .slice(0, 6);

  return (
    <section>
      <div className="dash-header">
        <div>
          <div className="dash-title">팀 업무 현황 대시보드</div>
          <div className="dash-sub">전체 팀원 진행률 · 업무 분포 · 지연 현황</div>
        </div>
        <div className="dash-updated">{updated}</div>
      </div>
      <div className="dash-kpis dash-kpis-5">
        <div className="kpi-card"><div className="kpi-label">팀 전체 진행률</div><div className="kpi-value">{avg}%</div><div className="kpi-sub">{done}/{total}개 완료</div></div>
        <div className="kpi-card"><div className="kpi-label">대기 업무</div><div className="kpi-value">{waiting}</div><div className="kpi-sub">착수 전</div></div>
        <div className="kpi-card"><div className="kpi-label">진행중 업무</div><div className="kpi-value warn">{doing}</div><div className="kpi-sub">현재 처리 중</div></div>
        <div className="kpi-card"><div className="kpi-label">완료 업무</div><div className="kpi-value good">{done}</div><div className="kpi-sub">{total ? Math.round((done / total) * 100) : 0}% 완료</div></div>
        <div className="kpi-card"><div className="kpi-label">지연 업무</div><div className={`kpi-value ${overdue ? "danger" : ""}`}>{overdue}</div><div className="kpi-sub">마감 초과</div></div>
      </div>
      <RingCardRow stats={stats} />
      <InsightPanel stats={stats} f={f} />
      <ComparePanel stats={stats} />
      {attention.length > 0 && (
        <div className="dash-attention">
          <div className="dash-section-title">🚨 즉시 확인 필요 업무 (긴급·지연)</div>
          <div className="dash-task-rows">
            {attention.map((t) => <DashTaskRow key={t.id} t={t} showAssignee onEdit={onEdit} />)}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── ② 팀원별 상세 ─── */
export function TeamDetailView({
  members, tasks, onEdit,
}: { members: Member[]; tasks: Task[]; onEdit: (t: Task) => void }) {
  const stats = members.map((m, i) => memberStats(m, i, tasks));
  const rows = members.map((m) => scoreMember(m, tasks)).sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉"];
  const mvp = rows[0] && rows[0].score > 0 ? rows[0] : null;
  const minScore = Math.min(...rows.map((r) => r.score));

  return (
    <section>
      <div className="dash-header">
        <div>
          <div className="dash-title">팀원별 업무 상세</div>
          <div className="dash-sub">담당자별 진행률 · 업무 현황 · 대표 업무</div>
        </div>
      </div>

      <div className="reward-panel">
        <div className="reward-head">
          <div className="reward-title">🏆 상벌 현황 <span className="reward-period">이번 주 기준</span></div>
          <div className="reward-hint">완료·마감준수·우선순위 = 상점 / 지연·미체크·방치 = 벌점</div>
        </div>
        {mvp && (
          <div className="reward-mvp">
            <span className="reward-mvp-crown">👑</span>
            <div>
              <div className="reward-mvp-name">이주의 MVP · {mvp.member.name}</div>
              <div className="reward-mvp-sub">완료 {mvp.done}건 · 상점 {mvp.plus} / 벌점 {mvp.minus} · 순점수 {mvp.score}점</div>
            </div>
          </div>
        )}
        <div className="reward-rows">
          {rows.map((r, idx) => {
            const gr = scoreGrade(r.score);
            const warn = r.score === minScore && r.score < 0;
            return (
              <div key={r.member.name} className={`reward-row ${warn ? "reward-row-warn" : ""}`}>
                <span className="reward-rank">{idx < 3 ? medals[idx] : idx + 1}</span>
                <Avatar m={r.member} size="sm" />
                <span className="reward-name">
                  {r.member.name}
                  {warn && <span className="reward-caution">주의</span>}
                </span>
                <span className="reward-detail">완료 {r.done}·상 {r.plus}·벌 {r.minus}</span>
                <span className="reward-grade" style={{ color: gr.c, background: gr.bg }}>{gr.g}</span>
                <span className={`reward-score ${r.score < 0 ? "neg" : "pos"}`}>{r.score > 0 ? "+" : ""}{r.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-section-title" style={{ marginBottom: 10 }}>팀원별 업무 카드</div>
      <div className="dash-member-grid">
        {stats.map((s) => (
          <div key={s.member.name} className="member-progress-card">
            <div className="mpc-head">
              <Avatar m={s.member} size="lg" />
              <div className="mpc-info">
                <div className="mpc-role">{s.role}</div>
                <div className="mpc-name">{s.member.name}</div>
              </div>
              <div className="mpc-percent">{s.avg}%</div>
            </div>
            <div className="dash-bar"><div className="dash-bar-fill" style={{ width: `${s.avg}%`, background: s.member.color }} /></div>
            <div className="mpc-meta mpc-meta-5">
              <div className="mpc-chip"><b>{s.total}</b><span>전체</span></div>
              <div className="mpc-chip"><b>{s.waiting}</b><span>대기</span></div>
              <div className="mpc-chip"><b>{s.doing}</b><span>진행</span></div>
              <div className="mpc-chip"><b>{s.done}</b><span>완료</span></div>
              <div className={`mpc-chip ${s.overdue ? "danger" : ""}`}><b>{s.overdue}</b><span>지연</span></div>
            </div>
            <div className="mpc-list">
              {s.active.length ? s.active.map((t) => (
                <div key={t.id} className="mpc-task" onClick={() => onEdit(t)}>
                  <span className="mpc-task-title">{t.title}</span>
                  <span className="mpc-task-pct" style={{ color: s.member.color }}>{taskProgress(t)}%</span>
                </div>
              )) : (
                <div className="mpc-task">
                  <span className="mpc-task-title" style={{ color: "var(--ink3)" }}>
                    {s.total ? "남은 업무 없음 ✓" : "배정 업무 없음"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── ③ 일일 업무 ─── */
export function DailyView({
  members, tasks, stores, viewDate, setViewDate, onEdit, onCycle, onRecheck,
}: {
  members: Member[]; tasks: Task[]; stores: Store[];
  viewDate: Date; setViewDate: (d: Date) => void;
  onEdit: (t: Task) => void; onCycle: (id: string) => void; onRecheck: (id: string) => void;
}) {
  const todayStr = ymd(viewDate);
  const isToday = todayStr === ymd(new Date());
  const wd = ["일", "월", "화", "수", "목", "금", "토"][viewDate.getDay()];
  const daily = tasks.filter((t) => t.freq === "일일" || t.due_date === todayStr);
  const move = (d: number) => { const x = new Date(viewDate); x.setDate(x.getDate() + d); setViewDate(x); };

  return (
    <section>
      <div className="day-header">
        <div>
          <div className="dh-date">{isToday ? "오늘" : "선택한 날짜"} · 일일 업무 현황</div>
          <div className="dh-title">{viewDate.getMonth() + 1}월 {viewDate.getDate()}일 ({wd})</div>
        </div>
        <div className="dh-nav">
          <button className="dh-nav-btn" onClick={() => move(-1)}>◀ 전날</button>
          <button className="dh-nav-btn today-btn" onClick={() => setViewDate(new Date())}>오늘</button>
          <button className="dh-nav-btn" onClick={() => move(1)}>다음날 ▶</button>
        </div>
      </div>
      <div className="daily-grid">
        {members.map((m) => {
          const list = daily.filter((t) => t.assignee === m.name)
            .sort((a, b) => priOf(a.priority).rank - priOf(b.priority).rank);
          const done = list.filter((t) => t.status === "완료").length;
          return (
            <div key={m.name} className="daily-col">
              <div className="dc-head">
                <Avatar m={m} size="md" />
                <span className="dc-name">{m.name}</span>
                <div className="dc-stats">
                  <span className="dc-done">{done}완료</span>
                  <span className="dc-total">/ {list.length}</span>
                </div>
              </div>
              <div className="dc-body">
                {list.length ? list.map((t) => (
                  <TaskCard key={t.id} t={t} stores={stores} onEdit={onEdit} onCycle={onCycle} onRecheck={onRecheck} />
                )) : (
                  <div className="dc-empty">
                    <div className="dc-empty-icon">✅</div>
                    <div className="dc-empty-text">오늘 업무 없음</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── ④ 주간 업무 ─── */
export function WeeklyView({
  members, tasks, viewDate, setViewDate, onEdit,
}: {
  members: Member[]; tasks: Task[];
  viewDate: Date; setViewDate: (d: Date) => void; onEdit: (t: Task) => void;
}) {
  const base = new Date(viewDate);
  const dow = (base.getDay() + 6) % 7;
  const monday = new Date(base); monday.setDate(base.getDate() - dow);
  const dateOf = (i: number) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; };
  const todayStr = ymd(new Date());
  const move = (d: number) => { const x = new Date(viewDate); x.setDate(x.getDate() + d); setViewDate(x); };

  return (
    <section>
      <div className="week-header">
        <div>
          <div className="wh-period">{monday.getMonth() + 1}월 {monday.getDate()}일 – {dateOf(4).getMonth() + 1}월 {dateOf(4).getDate()}일</div>
          <div className="wh-sub">주간 업무 일정 · 고정 루틴 포함</div>
        </div>
        <div className="wh-nav">
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => move(-7)}>◀ 전주</button>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => setViewDate(new Date())}>이번 주</button>
          <button className="btn btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => move(7)}>다음주 ▶</button>
        </div>
      </div>
      <div className="weekly-board">
        {/* 모바일: 요일별 카드 (가로 스크롤 표 대신) */}
        <div className="wk-mobile">
          {DAYS_KR.map((d, i) => {
            const dt = dateOf(i);
            const dayStr = ymd(dt);
            const isT = dayStr === todayStr;
            const dayMembers = members
              .map((m) => ({
                member: m,
                items: tasks.filter((t) => t.assignee === m.name && (t.freq === "일일" || t.due_date === dayStr)),
              }))
              .filter((x) => x.items.length);
            return (
              <div key={d} className={`wk-day-card ${isT ? "today" : ""}`}>
                <div className="wk-day-head">
                  <span className="wk-day-name">{d}</span>
                  <span className="wk-day-date">{dt.getMonth() + 1}/{dt.getDate()}{isT ? " · 오늘" : ""}</span>
                </div>
                <div className="wk-day-routine">📌 {ROUTINES[d]}</div>
                {dayMembers.length ? dayMembers.map(({ member, items }) => (
                  <div key={member.name} className="wk-day-member">
                    <div className="wk-day-member-head">
                      <Avatar m={member} size="sm" />
                      <span>{member.name}</span>
                    </div>
                    <div className="wk-day-tasks">
                      {items.map((t) => {
                        const p = priOf(t.priority);
                        return (
                          <div key={t.id} className="wk-task-item" style={{ borderLeftColor: p.color }} onClick={() => onEdit(t)}>
                            <div className="wt-title">{t.title}</div>
                            <small>{p.label} · {t.status}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )) : <div className="wk-day-empty">예정된 업무가 없습니다</div>}
              </div>
            );
          })}
        </div>
        {/* 데스크톱: 담당자 × 요일 표 */}
        <div className="wk-scroll">
          <div className="wk-table">
            <div className="wk-corner">담당자</div>
            {DAYS_KR.map((d, i) => {
              const dt = dateOf(i);
              const isT = ymd(dt) === todayStr;
              return (
                <div key={d} className={`wk-th ${isT ? "today-col" : ""}`}>
                  <span className="th-day">{d}</span>
                  <span className="th-date">{dt.getMonth() + 1}/{dt.getDate()}{isT ? " · 오늘" : ""}</span>
                </div>
              );
            })}
            <div className="wk-label-cell">
              <span className="av av-sm" style={{ background: "var(--rose)" }}>루</span>
              <span className="wk-label-name">고정 루틴</span>
            </div>
            {DAYS_KR.map((d) => (
              <div key={`r-${d}`} className="wk-cell"><span className="routine-chip">{ROUTINES[d]}</span></div>
            ))}
            {members.map((m) => (
              <React.Fragment key={m.name}>
                <div className="wk-label-cell">
                  <Avatar m={m} size="sm" />
                  <span className="wk-label-name">{m.name}</span>
                </div>
                {DAYS_KR.map((d, i) => {
                  const dayStr = ymd(dateOf(i));
                  const isT = dayStr === todayStr;
                  const items = tasks.filter((t) => t.assignee === m.name && (t.freq === "일일" || t.due_date === dayStr));
                  return (
                    <div key={`${m.name}-${d}`} className={`wk-cell ${isT ? "today-col" : ""}`}>
                      {items.map((t) => {
                        const p = priOf(t.priority);
                        return (
                          <div key={t.id} className="wk-task-item" style={{ borderLeftColor: p.color }} onClick={() => onEdit(t)}>
                            <div className="wt-title">{t.title}</div>
                            <small>{p.label} · {t.status}</small>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="wk-note">📌 마감일 기준으로 해당 요일에 표시 · 일일 업무는 매일 표시됩니다</div>
      </div>
    </section>
  );
}

/* ─── ⑤ 월간 캘린더 ─── */
export function MonthlyView({
  members, tasks, viewMonth, setViewMonth, onEdit,
}: {
  members: Member[]; tasks: Task[];
  viewMonth: Date; setViewMonth: (d: Date) => void; onEdit: (t: Task) => void;
}) {
  const yr = viewMonth.getFullYear(), mo = viewMonth.getMonth();
  const todayStr = ymd(new Date());
  const firstDay = new Date(yr, mo, 1);
  const lastDay = new Date(yr, mo + 1, 0);
  const sundayStart = firstDay.getDay();

  const byDate: Record<string, Task[]> = {};
  tasks.filter((t) => t.freq !== "일일").forEach((t) => {
    if (!t.due_date) return;
    (byDate[t.due_date] = byDate[t.due_date] || []).push(t);
  });
  const dailyList = tasks.filter((t) => t.freq === "일일");
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const key = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (dailyList.length) {
      byDate[key] = byDate[key] || [];
      dailyList.forEach((t) => { if (!byDate[key].find((x) => x.id === t.id)) byDate[key].push(t); });
    }
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < sundayStart; i++) {
    const pd = new Date(yr, mo, 1 - sundayStart + i);
    cells.push(<div key={`p${i}`} className="cal-cell other"><span className="cal-date">{pd.getDate()}</span></div>);
  }
  const LIMIT = 3;
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dw = new Date(yr, mo, d).getDay();
    const isT = dateStr === todayStr;
    const dtasks = byDate[dateStr] || [];
    cells.push(
      <div key={dateStr} className={`cal-cell ${isT ? "today" : ""} ${dw === 0 ? "sun" : ""} ${dw === 6 ? "sat" : ""}`}>
        <span className="cal-date">{d}</span>
        {dtasks.slice(0, LIMIT).map((t) => {
          const m = memberOf(members, t.assignee);
          const p = priOf(t.priority);
          return (
            <span
              key={t.id} className="cal-evt"
              title={`${t.title} · ${t.assignee} · ${p.label}`}
              style={{ background: `${m.color}22`, borderLeftColor: m.color }}
              onClick={() => onEdit(t)}
            >
              <span className="cal-evt-dot" style={{ background: p.color }} />
              <span className="cal-evt-text" style={{ color: m.color }}>{t.title}</span>
            </span>
          );
        })}
        {dtasks.length > LIMIT && <span className="cal-more">+{dtasks.length - LIMIT}개 더</span>}
      </div>
    );
  }
  const totalCells = sundayStart + lastDay.getDate();
  const remain = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remain; i++) {
    cells.push(<div key={`n${i}`} className="cal-cell other"><span className="cal-date">{i}</span></div>);
  }
  const moveMonth = (d: number) => setViewMonth(new Date(yr, mo + d, 1));

  return (
    <section>
      <div className="month-header">
        <div>
          <span className="mh-month">{mo + 1}월</span>
          <span className="mh-year">{yr}년</span>
        </div>
        <div className="mh-nav">
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 11px" }} onClick={() => moveMonth(-1)}>◀ 이전</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 11px" }} onClick={() => setViewMonth(new Date())}>이번달</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 11px" }} onClick={() => moveMonth(1)}>다음 ▶</button>
        </div>
      </div>
      <div className="cal-board">
        <div className="cal-week-head">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => <div key={d} className="cwh-cell">{d}</div>)}
        </div>
        <div className="cal-grid">{cells}</div>
        <div className="cal-legend">
          {members.map((m) => (
            <div key={m.name} className="leg-item">
              <span className="leg-dot" style={{ background: m.color }} />
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── ⑥ 담당 매장 대시보드 ─── */
export function StoresView({
  stores, tasks, issues, storeFilter, isLeader,
  onStoreClick, onOpenIssues, onOpenSettings,
}: {
  stores: Store[]; tasks: Task[]; issues: Issue[]; storeFilter: string; isLeader: boolean;
  onStoreClick: (name: string) => void; onOpenIssues: (name: string) => void; onOpenSettings: () => void;
}) {
  const owned = stores.filter((s) => s.owner);
  const ownerNames = [...new Set(owned.map((s) => s.owner))];
  const groups = ownerNames.map((owner) => ({ owner, stores: owned.filter((s) => s.owner === owner) }));
  const withPart = owned.filter((s) => s.partLead).length;

  const storeStats = (name: string) => {
    const list = tasks.filter((t) => (name === "all" ? cleanStore(t.store) !== "" : cleanStore(t.store) === name));
    const total = list.length;
    const done = list.filter((t) => t.status === "완료").length;
    const overdue = list.filter(isOverdue).length;
    const avg = total ? Math.round(list.reduce((s, t) => s + taskProgress(t), 0) / total) : 0;
    return { total, done, overdue, avg };
  };
  const totalStats = storeStats("all");

  if (!owned.length) {
    return (
      <section>
        <div className="store-dash-header">
          <div>
            <div className="store-dash-title">담당 매장 대시보드</div>
            <div className="store-dash-sub">등록된 매장이 없습니다.</div>
          </div>
          {isLeader && <button className="btn btn-primary" onClick={onOpenSettings}>매장 추가</button>}
        </div>
        <div className="store-empty">매장/파트장을 먼저 등록해 주세요.</div>
      </section>
    );
  }

  return (
    <section>
      <div className="store-dash-header">
        <div>
          <div className="store-dash-title">담당 매장 대시보드</div>
          <div className="store-dash-sub">담당자별 매장, 파트장, 업무 진행 현황</div>
        </div>
        {isLeader && <button className="btn btn-ghost" onClick={onOpenSettings}>매장/파트장 편집</button>}
      </div>
      <div className="store-kpis">
        <div className="kpi-card"><div className="kpi-label">전체 매장</div><div className="kpi-value">{owned.length}</div><div className="kpi-sub">{groups.length}명 담당</div></div>
        <div className="kpi-card"><div className="kpi-label">파트장 등록</div><div className="kpi-value good">{withPart}</div><div className="kpi-sub">{owned.length - withPart}개 미지정</div></div>
        <div className="kpi-card"><div className="kpi-label">연결 업무</div><div className="kpi-value">{totalStats.total}</div><div className="kpi-sub">{totalStats.done}개 완료</div></div>
        <div className="kpi-card"><div className="kpi-label">평균 진행률</div><div className={`kpi-value ${totalStats.overdue ? "warn" : ""}`}>{totalStats.avg}%</div><div className="kpi-sub">지연 {totalStats.overdue}개</div></div>
      </div>
      {groups.map((g) => {
        const ownerTasks = tasks.filter((t) => g.stores.some((s) => s.name === cleanStore(t.store)));
        const avg = ownerTasks.length ? Math.round(ownerTasks.reduce((s, t) => s + taskProgress(t), 0) / ownerTasks.length) : 0;
        return (
          <div key={g.owner} className="store-owner-section">
            <div className="store-owner-section-head">
              <div className="store-owner-node">
                <span className="av av-md">{(g.owner || "?").slice(0, 2)}</span>
                <span>{g.owner}</span>
              </div>
              <div className="store-owner-section-meta">{g.stores.length}개 매장 · 업무 {ownerTasks.length}개 · 평균 {avg}%</div>
            </div>
            <div className="store-org-trunk" />
            <div className="store-card-grid">
              {g.stores.map((s) => {
                const stat = storeStats(s.name);
                const openIssues = issues.filter((x) => x.store === s.name && x.status !== "해결완료").length;
                return (
                  <div key={s.name} className={`store-card ${storeFilter === s.name ? "on" : ""}`} onClick={() => onStoreClick(s.name)}>
                    <div className="store-card-top">
                      <div className="store-card-name-wrap">
                        <div className="store-card-name">{s.name}</div>
                        <div className={`store-card-part ${s.partLead ? "" : "store-card-part-empty"}`}>파트장 {s.partLead || "미지정"}</div>
                      </div>
                      <div className="store-card-pct">{stat.avg}%</div>
                    </div>
                    <div className="store-card-meta">
                      <span className="store-card-tag">업무 {stat.total}개</span>
                      <span className="store-card-tag">완료 {stat.done}개</span>
                      {stat.overdue > 0 && <span className="store-card-tag warn">지연 {stat.overdue}개</span>}
                    </div>
                    <div className="store-card-bar"><div className="store-card-fill" style={{ width: `${stat.avg}%` }} /></div>
                    <button
                      className={`store-issue-btn ${openIssues ? "has-issue" : ""}`}
                      onClick={(e) => { e.stopPropagation(); onOpenIssues(s.name); }}
                    >
                      {openIssues ? `⚠ 이슈 ${openIssues}건 보기` : "이슈 관리"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
