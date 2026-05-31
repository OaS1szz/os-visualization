<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  sstf, scan, generateRandomRequests, getPresetRequests,
} from '../algorithms/diskSchedule.js'

const algorithm = ref('sstf')
const direction = ref('up')
const startPos = ref(53)
const requestsStr = ref('98,183,37,122,14,124,65,67')

const result = ref(null)
const chartRef = ref(null)
let chartInstance = null

function parseRequests() {
  return requestsStr.value
    .split(/[,，\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
}

function run() {
  const reqs = parseRequests()
  if (reqs.length === 0) {
    ElMessage.warning('请输入有效的磁道请求序列')
    return
  }

  let res
  if (algorithm.value === 'sstf') {
    res = sstf(reqs, startPos.value)
  } else {
    res = scan(reqs, startPos.value, direction.value)
  }
  result.value = res

  // 渲染图表
  setTimeout(() => renderChart(res), 100)
}

function generateRandom() {
  const seq = generateRandomRequests(8, 200)
  requestsStr.value = seq.join(',')
}

function loadPreset() {
  requestsStr.value = getPresetRequests().join(',')
  startPos.value = 53
}

function renderChart(res) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 构建路径：包含所有位置点
  const steps = res.path.map((p) => [p.step, p.pos])
  const markers = res.path
    .filter((p) => p.target !== null)
    .map((p) => [p.step, p.pos])

  chartInstance.setOption({
    title: { text: '磁头移动轨迹', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        const step = res.path[p.dataIndex]
        if (!step) return ''
        if (step.target !== null) {
          return `步骤 ${step.step}<br/>磁道: ${p.value[1]}<br/>响应请求: ${step.target}<br/>移动距离: ${Math.abs(step.pos - (res.path[p.dataIndex - 1]?.pos || step.pos))}`
        }
        return `步骤 ${step.step}<br/>磁道: ${p.value[1]} (起始)`
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
      max: 200,
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
          label: { formatter: '初始位置' },
        },
      },
      {
        type: 'scatter',
        data: markers,
        symbolSize: 12,
        itemStyle: { color: '#f56c6c' },
        label: {
          show: false,
        },
      },
    ],
  }, true)
}

function onDirectionChange() {
  if (result.value) run()
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>💾 磁盘移臂调度模拟</h1>
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
            <el-option label="向外 (↑)" value="up" />
            <el-option label="向内 (↓)" value="down" />
          </el-select>
        </span>
      </div>

      <div class="control-row">
        <span>磁道请求序列：</span>
        <el-input v-model="requestsStr" style="width: 420px;" placeholder="用逗号分隔，如：98,183,37,122,14,124,65,67" />
      </div>

      <div class="control-row">
        <span>初始磁头位置：</span>
        <el-input-number v-model="startPos" :min="0" :max="200" size="small" style="width: 100px;" />
      </div>

      <div class="control-row">
        <el-button type="primary" @click="run">开始调度</el-button>
        <el-button @click="loadPreset">加载教材示例</el-button>
        <el-button @click="generateRandom">随机生成</el-button>
      </div>
    </div>

    <!-- 结果 -->
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
        {{ result.order.join(' → ') }}
      </div>

      <h3>详细步骤</h3>
      <el-table :data="result.path.filter(p => p.target !== null)" size="small" border stripe style="max-width: 500px;">
        <el-table-column label="步骤" prop="step" width="60" />
        <el-table-column label="目标磁道" prop="target" width="100" />
        <el-table-column label="磁头位置">
          <template #default="{ row, $index }">
            {{ result.path[$index]?.pos || row.pos }}
          </template>
        </el-table-column>
        <el-table-column label="移动距离">
          <template #default="{ row, $index }">
            {{ $index > 0
              ? Math.abs(row.pos - (result.path[$index - 1]?.pos ?? row.pos))
              : Math.abs(row.pos - result.path[0].pos) }}
          </template>
        </el-table-column>
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
