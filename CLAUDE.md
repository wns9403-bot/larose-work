# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Generate the PPTX file
node generate_ppt.js

# Install dependencies
npm install
```

## Architecture

This is a single-file Node.js script (`generate_ppt.js`) that generates a Korean retail store management manual as a PowerPoint file (`매장관리_매뉴얼.pptx`) using the `pptxgenjs` library.

### Key constants

- `C` — color palette object (hex strings without `#`) used throughout all slides
- `KR` — Korean font name (`"맑은 고딕"`) used for all text
- Layout: `LAYOUT_WIDE` (13.33" × 7.5")

### Reusable helpers

| Function | Purpose |
|---|---|
| `header(slide, title, badge?, badgeColor?)` | Renders navy header bar with title and optional grade badge |
| `sectionBg(slide)` | Fills slide background with light gray (`C.light`) |
| `checkTable(slide, rows, yStart, colWidths?)` | Renders a two-column checklist table (항목 / 기준) |
| `principleBox(slide, lines, yStart)` | Renders a blue-bordered bullet-point box at the bottom of a slide |

### Slide structure

Each slide is an isolated block scope `{ const s = pres.addSlide(); ... }`. The 13 slides in order:

1. Title slide
2. 목차 (Table of Contents) — 3×3 grid of area cards
3–11. One slide per management area (핸드빌, 유입, 응대, 판매, 고객관리, 프로모션, 에이브랩스, 트위닛, 근태)
12. 평가 기준 및 등급 — grade table (S/A/B/C) + per-area score table
13. 종합 평가 및 액션플랜 — open text boxes + action plan table

B-grade slides (프로모션, 에이브랩스, 트위닛) use orange borders and include a red `⚠ 개선 필요` warning box.
