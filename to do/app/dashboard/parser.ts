export const SHEET_ID = "1K7tmm3w1_nqWimoUaz9l_rffmH1-qGlWA7iL9y6NbKs";
export const GID = "1610503667";

// gviz CSV: row0=merged header fragments, row1=column headers, row2+=data
const DATA_START_ROW = 2;

// Monthly Total col indices (months 1–12; col8 is a spacer)
const MONTH_TOTAL_COLS = [3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];

const JUNE_COL_START = 171; // 6월1일
const JUNE_COL_END = 200;   // 6월30일

// ── Types ────────────────────────────────────────────────
export type DaySummary = {
  day: number;
  goal: string;
  edi: string;
  sales: string;
  rate: string;
  inflow: string;
  purchase: string;
  conversion: string;
};

export type StoreData = {
  name: string;
  monthSales: string[];
  monthGoal: string[];
  juneDays: DaySummary[];
  latestStaff: string;
  latestTop3: string;
  latestIssueFirst: string;
  latestResultFirst: string;
  latestIssueDept: string;
  latestResultDept: string;
  latestHire: string;
  latestDailyReport: string;
};

export type ManagerGroup = {
  manager: string;
  group: string; // '퍼스트 그룹1' | '퍼스트 그룹2'
  stores: StoreData[];
};

export type ParsedSheet = {
  managers: ManagerGroup[];
};

// ── 8월 이후 오픈 → 제외 ─────────────────────────────────
function isExcluded(name: string): boolean {
  const n = name;
  return (
    (n.includes('현대') && n.includes('천호')) ||
    (n.includes('현대') && n.includes('중동')) ||
    (n.includes('롯데') && n.includes('포항')) ||
    (n.includes('롯데') && n.includes('안산')) ||
    n.includes('사우스시티') ||
    n.includes('김포몰') ||
    n.includes('영등포') ||
    n.includes('건대')
  );
}

// ── 담당자 매핑표 (이미지 기준 정정) ─────────────────────
// HQ 시트 매장명 패턴 → { manager, group, display }
// 순서 중요: 구체적 패턴이 앞에 와야 함
type Assignment = { manager: string; group: string; display: string };

function lookupAssignment(raw: string): Assignment | null {
  if (isExcluded(raw)) return null;
  const n = raw;

  // ── 김보미 (퍼스트 그룹1) ────────────────────────────
  if (n.includes('갤러리아') && n.includes('광교'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '갤러리아 광교' };
  if (n.includes('갤러리아') && (n.includes('센터시티') || n.includes('천안')))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '갤러리아 천안(센터시티)' };
  if (n.includes('갤러리아') && n.includes('진주'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '갤러리아 진주' };
  if (n.includes('갤러리아') && n.includes('대전'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '갤러리아 대전' };
  if (n.includes('현대') && n.includes('울산동구'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '현대 울산 동구' };
  if (n.includes('현대') && n.includes('울산') && !n.includes('동구'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '현대 울산' };
  if (n.includes('코엑스') || n.includes('스타필드'))
    return { manager: '김보미', group: '퍼스트 그룹1', display: '스타필드 코엑스' };

  // ── 김상학 (퍼스트 그룹1) ────────────────────────────
  if (n.includes('현대') && n.includes('목동'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 목동' };
  if (n.includes('현대') && n.includes('신촌'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 신촌' };
  if (n.includes('현대') && n.includes('미아'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 미아' };
  if (n.includes('현대') && n.includes('킨텍스'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 킨텍스' };
  if (n.includes('현대') && n.includes('대구'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 대구' };
  if (n.includes('현대') && n.includes('충청'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 충청' };
  if (n.includes('현대') && n.includes('무역'))
    return { manager: '김상학', group: '퍼스트 그룹1', display: '현대 무역' };

  // ── 정인하 (퍼스트 그룹1) ────────────────────────────
  if (n.includes('신세계') && (n.includes('천안') || n.includes('아산')))
    return { manager: '정인하', group: '퍼스트 그룹1', display: '신세계 천안' };
  if (n.includes('신세계') && n.includes('김해'))
    return { manager: '정인하', group: '퍼스트 그룹1', display: '신세계 김해' };
  if (n.includes('신세계') && n.includes('의정부'))
    return { manager: '정인하', group: '퍼스트 그룹1', display: '신세계 의정부' };
  if (n.includes('신세계') && n.includes('하남'))
    return { manager: '정인하', group: '퍼스트 그룹1', display: '신세계 하남' };
  if (n.includes('AK') && n.includes('수원'))
    return { manager: '정인하', group: '퍼스트 그룹1', display: 'AK 수원' };
  if (n.includes('AK') && n.includes('분당'))
    return { manager: '정인하', group: '퍼스트 그룹1', display: 'AK 분당' };

  // ── 김민지 (퍼스트 그룹2) ────────────────────────────
  if (n.includes('롯데') && (n.includes('소공') || (n.includes('본점') && !n.includes('부산'))))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 본점' };
  if (n.includes('롯데') && n.includes('강남'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 강남' };
  if (n.includes('롯데') && n.includes('잠실'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 잠실' };
  if (n.includes('롯데') && n.includes('인천'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 인천' };
  if (n.includes('롯데') && n.includes('일산'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 일산' };
  if (n.includes('롯데') && n.includes('미아'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 미아' };
  if (n.includes('롯데') && n.includes('대구'))
    return { manager: '김민지', group: '퍼스트 그룹2', display: '롯데 대구' };

  // ── 김유하 (퍼스트 그룹2) ────────────────────────────
  if (n.includes('롯데') && n.includes('부산'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 부산 본점' };
  if (n.includes('롯데') && n.includes('동탄'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 동탄' };
  if (n.includes('롯데') && n.includes('평촌'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 평촌' };
  if (n.includes('롯데') && n.includes('창원'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 창원' };
  if (n.includes('롯데') && (n.includes('타임빌라스') || (n.includes('수원') && !n.includes('AK'))))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 수원' };
  if (n.includes('롯데') && n.includes('광복'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 광복' };
  if (n.includes('롯데') && n.includes('동래'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 동래' };
  if (n.includes('롯데') && n.includes('울산'))
    return { manager: '김유하', group: '퍼스트 그룹2', display: '롯데 울산' };

  // ── 정희선 (퍼스트 그룹2) ────────────────────────────
  if (n.includes('롯데') && n.includes('노원'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 노원' };
  if (n.includes('롯데') && n.includes('청량리'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 청량리' };
  if (n.includes('롯데') && n.includes('광주'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 광주' };
  if (n.includes('롯데') && n.includes('전주'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 전주' };
  if (n.includes('롯데') && n.includes('대전'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 대전' };
  if (n.includes('롯데') && n.includes('구리'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 구리' };
  if (n.includes('롯데') && n.includes('관악'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 관악' };
  if (n.includes('롯데') && n.includes('중동'))
    return { manager: '정희선', group: '퍼스트 그룹2', display: '롯데 중동' };

  return null; // 매핑 없음 → 대시보드에서 제외
}

// ── CSV 파서 ─────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// ── 레이블 정규화 ─────────────────────────────────────────
const LABEL_MAP: Record<string, string> = {
  '근무자': '근무자명',
  '판매 TOP3': '판매 TOP 3',
  '판매TOP3': '판매 TOP 3',
  '판매TOP 3': '판매 TOP 3',
  '데일리리포트': '데일리 리포트',
  '데일리 리포트이슈': '데일리 리포트 이슈',
  '구매 전환률': '전환',
};

const KNOWN_LABELS = new Set([
  '목표', 'EDI 매출', '매출총합', '달성률', '근무자명', '판매 TOP 3',
  '유입', '구매', '전환', '이슈사항(퍼스트팀)', '조치결과(퍼스트팀)',
  '이슈사항(백화점)', '조치결과(백화점)', '채용 이슈',
  '데일리 리포트', '데일리 리포트 이슈',
]);

function normLabel(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  return LABEL_MAP[s] ?? s;
}

function cell(row: string[], col: number): string {
  return (row[col] ?? '').trim();
}

function latestOf(vals: string[]): string {
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i]?.trim()) return vals[i].trim();
  }
  return '';
}

// ── 내부 raw 매장 타입 ─────────────────────────────────────
type RawStore = {
  hqName: string;
  items: Map<string, string[]>;
  monthSales: string[];
  monthGoal: string[];
};

// ── 메인 파서 ─────────────────────────────────────────────
export function parseHqSheet(csvText: string): ParsedSheet {
  const rows = parseCSV(csvText);

  // Pass 1: HQ 시트에서 raw 매장 목록 수집
  const rawStores: RawStore[] = [];
  let currentRaw: RawStore | null = null;

  for (let r = DATA_START_ROW; r < rows.length; r++) {
    const row = rows[r];
    const col1 = cell(row, 1);
    const col2 = cell(row, 2);

    // 담당자 선언행 스킵
    if (col1.startsWith('담당자')) continue;

    // 새 매장 시작 (col1 = 매장명)
    if (col1) {
      currentRaw = { hqName: col1, items: new Map(), monthSales: Array(12).fill(''), monthGoal: Array(12).fill('') };
      rawStores.push(currentRaw);
    }

    // 항목행
    if (col2 && currentRaw) {
      const label = normLabel(col2);
      if (!KNOWN_LABELS.has(label)) continue;

      // 6월 일별 값 수집
      const juneVals: string[] = [];
      for (let c = JUNE_COL_START; c <= JUNE_COL_END; c++) juneVals.push(cell(row, c));

      // 중복 레이블은 비어있는 셀만 채움
      const existing = currentRaw.items.get(label);
      if (existing) {
        for (let i = 0; i < 30; i++) if (!existing[i] && juneVals[i]) existing[i] = juneVals[i];
      } else {
        currentRaw.items.set(label, juneVals);
      }

      const monthTotals = MONTH_TOTAL_COLS.map(c => cell(row, c));
      if (label === '매출총합' && monthTotals.some(v => v)) currentRaw.monthSales = monthTotals;
      if (label === 'EDI 매출' && monthTotals.some(v => v)) currentRaw.monthGoal = monthTotals;
    }
  }

  // Pass 2: 담당자 매핑 적용 + 중복 매장 병합
  const MANAGER_ORDER = ['김보미', '김상학', '정인하', '김민지', '김유하', '정희선'];
  const GROUP: Record<string, string> = {
    김보미: '퍼스트 그룹1', 김상학: '퍼스트 그룹1', 정인하: '퍼스트 그룹1',
    김민지: '퍼스트 그룹2', 김유하: '퍼스트 그룹2', 정희선: '퍼스트 그룹2',
  };

  const groups = new Map<string, ManagerGroup>(
    MANAGER_ORDER.map(m => [m, { manager: m, group: GROUP[m], stores: [] }])
  );

  // 이미 처리된 (manager+display) 조합의 인덱스
  const storeIndex = new Map<string, StoreData>();

  for (const raw of rawStores) {
    const asgn = lookupAssignment(raw.hqName);
    if (!asgn) continue;

    const key = `${asgn.manager}::${asgn.display}`;
    let store = storeIndex.get(key);

    if (!store) {
      store = {
        name: asgn.display,
        monthSales: Array(12).fill(''),
        monthGoal: Array(12).fill(''),
        juneDays: [],
        latestStaff: '', latestTop3: '',
        latestIssueFirst: '', latestResultFirst: '',
        latestIssueDept: '', latestResultDept: '',
        latestHire: '', latestDailyReport: '',
      };
      storeIndex.set(key, store);
      groups.get(asgn.manager)!.stores.push(store);
    }

    // 월별 총합 병합 (비어있는 쪽을 채움)
    if (raw.monthSales.some(v => v))
      raw.monthSales.forEach((v, i) => { if (v && !store!.monthSales[i]) store!.monthSales[i] = v; });
    if (raw.monthGoal.some(v => v))
      raw.monthGoal.forEach((v, i) => { if (v && !store!.monthGoal[i]) store!.monthGoal[i] = v; });

    // 6월 일별 데이터 수집 후 juneDays 재구성
    const get = (label: string): string[] => raw.items.get(label) ?? Array(30).fill('');
    const goalRow = get('목표'), ediRow = get('EDI 매출'), salesRow = get('매출총합');
    const rateRow = get('달성률'), inflowRow = get('유입'), purchaseRow = get('구매');
    const convRow = get('전환');

    for (let day = 1; day <= 30; day++) {
      const i = day - 1;
      const edi = ediRow[i] ?? '', sales = salesRow[i] ?? '', rate = rateRow[i] ?? '';
      const inflow = inflowRow[i] ?? '', purchase = purchaseRow[i] ?? '', conversion = convRow[i] ?? '';
      if (!(edi || sales || rate || inflow || purchase || conversion)) continue;

      let existing = store.juneDays.find(d => d.day === day);
      if (!existing) {
        existing = { day, goal: '', edi: '', sales: '', rate: '', inflow: '', purchase: '', conversion: '' };
        store.juneDays.push(existing);
      }
      if (!existing.goal && goalRow[i]) existing.goal = goalRow[i];
      if (!existing.edi && edi) existing.edi = edi;
      if (!existing.sales && sales) existing.sales = sales;
      if (!existing.rate && rate) existing.rate = rate;
      if (!existing.inflow && inflow) existing.inflow = inflow;
      if (!existing.purchase && purchase) existing.purchase = purchase;
      if (!existing.conversion && conversion) existing.conversion = conversion;
    }
    store.juneDays.sort((a, b) => a.day - b.day);

    // 텍스트 항목 최신값 병합
    const staffRaw = latestOf(get('근무자명')).replace(/\t+/g, ', ').replace(/\n+/g, ', ');
    if (staffRaw && !store.latestStaff) store.latestStaff = staffRaw;
    const top3 = latestOf(get('판매 TOP 3'));
    if (top3 && !store.latestTop3) store.latestTop3 = top3;
    const issF = latestOf(get('이슈사항(퍼스트팀)'));
    if (issF && !store.latestIssueFirst) store.latestIssueFirst = issF;
    const resF = latestOf(get('조치결과(퍼스트팀)'));
    if (resF && !store.latestResultFirst) store.latestResultFirst = resF;
    const issD = latestOf(get('이슈사항(백화점)'));
    if (issD && !store.latestIssueDept) store.latestIssueDept = issD;
    const resD = latestOf(get('조치결과(백화점)'));
    if (resD && !store.latestResultDept) store.latestResultDept = resD;
    const hire = latestOf(get('채용 이슈'));
    if (hire && !store.latestHire) store.latestHire = hire;
    const dr = latestOf(get('데일리 리포트')) || latestOf(get('데일리 리포트 이슈'));
    if (dr && !store.latestDailyReport) store.latestDailyReport = dr;
  }

  return {
    managers: [...groups.values()].filter(g => g.stores.length > 0),
  };
}
