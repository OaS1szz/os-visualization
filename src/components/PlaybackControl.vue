<script setup>
const props = defineProps({
  totalSteps: { type: Number, default: 0 },
  modelValue: { type: Number, default: 0 },
  playing: { type: Boolean, default: false },
  speed: { type: Number, default: 1 },
})

const emit = defineEmits(['update:modelValue', 'play', 'pause', 'update:speed', 'stepForward', 'stepBack', 'reset'])

function onSpeedChange(val) {
  emit('update:speed', val)
}
</script>

<template>
  <div class="playback-control">
    <div class="playback-buttons">
      <el-button-group>
        <el-button :icon="'DArrowLeft'" size="small" @click="emit('stepBack')" :disabled="modelValue <= 0" title="后退">◀</el-button>
        <el-button v-if="!playing" type="primary" size="small" @click="emit('play')" title="播放">▶</el-button>
        <el-button v-else type="warning" size="small" @click="emit('pause')" title="暂停">⏸</el-button>
        <el-button size="small" @click="emit('stepForward')" :disabled="modelValue >= totalSteps - 1" title="前进">▶</el-button>
        <el-button size="small" @click="emit('reset')" title="重置">⟳</el-button>
      </el-button-group>
    </div>

    <div class="playback-progress">
      <span class="progress-label">步骤</span>
      <el-slider
        :model-value="modelValue"
        :min="0"
        :max="Math.max(totalSteps - 1, 0)"
        :step="1"
        @update:model-value="(v) => emit('update:modelValue', v)"
        style="flex: 1; min-width: 120px;"
      />
      <span class="progress-value">{{ modelValue + 1 }} / {{ totalSteps }}</span>
    </div>

    <div class="playback-speed">
      <span class="speed-label">速度</span>
      <el-slider
        :model-value="speed"
        :min="0.25"
        :max="5"
        :step="0.25"
        @update:model-value="onSpeedChange"
        style="width: 120px;"
        :marks="{ 0.5: '0.5x', 1: '1x', 2: '2x', 5: '5x' }"
        :format-tooltip="(v) => v + 'x'"
      />
    </div>
  </div>
</template>

<style scoped>
.playback-control {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.playback-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.progress-label,
.speed-label {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.progress-value {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  min-width: 60px;
}

.playback-speed {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
