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

/* ─── 주간회의 점검표 ─── */
export type StoreItem = { name: string; qty: number; total: number };
export type StorePerf = {
  id: string; store: string; grade: string;
  target: number; actual: number; vsLastWeek: string;
  partLeadReport: boolean; cause: string;
  monthActual?: number; prevMonthActual?: number; weekQty?: number;
  headcount?: number;        // 인당 매출 계산용 (수기 입력)
  items?: StoreItem[];       // 품목별 판매 TOP (품목별 엑셀 업로드 시)
  netSales?: number;         // 순매출 (공급가액)
  count?: number;            // 판매건수 (전표 수)
  staff?: string[];          // 근무직원 (스케줄, 내부용)
  personDays?: number;       // 주간 연인원
  dailySales?: Record<string, number>;  // 주간 일별 매출 (인당 일매출용)
  dayHead?: Record<string, number>;     // 주간 일별 근무인원 (인당 일매출용)
};
export type WeeklyMetric = { key: string; label: string; lastWeek: number; thisWeek: number };
export type KeyProduct = { key: string; label: string; qty: number; rank: string; action: string };
export type PartLeadCheck = {
  id: string; partLead: string; store: string;
  reportWritten: boolean; feedback: boolean; compliance: boolean; note: string;
};
export type Vacancy = { id: string; store: string; count: number; progress: string; targetDate: string; note: string };
export type ActionItem = {
  id: string; priority: string; task: string; assignee: string;
  deadline: string; done: boolean; note: string;
};
export type WeeklyReport = {
  id: string; round: string; meetingDate: string; author: string; duration: string;
  storePerf: StorePerf[];
  metrics: WeeklyMetric[];
  products: KeyProduct[];
  partLeadChecks: PartLeadCheck[];
  vacancies: Vacancy[];
  actionItems: ActionItem[];
  nextWeekSchedule: string;
  notes: string;
  reportToMgmt: string;
  updated_at?: number;
  updated_by?: string;
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

export const DEFAULT_METRICS: Omit<WeeklyMetric, "lastWeek" | "thisWeek">[] = [
  { key: "perHead", label: "인당 매출" },
  { key: "aov", label: "객단가" },
  { key: "purchases", label: "구매 건수" },
  { key: "monthSameWeek", label: "전월 동일주차 대비" },
];
export const DEFAULT_PRODUCTS: Omit<KeyProduct, "qty" | "rank" | "action">[] = [
  { key: "hyaluronic", label: "히알루론산 세럼" },
  { key: "ecoRefill", label: "에코 리필" },
  { key: "whiteMud", label: "화이트 머드 스틱" },
  { key: "hydraStick", label: "수분스틱" },
];
export const CORE_STORES = ["롯데 소공본점", "롯데 잠실점", "롯데 부산본점", "롯데 노원점"];

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
export function mondayOf(d: Date): Date {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
export function isoWeekLabel(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((t.getTime() - firstThu.getTime()) / 864e5 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return `W${week}`;
}
export const achievementRate = (target: number, actual: number) =>
  target > 0 ? Math.round((actual / target) * 100) : 0;
export const changeRate = (last: number, cur: number) =>
  last > 0 ? Math.round(((cur - last) / last) * 100) : cur > 0 ? 100 : 0;

export function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36)}`;
}

export function defaultWeeklyReport(monday: Date, author: string): WeeklyReport {
  return {
    id: ymd(monday),
    round: isoWeekLabel(monday),
    meetingDate: ymd(monday),
    author,
    duration: "30분",
    storePerf: CORE_STORES.map((store) => ({
      id: rid("sp"), store, grade: "", target: 0, actual: 0, vsLastWeek: "", partLeadReport: false, cause: "",
    })),
    metrics: DEFAULT_METRICS.map((m) => ({ ...m, lastWeek: 0, thisWeek: 0 })),
    products: DEFAULT_PRODUCTS.map((p) => ({ ...p, qty: 0, rank: "", action: "" })),
    partLeadChecks: [],
    vacancies: [],
    actionItems: [],
    nextWeekSchedule: "",
    notes: "",
    reportToMgmt: "",
  };
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

/* ─── 이카운트 판매현황 엑셀 파싱 ─── */
export type EcountDaily = { store: string; date: string; qty: number; total: number; voucher?: string; supply?: number };
export type StoreAgg = {
  store: string; norm: string;
  weekTotal: number; weekQty: number; prevWeekTotal: number;
  monthTotal: number; monthQty: number; prevMonthTotal: number;
  weekNet: number; weekCount: number;   // 순매출(공급가액)·판매건수(전표수)
  weekDaily: Record<string, number>;    // 주간 일별 매출
};

/* 콤마·통화 문자열 → 숫자 */
const toNum = (v: unknown) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

/* 접두/접미·수식어 제거: "롯데백화점 소공본점 팝업 매대" → "소공본점", "롯데 부산 본점" → "부산본점" */
const stripStore = (s: string) =>
  String(s || "").replace(/롯데백화점|롯데|백화점|매대|팝업|정규|임시|행사|상설/g, "").replace(/\s+/g, "").trim();

/* 매장명 정규화 (매칭 키): 끝의 '점'까지 제거해 "부산본점"·"부산본" 표기 흡수 → "부산본" */
export const normStoreName = (s: string) => stripStore(s).replace(/점$/, "");

/* 이카운트 원본 매장명 → 표시용 (점 유지): "롯데백화점 소공본점 팝업 매대" → "롯데 소공본점" */
export const cleanEcountStore = (s: string) => "롯데 " + stripStore(s);

const isSubtotal = (s: string) => /계\s*$/.test(s) || s === "총합계";

/* 이카운트 export는 선택한 그룹에 따라 컬럼 구성이 바뀜(일별만/품목별만/일별+품목별 등).
   헤더 행을 읽어 컬럼 위치를 이름으로 매핑한 뒤 일별·품목 데이터를 함께 추출한다. */
export type EcountSheet = { daily: EcountDaily[]; items: EcountItem[]; hasDaily: boolean; hasItems: boolean };
export function parseEcountSheet(rows: unknown[][]): EcountSheet {
  const daily: EcountDaily[] = [];
  const items: EcountItem[] = [];
  let headerIdx = -1, cStore = -1, cDate = -1, cItem = -1, cQty = -1, cTotal = -1, cVoucher = -1, cSupply = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const cells = r.map((c) => String(c ?? "").trim());
    const si = cells.indexOf("창고별");
    if (si < 0) continue;
    headerIdx = i; cStore = si;
    cDate = cells.findIndex((c) => c === "일별");
    cItem = cells.findIndex((c) => c.includes("품목"));
    cQty = cells.findIndex((c) => c === "수량");
    cTotal = cells.findIndex((c) => c === "합계");
    cVoucher = cells.findIndex((c) => c.includes("전표"));
    cSupply = cells.findIndex((c) => c.includes("공급가"));
    break;
  }
  const hasDaily = cDate >= 0, hasItems = cItem >= 0;
  if (headerIdx < 0 || cTotal < 0) return { daily, items, hasDaily, hasItems };

  let store = "";
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const c0 = String(r[cStore] ?? "").trim();
    if (c0.includes("회사명")) continue;
    if (c0 && isSubtotal(c0)) continue;                  // "…매대 계"·"총합계"
    if (c0) store = c0;                                  // 창고(매장) — 반복/그룹헤더 모두 대응
    if (!store) continue;
    const qty = toNum(r[cQty]), total = toNum(r[cTotal]);
    const itemRaw = cItem >= 0 ? String(r[cItem] ?? "").trim() : "";
    const dateRaw = cDate >= 0 ? String(r[cDate] ?? "").trim() : "";
    const dm = dateRaw.match(/(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})/);
    const date = dm ? `${dm[1]}-${dm[2].padStart(2, "0")}-${dm[3].padStart(2, "0")}` : "";
    if (hasItems && itemRaw) items.push({ store, name: itemRaw, qty, total });
    // 날짜가 있으면 매출 추이로도 사용 (일별+품목별 파일은 매출·품목 둘 다 채움)
    if (date) {
      const voucher = cVoucher >= 0 ? String(r[cVoucher] ?? "").trim() : "";
      const supply = cSupply >= 0 ? toNum(r[cSupply]) : 0;
      daily.push({ store, date, qty, total, voucher, supply });
    }
  }
  return { daily, items, hasDaily, hasItems };
}

/* 선택 주(월요일 기준)로 집계 — 금주/전주/당월 누계 */
export function aggregateEcount(daily: EcountDaily[], monday: Date): StoreAgg[] {
  const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
  const prevMon = new Date(monday); prevMon.setDate(monday.getDate() - 7);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);
  const wStart = ymd(monday), wEnd = ymd(sun), pStart = ymd(prevMon), pEnd = ymd(prevSun);
  const monthKey = ymd(monday).slice(0, 7);
  const prevMonthKey = ymd(new Date(monday.getFullYear(), monday.getMonth() - 1, 1)).slice(0, 7);

  const map = new Map<string, StoreAgg>();
  const vouchers = new Map<string, Set<string>>();   // norm → 주간 전표 집합
  for (const d of daily) {
    const norm = normStoreName(d.store);
    let a = map.get(norm);
    if (!a) { a = { store: d.store, norm, weekTotal: 0, weekQty: 0, prevWeekTotal: 0, monthTotal: 0, monthQty: 0, prevMonthTotal: 0, weekNet: 0, weekCount: 0, weekDaily: {} }; map.set(norm, a); vouchers.set(norm, new Set()); }
    const mk = d.date.slice(0, 7);
    if (mk === monthKey) { a.monthTotal += d.total; a.monthQty += d.qty; }
    if (mk === prevMonthKey) { a.prevMonthTotal += d.total; }
    if (d.date >= wStart && d.date <= wEnd) {
      a.weekTotal += d.total; a.weekQty += d.qty; a.weekNet += d.supply || 0;
      a.weekDaily[d.date] = (a.weekDaily[d.date] || 0) + d.total;
      if (d.voucher) vouchers.get(norm)!.add(d.date + "|" + d.voucher);
    }
    if (d.date >= pStart && d.date <= pEnd) { a.prevWeekTotal += d.total; }
  }
  for (const [norm, set] of vouchers) map.get(norm)!.weekCount = set.size;
  return [...map.values()].sort((a, b) => b.weekTotal - a.weekTotal);
}

/* 전주대비 라벨 */
export const vsLabel = (prev: number, cur: number) => {
  if (prev <= 0) return cur > 0 ? "신규" : "";
  const cr = changeRate(prev, cur);
  return `${cr > 0 ? "+" : ""}${cr}%`;
};

/* 집계 결과를 점검표에 병합 — 기존 매장 행은 채우고, 없는 매장은 추가 */
export function mergeEcountIntoReport(r: WeeklyReport, aggs: StoreAgg[]): WeeklyReport {
  const used = new Set<string>();
  const filled = r.storePerf.map((row) => {
    const a = aggs.find((x) => x.norm === normStoreName(row.store));
    if (!a) return row;
    used.add(a.norm);
    return {
      ...row,
      actual: a.weekTotal,
      monthActual: a.monthTotal,
      prevMonthActual: a.prevMonthTotal,
      weekQty: a.weekQty,
      netSales: a.weekNet,
      count: a.weekCount,
      dailySales: a.weekDaily,
      vsLastWeek: a.prevWeekTotal > 0 ? vsLabel(a.prevWeekTotal, a.weekTotal) : row.vsLastWeek,
    };
  });
  const extra: StorePerf[] = aggs
    .filter((a) => !used.has(a.norm) && (a.weekTotal > 0 || a.monthTotal > 0))
    .map((a) => ({
      id: rid("sp"), store: cleanEcountStore(a.store), grade: "",
      target: 0, actual: a.weekTotal, monthActual: a.monthTotal, prevMonthActual: a.prevMonthTotal, weekQty: a.weekQty,
      netSales: a.weekNet, count: a.weekCount, dailySales: a.weekDaily,
      vsLastWeek: vsLabel(a.prevWeekTotal, a.weekTotal), partLeadReport: false, cause: "",
    }));
  return { ...r, storePerf: [...filled, ...extra] };
}

export const fmtWon = (n: number) => (Number(n) || 0).toLocaleString("ko-KR");

/* ─── 이카운트 품목별 판매현황 ─── */
export type EcountItem = { store: string; name: string; qty: number; total: number };

/* 매장별 품목 집계 → 매장(norm) → {표시명, 판매액 상위 품목} */
export type StoreItemGroup = { store: string; items: StoreItem[] };
export function aggregateItems(items: EcountItem[], topN = 6): Map<string, StoreItemGroup> {
  const byStore = new Map<string, { store: string; m: Map<string, StoreItem> }>();
  for (const it of items) {
    const norm = normStoreName(it.store);
    let g = byStore.get(norm);
    if (!g) { g = { store: it.store, m: new Map() }; byStore.set(norm, g); }
    const cur = g.m.get(it.name) || { name: it.name, qty: 0, total: 0 };
    cur.qty += it.qty; cur.total += it.total;
    g.m.set(it.name, cur);
  }
  const out = new Map<string, StoreItemGroup>();
  for (const [norm, g] of byStore) {
    out.set(norm, { store: g.store, items: [...g.m.values()].sort((a, b) => b.total - a.total).slice(0, topN) });
  }
  return out;
}

/* 품목 집계를 점검표에 병합 — 매장 행에 items[] 부착, 없는 매장은 새 행 추가 */
export function mergeItemsIntoReport(r: WeeklyReport, itemMap: Map<string, StoreItemGroup>): WeeklyReport {
  const used = new Set<string>();
  const filled = r.storePerf.map((row) => {
    const g = itemMap.get(normStoreName(row.store));
    if (!g) return row;
    used.add(normStoreName(row.store));
    return { ...row, items: g.items };
  });
  const extra: StorePerf[] = [];
  for (const [norm, g] of itemMap) {
    if (used.has(norm)) continue;
    extra.push({
      id: rid("sp"), store: cleanEcountStore(g.store), grade: "",
      target: 0, actual: 0, partLeadReport: false, cause: "", vsLastWeek: "", items: g.items,
    });
  }
  return { ...r, storePerf: [...filled, ...extra] };
}

/* ─── 근무 스케줄 엑셀 파싱 (담당자 × 날짜 = 그날 위치) ─── */
export type ScheduleRec = { date: string; member: string; store: string };
export type ScheduleAgg = { token: string; norm: string; staff: string[]; personDays: number; perDay: Record<string, number> };

/* 매장 아님(제외): 사무실·연차·휴가·오프 등 */
const NON_STORE = /사무실|연차|휴가|오프|오전|오후|미정|대기/;

/* 헤더에서 '날짜' 열을 찾아 오른쪽 담당자 열을 매핑, 각 셀의 (위치)를 추출 */
export function parseScheduleSheet(rows: unknown[][], year: number): ScheduleRec[] {
  let hIdx = -1, cDate = -1;
  for (let i = 0; i < rows.length; i++) {
    if (!Array.isArray(rows[i])) continue;
    const c = rows[i].map((x) => String(x ?? "").trim());
    const di = c.indexOf("날짜");
    if (di >= 0) { hIdx = i; cDate = di; break; }
  }
  if (hIdx < 0) return [];
  const header = rows[hIdx].map((x) => String(x ?? "").trim());
  const members: { name: string; col: number }[] = [];
  for (let j = cDate + 1; j < header.length; j++) {
    const nm = header[j];
    if (!nm) continue;
    if (nm.includes("설치") || nm.includes("철수") || nm.includes("비고")) break;
    members.push({ name: nm, col: j });
  }
  const recs: ScheduleRec[] = [];
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r)) continue;
    const dm = String(r[cDate] ?? "").trim().match(/(\d{1,2})\.\s*(\d{1,2})\./);
    if (!dm) continue;
    const date = `${year}-${dm[1].padStart(2, "0")}-${dm[2].padStart(2, "0")}`;
    for (const m of members) {
      const raw = String(r[m.col] ?? "").replace(/[()]/g, "").trim();
      if (!raw) continue;
      for (let part of raw.split(",")) {
        part = part.trim();
        if (!part || NON_STORE.test(part)) continue;
        recs.push({ date, member: m.name, store: part });
      }
    }
  }
  return recs;
}

/* 선택 주 기준 매장별 근무직원·연인원 */
export function aggregateSchedule(recs: ScheduleRec[], monday: Date): ScheduleAgg[] {
  const sun = new Date(monday); sun.setDate(monday.getDate() + 6);
  const wStart = ymd(monday), wEnd = ymd(sun);
  const map = new Map<string, { token: string; staff: Set<string>; perDay: Map<string, Set<string>> }>();
  for (const r of recs) {
    if (r.date < wStart || r.date > wEnd) continue;
    const norm = normStoreName(r.store);
    let g = map.get(norm);
    if (!g) { g = { token: r.store, staff: new Set(), perDay: new Map() }; map.set(norm, g); }
    g.staff.add(r.member);
    if (!g.perDay.has(r.date)) g.perDay.set(r.date, new Set());
    g.perDay.get(r.date)!.add(r.member);
  }
  return [...map.entries()].map(([norm, g]) => {
    const perDay: Record<string, number> = {};
    let personDays = 0;
    for (const [d, set] of g.perDay) { perDay[d] = set.size; personDays += set.size; }
    return { norm, token: g.token, staff: [...g.staff], personDays, perDay };
  });
}

/* 매장명 근사 매칭: "부산"(스케줄) ↔ "부산본"(이카운트) */
const storeMatch = (a: string, b: string) => a === b || (a.length >= 2 && b.length >= 2 && (a.startsWith(b) || b.startsWith(a)));

/* 스케줄 집계를 점검표 매장 행에 병합 (근무직원·연인원·일별 근무인원) */
export function mergeScheduleIntoReport(r: WeeklyReport, sched: ScheduleAgg[]): WeeklyReport {
  const storePerf = r.storePerf.map((row) => {
    const rn = normStoreName(row.store);
    const g = sched.find((s) => storeMatch(rn, s.norm));
    if (!g) return { ...row, staff: [], personDays: 0, dayHead: {} };
    return { ...row, staff: g.staff, personDays: g.personDays, dayHead: g.perDay };
  });
  return { ...r, storePerf };
}

/* 객단가 = 매출 ÷ 판매건수 */
export const aovOf = (s: StorePerf) => (s.count ? Math.round(s.actual / s.count) : 0);

/* 인당 일매출 = 근무한 날들의 (그날 매출 ÷ 그날 근무인원) 평균.
   근무일별 매출을 그날 인원으로 나눠 평균 → 근무 1일뿐인 매장이 주간 전체매출로 왜곡되지 않음. */
export const perHeadDailyOf = (s: StorePerf) => {
  const ds = s.dailySales, dh = s.dayHead;
  if (ds && dh) {
    let sum = 0, n = 0;
    for (const d of Object.keys(dh)) {
      const head = dh[d], sales = ds[d] || 0;
      if (head > 0 && sales > 0) { sum += sales / head; n++; }
    }
    if (n > 0) return Math.round(sum / n);
  }
  return s.personDays ? Math.round(s.actual / s.personDays) : 0;   // 일별 매출 없을 때 폴백
};
