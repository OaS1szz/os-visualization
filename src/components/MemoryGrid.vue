<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  states: {
    type: Array,
    default: () => [],
  },
  frameCount: {
    type: Number,
    default: 3,
  },
  currentStep: {
    type: Number,
    default: -1, // -1 表示显示全部
  },
  height: {
    type: String,
    default: '350px',
  },
})

const chartRef = ref(null)
let chartInstance = null

function buildOption() {
  // 构建热力图数据
  // X 轴：步骤 (0, 1, 2, ...)
  // Y 轴：内存块 (0, 1, ...)
  const heatData = []
  const markAreas = []

  // 显示到 currentStep 或全部
  const endStep = props.currentStep >= 0
    ? Math.min(props.currentStep + 1, props.states.length)
    : props.states.length

  const visibleStates = props.states.slice(0, endStep)

  visibleStates.forEach((s) => {
    for (let i = 0; i < props.frameCount; i++) {
      const page = s.memory[i]
      if (page !== undefined) {
        heatData.push([s.step, i, page !== null ? page : -1])
      }
    }
  })

  // 缺页标注
  visibleStates.forEach((s) => {
    if (s.fault) {
      markAreas.push({
        name: '缺页',
        itemStyle: { color: 'rgba(245, 108, 108, 0.15)', borderColor: '#f56c6c', borderWidth: 1.5 },
        xAxis: s.step - 0.5,
      })
    }
  })

  // 用分段标注模拟竖线
  const faultMarks = visibleStates
    .filter((s) => s.fault)
    .map((s) => ({
      xAxis: s.step,
      yAxis: 0,
      symbol: 'triangle',
      symbolSize: 10,
      itemStyle: { color: '#f56c6c' },
      label: { show: false },
    }))

  const maxPage = Math.max(9, ...heatData.map((d) => d[2]))
  const pieces = []
  for (let p = 0; p <= maxPage; p++) {
    pieces.push({ min: p, max: p, label: String(p) })
  }
  pieces.push({ min: -1, max: -1, label: '-', color: '#f0f2f5' })

  return {
    tooltip: {
      formatter: (p) => {
        const step = p.data[0]
        const frame = p.data[1]
        const page = p.data[2]
        if (page === -1) return `步骤 ${step}<br/>内存块 ${frame}: <空>`
        const faultInfo = visibleStates[step]?.fault ? ' (缺页!)' : ''
        return `步骤 ${step}<br/>内存块 ${frame}: 页面 ${page}${faultInfo}`
      },
    },
    grid: {
      left: 60,
      right: 30,
      top: 10,
      bottom: 40,
    },
    xAxis: {
      type: 'category',
      name: '步骤',
      data: visibleStates.map((s) => s.step),
      axisLabel: { fontSize: 10, rotate: 45 },
      nameLocation: 'middle',
      nameGap: 25,
    },
    yAxis: {
      type: 'category',
      name: '内存块',
      data: Array.from({ length: props.frameCount }, (_, i) => `块${i}`),
      inverse: true,
    },
    visualMap: {
      min: -1,
      max: maxPage,
      type: 'piecewise',
      pieces,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 16,
      itemHeight: 16,
      textStyle: { fontSize: 10 },
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        label: {
          show: true,
          fontSize: 11,
          formatter: (p) => (p.data[2] === -1 ? '-' : p.data[2]),
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        markArea: markAreas.length > 0 ? { data: markAreas } : undefined,
      },
      {
        type: 'scatter',
        data: faultMarks,
        symbol: 'pin',
        symbolSize: 16,
        itemStyle: { color: '#f56c6c' },
      },
    ],
  }
}

function render() {
  if (!chartInstance) return
  if (props.states.length === 0) {
    chartInstance.clear()
    return
  }
  chartInstance.setOption(buildOption(), true)
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    render()
  }
})

onUnmounted(() => {
  chartInstance?.dispose()
})

watch(
  () => [props.states, props.currentStep, props.frameCount],
  render,
  { deep: true }
)
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height }"></div>
</template>
