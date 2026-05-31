<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  segments: {
    type: Array,
    default: () => [],
    // [{ pid, start, end, color }]
  },
  height: {
    type: String,
    default: '250px',
  },
})

const chartRef = ref(null)
let chartInstance = null

function buildOption() {
  const data = props.segments.map((seg) => ({
    name: seg.pid,
    value: [seg.start, seg.end, seg.pid],
    itemStyle: { color: seg.color },
  }))

  // 收集所有进程 ID
  const pids = [...new Set(props.segments.map((s) => s.pid))]

  // 每个进程一条横线
  const series = pids.map((pid) => ({
    type: 'custom',
    renderItem: (params, api) => {
      const catIndex = api.value(0)
      if (catIndex !== pid) return null

      const start = api.coord([api.value(1), catIndex])
      const end = api.coord([api.value(2), catIndex])
      const height = api.size([0, 1])[1] * 0.6

      return {
        type: 'rect',
        shape: {
          x: start[0],
          y: start[1] - height / 2,
          width: Math.max(end[0] - start[0], 1),
          height: height,
        },
        style: {
          fill: api.visual('color'),
          stroke: '#fff',
          lineWidth: 2,
          borderRadius: 4,
        },
        styleEmphasis: {
          stroke: '#333',
          lineWidth: 2,
        },
      }
    },
    encode: {
      x: [1, 2],
      y: 0,
    },
    data: props.segments
      .filter((s) => s.pid === pid)
      .map((s) => ({
        value: [pid, s.start, s.end],
        itemStyle: { color: s.color },
      })),
  }))

  // 添加数据标签系列
  const labelSeries = pids.map((pid) => ({
    type: 'custom',
    renderItem: (params, api) => {
      const catIndex = api.value(0)
      if (catIndex !== pid) return null

      const start = api.coord([api.value(1), catIndex])
      const end = api.coord([api.value(2), catIndex])
      const centerX = (start[0] + end[0]) / 2
      const centerY = start[1]

      return {
        type: 'text',
        style: {
          text: api.value(3),
          x: centerX,
          y: centerY,
          textAlign: 'center',
          textVerticalAlign: 'middle',
          fill: '#fff',
          font: 'bold 12px sans-serif',
        },
      }
    },
    encode: { x: [1, 2], y: 0 },
    data: props.segments
      .filter((s) => s.pid === pid)
      .map((s) => ({
        value: [pid, s.start, s.end, s.pid],
      })),
    z: 10,
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const d = p.data?.value || p.value
        if (!d || d.length < 3) return ''
        return `${d[0]}<br/>开始: ${d[1]}<br/>结束: ${d[2]}`
      },
    },
    grid: {
      left: 60,
      right: 30,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'value',
      name: '时间',
      min: 0,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: pids,
      axisLabel: { fontSize: 12 },
    },
    series: [...series, ...labelSeries],
  }
}

function render() {
  if (!chartInstance) return
  if (props.segments.length === 0) {
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

watch(() => props.segments, render, { deep: true })
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height }"></div>
</template>
