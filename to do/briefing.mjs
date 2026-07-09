#!/usr/bin/env node
// 퍼스트 2 그룹 · 주간 매출 브리핑 (CLI)
//
// 사용법:
//   node briefing.mjs                       # 구글시트에서 자동 연동 (기본 gid)
//   node briefing.mjs --gid 1914076587      # 특정 월 시트 gid 지정
//   node briefing.mjs --csv data.csv        # 시트가 비공개일 때 CSV 파일로 분석
//   node briefing.mjs --no-color            # 색상 끄기 (파일로 리다이렉트 시)
//
// 의존성 없음. Node 18+ (global fetch) 필요.

import { readFileSync } from "node:fs";

const SHEET_ID = "1saJFv8BZMnLNwNcEl-jSA5e596QT5Hh8xvIBwIQqMvQ";
const STORES = ["소공본점 팝업","잠실","동탄","평촌","인천","일산","강남","창원","타임빌리스 수원","광복","대구","동래","부산본점","광주","청량리","전주","대전","관악","구리","미아"];
const DEFAULT_GID = "1914076587";

// ---------- CLI 인자 ----------
function parseArgs(argv) {
  const a = { gid: DEFAULT_GID, csv: null, color: true };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--gid") a.gid = argv[++i];
    else if (k === "--csv") a.csv = argv[++i];
    else if (k === "--no-color") a.color = false;
    else if (k === "-h" || k === "--help") a.help = true;
  }
  if (!process.stdout.isTTY) a.color = false;
  return a;
}

// ---------- 색상 ----------
function makeColor(enabled) {
  const wrap = (code) => (s) => (enabled ? `\x1b[${code}m${s}\x1b[0m` : String(s));
  return {
    dim: wrap(2), bold: wrap(1),
    green: wrap(32), red: wrap(31), yellow: wrap(33),
    blue: wrap(34), cyan: wrap(36), gray: wrap(90),
  };
}

// ---------- 포맷 ----------
const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
const eok = (n) => "약 " + (n / 1e8).toFixed(2) + "억";
const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

// ---------- CSV 파싱 (원본 대시보드와 동일) ----------
function parseCSV(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const num = (s) => {
  if (s == null) return 0;
  const x = String(s).replace(/[₩,\s%]/g, "");
  if (x === "" || x === "-") return 0;
  const n = parseFloat(x);
  return isNaN(n) ? 0 : n;
};
const salesCol = (i) => 3 + 2 * i;

// ---------- 주간 범위 계산 (지난주 월~일, 전전주) ----------
function weekRanges(sheetMonth) {
  const today = new Date();
  const dow = today.getDay();
  const monThis = new Date(today); monThis.setDate(today.getDate() - ((dow + 6) % 7));
  const lastMon = new Date(monThis); lastMon.setDate(monThis.getDate() - 7);
  const prevMon = new Date(lastMon); lastMon && prevMon.setDate(lastMon.getDate() - 7);
  const span = (start) => {
    const arr = []; let crossed = false;
    for (let k = 0; k < 7; k++) {
      const d = new Date(start); d.setDate(start.getDate() + k);
      if (d.getMonth() + 1 === sheetMonth) arr.push(d.getDate()); else crossed = true;
    }
    return { days: arr, crossed };
  };
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  const lastSun = new Date(lastMon); lastSun.setDate(lastMon.getDate() + 6);
  const prevSun = new Date(prevMon); prevSun.setDate(prevMon.getDate() + 6);
  return {
    last: span(lastMon), prev: span(prevMon),
    labelLast: `${fmt(lastMon)}~${fmt(lastSun)}`, labelPrev: `${fmt(prevMon)}~${fmt(prevSun)}`,
  };
}

// ---------- 분석 (원본 로직 그대로) ----------
function analyze(csv) {
  const rows = parseCSV(csv);
  const dayRows = {}; let sheetMonth = null;
  rows.forEach((r) => {
    const m = (r[1] || "").match(/(\d+)월\s*(\d+)일/);
    if (m) { if (!sheetMonth) sheetMonth = parseInt(m[1]); dayRows[parseInt(m[2])] = r; }
  });
  if (!sheetMonth) throw new Error("일자 데이터를 찾지 못했습니다. gid 또는 시트 형식을 확인하세요.");

  let pctIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]; const lbl = r[1] || "";
    if (/\d+월\s*\d+일/.test(lbl)) continue;
    if (String(r[salesCol(0)] || "").includes("%")) { pctIdx = i; break; }
  }
  const goalRow = pctIdx > 0 ? rows[pctIdx - 1] : null;
  const goals = STORES.map((s, i) => (goalRow ? num(goalRow[salesCol(i)]) : 0));
  const totalGoal = goals.reduce((a, b) => a + b, 0);

  const daySales = (d) => { const r = dayRows[d]; return r ? STORES.map((s, i) => num(r[salesCol(i)])) : null; };
  const dayTotal = (d) => { const ds = daySales(d); return ds ? ds.reduce((a, b) => a + b, 0) : 0; };
  const sumStores = (days) => { const acc = STORES.map(() => 0); days.forEach((d) => { const ds = daySales(d); if (ds) ds.forEach((v, i) => (acc[i] += v)); }); return acc; };

  const wr = weekRanges(sheetMonth);
  const lwDays = wr.last.days.filter((d) => dayRows[d]);
  const pwDays = wr.prev.days.filter((d) => dayRows[d]);
  const lwOp = lwDays.filter((d) => dayTotal(d) > 0);
  const lwClosed = lwDays.filter((d) => dayTotal(d) === 0);

  const lw = sumStores(lwDays), pw = sumStores(pwDays);
  const lwTotal = lw.reduce((a, b) => a + b, 0), pwTotal = pw.reduce((a, b) => a + b, 0);
  const lwAvg = lwOp.length ? lwTotal / lwOp.length : 0;

  const enteredData = [];
  for (const d in dayRows) { if (dayTotal(+d) > 0) enteredData.push(+d); }
  const cumStore = sumStores(enteredData);
  const cumTotal = cumStore.reduce((a, b) => a + b, 0);

  const per = STORES.map((s, i) => ({
    name: s, lw: lw[i], pw: pw[i], chg: pw[i] ? ((lw[i] - pw[i]) / pw[i] * 100) : null,
    cum: cumStore[i], goal: goals[i], ach: goals[i] ? (cumStore[i] / goals[i] * 100) : null,
  }));
  const top5 = [...per].sort((a, b) => b.lw - a.lw).slice(0, 5);
  const worst4 = [...per].filter((p) => p.goal > 0).sort((a, b) => a.ach - b.ach).slice(0, 4);

  const anomalies = [];
  for (const d of Object.keys(dayRows).map(Number).sort((a, b) => a - b)) {
    const ds = daySales(d); if (!ds) continue;
    ds.forEach((v, i) => { if (v < 0) anomalies.push(`${sheetMonth}/${d} ${STORES[i]} 마이너스 ${v.toLocaleString("ko-KR")}원 (환불·조정 추정)`); });
  }
  top5.forEach((p) => { if (p.chg !== null && Math.abs(p.chg) >= 40) anomalies.push(`${p.name} 전주 대비 ${pct(p.chg)} 급변동 (변동성·행사 영향 확인 필요)`); });

  const elapsed = new Date().getDate() / new Date(new Date().getFullYear(), sheetMonth, 0).getDate() * 100;

  return {
    sheetMonth, wr, lwDays, lwOp, lwClosed, lwTotal, pwTotal, lwAvg,
    lwChg: pwTotal ? ((lwTotal - pwTotal) / pwTotal * 100) : null,
    totalGoal, cumTotal, ach: totalGoal ? cumTotal / totalGoal * 100 : null, elapsed,
    daysSeries: lwDays.map((d) => ({ d, t: dayTotal(d) })),
    top5, worst4, anomalies, enteredData,
  };
}

// ---------- 터미널 렌더 ----------
const wEast = (s) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x1100 ? 2 : 1), 0);
function padEnd(s, n) { const w = wEast(s); return s + " ".repeat(Math.max(0, n - w)); }
function padStart(s, n) { const w = wEast(s); return " ".repeat(Math.max(0, n - w)) + s; }

function barChart(c, series, sheetMonth) {
  const max = Math.max(1, ...series.map((x) => x.t));
  const W = 36;
  return series.map((x) => {
    const len = Math.round((x.t / max) * W);
    const bar = "█".repeat(len) + c.gray("·".repeat(W - len));
    const lbl = padEnd(`${sheetMonth}/${x.d}`, 6);
    const val = padStart((x.t / 1e6).toFixed(1) + "M", 8);
    return `  ${c.dim(lbl)} ${c.blue(bar)} ${c.dim(val)}`;
  }).join("\n");
}

function table(c, head, rows, aligns) {
  const cols = head.length;
  const widths = head.map((h, i) => Math.max(wEast(h), ...rows.map((r) => wEast(stripAnsi(r[i])))));
  const fmtRow = (cells, color) => cells.map((cell, i) => {
    const raw = String(cell);
    const pad = aligns[i] === "r" ? padStart : padEnd;
    // ANSI 길이 보정
    const visible = stripAnsi(raw);
    const padded = pad(visible, widths[i]);
    const out = raw === visible ? padded : padded.replace(visible, raw);
    return color ? color(out) : out;
  }).join("  ");
  const lines = [c.dim(fmtRow(head, c.gray))];
  rows.forEach((r) => lines.push("  " + fmtRow(r)));
  return "  " + lines.join("\n");
}
const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "");

function render(c, R) {
  const out = [];
  const hr = c.gray("─".repeat(58));

  out.push("");
  out.push(c.bold("  퍼스트 2 그룹 · 주간 매출 브리핑"));
  out.push(c.dim(`  지난주 ${R.wr.labelLast} (영업일 ${R.lwOp.length}일) · 전전주 ${R.wr.labelPrev} · 시트 ${R.sheetMonth}월`));
  out.push("  " + hr);

  // KPI
  const chgC = R.lwChg < 0 ? c.red : c.green;
  out.push("");
  out.push(`  ${c.gray("지난주 그룹 매출")}   ${c.bold(won(R.lwTotal))}  ${c.dim(eok(R.lwTotal) + ` · 일평균 ${won(R.lwAvg)}`)}`);
  out.push(`  ${c.gray(R.sheetMonth + "월 누계 달성률")}  ${c.bold(R.ach != null ? R.ach.toFixed(1) + "%" : "-")}  ${c.dim(`누계 ${eok(R.cumTotal)} / 목표 ${eok(R.totalGoal)} · 경과율 ${R.elapsed.toFixed(0)}%`)}`);
  out.push(`  ${c.gray("전주 대비 증감")}     ${chgC(R.lwChg != null ? pct(R.lwChg) : "-")}  ${c.dim(won(R.lwTotal - R.pwTotal))}`);
  out.push(`  ${c.gray("휴점/미입력일")}     ${R.lwClosed.length ? c.yellow(R.lwClosed.length + "일") : c.bold("0일")}  ${c.dim(R.lwClosed.length ? R.lwClosed.map((d) => R.sheetMonth + "/" + d).join(", ") : "없음")}`);

  // 일자별 차트
  out.push("");
  out.push(c.bold("  지난주 일자별 그룹 매출"));
  out.push(barChart(c, R.daysSeries, R.sheetMonth));

  // 상위 5
  out.push("");
  out.push(c.bold("  주요 매출 발생 매장 (상위 5)"));
  out.push(table(c,
    ["매장", "지난주 매출", "전주 대비"],
    R.top5.map((p) => [
      p.name, won(p.lw),
      p.chg != null ? (p.chg < 0 ? c.red(pct(p.chg)) : c.green(pct(p.chg))) : "-",
    ]),
    ["l", "r", "r"]));

  // 부진 매장
  out.push("");
  out.push(c.bold("  부진 매장 (누계 달성률 하위 4)"));
  out.push(table(c,
    ["매장", "누계", "목표", "달성률"],
    R.worst4.map((p) => [p.name, won(p.cum), won(p.goal), c.red(p.ach.toFixed(1) + "%")]),
    ["l", "r", "r", "r"]));

  // 특이사항
  out.push("");
  out.push(c.bold("  특이사항"));
  const notes = [];
  if (R.lwClosed.length) notes.push(`${R.lwClosed.map((d) => R.sheetMonth + "/" + d).join(", ")} 전 지점 매출 0 → 휴점일/미입력으로 영업일 집계 제외.`);
  R.anomalies.forEach((a) => notes.push(a));
  if (R.enteredData.length) notes.push(`데이터 입력: ${R.sheetMonth}월 ${Math.min(...R.enteredData)}~${Math.max(...R.enteredData)}일.`);
  if (!notes.length) notes.push("특이사항 없음");
  notes.forEach((n) => out.push(c.dim("  • ") + n));

  out.push("");
  out.push("  " + hr);
  out.push(c.dim(`  업데이트: ${new Date().toLocaleString("ko-KR")}`));
  out.push("");
  return out.join("\n");
}

// ---------- 메인 ----------
const HELP = `퍼스트 2 그룹 · 주간 매출 브리핑 (CLI)

사용법:
  node briefing.mjs [옵션]

옵션:
  --gid <gid>     월 시트의 gid 지정 (기본: ${DEFAULT_GID})
  --csv <file>    시트가 비공개일 때 CSV 파일로 분석
  --no-color      ANSI 색상 끄기
  -h, --help      도움말
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { process.stdout.write(HELP); return; }
  const c = makeColor(args.color);

  let csv;
  try {
    if (args.csv) {
      csv = readFileSync(args.csv, "utf8");
    } else {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${args.gid}`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      csv = await r.text();
    }
  } catch (e) {
    process.stderr.write(c.red(`\n  자동 연동 실패: ${e.message}\n`) +
      c.dim(`  시트가 '링크가 있는 모든 사용자에게 공개'인지 확인하거나,\n  구글시트 → 파일 → 다운로드 → CSV 로 받아 --csv 옵션을 쓰세요.\n\n`));
    process.exitCode = 1;
    return;
  }

  try {
    const R = analyze(csv);
    process.stdout.write(render(c, R) + "\n");
  } catch (e) {
    process.stderr.write(c.red(`\n  분석 오류: ${e.message}\n\n`));
    process.exitCode = 1;
  }
}

main();
