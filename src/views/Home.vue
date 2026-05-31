<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const modules = [
  {
    path: '/cpu-schedule',
    title: '处理器调度模拟',
    desc: 'FCFS / 时间片轮转 / SJF抢占 / 最高响应比优先',
    icon: '⚙️',
    color: '#409eff',
  },
  {
    path: '/producer-consumer',
    title: '生产者-消费者同步',
    desc: '信号量机制 · 多生产者/多消费者 · 缓冲区可视化',
    icon: '🔄',
    color: '#67c23a',
  },
  {
    path: '/banker',
    title: '银行家算法演示',
    desc: '死锁避免 · 安全性检查 · 资源请求模拟',
    icon: '🏦',
    color: '#e6a23c',
  },
  {
    path: '/page-replace',
    title: '页面置换算法模拟',
    desc: 'OPT / LRU / FIFO 页面置换 · 缺页率统计',
    icon: '📄',
    color: '#f56c6c',
  },
  {
    path: '/disk-schedule',
    title: '磁盘移臂调度模拟',
    desc: 'SSTF / SCAN 算法 · 磁头移动轨迹',
    icon: '💾',
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
      <p class="subtitle">
        动态模拟并展示操作系统经典算法的执行过程
      </p>
    </header>

    <div class="module-grid">
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
    </div>

    <footer class="home-footer">
      <p>操作系统课程设计 · 2025-2026 学年春季学期</p>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;
}

.home-header {
  text-align: center;
  margin-bottom: 48px;
}

.home-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}

.subtitle {
  color: #909399;
  font-size: 16px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.module-card {
  background: #fff;
  border-radius: 12px;
  border-top: 4px solid;
  padding: 28px 24px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
}

.module-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.module-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.module-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
  line-height: 1.5;
}

.home-footer {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}
</style>
