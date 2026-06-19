<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  sstf, scan, generateRandomRequests, getPresetRequests,
} from '../algorithms/diskSchedule.js'

const algorithm = ref('sstf')
const direction = ref('up')
const startPos = ref(53)
const maxTrack = ref(199)
const requestsStr = ref('98,183,37,122,14,124,65,67')

const result = ref(null)
const chartRef = ref(null)
let chartInstance = null

function parseRequests() {
  return requestsStr.value
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
}

const tableRows = computed(() => {
  if (!result.value) return []

  return result.value.path
    .map((step, index, path) => {
      if (index === 0) return null
      return {
        step: step.step,
        target: step.target,
        pos: step.pos,
        boundary: step.boundary,
        distance: Math.abs(step.pos - path[index - 1].pos),
      }
    })
    .filter(Boolean)
})

function run() {
  const reqs = parseRequests()
  if (reqs.length === 0) {
    ElMessage.warning('请输入有效的磁道请求序列')
    return
  }

  const outOfRange = reqs.find((track) => track < 0 || track > maxTrack.value)
  if (startPos.value < 0 || startPos.value > maxTrack.value || outOfRange !== undefined) {
    ElMessage.warning(`磁道号必须在 0 到 ${maxTrack.value} 之间`)
    return
  }

  if (algorithm.value === 'sstf') {
    result.value = sstf(reqs, startPos.value)
  } else {
    result.value = scan(reqs, startPos.value, direction.value, maxTrack.value)
  }

  requestAnimationFrame(() => renderChart(result.value))
}

function generateRandom() {
  requestsStr.value = generateRandomRequests(8, maxTrack.value + 1).join(',')
}

function loadPreset() {
  requestsStr.value = getPresetRequests().join(',')
  startPos.value = 53
  maxTrack.value = 199
}

function renderChart(res) {
  if (!chartRef.value || !res) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const steps = res.path.map((p) => [p.step, p.pos])
  const requestMarkers = res.path
    .filter((p) => p.target !== null)
    .map((p) => [p.step, p.pos])
  const boundaryMarkers = res.path
    .filter((p) => p.boundary)
    .map((p) => [p.step, p.pos])

  chartInstance.setOption({
    title: { text: '磁头移动轨迹', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const point = res.path[params[0]?.dataIndex]
        if (!point) return ''
        const prev = res.path[params[0].dataIndex - 1]
        const distance = prev ? Math.abs(point.pos - prev.pos) : 0

        if (point.boundary) {
          return `步骤 ${point.step}<br/>磁道: ${point.pos}<br/>到达边界<br/>移动距离: ${distance}`
        }

        if (point.target !== null) {
          return `步骤 ${point.step}<br/>磁道: ${point.pos}<br/>响应请求: ${point.target}<br/>移动距离: ${distance}`
        }

        return `步骤 ${point.step}<br/>磁道: ${point.pos} (起始)`
      },
    },
    grid: { left: 60, right: 30, top: 50, bottom: 40 },
    xAxis: {
      type: 'value',
      name: '步骤',
      minInterval: 1,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '磁道号',
      min: 0,
      max: maxTrack.value,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: steps,
        smooth: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#409eff', width: 2 },
        itemStyle: { color: '#409eff' },
        step: 'end',
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ yAxis: startPos.value, lineStyle: { color: '#e6a23c', type: 'dashed', width: 1 } }],
          label: { formatter: '起始位置' },
        },
      },
      {
        type: 'scatter',
        data: requestMarkers,
        symbolSize: 12,
        itemStyle: { color: '#f56c6c' },
      },
      {
        type: 'scatter',
        data: boundaryMarkers,
        symbol: 'diamond',
        symbolSize: 12,
        itemStyle: { color: '#67c23a' },
      },
    ],
  }, true)
}

function onDirectionChange() {
  if (result.value) run()
}

onBeforeUnmount(() => {
  chartInstance?.dispose()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">返回首页</router-link>
      <h1>磁盘移臂调度模拟</h1>
    </div>

    <div class="control-panel">
      <div class="control-row">
        <span>算法：</span>
        <el-radio-group v-model="algorithm" @change="onDirectionChange">
          <el-radio-button value="sstf">SSTF 最短寻道优先</el-radio-button>
          <el-radio-button value="scan">SCAN 电梯算法</el-radio-button>
        </el-radio-group>
        <span v-if="algorithm === 'scan'" style="margin-left: 8px;">
          方向：
          <el-select v-model="direction" style="width: 120px;" @change="onDirectionChange">
            <el-option label="向外" value="up" />
            <el-option label="向内" value="down" />
          </el-select>
        </span>
      </div>

      <div class="control-row">
        <span>磁道请求序列：</span>
        <el-input v-model="requestsStr" style="width: 420px;" placeholder="用逗号分隔，如 98,183,37,122,14,124,65,67" />
      </div>

      <div class="control-row">
        <span>初始磁头位置：</span>
        <el-input-number v-model="startPos" :min="0" :max="maxTrack" size="small" style="width: 100px;" />
        <span>最大磁道号：</span>
        <el-input-number v-model="maxTrack" :min="1" :max="999" size="small" style="width: 100px;" />
      </div>

      <div class="control-row">
        <el-button type="primary" @click="run">开始调度</el-button>
        <el-button @click="loadPreset">加载教材示例</el-button>
        <el-button @click="generateRandom">随机生成</el-button>
      </div>
    </div>

    <div v-if="result" class="result-panel">
      <div ref="chartRef" class="chart-container" style="height: 350px;"></div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">总寻道长度：</span>
          <span class="stat-value">{{ result.totalDistance }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均寻道长度：</span>
          <span class="stat-value">{{ (result.totalDistance / result.order.length).toFixed(2) }}</span>
        </div>
      </div>

      <h3>响应顺序</h3>
      <div class="response-order">
        {{ result.order.join(' -> ') }}
      </div>

      <h3>详细步骤</h3>
      <el-table :data="tableRows" size="small" border stripe style="max-width: 560px;">
        <el-table-column label="步骤" prop="step" width="60" />
        <el-table-column label="目标磁道" width="120">
          <template #default="{ row }">
            {{ row.boundary ? '边界' : row.target }}
          </template>
        </el-table-column>
        <el-table-column label="磁头位置" prop="pos" width="120" />
        <el-table-column label="移动距离" prop="distance" />
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.response-order {
  font-family: monospace;
  font-size: 16px;
  color: var(--primary);
  padding: 8px 0;
  margin-bottom: 12px;
}
</style>
