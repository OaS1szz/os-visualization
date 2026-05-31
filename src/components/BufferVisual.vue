<script setup>
import { computed } from 'vue'

const props = defineProps({
  buffer: {
    type: Array,
    default: () => [],
  },
  producers: {
    type: Array,
    default: () => [],
  },
  consumers: {
    type: Array,
    default: () => [],
  },
  consumerCount: {
    type: Array,
    default: () => [],
  },
})

function cellClass(value) {
  if (value === null) return 'cell-empty'
  return 'cell-occupied'
}

function producerStateText(p) {
  const map = {
    idle: '空闲',
    waiting_empty: '等待 empty',
    waiting_mutex: '等待 mutex',
    done: '生产中',
  }
  return map[p.state] || p.state
}

function consumerStateText(c, idx) {
  const map = {
    idle: '空闲',
    waiting_full: '等待 full',
    waiting_mutex: '等待 mutex',
    waiting_turn: `等待续取 (${props.consumerCount[idx] || 0})`,
    done: '消费中',
  }
  return map[c.state] || c.state
}

function stateTagType(state) {
  if (state.includes('waiting')) return 'warning'
  if (state === 'idle') return 'info'
  return 'success'
}
</script>

<template>
  <div class="buffer-visual">
    <div class="buffer-label">缓冲区</div>
    <div class="buffer-cells">
      <div
        v-for="(cell, i) in buffer"
        :key="i"
        class="buffer-cell"
        :class="cellClass(cell)"
      >
        <span class="cell-index">{{ i }}</span>
        <span class="cell-content">{{ cell !== null ? `#${cell}` : '空' }}</span>
      </div>
    </div>

    <!-- 线程状态 -->
    <div class="thread-status">
      <div class="thread-group">
        <div class="thread-group-title">生产者</div>
        <div
          v-for="p in producers"
          :key="'p' + p.id"
          class="thread-item"
        >
          <el-tag :type="stateTagType(p.state)" size="small">
            P{{ p.id }}: {{ producerStateText(p) }}
          </el-tag>
        </div>
      </div>
      <div class="thread-group">
        <div class="thread-group-title">消费者</div>
        <div
          v-for="(c, idx) in consumers"
          :key="'c' + c.id"
          class="thread-item"
        >
          <el-tag :type="stateTagType(c.state)" size="small">
            C{{ c.id }}: {{ consumerStateText(c, idx) }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buffer-visual {
  padding: 16px 0;
}

.buffer-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.buffer-cells {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.buffer-cell {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.cell-empty {
  background: #f0f2f5;
  color: #c0c4cc;
  border-color: #e4e7ed;
}

.cell-occupied {
  background: #e1f3d8;
  color: #67c23a;
  border-color: #b3e19d;
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.cell-index {
  font-size: 10px;
  color: #909399;
}

.cell-content {
  font-size: 14px;
  margin-top: 4px;
}

.thread-status {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.thread-group-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.thread-item {
  margin-bottom: 4px;
}
</style>
