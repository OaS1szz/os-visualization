<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { simulate } from '../algorithms/producerConsumer.js'
import BufferVisual from '../components/BufferVisual.vue'
import PlaybackControl from '../components/PlaybackControl.vue'

const config = reactive({
  bufferSize: 5,
  numProducers: 2,
  numConsumers: 2,
  continuousN: 3,
  maxSteps: 80,
})

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

function run() {
  result.value = simulate({ ...config })
  currentStep.value = 0
  stopPlay()
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

function handleSpeedUpdate(v) {
  speed.value = v
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

const currentState = computed(() => {
  if (!result.value || !result.value.states[currentStep.value]) return null
  return result.value.states[currentStep.value]
})

const stats = computed(() => {
  if (!result.value) return { totalProduced: 0, totalConsumed: 0 }
  return result.value.stats
})

watch(speed, () => {
  if (playing.value) {
    startPlay()
  }
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">返回首页</router-link>
      <h1>生产者-消费者同步模拟</h1>
    </div>

    <div class="control-panel">
      <div class="control-row">
        <span>缓冲区大小：</span>
        <el-input-number v-model="config.bufferSize" :min="1" :max="20" size="small" />
        <span>生产者数：</span>
        <el-input-number v-model="config.numProducers" :min="1" :max="10" size="small" />
        <span>消费者数：</span>
        <el-input-number v-model="config.numConsumers" :min="1" :max="10" size="small" />
        <span>连续取 n：</span>
        <el-input-number v-model="config.continuousN" :min="1" :max="20" size="small" />
      </div>
      <div class="control-row">
        <span>最大步骤：</span>
        <el-input-number v-model="config.maxSteps" :min="10" :max="500" :step="10" size="small" />
        <el-button type="primary" @click="run">开始模拟</el-button>
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

    <div v-if="currentState" class="control-panel">
      <div style="margin-bottom: 8px; display: flex; gap: 32px; font-size: 13px; color: #909399;">
        <span>步骤: {{ currentState.step }}</span>
        <span>empty={{ currentState.empty }}</span>
        <span>full={{ currentState.full }}</span>
        <span>mutex={{ currentState.mutex }}</span>
        <span>已生产: {{ currentState.totalProduced }}</span>
        <span>已消费: {{ currentState.totalConsumed }}</span>
      </div>

      <BufferVisual
        :buffer="currentState.buffer"
        :producers="currentState.producers"
        :consumers="currentState.consumers"
        :consumer-count="currentState.consumerCount"
      />
    </div>

    <div v-if="result" class="result-panel">
      <h3>模拟统计</h3>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">总生产：</span>
          <span class="stat-value" style="color: var(--success);">{{ stats.totalProduced }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总消费：</span>
          <span class="stat-value" style="color: var(--primary);">{{ stats.totalConsumed }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总步骤：</span>
          <span class="stat-value">{{ result.states.length }}</span>
        </div>
      </div>

      <h3>执行日志</h3>
      <div class="log-list">
        <div
          v-for="(log, i) in currentState?.log || []"
          :key="i"
          class="log-item"
        >
          {{ log }}
        </div>
        <div v-if="!currentState?.log?.length" class="log-empty">-</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-list {
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.log-item:nth-child(odd) {
  background: #fafafa;
}

.log-empty {
  color: #c0c4cc;
  text-align: center;
  padding: 12px;
}
</style>
