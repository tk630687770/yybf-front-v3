<template>
  <!-- 模型预测/诊断结果台页面容器 -->
  <div class="p-4 space-y-4">
    <!-- 页面头部：说明当前页面职责，并按业务阶段组织操作入口 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-text-primary">模型预测/诊断结果台</h1>
          <p class="mt-1 text-xs text-text-secondary">
            先看当前预测，再保存证据快照；开奖后用快照复盘和漏号诊断判断模型是否真的进步。
          </p>
        </div>
        <div class="action-groups">
          <div class="action-group">
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
          <div class="action-group">
            <span class="action-title">同步</span>
            <button
              :disabled="drawLoading"
              class="action-button"
              @click="refreshDrawContext"
            >
              {{ drawLoading ? '同步中...' : '同步开奖/窗口' }}
            </button>
            <button
              :disabled="axisSyncLoading"
              class="action-button"
              @click="syncAxisChains"
            >
              {{ axisSyncLoading ? '同步中...' : '同步坐标结构链' }}
            </button>
          </div>
          <div class="action-group">
            <span class="action-title">快照</span>
            <button
              :disabled="loading || saving || !finalPredict || !singlePlan"
              class="action-button"
              @click="saveSnapshot"
            >
              {{ saving ? '保存中...' : '保存快照' }}
            </button>
            <button
              :disabled="snapshotLoading"
              class="action-button"
              @click="loadLatestSnapshots()"
            >
              {{ snapshotLoading ? '读取中...' : '读取快照' }}
            </button>
          </div>
          <div class="action-group">
            <span class="action-title">复盘诊断</span>
            <button
              :disabled="reviewing || !activeSnapshot"
              class="action-button"
              @click="reviewActiveSnapshot"
            >
              {{ reviewing ? '复盘中...' : '重新复盘' }}
            </button>
            <button
              :disabled="diagnosing || !activeSnapshot"
              class="action-button"
              @click="diagnoseActiveSnapshot"
            >
              {{ diagnosing ? '诊断中...' : '单期漏号诊断' }}
            </button>
            <button
              :disabled="trendLoading"
              class="action-button"
              @click="loadReviewTrend"
            >
              {{ trendLoading ? '统计中...' : '多期复盘趋势' }}
            </button>
            <button
              :disabled="distributionLoading"
              class="action-button"
              @click="loadMissDistribution"
            >
              {{ distributionLoading ? '统计中...' : '多期漏号统计' }}
            </button>
            <button
              :disabled="guardBacktestLoading"
              class="action-button"
              @click="loadGuardBacktest"
            >
              {{ guardBacktestLoading ? '回测中...' : '保底扩展回测' }}
            </button>
            <button
              :disabled="bayesLoading"
              class="action-button"
              @click="loadBayesDiagnosis"
            >
              {{ bayesLoading ? '诊断中...' : '贝叶斯冷热' }}
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

    <!-- 开奖上下文信息：用于判断预测是否已经落后于最新开奖 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">开奖信息</h2>
          <p class="mt-1 text-xs text-text-secondary">
            如果最新开奖期号和当前预测期号相同，通常表示窗口、坐标或结构族数据还没同步到下一期。
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            :disabled="drawLoading"
            class="action-button"
            @click="refreshDrawContext"
          >
            {{ drawLoading ? '同步中...' : '同步开奖/窗口' }}
          </button>
          <button
            :disabled="axisSyncLoading"
            class="action-button"
            @click="syncAxisChains"
          >
            {{ axisSyncLoading ? '同步中...' : '同步坐标结构链' }}
          </button>
          <RouterLink to="/window-console" class="action-button action-link">
            去基础窗口操作台
          </RouterLink>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">最新开奖</div>
          <div class="summary-value">
            {{ latestDraw?.qiHao ? `第${latestDraw.qiHao}期` : '--' }}
            <span class="text-text-secondary">{{ latestDraw?.dateAndWeek || '' }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">开奖号</div>
          <div class="summary-value">
            {{ latestDraw ? `${drawRedText(latestDraw)} + ${latestDraw.blue}` : '--' }}
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">当前预测期号</div>
          <div class="summary-value text-accent">
            {{ currentPredictQiHao || '--' }}
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">复盘状态</div>
          <div
            :class="[
              'summary-value',
              selectedSnapshotCanReview ? 'text-green-400' : 'text-yellow-400'
            ]"
          >
            {{ reviewAvailabilityText }}
          </div>
        </div>
      </div>

      <div v-if="predictionNeedsWindowSync" class="mt-3 warning-box">
        当前预测期号已经追平最新开奖期号。请先同步开奖/窗口，再同步坐标结构链；
        完成后点击“刷新预测”，再生成下一期快照。
      </div>
      <div v-if="axisSyncResults.length > 0" class="mt-3 info-box">
        <div class="font-bold text-text-primary">最近一次坐标结构链同步结果</div>
        <div class="mt-1">红10专用增量链已执行；下方为通用多窗口重建结果。</div>
        <div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div
            v-for="item in axisSyncResults"
            :key="item.windowCode"
            class="sync-result-item"
          >
            <div class="font-bold text-text-primary">{{ item.windowName }}</div>
            <div>坐标{{ item.axisCount }} / 模板{{ item.templateCount }} / 结构族{{ item.groupCount }}</div>
            <div>模板迁移{{ item.templateTargetCount }} / 结构族迁移{{ item.groupTargetCount }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 最近预测快照列表 -->
    <section class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">最近预测快照</h2>
        <span class="text-xs text-text-secondary">点击快照可切换到历史快照模式</span>
      </div>
      <div v-if="snapshots.length > 0" class="mt-3 overflow-auto">
        <table class="result-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>预测期号</th>
              <th>保存时间</th>
              <th>推荐票面</th>
              <th>模型版本</th>
              <th>复盘</th>
              <th>可复盘</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshots" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.predictQiHao }}</td>
              <td>{{ item.createTime }}</td>
              <td class="font-bold text-text-primary">{{ item.finalRecommendedTicketText || '--' }}</td>
              <td>{{ item.modelVersion }}</td>
              <td>
                <span :class="snapshotReviewBadgeClass(item)">
                  {{ snapshotReviewText(item) }}
                </span>
              </td>
              <td>
                <span :class="snapshotDrawBadgeClass(item)">
                  {{ snapshotDrawText(item) }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button
                    class="px-2 py-1 rounded bg-bg-secondary text-text-primary hover:bg-accent"
                    :disabled="reviewingSnapshotId === item.id"
                    @click="handleSnapshotAction(item)"
                  >
                    {{ reviewingSnapshotId === item.id ? '处理中' : snapshotActionText(item) }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-text">暂无已读取的快照，点击“读取快照”查看最近记录。</div>
    </section>

    <!-- 红球贝叶斯冷热诊断：单号动态修正观察，不直接改变正式预测 -->
    <section v-if="bayesDiagnosis" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">红球贝叶斯冷热诊断</h2>
          <p class="mt-1 text-xs text-text-secondary">
            这是单号动态观察层：长期先验 × 近期窗口证据，并用多重比较校正过滤偶然异常。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          预测期号：{{ bayesDiagnosis.predictQiHao }} / 窗口：{{ bayesDiagnosis.windowSizes.join(',') }}
        </span>
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
    <section v-if="reviewTrend" class="bg-bg-card rounded-lg p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-text-primary">多期复盘趋势</h2>
          <p class="mt-1 text-xs text-text-secondary">
            按预测期号去重，每期只取最新一个已复盘快照，避免同一期多次保存放大样本。
          </p>
        </div>
        <span class="text-xs text-text-secondary">
          统计期数：{{ reviewTrend.periodCount }} / 原始已复盘快照：{{ reviewTrend.reviewedSnapshotCount }}
        </span>
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
              <td class="font-bold text-text-primary">{{ item.actualTicketText }}</td>
              <td class="font-bold text-text-primary">{{ item.recommendedTicketText }}</td>
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

    <!-- 红球漏号分布统计 -->
    <section v-if="redMissDistribution" class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球漏号分布统计</h2>
        <span class="text-xs text-text-secondary">已复盘快照：{{ redMissDistribution.snapshotCount }}</span>
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

    <!-- 红球候选池保底扩展回测 -->
    <section v-if="guardBacktest" class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球候选池保底扩展回测</h2>
        <span class="text-xs text-text-secondary">
          统计期数：{{ guardBacktest.periodCount }} / 扩展池上限：{{ guardBacktest.maxExpandedSize }}
        </span>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="summary-block">
          <div class="summary-label">原候选池覆盖率</div>
          <div class="summary-value">
            {{ formatPercent(guardBacktest.baseCoverageRate) }}
            <span class="text-text-secondary">{{ guardBacktest.baseHitCount }}/{{ guardBacktest.actualRedCount }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">扩展后覆盖率</div>
          <div class="summary-value text-accent">
            {{ formatPercent(guardBacktest.expandedCoverageRate) }}
            <span class="text-text-secondary">{{ guardBacktest.expandedHitCount }}/{{ guardBacktest.actualRedCount }}</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">覆盖提升</div>
          <div class="summary-value text-yellow-400">
            {{ formatPercent(guardBacktest.coverageLift) }}
            <span class="text-text-secondary">救回{{ guardBacktest.rescuedHitCount }}个</span>
          </div>
        </div>
        <div class="summary-block">
          <div class="summary-label">平均新增</div>
          <div class="summary-value">
            {{ formatScore(guardBacktest.averageAddedCount) }} 个/期
            <span class="text-text-secondary">{{ guardBacktest.improvedPeriodCount }}期有效</span>
          </div>
        </div>
      </div>

      <p class="mt-3 text-xs text-text-secondary leading-6">{{ guardBacktest.conclusion }}</p>

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
                <tr v-for="item in guardBacktest.sourceStats" :key="item.sourceType">
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
            <p v-for="item in guardBacktest.suggestions" :key="item">- {{ item }}</p>
          </div>
        </div>
      </div>

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
            <tr v-for="item in guardBacktest.periods" :key="item.snapshotId">
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

    <!-- 红球候选池漏号诊断 -->
    <section v-if="redMissDiagnosis" class="bg-bg-card rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-text-primary">红球候选池漏号诊断</h2>
        <span class="text-xs text-text-secondary">快照ID：{{ redMissDiagnosis.snapshotId }}</span>
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
    <section class="bg-bg-card rounded-lg p-4">
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

    <!-- 9+1复式方案：独立展示真正的9红+1蓝复式投注口径 -->
    <details class="diagnosis-collapse bg-bg-card rounded-lg p-4" open>
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
    <details class="diagnosis-collapse bg-bg-card rounded-lg p-4" open>
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
    <section v-if="finalPredict" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
import { computed, defineComponent, h, onMounted, ref, type PropType } from 'vue';
import { useLotteryStore } from '@/stores/lottery';
import type { DrawRecord } from '@/types';
import {
  diagnoseRedCandidateMiss,
  getRedBayesColdHotDiagnosis,
  getRedCandidateGuardBacktest,
  getPredictionReviewTrend,
  getRedCandidateMissDistribution,
  getLatestPredictionSnapshots,
  getMultiWindowFinalPredict,
  getNinePlusOnePredict,
  getPredictionSnapshotsByQiHao,
  getSingleTicketPlanPredict,
  reviewPredictionSnapshot,
  savePredictionSnapshot,
  syncDefaultAxisChains,
  syncRed10AxisChain,
  type MultiWindowFinalPredictResult,
  type PredictionSnapshotEntity,
  type PredictionSnapshotReviewResult,
  type PredictionSnapshotTicketReview,
  type PredictionSnapshotTrendResult,
  type RedCandidateMissDiagnosisResult,
  type RedCandidateMissDistributionResult,
  type RedCandidateGuardBacktestResult,
  type RedCandidateMissWindowState,
  type RedBayesDiagnosisResult,
  type RedTopCombinationReversePredictResult,
  type SingleTicketPlanPredictResult,
  type WindowAxisChainResult
} from '@/api/modules/modelPrediction';

const lotteryStore = useLotteryStore();
const loading = ref(false);
const saving = ref(false);
const snapshotLoading = ref(false);
const reviewing = ref(false);
const diagnosing = ref(false);
const trendLoading = ref(false);
const distributionLoading = ref(false);
const guardBacktestLoading = ref(false);
const bayesLoading = ref(false);
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
const guardBacktest = ref<RedCandidateGuardBacktestResult | null>(null);
const bayesDiagnosis = ref<RedBayesDiagnosisResult | null>(null);
const axisSyncResults = ref<WindowAxisChainResult[]>([]);
const snapshots = ref<PredictionSnapshotEntity[]>([]);
const viewMode = ref<'realtime' | 'snapshot'>('realtime');

/**
 * 当前前端快照模型版本。
 * v2开始红球6数组合形态分加入AC值，因此同预测期号的新快照需要和v1区分。
 */
const SNAPSHOT_MODEL_VERSION = 'front-v3-snapshot-v2-ac-shape';

/**
 * 单色号码列表渲染组件
 * @description 用于红球观察池、胆候选、蓝球候选榜等非完整票面的号码标色。
 */
const HitNumberList = defineComponent({
  name: 'HitNumberList',
  props: {
    numbers: {
      type: Array as PropType<string[]>,
      required: true
    },
    kind: {
      type: String as PropType<'red' | 'blue'>,
      required: true
    },
    actualRedNumbers: {
      type: Array as PropType<string[] | undefined>,
      default: undefined
    },
    actualBlueNumber: {
      type: String as PropType<string | undefined>,
      default: undefined
    }
  },
  setup(props) {
    return () => {
      if (!props.numbers.length) {
        return h('span', '--');
      }

      const actualRedSet = new Set(props.actualRedNumbers ?? []);
      const nodes = props.numbers.flatMap((number, index) => {
        const hitClass = props.kind === 'red'
          ? (actualRedSet.has(number) ? 'ticket-hit-red' : '')
          : (props.actualBlueNumber && number === props.actualBlueNumber ? 'ticket-hit-blue' : '');

        return [
          h('span', {
            class: [
              'ticket-number',
              props.kind === 'red' ? 'ticket-red-number' : 'ticket-blue-number',
              hitClass
            ]
          }, number),
          index < props.numbers.length - 1 ? h('span', { class: 'ticket-separator' }, ',') : null
        ];
      }).filter(Boolean);

      return h('span', { class: 'ticket-number-text' }, nodes);
    };
  }
});

/**
 * 票面号码渲染组件
 * @description 开奖后直接在原票面上标色：命中红球显示红色，命中蓝球显示蓝色。
 */
const TicketNumberText = defineComponent({
  name: 'TicketNumberText',
  props: {
    redNumbers: {
      type: Array as PropType<string[]>,
      required: true
    },
    blueNumber: {
      type: String,
      required: true
    },
    actualRedNumbers: {
      type: Array as PropType<string[] | undefined>,
      default: undefined
    },
    actualBlueNumber: {
      type: String as PropType<string | undefined>,
      default: undefined
    }
  },
  setup(props) {
    return () => {
      const actualRedSet = new Set(props.actualRedNumbers ?? []);
      const redNodes = props.redNumbers.flatMap((number, index) => [
        h('span', {
          class: [
            'ticket-number',
            'ticket-red-number',
            actualRedSet.has(number) ? 'ticket-hit-red' : ''
          ]
        }, number),
        index < props.redNumbers.length - 1 ? h('span', { class: 'ticket-separator' }, ',') : null
      ]).filter(Boolean);
      const blueHit = Boolean(props.actualBlueNumber && props.blueNumber === props.actualBlueNumber);

      return h('span', { class: 'ticket-number-text' }, [
        ...redNodes,
        h('span', { class: 'ticket-plus' }, ' + '),
        h('span', {
          class: [
            'ticket-number',
            'ticket-blue-number',
            blueHit ? 'ticket-hit-blue' : ''
          ]
        }, props.blueNumber || '--')
      ]);
    };
  }
});

/**
 * 最新开奖数据
 */
const latestDraw = computed(() => lotteryStore.latestDraw);

/**
 * 当前页面关注的预测期号
 */
const currentPredictQiHao = computed(() => activeSnapshot.value?.predictQiHao
  ?? finalPredict.value?.predictQiHao
  ?? ninePlusOnePredict.value?.predictQiHao
  ?? singlePlan.value?.predictQiHao
  ?? '');

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
 * 当前预测是否可能还停留在已开奖期号
 */
const predictionNeedsWindowSync = computed(() => {
  return Boolean(
    latestDraw.value?.qiHao
    && currentPredictQiHao.value
    && latestDraw.value.qiHao === currentPredictQiHao.value
  );
});

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
    bayesDiagnosis.value = null;
    viewMode.value = 'realtime';

    if (useExistingSnapshot) {
      const matchedSnapshot = await findLatestSnapshotByPredictQiHao(finalRes.data.predictQiHao);
      if (matchedSnapshot) {
        loadSnapshotToPage(matchedSnapshot);
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
 * 加载红球候选池保底扩展回测
 */
async function loadGuardBacktest() {
  guardBacktestLoading.value = true;
  message.value = '';
  try {
    const res = await getRedCandidateGuardBacktest(20);
    if (res.code !== 200) {
      throw new Error(res.msg || '保底扩展回测失败');
    }
    guardBacktest.value = res.data;
    showMessage('保底扩展回测完成，详细结论见下方回测区域', 'success');
  } catch (err: unknown) {
    showMessage(err instanceof Error ? err.message : '保底扩展回测失败', 'error');
  } finally {
    guardBacktestLoading.value = false;
  }
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
    if (!lotteryStore.latestDraw) {
      await lotteryStore.refreshDrawData();
      await lotteryStore.loadAllFromDB();
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
  bayesDiagnosis.value = null;
  viewMode.value = 'snapshot';
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
  bayesDiagnosis.value = null;
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

.result-table .table-note {
  max-width: 420px;
  white-space: normal;
  line-height: 1.6;
}

.empty-text {
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
