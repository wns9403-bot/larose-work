const PptxGenJS = require("pptxgenjs");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE"; // 13.33" x 7.5"

const C = {
  navy:      "1E3A5F",
  blue:      "2980B9",
  lightBlue: "D6EAF8",
  teal:      "1ABC9C",
  white:     "FFFFFF",
  light:     "F5F7FA",
  text:      "2C3E50",
  gray:      "95A5A6",
  green:     "27AE60",
  orange:    "E67E22",
  red:       "E74C3C",
  yellow:    "F1C40F",
};

const KR = "맑은 고딕";

// ─── helpers ─────────────────────────────────────────────────────────────────

function header(slide, title, badge, badgeColor) {
  // Background bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 1.35,
    fill: { color: C.navy }, line: { type: "none" },
  });
  // Accent stripe
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 1.35, w: "100%", h: 0.07,
    fill: { color: C.blue }, line: { type: "none" },
  });
  // Title text
  slide.addText(title, {
    x: 0.45, y: 0.18, w: 9.5, h: 0.85,
    fontFace: KR, fontSize: 26, bold: true, color: C.white,
    valign: "middle",
  });
  // Badge (grade)
  if (badge) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: 11.3, y: 0.3, w: 1.6, h: 0.75,
      fill: { color: badgeColor || C.blue },
      line: { type: "none" },
      rectRadius: 0.1,
    });
    slide.addText(badge, {
      x: 11.3, y: 0.3, w: 1.6, h: 0.75,
      fontFace: KR, fontSize: 15, bold: true, color: C.white,
      align: "center", valign: "middle",
    });
  }
}

function sectionBg(slide) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: C.light }, line: { type: "none" },
  });
}

function checkTable(slide, rows, yStart, colWidths) {
  const tableRows = [
    [
      { text: "점검 항목", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "기준", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    ...rows.map(([item, desc], i) => [
      { text: item, options: { fill: i % 2 === 0 ? C.white : C.light, color: C.text } },
      { text: desc, options: { fill: i % 2 === 0 ? C.white : C.light, color: C.text } },
    ]),
  ];
  slide.addTable(tableRows, {
    x: 0.4, y: yStart, w: 12.53,
    colW: colWidths || [4.5, 8.03],
    fontFace: KR, fontSize: 14,
    rowH: 0.42,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });
}

function principleBox(slide, lines, yStart) {
  slide.addShape(pres.ShapeType.rect, {
    x: 0.4, y: yStart, w: 12.53, h: lines.length * 0.38 + 0.25,
    fill: { color: C.lightBlue }, line: { color: C.blue, pt: 1 },
  });
  slide.addText(lines.map(l => ({ text: l, options: { bullet: { type: "bullet", code: "25B6", color: C.blue } }, breakLine: true })), {
    x: 0.55, y: yStart + 0.1, w: 12.3, h: lines.length * 0.38 + 0.1,
    fontFace: KR, fontSize: 13.5, color: C.text,
  });
}

// ─── Slide 1: Title ───────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  // Full navy background
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: "100%",
    fill: { color: C.navy }, line: { type: "none" },
  });
  // Decorative side stripe
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 0.35, h: "100%",
    fill: { color: C.blue }, line: { type: "none" },
  });
  // Bottom stripe
  s.addShape(pres.ShapeType.rect, {
    x: 0, y: 6.9, w: "100%", h: 0.6,
    fill: { color: C.blue }, line: { type: "none" },
  });
  s.addText("매장관리 매뉴얼", {
    x: 1, y: 1.8, w: 11.3, h: 1.5,
    fontFace: KR, fontSize: 48, bold: true, color: C.white,
  });
  s.addText("매장 점검표 기반  |  총점 70점  |  9개 관리 영역", {
    x: 1, y: 3.4, w: 11, h: 0.7,
    fontFace: KR, fontSize: 20, color: C.lightBlue,
  });
  s.addShape(pres.ShapeType.rect, {
    x: 1, y: 4.2, w: 5, h: 0.06,
    fill: { color: C.teal }, line: { type: "none" },
  });
  s.addText("핸드빌 · 유입 · 응대 · 판매 · 고객관리\n프로모션 · 에이브랩스 · 트위닛 · 근태", {
    x: 1, y: 4.4, w: 11, h: 1.2,
    fontFace: KR, fontSize: 16, color: C.gray,
  });
}

// ─── Slide 2: 목차 ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "목차");

  const areas = [
    ["1", "핸드빌",       "10점 · S"],
    ["2", "유입 관리",    "10점 · S"],
    ["3", "고객 응대",    "10점 · S"],
    ["4", "판매 관리",    "10점 · S"],
    ["5", "고객 관리",    "10점 · S"],
    ["6", "프로모션 활용","4점 · B ⚠"],
    ["7", "에이브랩스",   "4점 · B ⚠"],
    ["8", "트위닛 활용",  "4점 · B ⚠"],
    ["9", "근태 관리",    "8점 · S"],
  ];

  const cols = 3, rows = 3;
  const bw = 3.9, bh = 1.5;
  const sx = 0.6, sy = 1.55, gx = 0.5, gy = 0.42;

  areas.forEach(([num, name, score], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = sx + col * (bw + gx);
    const y = sy + row * (bh + gy);
    const isB = score.includes("B");
    const fillColor = isB ? "FEF9E7" : "EAF4FB";
    const borderColor = isB ? C.orange : C.blue;

    s.addShape(pres.ShapeType.rect, {
      x, y, w: bw, h: bh,
      fill: { color: fillColor },
      line: { color: borderColor, pt: 2 },
    });
    s.addText(num, {
      x: x + 0.15, y: y + 0.1, w: 0.6, h: 0.55,
      fontFace: KR, fontSize: 22, bold: true,
      color: isB ? C.orange : C.blue,
    });
    s.addText(name, {
      x: x + 0.1, y: y + 0.55, w: bw - 0.2, h: 0.6,
      fontFace: KR, fontSize: 17, bold: true, color: C.text,
    });
    s.addText(score, {
      x: x + 0.1, y: y + 1.1, w: bw - 0.2, h: 0.35,
      fontFace: KR, fontSize: 12, color: isB ? C.orange : C.gray,
    });
  });
}

// ─── Slide 3: 핸드빌 ─────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "1. 핸드빌", "10점 · S등급", C.green);
  checkTable(s, [
    ["위치 선정", "유동인구가 많고 타겟 고객 동선에 배치"],
    ["타임테이블", "시간대·담당자·구역이 명확히 계획되어 있을 것"],
    ["고객 인사", "모든 고객에게 눈 맞춤 + 밝은 인사 필수"],
    ["안전사고 방지", "통행 방해 금지, 넓은 공간 확보, 무리한 접근 자제"],
    ["암묵적 고객 동의", "거부 의사 표현 시 즉시 응대 중단, 강요 절대 금지"],
  ], 1.55);
  principleBox(s, [
    "핸드빌은 브랜드의 첫인상 — 밝고 단정한 복장과 태도 유지",
    "타임테이블은 주간 단위로 사전 작성 후 팀 전체 공유",
    "특이사항(고객 불만, 위험상황) 발생 시 즉시 팀장 보고",
  ], 5.55);
}

// ─── Slide 4: 유입 관리 ──────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "2. 유입 관리", "10점 · S등급", C.green);
  checkTable(s, [
    ["상시 핸드빌 진행", "영업시간 중 공백 없이 핸드빌 인원 배치"],
    ["2회 이상 유입 시도", "한 고객에게 자연스럽게 최소 2회 유입 시도"],
    ["착석 유도 or 트위닛", "유입 고객에게 즉시 착석 or 트위닛 측정 안내"],
    ["환기성 응대", "고객 관심사·피부 고민을 빠르게 파악해 대화 유도"],
    ["수전 유도", "매장 진입 고객에게 수분 측정 등 체험 유도"],
  ], 1.55);

  // Script box
  s.addShape(pres.ShapeType.rect, {
    x: 0.4, y: 5.55, w: 12.53, h: 1.55,
    fill: { color: "EAF4FB" }, line: { color: C.blue, pt: 1 },
  });
  s.addText("유입 스크립트 예시", {
    x: 0.6, y: 5.6, w: 5, h: 0.4,
    fontFace: KR, fontSize: 13, bold: true, color: C.blue,
  });
  s.addText(
    "\"안녕하세요! 오늘 피부 수분 측정 무료로 해드리고 있어요.\n잠깐만 들어오셔서 체험해 보실래요? 2~3분이면 돼요.\"",
    {
      x: 0.6, y: 6.0, w: 12.1, h: 0.95,
      fontFace: KR, fontSize: 14, color: C.text, italic: true,
    }
  );
}

// ─── Slide 5: 고객 응대 ──────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "3. 고객 응대", "10점 · S등급", C.green);

  const steps = [
    ["①", "입장 인사",      '"어서오세요! 반갑습니다."'],
    ["②", "환기성 응대",    "고객 피부 고민 파악"],
    ["③", "수분 측정 유도", "트위닛 or 유수분 측정기"],
    ["④", "브랜드·제품 소개","측정 결과에 맞는 제품 안내"],
    ["⑤", "수분스틱 설명",  "전 고객 필수 설명"],
    ["⑥", "리갈패드 작성",  "개인정보 + 광고성 동의"],
    ["⑦", "마무리 인사",    "재방문 유도 멘트"],
  ];

  steps.forEach(([num, title, desc], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bw = 2.95, bh = 1.45;
    const sx = 0.4 + col * (bw + 0.15);
    const sy = 1.6 + row * (bh + 0.3);
    if (i === 6) {
      // Last item centered
      const x = 0.4 + 1.5 * (bw + 0.15);
      s.addShape(pres.ShapeType.rect, { x, y: sy, w: bw, h: bh, fill: { color: C.lightBlue }, line: { color: C.blue, pt: 1.5 } });
      s.addText(num, { x, y: sy + 0.05, w: bw, h: 0.45, fontFace: KR, fontSize: 18, bold: true, color: C.blue, align: "center" });
      s.addText(title, { x, y: sy + 0.45, w: bw, h: 0.45, fontFace: KR, fontSize: 14, bold: true, color: C.text, align: "center" });
      s.addText(desc, { x, y: sy + 0.88, w: bw, h: 0.5, fontFace: KR, fontSize: 12, color: C.gray, align: "center" });
    } else {
      s.addShape(pres.ShapeType.rect, { x: sx, y: sy, w: bw, h: bh, fill: { color: C.white }, line: { color: C.blue, pt: 1.5 } });
      s.addText(num, { x: sx, y: sy + 0.05, w: bw, h: 0.45, fontFace: KR, fontSize: 18, bold: true, color: C.blue, align: "center" });
      s.addText(title, { x: sx, y: sy + 0.45, w: bw, h: 0.45, fontFace: KR, fontSize: 14, bold: true, color: C.text, align: "center" });
      s.addText(desc, { x: sx, y: sy + 0.88, w: bw, h: 0.5, fontFace: KR, fontSize: 12, color: C.gray, align: "center" });
    }

    // Arrow between boxes (same row, not last in row, not item 3 to 4)
    if (i < 6 && col < 3) {
      s.addShape(pres.ShapeType.rightArrow, {
        x: sx + bw, y: sy + 0.55, w: 0.15, h: 0.35,
        fill: { color: C.blue }, line: { type: "none" },
      });
    }
  });

  principleBox(s, [
    "응대 루틴은 팀 전체가 동일하게 숙지하고 실행",
    "유입수·수전응대 카운팅 — 담당자 지정하여 누락 방지",
  ], 6.68);
}

// ─── Slide 6: 판매 관리 ──────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "4. 판매 관리", "10점 · S등급", C.green);

  // Check table (left)
  const leftRows = [
    [
      { text: "점검 항목", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    ...([
      "E카운트 사용법 숙지",
      "판매 유형별 구분 입력",
      "매장시트 필수탭 활용",
      "해당 월 행사 파악",
      "데일리리포트 기록",
    ].map((item, i) => [
      { text: item, options: { fill: i % 2 === 0 ? C.white : C.light, color: C.text } },
    ])),
  ];
  s.addTable(leftRows, {
    x: 0.4, y: 1.55, w: 5.5,
    colW: [5.5],
    fontFace: KR, fontSize: 14,
    rowH: 0.48,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });

  // E카운트 type table (right)
  const rightRows = [
    [
      { text: "유형", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "정의", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    ...([
      ["신규",    "첫 구매 고객"],
      ["재구매",  "이전 구매 이력 있는 고객"],
      ["수전",    "수분 측정 후 구매 고객"],
      ["선물",    "선물 목적 구매 고객"],
      ["환기성",  "지나다 유입된 고객의 구매"],
      ["트위닛",  "트위닛 측정 후 구매 고객"],
    ].map(([type, def], i) => [
      { text: type, options: { bold: true, fill: i % 2 === 0 ? "EAF4FB" : C.white, color: C.blue, align: "center" } },
      { text: def, options: { fill: i % 2 === 0 ? "EAF4FB" : C.white, color: C.text } },
    ])),
  ];
  s.addTable(rightRows, {
    x: 6.2, y: 1.55, w: 6.73,
    colW: [1.8, 4.93],
    fontFace: KR, fontSize: 13.5,
    rowH: 0.46,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });

  s.addText("E카운트 판매 유형 기준", {
    x: 6.2, y: 1.1, w: 5, h: 0.42,
    fontFace: KR, fontSize: 14, bold: true, color: C.navy,
  });

  principleBox(s, [
    "판매 발생 즉시 E카운트 유형 구분 입력 — 사후 수정 지양",
    "데일리리포트는 마감 전 반드시 완료 | 월초 행사 일정 팀 공지 필수",
  ], 6.7);
}

// ─── Slide 7: 고객 관리 ──────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "5. 고객 관리", "10점 · S등급", C.green);

  checkTable(s, [
    ["팀회의 & 회의록",     "월 2회 이상 진행, 회의록 공유 채널 업로드"],
    ["고객 이슈 공유",      "특이 고객 사항 팀원 전체 공유"],
    ["고객 특이사항 기록",  "성향·선호·불만 등 상세 기록"],
    ["재방문 이력 조회",    "방문 즉시 과거 기록 확인 후 응대"],
    ["VIP 고객 리스트",     "기준 설정 및 리스트 최신화 유지"],
    ["케어콜 진행",         "구매 후 3~7일 이내 첫 케어콜 — 결과 기록 업데이트"],
  ], 1.55);

  principleBox(s, [
    "필수 기록: 이름·연락처·방문일·구매 제품·피부 고민·특이사항·다음 방문 예정일",
    "VIP 기준: 누적 구매액 상위 / 월 1회 이상 재방문 / 지인 소개 이력 고객",
  ], 5.72);
}

// ─── Slide 8: 프로모션 활용 ──────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "6. 프로모션 활용  ⚠ 개선 필요", "4점 · B등급", C.orange);

  const items = [
    { icon: "🎁", title: "샘플 지급", color: "EAF4FB", border: C.blue,
      lines: ["기준 수량 이상 지급 유지", "신규 고객 유입 및 재방문 유도 목적만 사용", "남용 금지"] },
    { icon: "🎀", title: "GWP (Gift With Purchase)", color: "FEF9E7", border: C.orange,
      lines: ["팀장 승인 하에만 지급", "판매 목표 달성 고객 또는 VIP에게만 지급", "지급 내역 반드시 기록"] },
  ];

  items.forEach(({ icon, title, color, border, lines }, i) => {
    const x = 0.4 + i * 6.5;
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.6, w: 6.1, h: 3.8,
      fill: { color }, line: { color: border, pt: 2 },
    });
    s.addText(`${icon}  ${title}`, {
      x: x + 0.2, y: 1.75, w: 5.7, h: 0.6,
      fontFace: KR, fontSize: 17, bold: true, color: C.navy,
    });
    lines.forEach((line, j) => {
      s.addText(`▶  ${line}`, {
        x: x + 0.3, y: 2.45 + j * 0.65, w: 5.6, h: 0.55,
        fontFace: KR, fontSize: 14, color: C.text,
      });
    });
  });

  // Improvement box
  s.addShape(pres.ShapeType.rect, {
    x: 0.4, y: 5.6, w: 12.53, h: 1.55,
    fill: { color: "FDEDEC" }, line: { color: C.red, pt: 1.5 },
  });
  s.addText("⚠  개선 필요 사항", {
    x: 0.6, y: 5.68, w: 4, h: 0.45,
    fontFace: KR, fontSize: 14, bold: true, color: C.red,
  });
  s.addText("프로모션 지급 기준의 일관성 확보 및 GWP 남용 방지 교육 강화\n현황 B등급 → 목표 A등급: 기준 재정립 + 팀 내 공유 (2주 이내 완료)", {
    x: 0.6, y: 6.1, w: 12.1, h: 0.9,
    fontFace: KR, fontSize: 13.5, color: C.text,
  });
}

// ─── Slide 9: 에이브랩스 활용 ────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "7. 에이브랩스 활용", "4점 · B등급", C.orange);

  const cards = [
    { num: "01", title: "대시보드 확인", desc: "정기적으로 에이브랩스\n대시보드 모니터링" },
    { num: "02", title: "고객 이력 조회", desc: "고객 방문 즉시\n구매 이력 조회 후 응대" },
    { num: "03", title: "CRM 발송", desc: "월 2회 이상\nCRM 메시지 발송" },
    { num: "04", title: "발송 내용 공유", desc: "발송 전 팀장 검토 후\n전 팀원 내용 인지" },
  ];

  cards.forEach(({ num, title, desc }, i) => {
    const x = 0.4 + i * 3.2;
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.65, w: 2.95, h: 3.8,
      fill: { color: C.white }, line: { color: C.blue, pt: 2 },
    });
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.65, w: 2.95, h: 0.85,
      fill: { color: C.navy }, line: { type: "none" },
    });
    s.addText(num, {
      x, y: 1.65, w: 2.95, h: 0.85,
      fontFace: KR, fontSize: 22, bold: true, color: C.blue, align: "center", valign: "middle",
    });
    s.addText(title, {
      x: x + 0.1, y: 2.6, w: 2.75, h: 0.7,
      fontFace: KR, fontSize: 15, bold: true, color: C.navy, align: "center",
    });
    s.addText(desc, {
      x: x + 0.1, y: 3.35, w: 2.75, h: 1.8,
      fontFace: KR, fontSize: 13, color: C.text, align: "center",
    });
  });

  principleBox(s, [
    "고객 방문 시 고객 조회 및 구매 이력 확인 — 맞춤 응대의 핵심",
    "에이브랩스 발송 내용을 팀원 모두가 정확히 인지한 후 발송 진행",
  ], 5.65);
}

// ─── Slide 10: 트위닛 활용 ───────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "8. 트위닛 활용  ⚠ 개선 필요", "4점 · B등급", C.orange);

  const steps = [
    ["①", "유수분 측정기", "고객 유입 시\n피부 상태 측정"],
    ["②", "측정 결과 설명", "수치를 쉬운 말로\n고객에게 전달"],
    ["③", "트위닛 분석", "맞춤 제품 추천\n근거 제시"],
    ["④", "제품 추천", "데이터 기반\n신뢰 있는 설명"],
    ["⑤", "자연스런 클로징", "구매 유도 &\n재방문 예약"],
  ];

  steps.forEach(([num, title, desc], i) => {
    const x = 0.35 + i * 2.6;
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.65, w: 2.4, h: 3.5,
      fill: { color: i % 2 === 0 ? "EAF4FB" : C.white },
      line: { color: C.teal, pt: 2 },
    });
    s.addShape(pres.ShapeType.rect, {
      x, y: 1.65, w: 2.4, h: 0.75,
      fill: { color: C.teal }, line: { type: "none" },
    });
    s.addText(num, {
      x, y: 1.65, w: 2.4, h: 0.75,
      fontFace: KR, fontSize: 20, bold: true, color: C.white, align: "center", valign: "middle",
    });
    s.addText(title, {
      x: x + 0.1, y: 2.5, w: 2.2, h: 0.7,
      fontFace: KR, fontSize: 13, bold: true, color: C.navy, align: "center",
    });
    s.addText(desc, {
      x: x + 0.1, y: 3.25, w: 2.2, h: 1.5,
      fontFace: KR, fontSize: 12, color: C.text, align: "center",
    });

    if (i < 4) {
      s.addShape(pres.ShapeType.rightArrow, {
        x: x + 2.4, y: 2.9, w: 0.2, h: 0.4,
        fill: { color: C.teal }, line: { type: "none" },
      });
    }
  });

  s.addShape(pres.ShapeType.rect, {
    x: 0.4, y: 5.35, w: 12.53, h: 1.85,
    fill: { color: "FDEDEC" }, line: { color: C.red, pt: 1.5 },
  });
  s.addText("⚠  개선 필요 사항", {
    x: 0.6, y: 5.42, w: 4, h: 0.42,
    fontFace: KR, fontSize: 13.5, bold: true, color: C.red,
  });
  s.addText(
    "트위닛과 유수분 측정기의 병행 활용 강화 필요\n" +
    "응대 루틴에 '측정 → 분석 → 추천' 단계를 표준화하여 모든 팀원이 일관되게 실행",
    {
      x: 0.6, y: 5.85, w: 12.1, h: 1.2,
      fontFace: KR, fontSize: 13.5, color: C.text,
    }
  );
}

// ─── Slide 11: 근태 관리 ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "9. 근태 관리", "8점 · S등급", C.green);

  checkTable(s, [
    ["지각 관리", "1분 단위 지각 월 3회 미만 (조퇴·24시간 이내 스케줄 변경 포함)"],
    ["연속 근무", "연속 근무 5일 이하로 관리"],
    ["휴게시간", "법정 휴게시간 반드시 준수 — 교대로 운영, 매장 공백 방지"],
    ["휴대폰 사용", "업무 외 개인 휴대폰 사용 금지 (급한 개인 사정 제외)"],
    ["핸드빌 스케줄", "핸드빌 담당 스케줄 사전 배정 및 유지"],
  ], 1.55);

  principleBox(s, [
    "지각·조퇴·스케줄 변경은 팀장에게 반드시 사전 보고",
    "근태 기록은 월별로 집계하여 팀 평가에 반영",
  ], 5.55);
}

// ─── Slide 12: 평가 기준 & 등급 ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "평가 기준 및 등급");

  // Grade table
  const gradeRows = [
    [
      { text: "등급", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "기준", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "관리 판단", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    [
      { text: "S", options: { bold: true, color: C.white, fill: C.green, align: "center", fontSize: 18 } },
      { text: "만점 (완벽 수행)", options: { color: C.text } },
      { text: "유지", options: { color: C.green, bold: true, align: "center" } },
    ],
    [
      { text: "A", options: { bold: true, color: C.white, fill: "2ECC71", align: "center", fontSize: 18 } },
      { text: "80% 이상", options: { color: C.text, fill: C.light } },
      { text: "유지", options: { color: C.green, bold: true, align: "center", fill: C.light } },
    ],
    [
      { text: "B", options: { bold: true, color: C.white, fill: C.orange, align: "center", fontSize: 18 } },
      { text: "60 ~ 79%", options: { color: C.text } },
      { text: "개선 검토", options: { color: C.orange, bold: true, align: "center" } },
    ],
    [
      { text: "C", options: { bold: true, color: C.white, fill: C.red, align: "center", fontSize: 18 } },
      { text: "60% 미만", options: { color: C.text, fill: C.light } },
      { text: "즉시 개선", options: { color: C.red, bold: true, align: "center", fill: C.light } },
    ],
  ];

  s.addTable(gradeRows, {
    x: 0.4, y: 1.6, w: 5.8,
    colW: [1.1, 2.9, 1.8],
    fontFace: KR, fontSize: 14,
    rowH: 0.56,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });

  // Score table
  const scoreRows = [
    [
      { text: "영역", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "만점", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "현재", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    ...([
      ["1. 핸드빌",        "10", "10", C.green],
      ["2. 유입 관리",     "10", "10", C.green],
      ["3. 고객 응대",     "10", "10", C.green],
      ["4. 판매 관리",     "10", "10", C.green],
      ["5. 고객 관리",     "10", "10", C.green],
      ["6. 프로모션",      "4",  "4",  C.orange],
      ["7. 에이브랩스",    "4",  "4",  C.orange],
      ["8. 트위닛",        "4",  "4",  C.orange],
      ["9. 근태 관리",     "8",  "8",  C.green],
      ["합 계",            "70", "70", C.navy],
    ].map(([area, max, cur, col], i) => [
      { text: area, options: { fill: i % 2 === 0 ? C.white : C.light, color: C.text } },
      { text: max, options: { fill: i % 2 === 0 ? C.white : C.light, color: C.text, align: "center" } },
      { text: cur, options: { fill: i % 2 === 0 ? C.white : C.light, color: col, bold: true, align: "center" } },
    ])),
  ];

  s.addTable(scoreRows, {
    x: 7.0, y: 1.6, w: 5.9,
    colW: [3.4, 1.25, 1.25],
    fontFace: KR, fontSize: 13.5,
    rowH: 0.47,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });

  s.addText("⚑  관리 기준", {
    x: 0.4, y: 5.22, w: 5.8, h: 0.38,
    fontFace: KR, fontSize: 13, bold: true, color: C.navy,
  });
  s.addText("평균 3점 미만 영역 → 즉시 개선 대상 지정\n개선 내용 · 담당자 · 기한을 액션플랜에 반드시 작성", {
    x: 0.4, y: 5.58, w: 5.8, h: 0.85,
    fontFace: KR, fontSize: 12.5, color: C.text,
  });
}

// ─── Slide 13: 종합 평가 & 액션플랜 ──────────────────────────────────────────
{
  const s = pres.addSlide();
  sectionBg(s);
  header(s, "종합 평가 및 액션플랜");

  ["강점", "개선 필요 사항", "특이사항"].forEach((label, i) => {
    const colors = [C.green, C.orange, C.gray];
    s.addShape(pres.ShapeType.rect, {
      x: 0.4, y: 1.58 + i * 1.5, w: 12.53, h: 1.3,
      fill: { color: i === 0 ? "EAFAF1" : i === 1 ? "FEF9E7" : C.light },
      line: { color: colors[i], pt: 2 },
    });
    s.addText(label, {
      x: 0.55, y: 1.63 + i * 1.5, w: 3, h: 0.45,
      fontFace: KR, fontSize: 14, bold: true, color: colors[i],
    });
    s.addText("(내용 기재)", {
      x: 0.55, y: 2.05 + i * 1.5, w: 12.2, h: 0.65,
      fontFace: KR, fontSize: 13, color: C.gray, italic: true,
    });
  });

  // Action plan table
  const apRows = [
    [
      { text: "개선 영역", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "현황", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "개선 내용", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "담당자", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
      { text: "완료 기한", options: { bold: true, color: C.white, fill: C.navy, align: "center" } },
    ],
    [
      { text: "프로모션 활용", options: { fill: "FEF9E7", color: C.text } },
      { text: "GWP 기준 불명확", options: { fill: "FEF9E7", color: C.text } },
      { text: "지급 기준 재정립 및 팀 공유", options: { fill: "FEF9E7", color: C.text } },
      { text: "팀장", options: { fill: "FEF9E7", color: C.text, align: "center" } },
      { text: "2주 이내", options: { fill: "FEF9E7", color: C.orange, bold: true, align: "center" } },
    ],
    [
      { text: "트위닛 활용", options: { fill: C.light, color: C.text } },
      { text: "측정기 병행 부족", options: { fill: C.light, color: C.text } },
      { text: "응대 루틴에 측정 단계 추가", options: { fill: C.light, color: C.text } },
      { text: "전 팀원", options: { fill: C.light, color: C.text, align: "center" } },
      { text: "1주 이내", options: { fill: C.light, color: C.orange, bold: true, align: "center" } },
    ],
  ];

  s.addTable(apRows, {
    x: 0.4, y: 6.18, w: 12.53,
    colW: [2.1, 2.3, 3.7, 1.6, 1.83],
    fontFace: KR, fontSize: 12.5,
    rowH: 0.44,
    border: { type: "solid", pt: 1, color: "D5D8DC" },
  });
}

// ─── Export ──────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "매장관리_매뉴얼.pptx" })
  .then(() => console.log("PPTX 생성 완료: 매장관리_매뉴얼.pptx"))
  .catch(err => { console.error("오류:", err); process.exit(1); });
