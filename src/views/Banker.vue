<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPresetData, checkSafety, requestResources } from '../algorithms/banker.js'

const resourceLabels = ['A', 'B', 'C']

const available = reactive([3, 3, 2])
const processes = reactive([
  { id: 0, max: [7, 5, 3], allocation: [0, 1, 0] },
  { id: 1, max: [3, 2, 2], allocation: [2, 0, 0] },
  { id: 2, max: [9, 0, 2], allocation: [3, 0, 2] },
  { id: 3, max: [2, 2, 2], allocation: [2, 1, 1] },
  { id: 4, max: [4, 3, 3], allocation: [0, 0, 2] },
])

const safeResult = ref(null)
const requestResult = ref(null)
const requestPid = ref(0)
const requestRes = reactive([0, 0, 0])

const processRows = computed(() => processes.map((p) => ({
  id: p.id,
  max: [...p.max],
  allocation: [...p.allocation],
  need: calcNeed(p),
})))

function calcNeed(p) {
  return p.max.map((v, j) => v - p.allocation[j])
}

function validateState() {
  for (const p of processes) {
    for (let j = 0; j < resourceLabels.length; j++) {
      if (p.allocation[j] > p.max[j]) {
        ElMessage.error(`P${p.id} 的 ${resourceLabels[j]} Allocation 不能大于 Max`)
        return false
      }
      if (p.allocation[j] < 0 || p.max[j] < 0) {
        ElMessage.error('资源数据不能为负数')
        return false
      }
    }
  }

  if (available.some((v) => v < 0)) {
    ElMessage.error('Available 不能为负数')
    return false
  }

  return true
}

function runCheckSafety() {
  requestResult.value = null
  if (!validateState()) return

  const maxMatrix = processes.map((p) => p.max)
  const allocMatrix = processes.map((p) => p.allocation)
  safeResult.value = checkSafety(maxMatrix, allocMatrix, [...available])
}

function runRequest() {
  if (!validateState()) return

  const target = processes[requestPid.value]
  if (!target) {
    ElMessage.error('请求进程不存在')
    return
  }

  const need = calcNeed(target)
  for (let j = 0; j < requestRes.length; j++) {
    if (requestRes[j] > need[j]) {
      ElMessage.error(`请求超过 P${target.id} 的 ${resourceLabels[j]} Need`)
      return
    }
  }

  const maxMatrix = processes.map((p) => p.max)
  const allocMatrix = processes.map((p) => p.allocation)
  requestResult.value = requestResources(
    maxMatrix,
    allocMatrix,
    [...available],
    requestPid.value,
    [...requestRes]
  )

  if (requestResult.value.granted) {
    const res = [...requestRes]
    processes[requestPid.value].allocation = processes[requestPid.value].allocation.map(
      (v, j) => v + res[j]
    )
    for (let j = 0; j < available.length; j++) {
      available[j] -= res[j]
      requestRes[j] = 0
    }
    runCheckSafety()
  }
}

function addProcess() {
  const newId = processes.length
  processes.push({
    id: newId,
    max: [0, 0, 0],
    allocation: [0, 0, 0],
  })
}

function removeProcess(index) {
  if (processes.length <= 1) return
  processes.splice(index, 1)
  processes.forEach((p, i) => {
    p.id = i
  })
  requestPid.value = Math.min(requestPid.value, processes.length - 1)
  safeResult.value = null
  requestResult.value = null
}

function loadPreset() {
  const preset = getPresetData()
  available.splice(0, available.length, ...preset.available)
  processes.splice(0, processes.length)
  preset.max.forEach((maxRow, i) => {
    processes.push({
      id: i,
      max: [...maxRow],
      allocation: [...preset.allocation[i]],
    })
  })
  requestPid.value = 0
  requestRes.splice(0, requestRes.length, 0, 0, 0)
  safeResult.value = null
  requestResult.value = null
}

function reset() {
  loadPreset()
}

function safeStepRows() {
  if (!safeResult.value?.steps) return []
  return safeResult.value.steps.map((step, index) => ({
    step: index + 1,
    process: `P${step.process}`,
    workBefore: step.workBefore.join(', '),
    workAfter: step.workAfter.join(', '),
    finished: step.finished.map((v) => (v ? '1' : '0')).join(' '),
  }))
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">返回首页</router-link>
      <h1>银行家算法演示</h1>
    </div>

    <div class="control-panel">
      <h3>可用资源总数</h3>
      <div class="resource-inputs">
        <span v-for="(label, j) in resourceLabels" :key="label" class="resource-item">
          {{ label }}:
          <el-input-number
            v-model="available[j]"
            :min="0"
            :max="99"
            size="small"
            style="width: 90px"
          />
        </span>
      </div>
      <div style="margin-top: 12px;">
        <el-button @click="loadPreset">加载教材示例</el-button>
        <el-button @click="runCheckSafety" type="primary">检查安全性</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
    </div>

    <div class="control-panel">
      <h3>进程资源状态</h3>
      <el-table :data="processRows" border stripe style="width: 100%">
        <el-table-column prop="id" label="PID" width="60" />
        <el-table-column label="Max (A, B, C)">
          <template #default="{ row }">
            <div class="inline-inputs">
              <el-input-number
                v-for="j in 3"
                :key="'max' + j"
                v-model="processes[row.id].max[j - 1]"
                :min="0"
                :max="99"
                size="small"
                style="width: 70px"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Allocation (A, B, C)">
          <template #default="{ row }">
            <div class="inline-inputs">
              <el-input-number
                v-for="j in 3"
                :key="'alloc' + j"
                v-model="processes[row.id].allocation[j - 1]"
                :min="0"
                :max="99"
                size="small"
                style="width: 70px"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Need (A, B, C)">
          <template #default="{ row }">
            <span class="need-display">{{ row.need.join(', ') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button type="danger" size="small" @click="removeProcess($index)" :disabled="processes.length <= 1">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button @click="addProcess" style="margin-top: 12px;" size="small">+ 添加进程</el-button>
    </div>

    <div v-if="safeResult" class="result-panel">
      <h3>安全性检查结果</h3>
      <div style="margin-bottom: 12px;">
        <el-tag :type="safeResult.safe ? 'success' : 'danger'" size="large">
          {{ safeResult.safe ? '系统处于安全状态' : '系统处于不安全状态' }}
        </el-tag>
      </div>
      <div v-if="safeResult.safe && safeResult.sequence.length > 0" style="margin-top: 12px;">
        <span style="font-weight: 600;">安全序列：</span>
        <el-steps :active="safeResult.sequence.length" align-center>
          <el-step
            v-for="pid in safeResult.sequence"
            :key="pid"
            :title="'P' + pid"
          />
        </el-steps>
      </div>
      <el-table
        v-if="safeStepRows().length"
        :data="safeStepRows()"
        border
        stripe
        size="small"
        style="margin-top: 16px;"
      >
        <el-table-column prop="step" label="步骤" width="70" />
        <el-table-column prop="process" label="完成进程" width="100" />
        <el-table-column prop="workBefore" label="Work Before" />
        <el-table-column prop="workAfter" label="Work After" />
        <el-table-column prop="finished" label="Finish" />
      </el-table>
    </div>

    <div class="control-panel" style="margin-top: 20px;">
      <h3>资源请求</h3>
      <div class="control-row">
        <span>进程：</span>
        <el-select v-model="requestPid" style="width: 100px;">
          <el-option v-for="p in processes" :key="p.id" :label="'P' + p.id" :value="p.id" />
        </el-select>
        <span>请求资源：</span>
        <span v-for="(label, j) in resourceLabels" :key="label">
          {{ label }}
          <el-input-number v-model="requestRes[j]" :min="0" :max="99" size="small" style="width: 80px" />
        </span>
        <el-button type="primary" @click="runRequest">发起请求</el-button>
      </div>

      <div v-if="requestResult" :style="{ marginTop: '12px' }">
        <el-alert
          :type="requestResult.granted ? 'success' : 'error'"
          :title="requestResult.message"
          :closable="false"
          show-icon
        />
        <div v-if="requestResult.granted && requestResult.sequence.length > 0" style="margin-top: 12px;">
          <span style="font-weight: 600;">分配后安全序列：</span>
          <el-steps :active="requestResult.sequence.length" align-center simple>
            <el-step
              v-for="pid in requestResult.sequence"
              :key="pid"
              :title="'P' + pid"
            />
          </el-steps>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-inputs {
  display: flex;
  gap: 16px;
  align-items: center;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.inline-inputs {
  display: flex;
  gap: 6px;
}

.need-display {
  font-family: monospace;
  color: #909399;
  font-size: 13px;
}
</style>
