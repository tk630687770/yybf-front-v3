# 红球入口召回研究台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立独立的红球入口召回研究台，完整承接实验参数、预览保存、正式实验读取、逐期逐球证据、时间切片稳定性和权重网格。

**Architecture:** 新增独立路由和API模块，页面只编排状态；参数、指标、证据、实验列表、稳定性、网格拆为六个小组件。正式证据只读取后端专用实验表，不写IndexedDB，也不影响正式预测页面。

**Tech Stack:** Vue 3 Composition API、TypeScript、Vue Router、Axios、Tailwind CSS、Vite

---

## 状态总览

| 任务 | 状态 |
|---|---|
| Task 1：接口类型与API模块 | 已完成 |
| Task 2：实验参数与指标组件 | 已完成 |
| Task 3：逐期逐球证据组件 | 已完成 |
| Task 4：实验列表、对比与稳定性 | 已完成 |
| Task 5：权重网格与页面编排 | 开发中 |
| Task 6：路由、文档、构建和浏览器验证 | 待开发 |

## Task 1：接口类型与API模块

**Files:**
- Create: `src/api/modules/entryRecall.ts`

- [ ] 定义组件配置、实验请求、统一指标、逐期结果、逐球证据、实验主记录、证据包、稳定性和网格结果类型。
- [ ] 封装 `/run`、`/list`、`/detail`、`/compare`、`/stability`、`/grid-preview`。
- [ ] 为运行和网格预览设置300000毫秒超时。
- [ ] 执行 `npm run build`，确认类型定义与现有Axios封装兼容。
- [ ] 更新本计划状态并提交。

## Task 2：实验参数与指标组件

**Files:**
- Create: `src/components/lottery/entry-recall/EntryRecallExperimentForm.vue`
- Create: `src/components/lottery/entry-recall/EntryRecallMetricTable.vue`

- [ ] 实现实验名称、组件行、组合算法、入口规模、期号范围和最近期数编辑。
- [ ] 支持增加、删除组件和配额并集参数。
- [ ] 将入口规模文本解析为去重升序数字数组，并对6至33范围做前端校验。
- [ ] 实现各入口规模统一指标和0至6红分布展示。
- [ ] 执行 `npm run build`。
- [ ] 更新本计划状态并提交。

## Task 3：逐期逐球证据组件

**Files:**
- Create: `src/components/lottery/entry-recall/EntryRecallEvidencePanel.vue`

- [ ] 展示逐期入口池、实际红球、命中、遗漏、边界和最近遗漏号码。
- [ ] 点击逐期行后筛选对应期号的33球证据。
- [ ] 解析组件评分、排名和依据JSON为紧凑文本。
- [ ] 对实际开奖号、遗漏号码和非开奖号占位使用不同颜色。
- [ ] 执行 `npm run build`。
- [ ] 更新本计划状态并提交。

## Task 4：实验列表、对比与稳定性

**Files:**
- Create: `src/components/lottery/entry-recall/EntryRecallExperimentList.vue`
- Create: `src/components/lottery/entry-recall/EntryRecallStabilityPanel.vue`

- [ ] 展示已保存实验主记录和详情/稳定性/对比选择操作。
- [ ] 展示连续时间切片、跨切片最大波动和首末切片变化。
- [ ] 对正负变化按指标含义着色：平均命中、至少5红和完整6红增加为正向；低命中率下降为正向。
- [ ] 支持选择2至10个实验并触发对比读取。
- [ ] 执行 `npm run build`。
- [ ] 更新本计划状态并提交。

## Task 5：权重网格与页面编排

**Files:**
- Create: `src/components/lottery/entry-recall/EntryRecallGridPanel.vue`
- Create: `src/views/EntryRecallLab.vue`

- [ ] 实现两两矩阵组件、算法和预设权重选择。
- [ ] 展示候选编码以及Top15/18/20核心指标。
- [ ] 编排页面头部、参数、当前结果、证据、实验库、稳定性和网格区域。
- [ ] 处理预览、保存、详情、对比、稳定性和网格加载状态及错误提示。
- [ ] 执行 `npm run build`。
- [ ] 更新本计划状态并提交。

## Task 6：路由、文档、构建和浏览器验证

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`
- Modify: `docs/frontend-development-workflow.md`
- Modify: `docs/frontend-module-plan.md`
- Modify: `docs/project-structure.md`
- Modify: `README.md`

- [ ] 新增 `/entry-recall-lab` 路由和顶部导航。
- [ ] 更新页面职责、项目结构、接口和阶段状态文档。
- [ ] 执行 `npm run build`。
- [ ] 在浏览器验证页面身份、非空、无错误覆盖层、控制台健康和主要交互。
- [ ] 检查 `git diff --check` 和改动范围。
- [ ] 提交并推送GitHub。
