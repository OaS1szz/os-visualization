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
  if (!props.segments.length) return {}

  const pids = [...new Set(props.segments.map((s) => s.pid))]

  // 边框层数据：深色底层矩形
  const borderData = props.segments.map((seg, i) => ({
    value: [seg.start, seg.end],
    pid: seg.pid,
    idx: i,
  }))

  // 主体层数据：彩色矩形
  const fillData = props.segments.map((seg, i) => ({
    value: [seg.start, seg.end],
    pid: seg.pid,
    color: seg.color,
    idx: i,
  }))

  // 标签层数据：文字
  const labelData = props.segments.map((seg, i) => ({
    value: [seg.start, seg.end],
    pid: seg.pid,
    idx: i,
  }))

  // 辅助函数：根据 pid 获取 y 轴索引
  function getYIndex(pid) {
    return pids.indexOf(pid)
  }

  // 渲染矩形块的通用函数
  function makeRectRender(dataArray, styleFn) {
    return (params, api) => {
      const item = dataArray[params.dataIndex]
      if (!item) return null

      const yIndex = getYIndex(item.pid)
      if (yIndex < 0) return null

      const start = api.coord([item.value[0], yIndex])
      const end = api.coord([item.value[1], yIndex])
      const barHeight = api.size([0, 1])[1] * 0.55

      return styleFn({
        x: start[0],
        y: start[1] - barHeight / 2,
        w: Math.max(end[0] - start[0], 2),
        h: barHeight,
        item,
        api,
      })
    }
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const d = p.data
        if (!d || !d.pid) return ''
        return `${d.pid}<br/>开始: ${d.value[0]}<br/>结束: ${d.value[1]}`
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
      axisLine: { lineStyle: { color: '#333', width: 2 } },
      splitLine: { lineStyle: { color: '#ddd', width: 1, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: pids,
      axisLabel: { fontSize: 12 },
      axisLine: { lineStyle: { color: '#333', width: 2 } },
    },
    series: [
      // 层1：黑色边框
      {
        type: 'custom',
        renderItem: makeRectRender(borderData, ({ x, y, w, h }) => {
          const b = 2
          return {
            type: 'rect',
            shape: {
              x: x - b,
              y: y - b,
              width: w + b * 2,
              height: h + b * 2,
            },
            style: { fill: '#000', borderRadius: 14 },
          }
        }),
        data: borderData,
        z: 1,
      },
      // 层2：彩色主体
      {
        type: 'custom',
        renderItem: makeRectRender(fillData, ({ x, y, w, h, item }) => ({
          type: 'rect',
          shape: { x, y, width: w, height: h },
          style: { fill: item.color, borderRadius: 10 },
          styleEmphasis: { fill: item.color },
        })),
        data: fillData,
        z: 2,
      },
      // 层3：文字标签
      {
        type: 'custom',
        renderItem: makeRectRender(labelData, ({ x, y, w, item, api }) => {
          const centerX = x + w / 2
          const centerY = y + api.size([0, 1])[1] * 0.55 / 2
          return {
            type: 'text',
            style: {
              text: item.pid,
              x: centerX,
              y: centerY,
              textAlign: 'center',
              textVerticalAlign: 'middle',
              fill: '#fff',
              font: 'bold 13px sans-serif',
            },
          }
        }),
        data: labelData,
        z: 10,
      },
    ],
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
