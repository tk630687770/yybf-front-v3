# Model Dashboard Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current overloaded model dashboard into prediction, snapshot review, and diagnostic research surfaces.

**Architecture:** Add three dedicated routes that reuse the existing `ModelDashboard.vue` logic in page modes. Hide action groups and content sections according to the active route so each page has a clear job while preserving existing stateful behavior.

**Tech Stack:** Vue 3, Vue Router, TypeScript, Vite.

---

### Task 1: Route And Navigation Split

**Files:**
- Modify: `E:\workspace\webstorm\yybf-front-v3\src\router\index.ts`
- Modify: `E:\workspace\webstorm\yybf-front-v3\src\App.vue`

- [x] Add routes `/prediction-console`, `/snapshot-review`, and `/diagnostic-lab`, all using `ModelDashboard.vue`.
- [x] Redirect `/model-dashboard` to `/prediction-console`.
- [x] Update the top navigation to show four clear entries: 基础窗口操作台、实时预测台、快照复盘台、诊断研究台.
- [x] Keep `/window-console` unchanged.

### Task 2: Page Mode Computed State

**Files:**
- Modify: `E:\workspace\webstorm\yybf-front-v3\src\views\ModelDashboard.vue`

- [x] Import `useRoute`.
- [x] Add computed page mode helpers:
  - `isPredictionPage`
  - `isReviewPage`
  - `isDiagnosticPage`
  - `pageTitle`
  - `pageSubtitle`
- [x] Use these helpers in the header.

### Task 3: Action Group Filtering

**Files:**
- Modify: `E:\workspace\webstorm\yybf-front-v3\src\views\ModelDashboard.vue`

- [x] Show prediction actions only on 实时预测台.
- [x] Show snapshot/review actions only on 快照复盘台.
- [x] Show diagnosis actions only on 诊断研究台.
- [x] Keep sync actions visible where they are useful: prediction and review pages.

### Task 4: Content Section Filtering

**Files:**
- Modify: `E:\workspace\webstorm\yybf-front-v3\src\views\ModelDashboard.vue`

- [x] Show 开奖信息 on all three model pages.
- [x] Show 最近预测快照 only on 快照复盘台.
- [x] Show 主推荐、9+1、10注6+1、候选依据 on 实时预测台 and 快照复盘台.
- [x] Show 贝叶斯、趋势、漏号分布、保底扩展、配额保底、单期漏号诊断 only on 诊断研究台.

### Task 5: Verification

**Files:**
- Test command only.

- [x] Run `npm run build`.
- [x] Use the in-app browser to verify each route renders:
  - `http://localhost:5173/prediction-console`
  - `http://localhost:5173/snapshot-review`
  - `http://localhost:5173/diagnostic-lab`
- [x] Confirm there are no console errors.
