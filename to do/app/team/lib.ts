/* ═══ 팀 업무 보드 — 타입 & 헬퍼 ═══ */

export type Task = {
  id: string;
  title: string;
  assignee: string;
  store: string;
  priority: string;
  freq: string;
  status: string;
  due_date: string | null;
  progress: number;
  created_at?: number;
  updated_at?: number;
  rechecked?: boolean;
  rechecked_at?: number | null;
  created_by?: string;
  updated_by?: string;
};

export type Member = { name: string; color: string; icon?: string; pin?: string };
export type Store = { name: string; owner: string; partLead: string };

export type Issue = {
  id: string;
  store: string;
  title: string;
  detail: string;
  status: string;
  reporter: string;
  createdAt: number;
  resolvedAt: number | null;
  resolutionNote: string;
  resolvedBy?: string;
};

export type ArchiveEntry = {
  id: string;
  name: string;
  color: string;
  icon: string;
  reason: string;
  archivedAt: number;
  taskCount: number;
  doneCount: number;
  tasks: Task[];
};

export type Activity = {
  id: number;
  actor: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

/* ─── 상수 ─── */
export const DEFAULT_MEMBERS: Member[] = [
  { name: "그룹장", color: "#0092ce", icon: "", pin: "1234" },
  { name: "팀원 1", color: "#3b82f6", icon: "", pin: "1234" },
  { name: "팀원 2", color: "#16a34a", icon: "", pin: "1234" },
  { name: "팀원 3", color: "#d97706", icon: "", pin: "1234" },
];

export const DEFAULT_STORES: Store[] = [
  { name: "롯데 본점", owner: "김민지", partLead: "김유이" },
  { name: "롯데 강남", owner: "김민지", partLead: "이리원" },
  { name: "롯데 잠실", owner: "김민지", partLead: "박유란" },
  { name: "롯데 인천", owner: "김민지", partLead: "남주현" },
  { name: "롯데 일산", owner: "김민지", partLead: "한성실" },
  { name: "롯데 미아", owner: "김민지", partLead: "백송이" },
  { name: "롯데 대구", owner: "김민지", partLead: "이아람" },
  { name: "롯데 부산 본점", owner: "김유하", partLead: "김시연" },
  { name: "롯데 동탄", owner: "김유하", partLead: "김서안" },
  { name: "롯데 평촌", owner: "김유하", partLead: "박예람" },
  { name: "롯데 창원", owner: "김유하", partLead: "홍가희" },
  { name: "롯데 수원", owner: "김유하", partLead: "심보경" },
  { name: "롯데 광복", owner: "김유하", partLead: "류은빈" },
  { name: "롯데 동래", owner: "김유하", partLead: "" },
  { name: "롯데 울산", owner: "김유하", partLead: "" },
  { name: "롯데 노원", owner: "정희선", partLead: "지원" },
  { name: "롯데 청량리", owner: "정희선", partLead: "서지우" },
  { name: "롯데 광주", owner: "정희선", partLead: "김슬기" },
  { name: "롯데 전주", owner: "정희선", partLead: "장정균" },
  { name: "롯데 대전", owner: "정희선", partLead: "이가을" },
  { name: "롯데 구리", owner: "정희선", partLead: "서현지" },
  { name: "롯데 관악", owner: "정희선", partLead: "" },
  { name: "롯데 중동", owner: "정희선", partLead: "" },
];

export const PRIORITIES = [
  { key: "긴급", label: "🔴 긴급", color: "#dc2626", bg: "#fef2f2", rank: 0 },
  { key: "중요", label: "🟡 중요", color: "#d97706", bg: "#fffbeb", rank: 1 },
  { key: "정기", label: "🟢 정기", color: "#16a34a", bg: "#f0fdf4", rank: 2 },
  { key: "보류", label: "⚪ 보류", color: "#9ca3af", bg: "#f9fafb", rank: 3 },
];
export const FREQS = [
  { key: "일일", label: "📆 일일" },
  { key: "주간", label: "📅 주간" },
  { key: "월간", label: "🗓 월간" },
  { key: "비정기", label: "🔖 비정기" },
];
export const ROUTINES: Record<string, string> = {
  월: "주간 매출 현황 확인 / 우선순위 설정",
  화: "입점 외부 미팅 / 협의",
  수: "팀원 업무 중간 점검",
  목: "보고서 작성 / 내부 문서 정리",
  금: "최종 점검 / 다음 주 일정 확정",
};
export const DAYS_KR = ["월", "화", "수", "목", "금"];
export const AVATAR_ICONS = ["🦁","🐯","🐰","🐻","🐼","🦊","🐨","🐧","🐬","🦉","🐝","🌟","🔥","🍀","💎","🚀"];

/* ─── 기본 헬퍼 ─── */
export const priOf = (k: string) => PRIORITIES.find((p) => p.key === k) || PRIORITIES[2];
export const freqOf = (k: string) => FREQS.find((f) => f.key === k) || FREQS[3];
export const initials = (n: string) => (n || "?").slice(0, 2);
export const avatarGlyph = (m: Member | undefined, name?: string) =>
  (m && m.icon) || initials(m ? m.name : name || "?");
export const memberOf = (members: Member[], n: string): Member =>
  members.find((m) => m.name === n) || { name: n, color: "#999" };

export const clampProgress = (n: unknown) => Math.max(0, Math.min(100, Number(n) || 0));
export const taskProgress = (t: Task) => (t.status === "완료" ? 100 : clampProgress(t.progress));

export function uid() {
  return "t_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
export function issueUid() {
  return "is_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function daysLeft(due: string | null | undefined): number | null {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - today.getTime()) / 864e5);
}
export function dueLabel(due: string | null | undefined): string {
  const n = daysLeft(due);
  if (n === null) return "";
  if (n === 0) return "오늘";
  if (n > 0) return `D-${n}`;
  return `D+${-n}지연`;
}
export function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
export function fmtDateTime(ts: number | string) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export const cleanStore = (s: string) => (s || "").trim();
export const isOverdue = (t: Task) => {
  const n = daysLeft(t.due_date);
  return n !== null && n < 0 && t.status !== "완료";
};

export function normalizeStoreRow(s: Partial<Store> & { store?: string; part_lead?: string }): Store {
  return {
    name: ((s && (s.name || s.store)) || "").trim(),
    owner: ((s && s.owner) || "").trim(),
    partLead: ((s && (s.partLead || s.part_lead)) || "").trim(),
  };
}

export function storeInfo(stores: Store[], name: string): Store {
  return stores.find((s) => s.name === cleanStore(name)) || { name: "", owner: "", partLead: "" };
}

/* ─── 통계 ─── */
export type MemberStat = {
  member: Member; role: string; list: Task[];
  total: number; done: number; doing: number; waiting: number; overdue: number; avg: number;
  active: Task[];
};

export function memberStats(m: Member, i: number, f: Task[]): MemberStat {
  const list = f.filter((t) => t.assignee === m.name);
  const total = list.length;
  const done = list.filter((t) => t.status === "완료").length;
  const doing = list.filter((t) => t.status === "진행중").length;
  const waiting = list.filter((t) => t.status === "대기").length;
  const overdue = list.filter(isOverdue).length;
  const avg = total ? Math.round(list.reduce((s, t) => s + taskProgress(t), 0) / total) : 0;
  const active = list.filter((t) => t.status !== "완료")
    .sort((a, b) => taskProgress(b) - taskProgress(a) || priOf(a.priority).rank - priOf(b.priority).rank)
    .slice(0, 3);
  return { member: m, role: i === 0 ? "그룹장" : "매니저 " + i, list, total, done, doing, waiting, overdue, avg, active };
}

export function taskUrgencyRank(t: Task) {
  const d = daysLeft(t.due_date);
  return (d === null ? 999 : d) + priOf(t.priority).rank * 20;
}

/* ─── 주간/상벌 ─── */
export function weekKey() {
  const d = new Date();
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return ymd(monday);
}
export function weekRange(): [number, number] {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7);
  return [monday.getTime(), sunday.getTime()];
}

export type MemberScore = {
  member: Member; plus: number; minus: number; score: number; done: number; total: number;
};

export function scoreMember(m: Member, tasks: Task[]): MemberScore {
  const [ws, we] = weekRange();
  const list = tasks.filter((t) => t.assignee === m.name);
  let plus = 0, minus = 0;
  list.forEach((t) => {
    const done = t.status === "완료";
    const doneThisWeek = done && (!t.updated_at || (t.updated_at >= ws && t.updated_at < we));
    if (doneThisWeek) {
      plus += 10;
      if (t.due_date && t.updated_at && ymd(new Date(t.updated_at)) <= t.due_date) plus += 5;
      if (t.priority === "긴급") plus += 5; else if (t.priority === "중요") plus += 3;
      if (t.rechecked) plus += 2; else minus += 2;
    }
    if (!done && isOverdue(t)) minus += 10;
    if (t.status === "대기" && t.created_at && we - t.created_at > 7 * 864e5 + (we - ws)) minus += 3;
  });
  return {
    member: m, plus, minus, score: plus - minus,
    done: list.filter((t) => t.status === "완료").length, total: list.length,
  };
}

export function scoreGrade(s: number) {
  if (s >= 40) return { g: "S", c: "#7c3aed", bg: "#f3e8ff" };
  if (s >= 20) return { g: "A", c: "#0092ce", bg: "#e0f2fe" };
  if (s >= 1) return { g: "B", c: "#16a34a", bg: "#f0fdf4" };
  return { g: "C", c: "#94a3b8", bg: "#f1f5f9" };
}
