<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  opt, lru, fifo, generateRandomSeq, getPresetSeq,
} from '../algorithms/pageReplace.js'
import MemoryGrid from '../components/MemoryGrid.vue'
import PlaybackControl from '../components/PlaybackControl.vue'

const algorithm = ref('opt')
const frameCount = ref(3)
const refSeqStr = ref('7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1')

const result = ref(null)
const currentStep = ref(0)
const playing = ref(false)
const speed = ref(1)

let timer = null

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function parseSeq() {
  return refSeqStr.value
    .split(/[,\s]+/)
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
}

function run() {
  const seq = parseSeq()
  if (seq.length === 0) {
    ElMessage.warning('请输入有效的页面引用序列')
    return
  }

  switch (algorithm.value) {
    case 'opt':
      result.value = opt(seq, frameCount.value)
      break
    case 'lru':
      result.value = lru(seq, frameCount.value)
      break
    case 'fifo':
      result.value = fifo(seq, frameCount.value)
      break
  }

  currentStep.value = 0
  stopPlay()
}

function generateRandom() {
  refSeqStr.value = generateRandomSeq(20, 9).join(',')
  run()
}

function loadPreset() {
  refSeqStr.value = getPresetSeq().join(',')
  frameCount.value = 3
  run()
}

function startPlay() {
  if (!result.value) return
  clearTimer()
  playing.value = true
  timer = setInterval(() => {
    if (currentStep.value < result.value.states.length - 1) {
      currentStep.value++
    } else {
      stopPlay()
    }
  }, 1000 / speed.value)
}

function stopPlay() {
  playing.value = false
  clearTimer()
}

function stepForward() {
  if (result.value && currentStep.value < result.value.states.length - 1) {
    currentStep.value++
  }
}

function stepBack() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function reset() {
  currentStep.value = 0
  stopPlay()
}

function handleSpeedUpdate(v) {
  speed.value = v
}

const currentState = computed(() => {
  if (!result.value) return null
  return result.value.states[currentStep.value]
})

const displayStates = computed(() => {
  if (!result.value) return []
  if (playing.value) {
    return result.value.states.slice(0, currentStep.value + 1)
  }
  return result.value.states
})

watch(speed, () => {
  if (playing.value) {
    startPlay()
  }
})

onMounted(() => {
  run()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">返回首页</router-link>
      <h1>页面置换算法模拟</h1>
    </div>

    <div class="control-panel">
      <div class="control-row">
        <span>算法：</span>
        <el-radio-group v-model="algorithm" @change="run">
          <el-radio-button value="opt">OPT 最优置换</el-radio-button>
          <el-radio-button value="lru">LRU 最近最久未使用</el-radio-button>
          <el-radio-button value="fifo">FIFO 先进先出</el-radio-button>
        </el-radio-group>
        <span style="margin-left: 12px;">物理块数：</span>
        <el-input-number v-model="frameCount" :min="1" :max="10" size="small" style="width: 80px;" @change="run" />
      </div>

      <div class="control-row">
        <span>页面引用序列：</span>
        <el-input v-model="refSeqStr" style="width: 500px;" placeholder="用逗号分隔，如 7,0,1,2,0,3" />
      </div>

      <div class="control-row">
        <el-button type="primary" @click="run">开始模拟</el-button>
        <el-button @click="loadPreset">加载教材示例</el-button>
        <el-button @click="generateRandom">随机生成</el-button>
      </div>
    </div>

    <div v-if="result" style="margin-bottom: 12px;">
      <PlaybackControl
        v-model="currentStep"
        :playing="playing"
        :speed="speed"
        :total-steps="result.states.length"
        @play="startPlay"
        @pause="stopPlay"
        @step-forward="stepForward"
        @step-back="stepBack"
        @reset="reset"
        @update:speed="handleSpeedUpdate"
      />
    </div>

    <div v-if="currentState && result" class="control-panel">
      <div style="display: flex; gap: 32px; align-items: center;">
        <div>
          <span style="color: #909399;">步骤</span>
          <span style="font-size: 24px; font-weight: 700; margin: 0 8px;">{{ currentState.step }}</span>
        </div>
        <div>
          <span style="color: #909399;">引用页面</span>
          <span style="font-size: 24px; font-weight: 700; color: var(--primary); margin: 0 8px;">{{ currentState.refPage }}</span>
        </div>
        <div>
          <el-tag v-if="currentState.fault" type="danger" size="large">缺页!</el-tag>
          <el-tag v-else type="success" size="large">命中</el-tag>
        </div>
        <div v-if="currentState.replacedPage !== null">
          <span style="color: #909399;">淘汰页面</span>
          <span style="font-size: 18px; font-weight: 700; color: #f56c6c;">{{ currentState.replacedPage }}</span>
        </div>
        <div>
          <span style="color: #909399;">当前内存</span>
          <span style="font-size: 16px; font-weight: 700; font-family: monospace;">
            [{{ currentState.memory.join(', ') }}]
          </span>
        </div>
      </div>
    </div>

    <div v-if="result" class="result-panel">
      <h3>内存状态变化矩阵</h3>
      <MemoryGrid
        :states="displayStates"
        :frame-count="frameCount"
        :current-step="currentStep"
      />

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">缺页次数：</span>
          <span class="stat-value" style="color: var(--danger);">{{ result.totalFaults }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">缺页率：</span>
          <span class="stat-value" style="color: var(--danger);">{{ result.faultRate }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">命中次数：</span>
          <span class="stat-value" style="color: var(--success);">{{ result.states.length - result.totalFaults }}</span>
        </div>
      </div>

      <h3>置换事件列表</h3>
      <el-table
        :data="result.states.filter(s => s.fault)"
        size="small"
        border
        stripe
        style="max-width: 700px;"
        max-height="300"
      >
        <el-table-column label="步骤" prop="step" width="60" />
        <el-table-column label="引用页面" prop="refPage" width="80" />
        <el-table-column label="事件" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">
              {{ row.replacedPage !== null ? `淘汰P${row.replacedPage}` : '首次装入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内存状态">
          <template #default="{ row }">
            <span style="font-family: monospace;">[{{ row.memory.join(', ') }}]</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
