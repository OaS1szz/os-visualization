<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const modules = [
  {
    path: '/cpu-schedule',
    title: '处理器调度',
    desc: 'FCFS / RR / SRTF / HRN',
    icon: '⏱',
    color: '#409eff',
  },
  {
    path: '/producer-consumer',
    title: '生产者-消费者',
    desc: '信号量同步、缓冲区状态、步骤回放',
    icon: '📦',
    color: '#67c23a',
  },
  {
    path: '/banker',
    title: '银行家算法',
    desc: '安全性检查、资源请求模拟、安全序列',
    icon: '🧮',
    color: '#e6a23c',
  },
  {
    path: '/page-replace',
    title: '页面置换',
    desc: 'OPT / LRU / FIFO 与缺页统计',
    icon: '🧠',
    color: '#f56c6c',
  },
  {
    path: '/disk-schedule',
    title: '磁盘调度',
    desc: 'SSTF / SCAN 与寻道轨迹',
    icon: '💽',
    color: '#9b59b6',
  },
]

function navigate(path) {
  router.push(path)
}
</script>

<template>
  <div class="home-container">
    <header class="home-header">
      <h1>操作系统核心算法可视化系统</h1>
      <p class="subtitle">面向课程设计的经典算法演示与过程可视化</p>
      <div class="hero-note">
        支持课堂演示、参数调整、结果回放和图形化观察
      </div>
    </header>

    <section class="module-grid">
      <div
        v-for="m in modules"
        :key="m.path"
        class="module-card"
        :style="{ borderTopColor: m.color }"
        @click="navigate(m.path)"
      >
        <div class="module-icon" :style="{ color: m.color }">{{ m.icon }}</div>
        <h2 class="module-title">{{ m.title }}</h2>
        <p class="module-desc">{{ m.desc }}</p>
        <el-button type="primary" size="small" :color="m.color" plain>
          进入模块
        </el-button>
      </div>
    </section>

    <section class="summary-band">
      <div>
        <strong>5</strong>
        <span>个模块</span>
      </div>
      <div>
        <strong>4</strong>
        <span>类经典调度</span>
      </div>
      <div>
        <strong>1</strong>
        <span>套可演示交付物</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 40px 24px 32px;
  min-height: 100vh;
}

.home-header {
  margin-bottom: 28px;
}

.home-header h1 {
  font-size: 34px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 10px;
}

.subtitle {
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 12px;
}

.hero-note {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #4b5563;
  font-size: 13px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.module-card {
  background: #fff;
  border-radius: 8px;
  border-top: 4px solid;
  padding: 24px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.module-icon {
  font-size: 34px;
  margin-bottom: 14px;
}

.module-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.module-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 18px;
  line-height: 1.6;
}

.summary-band {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.summary-band div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: #4b5563;
}

.summary-band strong {
  font-size: 26px;
  color: #111827;
}

@media (max-width: 720px) {
  .summary-band {
    grid-template-columns: 1fr;
  }
}
</style>
