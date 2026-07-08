'use client';

import { useState } from 'react';
import s from './MonthlyReport.module.css';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const num  = (v: string) => (v.trim() === '' ? 0 : Number(v.replace(/[,\s]/g, '')));
const fmtK = (v: number) => (v === 0 ? '–' : v.toLocaleString('ko-KR'));
const pct  = (a: number, b: number) => (a === 0 || b === 0 ? '–' : ((a / b) * 100).toFixed(1) + '%');

/* ─── sub-components ─────────────────────────────────────────────────────── */

function Gap({ curr, prev }: { curr: number; prev: number }) {
  if (curr === 0 || prev === 0) return <span className={s.gapNone}>–</span>;
  const v = ((curr - prev) / Math.abs(prev)) * 100;
  if (Math.abs(v) < 0.05) return <span className={s.gapZero}>→ 0.0%</span>;
  const up = v > 0;
  return (
    <span className={up ? s.gapUp : s.gapDown}>
      {up ? '▲' : '▼'} {Math.abs(v).toFixed(1)}%
    </span>
  );
}

function AchieveBar({ curr, target }: { curr: number; target: number }) {
  if (target === 0) return <span className={s.achieveEmpty}>–</span>;
  const ratio = curr / target;
  const over  = ratio >= 1;
  return (
    <div className={s.achieveWrap}>
      <div className={s.barBg}>
        <div
          className={s.barFill}
          style={{ width: `${Math.min(ratio * 100, 100)}%`, background: over ? '#16a34a' : '#2563eb' }}
        />
      </div>
      <span className={`${s.achieveNum} ${over ? s.achieveOver : s.achieveUnder}`}>
        {(ratio * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function Inp({ value, onChange, align = 'right', placeholder = '' }: {
  value: string; onChange: (v: string) => void;
  align?: 'left' | 'right'; placeholder?: string;
}) {
  return (
    <input
      className={`${s.iInput} ${align === 'left' ? s.iInputLeft : s.iInputRight}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Txt({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      className={s.iTextarea}
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder="내용을 입력하세요…"
    />
  );
}

/* ─── 전월 constants ─────────────────────────────────────────────────────── */
const PREV = {
  목표: 60_000_000, 매출: 75_202_370, 영업일: 29, 객수: 618,
  cust: {
    재구매: { q: 231, s: 29_168_854 },
    신규:   { q: 387, s: 46_033_516 },
    선물:   { q: 153, s: 23_127_600 },
  },
  team: [
    { name: '박예람(22)', q: 205, s: 29_313_920 },
    { name: '박민준(18)', q: 108, s: 12_111_910 },
    { name: '이정연(16)', q: 121, s: 14_317_100 },
    { name: '강민정(20)', q:  91, s:  8_867_924 },
    { name: '천지인(15)', q:  89, s:  9_760_570 },
  ],
  ranks: [
    { name: 'ZM바디스크럽', q: 282, s:  7_332_000 },
    { name: '바디400',      q: 260, s: 14_677_726 },
    { name: '수분스틱',     q: 223, s: 10_245_560 },
    { name: '선스틱',       q: 111, s:  2_791_470 },
    { name: '샤워오일400',  q: 110, s:  4_719_150 },
    { name: '토닉로션',     q: 107, s:  3_973_320 },
    { name: '선크림',       q:  89, s:  3_964_686 },
    { name: '히알세럼',     q:  67, s:  3_469_950 },
    { name: '케어오일',     q:  64, s:  3_578_350 },
    { name: '화이트머드',   q:  46, s:  1_667_640 },
  ],
};

const PREV_R_TOT_Q  = PREV.ranks.reduce((a, r) => a + r.q, 0);
const PREV_R_TOT_S  = PREV.ranks.reduce((a, r) => a + r.s, 0);
const PREV_T_TOT_S  = PREV.team.reduce((a, m) => a + m.s, 0);
const PREV_C_TOT_Q  = Object.values(PREV.cust).reduce((a, c) => a + c.q, 0);
const PREV_객단가   = Math.round(PREV.매출 / PREV.객수);

/* ─── types ──────────────────────────────────────────────────────────────── */
interface SalesState { 목표: string; 매출: string; 영업일: string; 객수: string }
interface RankRow    { name: string; q: string; s: string }
interface CustRow    { q: string; s: string }
interface TeamRow    { name: string; q: string; s: string; top: string[]; 목표: string }
interface CompRow    { brand: string; 목표: string; 매출: string; fixed?: boolean }
interface EventRow   { brand: string; date: string; desc: string }
interface EvalState  {
  강점: string; 약점: string; 보완: string; 우수: string; 건의: string;
  객특성: string; 피드백: string; 이슈: string; 프로모션: string;
}

/* ─── main component ─────────────────────────────────────────────────────── */
export default function MonthlyReport() {
  const CUST_KEYS = ['재구매', '신규', '선물'] as const;

  const [dept,   setDept]   = useState('롯데백화점');
  const [branch, setBranch] = useState('평촌점');

  const [sales, setSales] = useState<SalesState>({ 목표: '', 매출: '', 영업일: '', 객수: '' });
  const [ranks, setRanks] = useState<RankRow[]>(() => PREV.ranks.map(r => ({ name: r.name, q: '', s: '' })));
  const [cust,  setCust]  = useState<Record<string, CustRow>>({
    재구매: { q: '', s: '' }, 신규: { q: '', s: '' }, 선물: { q: '', s: '' },
  });
  const [team,  setTeam]  = useState<TeamRow[]>([
    { name: '박예람(18)', q: '', s: '', top: Array(6).fill(''), 목표: '' },
    { name: '강민정(19)', q: '', s: '', top: Array(6).fill(''), 목표: '' },
    { name: '천지인(20)', q: '', s: '', top: Array(6).fill(''), 목표: '' },
    { name: '이정연(6)',  q: '', s: '', top: Array(6).fill(''), 목표: '' },
  ]);
  const [comps,  setComps]  = useState<CompRow[]>([
    { brand: '오휘/후(목표)', 목표: '', 매출: '' },
    { brand: '이솝',   목표: '91000000', 매출: '95061000', fixed: true },
    { brand: '키엘',   목표: '68000000', 매출: '64131000', fixed: true },
    { brand: '록시땅', 목표: '63000000', 매출: '59222000', fixed: true },
    { brand: '빌리프', 목표: '', 매출: '' },
  ]);
  const [events, setEvents] = useState<EventRow[]>([
    { brand: '이솝',     date: '',          desc: '중문 타브랜드 뷰티팝업' },
    { brand: '구찌뷰티', date: '6/11~6/21', desc: '뷰티팝업' },
    { brand: '',         date: '',          desc: '' },
  ]);
  const [ev, setEv] = useState<EvalState>({
    강점: '', 약점: '',
    보완: '제품 묶어 소개하는 고객 주도력 보완',
    우수: '',
    건의: '- 펌프/스포이드 별도 판매\n- 임직원 할인 이미지 수정 (스틱류/바디/페이셜 대표제품과 본가격할인가 비교, 시즌별 할인 특가)',
    객특성: '',
    피드백: '- 메이크업 휴대 사용시, 선스틱과 수분스틱 사용후 덧바를때 밀리고 파우더팩트에 수분과 오일이 흡수되어 불편함',
    이슈: '', 프로모션: '',
  });

  /* ── derived ─────────────────────────────────────────────────────────── */
  const d매출 = num(sales.매출);
  const d목표 = num(sales.목표);
  const d객수 = num(sales.객수);
  const d객단 = d객수 > 0 ? Math.round(d매출 / d객수) : 0;

  const rankTotQ = ranks.reduce((a, r) => a + num(r.q), 0);
  const rankTotS = ranks.reduce((a, r) => a + num(r.s), 0);

  const custTotQ = CUST_KEYS.reduce((a, k) => a + num(cust[k].q), 0);
  const custTotS = CUST_KEYS.reduce((a, k) => a + num(cust[k].s), 0);

  const teamTotQ = team.reduce((a, m) => a + num(m.q), 0);
  const teamTotS = team.reduce((a, m) => a + num(m.s), 0);

  /* ── updaters ────────────────────────────────────────────────────────── */
  const updSales = (k: keyof SalesState) => (v: string) => setSales(p => ({ ...p, [k]: v }));
  const updRank  = (i: number, k: 'name' | 'q' | 's') => (v: string) =>
    setRanks(p => p.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const updCust  = (t: string, k: 'q' | 's') => (v: string) =>
    setCust(p => ({ ...p, [t]: { ...p[t], [k]: v } }));
  const updTeam  = (i: number, k: 'name' | 'q' | 's' | '목표') => (v: string) =>
    setTeam(p => p.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const updTop   = (i: number, ti: number) => (v: string) =>
    setTeam(p => p.map((m, j) => j === i
      ? { ...m, top: m.top.map((x, k) => k === ti ? v : x) }
      : m));
  const updComp  = (i: number, k: '목표' | '매출') => (v: string) =>
    setComps(p => p.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const updEvent = (i: number, k: keyof EventRow) => (v: string) =>
    setEvents(p => p.map((e, j) => j === i ? { ...e, [k]: v } : e));
  const updEv    = (k: keyof EvalState) => (v: string) => setEv(p => ({ ...p, [k]: v }));

  /* ── validations ─────────────────────────────────────────────────────── */
  const validations = [
    { label: '당월 총매출 = 팀원 매출 합',    base: d매출, input: teamTotS },
    { label: '당월 총객수 = 팀원 객수 합',    base: d객수, input: teamTotQ },
    { label: '당월 총매출 = 고객유형 매출 합', base: d매출, input: custTotS },
  ];

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className={s.wrapper}>
      <div className={s.deck}>

        {/* ── TITLE CARD ─────────────────────────────────────────────────── */}
        <div className={s.card}>
          <div className={s.titleBar}>
            [26년 6월]&nbsp; La Rosée&nbsp;{dept} {branch}&nbsp;월말 보고서
          </div>
          <div className={s.guideBar}>
            <span className={s.guideBold}>■ 입력 안내</span>
            <span className={s.guideItem}><span className={s.dotW} /> 흰색 칸 = 직접 입력</span>
            <span className={s.guideItem}><span className={s.dotW} style={{ background: '#eef5ff', borderColor: '#2563eb' }} /> 하늘색 칸 = 자동 계산</span>
            <span className={s.storeInputGroup}>
              <label className={s.storeLabel}>백화점</label>
              <input className={s.storeInp} value={dept} onChange={e => setDept(e.target.value)} placeholder="00백화점" />
              <label className={s.storeLabel}>매장</label>
              <input className={s.storeInp} value={branch} onChange={e => setBranch(e.target.value)} placeholder="00점" />
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 1 — ① 당월 매출  |  ② 고객 분석  |  ③ 팀원 TOP3 & 목표
        ════════════════════════════════════════════════════════════════ */}
        <div className={s.card}>
          <div className={s.row2} style={{ gridTemplateColumns: '340px 1fr 300px' }}>

            {/* ① 당월 매출 */}
            <div className={s.section}>
              <div className={s.secHdr}>📊 당월 매출</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 72px' }}>항목</span>
                <span className={s.sc}>당월</span>
                <span className={s.sc}>전월</span>
              </div>

              {[
                { label: '목표',  curr: <Inp value={sales.목표}  onChange={updSales('목표')}  placeholder="0" />, prev: fmtK(PREV.목표),  type: 'inp' },
                { label: '매출',  curr: <Inp value={sales.매출}  onChange={updSales('매출')}  placeholder="0" />, prev: fmtK(PREV.매출),  type: 'inp' },
              ].map(({ label, curr, prev }) => (
                <div key={label} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 72px' }}>{label}</div>
                  <div className={`${s.c} ${s.inp}`}>{curr}</div>
                  <div className={`${s.c} ${s.read}`}>{prev}</div>
                </div>
              ))}

              {/* 달성률 */}
              <div className={s.dr}>
                <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 72px' }}>달성률</div>
                <div className={`${s.c} ${s.calc}`}><AchieveBar curr={d매출} target={d목표} /></div>
                <div className={`${s.c} ${s.calc}`}><AchieveBar curr={PREV.매출} target={PREV.목표} /></div>
              </div>

              {/* 영업일 / 객수 / 객단가 */}
              {[
                { label: '영업일', curr: <Inp value={sales.영업일} onChange={updSales('영업일')} placeholder="0" />, prev: `${PREV.영업일}일` },
                { label: '객수',   curr: <Inp value={sales.객수}   onChange={updSales('객수')}   placeholder="0" />, prev: fmtK(PREV.객수) },
              ].map(({ label, curr, prev }) => (
                <div key={label} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 72px' }}>{label}</div>
                  <div className={`${s.c} ${s.inp}`}>{curr}</div>
                  <div className={`${s.c} ${s.read}`}>{prev}</div>
                </div>
              ))}
              <div className={s.dr}>
                <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 72px' }}>객단가</div>
                <div className={`${s.c} ${s.calc}`}>{d객수 > 0 ? fmtK(d객단) : '–'}</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(PREV_객단가)}</div>
              </div>

              <div className={s.miniHdr}>▸ 전월 대비</div>
              {[
                { label: '매출',   curr: d매출, prev: PREV.매출 },
                { label: '객수',   curr: d객수, prev: PREV.객수 },
                { label: '객단가', curr: d객단, prev: PREV_객단가 },
              ].map(({ label, curr, prev }) => (
                <div key={label} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 72px' }}>{label}</div>
                  <div className={`${s.c} ${s.calc}`} style={{ flex: 2, justifyContent: 'center' }}>
                    <Gap curr={curr} prev={prev} />
                  </div>
                </div>
              ))}
            </div>

            {/* ② 고객 분석 */}
            <div className={s.section}>
              <div className={s.secHdr}>👥 고객 분석</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 64px' }}>구분</span>
                <span className={s.sc}>객수</span>
                <span className={s.sc}>매출</span>
                <span className={s.sc}>객단가</span>
                <span className={s.sc}>비중</span>
              </div>

              <div className={s.miniHdr}>▸ 당월</div>
              {CUST_KEYS.map(k => {
                const q = num(cust[k].q), sv = num(cust[k].s);
                return (
                  <div key={k} className={s.dr}>
                    <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 64px' }}>{k}</div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={cust[k].q} onChange={updCust(k, 'q')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={cust[k].s} onChange={updCust(k, 's')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.calc}`}>{q > 0 ? fmtK(Math.round(sv / q)) : '–'}</div>
                    <div className={`${s.c} ${s.calc}`}>{pct(q, custTotQ)}</div>
                  </div>
                );
              })}
              <div className={s.totalRow}>
                <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 64px', background: '#dbeafe' }}>합계</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(custTotQ)}</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(custTotS)}</div>
                <div className={`${s.c} ${s.calc}`}>{custTotQ > 0 ? fmtK(Math.round(custTotS / custTotQ)) : '–'}</div>
                <div className={`${s.c} ${s.calc}`}>100%</div>
              </div>

              <div className={s.miniHdr}>▸ 전월</div>
              {CUST_KEYS.map(k => {
                const pr = PREV.cust[k];
                return (
                  <div key={k} className={s.dr}>
                    <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 64px' }}>{k}</div>
                    <div className={`${s.c} ${s.read}`}>{fmtK(pr.q)}</div>
                    <div className={`${s.c} ${s.read}`}>{fmtK(pr.s)}</div>
                    <div className={`${s.c} ${s.calc}`}>{fmtK(Math.round(pr.s / pr.q))}</div>
                    <div className={`${s.c} ${s.calc}`}>{pct(pr.q, PREV_C_TOT_Q)}</div>
                  </div>
                );
              })}

              <div className={s.miniHdr}>▸ 전월 대비 (GAP)</div>
              {CUST_KEYS.map(k => (
                <div key={k} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 64px' }}>{k}</div>
                  <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                    <Gap curr={num(cust[k].q)} prev={PREV.cust[k].q} />
                  </div>
                  <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                    <Gap curr={num(cust[k].s)} prev={PREV.cust[k].s} />
                  </div>
                  <div className={`${s.c} ${s.calc}`}>–</div>
                  <div className={`${s.c} ${s.calc}`}>–</div>
                </div>
              ))}
            </div>

            {/* ③ 팀원 TOP3 & 목표 */}
            <div className={s.section}>
              <div className={s.secHdr}>🎯 팀원 TOP3 & 목표</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 68px' }}>성명</span>
                <span className={s.sc}>1위</span>
                <span className={s.sc}>2위</span>
                <span className={s.sc}>3위</span>
              </div>
              <div className={s.miniHdr}>▸ 판매 TOP3 (품명 / 수량)</div>
              {team.map((m, i) => (
                <div key={i} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 68px', fontSize: 11 }}>{m.name}</div>
                  {[0, 1, 2].map(ti => (
                    <div key={ti} className={`${s.c} ${s.inp}`} style={{ gap: 2 }}>
                      <input
                        className={s.iInput}
                        style={{ flex: 1, textAlign: 'left', minWidth: 0 }}
                        value={m.top[ti * 2]}
                        onChange={e => updTop(i, ti * 2)(e.target.value)}
                        placeholder="품명"
                      />
                      <span style={{ color: '#c0ccda', flexShrink: 0, fontSize: 10 }}>/</span>
                      <input
                        className={s.iInput}
                        style={{ width: 26, flexShrink: 0, textAlign: 'right', fontSize: 11 }}
                        value={m.top[ti * 2 + 1]}
                        onChange={e => updTop(i, ti * 2 + 1)(e.target.value)}
                        placeholder="수량"
                      />
                    </div>
                  ))}
                </div>
              ))}

              <div className={s.miniHdr} style={{ marginTop: 2 }}>▸ 당월 목표 매출</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 68px' }}>성명</span>
                <span className={s.sc}>목표 매출</span>
                <span className={s.sc}>달성률</span>
              </div>
              {team.map((m, i) => (
                <div key={i} className={s.dr}>
                  <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 68px', fontSize: 11 }}>{m.name}</div>
                  <div className={`${s.c} ${s.inp}`}><Inp value={m.목표} onChange={updTeam(i, '목표')} placeholder="0" /></div>
                  <div className={`${s.c} ${s.calc}`}>
                    <AchieveBar curr={num(m.s)} target={num(m.목표)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 2 — ④ 판매 순위 TOP10  |  ⑤ 동종업계 분석
        ════════════════════════════════════════════════════════════════ */}
        <div className={s.card}>
          <div className={s.row2} style={{ gridTemplateColumns: '1fr 420px' }}>

            {/* ④ 판매 순위 TOP10 */}
            <div className={s.section}>
              <div className={s.secHdr}>🏆 월간 판매 순위 TOP 10 (당월 판매기준)</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 30px', textAlign: 'center' }}>#</span>
                <span className={s.sc} style={{ flex: 2 }}>품명</span>
                <span className={s.sc}>당월 판매량</span>
                <span className={s.sc}>당월 매출</span>
                <span className={s.sc}>전월 판매량</span>
                <span className={s.sc}>전월 매출</span>
                <span className={s.sc}>전월 대비</span>
              </div>
              {ranks.map((r, i) => {
                const pr = PREV.ranks[i];
                return (
                  <div key={i} className={s.dr}>
                    <div className={s.rankNum}>{i + 1}</div>
                    <div className={`${s.c} ${s.inp}`} style={{ flex: 2 }}>
                      <Inp value={r.name} onChange={updRank(i, 'name')} align="left" />
                    </div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={r.q} onChange={updRank(i, 'q')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={r.s} onChange={updRank(i, 's')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.read}`}>{fmtK(pr.q)}</div>
                    <div className={`${s.c} ${s.read}`}>{fmtK(pr.s)}</div>
                    <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                      <Gap curr={num(r.s)} prev={pr.s} />
                    </div>
                  </div>
                );
              })}
              <div className={s.totalRow}>
                <div className={s.rankNum}>∑</div>
                <div className={s.c} style={{ flex: 2, paddingLeft: 10 }}>합계</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(rankTotQ)}</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(rankTotS)}</div>
                <div className={`${s.c} ${s.read}`}>{fmtK(PREV_R_TOT_Q)}</div>
                <div className={`${s.c} ${s.read}`}>{fmtK(PREV_R_TOT_S)}</div>
                <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                  <Gap curr={rankTotS} prev={PREV_R_TOT_S} />
                </div>
              </div>
            </div>

            {/* ⑤ 동종업계 분석 */}
            <div className={s.section}>
              <div className={s.secHdr}>🏪 동종업계 분석</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 90px' }}>브랜드</span>
                <span className={s.sc}>목표</span>
                <span className={s.sc}>매출</span>
                <span className={s.sc}>달성률</span>
                <span className={s.sc}>GAP/라로제</span>
              </div>
              {comps.map((c, i) => {
                const goal = num(c.목표), sale = num(c.매출);
                return (
                  <div key={i} className={s.dr}>
                    <div className={`${s.c} ${s.label}`} style={{ flex: '0 0 90px' }}>{c.brand}</div>
                    <div className={`${s.c} ${c.fixed ? s.read : s.inp}`}>
                      {c.fixed ? fmtK(goal) : <Inp value={c.목표} onChange={updComp(i, '목표')} placeholder="0" />}
                    </div>
                    <div className={`${s.c} ${c.fixed ? s.read : s.inp}`}>
                      {c.fixed ? fmtK(sale) : <Inp value={c.매출} onChange={updComp(i, '매출')} placeholder="0" />}
                    </div>
                    <div className={`${s.c} ${s.calc}`}>{pct(sale, goal)}</div>
                    <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                      <Gap curr={d매출} prev={sale} />
                    </div>
                  </div>
                );
              })}

              <div className={s.miniHdr}>▸ 주요 행사 & 이슈</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 72px' }}>브랜드</span>
                <span className={s.sc} style={{ flex: '0 0 84px' }}>일자</span>
                <span className={s.sc} style={{ flex: 2 }}>내용</span>
              </div>
              {events.map((e, i) => (
                <div key={i} className={s.dr}>
                  <div className={`${s.c} ${s.inp}`} style={{ flex: '0 0 72px' }}>
                    <Inp value={e.brand} onChange={updEvent(i, 'brand')} align="left" placeholder="브랜드" />
                  </div>
                  <div className={`${s.c} ${s.inp}`} style={{ flex: '0 0 84px' }}>
                    <Inp value={e.date} onChange={updEvent(i, 'date')} align="left" placeholder="일자" />
                  </div>
                  <div className={`${s.c} ${s.inp}`} style={{ flex: 2 }}>
                    <Inp value={e.desc} onChange={updEvent(i, 'desc')} align="left" placeholder="내용" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            ROW 3 — ④ 상품 판매 순위 TOP10  |  당월 평가
        ════════════════════════════════════════════════════════════════ */}
        <div className={s.card}>
          <div className={s.row2} style={{ gridTemplateColumns: '1fr 1fr' }}>

            {/* 팀원별 매출 분석 — ROW3 왼쪽 */}
            <div className={s.section}>
              <div className={s.secHdr}>👤 팀원별 매출 분석</div>
              <div className={s.subHdr}>
                <span className={s.sc} style={{ flex: '0 0 24px', textAlign: 'center' }}>#</span>
                <span className={s.sc} style={{ flex: 1.6 }}>성명</span>
                <span className={s.sc}>객수</span>
                <span className={s.sc}>매출</span>
                <span className={s.sc}>객단가</span>
                <span className={s.sc}>비중</span>
                <span className={s.sc}>전월 대비</span>
              </div>

              <div className={s.miniHdr}>▸ 당월</div>
              {team.map((m, i) => {
                const q = num(m.q), sv = num(m.s);
                const pm = PREV.team[i] ?? { q: 0, s: 0 };
                return (
                  <div key={i} className={s.dr}>
                    <div className={s.rankNum}>{i + 1}</div>
                    <div className={`${s.c} ${s.inp}`} style={{ flex: 1.6 }}>
                      <Inp value={m.name} onChange={updTeam(i, 'name')} align="left" />
                    </div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={m.q} onChange={updTeam(i, 'q')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.inp}`}><Inp value={m.s} onChange={updTeam(i, 's')} placeholder="0" /></div>
                    <div className={`${s.c} ${s.calc}`}>{q > 0 ? fmtK(Math.round(sv / q)) : '–'}</div>
                    <div className={`${s.c} ${s.calc}`}>{pct(sv, teamTotS)}</div>
                    <div className={`${s.c} ${s.calc}`} style={{ justifyContent: 'center' }}>
                      <Gap curr={sv} prev={pm.s} />
                    </div>
                  </div>
                );
              })}
              <div className={s.totalRow}>
                <div className={s.rankNum}>∑</div>
                <div className={s.c} style={{ flex: 1.6, paddingLeft: 10 }}>합계</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(teamTotQ)}</div>
                <div className={`${s.c} ${s.calc}`}>{fmtK(teamTotS)}</div>
                <div className={`${s.c} ${s.calc}`}>{teamTotQ > 0 ? fmtK(Math.round(teamTotS / teamTotQ)) : '–'}</div>
                <div className={`${s.c} ${s.calc}`}>100%</div>
                <div className={`${s.c} ${s.calc}`}>–</div>
              </div>

              <div className={s.miniHdr}>▸ 전월</div>
              {PREV.team.map((m, i) => (
                <div key={i} className={s.dr}>
                  <div className={s.rankNum}>{i + 1}</div>
                  <div className={s.c} style={{ flex: 1.6, paddingLeft: 10 }}>{m.name}</div>
                  <div className={`${s.c} ${s.read}`}>{fmtK(m.q)}</div>
                  <div className={`${s.c} ${s.read}`}>{fmtK(m.s)}</div>
                  <div className={`${s.c} ${s.calc}`}>{fmtK(Math.round(m.s / m.q))}</div>
                  <div className={`${s.c} ${s.calc}`}>{pct(m.s, PREV_T_TOT_S)}</div>
                  <div className={`${s.c} ${s.calc}`}>–</div>
                </div>
              ))}
            </div>

            {/* 당월 평가 */}
            <div className={s.section}>
              <div className={s.secHdr}>✏️ 당월 평가</div>
              <div className={s.evalGrid}>
                <div className={s.evalCol}>
                  <div className={s.subHdr}><span className={s.sc}>매출 평가</span></div>
                  {([
                    { k: '강점' as const,  label: '강점',            rows: 3 },
                    { k: '약점' as const,  label: '약점',            rows: 3 },
                    { k: '보완' as const,  label: '보완 사항',       rows: 3 },
                    { k: '우수' as const,  label: '우수 사례',       rows: 2 },
                    { k: '건의' as const,  label: '건의사항 & 기타', rows: 4 },
                  ]).map(({ k, label, rows }) => (
                    <div key={k}>
                      <div className={s.evalLabel}>{label}</div>
                      <div className={s.evalBox}><Txt value={ev[k]} onChange={updEv(k)} rows={rows} /></div>
                    </div>
                  ))}
                </div>
                <div className={s.evalCol}>
                  <div className={s.subHdr}><span className={s.sc}>고객 평가</span></div>
                  {([
                    { k: '객특성' as const,   label: '입점객 특성',          rows: 3 },
                    { k: '피드백' as const,   label: '고객 피드백',          rows: 4 },
                    { k: '이슈' as const,     label: '이슈 / 클레임 / 칭찬', rows: 3 },
                    { k: '프로모션' as const, label: '프로모션 관련',        rows: 4 },
                  ]).map(({ k, label, rows }) => (
                    <div key={k}>
                      <div className={s.evalLabel}>{label}</div>
                      <div className={s.evalBox}><Txt value={ev[k]} onChange={updEv(k)} rows={rows} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            입력 검증
        ════════════════════════════════════════════════════════════════ */}
        <div className={s.validCard}>
          <div className={s.validHdrBar}>✅ 입력 검증 (자동) — 당월 입력 후 &apos;일치&apos; 확인</div>
          <table className={s.validTable}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>검증 항목</th>
                <th>기준값</th>
                <th>입력 합계</th>
                <th>차이</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {validations.map((v, i) => {
                const diff = Math.abs(v.base - v.input);
                const ok   = diff === 0;
                return (
                  <tr key={i}>
                    <td style={{ background: '#fff' }}>{v.label}</td>
                    <td>{fmtK(v.base)}</td>
                    <td>{fmtK(v.input)}</td>
                    <td>{fmtK(diff)}</td>
                    <td><span className={ok ? s.badgeOk : s.badgeErr}>{ok ? '일치' : '불일치'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.validNote}>
            ※ 팀원 매출/객수 합 및 고객유형 매출 합이 당월 총매출/총객수와 같아야 정상입니다.
          </div>
        </div>

      </div>
    </div>
  );
}
