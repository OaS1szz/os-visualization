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

  // 缺页标记点（放在底部物理块下方、x轴数字上方）
  const faultMarks = visibleStates
    .filter((s) => s.fault)
    .map((s) => ({
      coord: [s.step, props.frameCount - 1],
    }))

  const maxPage = Math.max(9, ...heatData.map((d) => d[2]))
  const pieces = []
  for (let p = 0; p <= maxPage; p++) {
    pieces.push({ min: p, max: p, label: String(p) })
  }
  pieces.push({ min: -1, max: -1, label: '-', color: '#f0f2f5' })

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const d = p.data
        // 只处理热力图数据（数组格式），忽略 scatter 等其他 series
        if (!Array.isArray(d) || d.length < 3) return ''
        const step = d[0]
        const frame = d[1]
        const page = d[2]
        if (page === -1) return `步骤 ${step}<br/>内存块 ${frame}: <空>`
        const faultInfo = visibleStates[step]?.fault ? ' (缺页!)' : ''
        return `步骤 ${step}<br/>内存块 ${frame}: 页面 ${page}${faultInfo}`
      },
    },
    grid: {
      left: 60,
      right: 30,
      top: 10,
      bottom: 80,
    },
    xAxis: {
      type: 'category',
      name: '步骤',
      data: visibleStates.map((s) => s.step),
      axisLabel: { fontSize: 12 },
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
          fontSize: 16,
          fontWeight: 'bold',
          formatter: (p) => (p.data[2] === -1 ? '-' : p.data[2]),
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        markPoint: faultMarks.length > 0
          ? {
              symbol: 'pin',
              symbolSize: 24,
              symbolOffset: [0, 30],
              itemStyle: { color: '#f56c6c' },
              data: faultMarks,
            }
          : undefined,
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
