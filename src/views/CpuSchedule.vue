<script setup>
import { ref, reactive } from 'vue'
import {
  fcfs, rr, sjfPreemptive, hrn, assignColors,
} from '../algorithms/cpuSchedule.js'
import GanttChart from '../components/GanttChart.vue'

const algorithm = ref('fcfs')
const timeQuantum = ref(2)

const processes = reactive([
  { id: 'P1', arrivalTime: 0, burstTime: 5 },
  { id: 'P2', arrivalTime: 1, burstTime: 3 },
  { id: 'P3', arrivalTime: 2, burstTime: 8 },
  { id: 'P4', arrivalTime: 3, burstTime: 6 },
])

const result = ref(null)

function addProcess() {
  const nextId = processes.length + 1
  processes.push({ id: `P${nextId}`, arrivalTime: 0, burstTime: 3 })
}

function removeProcess(index) {
  if (processes.length <= 1) return
  processes.splice(index, 1)
}

function run() {
  const input = processes.map((p) => ({ ...p }))
  let res
  switch (algorithm.value) {
    case 'fcfs':
      res = fcfs(input)
      break
    case 'rr':
      res = rr(input, timeQuantum.value)
      break
    case 'sjf':
      res = sjfPreemptive(input)
      break
    case 'hrn':
      res = hrn(input)
      break
  }
  res.gantt = assignColors(res.gantt)
  result.value = res
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h1>⚙️ 处理器调度模拟</h1>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <span>调度算法：</span>
        <el-radio-group v-model="algorithm">
          <el-radio-button value="fcfs">FCFS 先来先服务</el-radio-button>
          <el-radio-button value="rr">RR 时间片轮转</el-radio-button>
          <el-radio-button value="sjf">SJF 抢占式</el-radio-button>
          <el-radio-button value="hrn">HRN 最高响应比</el-radio-button>
        </el-radio-group>
        <span v-if="algorithm === 'rr'" style="margin-left: 8px;">
          时间片：
          <el-input-number v-model="timeQuantum" :min="1" :max="20" size="small" style="width: 80px" />
        </span>
      </div>

      <div class="control-row">
        <el-table :data="processes" border stripe size="small" style="width: 100%; max-width: 600px;">
          <el-table-column prop="id" label="进程ID" width="80" />
          <el-table-column label="到达时间" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.arrivalTime" :min="0" :max="99" size="small" style="width: 90px" />
            </template>
          </el-table-column>
          <el-table-column label="服务时间" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.burstTime" :min="1" :max="99" size="small" style="width: 90px" />
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
      </div>

      <div class="control-row">
        <el-button type="primary" @click="run">开始调度</el-button>
        <el-button @click="addProcess">+ 添加进程</el-button>
      </div>
    </div>

    <!-- 结果 -->
    <div v-if="result" class="result-panel">
      <!-- 甘特图 -->
      <h3>调度甘特图</h3>
      <GanttChart :segments="result.gantt" height="200px" />

      <!-- 统计 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">平均周转时间：</span>
          <span class="stat-value">
            {{ (result.results.reduce((s, r) => s + r.turnaroundTime, 0) / result.results.length).toFixed(2) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均带权周转时间：</span>
          <span class="stat-value">
            {{ (result.results.reduce((s, r) => s + r.weightedTurnaroundTime, 0) / result.results.length).toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- 结果表格 -->
      <h3>进程结果</h3>
      <el-table :data="result.results" border stripe size="small" style="max-width: 600px;">
        <el-table-column prop="id" label="进程ID" />
        <el-table-column prop="finishTime" label="完成时间" />
        <el-table-column prop="turnaroundTime" label="周转时间" />
        <el-table-column prop="weightedTurnaroundTime" label="带权周转时间" />
      </el-table>
    </div>
  </div>
</template>
