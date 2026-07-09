/* ═══ Supabase 저장 계층 — 공용 데이터 + 감사 로그 + 실시간 ═══ */
"use client";

import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import type { Task, Member, Store, Issue, ArchiveEntry, Activity } from "./lib";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

let sb: SupabaseClient | null = null;
export function getClient(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  if (!sb) sb = createClient(URL, KEY);
  return sb;
}

/* 데이터셋 → 테이블 매핑 (테이블당 JSON 배열 1행) */
const MAP = {
  tasks: { table: "tasks", col: "id", key: "all" },
  members: { table: "members", col: "idx", key: 0 },
  stores: { table: "stores", col: "name", key: "all" },
  issues: { table: "issues", col: "id", key: "all" },
  archive: { table: "member_archive", col: "id", key: "all" },
} as const;

export type DatasetName = keyof typeof MAP;

export type AllData = {
  tasks: Task[] | null;
  members: Member[] | null;
  stores: Store[] | null;
  issues: Issue[] | null;
  archive: ArchiveEntry[] | null;
};

export async function loadAll(): Promise<AllData | null> {
  const c = getClient();
  if (!c) return null;
  const out: Record<string, unknown> = {};
  for (const name of Object.keys(MAP) as DatasetName[]) {
    const k = MAP[name];
    try {
      const { data, error } = await c.from(k.table).select("data").eq(k.col, k.key).maybeSingle();
      out[name] = !error && data && Array.isArray(data.data) ? data.data : null;
    } catch {
      out[name] = null;
    }
  }
  return out as AllData;
}

export function saveDataset(name: DatasetName, arr: unknown[]) {
  const c = getClient();
  if (!c) return;
  const k = MAP[name];
  const row: Record<string, unknown> = { [k.col]: k.key, data: arr };
  c.from(k.table).upsert(row).then(({ error }) => {
    if (error) console.warn("[team] 저장 실패:", name, error.message);
  });
}

/* ─── 감사 로그 ─── */
export function logActivity(actor: string, action: string, target?: string, detail?: Record<string, unknown>) {
  const c = getClient();
  if (!c) return;
  c.from("activity_log")
    .insert({ actor, action, target: target || null, detail: detail || null })
    .then(({ error }) => {
      // activity_log 테이블이 아직 없으면 조용히 무시 (SQL 실행 전에도 앱은 동작)
      if (error && !/does not exist|relation/i.test(error.message)) {
        console.warn("[team] 기록 실패:", error.message);
      }
    });
}

export async function loadActivity(limit = 60): Promise<Activity[]> {
  const c = getClient();
  if (!c) return [];
  try {
    const { data, error } = await c
      .from("activity_log")
      .select("*")
      .order("id", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as Activity[];
  } catch {
    return [];
  }
}

/* ─── 실시간 구독 ───
   각 테이블 변경 시 콜백. activity_log INSERT는 별도 콜백. */
export function subscribeRealtime(
  onDataset: (name: DatasetName, arr: unknown[]) => void,
  onActivity: (row: Activity) => void,
  onStatus?: (connected: boolean) => void
): () => void {
  const c = getClient();
  if (!c) return () => {};

  const tableToName: Record<string, DatasetName> = {
    tasks: "tasks", members: "members", stores: "stores",
    issues: "issues", member_archive: "archive",
  };

  const ch: RealtimeChannel = c.channel("team-board");
  for (const table of Object.keys(tableToName)) {
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload: { new?: { data?: unknown } }) => {
        const rec = payload.new;
        if (rec && Array.isArray(rec.data)) onDataset(tableToName[table], rec.data);
      }
    );
  }
  ch.on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "activity_log" },
    (payload: { new?: unknown }) => {
      if (payload.new) onActivity(payload.new as Activity);
    }
  );
  ch.subscribe((status) => {
    if (onStatus) onStatus(status === "SUBSCRIBED");
  });

  return () => { c.removeChannel(ch); };
}
