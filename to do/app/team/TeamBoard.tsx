/* ═══ 팀 업무 보드 — 메인 (Supabase 실시간 + 로그인 + 감사 로그) ═══ */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./team.css";
import {
  Task, Member, Store, Issue, ArchiveEntry, Activity, WeeklyReport,
  DEFAULT_MEMBERS, DEFAULT_STORES, PRIORITIES,
  normalizeStoreRow, taskProgress, ymd, weekKey, cleanStore, alertTasks,
} from "./lib";
import {
  loadAll, saveDataset, logActivity, loadActivity, subscribeRealtime, getClient, DatasetName,
} from "./db";
import {
  DashboardView, TeamDetailView, DailyView, WeeklyView, MonthlyView, StoresView,
} from "./views";
import { WeeklyReportView } from "./weeklyReport";
import {
  TaskModal, MemberSettingsModal, StoreSettingsModal, IssueModal,
  ArchiveModal, WeeklyAlertModal, ActivityModal, LoginGate,
} from "./modals";

const LS_SESSION = "larose_session_v1";
const LS_WEEKALERT = "larose_week_alert_v1";

type TabKey = "dashboard" | "team" | "daily" | "weekly" | "monthly" | "stores" | "weeklyReport";
const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: "dashboard", icon: "📊", label: "대시보드" },
  { key: "team", icon: "👥", label: "팀원별" },
  { key: "daily", icon: "📋", label: "일일" },
  { key: "weekly", icon: "📅", label: "주간" },
  { key: "monthly", icon: "🗓", label: "월간" },
  { key: "stores", icon: "🏬", label: "매장" },
  { key: "weeklyReport", icon: "📝", label: "주간점검" },
];
const TAB_FULL: Record<TabKey, string> = {
  dashboard: "업무 현황 대시보드", team: "팀원별 상세", daily: "일일 업무",
  weekly: "주간 업무", monthly: "월간 캘린더", stores: "담당 매장 대시보드",
  weeklyReport: "주간회의 점검표",
};

export default function TeamBoard() {
  /* ─── 데이터 상태 ─── */
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [live, setLive] = useState(false);

  /* ─── 세션/뷰 상태 ─── */
  const [me, setMe] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [priFilter, setPriFilter] = useState("all");
  const [onlyMine, setOnlyMine] = useState(false);
  const [storeFilter, setStoreFilter] = useState("all");
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());

  /* ─── 모달 상태 ─── */
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [memberModal, setMemberModal] = useState(false);
  const [storeModal, setStoreModal] = useState(false);
  const [issueModal, setIssueModal] = useState<string | null>(null);
  const [archiveModal, setArchiveModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [weeklyAlert, setWeeklyAlert] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isLeader = me !== null && members.length > 0 && me === members[0].name;

  /* 마감 임박 알림 대상 업무 (그룹장=전체, 매니저=본인 담당) */
  const alertList = useMemo(() => alertTasks(tasks, me, isLeader), [tasks, me, isLeader]);

  /* ─── 초기 로드 ─── */
  useEffect(() => {
    (async () => {
      const d = await loadAll();
      if (d) {
        if (Array.isArray(d.members) && d.members.length) {
          setMembers(DEFAULT_MEMBERS.map((dm, i) => ({
            name: d.members![i]?.name || dm.name,
            color: d.members![i]?.color || dm.color,
            icon: d.members![i]?.icon || "",
            pin: d.members![i]?.pin || "1234",
          })));
        } else saveDataset("members", DEFAULT_MEMBERS);
        if (Array.isArray(d.stores)) setStores(d.stores.map(normalizeStoreRow).filter((x) => x.name));
        else saveDataset("stores", DEFAULT_STORES);
        if (Array.isArray(d.tasks)) setTasks(d.tasks);
        else saveDataset("tasks", []);
        if (Array.isArray(d.issues)) setIssues(d.issues);
        if (Array.isArray(d.archive)) setArchive(d.archive);
        if (Array.isArray(d.weeklyReports)) setWeeklyReports(d.weeklyReports);
      }
      setActivity(await loadActivity());
      /* 세션 복원 */
      try {
        const s = localStorage.getItem(LS_SESSION);
        if (s) {
          const sess = JSON.parse(s);
          if (sess && sess.name) setMe(sess.name);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  /* ─── 실시간 구독 ─── */
  useEffect(() => {
    const off = subscribeRealtime(
      (name: DatasetName, arr) => {
        if (name === "tasks") setTasks(arr as Task[]);
        else if (name === "members") setMembers((prev) =>
          DEFAULT_MEMBERS.map((dm, i) => {
            const nm = (arr as Member[])[i];
            return nm ? { name: nm.name || dm.name, color: nm.color || dm.color, icon: nm.icon || "", pin: nm.pin || "1234" } : prev[i] || dm;
          }));
        else if (name === "stores") setStores((arr as Store[]).map(normalizeStoreRow).filter((x) => x.name));
        else if (name === "issues") setIssues(arr as Issue[]);
        else if (name === "archive") setArchive(arr as ArchiveEntry[]);
        else if (name === "weeklyReports") setWeeklyReports(arr as WeeklyReport[]);
      },
      (row) => setActivity((prev) => [row, ...prev].slice(0, 100)),
      (connected) => setLive(connected)
    );
    return off;
  }, []);

  /* 세션 유효성: 팀원 이름이 바뀌면 다시 로그인 */
  useEffect(() => {
    if (me && loaded && !members.find((m) => m.name === me)) {
      setMe(null);
      localStorage.removeItem(LS_SESSION);
    }
  }, [members, me, loaded]);

  /* 마감 임박 자동 알림 (로그인 후 주 1회, 임박·지연 업무가 있을 때만) */
  useEffect(() => {
    if (!me || !loaded) return;
    const key = weekKey();
    if (localStorage.getItem(LS_WEEKALERT) !== key && alertTasks(tasks, me, isLeader).length > 0) {
      localStorage.setItem(LS_WEEKALERT, key);
      const t = setTimeout(() => setWeeklyAlert(true), 600);
      return () => clearTimeout(t);
    }
  }, [me, loaded, tasks, isLeader]);

  /* ─── 저장 헬퍼 (상태 + DB + 감사 로그) ─── */
  const commitTasks = useCallback((next: Task[], action: string, target?: string) => {
    setTasks(next);
    saveDataset("tasks", next);
    if (me) logActivity(me, action, target);
  }, [me]);

  /* ─── 업무 뮤테이션 ─── */
  const saveTask = (t: Task) => {
    const exists = tasks.some((x) => x.id === t.id);
    const next = exists ? tasks.map((x) => (x.id === t.id ? t : x)) : [...tasks, t];
    commitTasks(next, exists ? "업무를 수정했습니다" : "업무를 추가했습니다", t.title);
    setTaskModal({ open: false, task: null });
  };
  const deleteTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    commitTasks(tasks.filter((x) => x.id !== id), "업무를 삭제했습니다", t?.title);
    setTaskModal({ open: false, task: null });
  };
  const cycleStatus = (id: string) => {
    const order = ["대기", "진행중", "완료"];
    let title = "", status = "";
    const next = tasks.map((t) => {
      if (t.id !== id) return t;
      const s = order[(order.indexOf(t.status) + 1) % 3];
      title = t.title; status = s;
      return {
        ...t, status: s,
        progress: s === "완료" ? 100 : s === "대기" ? 0 : t.progress,
        rechecked: false, updated_at: Date.now(), updated_by: me || undefined,
      };
    });
    commitTasks(next, `업무 상태를 '${status}'로 변경했습니다`, title);
  };
  const completeTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const toComplete = target.status !== "완료";
    const next = tasks.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t, status: toComplete ? "완료" : "대기",
        progress: toComplete ? 100 : 0,
        rechecked: false, updated_at: Date.now(), updated_by: me || undefined,
      };
    });
    commitTasks(next, toComplete ? "업무를 완료 처리했습니다" : "완료 처리를 취소했습니다", target.title);
  };
  const recheckTask = (id: string) => {
    let title = "", now = false;
    const next = tasks.map((t) => {
      if (t.id !== id || t.status !== "완료") return t;
      title = t.title; now = !t.rechecked;
      return { ...t, rechecked: now, rechecked_at: now ? Date.now() : null, updated_at: Date.now(), updated_by: me || undefined };
    });
    commitTasks(next, now ? "리체크를 완료했습니다" : "리체크를 해제했습니다", title);
  };

  /* ─── 팀원 저장 (이름 교체 시 백업) ─── */
  const saveMembers = (next: Member[]) => {
    const renamed: [Member, string][] = [];
    members.forEach((old, i) => {
      const nn = next[i]?.name;
      if (nn && nn !== old.name && tasks.some((t) => t.assignee === old.name)) renamed.push([old, nn]);
    });
    if (renamed.length) {
      const newArchive = [...archive];
      renamed.forEach(([old, nn]) => {
        const snapshot = tasks.filter((t) => t.assignee === old.name).map((t) => ({ ...t }));
        newArchive.unshift({
          id: "ar_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          name: old.name, color: old.color, icon: old.icon || "",
          reason: `이름 변경 · ${nn}(으)로 교체`, archivedAt: Date.now(),
          taskCount: snapshot.length,
          doneCount: snapshot.filter((t) => t.status === "완료").length,
          tasks: snapshot,
        });
      });
      setArchive(newArchive);
      saveDataset("archive", newArchive);
    }
    /* 업무 담당자 이름 이관 */
    const nameMap = new Map(members.map((m, i) => [m.name, next[i]?.name || m.name]));
    const migrated = tasks.map((t) => nameMap.has(t.assignee) ? { ...t, assignee: nameMap.get(t.assignee)! } : t);
    if (JSON.stringify(migrated) !== JSON.stringify(tasks)) {
      setTasks(migrated); saveDataset("tasks", migrated);
    }
    setMembers(next);
    saveDataset("members", next);
    if (me) {
      logActivity(me, "팀 구성 설정을 변경했습니다");
      const myNew = nameMap.get(me);
      if (myNew && myNew !== me) {
        setMe(myNew);
        localStorage.setItem(LS_SESSION, JSON.stringify({ name: myNew, ts: Date.now() }));
      }
    }
    setMemberModal(false);
  };

  /* ─── 매장 저장 ─── */
  const saveStores = (next: Store[], renames: [string, string][]) => {
    if (renames.length) {
      const migrated = tasks.map((t) => {
        const r = renames.find(([oldN]) => cleanStore(t.store) === oldN);
        return r ? { ...t, store: r[1] } : t;
      });
      setTasks(migrated); saveDataset("tasks", migrated);
    }
    setStores(next);
    saveDataset("stores", next);
    if (storeFilter !== "all" && !next.find((s) => s.name === storeFilter)) setStoreFilter("all");
    if (me) logActivity(me, "매장/파트장 설정을 변경했습니다");
    setStoreModal(false);
  };

  /* ─── 이슈 ─── */
  const addIssue = (issue: Issue) => {
    const next = [...issues, issue];
    setIssues(next); saveDataset("issues", next);
    if (me) logActivity(me, "매장 이슈를 등록했습니다", `${issue.store} · ${issue.title}`);
  };
  const resolveIssue = (id: string, note: string) => {
    let label = "";
    const next = issues.map((x) => {
      if (x.id !== id) return x;
      label = `${x.store} · ${x.title}`;
      return { ...x, status: "해결완료", resolutionNote: note, resolvedAt: Date.now(), resolvedBy: me || undefined };
    });
    setIssues(next); saveDataset("issues", next);
    if (me) logActivity(me, "매장 이슈를 해결 처리했습니다", label);
  };
  const deleteIssue = (id: string) => {
    const x = issues.find((i) => i.id === id);
    const next = issues.filter((i) => i.id !== id);
    setIssues(next); saveDataset("issues", next);
    if (me && x) logActivity(me, "매장 이슈를 삭제했습니다", `${x.store} · ${x.title}`);
  };
  const saveWeeklyReport = (r: WeeklyReport) => {
    const exists = weeklyReports.some((x) => x.id === r.id);
    const next = exists ? weeklyReports.map((x) => (x.id === r.id ? r : x)) : [...weeklyReports, r];
    setWeeklyReports(next);
    saveDataset("weeklyReports", next);
    if (me) logActivity(me, "주간회의 점검표를 저장했습니다", `${r.round} · ${r.meetingDate}`);
  };
  const deleteArchive = (id: string) => {
    const next = archive.filter((a) => a.id !== id);
    setArchive(next); saveDataset("archive", next);
    if (me) logActivity(me, "백업 기록을 삭제했습니다");
  };

  /* ─── 로그인/아웃 ─── */
  const login = (name: string) => {
    setMe(name);
    localStorage.setItem(LS_SESSION, JSON.stringify({ name, ts: Date.now() }));
    logActivity(name, "보드에 로그인했습니다");
  };
  const logout = () => {
    if (me) logActivity(me, "로그아웃했습니다");
    setMe(null);
    localStorage.removeItem(LS_SESSION);
  };

  /* ─── 필터링 ─── */
  const filtered = useMemo(() => tasks.filter((t) => {
    if (priFilter !== "all" && t.priority !== priFilter) return false;
    if (onlyMine && me && t.assignee !== me) return false;
    if (storeFilter !== "all" && cleanStore(t.store) !== storeFilter) return false;
    return true;
  }), [tasks, priFilter, onlyMine, me, storeFilter]);

  /* 배지 */
  const todayStr = ymd(viewDate);
  const dailyCnt = filtered.filter((t) => t.freq === "일일" || t.due_date === todayStr).length;
  const monthPrefix = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthlyCnt = filtered.filter((t) => t.due_date && t.due_date.startsWith(monthPrefix)).length;
  const dashScope = isLeader ? filtered : filtered.filter((t) => me && t.assignee === me);
  const dashAvg = dashScope.length ? Math.round(dashScope.reduce((s, t) => s + taskProgress(t), 0) / dashScope.length) : 0;
  const badge: Partial<Record<TabKey, string>> = {
    dashboard: dashScope.length ? `${dashAvg}%` : "",
    daily: dailyCnt ? String(dailyCnt) : "",
    monthly: monthlyCnt ? String(monthlyCnt) : "",
  };

  const openTask = (t: Task) => setTaskModal({ open: true, task: t });
  const noDb = !getClient();

  /* ─── 렌더 ─── */
  if (!loaded) {
    return (
      <div className="tb-root">
        <div className="login-gate"><div className="login-loading">불러오는 중…</div></div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="tb-root">
        {noDb && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", fontSize: 12, fontWeight: 700, textAlign: "center", padding: "8px 12px" }}>
            Supabase 환경변수가 설정되지 않아 공용 저장이 비활성화됐습니다.
          </div>
        )}
        <LoginGate members={members} onLogin={login} />
      </div>
    );
  }

  const meMember = members.find((m) => m.name === me)!;

  return (
    <div className="tb-root">
      {/* 헤더 */}
      <div className="tb-header">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-logo" src="/team-logo.png" alt="La Rosée Paris" />
          <div className="brand-sub">팀 업무 보드 · 매장관리</div>
        </div>
        <div className="h-divider" />
        <div className="h-me">
          <span className="av av-sm" style={{ background: meMember.color }}>
            {meMember.icon || me.slice(0, 2)}
          </span>
          <span className="h-me-name">{me}</span>
        </div>
        <span className="h-sync" title={live ? "실시간 동기화 연결됨" : "실시간 연결 대기 (저장은 정상 작동)"}>
          <span className={`h-sync-dot ${live ? "on" : ""}`} />
          <span className="h-sync-text">{live ? "실시간" : "오프라인"}</span>
        </span>
        <div className="h-grow" />
        <div className="h-actions">
          <button className="btn btn-icon-only h-desktop-only" title="변경 기록" onClick={() => setActivityModal(true)}>🕘</button>
          {isLeader && (
            <>
              <button className="btn btn-ghost h-desktop-only" title="매장 설정" onClick={() => setStoreModal(true)}>
                🏬 <span>매장 설정</span>
              </button>
              <button className="btn btn-ghost h-desktop-only" title="팀원 설정" onClick={() => setMemberModal(true)}>
                ⚙ <span>팀원 설정</span>
              </button>
            </>
          )}
          <button className="btn btn-icon-only h-bell" title="마감 임박 알림" onClick={() => setWeeklyAlert(true)}>
            🔔{alertList.length > 0 && <span className="h-bell-badge">{alertList.length > 9 ? "9+" : alertList.length}</span>}
          </button>
          <button className="btn btn-primary" onClick={() => setTaskModal({ open: true, task: null })}>
            <span className="h-add-full">+ 업무 추가</span>
            <span className="h-add-short">＋</span>
          </button>
          <button className="btn btn-icon-only h-desktop-only" title="로그아웃" onClick={logout}>⎋</button>

          {/* 모바일 전용: 보조 액션 묶음 */}
          <div className="h-more-wrap">
            <button className="btn btn-icon-only h-more-btn" title="더보기" onClick={() => setMoreOpen((o) => !o)}>⋯</button>
            {moreOpen && (
              <>
                <div className="h-more-backdrop" onClick={() => setMoreOpen(false)} />
                <div className="h-more-menu">
                  <button onClick={() => { setActivityModal(true); setMoreOpen(false); }}>🕘 변경 기록</button>
                  {isLeader && (
                    <>
                      <button onClick={() => { setStoreModal(true); setMoreOpen(false); }}>🏬 매장 설정</button>
                      <button onClick={() => { setMemberModal(true); setMoreOpen(false); }}>⚙ 팀원 설정</button>
                    </>
                  )}
                  <button className="h-more-danger" onClick={() => { setMoreOpen(false); logout(); }}>⎋ 로그아웃</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 탭 (데스크톱) */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            <span className="tab-icon">{t.icon}</span> {TAB_FULL[t.key]}
            {badge[t.key] ? <span className="tab-badge">{badge[t.key]}</span> : null}
          </button>
        ))}
      </div>

      <div className="tb-main">
        {/* 필터 바 */}
        <div className="filter-bar">
          <div className="filter-chips">
            <button className={`chip ${priFilter === "all" ? "on" : ""}`} onClick={() => setPriFilter("all")}>전체</button>
            {PRIORITIES.map((p) => (
              <button key={p.key} className={`chip ${priFilter === p.key ? "on" : ""}`} onClick={() => setPriFilter(p.key)}>{p.label}</button>
            ))}
            {storeFilter !== "all" && (
              <button className="chip on" onClick={() => setStoreFilter("all")}>🏬 {storeFilter} ✕</button>
            )}
          </div>
          <label className="only-mine">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> 내 업무만
          </label>
        </div>

        <div className="work-area">
          {tab === "dashboard" && (
            <DashboardView members={members} tasks={filtered} me={me} onEdit={openTask} onComplete={completeTask} />
          )}
          {tab === "team" && (
            <TeamDetailView members={members} tasks={filtered} onEdit={openTask} />
          )}
          {tab === "daily" && (
            <DailyView members={members} tasks={filtered} stores={stores}
              viewDate={viewDate} setViewDate={setViewDate}
              onEdit={openTask} onCycle={cycleStatus} onRecheck={recheckTask} />
          )}
          {tab === "weekly" && (
            <WeeklyView members={members} tasks={filtered}
              viewDate={viewDate} setViewDate={setViewDate} onEdit={openTask} onComplete={completeTask} />
          )}
          {tab === "monthly" && (
            <MonthlyView members={members} tasks={filtered}
              viewMonth={viewMonth} setViewMonth={setViewMonth} onEdit={openTask} />
          )}
          {tab === "stores" && (
            <StoresView stores={stores} tasks={tasks} issues={issues}
              storeFilter={storeFilter} isLeader={isLeader}
              onStoreClick={(name) => { setStoreFilter(name); setTab("dashboard"); }}
              onOpenIssues={(name) => setIssueModal(name)}
              onOpenSettings={() => setStoreModal(true)} />
          )}
          {tab === "weeklyReport" && (
            <WeeklyReportView reports={weeklyReports} members={members} stores={stores} me={me} onSave={saveWeeklyReport} />
          )}
        </div>
      </div>

      {/* 모바일 하단 탭 */}
      <div className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.key} className={`bn-item ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            <span className="bn-icon">{t.icon}</span>
            <span className="bn-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 모달 */}
      {taskModal.open && (
        <TaskModal task={taskModal.task} members={members} stores={stores} me={me}
          onSave={saveTask} onDelete={deleteTask}
          onClose={() => setTaskModal({ open: false, task: null })} />
      )}
      {memberModal && (
        <MemberSettingsModal members={members} onSave={saveMembers}
          onClose={() => setMemberModal(false)}
          onOpenArchive={() => { setMemberModal(false); setArchiveModal(true); }} />
      )}
      {storeModal && (
        <StoreSettingsModal stores={stores} onSave={saveStores} onClose={() => setStoreModal(false)} />
      )}
      {issueModal && (
        <IssueModal storeName={issueModal} stores={stores} issues={issues} me={me}
          onAdd={addIssue} onResolve={resolveIssue} onDelete={deleteIssue}
          onClose={() => setIssueModal(null)} />
      )}
      {archiveModal && (
        <ArchiveModal archive={archive} isLeader={isLeader}
          onDelete={deleteArchive} onClose={() => setArchiveModal(false)} />
      )}
      {activityModal && (
        <ActivityModal activity={activity} members={members} onClose={() => setActivityModal(false)} />
      )}
      {weeklyAlert && (
        <WeeklyAlertModal tasks={me && !isLeader ? tasks.filter((t) => t.assignee === me) : tasks}
          isLeader={isLeader} onEdit={openTask} onClose={() => setWeeklyAlert(false)} />
      )}
    </div>
  );
}
