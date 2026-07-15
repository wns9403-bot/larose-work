/* ═══ 팀 업무 보드 — 모달 & 로그인 ═══ */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Task, Member, Store, Issue, ArchiveEntry, Activity,
  PRIORITIES, FREQS, AVATAR_ICONS, DEFAULT_MEMBERS,
  uid, issueUid, fmtDate, fmtDateTime, taskProgress, storeInfo, cleanStore,
  avatarGlyph, initials, daysLeft, dueLabel, isOverdue, isImminent, ALERT_DAYS,
} from "./lib";

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

/* ─── 업무 추가/수정 ─── */
export function TaskModal({
  task, members, stores, me, onSave, onDelete, onClose,
}: {
  task: Task | null; members: Member[]; stores: Store[]; me: string;
  onSave: (t: Task) => void; onDelete: (id: string) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [assignee, setAssignee] = useState(task?.assignee || me);
  const [store, setStore] = useState(task?.store && task.store !== "-" ? task.store : "");
  const [priority, setPriority] = useState(task?.priority || "중요");
  const [freq, setFreq] = useState(task?.freq || "비정기");
  const [status, setStatus] = useState(task?.status || "대기");
  const [start, setStart] = useState(task?.start_date || "");
  const [due, setDue] = useState(task?.due_date || "");
  const [dueTime, setDueTime] = useState(task?.due_time || "");
  const [memo, setMemo] = useState(task?.memo || "");
  const [needsConfirm, setNeedsConfirm] = useState(task?.needsConfirm || false);
  const [confirmDeadline, setConfirmDeadline] = useState(task?.confirmDeadline || "");

  const storeOptions = useMemo(() => {
    const owned = stores.filter((s) => s.owner === assignee);
    return (owned.length ? owned : stores).map((s) => s.name);
  }, [stores, assignee]);
  const [customStore, setCustomStore] = useState(() => !!store && !storeOptions.includes(store));
  useEffect(() => {
    if (!customStore && store && !storeOptions.includes(store)) setStore("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignee]);
  const sinfo = storeInfo(stores, store);

  const save = () => {
    if (!title.trim()) { alert("업무명을 입력하세요."); return; }
    if (start && due && start > due) { alert("시작일이 마감일보다 늦습니다."); return; }
    const base: Task = {
      id: task?.id || uid(),
      title: title.trim(),
      assignee,
      store: store.trim() || "-",
      priority, freq, status,
      start_date: start || null,
      due_date: due || null,
      due_time: due ? (dueTime || null) : null,
      memo: memo.trim(),
      quick: false,
      needsConfirm,
      confirmDeadline: needsConfirm ? (confirmDeadline || null) : null,
      confirmed: needsConfirm ? (task?.needsConfirm ? task.confirmed || false : false) : false,
      confirmed_at: needsConfirm && task?.needsConfirm && task.confirmed ? task.confirmed_at || null : null,
      confirmed_by: needsConfirm && task?.needsConfirm && task.confirmed ? task.confirmed_by : undefined,
      progress: 0,
      created_at: task?.created_at || Date.now(),
      created_by: task?.created_by || me,
      rechecked: task && status === "완료" && task.status === "완료" ? task.rechecked || false : false,
      updated_at: Date.now(),
      updated_by: me,
    };
    onSave({ ...base, progress: taskProgress(base) });   // 진행률 자동 계산
  };

  /* 모달에서 미리보기용 자동 진행률 */
  const previewProg = taskProgress({
    id: "", title: "", assignee: "", store: "", priority: "", freq: "",
    status, start_date: start || null, due_date: due || null, memo: "", progress: 0,
    created_at: task?.created_at,
  });

  return (
    <Overlay onClose={onClose}>
      <div className="modal">
        <div className="modal-head">
          <h3>{task ? "업무 수정" : "업무 추가"}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="field">
          <label>업무명</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 신세계 강남점 6월 매출 취합" autoFocus />
        </div>
        <div className="field row">
          <div>
            <label>담당자</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label>담당 매장</label>
            {!customStore ? (
              <select
                value={store === "공통" || storeOptions.includes(store) ? store : ""}
                onChange={(e) => {
                  if (e.target.value === "__custom__") { setCustomStore(true); setStore(""); }
                  else setStore(e.target.value);
                }}
              >
                <option value="">미지정</option>
                <option value="공통">🔗 공통 업무 (매장 무관)</option>
                {storeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                <option value="__custom__">✏️ 직접 입력...</option>
              </select>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={store} onChange={(e) => setStore(e.target.value)}
                  placeholder="매장명 직접 입력" autoFocus style={{ flex: 1 }}
                />
                <button
                  type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: "0 10px", flexShrink: 0 }}
                  onClick={() => { setCustomStore(false); setStore(""); }}
                >목록</button>
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", marginTop: 5, minHeight: 17 }}>
              {sinfo.name ? `담당 ${sinfo.owner || "미지정"} · 파트장 ${sinfo.partLead || "미지정"}` : ""}
            </div>
          </div>
        </div>
        <div className="field">
          <label>업무 주기</label>
          <div className="freq-opts">
            {FREQS.map((f) => (
              <button key={f.key} className={`f-opt ${freq === f.key ? "on" : ""}`} onClick={() => setFreq(f.key)}>{f.label}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>우선순위</label>
          <div className="pri-opts">
            {PRIORITIES.map((p) => (
              <button key={p.key} className={`p-opt ${priority === p.key ? "on" : ""}`} onClick={() => setPriority(p.key)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="field row">
          <div>
            <label>상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>대기</option><option>진행중</option><option>완료</option>
            </select>
          </div>
          <div>
            <label>진행률 <span className="prog-auto-tag">자동</span></label>
            <div className="prog-field prog-readonly">
              <div className="prog-track"><div className="prog-fill" style={{ width: `${previewProg}%` }} /></div>
              <b>{previewProg}%</b>
            </div>
          </div>
        </div>
        <div className="field row">
          <div>
            <label>시작일</label>
            <input type="date" value={start} max={due || undefined} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label>마감일</label>
            <input type="date" value={due} min={start || undefined} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div>
            <label>마감 시간 <span style={{ fontWeight: 500, color: "var(--ink3)" }}>(선택)</span></label>
            <input type="time" value={dueTime} disabled={!due} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>참조 / 메모</label>
          <textarea className="task-memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="참고사항·링크·전달 메모 (선택)" rows={2} />
        </div>
        <div className="field confirm-field">
          <label className="confirm-check">
            <input type="checkbox" checked={needsConfirm} onChange={(e) => setNeedsConfirm(e.target.checked)} />
            🙋 그룹장 컨펌 필요
            {task?.needsConfirm && task.confirmed && <span className="confirm-done-tag">✅ 컨펌완료</span>}
          </label>
          {needsConfirm && (
            <div style={{ marginTop: 8 }}>
              <label>컨펌 기한 <span style={{ fontWeight: 500, color: "var(--ink3)" }}>(이 날짜까지 그룹장이 확인)</span></label>
              <input type="date" value={confirmDeadline} onChange={(e) => setConfirmDeadline(e.target.value)} />
            </div>
          )}
        </div>
        {task && (task.updated_by || task.created_by) && (
          <div className="modal-note">
            {task.created_by && <>등록: {task.created_by}{task.created_at ? ` · ${fmtDateTime(task.created_at)}` : ""}</>}
            {task.updated_by && task.updated_at && <> &nbsp;|&nbsp; 마지막 수정: {task.updated_by} · {fmtDateTime(task.updated_at)}</>}
          </div>
        )}
        <div className="modal-footer">
          {task && <button className="btn-del" onClick={() => { if (confirm("이 업무를 삭제할까요?")) onDelete(task.id); }}>삭제</button>}
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={save}>저장</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 팀원 설정 ─── */
export function MemberSettingsModal({
  members, onSave, onClose, onOpenArchive,
}: {
  members: Member[];
  onSave: (next: Member[]) => void; onClose: () => void; onOpenArchive: () => void;
}) {
  const [draft, setDraft] = useState<Member[]>(members.map((m) => ({ ...m })));
  const set = (i: number, patch: Partial<Member>) =>
    setDraft((d) => d.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h3>⚙ 팀 구성 설정</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
          그룹장과 팀원 이름 · 아바타 아이콘 · 로그인 PIN
        </p>
        <div className="settings-grid">
          {draft.map((m, i) => (
            <div key={i} className="member-slot">
              <div className="member-slot-top">
                <span className="av av-md" style={{ background: m.color }}>
                  {m.icon || initials(m.name || DEFAULT_MEMBERS[i]?.name || "?")}
                </span>
                <div className="slot-info">
                  <div className="slot-role">{i === 0 ? "그룹장" : "매니저 " + i}</div>
                  <input value={m.name} onChange={(e) => set(i, { name: e.target.value })}
                    placeholder={DEFAULT_MEMBERS[i]?.name || ""} />
                </div>
                <div className="slot-pin-row">
                  <label>PIN</label>
                  <input value={m.pin || ""} maxLength={6} inputMode="numeric"
                    onChange={(e) => set(i, { pin: e.target.value.replace(/[^0-9]/g, "") })}
                    placeholder="1234" />
                </div>
              </div>
              <div className="icon-picker">
                <button type="button" className={`icon-opt ${!m.icon ? "on" : ""}`} onClick={() => set(i, { icon: "" })}>Aa</button>
                {AVATAR_ICONS.map((ic) => (
                  <button key={ic} type="button" className={`icon-opt ${m.icon === ic ? "on" : ""}`} onClick={() => set(i, { icon: ic })}>{ic}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onOpenArchive} style={{ marginRight: "auto" }}>📦 백업 자료</button>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => onSave(draft.map((m, i) => ({
            ...m, name: m.name.trim() || DEFAULT_MEMBERS[i]?.name || `팀원 ${i}`, pin: m.pin || "1234",
          })))}>저장</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 매장/파트장 설정 ─── */
type StoreGroup = { owner: string; rows: { name: string; partLead: string; old: string }[] };

export function StoreSettingsModal({
  stores, onSave, onClose,
}: { stores: Store[]; onSave: (next: Store[], renames: [string, string][]) => void; onClose: () => void }) {
  const [groups, setGroups] = useState<StoreGroup[]>(() => {
    const gs: StoreGroup[] = [];
    stores.forEach((s) => {
      const key = s.owner || "";
      let g = gs.find((x) => x.owner === key);
      if (!g) { g = { owner: key, rows: [] }; gs.push(g); }
      g.rows.push({ name: s.name, partLead: s.partLead, old: s.name });
    });
    if (!gs.length) gs.push({ owner: "", rows: [{ name: "", partLead: "", old: "" }] });
    return gs;
  });

  const setOwner = (gi: number, owner: string) =>
    setGroups((g) => g.map((x, i) => (i === gi ? { ...x, owner } : x)));
  const setRow = (gi: number, ri: number, patch: Partial<{ name: string; partLead: string }>) =>
    setGroups((g) => g.map((x, i) => i === gi
      ? { ...x, rows: x.rows.map((r, j) => (j === ri ? { ...r, ...patch } : r)) }
      : x));
  const addRow = (gi: number) =>
    setGroups((g) => g.map((x, i) => (i === gi ? { ...x, rows: [...x.rows, { name: "", partLead: "", old: "" }] } : x)));
  const removeRow = (gi: number, ri: number) =>
    setGroups((g) => g.map((x, i) => (i === gi ? { ...x, rows: x.rows.filter((_, j) => j !== ri) } : x)));
  const addGroup = () => setGroups((g) => [...g, { owner: "", rows: [{ name: "", partLead: "", old: "" }] }]);

  const save = () => {
    const next: Store[] = [];
    const renames: [string, string][] = [];
    groups.forEach((g) => {
      const owner = cleanStore(g.owner);
      g.rows.forEach((r) => {
        const name = cleanStore(r.name);
        if (!name) return;
        if (r.old && r.old !== name) renames.push([r.old, name]);
        if (!next.find((s) => s.name === name)) next.push({ name, owner, partLead: cleanStore(r.partLead) });
      });
    });
    onSave(next, renames);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-head">
          <h3>🏬 매장 / 파트장 설정</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
          담당자별로 묶여 있어요. 매장명과 파트장만 바로 수정하면 됩니다.
        </p>
        <div className="store-settings-list">
          {groups.map((g, gi) => (
            <div key={gi} className="store-owner-group">
              <div className="store-group-head">
                <span className="store-group-icon">👤</span>
                <input className="store-group-owner" value={g.owner} onChange={(e) => setOwner(gi, e.target.value)} placeholder="담당자명 입력" />
                <span className="store-group-count">{g.rows.length}개 매장</span>
              </div>
              <div className="store-group-rows">
                {g.rows.map((r, ri) => (
                  <div key={ri} className="store-row">
                    <input value={r.name} onChange={(e) => setRow(gi, ri, { name: e.target.value })} placeholder="매장명" />
                    <input className="store-part" value={r.partLead} onChange={(e) => setRow(gi, ri, { partLead: e.target.value })} placeholder="파트장 이름" />
                    <button className="store-row-remove" onClick={() => removeRow(gi, ri)} title="삭제">×</button>
                  </div>
                ))}
              </div>
              <button className="store-group-add" onClick={() => addRow(gi)}>+ 매장 추가</button>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={addGroup} style={{ marginRight: "auto" }}>+ 담당자 추가</button>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={save}>저장</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 매장 이슈 ─── */
export function IssueModal({
  storeName, stores, issues, me,
  onAdd, onResolve, onDelete, onClose,
}: {
  storeName: string; stores: Store[]; issues: Issue[]; me: string;
  onAdd: (issue: Issue) => void; onResolve: (id: string, note: string) => void;
  onDelete: (id: string) => void; onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const s = storeInfo(stores, storeName);
  const all = issues.filter((x) => x.store === storeName).sort((a, b) => b.createdAt - a.createdAt);
  const open = all.filter((x) => x.status !== "해결완료");
  const done = all.filter((x) => x.status === "해결완료");
  const list = filter === "open" ? open : filter === "done" ? done : all;

  const submit = () => {
    if (!title.trim()) { alert("이슈 제목을 입력해 주세요."); return; }
    onAdd({
      id: issueUid(), store: storeName, title: title.trim(), detail: detail.trim(),
      status: "미해결", reporter: me, createdAt: Date.now(), resolvedAt: null, resolutionNote: "",
    });
    setTitle(""); setDetail(""); setShowForm(false);
  };

  return (
    <Overlay onClose={onClose}>
      <div className="modal issue-modal">
        <div className="modal-head issue-modal-head">
          <div>
            <h3>{storeName} · 이슈 관리</h3>
            <div className="issue-modal-sub">담당 {s.owner || "미지정"} · 파트장 {s.partLead || "미지정"}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="issue-tabs">
          {([["all", "전체", all.length], ["open", "미해결", open.length], ["done", "해결", done.length]] as const).map(([k, label, n]) => (
            <button key={k} className={`issue-tab ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{label} {n}</button>
          ))}
        </div>
        <div className="issue-list">
          {!list.length && <div className="issue-empty">등록된 이슈가 없습니다.</div>}
          {list.map((x) => {
            const unresolved = x.status !== "해결완료";
            return (
              <div key={x.id} className={`issue-card ${unresolved ? "issue-card-open" : "issue-card-done"}`}>
                <button className="issue-del" onClick={() => { if (confirm("이 이슈를 삭제할까요?")) onDelete(x.id); }} title="삭제">×</button>
                <div className="issue-card-top">
                  <div className="issue-card-title">{x.title}</div>
                  <span className={`issue-status-badge ${unresolved ? "warn" : "ok"}`}>{unresolved ? "미해결" : "해결완료"}</span>
                </div>
                {x.detail && <div className="issue-card-detail">{x.detail}</div>}
                <div className="issue-card-meta">
                  {x.reporter} · {fmtDate(x.createdAt)} 등록
                  {x.resolvedAt ? ` · ${fmtDate(x.resolvedAt)} 해결${x.resolvedBy ? ` (${x.resolvedBy})` : ""}` : ""}
                </div>
                {unresolved ? (
                  <div className="issue-resolve-row">
                    <input
                      className="issue-resolve-input"
                      value={notes[x.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [x.id]: e.target.value }))}
                      placeholder="처리 내용을 입력하고 해결 처리..."
                    />
                    <button className="btn btn-primary" style={{ fontSize: 11, padding: "7px 12px" }}
                      onClick={() => onResolve(x.id, (notes[x.id] || "").trim())}>해결 처리</button>
                  </div>
                ) : x.resolutionNote ? (
                  <div className="issue-card-resolution"><b>처리 내용</b> {x.resolutionNote}</div>
                ) : null}
              </div>
            );
          })}
        </div>
        {showForm ? (
          <div className="issue-new-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="이슈 제목" autoFocus />
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="이슈 내용을 입력하세요" rows={3} />
            <div className="issue-form-actions">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>취소</button>
              <button className="btn btn-primary" onClick={submit}>등록</button>
            </div>
          </div>
        ) : (
          <button className="issue-add-btn" onClick={() => setShowForm(true)}>+ 이슈 등록</button>
        )}
      </div>
    </Overlay>
  );
}

/* ─── 백업 자료 ─── */
export function ArchiveModal({
  archive, isLeader, onDelete, onClose,
}: { archive: ArchiveEntry[]; isLeader: boolean; onDelete: (id: string) => void; onClose: () => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-head">
          <h3>📦 팀원 백업 자료</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
          조직이동·퇴사 등으로 팀원이 변경될 때 이전 팀원의 업무 기록이 자동 보관됩니다.
        </p>
        <div className="archive-list">
          {!archive.length && (
            <div className="issue-empty">
              보관된 백업 자료가 없습니다.<br />
              <span style={{ fontSize: 11 }}>팀원 이름을 변경(교체)하면 이전 팀원의 업무 기록이 자동 저장됩니다.</span>
            </div>
          )}
          {archive.map((a) => {
            const d = new Date(a.archivedAt);
            const openNow = openId === a.id;
            return (
              <div key={a.id} className="archive-card">
                <div className="archive-head" onClick={() => setOpenId(openNow ? null : a.id)}>
                  <span className="av av-md" style={{ background: a.color }}>{a.icon || initials(a.name)}</span>
                  <div className="archive-info">
                    <div className="archive-name">{a.name}</div>
                    <div className="archive-meta">
                      {d.getFullYear()}.{d.getMonth() + 1}.{d.getDate()} 보관 · {a.reason} · 업무 {a.taskCount}개 (완료 {a.doneCount})
                    </div>
                  </div>
                  {isLeader && (
                    <button className="archive-del" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("이 백업 기록을 삭제할까요? 복구할 수 없습니다.")) onDelete(a.id);
                    }} title="삭제">×</button>
                  )}
                  <span className="archive-toggle">{openNow ? "▴" : "▾"}</span>
                </div>
                {openNow && (
                  <div className="archive-detail">
                    {a.tasks.length ? a.tasks.map((t) => (
                      <div key={t.id} className="archive-task">
                        <span className="archive-task-title">{t.title}</span>
                        <span className="archive-task-meta">
                          {t.status} · {taskProgress(t)}%{t.due_date ? ` · 마감 ${t.due_date.slice(5)}` : ""}
                        </span>
                      </div>
                    )) : (
                      <div className="archive-task"><span className="archive-task-title" style={{ color: "var(--ink3)" }}>보관된 업무 없음</span></div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 마감 임박 알림 ─── */
export function WeeklyAlertModal({
  tasks, onEdit, onClose, isLeader = false,
}: { tasks: Task[]; onEdit: (t: Task) => void; onClose: () => void; isLeader?: boolean }) {
  const open = tasks.filter((t) => t.status !== "완료");
  const overdue = open.filter(isOverdue).sort((a, b) => (daysLeft(a.due_date) ?? 0) - (daysLeft(b.due_date) ?? 0));
  const imminent = open.filter((t) => !isOverdue(t) && isImminent(t))
    .sort((a, b) => (daysLeft(a.due_date) ?? 99) - (daysLeft(b.due_date) ?? 99));
  const dueThisWeek = open.filter((t) => { const d = daysLeft(t.due_date); return d !== null && d >= 0 && d <= 6; });
  const recheck = tasks.filter((t) => t.status === "완료" && !t.rechecked);
  const rows: [string, string, number, string][] = [
    ["⏰", "지연된 업무", overdue.length, overdue.length ? "danger" : ""],
    ["🚨", `마감 임박 (D-${ALERT_DAYS} 이내)`, imminent.length, imminent.length ? "warn" : ""],
    ["📅", "이번 주 마감 업무", dueThisWeek.length, ""],
    ["☑", "리체크 대기 (완료 후 미확인)", recheck.length, recheck.length ? "warn" : ""],
  ];
  const taskRow = (t: Task) => (
    <div key={t.id} className="walert-task" onClick={() => { onClose(); onEdit(t); }}>
      <span>{t.title}</span>
      <small>{isLeader ? `${t.assignee} · ` : ""}{dueLabel(t.due_date)}</small>
    </div>
  );
  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <h3>🔔 마감 임박 알림</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 14 }}>
          {isLeader ? "팀 전체의 마감 임박·지연 업무입니다. 담당 매니저를 확인해 주세요." : "마감이 다가온 내 업무입니다. 기한 전에 처리해 주세요."}
        </p>
        <div className="walert-rows">
          {rows.map(([icon, label, count, cls]) => (
            <div key={label} className={`walert-row ${cls}`}>
              <span className="walert-icon">{icon}</span>
              <span className="walert-label">{label}</span>
              <b className="walert-count">{count}건</b>
            </div>
          ))}
        </div>
        {(overdue.length > 0 || imminent.length > 0) ? (
          <div className="walert-list">
            {overdue.slice(0, 6).map(taskRow)}
            {imminent.slice(0, Math.max(0, 8 - Math.min(overdue.length, 6))).map(taskRow)}
            {overdue.length + imminent.length > 8 && (
              <div style={{ fontSize: 11, color: "var(--ink3)", padding: "4px 2px" }}>
                외 {overdue.length + imminent.length - 8}건…
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--ink3)", textAlign: "center", padding: "8px 0 4px" }}>
            마감 임박·지연 업무가 없습니다. 👍
          </div>
        )}
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>확인했어요</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 그룹장 컨펌 요청 ─── */
export function ConfirmModal({
  tasks, isLeader, onConfirm, onEdit, onClose,
}: { tasks: Task[]; isLeader: boolean; onConfirm: (id: string) => void; onEdit: (t: Task) => void; onClose: () => void }) {
  const overdue = tasks.filter((t) => (daysLeft(t.confirmDeadline) ?? 0) < 0);
  const pending = tasks.filter((t) => (daysLeft(t.confirmDeadline) ?? 0) >= 0);
  const row = (t: Task) => {
    const n = daysLeft(t.confirmDeadline);
    const over = n !== null && n < 0;
    return (
      <div key={t.id} className={`walert-task confirm-task ${over ? "over" : ""}`}>
        <div className="confirm-task-main" onClick={() => onEdit(t)}>
          <span>{t.title}</span>
          <small>{t.assignee} · 컨펌기한 {t.confirmDeadline ? `${t.confirmDeadline.slice(5)} (${dueLabel(t.confirmDeadline)})` : "미지정"}</small>
        </div>
        {isLeader && (
          <button className="btn btn-primary confirm-btn" onClick={(e) => { e.stopPropagation(); onConfirm(t.id); }}>✅ 승인</button>
        )}
      </div>
    );
  };
  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-head">
          <h3>🙋 그룹장 컨펌 요청</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink2)", marginBottom: 14 }}>
          {isLeader ? "매니저들이 요청한 컨펌 대기 목록입니다. 기한 내에 확인해 주세요." : "내가 요청한 컨펌 대기 현황입니다."}
        </p>
        {tasks.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--ink3)", textAlign: "center", padding: "16px 0" }}>
            대기 중인 컨펌 요청이 없습니다. 👍
          </div>
        ) : (
          <div className="walert-list">
            {overdue.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--urgent)", padding: "2px 2px 4px" }}>⏰ 기한 지남</div>}
            {overdue.map(row)}
            {pending.length > 0 && overdue.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink3)", padding: "8px 2px 4px" }}>대기 중</div>}
            {pending.map(row)}
          </div>
        )}
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 알림 설정 (마감 시간 N분 전 브라우저 알림) ─── */
export function NotifySettingsModal({
  leadMinutes, onSaveLead, onClose,
}: { leadMinutes: number; onSaveLead: (n: number) => void; onClose: () => void }) {
  const [lead, setLead] = useState(String(leadMinutes));
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [perm, setPerm] = useState<NotificationPermission>(supported ? Notification.permission : "denied");

  const save = () => {
    const n = parseInt(lead, 10);
    if (isNaN(n) || n < 0) { alert("0 이상의 숫자로 입력해 주세요."); return; }
    onSaveLead(n);
  };
  const enableNoti = () => {
    if (!supported) { alert("이 브라우저는 알림을 지원하지 않아요."); return; }
    Notification.requestPermission().then((p) => setPerm(p));
  };

  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <h3>⏰ 알림 설정</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="field">
          <label>마감 시간 몇 분 전에 알릴까요?</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            마감
            <input
              type="number" min={0} value={lead} onChange={(e) => setLead(e.target.value)}
              style={{ width: 70, textAlign: "center" }}
            />
            분 전
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={save}>설정 저장</button>
          <button className="btn btn-ghost btn-sm" onClick={enableNoti}>
            {perm === "granted" ? "브라우저 알림 켜짐 ✓" : "브라우저 알림 켜기"}
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink3)", lineHeight: 1.6 }}>
          내 담당 업무 중 <b>마감 시간(마감일 + 마감 시간)</b>이 설정된 항목만 알림 대상입니다.
          이 탭(브라우저)이 열려 있는 동안 설정한 시간 전에 알려드려요.
        </p>
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 변경 기록 ─── */
export function ActivityModal({
  activity, members, onClose,
}: { activity: Activity[]; members: Member[]; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-head">
          <h3>🕘 변경 기록</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 14 }}>
          누가 언제 무엇을 수정했는지 최근 기록입니다. (실시간 반영)
        </p>
        <div className="activity-list">
          {!activity.length && (
            <div className="activity-empty">
              아직 기록이 없습니다.<br />
              <span style={{ fontSize: 11 }}>Supabase에 activity_log 테이블을 만들면 이곳에 기록이 쌓입니다.</span>
            </div>
          )}
          {activity.map((a) => {
            const m = members.find((x) => x.name === a.actor);
            return (
              <div key={a.id} className="activity-row">
                <span className="av av-sm" style={{ background: m?.color || "#999" }}>
                  {m ? avatarGlyph(m) : initials(a.actor)}
                </span>
                <div className="activity-body">
                  <div className="activity-text">
                    <b>{a.actor}</b>님이 {a.action}
                    {a.target ? <> — <b>{a.target}</b></> : null}
                  </div>
                  <div className="activity-time">{fmtDateTime(a.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose}>닫기</button>
        </div>
      </div>
    </Overlay>
  );
}

/* ─── 로그인 게이트 ─── */
export function LoginGate({
  members, onLogin,
}: { members: Member[]; onLogin: (name: string) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const tryLogin = () => {
    if (sel === null) { setErr("이름을 먼저 선택해 주세요."); return; }
    const m = members[sel];
    const expected = m.pin || "1234";
    if (pin === expected) { onLogin(m.name); }
    else { setErr("PIN이 올바르지 않습니다."); setPin(""); }
  };

  return (
    <div className="login-gate">
      <div className="login-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="login-logo" src="/team-logo.png" alt="La Rosée" />
        <div className="login-title">팀 업무 보드</div>
        <div className="login-sub">본인 이름을 선택하고 PIN을 입력하세요</div>
        <div className="login-members">
          {members.map((m, i) => (
            <button key={m.name} className={`login-member ${sel === i ? "sel" : ""}`}
              onClick={() => { setSel(i); setErr(""); }}>
              <span className="av av-md" style={{ background: m.color }}>{avatarGlyph(m)}</span>
              <span>
                <span className="login-member-name" style={{ display: "block" }}>{m.name}</span>
                <span className="login-member-role">{i === 0 ? "그룹장" : "매니저 " + i}</span>
              </span>
            </button>
          ))}
        </div>
        {sel !== null && (
          <div className="login-pin-row">
            <input
              type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
              onChange={(e) => { setPin(e.target.value.replace(/[^0-9]/g, "")); setErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") tryLogin(); }}
              placeholder="PIN"
            />
            <button className="btn btn-primary" onClick={tryLogin}>입장</button>
          </div>
        )}
        {err && <div className="login-err">{err}</div>}
        <div className="login-hint">
          기본 PIN은 <b>1234</b>입니다 · 그룹장이 ⚙ 팀 설정에서 변경할 수 있어요<br />
          모든 수정 내역은 이름과 함께 기록됩니다
        </div>
      </div>
    </div>
  );
}
