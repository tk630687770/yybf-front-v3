<template>
  <!-- 模型预测/诊断结果台页面容器 -->
  <div class="p-4 space-y-4">
    <!-- 页面头部：说明当前页面职责，并按业务阶段组织操作入口 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-text-primary">{{ pageTitle }}</h1>
          <p class="mt-1 text-xs text-text-secondary">
            {{ pageSubtitle }}
          </p>
        </div>
        <div class="action-groups">
          <div v-if="isPredictionPage" class="action-group">
            <span class="action-title">预测</span>
            <button
              :disabled="loading"
              class="action-button action-button-primary"
              @click="loadPrediction"
            >
              {{ loading ? '加载中...' : '刷新预测' }}
            </button>
            <button
              v-if="viewMode === 'snapshot'"
              class="action-button"
              @click="returnRealtimePrediction"
            >
              返回实时预测
            </button>
          </div>
          <div v-if="isPredictionPage || isReviewPage" class="action-group">
            <span class="action-title">快照</span>
            <button
              v-if="isPredictionPage"
              :disabled="loading || saving || !finalPredict || !singlePlan"
              class="action-button"
              @click="saveSnapshot"
            >
              {{ saving ? '保存中...' : '保存快照' }}
            </button>
            <button
              v-if="isReviewPage"
              :disabled="snapshotLoading"
              class="action-button"
              @click="loadLatestSnapshots()"
            >
              {{ snapshotLoading ? '读取中...' : '读取快照' }}
            </button>
          </div>
          <div v-if="isReviewPage" class="action-group">
            <span class="action-title">复盘</span>
            <button
              :disabled="reviewing || !activeSnapshot"
              class="action-button"
              @click="reviewActiveSnapshot"
            >
              {{ reviewing ? '复盘中...' : '重新复盘' }}
            </button>
            <button
              :disabled="diagnosticSnapshotLoading || !canSaveDiagnosticSnapshot"
              class="action-button"
              @click="saveDiagnosticReviewPack"
            >
              {{ diagnosticSnapshotLoading ? '保存中...' : '保存诊断包' }}
            </button>
          </div>
          <div v-if="isDiagnosticPage" class="action-group">
            <span class="action-title">复盘诊断</span>
            <button
              :disabled="diagnosing || !activeSnapshot"
              :class="['action-button', { 'action-button-active': redMissDiagnosis }]"
              @click="toggleRedMissDiagnosis"
            >
              {{ diagnosing ? '诊断中...' : redMissDiagnosis ? '关闭单期漏号诊断' : '单期漏号诊断' }}
            </button>
            <button
              :disabled="trendLoading"
              :class="['action-button', { 'action-button-active': reviewTrend }]"
              @click="toggleReviewTrend"
            >
              {{ trendLoading ? '统计中...' : reviewTrend ? '关闭多期复盘趋势' : '多期复盘趋势' }}
            </button>
            <button
              :disabled="distributionLoading"
              :class="['action-button', { 'action-button-active': redMissDistribution }]"
              @click="toggleMissDistribution"
            >
              {{ distributionLoading ? '统计中...' : redMissDistribution ? '关闭多期漏号统计' : '多期漏号统计' }}
            </button>
            <button
              :disabled="funnelDiagnosisLoading"
              :class="['action-button', { 'action-button-active': redFunnelDiagnosis }]"
              @click="toggleFunnelDiagnosis"
            >
              {{ funnelDiagnosisLoading ? '诊断中...' : redFunnelDiagnosis ? '关闭阶段漏斗' : '阶段漏斗诊断' }}
            </button>
            <button
              :disabled="entryFusionLoading"
              :class="['action-button', { 'action-button-active': entryFusionBacktest }]"
              @click="toggleEntryFusionBacktest"
            >
              {{ entryFusionLoading ? '回测中...' : entryFusionBacktest ? '关闭入口融合' : '入口融合回测' }}
            </button>
            <button
              :disabled="entryRescoreFusionLoading"
              :class="['action-button', { 'action-button-active': entryRescoreFusionBacktest }]"
              @click="toggleEntryRescoreFusionBacktest"
            >
              {{ entryRescoreFusionLoading ? '回测中...' : entryRescoreFusionBacktest ? '关闭入口重评分' : '入口重评分' }}
            </button>
            <button
              :disabled="entryFusionGridLoading"
              :class="['action-button', { 'action-button-active': entryFusionGridBacktest }]"
              @click="toggleEntryFusionGridBacktest"
            >
              {{ entryFusionGridLoading ? '回测中...' : entryFusionGridBacktest ? '关闭入口融合网格' : '入口融合网格' }}
            </button>
            <button
              :disabled="combinationFusionLoading"
              :class="['action-button', { 'action-button-active': combinationFusionBacktest }]"
              @click="toggleCombinationFusionBacktest"
            >
              {{ combinationFusionLoading ? '回测中...' : combinationFusionBacktest ? '关闭组合融合' : '组合融合回测' }}
            </button>
            <button
              :disabled="combinationSourceWeightGridLoading"
              :class="['action-button', { 'action-button-active': combinationSourceWeightGridBacktest }]"
              @click="toggleCombinationSourceWeightGridBacktest"
            >
              {{ combinationSourceWeightGridLoading ? '回测中...' : combinationSourceWeightGridBacktest ? '关闭来源权重网格' : '来源权重网格' }}
            </button>
            <button
              :disabled="guardBacktestLoading"
              :class="['action-button', { 'action-button-active': isGuardBacktestOpen }]"
              @click="toggleGuardBacktestComparison"
            >
              {{ guardBacktestLoading ? '回测中...' : isGuardBacktestOpen ? '关闭保底扩展对照' : '保底扩展对照' }}
            </button>
            <button
              :disabled="guardQuotaGridLoading"
              :class="['action-button', { 'action-button-active': guardQuotaGridBacktest }]"
              @click="toggleGuardQuotaGridBacktest"
            >
              {{ guardQuotaGridLoading ? '回测中...' : guardQuotaGridBacktest ? '关闭配额网格回测' : '配额网格回测' }}
            </button>
            <button
              :disabled="guardCompressionLoading"
              :class="['action-button', { 'action-button-active': guardCompressionBacktest }]"
              @click="toggleGuardCompressionBacktest"
            >
              {{ guardCompressionLoading ? '回测中...' : guardCompressionBacktest ? '关闭扩展池压缩' : '扩展池压缩回测' }}
            </button>
            <button
              :disabled="guardCompressionGridLoading"
              :class="['action-button', { 'action-button-active': guardCompressionGridBacktest }]"
              @click="toggleGuardCompressionGridBacktest"
            >
              {{ guardCompressionGridLoading ? '回测中...' : guardCompressionGridBacktest ? '关闭压缩策略网格' : '压缩策略网格' }}
            </button>
            <button
              :disabled="guardCompressionRetentionGridLoading"
              :class="['action-button', { 'action-button-active': guardCompressionRetentionGridBacktest }]"
              @click="toggleGuardCompressionRetentionGridBacktest"
            >
              {{ guardCompressionRetentionGridLoading ? '回测中...' : guardCompressionRetentionGridBacktest ? '关闭保留位回测' : '保留位回测' }}
            </button>
            <button
              :disabled="bayesLoading"
              :class="['action-button', { 'action-button-active': bayesDiagnosis }]"
              @click="toggleBayesDiagnosis"
            >
              {{ bayesLoading ? '诊断中...' : bayesDiagnosis ? '关闭贝叶斯冷热' : '贝叶斯冷热' }}
            </button>
            <button
              :disabled="blueDiagnosisLoading"
              :class="['action-button', { 'action-button-active': blueCandidateDiagnosis }]"
              @click="toggleBlueCandidateDiagnosis"
            >
              {{ blueDiagnosisLoading ? '诊断中...' : blueCandidateDiagnosis ? '关闭蓝球诊断' : '蓝球独立诊断' }}
            </button>
            <button
              :disabled="costTicketReviewLoading"
              :class="['action-button', { 'action-button-active': costTicketReview }]"
              @click="toggleCostTicketReview"
            >
              {{ costTicketReviewLoading ? '评审中...' : costTicketReview ? '关闭成本出票线' : '成本出票线' }}
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="message"
        :class="[
          'mt-3 text-xs',
          messageType === 'success' ? 'text-green-400' : 'text-red-400'
        ]"
      >
        {{ message }}
      </div>
      <div class="mt-3 flex flex-wrap gap-2 text-xs">
        <span
          :class="[
            'px-2 py-1 rounded',
            viewMode === 'realtime' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
          ]"
        >
          当前模式：{{ viewMode === 'realtime' ? '实时预测' : '历史快照' }}
        </span>
        <span v-if="activeSnapshot" class="px-2 py-1 rounded bg-bg-secondary text-text-secondary">
          快照ID：{{ activeSnapshot.id }} / 保存时间：{{ activeSnapshot.createTime }}
        </span>
      </div>
    </section>

    <DrawContextPanel
      :latest-qi-hao="latestDraw?.qiHao"
      :latest-date-and-week="latestDraw?.dateAndWeek"
      :latest-ticket-text="latestDraw ? `${drawRedText(latestDraw)} + ${latestDraw.blue}` : '--'"
      :current-predict-qi-hao="currentPredictQiHao || '--'"
      :review-availability-text="reviewAvailabilityText"
      :selected-snapshot-can-review="selectedSnapshotCanReview"
      :prediction-needs-window-sync="predictionNeedsWindowSync"
      :axis-sync-results="axisSyncResults"
      :workflow-summary-text="workflowSummaryText"
      :workflow-steps="postDrawWorkflowSteps"
      :draw-loading="drawLoading"
      :axis-sync-loading="axisSyncLoading"
      @refresh-draw-context="refreshDrawContext"
      @sync-axis-chains="syncAxisChains"
    />

    <section v-if="isDiagnosticPage" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">诊断阅读顺序</h2>
          <p class="mt-1 text-xs text-text-secondary">
            先看结果是否变好，再看号码在哪一层丢失，最后看观察策略是否值得继续跟踪。
          </p>
        </div>
        <span class="text-xs text-text-secondary">观察链路不直接改变正式出票</span>
      </div>
      <div class="mt-3 diagnostic-guide-grid">
        <div
          v-for="item in diagnosticGuideItems"
          :key="item.title"
          class="diagnostic-guide-item"
        >
          <div class="diagnostic-guide-order">{{ item.order }}</div>
          <div>
            <div class="diagnostic-guide-title">{{ item.title }}</div>
            <div class="diagnostic-guide-desc">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="isDiagnosticPage" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">诊断指标速读</h2>
          <p class="mt-1 text-xs text-text-secondary">
            这些解释用于阅读下方所有诊断结果；当前仍是观察线，不代表已经进入正式预测。
          </p>
        </div>
        <span class="text-xs text-text-secondary">先看覆盖，再看压缩，再看稳定性</span>
      </div>

      <div class="mt-3 metric-guide-grid">
        <div
          v-for="item in diagnosticMetricGuideItems"
          :key="item.title"
          class="metric-guide-item"
        >
          <div class="metric-guide-title">{{ item.title }}</div>
          <div class="metric-guide-formula">{{ item.formula }}</div>
          <div class="metric-guide-desc">{{ item.description }}</div>
          <div class="metric-guide-watch">{{ item.watchPoint }}</div>
        </div>
      </div>

      <div class="mt-3 info-box">
        当前判断顺序：如果入口池本身覆盖不足，优先改入口；如果入口有覆盖但组合池掉了，优先改组合评分；
        如果扩展池能救回但压缩后又丢失，优先改压缩策略；如果红球改善但蓝球漏掉，蓝球必须单独诊断。
      </div>
    </section>

    <section v-if="isDiagnosticPage" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">策略准入规则</h2>
          <p class="mt-1 text-xs text-text-secondary">
            观察策略进入正式预测前，必须先满足多期稳定性；这里给出当前是否可以升级的明确提示。
          </p>
        </div>
        <span :class="['strategy-admission-badge', strategyAdmissionStateClass]">
          {{ strategyAdmissionStateText }}
        </span>
      </div>

      <div class="mt-3 strategy-admission-grid">
        <div
          v-for="item in strategyAdmissionChecks"
          :key="item.title"
          :class="['strategy-admission-item', `strategy-admission-${item.status}`]"
        >
          <div class="strategy-admission-title">{{ item.title }}</div>
          <div class="strategy-admission-status">{{ item.statusText }}</div>
          <div class="strategy-admission-desc">{{ item.description }}</div>
        </div>
      </div>

      <div class="mt-3 info-box">
        准入纪律：任何观察策略要进入正式预测，至少需要6-7期样本；覆盖率必须提升，压缩后不能明显回落；
        蓝球不能继续拖后腿；并且必须先写入策略决策记录，再升级模型版本。
      </div>
    </section>

    <!-- 成本出票线：只读取已保存快照的成本事实，不改变预测和复盘证据 -->
    <section v-if="isDiagnosticPage && costTicketReview" :class="diagnosticSectionClass('costTicketReview')">
      <div class="diagnostic-section-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">成本出票线只读评审</h2>
          <p class="mt-1 text-xs text-text-secondary">
            只对已保存且已复盘的正式快照、入口拟正式快照做成本事实对照，不代表购买建议。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          评审期数：{{ costTicketReview.periodCount }} / 正式快照：{{ costTicketReview.formalSnapshotCount }} / 入口快照：{{ costTicketReview.reviewedEntrySnapshotCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('costTicketReview')">
          {{ diagnosticSectionCollapseText('costTicketReview') }}
        </button>
      </div>

      <div class="mt-3 warning-box">
        该模块只做已保存快照的成本事实对照，不代表购买建议。样本不足时只能观察成本风险，不能作为稳定策略结论。
      </div>

      <div v-if="costTicketReview.warnings.length" class="mt-3 warning-box">
        <div v-for="warning in costTicketReview.warnings" :key="warning">- {{ warning }}</div>
      </div>

      <div class="mt-3 summary-grid">
        <div class="summary-block">
          <div class="summary-label">正式快照</div>
          <div class="summary-value">{{ costTicketReview.formalSnapshotCount }} 条</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">入口拟正式快照</div>
          <div class="summary-value">{{ costTicketReview.reviewedEntrySnapshotCount }} / {{ costTicketReview.entrySnapshotCount }} 条已复盘</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">当前结论</div>
          <div class="summary-value text-xs leading-relaxed">{{ costTicketReview.conclusion }}</div>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('strategyNameCn')">
                  策略 {{ costTicketSortMark('strategyNameCn') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('periodCount')">
                  样本 {{ costTicketSortMark('periodCount') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('totalCost')">
                  总成本 {{ costTicketSortMark('totalCost') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('totalPrize')">
                  总奖金 {{ costTicketSortMark('totalPrize') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('netAmount')">
                  净收益 {{ costTicketSortMark('netAmount') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('bestRedHitAverage')">
                  最高红均值 {{ costTicketSortMark('bestRedHitAverage') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('blueHitRate')">
                  蓝球命中 {{ costTicketSortMark('blueHitRate') }}
                </button>
              </th>
              <th>
                <button class="sortable-th" @click="setCostTicketSort('maxLossStreak')">
                  最大连亏 {{ costTicketSortMark('maxLossStreak') }}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="metric in sortedCostTicketMetrics" :key="metric.strategyCode">
              <td>
                <div class="font-bold text-text-primary">{{ metric.strategyNameCn }}</div>
                <div class="mt-1 text-xs text-text-secondary">{{ metric.strategyCode }} / {{ metric.sourceType }}</div>
              </td>
              <td>{{ metric.periodCount }}</td>
              <td>{{ metric.totalCost }}</td>
              <td>{{ metric.totalPrize }}</td>
              <td :class="metric.netAmount >= 0 ? 'text-green-400' : 'text-red-400'">{{ metric.netAmount }}</td>
              <td>{{ formatNumber(metric.bestRedHitAverage, 2) }}</td>
              <td>{{ formatPercent(metric.blueHitRate) }}</td>
              <td>{{ metric.maxLossStreak }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="mt-4 diagnosis-collapse rounded-lg p-3">
        <summary class="diagnosis-summary">
          <div>
            <h3 class="text-sm font-bold text-text-primary">逐期策略明细</h3>
            <p class="mt-1 text-xs text-text-secondary">
              默认折叠；用于追查某个策略在哪些期花费、中奖或连续亏损。
            </p>
          </div>
          <span class="diagnosis-toggle-text">展开明细</span>
        </summary>
        <div class="mt-3 overflow-x-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>策略</th>
                <th>来源</th>
                <th>成本</th>
                <th>奖金</th>
                <th>净收益</th>
                <th>最高红</th>
                <th>蓝球</th>
                <th>奖级</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in costTicketReview.periodRows" :key="`${row.predictQiHao}-${row.strategyCode}-${row.sourceSnapshotId ?? 'entry'}-${row.sourceExperimentId ?? 'formal'}-${row.entrySize ?? 'none'}`">
                <td>{{ row.predictQiHao }}</td>
                <td>{{ costTicketStrategyName(row.strategyCode) }}</td>
                <td>
                  <div v-if="row.sourceSnapshotId">正式快照 {{ row.sourceSnapshotId }}</div>
                  <div v-if="row.sourceExperimentId">入口实验 {{ row.sourceExperimentId }} / Top{{ row.entrySize }}</div>
                  <div v-if="!row.sourceSnapshotId && !row.sourceExperimentId">基准</div>
                </td>
                <td>{{ row.costAmount }}</td>
                <td>{{ row.prizeAmount }}</td>
                <td :class="row.netAmount >= 0 ? 'text-green-400' : 'text-red-400'">{{ row.netAmount }}</td>
                <td>{{ row.bestRedHitCount }}</td>
                <td>{{ row.blueHit ? '命中' : '未中' }}</td>
                <td>{{ row.bestPrizeLevel || '--' }}</td>
                <td class="table-note">{{ row.evidenceNote }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <SnapshotListPanel
      v-if="isReviewPage"
      :snapshots="snapshots"
      :reviewing-snapshot-id="reviewingSnapshotId"
      :actual-ticket-text="snapshotActualTicketText"
      :review-text="snapshotReviewText"
      :review-badge-class="snapshotReviewBadgeClass"
      :draw-text="snapshotDrawText"
      :draw-badge-class="snapshotDrawBadgeClass"
      :action-text="snapshotActionText"
      @select-snapshot="handleSnapshotAction"
    />

    <!-- 红球贝叶斯冷热诊断：单号动态修正观察，不直接改变正式预测 -->
    <section v-if="isDiagnosticPage && bayesDiagnosis" :class="diagnosticSectionClass('bayes')">
      <div class="diagnostic-section-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球贝叶斯冷热诊断</h2>
          <p class="mt-1 text-xs text-text-secondary">
            这是单号动态观察层：长期先验 × 近期窗口证据，并用多重比较校正过滤偶然异常。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          预测期号：{{ bayesDiagnosis.predictQiHao }} / 窗口：{{ bayesDiagnosis.windowSizes.join(',') }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('bayes')">
          {{ diagnosticSectionCollapseText('bayes') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">历史样本</div>
          <div class="summary-value">{{ bayesDiagnosis.historyPeriodCount }} 期</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">显著性水平</div>
          <div class="summary-value">{{ bayesDiagnosis.alpha }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">Bonferroni阈值</div>
          <div class="summary-value">{{ formatScore(bayesDiagnosis.bonferroniThreshold) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">严格显著数量</div>
          <div class="summary-value">
            {{ bayesDiagnosis.numbers.filter(item => item.bonferroniSignificant).length }} 个
            <span class="text-text-secondary">
              / FDR {{ bayesDiagnosis.numbers.filter(item => item.fdrSignificant).length }} 个
            </span>
          </div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ bayesDiagnosis.conclusion }}</p>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>红球</th>
              <th>贝叶斯分</th>
              <th>长期先验</th>
              <th>近期似然</th>
              <th>最强窗口</th>
              <th>p值</th>
              <th>信号</th>
              <th>可靠性</th>
              <th>窗口明细</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in bayesDiagnosis.numbers.slice(0, 15)" :key="item.number">
              <td>{{ item.rank }}</td>
              <td class="font-bold text-ball-red">{{ item.number }}</td>
              <td class="font-bold text-text-primary">{{ formatScore(item.bayesNormalizedScore) }}</td>
              <td>{{ formatScore(item.priorRatio) }}</td>
              <td>{{ formatScore(item.weightedLikelihoodRatio) }}</td>
              <td>{{ item.minPValueWindow }}期</td>
              <td>{{ formatScore(item.minPValue) }}</td>
              <td>{{ bayesSignalText(item.signalType) }}</td>
              <td>
                <span :class="bayesReliabilityClass(item.reliabilityLevel)">
                  {{ bayesReliabilityText(item.reliabilityLevel) }}
                </span>
              </td>
              <td class="table-note">
                <span
                  v-for="detail in item.windowDetails"
                  :key="`${item.number}-${detail.windowSize}`"
                  class="mr-2"
                >
                  {{ detail.windowSize }}期: {{ detail.actualTimes }}/{{ formatScore(detail.expectedTimes) }}
                  ×{{ formatScore(detail.likelihoodRatio) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse bg-bg-secondary mt-3">
        <summary>
          <span>公式说明</span>
          <span class="text-xs text-text-secondary">展开查看</span>
        </summary>
        <p class="mt-2 text-xs text-text-secondary leading-6">{{ bayesDiagnosis.formulaDescription }}</p>
      </details>
    </section>

    <!-- 多期复盘趋势：用已复盘快照判断模型是否沿着正确方向进步 -->
    <section v-if="isDiagnosticPage && reviewTrend" :class="diagnosticSectionClass('reviewTrend')">
      <div class="diagnostic-section-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">多期复盘趋势</h2>
          <p class="mt-1 text-xs text-text-secondary">
            按预测期号去重，每期只取最新一个已复盘快照，避免同一期多次保存放大样本。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          统计期数：{{ reviewTrend.periodCount }} / 原始已复盘快照：{{ reviewTrend.reviewedSnapshotCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('reviewTrend')">
          {{ diagnosticSectionCollapseText('reviewTrend') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">主推荐平均命中</div>
          <div class="summary-value">
            {{ formatScore(reviewTrend.recommendedAverageRedHit) }}红
            <span :class="reviewTrend.recommendedBlueHitRate > 0 ? 'text-ball-blue' : 'text-text-secondary'">
              / 蓝{{ formatPercent(reviewTrend.recommendedBlueHitRate) }}
            </span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">红球组合榜最高命中</div>
          <div class="summary-value">
            {{ formatScore(reviewTrend.redCombinationAverageBestHit) }}红
            <span class="text-text-secondary">/ 完整{{ reviewTrend.redCombinationFullHitTimes }}次</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">蓝球候选命中率</div>
          <div class="summary-value">
            {{ formatPercent(reviewTrend.blueCandidateHitRate) }}
            <span class="text-text-secondary">/ Top1 {{ formatPercent(reviewTrend.blueCandidateTop1HitRate) }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注6+1收益</div>
          <div class="summary-value">
            {{ reviewTrend.singleTicketTotalPrizeAmount }} - {{ reviewTrend.singleTicketTotalCostAmount }}
            = {{ reviewTrend.singleTicketTotalNetAmount }} 元
          </div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ reviewTrend.conclusion }}</p>

      <div class="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div class="summary-block">
          <div class="summary-label">主失败归因</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary">
            <div
              v-for="item in reviewTrend.failureItems"
              :key="item.type"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-text-primary">{{ item.label }}</span>
              <span>{{ item.times }}次 / {{ formatPercent(item.ratio) }}</span>
            </div>
            <div v-if="reviewTrend.failureItems.length === 0">暂无数据</div>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注最高命中分布</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary">
            <div
              v-for="item in distributionEntries(reviewTrend.singleTicketBestRedHitDistribution)"
              :key="item.key"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-text-primary">{{ item.key }}红</span>
              <span>{{ item.value }}期</span>
            </div>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">阶段建议</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary leading-6">
            <p v-for="item in reviewTrend.suggestions" :key="item">- {{ item }}</p>
          </div>
        </div>
      </div>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际开奖</th>
              <th>主推荐</th>
              <th>主推荐</th>
              <th>红组合榜</th>
              <th>蓝候选</th>
              <th>10注最高</th>
              <th>10注收益</th>
              <th>主归因</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reviewTrend.periods" :key="item.snapshotId">
              <td>{{ item.predictQiHao }}</td>
              <td class="font-bold text-text-primary">
                <TicketTextByText
                  :ticket-text="item.actualTicketText"
                  :actual-ticket-text="item.actualTicketText"
                />
              </td>
              <td class="font-bold text-text-primary">
                <TicketTextByText
                  :ticket-text="item.recommendedTicketText"
                  :actual-ticket-text="item.actualTicketText"
                />
              </td>
              <td>
                {{ item.recommendedRedHitCount }}红 /
                <span :class="item.recommendedBlueHit ? 'text-ball-blue' : 'text-text-secondary'">
                  {{ item.recommendedBlueHit ? '蓝中' : '蓝未中' }}
                </span>
                / {{ item.recommendedPrizeLevel }}
              </td>
              <td>{{ item.redCombinationBestHitCount }}红</td>
              <td>
                <span :class="item.blueCandidateHit ? 'text-ball-blue' : 'text-red-400'">
                  {{ item.blueCandidateHit ? `第${item.blueCandidateHitRank}名` : '未覆盖' }}
                </span>
              </td>
              <td>
                {{ item.singleTicketBestRedHitCount }}红 /
                <span :class="item.singleTicketAnyBlueHit ? 'text-ball-blue' : 'text-text-secondary'">
                  {{ item.singleTicketAnyBlueHit ? '蓝中' : '蓝未中' }}
                </span>
              </td>
              <td>{{ item.singleTicketPrizeAmount }} - {{ item.singleTicketCostAmount }} = {{ item.singleTicketNetAmount }}</td>
              <td class="table-note">{{ item.failureReason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 蓝球候选池独立诊断 -->
    <section v-if="isDiagnosticPage && blueCandidateDiagnosis" :class="diagnosticSectionClass('blueCandidate')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">蓝球候选池独立诊断</h2>
          <p class="mt-1 text-xs text-text-secondary">
            统计期数：{{ blueCandidateDiagnosis.periodCount }} / 候选口径：Top{{ blueCandidateDiagnosis.topLimit }} / 原始已复盘快照：{{ blueCandidateDiagnosis.reviewedSnapshotCount }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('blueCandidate')">
          {{ diagnosticSectionCollapseText('blueCandidate') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="summary-block">
          <div class="summary-label">候选池命中率</div>
          <div class="summary-value text-ball-blue">{{ formatPercent(blueCandidateDiagnosis.candidateHitRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">Top1 / Top3</div>
          <div class="summary-value">
            {{ formatPercent(blueCandidateDiagnosis.top1HitRate) }}
            <span class="text-text-secondary">/ {{ formatPercent(blueCandidateDiagnosis.top3HitRate) }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">主蓝命中率</div>
          <div class="summary-value">{{ formatPercent(blueCandidateDiagnosis.recommendedBlueHitRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">重蓝 / 邻蓝 / 重尾</div>
          <div class="summary-value">
            {{ blueCandidateDiagnosis.sameAsPreviousCount }}
            <span class="text-text-secondary">/ {{ blueCandidateDiagnosis.neighborOfPreviousCount }} / {{ blueCandidateDiagnosis.sameTailAsPreviousCount }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均遗漏间隔</div>
          <div class="summary-value">{{ blueCandidateDiagnosis.averageMissInterval ?? '--' }} 期</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ blueCandidateDiagnosis.conclusion }}</p>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际蓝</th>
              <th>上期蓝</th>
              <th>候选池</th>
              <th>命中排名</th>
              <th>Top状态</th>
              <th>重邻尾</th>
              <th>遗漏</th>
              <th>判断</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in blueCandidateDiagnosis.periods" :key="item.snapshotId">
              <td>{{ item.predictQiHao }}</td>
              <td>
                <HitNumberList
                  :numbers="[item.actualBlueNumber]"
                  kind="blue"
                  :actual-blue-number="item.actualBlueNumber"
                />
              </td>
              <td>{{ item.previousBlueNumber || '--' }}</td>
              <td>
                <HitNumberList
                  :numbers="item.candidateNumbers"
                  kind="blue"
                  :actual-blue-number="item.actualBlueNumber"
                />
              </td>
              <td>
                <span :class="item.candidateHit ? 'text-ball-blue' : 'text-red-400'">
                  {{ item.candidateHit ? `第${item.candidateHitRank}名` : '未覆盖' }}
                </span>
              </td>
              <td>
                <span :class="item.top1Hit ? 'text-ball-blue' : 'text-text-secondary'">Top1</span>
                /
                <span :class="item.top3Hit ? 'text-ball-blue' : 'text-text-secondary'">Top3</span>
              </td>
              <td>
                重{{ item.sameAsPrevious ? '是' : '否' }}
                / 邻{{ item.neighborOfPrevious ? '是' : '否' }}
                / 尾{{ item.sameTailAsPrevious ? '是' : '否' }}
              </td>
              <td>{{ item.missInterval ?? '--' }}期</td>
              <td>{{ item.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 summary-block">
        <div class="summary-label">阶段建议</div>
        <div class="summary-value text-sm leading-6">
          <p v-for="item in blueCandidateDiagnosis.suggestions" :key="item">- {{ item }}</p>
        </div>
      </div>
    </section>

    <!-- 红球漏号分布统计 -->
    <section v-if="isDiagnosticPage && redMissDistribution" :class="diagnosticSectionClass('missDistribution')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球漏号分布统计</h2>
        <span class="text-xs text-text-secondary">已复盘快照：{{ redMissDistribution.snapshotCount }}</span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('missDistribution')">
          {{ diagnosticSectionCollapseText('missDistribution') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">主候选池覆盖率</div>
          <div class="summary-value">
            {{ formatPercent(redMissDistribution.combinationCoverageRate) }}
            <span class="text-text-secondary">
              {{ redMissDistribution.combinationHitCount }}/{{ redMissDistribution.actualRedCount }}
            </span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注票面池覆盖率</div>
          <div class="summary-value">
            {{ formatPercent(redMissDistribution.singleTicketCoverageRate) }}
            <span class="text-text-secondary">
              {{ redMissDistribution.singleTicketHitCount }}/{{ redMissDistribution.actualRedCount }}
            </span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">完全漏号率</div>
          <div class="summary-value text-yellow-400">
            {{ formatPercent(redMissDistribution.fullMissRate) }}
            <span class="text-text-secondary">{{ redMissDistribution.fullMissCount }}个</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注补回</div>
          <div class="summary-value text-accent">{{ redMissDistribution.rescuedBySingleTicketCount }} 个红球</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ redMissDistribution.conclusion }}</p>

      <div class="mt-3 grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div
          v-for="group in distributionGroups"
          :key="group.title"
          class="summary-block"
        >
          <div class="summary-label">{{ group.title }}</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary">
            <div
              v-for="item in group.items"
              :key="item.key"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-text-primary">{{ item.label }}</span>
              <span>{{ item.times }}次 / {{ formatPercent(item.ratio) }}</span>
            </div>
            <div v-if="group.items.length === 0">暂无数据</div>
          </div>
        </div>
      </div>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in redMissDistribution.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球候选池阶段漏斗诊断 -->
    <section v-if="isDiagnosticPage && redFunnelDiagnosis" :class="diagnosticSectionClass('redFunnel')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球候选池阶段漏斗诊断</h2>
          <p class="mt-1 text-xs text-text-secondary">
            统计期数：{{ redFunnelDiagnosis.periodCount }} / 红10入口Top{{ redFunnelDiagnosis.red10EntryLimit }} / 保底配额：{{ redFunnelDiagnosis.guardQuotaText }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('redFunnel')">
          {{ diagnosticSectionCollapseText('redFunnel') }}
        </button>
      </div>

      <div class="mt-3 info-box">
        {{ redFunnelDiagnosis.replayBoundary }}
        <div class="mt-2">
          第二批增强口径：每一层都会和上一层比较，“救回”表示上一层没命中但本层命中的真实红球；
          “丢失”表示上一层命中过但本层没有继续保住的真实红球。
        </div>
      </div>

      <div class="mt-4 funnel-flow-grid">
        <div
          v-for="item in redFunnelDiagnosis.stageSummaries"
          :key="item.stageCode"
          class="funnel-flow-card"
        >
          <div class="funnel-flow-title">{{ item.stageName }}</div>
          <div class="funnel-flow-value">
            平均{{ formatScore(item.averageHitCount) }}红 / 覆盖{{ formatPercent(item.coverageRate) }}
          </div>
          <div class="funnel-flow-meta">
            最低{{ item.minHitCount }}红，最高{{ item.maxHitCount }}红；达到4红 {{ item.reachFourCount }}期。
          </div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div class="summary-block">
          <div class="summary-label">总体结论</div>
          <div class="summary-value text-sm">{{ redFunnelDiagnosis.conclusion }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">下一步建议</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary">
            <p v-for="item in redFunnelDiagnosis.suggestions" :key="item">- {{ item }}</p>
          </div>
        </div>
      </div>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>阶段</th>
              <th>候选池</th>
              <th>命中</th>
              <th>变化</th>
              <th>本层救回</th>
              <th>本层丢失</th>
              <th>漏号</th>
              <th>覆盖率</th>
              <th>解释</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="period in redFunnelDiagnosis.periods" :key="period.predictQiHao">
              <tr v-for="stage in period.stages" :key="`${period.predictQiHao}-${stage.stageCode}`">
                <td>{{ period.predictQiHao }}</td>
                <td>
                  <div class="font-bold text-text-primary">{{ stage.stageName }}</div>
                  <div class="mt-1 text-xs text-text-secondary">{{ stage.dataSource }}</div>
                </td>
                <td>
                  <HitNumberList
                    :numbers="stage.candidateNumbers"
                    kind="red"
                    :actual-red-numbers="period.actualRedNumbers"
                  />
                </td>
                <td class="text-ball-red font-bold">{{ stage.hitCount }}红 {{ stage.hitNumbers.join(',') || '--' }}</td>
                <td :class="funnelDeltaClass(stage.hitDelta)">
                  {{ funnelDeltaText(stage.hitDelta) }}
                </td>
                <td>
                  <HitNumberList
                    :numbers="stage.gainedHitNumbers || []"
                    kind="red"
                    :actual-red-numbers="period.actualRedNumbers"
                  />
                </td>
                <td>
                  <HitNumberList
                    :numbers="stage.lostHitNumbers || []"
                    kind="red"
                    :actual-red-numbers="period.actualRedNumbers"
                  />
                </td>
                <td>{{ stage.missNumbers.join(',') || '--' }}</td>
                <td>{{ formatPercent(stage.coverageRate) }}</td>
                <td class="table-note">{{ stage.explanation }}</td>
              </tr>
              <tr class="diagnostic-subtotal-row">
                <td colspan="10">第{{ period.predictQiHao }}期判断：{{ period.conclusion }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 红球入口池融合回测 -->
    <section v-if="isDiagnosticPage && entryFusionBacktest" :class="diagnosticSectionClass('entryFusion')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球入口池融合回测</h2>
          <p class="mt-1 text-xs text-text-secondary">
            {{ entryFusionBacktest.sourceQuotaText }} / 融合入口上限：{{ entryFusionBacktest.maxFusedEntrySize }} / 统计期数：{{ entryFusionBacktest.periodCount }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('entryFusion')">
          {{ diagnosticSectionCollapseText('entryFusion') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原红10入口覆盖率</div>
          <div class="summary-value">{{ formatPercent(entryFusionBacktest.baseEntryCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">融合入口覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(entryFusionBacktest.fusedEntryCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">达到4红期数</div>
          <div class="summary-value">{{ entryFusionBacktest.fusedEntryReachFourCount }}/{{ entryFusionBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均新增红球</div>
          <div class="summary-value">{{ formatScore(entryFusionBacktest.averageAddedCount) }}个</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ entryFusionBacktest.conclusion }}</p>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际开奖</th>
              <th>原入口命中</th>
              <th>融合入口命中</th>
              <th>新增号码</th>
              <th>单期判断</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in entryFusionBacktest.periods" :key="period.snapshotId">
              <td>{{ period.predictQiHao }}</td>
              <td>
                <HitNumberList :numbers="period.actualRedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" />
              </td>
              <td>
                <HitNumberList :numbers="period.baseEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                <div class="mt-1 text-xs text-text-secondary">{{ period.baseEntryHitNumbers.length }}红</div>
              </td>
              <td>
                <HitNumberList :numbers="period.fusedEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                <div class="mt-1 text-xs text-accent">{{ period.fusedEntryHitNumbers.length }}红</div>
              </td>
              <td>
                <HitNumberList :numbers="period.addedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" />
              </td>
              <td class="table-note">{{ period.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in entryFusionBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球入口池重评分融合回测 -->
    <section v-if="isDiagnosticPage && entryRescoreFusionBacktest" :class="diagnosticSectionClass('entryRescoreFusion')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球入口池重评分融合回测</h2>
          <p class="mt-1 text-xs text-text-secondary">
            {{ entryRescoreFusionBacktest.sourceQuotaText }} / 统计期数：{{ entryRescoreFusionBacktest.periodCount }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('entryRescoreFusion')">
          {{ diagnosticSectionCollapseText('entryRescoreFusion') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原红10入口覆盖率</div>
          <div class="summary-value">{{ formatPercent(entryRescoreFusionBacktest.baseEntryCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">重评分入口覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(entryRescoreFusionBacktest.fusedEntryCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">达到4红期数</div>
          <div class="summary-value">{{ entryRescoreFusionBacktest.fusedEntryReachFourCount }}/{{ entryRescoreFusionBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均换入红球</div>
          <div class="summary-value">{{ formatScore(entryRescoreFusionBacktest.averageAddedCount) }}个</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ entryRescoreFusionBacktest.conclusion }}</p>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际开奖</th>
              <th>原入口</th>
              <th>重评分入口</th>
              <th>换入号码</th>
              <th>单期判断</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in entryRescoreFusionBacktest.periods" :key="period.snapshotId">
              <td>{{ period.predictQiHao }}</td>
              <td><HitNumberList :numbers="period.actualRedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" /></td>
              <td>
                <HitNumberList :numbers="period.baseEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                <div class="mt-1 text-xs text-text-secondary">{{ period.baseEntryHitNumbers.length }}红</div>
              </td>
              <td>
                <HitNumberList :numbers="period.fusedEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                <div class="mt-1 text-xs text-accent">{{ period.fusedEntryHitNumbers.length }}红</div>
              </td>
              <td><HitNumberList :numbers="period.addedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" /></td>
              <td class="table-note">{{ period.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 红球入口池TopN与来源配额网格回测 -->
    <section v-if="isDiagnosticPage && entryFusionGridBacktest" :class="diagnosticSectionClass('entryFusionGrid')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球入口池TopN与来源配额网格</h2>
          <p class="mt-1 text-xs text-text-secondary">
            共比较 {{ entryFusionGridBacktest.optionCount }} 组参数；当前最优：{{ entryFusionGridBacktest.bestOption?.parameterText || '--' }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('entryFusionGrid')">
          {{ diagnosticSectionCollapseText('entryFusionGrid') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">最优融合覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(entryFusionGridBacktest.bestOption?.fusedEntryCoverageRate || 0) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">覆盖提升</div>
          <div class="summary-value">{{ formatPercent(entryFusionGridBacktest.bestOption?.coverageLift || 0) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">达到4红期数</div>
          <div class="summary-value">{{ entryFusionGridBacktest.bestOption?.reachFourCount || 0 }}/{{ entryFusionGridBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均新增红球</div>
          <div class="summary-value">{{ formatScore(entryFusionGridBacktest.bestOption?.averageAddedCount || 0) }}个</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ entryFusionGridBacktest.conclusion }}</p>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>参数</th>
              <th>原入口覆盖</th>
              <th>融合覆盖</th>
              <th>提升</th>
              <th>4红期数</th>
              <th>平均新增</th>
              <th>观察分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in entryFusionGridBacktest.topOptions" :key="option.optionCode">
              <td>{{ option.rank }}</td>
              <td class="font-bold text-text-primary">{{ option.parameterText }}</td>
              <td>{{ formatPercent(option.baseEntryCoverageRate) }}</td>
              <td class="text-accent font-bold">{{ formatPercent(option.fusedEntryCoverageRate) }}</td>
              <td>{{ formatPercent(option.coverageLift) }}</td>
              <td>{{ option.reachFourCount }}/{{ entryFusionGridBacktest.periodCount }}</td>
              <td>{{ formatScore(option.averageAddedCount) }}</td>
              <td>{{ formatScore(option.score) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary class="diagnosis-summary">
          <span>展开最优参数单期明细</span>
          <span class="diagnosis-toggle-text">展开</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>实际开奖</th>
                <th>基准入口</th>
                <th>融合入口</th>
                <th>新增号码</th>
                <th>单期判断</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in entryFusionGridBacktest.bestPeriods" :key="`${period.snapshotId}-entry-grid`">
                <td>{{ period.predictQiHao }}</td>
                <td><HitNumberList :numbers="period.actualRedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" /></td>
                <td>
                  <HitNumberList :numbers="period.baseEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                  <div class="mt-1 text-xs text-text-secondary">{{ period.baseEntryHitNumbers.length }}红</div>
                </td>
                <td>
                  <HitNumberList :numbers="period.fusedEntryPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                  <div class="mt-1 text-xs text-accent">{{ period.fusedEntryHitNumbers.length }}红</div>
                </td>
                <td><HitNumberList :numbers="period.addedNumbers" kind="red" :actual-red-numbers="period.actualRedNumbers" /></td>
                <td class="table-note">{{ period.conclusion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <!-- 红球组合评分融合回测 -->
    <section v-if="isDiagnosticPage && combinationFusionBacktest" :class="diagnosticSectionClass('combinationFusion')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球组合评分融合回测</h2>
          <p class="mt-1 text-xs text-text-secondary">
            让保底来源分参与组合排序；{{ combinationFusionBacktest.sourceQuotaText }} / 统计期数：{{ combinationFusionBacktest.periodCount }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('combinationFusion')">
          {{ diagnosticSectionCollapseText('combinationFusion') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原组合池覆盖率</div>
          <div class="summary-value">{{ formatPercent(combinationFusionBacktest.originalCombinationCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">融合组合池覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(combinationFusionBacktest.fusedCombinationCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">融合组合达到4红</div>
          <div class="summary-value">{{ combinationFusionBacktest.fusedCombinationReachFourCount }}/{{ combinationFusionBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">入口融合覆盖率</div>
          <div class="summary-value">{{ formatPercent(combinationFusionBacktest.fusedEntryCoverageRate) }}</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ combinationFusionBacktest.conclusion }}</p>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>融合组合池</th>
              <th>原组合命中</th>
              <th>融合组合命中</th>
              <th>Top融合组合</th>
              <th>单期判断</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in combinationFusionBacktest.periods" :key="period.snapshotId">
              <td>{{ period.predictQiHao }}</td>
              <td>
                <HitNumberList :numbers="period.fusedCombinationPool" kind="red" :actual-red-numbers="period.actualRedNumbers" />
              </td>
              <td class="text-text-secondary">{{ period.originalCombinationHitNumbers.length }}红 {{ period.originalCombinationHitNumbers.join(',') || '--' }}</td>
              <td class="text-accent font-bold">{{ period.fusedCombinationHitNumbers.length }}红 {{ period.fusedCombinationHitNumbers.join(',') || '--' }}</td>
              <td class="table-note">
                <div v-for="item in period.fusedCombinations.slice(0, 3)" :key="`${period.snapshotId}-${item.rank}`">
                  第{{ item.rank }}名
                  <HitNumberList :numbers="item.numbers" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                  <span> / 分{{ formatScore(item.finalScore) }} / 命中{{ item.hitCount }}红</span>
                </div>
              </td>
              <td class="table-note">{{ period.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary class="diagnosis-summary">
          <span>展开融合组合评分明细</span>
          <span class="diagnosis-toggle-text">展开</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>排名</th>
                <th>组合</th>
                <th>命中</th>
                <th>红10均分</th>
                <th>结构分</th>
                <th>来源分</th>
                <th>最终分</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="period in combinationFusionBacktest.periods" :key="`${period.snapshotId}-fusion-detail`">
                <tr v-for="item in period.fusedCombinations" :key="`${period.snapshotId}-${item.rank}-detail`">
                  <td>{{ period.predictQiHao }}</td>
                  <td>{{ item.rank }}</td>
                  <td>
                    <HitNumberList :numbers="item.numbers" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                  </td>
                  <td>{{ item.hitCount }}红 {{ item.hitNumbers.join(',') || '--' }}</td>
                  <td>{{ formatScore(item.numberScore) }}</td>
                  <td>{{ formatScore(item.structureScore) }}</td>
                  <td>{{ formatScore(item.sourceScore) }}</td>
                  <td>{{ formatScore(item.finalScore) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in combinationFusionBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球组合评分来源权重网格回测 -->
    <section v-if="isDiagnosticPage && combinationSourceWeightGridBacktest" :class="diagnosticSectionClass('combinationSourceWeightGrid')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球组合评分来源权重网格</h2>
          <p class="mt-1 text-xs text-text-secondary">
            共比较 {{ combinationSourceWeightGridBacktest.optionCount }} 组来源权重；当前最优：{{ combinationSourceWeightGridBacktest.bestOption?.parameterText || '--' }}
          </p>
        </div>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('combinationSourceWeightGrid')">
          {{ diagnosticSectionCollapseText('combinationSourceWeightGrid') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原组合池覆盖率</div>
          <div class="summary-value">{{ formatPercent(combinationSourceWeightGridBacktest.bestOption?.originalCombinationCoverageRate || 0) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">融合组合覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(combinationSourceWeightGridBacktest.bestOption?.fusedCombinationCoverageRate || 0) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">覆盖提升</div>
          <div class="summary-value">{{ formatPercent(combinationSourceWeightGridBacktest.bestOption?.coverageLift || 0) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">达到4红期数</div>
          <div class="summary-value">{{ combinationSourceWeightGridBacktest.bestOption?.reachFourCount || 0 }}/{{ combinationSourceWeightGridBacktest.periodCount }}</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ combinationSourceWeightGridBacktest.conclusion }}</p>

      <div class="mt-4 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>参数</th>
              <th>原组合覆盖</th>
              <th>融合组合覆盖</th>
              <th>提升</th>
              <th>4红期数</th>
              <th>观察分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in combinationSourceWeightGridBacktest.topOptions" :key="option.optionCode">
              <td>{{ option.rank }}</td>
              <td class="font-bold text-text-primary">{{ option.parameterText }}</td>
              <td>{{ formatPercent(option.originalCombinationCoverageRate) }}</td>
              <td class="text-accent font-bold">{{ formatPercent(option.fusedCombinationCoverageRate) }}</td>
              <td>{{ formatPercent(option.coverageLift) }}</td>
              <td>{{ option.reachFourCount }}/{{ combinationSourceWeightGridBacktest.periodCount }}</td>
              <td>{{ formatScore(option.score) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary class="diagnosis-summary">
          <span>展开最优权重单期组合明细</span>
          <span class="diagnosis-toggle-text">展开</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>融合组合池</th>
                <th>原组合命中</th>
                <th>融合组合命中</th>
                <th>Top融合组合</th>
                <th>单期判断</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="period in combinationSourceWeightGridBacktest.bestPeriods" :key="`${period.snapshotId}-source-weight`">
                <td>{{ period.predictQiHao }}</td>
                <td><HitNumberList :numbers="period.fusedCombinationPool" kind="red" :actual-red-numbers="period.actualRedNumbers" /></td>
                <td>{{ period.originalCombinationHitNumbers.length }}红 {{ period.originalCombinationHitNumbers.join(',') || '--' }}</td>
                <td class="text-accent font-bold">{{ period.fusedCombinationHitNumbers.length }}红 {{ period.fusedCombinationHitNumbers.join(',') || '--' }}</td>
                <td class="table-note">
                  <div v-for="item in period.fusedCombinations.slice(0, 3)" :key="`${period.snapshotId}-${item.rank}-source-weight`">
                    第{{ item.rank }}名
                    <HitNumberList :numbers="item.numbers" kind="red" :actual-red-numbers="period.actualRedNumbers" />
                    <span> / 分{{ formatScore(item.finalScore) }} / 命中{{ item.hitCount }}红</span>
                  </div>
                </td>
                <td class="table-note">{{ period.conclusion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <!-- 红球候选池保底扩展回测 -->
    <section v-if="isDiagnosticPage && activeGuardBacktest" :class="diagnosticSectionClass('guardBacktest')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">{{ activeGuardBacktestTitle }}</h2>
        <span class="text-xs text-text-secondary">
          统计期数：{{ activeGuardBacktest.periodCount }} / 扩展池上限：{{ activeGuardBacktest.maxExpandedSize }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('guardBacktest')">
          {{ diagnosticSectionCollapseText('guardBacktest') }}
        </button>
      </div>

      <div v-if="guardBacktestCompareRows.length > 1" class="guard-compare-panel mt-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="summary-label">扩展方式对照</div>
            <p class="mt-1 text-xs text-text-secondary">
              顺序版和固定配额版使用同一套展示结构；点击下方方式可切换明细。
            </p>
          </div>
          <div class="guard-mode-tabs">
            <button
              v-for="item in guardBacktestCompareRows"
              :key="item.mode"
              :class="['guard-mode-tab', { 'guard-mode-tab-active': activeGuardBacktestMode === item.mode }]"
              @click="switchGuardBacktestMode(item.mode)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>方式</th>
                <th>扩展覆盖率</th>
                <th>救回红球</th>
                <th>平均新增</th>
                <th>有效期数</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in guardBacktestCompareRows"
                :key="`${item.mode}-compare`"
                :class="{ 'comparison-row-active': activeGuardBacktestMode === item.mode }"
                @click="switchGuardBacktestMode(item.mode)"
              >
                <td class="font-bold text-text-primary">{{ item.label }}</td>
                <td class="text-accent">{{ formatPercent(item.result.expandedCoverageRate) }}</td>
                <td>{{ item.result.rescuedHitCount }}个</td>
                <td>{{ formatScore(item.result.averageAddedCount) }}个/期</td>
                <td>{{ item.result.improvedPeriodCount }}/{{ item.result.periodCount }}</td>
                <td class="table-note">{{ item.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="summary-block">
          <div class="summary-label">原候选池覆盖率</div>
          <div class="summary-value">
            {{ formatPercent(activeGuardBacktest.baseCoverageRate) }}
            <span class="text-text-secondary">{{ activeGuardBacktest.baseHitCount }}/{{ activeGuardBacktest.actualRedCount }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">原池单期波动</div>
          <div class="summary-value">
            最高{{ guardBacktestBaseCoverageRange?.maxText ?? '--' }}
          </div>
          <div class="summary-note">
            最低{{ guardBacktestBaseCoverageRange?.minText ?? '--' }}，用于观察原候选池是否稳定覆盖。
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">扩展后覆盖率</div>
          <div class="summary-value text-accent">
            {{ formatPercent(activeGuardBacktest.expandedCoverageRate) }}
            <span class="text-text-secondary">{{ activeGuardBacktest.expandedHitCount }}/{{ activeGuardBacktest.actualRedCount }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">覆盖提升</div>
          <div class="summary-value text-yellow-400">
            {{ formatPercent(activeGuardBacktest.coverageLift) }}
            <span class="text-text-secondary">救回{{ activeGuardBacktest.rescuedHitCount }}个</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均新增</div>
          <div class="summary-value">
            {{ formatScore(activeGuardBacktest.averageAddedCount) }} 个/期
            <span class="text-text-secondary">{{ activeGuardBacktest.improvedPeriodCount }}期有效</span>
          </div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ activeGuardBacktest.conclusion }}</p>

      <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="summary-block">
          <div class="summary-label">来源效率</div>
          <div class="mt-2 overflow-auto">
            <table class="result-table">
              <thead>
                <tr>
                  <th>来源</th>
                  <th>候选</th>
                  <th>候选命中</th>
                  <th>新增</th>
                  <th>命中</th>
                  <th>新增命中率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in activeGuardBacktest.sourceStats" :key="item.sourceType">
                  <td>{{ item.sourceName }}</td>
                  <td>{{ item.candidateTimes }}</td>
                  <td>{{ item.candidateHitTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                  <td>{{ item.addedTimes }}</td>
                  <td class="font-bold text-text-primary">{{ item.hitTimes }}</td>
                  <td>{{ formatPercent(item.hitRate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">阶段建议</div>
          <div class="mt-2 space-y-1 text-xs text-text-secondary leading-6">
            <p v-for="item in activeGuardBacktest.suggestions" :key="item">- {{ item }}</p>
          </div>
        </div>
      </div>

      <details v-if="guardSourceContributionStats.length" class="diagnosis-collapse mt-3">
        <summary>
          <span>来源贡献诊断</span>
          <span>展开查看各来源救回、被挡和原池已含的真实命中情况</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>候选命中</th>
                <th>新增命中</th>
                <th>救回</th>
                <th>被挡命中</th>
                <th>原池已含</th>
                <th>救回号码</th>
                <th>被挡号码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardSourceContributionStats" :key="item.sourceType">
                <td>{{ item.sourceName }}</td>
                <td>{{ item.candidateHitTimes }}/{{ item.candidateTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                <td>{{ item.addedHitTimes }}/{{ item.addedTimes }} / {{ formatPercent(item.addedHitRate) }}</td>
                <td class="font-bold text-accent">{{ item.rescuedHitTimes }} / {{ formatPercent(item.rescuedHitRate) }}</td>
                <td class="text-yellow-400">{{ item.blockedHitTimes }}</td>
                <td>{{ item.alreadyInBaseHitTimes }}</td>
                <td class="table-note">{{ formatList(item.rescuedNumbers) }}</td>
                <td class="table-note">{{ formatList(item.blockedHitNumbers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际红球</th>
              <th>原命中</th>
              <th>扩展命中</th>
              <th>救回</th>
              <th>新增号码</th>
              <th>结论</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in activeGuardBacktest.periods" :key="item.snapshotId">
              <td>{{ item.predictQiHao }}</td>
              <td>
                <HitNumberList
                  :numbers="item.actualRedNumbers"
                  kind="red"
                  :actual-red-numbers="item.rescuedNumbers"
                />
              </td>
              <td>{{ item.baseHitCount }}红：{{ formatList(item.baseHitNumbers) }}</td>
              <td>{{ item.expandedHitCount }}红：{{ formatList(item.expandedHitNumbers) }}</td>
              <td class="font-bold text-accent">{{ formatList(item.rescuedNumbers) }}</td>
              <td class="table-note">{{ formatList(item.addedNumbers) }}</td>
              <td class="table-note">{{ item.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 红球候选池保底来源配额网格回测：批量比较不同来源配额组合，只作为观察线 -->
    <section v-if="isDiagnosticPage && guardQuotaGridBacktest" :class="diagnosticSectionClass('guardQuotaGrid')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球候选池保底来源配额网格回测</h2>
        <span class="text-xs text-text-secondary">
          统计期数：{{ guardQuotaGridBacktest.periodCount }} / 测试组合：{{ guardQuotaGridBacktest.optionCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('guardQuotaGrid')">
          {{ diagnosticSectionCollapseText('guardQuotaGrid') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原候选池覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardQuotaGridBacktest.baseCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">最佳扩展覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(guardQuotaGridBacktest.bestExpandedCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">最佳覆盖提升</div>
          <div class="summary-value text-yellow-400">{{ formatPercent(guardQuotaGridBacktest.bestCoverageLift) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">达到4红比例</div>
          <div class="summary-value">{{ formatPercent(guardQuotaGridBacktest.bestReachFourHitRate) }}</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ guardQuotaGridBacktest.conclusion }}</p>

      <div v-if="guardQuotaGridBacktest.bestOption" class="mt-3 summary-block">
        <div class="summary-label">当前最佳配额组合</div>
        <div class="summary-value">
          {{ guardQuotaGridBacktest.bestOption.quotaText }}
          <span class="text-text-secondary">
            / 观察分 {{ formatScore(guardQuotaGridBacktest.bestOption.score) }}
            / 救回 {{ guardQuotaGridBacktest.bestOption.rescuedHitCount }} 红
          </span>
        </div>
      </div>

      <details v-if="guardQuotaBestSourceContributionStats.length" class="diagnosis-collapse mt-3">
        <summary>
          <span>最佳配额来源贡献</span>
          <span>展开查看最佳配额组合下，哪些来源救回或被挡</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>候选命中</th>
                <th>新增命中</th>
                <th>救回</th>
                <th>被挡命中</th>
                <th>原池已含</th>
                <th>救回号码</th>
                <th>被挡号码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardQuotaBestSourceContributionStats" :key="item.sourceType">
                <td>{{ item.sourceName }}</td>
                <td>{{ item.candidateHitTimes }}/{{ item.candidateTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                <td>{{ item.addedHitTimes }}/{{ item.addedTimes }} / {{ formatPercent(item.addedHitRate) }}</td>
                <td class="font-bold text-accent">{{ item.rescuedHitTimes }} / {{ formatPercent(item.rescuedHitRate) }}</td>
                <td class="text-yellow-400">{{ item.blockedHitTimes }}</td>
                <td>{{ item.alreadyInBaseHitTimes }}</td>
                <td class="table-note">{{ formatList(item.rescuedNumbers) }}</td>
                <td class="table-note">{{ formatList(item.blockedHitNumbers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>配额组合</th>
              <th>观察分</th>
              <th>扩展覆盖率</th>
              <th>覆盖提升</th>
              <th>达到4红</th>
              <th>救回</th>
              <th>平均新增</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in guardQuotaGridBacktest.topOptions" :key="item.quotaText">
              <td>{{ item.rank }}</td>
              <td class="font-bold text-text-primary">{{ item.quotaText }}</td>
              <td>{{ formatScore(item.score) }}</td>
              <td>{{ formatPercent(item.expandedCoverageRate) }}</td>
              <td>{{ formatPercent(item.coverageLift) }}</td>
              <td>{{ item.reachFourHitPeriodCount }}/{{ item.periodCount }} / {{ formatPercent(item.reachFourHitRate) }}</td>
              <td class="text-accent">{{ item.rescuedHitCount }}</td>
              <td>{{ formatScore(item.averageAddedCount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 overflow-auto">
        <div class="summary-label mb-2">最佳组合单期明细</div>
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际红球</th>
              <th>原命中</th>
              <th>扩展命中</th>
              <th>救回</th>
              <th>新增号码</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in guardQuotaGridBacktest.bestPeriods" :key="item.snapshotId">
              <td>{{ item.predictQiHao }}</td>
              <td>
                <HitNumberList
                  :numbers="item.actualRedNumbers"
                  kind="red"
                  :actual-red-numbers="item.rescuedNumbers"
                />
              </td>
              <td>{{ item.baseHitCount }}红：{{ formatList(item.baseHitNumbers) }}</td>
              <td>{{ item.expandedHitCount }}红：{{ formatList(item.expandedHitNumbers) }}</td>
              <td class="font-bold text-accent">{{ formatList(item.rescuedNumbers) }}</td>
              <td class="table-note">{{ formatList(item.addedNumbers) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in guardQuotaGridBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球保底扩展池压缩回测：观察扩展池能否压缩为9红池和10注6红票面 -->
    <section v-if="isDiagnosticPage && guardCompressionBacktest" :class="diagnosticSectionClass('guardCompression')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球保底扩展池压缩回测</h2>
        <span class="text-xs text-text-secondary">
          配额：{{ guardCompressionBacktest.quotaText }} / 统计期数：{{ guardCompressionBacktest.periodCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('guardCompression')">
          {{ diagnosticSectionCollapseText('guardCompression') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="summary-block">
          <div class="summary-label">原候选池覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardCompressionBacktest.baseCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">扩展池覆盖率</div>
          <div class="summary-value text-accent">{{ formatPercent(guardCompressionBacktest.expandedCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩9红覆盖率</div>
          <div class="summary-value text-yellow-400">{{ formatPercent(guardCompressionBacktest.compressedPoolCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩10注折算覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardCompressionBacktest.compressedTicketCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">原10注折算覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardCompressionBacktest.originalSingleTicketCoverageRate) }}</div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ guardCompressionBacktest.conclusion }}</p>

      <details v-if="guardCompressionSourceContributionStats.length" class="diagnosis-collapse mt-3">
        <summary>
          <span>压缩输入池来源贡献</span>
          <span>展开查看进入压缩前的扩展池由哪些来源贡献</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>候选命中</th>
                <th>新增命中</th>
                <th>救回</th>
                <th>被挡命中</th>
                <th>原池已含</th>
                <th>救回号码</th>
                <th>被挡号码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardCompressionSourceContributionStats" :key="item.sourceType">
                <td>{{ item.sourceName }}</td>
                <td>{{ item.candidateHitTimes }}/{{ item.candidateTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                <td>{{ item.addedHitTimes }}/{{ item.addedTimes }} / {{ formatPercent(item.addedHitRate) }}</td>
                <td class="font-bold text-accent">{{ item.rescuedHitTimes }} / {{ formatPercent(item.rescuedHitRate) }}</td>
                <td class="text-yellow-400">{{ item.blockedHitTimes }}</td>
                <td>{{ item.alreadyInBaseHitTimes }}</td>
                <td class="table-note">{{ formatList(item.rescuedNumbers) }}</td>
                <td class="table-note">{{ formatList(item.blockedHitNumbers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="summary-block">
          <div class="summary-label">9红达到4红期数</div>
          <div class="summary-value">{{ guardCompressionBacktest.compressedPoolReachFourCount }}/{{ guardCompressionBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注达到3红期数</div>
          <div class="summary-value">{{ guardCompressionBacktest.compressedTicketReachThreeCount }}/{{ guardCompressionBacktest.periodCount }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">优于原10注期数</div>
          <div class="summary-value">{{ guardCompressionBacktest.betterThanOriginalSingleCount }}/{{ guardCompressionBacktest.periodCount }}</div>
        </div>
      </div>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>期号</th>
              <th>实际红球</th>
              <th>扩展命中</th>
              <th>压缩9红池</th>
              <th>压缩9红命中</th>
              <th>压缩10注最好</th>
              <th>原10注最好</th>
              <th>结论</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in guardCompressionBacktest.periods" :key="item.snapshotId">
              <td>{{ item.predictQiHao }}</td>
              <td>
                <HitNumberList
                  :numbers="item.actualRedNumbers"
                  kind="red"
                  :actual-red-numbers="item.compressedHitNumbers"
                />
              </td>
              <td>{{ item.expandedHitNumbers.length }}红：{{ formatList(item.expandedHitNumbers) }}</td>
              <td class="table-note">{{ formatList(item.compressedNinePool) }}</td>
              <td class="font-bold text-accent">{{ item.compressedHitNumbers.length }}红：{{ formatList(item.compressedHitNumbers) }}</td>
              <td>{{ item.compressedTicketBestRedHitCount }}红</td>
              <td>{{ item.originalSingleBestRedHitCount }}红</td>
              <td class="table-note">{{ item.conclusion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary>
          <span>压缩10注票面明细</span>
          <span>展开查看每期由压缩9红池生成的10注6红票面</span>
        </summary>
        <div class="mt-3 space-y-4">
          <div v-for="period in guardCompressionBacktest.periods" :key="`${period.snapshotId}-tickets`" class="summary-block">
            <div class="summary-label mb-2">{{ period.predictQiHao }} 压缩票面</div>
            <div class="overflow-auto">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>红球票面</th>
                    <th>命中</th>
                    <th>形态</th>
                    <th>评分</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ticket in period.tickets" :key="`${period.snapshotId}-${ticket.rank}`">
                    <td>{{ ticket.rank }}</td>
                    <td>
                      <HitNumberList
                        :numbers="ticket.redNumbers"
                        kind="red"
                        :actual-red-numbers="ticket.hitNumbers"
                      />
                    </td>
                    <td>{{ ticket.hitCount }}红：{{ formatList(ticket.hitNumbers) }}</td>
                    <td>{{ ticket.shapeText }}</td>
                    <td>{{ formatScore(ticket.score) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </details>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in guardCompressionBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球保底扩展池压缩策略网格：比较不同压缩权重是否能减少扩展池压缩损失 -->
    <section v-if="isDiagnosticPage && guardCompressionGridBacktest" :class="diagnosticSectionClass('guardCompressionGrid')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球保底扩展池压缩策略网格</h2>
        <span class="text-xs text-text-secondary">
          配额：{{ guardCompressionGridBacktest.quotaText }} / 策略数：{{ guardCompressionGridBacktest.optionCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('guardCompressionGrid')">
          {{ diagnosticSectionCollapseText('guardCompressionGrid') }}
        </button>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ guardCompressionGridBacktest.conclusion }}</p>

      <div v-if="guardCompressionGridBacktest.bestOption" class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="summary-block">
          <div class="summary-label">最佳策略</div>
          <div class="summary-value">{{ guardCompressionGridBacktest.bestOption.strategyName }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">观察评分</div>
          <div class="summary-value">{{ formatScore(guardCompressionGridBacktest.bestOption.score) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩9红覆盖率</div>
          <div class="summary-value text-yellow-400">{{ formatPercent(guardCompressionGridBacktest.bestOption.compressedPoolCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩10注覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardCompressionGridBacktest.bestOption.compressedTicketCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">优于原10注</div>
          <div class="summary-value">{{ guardCompressionGridBacktest.bestOption.betterThanOriginalSingleCount }}/{{ guardCompressionGridBacktest.periodCount }}</div>
        </div>
      </div>

      <details v-if="guardCompressionGridBestSourceContributionStats.length" class="diagnosis-collapse mt-3">
        <summary>
          <span>最佳压缩策略来源贡献</span>
          <span>展开查看最佳压缩策略输入池的来源贡献</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>候选命中</th>
                <th>新增命中</th>
                <th>救回</th>
                <th>被挡命中</th>
                <th>原池已含</th>
                <th>救回号码</th>
                <th>被挡号码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardCompressionGridBestSourceContributionStats" :key="item.sourceType">
                <td>{{ item.sourceName }}</td>
                <td>{{ item.candidateHitTimes }}/{{ item.candidateTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                <td>{{ item.addedHitTimes }}/{{ item.addedTimes }} / {{ formatPercent(item.addedHitRate) }}</td>
                <td class="font-bold text-accent">{{ item.rescuedHitTimes }} / {{ formatPercent(item.rescuedHitRate) }}</td>
                <td class="text-yellow-400">{{ item.blockedHitTimes }}</td>
                <td>{{ item.alreadyInBaseHitTimes }}</td>
                <td class="table-note">{{ formatList(item.rescuedNumbers) }}</td>
                <td class="table-note">{{ formatList(item.blockedHitNumbers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>策略</th>
              <th>评分</th>
              <th>9红覆盖</th>
              <th>10注覆盖</th>
              <th>原10注</th>
              <th>9红达4红</th>
              <th>10注达3红</th>
              <th>优于原10注</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in guardCompressionGridBacktest.topOptions" :key="item.strategyCode">
              <td>{{ item.rank }}</td>
              <td class="font-bold text-text-primary">{{ item.strategyName }}</td>
              <td>{{ formatScore(item.score) }}</td>
              <td>{{ formatPercent(item.compressedPoolCoverageRate) }}</td>
              <td>{{ formatPercent(item.compressedTicketCoverageRate) }}</td>
              <td>{{ formatPercent(item.originalSingleTicketCoverageRate) }}</td>
              <td>{{ item.compressedPoolReachFourCount }}/{{ guardCompressionGridBacktest.periodCount }}</td>
              <td>{{ item.compressedTicketReachThreeCount }}/{{ guardCompressionGridBacktest.periodCount }}</td>
              <td>{{ item.betterThanOriginalSingleCount }}/{{ guardCompressionGridBacktest.periodCount }}</td>
              <td class="table-note">{{ item.strategyDescription }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary>
          <span>最佳策略单期明细</span>
          <span>展开查看最佳压缩策略每期保留了哪些红球</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>实际红球</th>
                <th>扩展命中</th>
                <th>压缩9红池</th>
                <th>压缩命中</th>
                <th>压缩10注最好</th>
                <th>原10注最好</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardCompressionGridBacktest.bestPeriods" :key="`${item.snapshotId}-grid-best`">
                <td>{{ item.predictQiHao }}</td>
                <td>
                  <HitNumberList
                    :numbers="item.actualRedNumbers"
                    kind="red"
                    :actual-red-numbers="item.compressedHitNumbers"
                  />
                </td>
                <td>{{ item.expandedHitNumbers.length }}红：{{ formatList(item.expandedHitNumbers) }}</td>
                <td class="table-note">{{ formatList(item.compressedNinePool) }}</td>
                <td class="font-bold text-accent">{{ item.compressedHitNumbers.length }}红：{{ formatList(item.compressedHitNumbers) }}</td>
                <td>{{ item.compressedTicketBestRedHitCount }}红</td>
                <td>{{ item.originalSingleBestRedHitCount }}红</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in guardCompressionGridBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球保底扩展池压缩来源最低保留位网格：验证压缩阶段是否需要为某些来源保留最低名额 -->
    <section v-if="isDiagnosticPage && guardCompressionRetentionGridBacktest" :class="diagnosticSectionClass('guardCompressionRetentionGrid')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球压缩层来源最低保留位网格</h2>
        <span class="text-xs text-text-secondary">
          配额：{{ guardCompressionRetentionGridBacktest.quotaText }} / 策略数：{{ guardCompressionRetentionGridBacktest.optionCount }}
        </span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('guardCompressionRetentionGrid')">
          {{ diagnosticSectionCollapseText('guardCompressionRetentionGrid') }}
        </button>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ guardCompressionRetentionGridBacktest.conclusion }}</p>

      <div v-if="guardCompressionRetentionGridBacktest.bestOption" class="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="summary-block">
          <div class="summary-label">最佳保留位</div>
          <div class="summary-value">{{ guardCompressionRetentionGridBacktest.bestOption.strategyName }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">保留结构</div>
          <div class="summary-value">{{ guardCompressionRetentionGridBacktest.bestOption.retainText }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩9红覆盖率</div>
          <div class="summary-value text-yellow-400">{{ formatPercent(guardCompressionRetentionGridBacktest.bestOption.compressedPoolCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">压缩10注覆盖率</div>
          <div class="summary-value">{{ formatPercent(guardCompressionRetentionGridBacktest.bestOption.compressedTicketCoverageRate) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">优于原10注</div>
          <div class="summary-value">{{ guardCompressionRetentionGridBacktest.bestOption.betterThanOriginalSingleCount }}/{{ guardCompressionRetentionGridBacktest.periodCount }}</div>
        </div>
      </div>

      <details v-if="guardCompressionRetentionGridBestSourceContributionStats.length" class="diagnosis-collapse mt-3">
        <summary>
          <span>最佳保留位来源贡献</span>
          <span>展开查看最低保留位策略下的来源贡献</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>候选命中</th>
                <th>新增命中</th>
                <th>救回</th>
                <th>被挡命中</th>
                <th>原池已含</th>
                <th>救回号码</th>
                <th>被挡号码</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardCompressionRetentionGridBestSourceContributionStats" :key="item.sourceType">
                <td>{{ item.sourceName }}</td>
                <td>{{ item.candidateHitTimes }}/{{ item.candidateTimes }} / {{ formatPercent(item.candidateHitRate) }}</td>
                <td>{{ item.addedHitTimes }}/{{ item.addedTimes }} / {{ formatPercent(item.addedHitRate) }}</td>
                <td class="font-bold text-accent">{{ item.rescuedHitTimes }} / {{ formatPercent(item.rescuedHitRate) }}</td>
                <td class="text-yellow-400">{{ item.blockedHitTimes }}</td>
                <td>{{ item.alreadyInBaseHitTimes }}</td>
                <td class="table-note">{{ formatList(item.rescuedNumbers) }}</td>
                <td class="table-note">{{ formatList(item.blockedHitNumbers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>策略</th>
              <th>保留位</th>
              <th>评分</th>
              <th>9红覆盖</th>
              <th>10注覆盖</th>
              <th>原10注</th>
              <th>9红达4红</th>
              <th>10注达3红</th>
              <th>优于原10注</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in guardCompressionRetentionGridBacktest.topOptions" :key="item.strategyCode">
              <td>{{ item.rank }}</td>
              <td class="font-bold text-text-primary">{{ item.strategyName }}</td>
              <td>{{ item.retainText }}</td>
              <td>{{ formatScore(item.score) }}</td>
              <td>{{ formatPercent(item.compressedPoolCoverageRate) }}</td>
              <td>{{ formatPercent(item.compressedTicketCoverageRate) }}</td>
              <td>{{ formatPercent(item.originalSingleTicketCoverageRate) }}</td>
              <td>{{ item.compressedPoolReachFourCount }}/{{ guardCompressionRetentionGridBacktest.periodCount }}</td>
              <td>{{ item.compressedTicketReachThreeCount }}/{{ guardCompressionRetentionGridBacktest.periodCount }}</td>
              <td>{{ item.betterThanOriginalSingleCount }}/{{ guardCompressionRetentionGridBacktest.periodCount }}</td>
              <td class="table-note">{{ item.strategyDescription }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="diagnosis-collapse mt-3">
        <summary>
          <span>最佳保留位单期明细</span>
          <span>展开查看最低保留位策略每期压缩结果</span>
        </summary>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>期号</th>
                <th>实际红球</th>
                <th>扩展命中</th>
                <th>压缩9红池</th>
                <th>压缩命中</th>
                <th>压缩10注最好</th>
                <th>原10注最好</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in guardCompressionRetentionGridBacktest.bestPeriods" :key="`${item.snapshotId}-retention-best`">
                <td>{{ item.predictQiHao }}</td>
                <td>
                  <HitNumberList
                    :numbers="item.actualRedNumbers"
                    kind="red"
                    :actual-red-numbers="item.compressedHitNumbers"
                  />
                </td>
                <td>{{ item.expandedHitNumbers.length }}红：{{ formatList(item.expandedHitNumbers) }}</td>
                <td class="table-note">{{ formatList(item.compressedNinePool) }}</td>
                <td class="font-bold text-accent">{{ item.compressedHitNumbers.length }}红：{{ formatList(item.compressedHitNumbers) }}</td>
                <td>{{ item.compressedTicketBestRedHitCount }}红</td>
                <td>{{ item.originalSingleBestRedHitCount }}红</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in guardCompressionRetentionGridBacktest.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 红球候选池漏号诊断 -->
    <section v-if="isDiagnosticPage && redMissDiagnosis" :class="diagnosticSectionClass('redMissDiagnosis')">
      <div class="diagnostic-section-header flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球候选池漏号诊断</h2>
        <span class="text-xs text-text-secondary">快照ID：{{ redMissDiagnosis.snapshotId }}</span>
        <button class="collapse-button" @click="toggleDiagnosticSectionCollapse('redMissDiagnosis')">
          {{ diagnosticSectionCollapseText('redMissDiagnosis') }}
        </button>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">实际红球</div>
          <div class="summary-value">{{ formatList(redMissDiagnosis.actualRedNumbers) }}</div>
        </div>
        <div class="summary-block">
          <div class="summary-label">主候选池命中/漏号</div>
          <div class="summary-value">
            中{{ redMissDiagnosis.combinationCandidateHits.length }}：
            {{ formatList(redMissDiagnosis.combinationCandidateHits) }}
            / 漏{{ formatList(redMissDiagnosis.combinationCandidateMisses) }}
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">10注票面池命中/漏号</div>
          <div class="summary-value">
            中{{ redMissDiagnosis.singleTicketHits.length }}：
            {{ formatList(redMissDiagnosis.singleTicketHits) }}
            / 漏{{ formatList(redMissDiagnosis.singleTicketMisses) }}
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">实际形态</div>
          <div class="summary-value">
            三区{{ redMissDiagnosis.actualThreeArea }}
            / 质{{ redMissDiagnosis.actualPrimeCount }}
            / 重{{ redMissDiagnosis.repeatLastCount }}
            / 邻{{ redMissDiagnosis.neighborLastCount }}
          </div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ redMissDiagnosis.conclusion }}</p>

      <div class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>号码</th>
              <th>来源判断</th>
              <th>组合榜</th>
              <th>10注</th>
              <th>红10</th>
              <th>红20</th>
              <th>红33</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in redMissDiagnosis.actualNumberDetails" :key="item.number">
              <td class="font-bold text-text-primary">{{ item.number }}</td>
              <td :class="item.sourceType === 'MISSED' ? 'text-red-400' : 'text-green-400'">
                {{ sourceTypeText(item.sourceType) }}
              </td>
              <td>{{ item.bestCombinationRank ? `r${item.bestCombinationRank}` : '--' }}</td>
              <td>{{ item.bestSingleTicketRank ? `r${item.bestSingleTicketRank}` : '--' }}</td>
              <td>{{ windowStateText(item.windowStates, 'RED_10') }}</td>
              <td>{{ windowStateText(item.windowStates, 'RED_20') }}</td>
              <td>{{ windowStateText(item.windowStates, 'RED_33') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 space-y-1 text-xs text-text-secondary leading-6">
        <p v-for="item in redMissDiagnosis.suggestions" :key="item">- {{ item }}</p>
      </div>
    </section>

    <!-- 当前预测主结论：只保留真正的票面结论，避免和红球/蓝球明细重复 -->
    <section v-if="isPredictionPage || isReviewPage" class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">当前主推荐票面</h2>
        <span class="text-xs text-text-secondary">
          预测期号：{{ finalPredict?.predictQiHao ?? '--' }}
        </span>
      </div>

      <template v-if="finalPredict">
        <div class="mt-4 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
          <div class="summary-block emphasis-block">
            <div class="summary-label">红球 + 蓝球合并后的第一推荐</div>
            <div class="summary-value ticket-text">
              <TicketNumberText
                v-if="finalPredict.recommendedRedNumbers?.length"
                :red-numbers="finalPredict.recommendedRedNumbers"
                :blue-number="finalPredict.recommendedBlueNumber"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
                :actual-blue-number="reviewResult?.actualBlueNumber"
              />
              <span v-else class="text-accent">{{ finalPredict.recommendedTicketText || '--' }}</span>
            </div>
          </div>
          <div class="summary-block">
            <div class="summary-label">模型参数</div>
            <div class="summary-value">
              红候选池{{ finalPredict.redCandidateLimit }} / 红组合{{ finalPredict.redCombinationTopLimit }}
              / 蓝候选{{ finalPredict.blueTopLimit }} / 红权重{{ finalPredict.redWeight }} / 蓝权重{{ finalPredict.blueWeight }}
            </div>
          </div>
        </div>

        <p v-if="finalPredict.explanation" class="mt-3 text-xs text-text-secondary leading-6">
          {{ finalPredict.explanation }}
        </p>
        <div v-if="reviewResult?.finalRecommendedReview" class="mt-3 info-box">
          复盘：奖级 {{ reviewResult.finalRecommendedReview.prizeLevel }}，
          奖金 {{ formatPrize(reviewResult.finalRecommendedReview) }}。
        </div>
      </template>
      <div v-else class="empty-text">暂无预测结果，请点击“刷新预测”。</div>
    </section>

    <!-- 第一轮入口入围池：展示组合枚举前的红球入口和蓝球入口，便于判断号码在哪一层丢失 -->
    <section v-if="isPredictionPage || isReviewPage" class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">第一轮入口入围池</h2>
          <p class="mt-1 text-xs text-text-secondary">
            红球入口是正式组合枚举前的红10 TopN入围号码；蓝球入口是蓝10/16/32三窗口评分TopN候选。它们用于判断真实号码是否在第一阶段就已经丢失。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          预测期号：{{ finalPredict?.predictQiHao ?? '--' }}
        </span>
      </div>

      <template v-if="finalPredict">
        <div class="mt-4 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
          <div class="summary-block">
            <div class="summary-label">
              红球入口池
              <span class="text-text-secondary">Top{{ finalPredict.redEntryCandidateNumbers?.length ?? finalPredict.redCandidateLimit }}</span>
            </div>
            <div class="summary-value">
              <HitNumberList
                v-if="finalPredict.redEntryCandidateNumbers?.length"
                :numbers="finalPredict.redEntryCandidateNumbers"
                kind="red"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
              />
              <span v-else class="text-yellow-400">当前快照暂未保存红球入口池，请先执行历史入口池回填或重新保存快照。</span>
            </div>
          </div>
          <div class="summary-block">
            <div class="summary-label">
              蓝球入口池
              <span class="text-text-secondary">Top{{ finalPredict.blueEntryCandidateNumbers?.length ?? finalPredict.blueTopLimit }}</span>
            </div>
            <div class="summary-value">
              <HitNumberList
                v-if="finalPredict.blueEntryCandidateNumbers?.length"
                :numbers="finalPredict.blueEntryCandidateNumbers"
                kind="blue"
                :actual-blue-number="reviewResult?.actualBlueNumber"
              />
              <span v-else class="text-yellow-400">当前快照暂未保存蓝球入口池。</span>
            </div>
          </div>
        </div>
        <p class="mt-3 text-xs text-text-secondary leading-6">
          如果入口池没有覆盖开奖号码，后续9+1、10注6+1通常很难救回；如果入口池覆盖但后续票面没有覆盖，问题更可能出在组合排序或压缩出票阶段。
        </p>
      </template>
      <div v-else class="empty-text">暂无入口池数据，请点击“刷新预测”。</div>
    </section>

    <!-- 9+1复式方案：独立展示真正的9红+1蓝复式投注口径 -->
    <details v-if="isPredictionPage || isReviewPage" class="diagnosis-collapse bg-bg-card rounded-lg p-4" open>
      <summary class="diagnosis-summary">
        <div>
          <h2 class="text-base font-bold text-text-primary">9+1复式方案</h2>
          <p class="mt-1 text-xs text-text-secondary">
            这是9个红球 + 1个蓝球的复式口径，共84注，成本168元；红球来自Top组合反推，不等同于10注6+1。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-text-secondary">
            预测期号：{{ ninePlusOnePredict?.predictQiHao ?? finalPredict?.predictQiHao ?? '--' }}
          </span>
          <span class="diagnosis-toggle-text">展开明细</span>
        </div>
      </summary>

      <template v-if="ninePlusOnePredict">
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="action-button"
            type="button"
            @click.stop.prevent="copyNinePlusOneMultiple"
          >
            复制复式
          </button>
          <button
            class="action-button"
            type="button"
            @click.stop.prevent="copyNinePlusOneDanTuo"
          >
            复制胆拖
          </button>
          <span v-if="nineCopyTip" class="copy-tip">{{ nineCopyTip }}</span>
        </div>

        <div class="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div class="summary-block emphasis-block lg:col-span-2">
            <div class="summary-label">9+1复式票面</div>
            <div class="summary-value ticket-text">
              <TicketNumberText
                :red-numbers="ninePlusOnePredict.recommendedNumbers"
                :blue-number="ninePlusOneBlueNumber"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
                :actual-blue-number="reviewResult?.actualBlueNumber"
              />
            </div>
          </div>
          <div class="summary-block">
            <div class="summary-label">胆候选观察</div>
            <div class="summary-value text-accent">{{ ninePlusOnePredict.danNumber || '--' }}</div>
          </div>
          <div class="summary-block">
            <div class="summary-label">投注成本</div>
            <div class="summary-value">84注 × 2元 = 168元</div>
          </div>
        </div>

        <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="summary-block">
            <div class="summary-label">红球来源说明</div>
            <div class="summary-value">{{ ninePlusOnePredict.conclusion }}</div>
          </div>
          <div class="summary-block">
            <div class="summary-label">蓝球来源说明</div>
            <div class="summary-value">
              使用蓝球候选榜第1名：{{ ninePlusOneBlueNumber || '--' }}。
              后续如果要做多蓝复式，可以在这里扩展为9+2或9+3。
            </div>
          </div>
        </div>

        <div v-if="reviewResult" class="mt-3 info-box">
          复盘：红色数字表示命中的红球，蓝色数字表示命中的蓝球；9+1是复式观察口径，这里先做命中落点标识。
        </div>

        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>红球</th>
                <th>角色</th>
                <th>反推分</th>
                <th>出现次数</th>
                <th>出现率</th>
                <th>最佳组合排名</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in ninePlusOnePredict.numberResults?.slice(0, 12)" :key="item.number">
                <td>{{ item.rank }}</td>
                <td class="font-bold">
                  <HitNumberList
                    :numbers="[item.number]"
                    kind="red"
                    :actual-red-numbers="reviewResult?.actualRedNumbers"
                  />
                </td>
                <td>{{ reverseRoleText(item.role) }}</td>
                <td>{{ formatScore(item.reverseScore) }}</td>
                <td>{{ item.appearTimes }}</td>
                <td>{{ formatPercent(item.appearRate) }}</td>
                <td>第{{ item.bestCombinationRank }}名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <div v-else class="empty-text">暂无9+1复式方案，请点击“刷新预测”。</div>
    </details>

    <!-- 10注6+1单式方案：独立投注方案，不等同于把9+1复式拆成10注 -->
    <details v-if="isPredictionPage || isReviewPage" class="diagnosis-collapse bg-bg-card rounded-lg p-4" open>
      <summary class="diagnosis-summary">
        <div>
          <h2 class="text-base font-bold text-text-primary">10注6+1单式方案</h2>
          <p class="mt-1 text-xs text-text-secondary">
            这是单式票面生成服务的独立结果；下方“观察池”是对10注结果做覆盖回看，不代表这些票面必须来自某一注9+1。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-text-secondary">
            预测期号：{{ singlePlan?.predictQiHao ?? '--' }}
            <template v-if="singlePlan">，成本 {{ singlePlan.totalCost }} 元</template>
          </span>
          <span class="diagnosis-toggle-text">展开明细</span>
        </div>
      </summary>

      <template v-if="singlePlan">
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="action-button"
            type="button"
            @click.stop.prevent="copySingleTicketPlan"
          >
            复制
          </button>
          <span v-if="singleCopyTip" class="copy-tip">{{ singleCopyTip }}</span>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="summary-block">
            <div class="summary-label">10注覆盖形成的9红观察池</div>
            <div class="summary-value">
              <HitNumberList
                :numbers="singlePlan.reverseNineRedNumbers"
                kind="red"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
              />
            </div>
          </div>
          <div class="summary-block">
            <div class="summary-label">覆盖频次最高红球</div>
            <div class="summary-value">
              <HitNumberList
                v-if="singlePlan.reverseDanNumber"
                :numbers="[singlePlan.reverseDanNumber]"
                kind="red"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
              />
              <span v-else>--</span>
            </div>
          </div>
          <div class="summary-block">
            <div class="summary-label">本方案可用蓝球候选</div>
            <div class="summary-value">
              <HitNumberList
                :numbers="singlePlan.blueCandidateNumbers"
                kind="blue"
                :actual-blue-number="reviewResult?.actualBlueNumber"
              />
            </div>
          </div>
          <div v-if="reviewResult" class="summary-block">
            <div class="summary-label">10注6+1收益</div>
            <div class="summary-value">
              {{ reviewResult.singleTicketPrizeAmount }} - {{ reviewResult.singleTicketCostAmount }}
              = {{ reviewResult.singleTicketNetAmount }} 元
            </div>
          </div>
        </div>
        <div class="mt-3 info-box">
          “覆盖形成的9红观察池”是系统先生成10注6+1后，再反看这10注一共主要覆盖了哪些红球。
          它用于观察单式方案的集中程度，不是9+1复式票面，也不是10注生成前的强制来源。
          <template v-if="reviewResult">
            复盘时，红色数字表示命中的红球，蓝色数字表示命中的蓝球。
          </template>
        </div>

        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>票面</th>
                <th>策略</th>
                <th>形态</th>
                <th>历史重复</th>
                <th>重叠控制</th>
                <th>综合分</th>
                <th>选择原因</th>
                <th v-if="reviewResult">奖级</th>
                <th v-if="reviewResult">奖金</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in singlePlan.tickets" :key="item.rank">
                <td>{{ item.rank }}</td>
                <td class="font-bold">
                  <TicketNumberText
                    :red-numbers="item.redNumbers"
                    :blue-number="item.blueNumber"
                    :actual-red-numbers="reviewResult?.actualRedNumbers"
                    :actual-blue-number="reviewResult?.actualBlueNumber"
                  />
                </td>
                <td>{{ item.strategyType }}</td>
                <td>三区{{ item.threeAreas }} / 重{{ item.repeatCount }} / 邻{{ item.neighborCount }} / 质{{ item.primeCount }}</td>
                <td :class="item.historyRepeated ? 'text-red-400' : 'text-green-400'">
                  {{ item.historyRepeated ? '是' : '否' }}
                </td>
                <td>最多重叠{{ item.maxOverlapWithPrevious }}红</td>
                <td>{{ formatScore(item.finalScore) }}</td>
                <td class="table-note">{{ item.explanation || item.shapeExplanation || '--' }}</td>
                <td v-if="reviewResult">{{ singleTicketReviewByRank(item.rank)?.prizeLevel ?? '--' }}</td>
                <td v-if="reviewResult">{{ formatPrize(singleTicketReviewByRank(item.rank)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-3 space-y-2 text-xs text-text-secondary leading-6">
          <p v-if="singlePlan.strategyDescription">{{ singlePlan.strategyDescription }}</p>
          <p v-if="singlePlan.riskDescription" class="text-yellow-400">{{ singlePlan.riskDescription }}</p>
        </div>
      </template>
      <div v-else class="empty-text">暂无单式方案，请点击“刷新预测”。</div>
    </details>

    <!-- 候选依据：展示模型用于形成主推荐和票面榜的红球、蓝球评分来源 -->
    <section v-if="isPredictionPage && finalPredict" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <details class="diagnosis-collapse bg-bg-card rounded-lg p-4">
        <summary class="diagnosis-summary">
          <div>
            <h2 class="text-base font-bold text-text-primary">红球组合候选榜（诊断用）</h2>
            <p class="mt-1 text-xs text-text-secondary">
              当前第1名为
              <HitNumberList
                v-if="finalPredict.redCombinations?.[0]?.numbers?.length"
                :numbers="finalPredict.redCombinations[0].numbers"
                kind="red"
                :actual-red-numbers="reviewResult?.actualRedNumbers"
              />
              <span v-else>--</span>，
              综合分 {{ formatScore(finalPredict.redCombinations?.[0]?.finalScore) }}。展开可查看主模型枚举出的高分6红组合。
            </p>
          </div>
          <span class="diagnosis-toggle-text">展开明细</span>
        </summary>
        <div class="mt-3 info-box">
          这里不是10注6+1，而是主模型枚举出的高分6红组合，用来解释红球候选池和红球组合排序依据。
        </div>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>红球组合</th>
                <th>综合分</th>
                <th>三窗口结构分</th>
                <th>红10</th>
                <th>红20</th>
                <th>红33</th>
                <th>成员依据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in finalPredict.redCombinations?.slice(0, 12)" :key="item.rank">
                <td>{{ item.rank }}</td>
                <td class="font-bold">
                  <HitNumberList
                    :numbers="item.numbers"
                    kind="red"
                    :actual-red-numbers="reviewResult?.actualRedNumbers"
                  />
                </td>
                <td>{{ formatScore(item.finalScore) }}</td>
                <td>{{ formatScore(item.weightedStructureScore) }}</td>
                <td>{{ formatScore(item.red10StructureScore) }}</td>
                <td>{{ formatScore(item.red20StructureScore) }}</td>
                <td>{{ formatScore(item.red33StructureScore) }}</td>
                <td class="table-note">{{ item.memberSummary || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="diagnosis-collapse bg-bg-card rounded-lg p-4">
        <summary class="diagnosis-summary">
          <div>
            <h2 class="text-base font-bold text-text-primary">蓝球候选榜（诊断用）</h2>
            <p class="mt-1 text-xs text-text-secondary">
              当前第1名为
              <HitNumberList
                v-if="finalPredict.blueCandidates?.[0]?.number"
                :numbers="[finalPredict.blueCandidates[0].number]"
                kind="blue"
                :actual-blue-number="reviewResult?.actualBlueNumber"
              />
              <span v-else>--</span>，
              综合分 {{ formatScore(finalPredict.blueCandidates?.[0]?.finalScore) }}。展开可查看蓝10/16/32三窗口综合评分。
            </p>
          </div>
          <span class="diagnosis-toggle-text">展开明细</span>
        </summary>
        <div class="mt-3 info-box">
          这里展示蓝球候选分数和各窗口等级，用来判断蓝球选择主要受哪个窗口或等级状态影响。
        </div>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>蓝球</th>
                <th>综合分</th>
                <th>等级</th>
                <th>依据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in finalPredict.blueCandidates?.slice(0, 10)" :key="item.rank">
                <td>{{ item.rank }}</td>
                <td class="font-bold">
                  <HitNumberList
                    :numbers="[item.number]"
                    kind="blue"
                    :actual-blue-number="reviewResult?.actualBlueNumber"
                  />
                </td>
                <td>{{ formatScore(item.finalScore) }}</td>
                <td>10:{{ item.blue10Level }} / 16:{{ item.blue16Level }} / 32:{{ item.blue32Level }}</td>
                <td class="table-note">{{ item.explanation || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="diagnosis-collapse bg-bg-card rounded-lg p-4 xl:col-span-2">
        <summary class="diagnosis-summary">
          <div>
            <h2 class="text-base font-bold text-text-primary">红蓝合并排序明细（调试用）</h2>
            <p class="mt-1 text-xs text-text-secondary">
              当前主推荐来自红榜第{{ finalPredict.tickets?.[0]?.redRank ?? '--' }}名 × 蓝榜第{{ finalPredict.tickets?.[0]?.blueRank ?? '--' }}名，
              合并分 {{ formatScore(finalPredict.tickets?.[0]?.finalScore) }}。展开可查看前12个红蓝合并候选。
            </p>
          </div>
          <span class="diagnosis-toggle-text">展开明细</span>
        </summary>
        <div class="mt-3 info-box">
          这里是“红球组合榜 × 蓝球候选榜”合并后的6+1排序证据，不是9+1复式方案，也不是最终必须购买的10注方案。
          它主要用于复盘时判断排序结果受红球组合、蓝球候选还是合并权重影响。
        </div>
        <div class="mt-3 overflow-auto">
          <table class="result-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>票面</th>
                <th>红榜</th>
                <th>蓝榜</th>
                <th>合并分</th>
                <th>依据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in finalPredict.tickets?.slice(0, 12)" :key="item.rank">
                <td>{{ item.rank }}</td>
                <td class="font-bold">
                  <TicketNumberText
                    :red-numbers="item.redNumbers"
                    :blue-number="item.blueNumber"
                    :actual-red-numbers="reviewResult?.actualRedNumbers"
                    :actual-blue-number="reviewResult?.actualBlueNumber"
                  />
                </td>
                <td>第{{ item.redRank }}名</td>
                <td>第{{ item.blueRank }}名</td>
                <td>{{ formatScore(item.finalScore) }}</td>
                <td class="table-note">{{ item.explanation || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 模型预测/诊断结果台
 * 第一阶段先接入最终预测和10注6+1单式方案，后续继续扩展回测、诊断和复盘
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DrawContextPanel from '@/components/lottery/model/DrawContextPanel.vue';
import HitNumberList from '@/components/lottery/model/HitNumberList.vue';
import SnapshotListPanel from '@/components/lottery/model/SnapshotListPanel.vue';
import TicketNumberText from '@/components/lottery/model/TicketNumberText.vue';
import TicketTextByText from '@/components/lottery/model/TicketTextByText.vue';
import { useLotteryStore } from '@/stores/lottery';
import type { DrawRecord } from '@/types';
import {
  diagnoseRedCandidateMiss,
  getBlueCandidateDiagnosis,
  getCostTicketReview,
  getRedBayesColdHotDiagnosis,
  getRedCandidateGuardBacktest,
  getRedCandidateGuardCompressionBacktest,
  getRedCandidateGuardCompressionGridBacktest,
  getRedCandidateGuardCompressionRetentionGridBacktest,
  getRedCandidateGuardQuotaGridBacktest,
  getRedCandidateGuardQuotaBacktest,
  getPredictionReviewTrend,
  getRedCandidateMissDistribution,
  getRedCandidateFunnelDiagnosis,
  getRedCandidateEntryFusionBacktest,
  getRedCandidateEntryFusionGridBacktest,
  getRedCandidateEntryRescoreFusionBacktest,
  getRedCandidateCombinationFusionBacktest,
  getRedCandidateCombinationSourceWeightGridBacktest,
  getLatestPredictionSnapshots,
  getMultiWindowFinalPredict,
  getNinePlusOnePredict,
  getPredictionDiagnosticSnapshots,
  getPredictionSnapshotsByQiHao,
  getSingleTicketPlanPredict,
  reviewPredictionSnapshot,
  savePredictionDiagnosticReviewPack,
  savePredictionSnapshot,
  syncDefaultAxisChains,
  syncRed10AxisChain,
  type BlueCandidateDiagnosisResult,
  type CostTicketReviewResult,
  type CostTicketStrategyMetric,
  type MultiWindowFinalPredictResult,
  type PredictionDiagnosticSnapshotEntity,
  type PredictionSnapshotEntity,
  type PredictionSnapshotReviewResult,
  type PredictionSnapshotTicketReview,
  type PredictionSnapshotTrendResult,
  type RedCandidateMissDiagnosisResult,
  type RedCandidateMissDistributionResult,
  type RedCandidateFunnelDiagnosisResult,
  type RedCandidateFusionBacktestResult,
  type RedCandidateFusionGridBacktestResult,
  type RedCandidateGuardBacktestResult,
  type RedCandidateGuardCompressionBacktestResult,
  type RedCandidateGuardCompressionGridBacktestResult,
  type RedCandidateGuardCompressionRetentionGridBacktestResult,
  type RedCandidateGuardQuotaGridBacktestResult,
  type RedCandidateGuardSourceContribution,
  type RedCandidateMissWindowState,
  type RedBayesDiagnosisResult,
  type RedTopCombinationReversePredictResult,
  type SingleTicketPlanPredictResult,
  type WindowAxisChainResult
} from '@/api/modules/modelPrediction';

const lotteryStore = useLotteryStore();
const route = useRoute();
const loading = ref(false);
const saving = ref(false);
const snapshotLoading = ref(false);
const reviewing = ref(false);
const diagnosing = ref(false);
const trendLoading = ref(false);
const distributionLoading = ref(false);
const funnelDiagnosisLoading = ref(false);
const entryFusionLoading = ref(false);
const entryRescoreFusionLoading = ref(false);
const entryFusionGridLoading = ref(false);
const combinationFusionLoading = ref(false);
const combinationSourceWeightGridLoading = ref(false);
const guardBacktestLoading = ref(false);
const guardQuotaGridLoading = ref(false);
const guardCompressionLoading = ref(false);
const guardCompressionGridLoading = ref(false);
const guardCompressionRetentionGridLoading = ref(false);
const bayesLoading = ref(false);
const blueDiagnosisLoading = ref(false);
const costTicketReviewLoading = ref(false);
const diagnosticSnapshotLoading = ref(false);
const drawLoading = ref(false);
const axisSyncLoading = ref(false);
const reviewingSnapshotId = ref<number | null>(null);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');
const nineCopyTip = ref('');
const singleCopyTip = ref('');
const finalPredict = ref<MultiWindowFinalPredictResult | null>(null);
const ninePlusOnePredict = ref<RedTopCombinationReversePredictResult | null>(null);
const singlePlan = ref<SingleTicketPlanPredictResult | null>(null);
const latestSnapshot = ref<PredictionSnapshotEntity | null>(null);
const activeSnapshot = ref<PredictionSnapshotEntity | null>(null);
const reviewResult = ref<PredictionSnapshotReviewResult | null>(null);
const reviewTrend = ref<PredictionSnapshotTrendResult | null>(null);
const redMissDiagnosis = ref<RedCandidateMissDiagnosisResult | null>(null);
const redMissDistribution = ref<RedCandidateMissDistributionResult | null>(null);
const redFunnelDiagnosis = ref<RedCandidateFunnelDiagnosisResult | null>(null);
const entryFusionBacktest = ref<RedCandidateFusionBacktestResult | null>(null);
const entryRescoreFusionBacktest = ref<RedCandidateFusionBacktestResult | null>(null);
const entryFusionGridBacktest = ref<RedCandidateFusionGridBacktestResult | null>(null);
const combinationFusionBacktest = ref<RedCandidateFusionBacktestResult | null>(null);
const combinationSourceWeightGridBacktest = ref<RedCandidateFusionGridBacktestResult | null>(null);
const guardBacktest = ref<RedCandidateGuardBacktestResult | null>(null);
const guardQuotaBacktest = ref<RedCandidateGuardBacktestResult | null>(null);
const guardQuotaGridBacktest = ref<RedCandidateGuardQuotaGridBacktestResult | null>(null);
const guardCompressionBacktest = ref<RedCandidateGuardCompressionBacktestResult | null>(null);
const guardCompressionGridBacktest = ref<RedCandidateGuardCompressionGridBacktestResult | null>(null);
const guardCompressionRetentionGridBacktest = ref<RedCandidateGuardCompressionRetentionGridBacktestResult | null>(null);
const activeGuardBacktestMode = ref<'basic' | 'quota'>('basic');
const bayesDiagnosis = ref<RedBayesDiagnosisResult | null>(null);
const blueCandidateDiagnosis = ref<BlueCandidateDiagnosisResult | null>(null);
const costTicketReview = ref<CostTicketReviewResult | null>(null);
const axisSyncResults = ref<WindowAxisChainResult[]>([]);
const snapshots = ref<PredictionSnapshotEntity[]>([]);
const activeDiagnosticSnapshots = ref<PredictionDiagnosticSnapshotEntity[]>([]);
const viewMode = ref<'realtime' | 'snapshot'>('realtime');
const emptySourceContributionStats: RedCandidateGuardSourceContribution[] = [];
const collapsedDiagnosticSections = ref<Set<string>>(new Set());
const diagnosticPackSavedSnapshotId = ref<number | null>(null);
const costTicketSortKey = ref<keyof CostTicketStrategyMetric>('netAmount');
const costTicketSortDirection = ref<'asc' | 'desc'>('desc');

type WorkflowStepStatus = 'done' | 'pending' | 'waiting' | 'unknown';

interface WorkflowStep {
  key: string;
  title: string;
  status: WorkflowStepStatus;
  statusText: string;
  description: string;
}

interface DiagnosticGuideItem {
  order: string;
  title: string;
  description: string;
}

type StrategyAdmissionStatus = 'pass' | 'observe' | 'fail' | 'unknown';

interface StrategyAdmissionCheck {
  title: string;
  status: StrategyAdmissionStatus;
  statusText: string;
  description: string;
}

interface DiagnosticMetricGuideItem {
  title: string;
  formula: string;
  description: string;
  watchPoint: string;
}

/**
 * 判断诊断结果区是否已经收起。
 * @param key 诊断结果区唯一标识
 * @returns 是否处于收起状态
 */
function isDiagnosticSectionCollapsed(key: string) {
  return collapsedDiagnosticSections.value.has(key);
}

/**
 * 切换诊断结果区的收起状态。
 * @description 只控制前端展示，不会清空接口结果，也不会触发重新计算。
 * @param key 诊断结果区唯一标识
 */
function toggleDiagnosticSectionCollapse(key: string) {
  const nextKeys = new Set(collapsedDiagnosticSections.value);
  if (nextKeys.has(key)) {
    nextKeys.delete(key);
  } else {
    nextKeys.add(key);
  }
  collapsedDiagnosticSections.value = nextKeys;
}

/**
 * 获取诊断结果区外层样式。
 * @param key 诊断结果区唯一标识
 * @returns Vue class 绑定对象
 */
function diagnosticSectionClass(key: string) {
  return [
    'bg-bg-card rounded-lg p-4 diagnostic-result-section',
    { 'diagnostic-section-collapsed': isDiagnosticSectionCollapsed(key) }
  ];
}

/**
 * 获取诊断结果区折叠按钮文案。
 * @param key 诊断结果区唯一标识
 * @returns 当前按钮文案
 */
function diagnosticSectionCollapseText(key: string) {
  return isDiagnosticSectionCollapsed(key) ? '展开' : '收起';
}

const activeGuardBacktest = computed(() =>
  activeGuardBacktestMode.value === 'quota' ? guardQuotaBacktest.value : guardBacktest.value
);

const activeGuardBacktestTitle = computed(() =>
  activeGuardBacktestMode.value === 'quota' ? '红球候选池保底来源配额回测' : '红球候选池保底扩展回测'
);

const guardBacktestCompareRows = computed(() => {
  const rows: Array<{
    mode: 'basic' | 'quota';
    label: string;
    description: string;
    result: RedCandidateGuardBacktestResult;
  }> = [];
  if (guardBacktest.value) {
    rows.push({
      mode: 'basic',
      label: '顺序版',
      description: '按来源顺序补入扩展池，作为基础对照组。',
      result: guardBacktest.value
    });
  }
  if (guardQuotaBacktest.value) {
    rows.push({
      mode: 'quota',
      label: '固定配额版',
      description: '给重号、邻号、贝叶斯等来源固定新增名额，观察配额是否更稳。',
      result: guardQuotaBacktest.value
    });
  }
  return rows;
});

const guardSourceContributionStats = computed(() =>
  activeGuardBacktest.value?.sourceContributionStats ?? emptySourceContributionStats
);

const guardBacktestBaseCoverageRange = computed(() => {
  const periods = activeGuardBacktest.value?.periods ?? [];
  if (!periods.length) {
    return null;
  }

  // 每期真实红球通常为6个；仍以接口返回的实际红球数量为准，避免异常数据导致分母写死。
  const hitItems = periods.map(item => {
    const actualCount = item.actualRedNumbers?.length || 6;
    return {
      hitCount: item.baseHitCount,
      actualCount
    };
  });
  const maxItem = hitItems.reduce((best, item) => item.hitCount > best.hitCount ? item : best, hitItems[0]);
  const minItem = hitItems.reduce((best, item) => item.hitCount < best.hitCount ? item : best, hitItems[0]);

  return {
    maxText: `${maxItem.hitCount}/${maxItem.actualCount}`,
    minText: `${minItem.hitCount}/${minItem.actualCount}`
  };
});

const guardQuotaBestSourceContributionStats = computed(() =>
  guardQuotaGridBacktest.value?.bestSourceContributionStats ?? emptySourceContributionStats
);

const guardCompressionSourceContributionStats = computed(() =>
  guardCompressionBacktest.value?.sourceContributionStats ?? emptySourceContributionStats
);

const guardCompressionGridBestSourceContributionStats = computed(() =>
  guardCompressionGridBacktest.value?.bestSourceContributionStats ?? emptySourceContributionStats
);

const guardCompressionRetentionGridBestSourceContributionStats = computed(() =>
  guardCompressionRetentionGridBacktest.value?.bestSourceContributionStats ?? emptySourceContributionStats
);

/**
 * 是否已打开保底扩展对照结果。
 * @description 顺序版和固定配额版共用一个结果区域，打开后可在区域内切换明细。
 */
const isGuardBacktestOpen = computed(() => {
  return Boolean(guardBacktest.value || guardQuotaBacktest.value);
});

/**
 * 切换保底扩展回测的当前展示方式。
 * @param mode 扩展方式
 */
function switchGuardBacktestMode(mode: 'basic' | 'quota') {
  if (mode === 'quota' && !guardQuotaBacktest.value) {
    return;
  }
  if (mode === 'basic' && !guardBacktest.value) {
    return;
  }
  activeGuardBacktestMode.value = mode;
}

/**
 * 当前模型工作台页面模式。
 * @description 三个页面复用同一个组件，但通过路由名称区分预测、复盘和诊断职责。
 */
const pageMode = computed<'prediction' | 'review' | 'diagnostic'>(() => {
  if (route.name === 'SnapshotReview') {
    return 'review';
  }
  if (route.name === 'DiagnosticLab') {
    return 'diagnostic';
  }
  return 'prediction';
});

/**
 * 是否为实时预测台。
 */
const isPredictionPage = computed(() => pageMode.value === 'prediction');

/**
 * 是否为快照复盘台。
 */
const isReviewPage = computed(() => pageMode.value === 'review');

/**
 * 是否为诊断研究台。
 */
const isDiagnosticPage = computed(() => pageMode.value === 'diagnostic');

/**
 * 当前页面标题。
 */
const pageTitle = computed(() => {
  if (isReviewPage.value) {
    return '快照复盘台';
  }
  if (isDiagnosticPage.value) {
    return '诊断研究台';
  }
  return '实时预测台';
});

/**
 * 当前页面职责说明。
 */
const pageSubtitle = computed(() => {
  if (isReviewPage.value) {
    return '开奖后读取预测快照，在原票面上完成命中、奖级、收益和诊断包保存。';
  }
  if (isDiagnosticPage.value) {
    return '集中运行趋势、漏号、贝叶斯、保底扩展和配额回测，判断模型是否真的进步。';
  }
  return '开奖前查看主推荐、9+1复式、10注6+1单式，并保存下一期开奖前证据快照。';
});

/**
 * 是否允许把当前复盘上下文保存为诊断包。
 * @description 诊断包是开奖后的研究证据，只在选中快照且已有复盘结果时开放保存。
 */
const canSaveDiagnosticSnapshot = computed(() => {
  return Boolean(activeSnapshot.value && (activeSnapshot.value.reviewStatus === 1 || reviewResult.value));
});

/**
 * 当前前端快照模型版本。
 * v2开始红球6数组合形态分加入AC值，因此同预测期号的新快照需要和v1区分。
 */
const SNAPSHOT_MODEL_VERSION = 'front-v3-snapshot-v2-ac-shape';

/**
 * 最新开奖数据
 */
const latestDraw = computed(() => lotteryStore.latestDraw);

/**
 * 实时接口返回的预测期号。
 * @description 实时预测台必须优先看接口现算结果，不能被页面上挂载的历史快照期号带偏。
 */
const realtimePredictQiHao = computed(() => finalPredict.value?.predictQiHao
  ?? ninePlusOnePredict.value?.predictQiHao
  ?? singlePlan.value?.predictQiHao
  ?? '');

/**
 * 当前页面关注的预测期号。
 * @description 历史快照模式看快照期号；实时预测模式看实时接口期号，快照只作为兜底展示。
 */
const currentPredictQiHao = computed(() => {
  if (viewMode.value === 'snapshot') {
    return activeSnapshot.value?.predictQiHao ?? realtimePredictQiHao.value;
  }
  return realtimePredictQiHao.value || activeSnapshot.value?.predictQiHao || '';
});

const sortedCostTicketMetrics = computed(() => {
  const rows = [...(costTicketReview.value?.strategyMetrics ?? [])];
  const sortKey = costTicketSortKey.value;
  const direction = costTicketSortDirection.value === 'asc' ? 1 : -1;
  return rows.sort((left, right) => {
    const leftValue = left[sortKey];
    const rightValue = right[sortKey];
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }
    return String(leftValue).localeCompare(String(rightValue), 'zh-CN') * direction;
  });
});

/**
 * 9+1复式采用的蓝球
 */
const ninePlusOneBlueNumber = computed(() => {
  return finalPredict.value?.blueCandidates?.[0]?.number
    ?? finalPredict.value?.recommendedBlueNumber
    ?? '';
});

/**
 * 当前选中快照是否已经具备复盘条件
 */
const selectedSnapshotCanReview = computed(() => {
  return Boolean(activeSnapshot.value && hasActualDraw(activeSnapshot.value.predictQiHao));
});

/**
 * 当前选中快照的复盘条件说明
 */
const reviewAvailabilityText = computed(() => {
  if (!activeSnapshot.value) {
    return viewMode.value === 'realtime' ? '实时预测需先保存快照' : '未选择历史快照';
  }
  return selectedSnapshotCanReview.value ? '该快照已开奖，可复盘' : '该快照对应期号尚未开奖';
});

/**
 * 当前实时预测是否仍停留在最新已开奖期号。
 * @description 这里只判断“预测链是否推进”，不再等同于窗口基础数据是否已经同步。
 */
const predictionNeedsWindowSync = computed(() => {
  if (workflowHasNextSnapshotEvidence.value) {
    return false;
  }
  return Boolean(
    latestDraw.value?.qiHao
    && currentPredictQiHao.value
    && latestDraw.value.qiHao === currentPredictQiHao.value
  );
});

/**
 * 当前快照是否已经完成复盘。
 * @description 优先读取快照持久化状态，同时兼容本页刚执行完成但列表尚未刷新的复盘结果。
 */
const activeSnapshotReviewed = computed(() => {
  return Boolean(activeSnapshot.value?.reviewStatus === 1 || reviewResult.value);
});

/**
 * 当前快照是否已经保存过诊断包。
 * @description 优先读取后端已保存诊断记录，同时兼容本页刚保存但列表尚未刷新完成的状态。
 */
const activeDiagnosticPackSaved = computed(() => {
  return Boolean(
    activeSnapshot.value?.id
    && (
      diagnosticPackSavedSnapshotId.value === activeSnapshot.value.id
      || activeDiagnosticSnapshots.value.some(item => item.snapshotId === activeSnapshot.value?.id)
    )
  );
});

/**
 * 最新预测是否已经进入下一期开奖期号。
 */
const currentPredictionIsNextPeriod = computed(() => {
  if (!latestDraw.value?.qiHao || !currentPredictQiHao.value) {
    return false;
  }
  return Number(currentPredictQiHao.value) > Number(latestDraw.value.qiHao);
});

/**
 * 已保存的下一期预测快照。
 * @description 历史复盘模式下不能只看当前展示的快照期号，需要从快照列表判断是否已经完成下一期保存。
 */
const nextSavedSnapshotAfterLatestDraw = computed(() => {
  const latestQiHao = latestDraw.value?.qiHao;
  if (!latestQiHao) {
    return null;
  }

  return snapshots.value
    .filter(item => Number(item.predictQiHao) > Number(latestQiHao))
    .sort((left, right) => Number(left.predictQiHao) - Number(right.predictQiHao))[0] ?? null;
});

/**
 * 是否存在开奖后流程已推进到下一期的证据。
 * @description 下一期快照已保存时，说明窗口基础和结构链至少已经支持生成下一期预测。
 */
const workflowHasNextSnapshotEvidence = computed(() => {
  return Boolean(nextSavedSnapshotAfterLatestDraw.value || currentPredictionIsNextPeriod.value);
});

/**
 * 本地窗口基础数据是否已经覆盖最新期开奖期号。
 * @description 窗口基础状态来自浏览器IndexedDB中的窗口元信息；预测是否推进由实时预测期号单独判断。
 */
const windowBaseSyncedToLatestDraw = computed(() => {
  const latestQiHao = latestDraw.value?.qiHao;
  if (!latestQiHao) {
    return false;
  }
  const windowInfos = lotteryStore.windowDataInfoList;
  if (windowInfos.length === 0) {
    return false;
  }
  return windowInfos.every(item => item.latestQiHao && Number(item.latestQiHao) >= Number(latestQiHao));
});

/**
 * 本地窗口基础数据期号摘要。
 * @description 用最小和最大窗口期号说明窗口缓存状态，方便区分“窗口没同步”和“预测链没推进”。
 */
const windowBaseQiHaoSummary = computed(() => {
  const qiHaoList = lotteryStore.windowDataInfoList
    .map(item => item.latestQiHao)
    .filter((qiHao): qiHao is string => Boolean(qiHao));
  if (qiHaoList.length === 0) {
    return '暂无本地窗口缓存';
  }
  const sorted = [...qiHaoList].sort((left, right) => Number(left) - Number(right));
  const minQiHao = sorted[0];
  const maxQiHao = sorted[sorted.length - 1];
  return minQiHao === maxQiHao ? `窗口缓存至 ${maxQiHao}` : `窗口缓存 ${minQiHao}~${maxQiHao}`;
});

/**
 * 当前页面的开奖后执行链状态。
 * @description 用于提醒人工操作顺序，不触发接口，也不修改任何预测结果。
 */
const postDrawWorkflowSteps = computed<WorkflowStep[]>(() => {
  const hasDraw = Boolean(latestDraw.value?.qiHao);
  const hasSnapshot = Boolean(activeSnapshot.value);
  const hasActualForSnapshot = Boolean(activeSnapshot.value && hasActualDraw(activeSnapshot.value.predictQiHao));
  const nextSnapshot = nextSavedSnapshotAfterLatestDraw.value;
  const axisSynced = axisSyncResults.value.length > 0 || Boolean(nextSnapshot);

  return [
    {
      key: 'draw',
      title: '开奖信息',
      status: hasDraw ? 'done' : 'pending',
      statusText: hasDraw ? '已读取' : '待同步',
      description: hasDraw ? `最新开奖 ${latestDraw.value?.qiHao}` : '先同步最新开奖数据。'
    },
    {
      key: 'window',
      title: '窗口基础',
      status: windowBaseSyncedToLatestDraw.value ? 'done' : (hasDraw ? 'pending' : 'waiting'),
      statusText: windowBaseSyncedToLatestDraw.value ? '已推进' : (hasDraw ? '待推进' : '等待开奖'),
      description: windowBaseSyncedToLatestDraw.value
        ? windowBaseQiHaoSummary.value
        : `最新开奖 ${latestDraw.value?.qiHao ?? '--'}，${windowBaseQiHaoSummary.value}。`
    },
    {
      key: 'review',
      title: '快照复盘',
      status: activeSnapshotReviewed.value ? 'done' : (hasSnapshot && hasActualForSnapshot ? 'pending' : 'waiting'),
      statusText: activeSnapshotReviewed.value ? '已复盘' : (hasSnapshot && hasActualForSnapshot ? '可复盘' : '等待快照'),
      description: activeSnapshotReviewed.value ? '可继续保存诊断包。' : '复盘必须基于开奖前快照。'
    },
    {
      key: 'diagnosticPack',
      title: '诊断包',
      status: activeDiagnosticPackSaved.value ? 'done' : (activeSnapshotReviewed.value ? 'pending' : 'waiting'),
      statusText: activeDiagnosticPackSaved.value ? '已保存' : (activeSnapshotReviewed.value ? '建议保存' : '等待复盘'),
      description: activeDiagnosticPackSaved.value
        ? `已保存 ${activeDiagnosticSnapshots.value.length || 1} 条诊断证据。`
        : '保存后便于后续跨期比较。'
    },
    {
      key: 'axis',
      title: '结构链',
      status: axisSynced ? 'done' : (activeSnapshotReviewed.value ? 'pending' : 'waiting'),
      statusText: axisSynced ? '已同步' : (activeSnapshotReviewed.value ? '待同步' : '等待复盘'),
      description: axisSynced
        ? (nextSnapshot ? `下一期快照 ${nextSnapshot.predictQiHao} 已生成，可视为结构链已推进。` : '结构链已面向下一期刷新。')
        : '通常放在复盘分析后执行。'
    },
    {
      key: 'nextSnapshot',
      title: '下一期快照',
      status: nextSnapshot ? 'done' : (currentPredictionIsNextPeriod.value ? 'pending' : 'waiting'),
      statusText: nextSnapshot ? '已保存' : (currentPredictionIsNextPeriod.value ? '待保存' : '等待刷新'),
      description: nextSnapshot ? `快照 ${nextSnapshot.predictQiHao}` : '刷新下一期预测后保存。'
    }
  ];
});

/**
 * 执行链完成数量摘要。
 */
const workflowSummaryText = computed(() => {
  const steps = postDrawWorkflowSteps.value;
  const doneCount = steps.filter(item => item.status === 'done').length;
  return `已完成 ${doneCount}/${steps.length}`;
});

/**
 * 诊断研究台推荐阅读顺序。
 */
const diagnosticGuideItems: DiagnosticGuideItem[] = [
  {
    order: '1',
    title: '多期趋势',
    description: '先判断主推荐、9+1、10注和蓝球是否真的变好。'
  },
  {
    order: '2',
    title: '阶段漏斗',
    description: '再看真实红球是在入口池、组合池、扩展池还是出票池被丢掉。'
  },
  {
    order: '3',
    title: '保底扩展',
    description: '确认重号、邻号、贝叶斯等来源是否能救回漏号。'
  },
  {
    order: '4',
    title: '压缩回测',
    description: '观察扩展池能否被压缩成9红或10注票面。'
  },
  {
    order: '5',
    title: '入口融合',
    description: '比较TopN和来源配额，寻找更好的候选入口。'
  },
  {
    order: '6',
    title: '贝叶斯冷热',
    description: '作为解释和保底来源，不单独决定出票。'
  }
];

/**
 * 诊断指标速读说明。
 * @description 用固定解释降低诊断页面的阅读成本，不参与任何预测计算。
 */
const diagnosticMetricGuideItems: DiagnosticMetricGuideItem[] = [
  {
    title: '覆盖率',
    formula: '覆盖率 = 命中红球数 / 实际红球数',
    description: '表示某个候选池覆盖了本期真实6个红球中的多少个。例如4/6就是覆盖率66.67%。',
    watchPoint: '当前阶段优先看能否稳定达到4红覆盖，而不是只看某一期是否中奖。'
  },
  {
    title: '入口池',
    formula: '入口池 = 第一阶段入围红球',
    description: '通常来自红10单号评分TopN，决定后续组合能从哪些号码里挑选。',
    watchPoint: '如果入口池漏掉真实红球，后面的组合评分再好也很难救回来。'
  },
  {
    title: '原候选池',
    formula: '原候选池 = 主模型高分6红组合的并集',
    description: '它不是单注票面，而是主模型认为较强的一批6红组合合并后的候选范围。',
    watchPoint: '如果入口有命中但原候选池变差，说明组合排序或三窗口结构分可能刷掉了有效号码。'
  },
  {
    title: '保底扩展池',
    formula: '扩展池 = 原候选池 + 重号/邻号/贝叶斯等来源',
    description: '用于观察遗漏号码能否被其他来源救回，当前不直接等于正式出票。',
    watchPoint: '扩展池覆盖高只说明有救回能力，还要继续看能否压缩成9红或10注。'
  },
  {
    title: '压缩9红/10注',
    formula: '压缩 = 从扩展池缩小到可购买规模',
    description: '9红对应复式观察池，10注对应单式票面池，核心难点是保留扩展池救回的号码。',
    watchPoint: '如果扩展池4红但压缩后只剩2到3红，问题就在压缩策略。'
  },
  {
    title: '有效期数',
    formula: '有效期数 = 扩展或压缩后命中变好的期数',
    description: '用于判断某个策略是不是多期都能改善，而不是单期碰巧提升。',
    watchPoint: '至少观察6到7个已复盘样本，再讨论是否进入正式预测。'
  },
  {
    title: '来源配额',
    formula: '配额 = 每类来源最多补入几个号码',
    description: '例如重3/邻3/贝3表示重号、邻号、贝叶斯Top各最多补入3个候选。',
    watchPoint: '配额的意义是避免某一种来源挤满扩展池，导致其他有效来源进不来。'
  },
  {
    title: '观察线',
    formula: '观察线 = 只回测和解释，不改正式票面',
    description: '诊断研究台的大部分策略都先进入观察线，只有持续有效才考虑升级模型版本。',
    watchPoint: '进入正式预测前必须有多期证据、策略记录，并明确是否提升模型版本。'
  }
];

/**
 * 策略准入检查项。
 * @description 只根据当前已加载诊断结果给出提示，不自动修改正式预测模型。
 */
const strategyAdmissionChecks = computed<StrategyAdmissionCheck[]>(() => {
  const sampleCount = Math.max(
    reviewTrend.value?.periodCount ?? 0,
    redFunnelDiagnosis.value?.periodCount ?? 0,
    blueCandidateDiagnosis.value?.periodCount ?? 0
  );
  const expandedStage = redFunnelDiagnosis.value?.stageSummaries?.find(item => item.stageCode === 'GUARD_EXPANDED_POOL');
  const compressedStage = redFunnelDiagnosis.value?.stageSummaries?.find(item => item.stageCode === 'COMPRESSED_NINE_POOL');
  const singleStage = redFunnelDiagnosis.value?.stageSummaries?.find(item => item.stageCode === 'SINGLE_TICKET_POOL');
  const expandedReachFourRate = expandedStage && redFunnelDiagnosis.value?.periodCount
    ? expandedStage.reachFourCount / redFunnelDiagnosis.value.periodCount
    : null;
  const compressedReachThreeRate = compressedStage && redFunnelDiagnosis.value?.periodCount
    ? compressedStage.reachThreeCount / redFunnelDiagnosis.value.periodCount
    : null;
  const singleReachThreeRate = singleStage && redFunnelDiagnosis.value?.periodCount
    ? singleStage.reachThreeCount / redFunnelDiagnosis.value.periodCount
    : null;

  return [
    {
      title: '样本数量',
      status: sampleCount >= 7 ? 'pass' : sampleCount >= 5 ? 'observe' : 'unknown',
      statusText: sampleCount > 0 ? `${sampleCount}期` : '待加载',
      description: '正式升级前至少观察6-7期，避免被单期波动误导。'
    },
    {
      title: '红球扩展覆盖',
      status: expandedReachFourRate == null ? 'unknown' : expandedReachFourRate >= 0.7 ? 'pass' : 'observe',
      statusText: expandedReachFourRate == null ? '待阶段漏斗' : `4红率 ${formatPercent(expandedReachFourRate)}`,
      description: '保底扩展池需要稳定把候选覆盖推到4红附近，才有继续压缩的价值。'
    },
    {
      title: '压缩不回落',
      status: compressedReachThreeRate == null || singleReachThreeRate == null
        ? 'unknown'
        : (compressedReachThreeRate >= 0.6 && singleReachThreeRate >= 0.6 ? 'pass' : 'observe'),
      statusText: compressedReachThreeRate == null || singleReachThreeRate == null
        ? '待阶段漏斗'
        : `9红 ${formatPercent(compressedReachThreeRate)} / 10注 ${formatPercent(singleReachThreeRate)}`,
      description: '扩展池救回的号码必须尽量留到9红和10注里，否则不能进入正式出票。'
    },
    {
      title: '蓝球不拖后腿',
      status: !blueCandidateDiagnosis.value
        ? 'unknown'
        : (blueCandidateDiagnosis.value.candidateHitRate >= 0.5 && blueCandidateDiagnosis.value.top3HitRate >= 0.5 ? 'pass' : 'observe'),
      statusText: !blueCandidateDiagnosis.value
        ? '待蓝球诊断'
        : `候选 ${formatPercent(blueCandidateDiagnosis.value.candidateHitRate)} / Top3 ${formatPercent(blueCandidateDiagnosis.value.top3HitRate)}`,
      description: '红球改善但蓝球候选仍经常未覆盖时，不能把整体模型判定为可升级。'
    },
    {
      title: '文档与版本',
      status: 'pass',
      statusText: '已纳入纪律',
      description: '策略升级必须先写策略决策记录，并明确模型版本变化。'
    }
  ];
});

/**
 * 策略准入总体状态。
 */
const strategyAdmissionState = computed<StrategyAdmissionStatus>(() => {
  const checks = strategyAdmissionChecks.value;
  if (checks.some(item => item.status === 'fail')) {
    return 'fail';
  }
  if (checks.some(item => item.status === 'unknown')) {
    return 'unknown';
  }
  return checks.every(item => item.status === 'pass') ? 'pass' : 'observe';
});

/**
 * 策略准入状态文案。
 */
const strategyAdmissionStateText = computed(() => {
  const stateTextMap: Record<StrategyAdmissionStatus, string> = {
    pass: '可考虑升级',
    observe: '继续观察',
    fail: '不建议升级',
    unknown: '证据不足'
  };
  return stateTextMap[strategyAdmissionState.value];
});

/**
 * 策略准入状态样式。
 */
const strategyAdmissionStateClass = computed(() => `strategy-admission-badge-${strategyAdmissionState.value}`);

/**
 * 漏号分布展示分组
 */
const distributionGroups = computed(() => {
  if (!redMissDistribution.value) {
    return [];
  }
  return [
    { title: '完全漏号号码', items: redMissDistribution.value.fullMissNumberItems },
    { title: '完全漏号三区', items: redMissDistribution.value.fullMissAreaItems },
    { title: '红10 level', items: redMissDistribution.value.red10LevelItems },
    { title: '红20 level', items: redMissDistribution.value.red20LevelItems },
    { title: '红33 level', items: redMissDistribution.value.red33LevelItems },
    { title: '红10 willDown', items: redMissDistribution.value.red10WillDownItems },
    { title: '上期关联状态', items: redMissDistribution.value.currentRecItems }
  ];
});

/**
 * 格式化号码列表
 * @param list 号码列表
 * @returns 逗号分隔的号码文本
 */
function formatList(list?: string[] | null): string {
  return list && list.length > 0 ? list.join(',') : '--';
}

/**
 * 格式化评分，避免页面展示过长小数
 * @param value 原始评分
 * @returns 两位小数评分文本
 */
function formatScore(value?: number | null): string {
  return typeof value === 'number' ? value.toFixed(2) : '--';
}

/**
 * 根据排名获取10注6+1的复盘结果
 * @param rank 单式方案排名
 * @returns 对应票面的复盘结果
 */
function singleTicketReviewByRank(rank: number): PredictionSnapshotTicketReview | undefined {
  return reviewResult.value?.singleTicketReviews?.find(item => item.rank === rank);
}

/**
 * 格式化奖金
 * @param review 票面复盘结果
 * @returns 奖金文本
 */
function formatPrize(review?: PredictionSnapshotTicketReview | null): string {
  if (!review) {
    return '--';
  }
  return review.variablePrize ? '浮动' : String(review.prizeAmount);
}

/**
 * 格式化比例
 * @param value 原始比例
 * @returns 百分比文本
 */
function formatPercent(value?: number | null): string {
  return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '--';
}

/**
 * 格式化普通数字。
 * @param value 原始数字
 * @param digits 小数位
 * @returns 固定位数数字文本
 */
function formatNumber(value?: number | null, digits = 2): string {
  return typeof value === 'number' ? value.toFixed(digits) : '--';
}

/**
 * 格式化阶段漏斗相邻阶段命中变化。
 * @param delta 命中数量变化
 * @returns 带正负号的变化文本
 */
function funnelDeltaText(delta?: number | null): string {
  if (typeof delta !== 'number') {
    return '--';
  }
  if (delta > 0) {
    return `+${delta}`;
  }
  return String(delta);
}

/**
 * 获取阶段漏斗命中变化样式。
 * @param delta 命中数量变化
 * @returns 样式类名
 */
function funnelDeltaClass(delta?: number | null): string {
  if (typeof delta !== 'number' || delta === 0) {
    return 'text-text-secondary font-bold';
  }
  return delta > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold';
}

/**
 * 将后端返回的分布对象转换为可渲染数组
 * @param distribution 分布对象
 * @returns 排序后的键值数组
 */
function distributionEntries(distribution?: Record<number, number> | null): Array<{ key: string; value: number }> {
  if (!distribution) {
    return [];
  }
  return Object.entries(distribution)
    .map(([key, value]) => ({ key, value: Number(value) }))
    .sort((a, b) => Number(a.key) - Number(b.key));
}

/**
 * 格式化开奖红球文本
 * @param draw 开奖记录
 * @returns 逗号分隔的红球文本
 */
function drawRedText(draw: DrawRecord): string {
  return [draw.red1, draw.red2, draw.red3, draw.red4, draw.red5, draw.red6].join(',');
}

/**
 * 格式化开奖完整票面文本。
 * @param draw 开奖记录
 * @returns 红球加蓝球的完整票面
 */
function drawTicketText(draw: DrawRecord): string {
  return `${drawRedText(draw)} + ${draw.blue}`;
}

/**
 * 按期号查找本地开奖完整票面。
 * @description 快照列表中每行期号不同，需要按期号寻找对应开奖，才能给推荐票面做命中标色。
 * @param qiHao 预测期号
 * @returns 找到时返回完整开奖号，否则返回空字符串
 */
function drawTicketTextByQiHao(qiHao?: string | null): string {
  // 没有期号时无法匹配开奖。
  if (!qiHao) {
    return '';
  }

  // 优先从本地全量开奖缓存中查找。
  const matchedDraw = lotteryStore.drawRecords.find(record => record.qiHao === qiHao);
  if (matchedDraw) {
    return drawTicketText(matchedDraw);
  }

  // 本地全量缓存未命中时，使用最新开奖兜底。
  if (lotteryStore.latestDraw?.qiHao === qiHao) {
    return drawTicketText(lotteryStore.latestDraw);
  }

  return '';
}

/**
 * 获取快照对应的实际开奖票面。
 * @description 已复盘快照优先使用复盘摘要中的开奖号；未复盘但本地有开奖时再从开奖缓存读取。
 * @param snapshot 预测快照
 * @returns 实际开奖票面文本
 */
function snapshotActualTicketText(snapshot: PredictionSnapshotEntity): string {
  // 已复盘快照里保存了开奖前快照对应的真实开奖，优先使用它避免本地缓存缺失。
  const snapshotReview = parseSnapshotJson<PredictionSnapshotReviewResult>(snapshot.reviewSummaryJson);
  if (snapshotReview?.actualRedNumbers?.length) {
    return `${formatList(snapshotReview.actualRedNumbers)} + ${snapshotReview.actualBlueNumber}`;
  }

  return drawTicketTextByQiHao(snapshot.predictQiHao);
}

/**
 * 判断指定期号是否已经存在真实开奖数据
 * @param qiHao 预测期号
 * @returns true表示本地开奖缓存已有该期
 */
function hasActualDraw(qiHao?: string | null): boolean {
  if (!qiHao) return false;
  return lotteryStore.drawRecords.some(record => record.qiHao === qiHao)
    || lotteryStore.latestDraw?.qiHao === qiHao;
}

/**
 * 转换漏号来源类型为中文说明
 * @param sourceType 来源类型
 * @returns 中文说明
 */
function sourceTypeText(sourceType: string): string {
  const textMap: Record<string, string> = {
    RECOMMENDED: '推荐命中',
    CANDIDATE_AND_SINGLE: '候选+票面',
    CANDIDATE_ONLY: '仅候选池',
    SINGLE_ONLY: '仅10注补入',
    MISSED: '完全漏号'
  };
  return textMap[sourceType] ?? sourceType;
}

/**
 * 快照复盘列展示文本
 * @param snapshot 快照记录
 * @returns 复盘状态文本
 */
function snapshotReviewText(snapshot: PredictionSnapshotEntity): string {
  return snapshot.reviewStatus === 1 ? '已复盘' : '待复盘';
}

/**
 * 快照复盘列样式
 * @param snapshot 快照记录
 * @returns 状态徽标样式
 */
function snapshotReviewBadgeClass(snapshot: PredictionSnapshotEntity): string {
  return snapshot.reviewStatus === 1 ? 'status-badge status-done' : 'status-text-muted';
}

/**
 * 快照开奖列展示文本
 * @param snapshot 快照记录
 * @returns 开奖状态文本
 */
function snapshotDrawText(snapshot: PredictionSnapshotEntity): string {
  return hasActualDraw(snapshot.predictQiHao) ? '已开奖' : '待开奖';
}

/**
 * 快照开奖列样式
 * @param snapshot 快照记录
 * @returns 状态徽标样式
 */
function snapshotDrawBadgeClass(snapshot: PredictionSnapshotEntity): string {
  return hasActualDraw(snapshot.predictQiHao) ? 'status-badge status-done' : 'status-text-muted';
}

/**
 * 快照操作按钮文本
 * @param snapshot 快照记录
 * @returns 操作文本
 */
function snapshotActionText(snapshot: PredictionSnapshotEntity): string {
  if (snapshot.reviewStatus === 1) {
    return '查看复盘';
  }
  return hasActualDraw(snapshot.predictQiHao) ? '复盘' : '查看快照';
}

/**
 * 格式化某个窗口下的号码状态
 * @param states 三窗口状态列表
 * @param windowCode 窗口编码
 * @returns 等级和降级状态文本
 */
function windowStateText(states: RedCandidateMissWindowState[], windowCode: string): string {
  const state = states.find(item => item.windowCode === windowCode);
  return state ? `lv${state.level}/d${state.willDown}/rec${state.currentRec}` : '--';
}

/**
 * 转换9+1反推角色为中文说明
 * @param role 后端角色编码
 * @returns 中文说明
 */
function reverseRoleText(role?: string | null): string {
  const textMap: Record<string, string> = {
    DAN_CANDIDATE: '胆候选',
    CORE_9: '9红核心',
    WATCH: '观察'
  };
  return role ? textMap[role] ?? role : '--';
}

/**
 * 转换贝叶斯信号类型为中文
 * @param signalType 信号类型编码
 * @returns 中文说明
 */
function bayesSignalText(signalType: string): string {
  const textMap: Record<string, string> = {
    COLD_TO_HOT: '冷转热',
    HOT_TO_COLD: '热转冷',
    CONSISTENT_HOT: '持续热',
    CONSISTENT_COLD: '持续冷',
    NEUTRAL: '中性'
  };
  return textMap[signalType] ?? signalType;
}

/**
 * 转换贝叶斯可靠性为中文
 * @param reliabilityLevel 可靠性编码
 * @returns 中文说明
 */
function bayesReliabilityText(reliabilityLevel: string): string {
  const textMap: Record<string, string> = {
    STRICT_SIGNIFICANT: '严格显著',
    FDR_SIGNIFICANT: 'FDR显著',
    RAW_ONLY: '低置信',
    NORMAL: '普通观察'
  };
  return textMap[reliabilityLevel] ?? reliabilityLevel;
}

/**
 * 贝叶斯可靠性展示样式
 * @param reliabilityLevel 可靠性编码
 * @returns 样式类
 */
function bayesReliabilityClass(reliabilityLevel: string): string {
  if (reliabilityLevel === 'STRICT_SIGNIFICANT' || reliabilityLevel === 'FDR_SIGNIFICANT') {
    return 'status-badge status-done';
  }
  if (reliabilityLevel === 'RAW_ONLY') {
    return 'status-badge status-warn';
  }
  return 'status-text-muted';
}

/**
 * 展示页面提示信息
 * @param text 提示内容
 * @param type 提示类型
 */
function showMessage(text: string, type: 'success' | 'error') {
  message.value = text;
  messageType.value = type;
}

/**
 * 展示复制按钮旁边的局部提示
 * @param target 提示所属区域
 * @param text 提示文本
 */
function showCopyTip(target: 'nine' | 'single', text: string) {
  if (target === 'nine') {
    nineCopyTip.value = text;
  } else {
    singleCopyTip.value = text;
  }
  window.setTimeout(() => {
    if (target === 'nine' && nineCopyTip.value === text) {
      nineCopyTip.value = '';
    }
    if (target === 'single' && singleCopyTip.value === text) {
      singleCopyTip.value = '';
    }
  }, 2200);
}

/**
 * 写入系统剪贴板
 * @param text 需要复制的文本
 * @param successMessage 成功提示
 * @param tipTarget 局部提示所属区域
 */
async function copyToClipboard(text: string, successMessage: string, tipTarget?: 'nine' | 'single') {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyToClipboard(text);
    }
    showMessage(successMessage, 'success');
    if (tipTarget) {
      showCopyTip(tipTarget, '已复制');
    }
  } catch {
    try {
      fallbackCopyToClipboard(text);
      showMessage(successMessage, 'success');
      if (tipTarget) {
        showCopyTip(tipTarget, '已复制');
      }
    } catch {
      showMessage('复制失败，请检查浏览器剪贴板权限', 'error');
      if (tipTarget) {
        showCopyTip(tipTarget, '复制失败');
      }
    }
  }
}

/**
 * 剪贴板API不可用时的兜底复制
 * @param text 需要复制的文本
 */
function fallbackCopyToClipboard(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'readonly');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error('浏览器拒绝复制');
  }
}

/**
 * 构建当前9+1复式复制文本
 * @returns 复式投注文本
 */
function buildNinePlusOneMultipleText(): string {
  if (!ninePlusOnePredict.value) {
    return '';
  }
  const redText = formatList(ninePlusOnePredict.value.recommendedNumbers);
  const blueText = ninePlusOneBlueNumber.value || '--';
  return [
    `红 ${redText}`,
    `蓝 ${blueText}`
  ].join('\n');
}

/**
 * 构建当前9+1对应的1胆8拖复制文本
 * @returns 胆拖投注文本
 */
function buildNinePlusOneDanTuoText(): string {
  if (!ninePlusOnePredict.value) {
    return '';
  }
  const danNumber = ninePlusOnePredict.value.danNumber || ninePlusOnePredict.value.recommendedNumbers?.[0] || '';
  const tuoNumbers = (ninePlusOnePredict.value.recommendedNumbers ?? []).filter(number => number !== danNumber);
  const blueText = ninePlusOneBlueNumber.value || '--';
  return [
    `胆 ${danNumber || '--'}`,
    `拖 ${formatList(tuoNumbers)}`,
    `蓝 ${blueText}`
  ].join('\n');
}

/**
 * 构建10注6+1单式方案复制文本
 * @returns 单式方案文本
 */
function buildSingleTicketPlanText(): string {
  if (!singlePlan.value) {
    return '';
  }
  return singlePlan.value.tickets
    .map(item => `${item.rank}. 红 ${formatList(item.redNumbers)} 蓝 ${item.blueNumber}`)
    .join('\n');
}

/**
 * 复制9+1复式方案
 */
async function copyNinePlusOneMultiple() {
  if (!ninePlusOnePredict.value) {
    showMessage('暂无9+1复式方案可复制', 'error');
    return;
  }
  await copyToClipboard(buildNinePlusOneMultipleText(), '9+1复式方案已复制到剪贴板', 'nine');
}

/**
 * 复制9+1对应的胆拖方案
 */
async function copyNinePlusOneDanTuo() {
  if (!ninePlusOnePredict.value) {
    showMessage('暂无9+1胆拖方案可复制', 'error');
    return;
  }
  await copyToClipboard(buildNinePlusOneDanTuoText(), '1胆8拖+1蓝方案已复制到剪贴板', 'nine');
}

/**
 * 复制10注6+1单式方案
 */
async function copySingleTicketPlan() {
  if (!singlePlan.value) {
    showMessage('暂无10注6+1单式方案可复制', 'error');
    return;
  }
  await copyToClipboard(buildSingleTicketPlanText(), '10注6+1单式方案已复制到剪贴板', 'single');
}

/**
 * 安全解析快照JSON
 * @param json 快照中的JSON文本
 * @returns 解析后的对象，解析失败时返回null
 */
function parseSnapshotJson<T>(json?: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * 加载多期快照复盘趋势
 */
async function loadReviewTrend() {
  trendLoading.value = true;
  message.value = '';
  try {
    const res = await getPredictionReviewTrend(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '多期复盘趋势统计失败');
    }
    reviewTrend.value = res.data;
    showMessage('多期复盘趋势统计完成，详细结论见下方趋势区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '多期复盘趋势统计失败', 'error');
  } finally {
    trendLoading.value = false;
  }
}

/**
 * 切换多期快照复盘趋势区域
 */
async function toggleReviewTrend() {
  if (reviewTrend.value) {
    reviewTrend.value = null;
    showMessage('已关闭多期复盘趋势', 'success');
    return;
  }
  await loadReviewTrend();
}

/**
 * 加载红球贝叶斯冷热诊断
 */
async function loadBayesDiagnosis() {
  bayesLoading.value = true;
  message.value = '';
  try {
    const res = await getRedBayesColdHotDiagnosis();
    if (res.code !== 200) {
      throw new Error(res.msg || '贝叶斯冷热诊断失败');
    }
    bayesDiagnosis.value = res.data;
    showMessage('贝叶斯冷热诊断完成，当前只作为观察层，不改变正式预测', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '贝叶斯冷热诊断失败', 'error');
  } finally {
    bayesLoading.value = false;
  }
}

/**
 * 切换红球贝叶斯冷热诊断区域
 * @description 已打开时再次点击只关闭页面结果，不重新请求后端。
 */
async function toggleBayesDiagnosis() {
  if (bayesDiagnosis.value) {
    bayesDiagnosis.value = null;
    showMessage('已关闭贝叶斯冷热诊断', 'success');
    return;
  }
  await loadBayesDiagnosis();
}

/**
 * 加载蓝球候选池独立诊断。
 */
async function loadBlueCandidateDiagnosis() {
  blueDiagnosisLoading.value = true;
  message.value = '';
  try {
    const res = await getBlueCandidateDiagnosis(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '蓝球候选池独立诊断失败');
    }
    blueCandidateDiagnosis.value = res.data;
    showMessage('蓝球独立诊断完成，当前只作为观察层，不改变正式预测', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '蓝球候选池独立诊断失败', 'error');
  } finally {
    blueDiagnosisLoading.value = false;
  }
}

/**
 * 切换蓝球候选池独立诊断区域。
 * @description 已打开时再次点击只关闭页面结果，不重新请求后端。
 */
async function toggleBlueCandidateDiagnosis() {
  if (blueCandidateDiagnosis.value) {
    blueCandidateDiagnosis.value = null;
    showMessage('已关闭蓝球独立诊断', 'success');
    return;
  }
  await loadBlueCandidateDiagnosis();
}

/**
 * 设置成本出票线策略汇总表排序。
 * @param key 排序字段
 */
function setCostTicketSort(key: keyof CostTicketStrategyMetric) {
  if (costTicketSortKey.value === key) {
    costTicketSortDirection.value = costTicketSortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }
  costTicketSortKey.value = key;
  costTicketSortDirection.value = key === 'strategyNameCn' ? 'asc' : 'desc';
}

/**
 * 获取成本出票线排序标记。
 * @param key 表头字段
 * @returns 当前排序箭头
 */
function costTicketSortMark(key: keyof CostTicketStrategyMetric) {
  if (costTicketSortKey.value !== key) {
    return '';
  }
  return costTicketSortDirection.value === 'asc' ? '↑' : '↓';
}

/**
 * 获取成本出票线策略中文名。
 * @param strategyCode 策略编码
 * @returns 中文策略名，未知时回退为策略编码
 */
function costTicketStrategyName(strategyCode: string) {
  return costTicketReview.value?.strategyMetrics.find(item => item.strategyCode === strategyCode)?.strategyNameCn
    ?? strategyCode;
}

/**
 * 加载成本出票线只读评审。
 * @description 只读取已保存快照事实，不会重新生成预测，也不会修改正式预测或入口拟正式快照。
 */
async function loadCostTicketReview() {
  costTicketReviewLoading.value = true;
  message.value = '';
  try {
    const res = await getCostTicketReview(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '成本出票线评审失败');
    }
    costTicketReview.value = res.data;
    showMessage('成本出票线评审完成，当前只作为成本风险观察，不代表购买建议', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '成本出票线评审失败', 'error');
  } finally {
    costTicketReviewLoading.value = false;
  }
}

/**
 * 切换成本出票线只读评审区域。
 */
async function toggleCostTicketReview() {
  if (costTicketReview.value) {
    costTicketReview.value = null;
    showMessage('已关闭成本出票线评审', 'success');
    return;
  }
  await loadCostTicketReview();
}

/**
 * 保存当前快照的复盘诊断包
 * @description 一次性沉淀复盘趋势、漏号分布、保底扩展回测和当前贝叶斯冷热，供后续研究复查。
 */
async function saveDiagnosticReviewPack() {
  if (!activeSnapshot.value) {
    showMessage('请先选择一个已复盘快照，再保存诊断包', 'error');
    return;
  }
  if (!canSaveDiagnosticSnapshot.value) {
    showMessage('当前快照尚未复盘，请先复盘后再保存诊断包', 'error');
    return;
  }

  diagnosticSnapshotLoading.value = true;
  message.value = '';
  try {
    const res = await savePredictionDiagnosticReviewPack(activeSnapshot.value.id, 20);
    if (res.code !== 200) {
      throw new Error(res.msg || '保存诊断包失败');
    }

    const typeText = (res.data ?? []).map(item => item.diagnosticType).join('、');
    diagnosticPackSavedSnapshotId.value = activeSnapshot.value.id;
    activeDiagnosticSnapshots.value = res.data ?? activeDiagnosticSnapshots.value;
    showMessage(`诊断包保存成功：${typeText || '复盘趋势、漏号分布、保底扩展、贝叶斯冷热'}`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '保存诊断包失败，请确认后端已重启到最新代码', 'error');
  } finally {
    diagnosticSnapshotLoading.value = false;
  }
}

/**
 * 刷新当前快照的已保存诊断记录
 * @description 用后端持久化记录修正“诊断包已保存”状态，避免页面刷新或切换快照后误判。
 * @param snapshotId 预测快照ID
 */
async function refreshActiveDiagnosticSnapshots(snapshotId?: number | null) {
  if (!snapshotId) {
    activeDiagnosticSnapshots.value = [];
    return;
  }

  try {
    const res = await getPredictionDiagnosticSnapshots({ snapshotId });
    if (res.code !== 200) {
      throw new Error(res.msg || '读取诊断包保存状态失败');
    }
    activeDiagnosticSnapshots.value = res.data ?? [];
  } catch {
    // 诊断包状态只用于页面提示；查询失败时不阻断快照展示和复盘。
    activeDiagnosticSnapshots.value = [];
  }
}

/**
 * 加载模型预测结果
 * @description 同时请求多窗口最终预测和10注6+1单式方案，任一接口失败都会提示错误
 */
async function loadPrediction() {
  await loadPredictionInternal(true);
}

/**
 * 加载实时预测结果
 * @param useExistingSnapshot 是否优先回填同预测期号下已保存的快照
 */
async function loadPredictionInternal(useExistingSnapshot: boolean) {
  loading.value = true;
  message.value = '';
  try {
    const [finalRes, nineRes, singleRes] = await Promise.all([
      getMultiWindowFinalPredict(),
      getNinePlusOnePredict(),
      getSingleTicketPlanPredict()
    ]);

    if (finalRes.code !== 200) {
      throw new Error(finalRes.msg || '红蓝合并预测加载失败');
    }
    if (nineRes.code !== 200) {
      throw new Error(nineRes.msg || '9+1复式预测加载失败');
    }
    if (singleRes.code !== 200) {
      throw new Error(singleRes.msg || '单式方案加载失败');
    }

    finalPredict.value = finalRes.data;
    ninePlusOnePredict.value = nineRes.data;
    singlePlan.value = singleRes.data;
    latestSnapshot.value = null;
    activeSnapshot.value = null;
    reviewResult.value = null;
    redMissDiagnosis.value = null;
    reviewTrend.value = null;
    redMissDistribution.value = null;
    guardBacktest.value = null;
    guardQuotaBacktest.value = null;
    guardQuotaGridBacktest.value = null;
    guardCompressionBacktest.value = null;
    guardCompressionGridBacktest.value = null;
    guardCompressionRetentionGridBacktest.value = null;
    entryFusionBacktest.value = null;
    entryRescoreFusionBacktest.value = null;
    entryFusionGridBacktest.value = null;
    combinationFusionBacktest.value = null;
    combinationSourceWeightGridBacktest.value = null;
    redFunnelDiagnosis.value = null;
    bayesDiagnosis.value = null;
    blueCandidateDiagnosis.value = null;
    activeDiagnosticSnapshots.value = [];
    viewMode.value = 'realtime';

    if (useExistingSnapshot) {
      const matchedSnapshot = await findLatestSnapshotByPredictQiHao(finalRes.data.predictQiHao);
      if (matchedSnapshot) {
        if (isReviewPage.value) {
          loadSnapshotToPage(matchedSnapshot);
        } else {
          activeSnapshot.value = matchedSnapshot;
          latestSnapshot.value = matchedSnapshot;
          reviewResult.value = parseSnapshotJson<PredictionSnapshotReviewResult>(matchedSnapshot.reviewSummaryJson);
        }
        await loadLatestSnapshots(false);
        showMessage(`已找到当前预测期号的已保存快照：ID ${matchedSnapshot.id}`, 'success');
        return;
      }
    }

    showMessage('预测结果加载成功', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '预测结果加载失败', 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * 查询当前预测期号下最新保存的快照
 * @param predictQiHao 预测期号
 * @returns 最新快照；没有则返回null
 */
async function findLatestSnapshotByPredictQiHao(predictQiHao?: string | null): Promise<PredictionSnapshotEntity | null> {
  if (!predictQiHao) {
    return null;
  }
  const res = await getPredictionSnapshotsByQiHao(predictQiHao);
  if (res.code !== 200) {
    throw new Error(res.msg || '查询当前期快照失败');
  }
  return res.data?.[0] ?? null;
}

/**
 * 同步坐标、模板、结构族和迁移链
 * @description 先调用红10专用增量链，再同步其他正式号码窗口的通用坐标结构链
 */
async function syncAxisChains() {
  axisSyncLoading.value = true;
  message.value = '';
  try {
    const red10Res = await syncRed10AxisChain();
    if (red10Res.code !== 200) {
      throw new Error(red10Res.msg || '红10坐标结构链同步失败');
    }

    const chainRes = await syncDefaultAxisChains();
    if (chainRes.code !== 200) {
      throw new Error(chainRes.msg || '多窗口坐标结构链同步失败');
    }

    axisSyncResults.value = chainRes.data;
    showMessage('坐标、模板、结构族和迁移链同步完成，请刷新预测生成下一期结果', 'success');
    await loadPrediction();
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '坐标结构链同步失败', 'error');
  } finally {
    axisSyncLoading.value = false;
  }
}

/**
 * 加载红球漏号分布统计
 */
async function loadMissDistribution() {
  distributionLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateMissDistribution(50);
    if (res.code !== 200) {
      throw new Error(res.msg || '红球漏号分布统计失败');
    }
  redMissDistribution.value = res.data;
    showMessage('漏号分布统计完成，详细结论见下方统计区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '红球漏号分布统计失败', 'error');
  } finally {
    distributionLoading.value = false;
  }
}

/**
 * 切换多期漏号统计区域
 */
async function toggleMissDistribution() {
  if (redMissDistribution.value) {
    redMissDistribution.value = null;
    showMessage('已关闭多期漏号统计', 'success');
    return;
  }
  await loadMissDistribution();
}

/**
 * 加载红球候选池阶段漏斗诊断。
 */
async function loadFunnelDiagnosis() {
  funnelDiagnosisLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateFunnelDiagnosis(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '红球候选池阶段漏斗诊断失败');
    }
    redFunnelDiagnosis.value = res.data;
    showMessage('阶段漏斗诊断完成，可查看入口、组合、扩展和出票阶段的覆盖变化', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '红球候选池阶段漏斗诊断失败', 'error');
  } finally {
    funnelDiagnosisLoading.value = false;
  }
}

/**
 * 切换红球候选池阶段漏斗诊断区域。
 */
async function toggleFunnelDiagnosis() {
  if (redFunnelDiagnosis.value) {
    redFunnelDiagnosis.value = null;
    showMessage('已关闭阶段漏斗诊断', 'success');
    return;
  }
  await loadFunnelDiagnosis();
}

/**
 * 加载红球入口池融合回测。
 * @description 只比较红10入口Top15和“红10Top15+重号/邻号/贝叶斯配额”的覆盖差异。
 */
async function loadEntryFusionBacktest() {
  entryFusionLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateEntryFusionBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '入口池融合回测失败');
    }
    entryFusionBacktest.value = res.data;
    showMessage('入口池融合回测完成，可查看红10入口补强前后的覆盖变化', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '入口池融合回测失败', 'error');
  } finally {
    entryFusionLoading.value = false;
  }
}

/**
 * 切换红球入口池融合回测区域。
 */
async function toggleEntryFusionBacktest() {
  if (entryFusionBacktest.value) {
    entryFusionBacktest.value = null;
    showMessage('已关闭入口池融合回测', 'success');
    return;
  }
  await loadEntryFusionBacktest();
}

/**
 * 加载红球入口池重评分融合回测。
 * @description 用红10单号分叠加重号、邻号、贝叶斯来源分后重新排序，再观察Top15入口覆盖。
 */
async function loadEntryRescoreFusionBacktest() {
  entryRescoreFusionLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateEntryRescoreFusionBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '入口重评分融合回测失败');
    }
    entryRescoreFusionBacktest.value = res.data;
    showMessage('入口重评分融合回测完成，可查看重评分后入口池是否提升覆盖', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '入口重评分融合回测失败', 'error');
  } finally {
    entryRescoreFusionLoading.value = false;
  }
}

/**
 * 切换红球入口池重评分融合回测区域。
 */
async function toggleEntryRescoreFusionBacktest() {
  if (entryRescoreFusionBacktest.value) {
    entryRescoreFusionBacktest.value = null;
    showMessage('已关闭入口重评分融合回测', 'success');
    return;
  }
  await loadEntryRescoreFusionBacktest();
}

/**
 * 加载红10TopN与来源配额入口融合网格。
 * @description 比较Top12/15/18与重号、邻号、贝叶斯不同配额组合的入口覆盖差异。
 */
async function loadEntryFusionGridBacktest() {
  entryFusionGridLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateEntryFusionGridBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '入口融合网格回测失败');
    }
    entryFusionGridBacktest.value = res.data;
    showMessage('入口融合网格回测完成，可比较TopN和来源配额的稳定性', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '入口融合网格回测失败', 'error');
  } finally {
    entryFusionGridLoading.value = false;
  }
}

/**
 * 切换红10TopN与来源配额入口融合网格区域。
 */
async function toggleEntryFusionGridBacktest() {
  if (entryFusionGridBacktest.value) {
    entryFusionGridBacktest.value = null;
    showMessage('已关闭入口融合网格回测', 'success');
    return;
  }
  await loadEntryFusionGridBacktest();
}

/**
 * 加载红球组合评分融合回测。
 * @description 让保底来源分参与组合排序，观察是否优于原红球组合池。
 */
async function loadCombinationFusionBacktest() {
  combinationFusionLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateCombinationFusionBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '组合评分融合回测失败');
    }
    combinationFusionBacktest.value = res.data;
    showMessage('组合评分融合回测完成，可查看来源分参与排序后的组合覆盖变化', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '组合评分融合回测失败', 'error');
  } finally {
    combinationFusionLoading.value = false;
  }
}

/**
 * 切换红球组合评分融合回测区域。
 */
async function toggleCombinationFusionBacktest() {
  if (combinationFusionBacktest.value) {
    combinationFusionBacktest.value = null;
    showMessage('已关闭组合评分融合回测', 'success');
    return;
  }
  await loadCombinationFusionBacktest();
}

/**
 * 加载红球组合评分来源权重网格。
 * @description 对比不同sourceWeight下，保底来源分参与组合排序后的覆盖变化。
 */
async function loadCombinationSourceWeightGridBacktest() {
  combinationSourceWeightGridLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateCombinationSourceWeightGridBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '来源权重网格回测失败');
    }
    combinationSourceWeightGridBacktest.value = res.data;
    showMessage('来源权重网格回测完成，可比较不同来源权重下的组合覆盖变化', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '来源权重网格回测失败', 'error');
  } finally {
    combinationSourceWeightGridLoading.value = false;
  }
}

/**
 * 切换红球组合评分来源权重网格区域。
 */
async function toggleCombinationSourceWeightGridBacktest() {
  if (combinationSourceWeightGridBacktest.value) {
    combinationSourceWeightGridBacktest.value = null;
    showMessage('已关闭来源权重网格回测', 'success');
    return;
  }
  await loadCombinationSourceWeightGridBacktest();
}

/**
 * 加载红球候选池保底扩展对照。
 * @description 同时拉取顺序版和固定配额版，页面上合并为同一个诊断区进行对比。
 */
async function loadGuardBacktestComparison() {
  guardBacktestLoading.value = true;
  message.value = '';
  try {
    const [basicRes, quotaRes] = await Promise.all([
      getRedCandidateGuardBacktest(20),
      getRedCandidateGuardQuotaBacktest(20)
    ]);
    if (basicRes.code !== 200) {
      throw new Error(basicRes.msg || '保底扩展回测失败');
    }
    if (quotaRes.code !== 200) {
      throw new Error(quotaRes.msg || '保底来源配额回测失败');
    }
    guardBacktest.value = basicRes.data;
    guardQuotaBacktest.value = quotaRes.data;
    activeGuardBacktestMode.value = 'basic';
    showMessage('保底扩展对照完成，可在下方切换顺序版和固定配额版明细', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '保底扩展对照失败', 'error');
  } finally {
    guardBacktestLoading.value = false;
  }
}

/**
 * 切换红球候选池保底扩展对照区域。
 */
async function toggleGuardBacktestComparison() {
  if (isGuardBacktestOpen.value) {
    guardBacktest.value = null;
    guardQuotaBacktest.value = null;
    activeGuardBacktestMode.value = 'basic';
    showMessage('已关闭保底扩展对照', 'success');
    return;
  }
  await loadGuardBacktestComparison();
}

/**
 * 加载红球候选池保底来源配额网格回测
 */
async function loadGuardQuotaGridBacktest() {
  guardQuotaGridLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateGuardQuotaGridBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '保底来源配额网格回测失败');
    }
    guardQuotaGridBacktest.value = res.data;
    showMessage('保底来源配额网格回测完成，详细结论见下方网格区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '保底来源配额网格回测失败', 'error');
  } finally {
    guardQuotaGridLoading.value = false;
  }
}

/**
 * 切换红球候选池保底来源配额网格回测区域
 */
async function toggleGuardQuotaGridBacktest() {
  if (guardQuotaGridBacktest.value) {
    guardQuotaGridBacktest.value = null;
    showMessage('已关闭配额网格回测', 'success');
    return;
  }
  await loadGuardQuotaGridBacktest();
}

/**
 * 加载红球保底扩展池压缩回测
 */
async function loadGuardCompressionBacktest() {
  guardCompressionLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateGuardCompressionBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '扩展池压缩回测失败');
    }
    guardCompressionBacktest.value = res.data;
    showMessage('扩展池压缩回测完成，详细结论见下方压缩区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '扩展池压缩回测失败', 'error');
  } finally {
    guardCompressionLoading.value = false;
  }
}

/**
 * 切换红球保底扩展池压缩回测区域
 */
async function toggleGuardCompressionBacktest() {
  if (guardCompressionBacktest.value) {
    guardCompressionBacktest.value = null;
    showMessage('已关闭扩展池压缩回测', 'success');
    return;
  }
  await loadGuardCompressionBacktest();
}

/**
 * 加载红球保底扩展池压缩策略网格回测
 */
async function loadGuardCompressionGridBacktest() {
  guardCompressionGridLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateGuardCompressionGridBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '压缩策略网格回测失败');
    }
    guardCompressionGridBacktest.value = res.data;
    showMessage('压缩策略网格回测完成，详细结论见下方策略网格区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '压缩策略网格回测失败', 'error');
  } finally {
    guardCompressionGridLoading.value = false;
  }
}

/**
 * 切换红球保底扩展池压缩策略网格回测区域
 */
async function toggleGuardCompressionGridBacktest() {
  if (guardCompressionGridBacktest.value) {
    guardCompressionGridBacktest.value = null;
    showMessage('已关闭压缩策略网格回测', 'success');
    return;
  }
  await loadGuardCompressionGridBacktest();
}

/**
 * 加载红球保底扩展池压缩来源最低保留位网格回测
 */
async function loadGuardCompressionRetentionGridBacktest() {
  guardCompressionRetentionGridLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateGuardCompressionRetentionGridBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '压缩来源最低保留位网格回测失败');
    }
    guardCompressionRetentionGridBacktest.value = res.data;
    showMessage('压缩来源最低保留位网格回测完成，详细结论见下方保留位区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '压缩来源最低保留位网格回测失败', 'error');
  } finally {
    guardCompressionRetentionGridLoading.value = false;
  }
}

/**
 * 切换红球保底扩展池压缩来源最低保留位网格回测区域
 */
async function toggleGuardCompressionRetentionGridBacktest() {
  if (guardCompressionRetentionGridBacktest.value) {
    guardCompressionRetentionGridBacktest.value = null;
    showMessage('已关闭压缩来源最低保留位网格回测', 'success');
    return;
  }
  await loadGuardCompressionRetentionGridBacktest();
}

/**
 * 读取最近预测快照
 */
async function loadLatestSnapshots(showTip = true) {
  snapshotLoading.value = true;
  if (showTip) {
    message.value = '';
  }
  try {
    const res = await getLatestPredictionSnapshots(10);
    if (res.code !== 200) {
      throw new Error(res.msg || '读取预测快照失败');
    }
    snapshots.value = res.data;
    if (activeSnapshot.value?.id) {
      void refreshActiveDiagnosticSnapshots(activeSnapshot.value.id);
    }
    if (showTip) {
      showMessage(`已读取${res.data.length}条预测快照`, 'success');
    }
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '读取预测快照失败', 'error');
  } finally {
    snapshotLoading.value = false;
  }
}

/**
 * 同步开奖上下文
 * @description 先尝试从后端增量同步，再回读本地开奖缓存，保证复盘条件判断尽量及时
 */
async function refreshDrawContext() {
  drawLoading.value = true;
  message.value = '';
  try {
    await lotteryStore.refreshDrawData();
    await lotteryStore.loadAllFromDB();
    await lotteryStore.loadWindowDataInfoList();
    showMessage('开奖信息同步完成', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '开奖信息同步失败', 'error');
  } finally {
    drawLoading.value = false;
  }
}

/**
 * 初始化开奖上下文
 * @description 页面进入时优先读本地缓存；如果本地为空，再尝试从后端拉取一次
 */
async function initializeDrawContext() {
  try {
    await lotteryStore.loadAllFromDB();
    await lotteryStore.loadWindowDataInfoList();
    if (!lotteryStore.latestDraw) {
      await lotteryStore.refreshDrawData();
      await lotteryStore.loadAllFromDB();
      await lotteryStore.loadWindowDataInfoList();
    }
  } catch {
    // 开奖上下文加载失败不阻断预测结果展示，用户可点击“同步开奖”重试。
  }
}

/**
 * 将历史快照回填到当前页面
 * @param snapshot 用户选择的历史快照
 */
function loadSnapshotToPage(snapshot: PredictionSnapshotEntity) {
  const snapshotFinalPredict = parseSnapshotJson<MultiWindowFinalPredictResult>(snapshot.finalPredictJson);
  const snapshotSinglePlan = parseSnapshotJson<SingleTicketPlanPredictResult>(snapshot.singleTicketPlanJson);
  const snapshotParameters = parseSnapshotJson<{ ninePlusOnePredict?: RedTopCombinationReversePredictResult }>(snapshot.parameterJson);

  if (!snapshotFinalPredict || !snapshotSinglePlan) {
    showMessage('快照JSON不完整，无法回填页面', 'error');
    return;
  }

  finalPredict.value = snapshotFinalPredict;
  ninePlusOnePredict.value = snapshotParameters?.ninePlusOnePredict ?? null;
  singlePlan.value = snapshotSinglePlan;
  activeSnapshot.value = snapshot;
  latestSnapshot.value = snapshot;
  reviewResult.value = parseSnapshotJson<PredictionSnapshotReviewResult>(snapshot.reviewSummaryJson);
  redMissDiagnosis.value = null;
  reviewTrend.value = null;
  redMissDistribution.value = null;
  guardBacktest.value = null;
  guardQuotaBacktest.value = null;
  guardQuotaGridBacktest.value = null;
  guardCompressionBacktest.value = null;
  guardCompressionGridBacktest.value = null;
  guardCompressionRetentionGridBacktest.value = null;
  entryFusionBacktest.value = null;
  entryRescoreFusionBacktest.value = null;
  entryFusionGridBacktest.value = null;
  combinationFusionBacktest.value = null;
  combinationSourceWeightGridBacktest.value = null;
  redFunnelDiagnosis.value = null;
  bayesDiagnosis.value = null;
  blueCandidateDiagnosis.value = null;
  viewMode.value = 'snapshot';
  void refreshActiveDiagnosticSnapshots(snapshot.id);
  showMessage(`已切换到历史快照：ID ${snapshot.id}，预测期号 ${snapshot.predictQiHao}`, 'success');
}

/**
 * 返回实时预测模式
 * @description 从历史快照回到实时预测时立即重新加载模型输出，避免页面残留快照期号
 */
async function returnRealtimePrediction() {
  activeSnapshot.value = null;
  reviewResult.value = null;
  redMissDiagnosis.value = null;
  reviewTrend.value = null;
  redMissDistribution.value = null;
  guardBacktest.value = null;
  guardQuotaBacktest.value = null;
  guardQuotaGridBacktest.value = null;
  guardCompressionBacktest.value = null;
  guardCompressionGridBacktest.value = null;
  guardCompressionRetentionGridBacktest.value = null;
  entryFusionBacktest.value = null;
  entryRescoreFusionBacktest.value = null;
  entryFusionGridBacktest.value = null;
  combinationFusionBacktest.value = null;
  combinationSourceWeightGridBacktest.value = null;
  redFunnelDiagnosis.value = null;
  bayesDiagnosis.value = null;
  blueCandidateDiagnosis.value = null;
  activeDiagnosticSnapshots.value = [];
  viewMode.value = 'realtime';
  await loadPredictionInternal(false);
}

/**
 * 执行快照表格主操作
 * @param snapshot 快照记录
 */
async function handleSnapshotAction(snapshot: PredictionSnapshotEntity) {
  if (snapshot.reviewStatus === 1 || hasActualDraw(snapshot.predictQiHao)) {
    await reviewSnapshot(snapshot);
    return;
  }
  loadSnapshotToPage(snapshot);
}

/**
 * 诊断当前历史快照的红球漏号原因
 */
async function diagnoseActiveSnapshot() {
  if (!activeSnapshot.value) {
    showMessage('请先选择一个历史快照，再执行漏号诊断', 'error');
    return;
  }

  diagnosing.value = true;
  message.value = '';
  try {
    const res = await diagnoseRedCandidateMiss(activeSnapshot.value.id);
    if (res.code !== 200) {
      throw new Error(res.msg || '红球漏号诊断失败');
    }
    redMissDiagnosis.value = res.data;
    showMessage('漏号诊断完成，详细结论见下方诊断区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '红球漏号诊断失败，可能该期尚未开奖', 'error');
  } finally {
    diagnosing.value = false;
  }
}

/**
 * 切换当前历史快照的红球漏号诊断区域
 */
async function toggleRedMissDiagnosis() {
  if (redMissDiagnosis.value) {
    redMissDiagnosis.value = null;
    showMessage('已关闭单期漏号诊断', 'success');
    return;
  }
  await diagnoseActiveSnapshot();
}

/**
 * 复盘当前历史快照
 * @description 用快照ID请求后端对照真实开奖，不触发预测模型重新计算
 */
async function reviewActiveSnapshot() {
  if (!activeSnapshot.value) {
    showMessage('请先选择一个历史快照，再执行复盘', 'error');
    return;
  }

  await reviewSnapshot(activeSnapshot.value, true);
}

/**
 * 复盘指定快照
 * @param snapshot 需要复盘的快照
 * @param force 是否强制重新请求后端复盘
 */
async function reviewSnapshot(snapshot: PredictionSnapshotEntity, force = false) {
  const cachedReview = parseSnapshotJson<PredictionSnapshotReviewResult>(snapshot.reviewSummaryJson);
  loadSnapshotToPage(snapshot);

  // 已复盘且不是强制复盘时，直接展示快照中保存的复盘结果。
  if (!force && cachedReview) {
    reviewResult.value = cachedReview;
    showMessage(`已将快照复盘标识合并到方案区：ID ${snapshot.id}`, 'success');
    return;
  }

  reviewing.value = true;
  reviewingSnapshotId.value = snapshot.id;
  message.value = '';
  try {
    const res = await reviewPredictionSnapshot(snapshot.id);
    if (res.code !== 200) {
      throw new Error(res.msg || '复盘预测快照失败');
    }

    reviewResult.value = res.data;
    snapshot.reviewStatus = 1;
    snapshot.reviewSummaryJson = JSON.stringify(res.data);
    activeSnapshot.value = snapshot;
    showMessage('快照复盘完成，命中标识已合并到主推荐、9+1和10注方案中', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '复盘预测快照失败，可能该期尚未开奖', 'error');
  } finally {
    reviewing.value = false;
    reviewingSnapshotId.value = null;
  }
}

/**
 * 保存当前预测快照
 * @description 保存的是当前页面已经展示出来的结果，不重新计算，保证开奖前证据链稳定
 */
async function saveSnapshot() {
  if (!finalPredict.value || !singlePlan.value) {
    showMessage('请先加载预测结果，再保存快照', 'error');
    return;
  }

  saving.value = true;
  message.value = '';
  try {
    const res = await savePredictionSnapshot({
      modelName: 'MULTI_WINDOW_FINAL_WITH_SINGLE_TICKET',
      modelVersion: SNAPSHOT_MODEL_VERSION,
      finalPredict: finalPredict.value,
      singleTicketPlan: singlePlan.value,
      parameters: {
        redCandidateLimit: finalPredict.value.redCandidateLimit,
        redCombinationTopLimit: finalPredict.value.redCombinationTopLimit,
        blueTopLimit: finalPredict.value.blueTopLimit,
        ticketTopLimit: finalPredict.value.ticketTopLimit,
        redWeight: finalPredict.value.redWeight,
        blueWeight: finalPredict.value.blueWeight,
        singleTicketLimit: singlePlan.value.ticketLimit,
        singleRedCandidateLimit: singlePlan.value.redCandidateLimit,
        singleRedSourceTopLimit: singlePlan.value.redSourceTopLimit,
        ninePlusOnePredict: ninePlusOnePredict.value
      }
    });

    if (res.code !== 200) {
      throw new Error(res.msg || '保存预测快照失败');
    }

    latestSnapshot.value = res.data;
    snapshots.value = [res.data, ...snapshots.value.filter(item => item.id !== res.data.id)].slice(0, 10);
    reviewResult.value = null;
    redMissDiagnosis.value = null;
    guardBacktest.value = null;
    guardQuotaBacktest.value = null;
    guardQuotaGridBacktest.value = null;
    guardCompressionBacktest.value = null;
    guardCompressionGridBacktest.value = null;
    guardCompressionRetentionGridBacktest.value = null;
    entryFusionBacktest.value = null;
    entryRescoreFusionBacktest.value = null;
    entryFusionGridBacktest.value = null;
    combinationFusionBacktest.value = null;
    combinationSourceWeightGridBacktest.value = null;
    redFunnelDiagnosis.value = null;
    bayesDiagnosis.value = null;
    blueCandidateDiagnosis.value = null;
    showMessage(`快照保存成功：ID ${res.data.id}，预测期号 ${res.data.predictQiHao}`, 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '保存预测快照失败', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  // 页面首次进入时先读取开奖上下文，再加载预测结果，方便直接判断预测期和复盘状态。
  await initializeDrawContext();
  await Promise.all([
    loadPrediction(),
    loadLatestSnapshots()
  ]);
});
</script>

<style scoped>
.summary-block {
  border: 1px solid var(--color-bg-secondary);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.45);
}

.emphasis-block {
  background: rgba(233, 69, 96, 0.12);
  border-color: rgba(233, 69, 96, 0.35);
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.summary-value {
  margin-top: 6px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.ticket-text {
  font-size: 16px;
}

.action-groups {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--color-bg-secondary);
  border-radius: 6px;
  background: rgba(22, 33, 62, 0.35);
}

.action-title {
  padding: 0 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  border-radius: 6px;
  padding: 6px 10px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 12px;
  line-height: 1;
  transition: background 0.2s, opacity 0.2s;
}

.action-button:hover {
  background: var(--color-accent);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.action-button-primary {
  background: var(--color-accent);
  color: #ffffff;
}

.action-button-active {
  border-color: rgba(34, 197, 94, 0.9);
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.action-button-active:hover {
  background: rgba(34, 197, 94, 0.28);
}

.guard-compare-panel {
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.18);
}

.guard-mode-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.28);
}

.guard-mode-tab {
  min-height: 26px;
  border-radius: 6px;
  padding: 5px 10px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.guard-mode-tab-active {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

.comparison-row-active {
  background: rgba(34, 197, 94, 0.08);
}

.diagnostic-result-section.diagnostic-section-collapsed > :not(.diagnostic-section-header) {
  display: none;
}

.diagnostic-section-header {
  align-items: flex-start;
}

.collapse-button {
  flex-shrink: 0;
  min-height: 28px;
  border-radius: 999px;
  padding: 5px 12px;
  background: rgba(96, 165, 250, 0.12);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  transition: background 0.2s, color 0.2s;
}

.collapse-button:hover {
  background: rgba(96, 165, 250, 0.24);
  color: #bfdbfe;
}

.action-link {
  text-decoration: none;
}

.copy-tip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  font-size: 12px;
  font-weight: 700;
}

.warning-box,
.info-box {
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
}

.warning-box {
  border: 1px solid rgba(250, 204, 21, 0.45);
  background: rgba(250, 204, 21, 0.1);
  color: #facc15;
}

.info-box {
  border: 1px solid rgba(96, 165, 250, 0.35);
  background: rgba(96, 165, 250, 0.08);
  color: var(--color-text-secondary);
}

.workflow-panel {
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.18);
}

.workflow-step,
.diagnostic-guide-item {
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 6px;
  padding: 10px;
  background: rgba(22, 33, 62, 0.42);
}

.workflow-step {
  min-height: 104px;
}

.workflow-step-title,
.diagnostic-guide-title {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 800;
}

.workflow-step-status {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
}

.workflow-step-desc,
.diagnostic-guide-desc {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.workflow-step-done {
  border-color: rgba(34, 197, 94, 0.35);
}

.workflow-step-done .workflow-step-status {
  color: #4ade80;
}

.workflow-step-pending {
  border-color: rgba(250, 204, 21, 0.38);
}

.workflow-step-pending .workflow-step-status {
  color: #facc15;
}

.workflow-step-waiting,
.workflow-step-unknown {
  border-color: rgba(148, 163, 184, 0.22);
}

.workflow-step-waiting .workflow-step-status,
.workflow-step-unknown .workflow-step-status {
  color: var(--color-text-secondary);
}

.diagnostic-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.diagnostic-guide-item {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: start;
}

.diagnostic-guide-order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.14);
  color: #f472b6;
  font-size: 12px;
  font-weight: 800;
}

.metric-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}

.metric-guide-item {
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.42);
}

.metric-guide-title {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 800;
}

.metric-guide-formula {
  margin-top: 6px;
  color: #bfdbfe;
  font-size: 12px;
  font-weight: 700;
}

.metric-guide-desc,
.metric-guide-watch {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.metric-guide-watch {
  border-top: 1px solid rgba(96, 165, 250, 0.14);
  padding-top: 6px;
  color: #facc15;
}

.strategy-admission-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
}

.strategy-admission-badge-pass {
  background: rgba(34, 197, 94, 0.14);
  color: #4ade80;
}

.strategy-admission-badge-observe {
  background: rgba(250, 204, 21, 0.14);
  color: #facc15;
}

.strategy-admission-badge-fail {
  background: rgba(248, 113, 113, 0.14);
  color: #f87171;
}

.strategy-admission-badge-unknown {
  background: rgba(148, 163, 184, 0.14);
  color: var(--color-text-secondary);
}

.strategy-admission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.strategy-admission-item {
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.42);
}

.strategy-admission-pass {
  border-color: rgba(34, 197, 94, 0.32);
}

.strategy-admission-observe {
  border-color: rgba(250, 204, 21, 0.32);
}

.strategy-admission-fail {
  border-color: rgba(248, 113, 113, 0.32);
}

.strategy-admission-title {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 800;
}

.strategy-admission-status {
  margin-top: 6px;
  color: #facc15;
  font-size: 12px;
  font-weight: 800;
}

.strategy-admission-pass .strategy-admission-status {
  color: #4ade80;
}

.strategy-admission-fail .strategy-admission-status {
  color: #f87171;
}

.strategy-admission-unknown .strategy-admission-status {
  color: var(--color-text-secondary);
}

.strategy-admission-desc {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.65;
}

.funnel-flow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.funnel-flow-card {
  position: relative;
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 6px;
  padding: 12px;
  background: rgba(22, 33, 62, 0.42);
}

.funnel-flow-card::after {
  content: '→';
  position: absolute;
  top: 50%;
  right: -10px;
  transform: translateY(-50%);
  color: rgba(147, 197, 253, 0.8);
  font-weight: 800;
}

.funnel-flow-card:last-child::after {
  content: '';
}

.funnel-flow-title {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 800;
}

.funnel-flow-value {
  margin-top: 8px;
  color: #bfdbfe;
  font-size: 13px;
  font-weight: 800;
}

.funnel-flow-meta {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.diagnosis-collapse {
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.diagnosis-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  list-style: none;
}

.diagnosis-summary::-webkit-details-marker {
  display: none;
}

.diagnosis-toggle-text {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 4px 10px;
  background: rgba(96, 165, 250, 0.12);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 700;
}

.diagnosis-collapse[open] .diagnosis-toggle-text {
  background: rgba(148, 163, 184, 0.14);
  color: var(--color-text-secondary);
}

.diagnosis-collapse[open] .diagnosis-toggle-text::before {
  content: '收起';
}

.diagnosis-collapse[open] .diagnosis-toggle-text {
  font-size: 0;
}

.diagnosis-collapse[open] .diagnosis-toggle-text::before {
  font-size: 12px;
}

.sync-result-item {
  border-radius: 6px;
  padding: 8px;
  background: rgba(22, 33, 62, 0.45);
  color: var(--color-text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
}

.status-done {
  border: 1px solid rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
}

.status-text-muted {
  color: #a0aec0;
  font-size: 12px;
  font-weight: 600;
}

:deep(.ticket-number-text) {
  color: var(--color-text-primary);
}

:deep(.ticket-number),
:deep(.ticket-separator),
:deep(.ticket-plus) {
  display: inline;
}

:deep(.ticket-red-number),
:deep(.ticket-blue-number) {
  font-weight: 800;
}

:deep(.ticket-hit-red) {
  color: #ff4d6d;
}

:deep(.ticket-hit-blue) {
  color: #60a5fa;
}

:deep(.ticket-separator),
:deep(.ticket-plus) {
  color: var(--color-text-secondary);
}

.result-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th,
.result-table td {
  border-bottom: 1px solid var(--color-bg-secondary);
  padding: 8px;
  text-align: left;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.result-table th {
  color: var(--color-text-primary);
  background: rgba(22, 33, 62, 0.65);
}

.sortable-th {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-primary);
  font-weight: 800;
}

.sortable-th:hover {
  color: #93c5fd;
}

.result-table .table-note {
  max-width: 420px;
  white-space: normal;
  line-height: 1.6;
}

.diagnostic-subtotal-row td {
  background: rgba(96, 165, 250, 0.08);
  color: #bfdbfe;
  font-weight: 700;
}

.empty-text {
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
