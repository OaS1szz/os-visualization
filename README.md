# 操作系统核心算法可视化系统

动态模拟并展示操作系统经典算法的执行过程。基于 Vue 3 + Element Plus + ECharts 构建。

## 功能模块

| 模块 | 算法 | 可视化方式 |
|------|------|-----------|
| ⚙️ **处理器调度** | FCFS / RR / SJF抢占 / HRN | 甘特图 + 结果表格 |
| 🔄 **生产者-消费者同步** | 信号量机制，多生产者/消费者，连续取n个 | 缓冲区动画 + 线程状态 |
| 🏦 **银行家算法** | 死锁避免，安全性检查，资源请求 | 进程资源表格 + 步骤条 |
| 📄 **页面置换** | OPT / LRU / FIFO | 内存状态热力图 |
| 💾 **磁盘移臂调度** | SSTF / SCAN | 磁头移动折线图 |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
```

构建产物在 `dist/` 目录，可直接用浏览器打开 `dist/index.html`。

## 技术栈

- **Vue 3** — 组合式 API + `<script setup>`
- **Vite** — 构建工具
- **Element Plus** — UI 组件库
- **ECharts 5** — 数据可视化
- **Vue Router 4** — 路由

## 项目结构

```
src/
├── main.js                 # 入口
├── App.vue                 # 根组件
├── router/index.js         # 路由配置
├── styles/global.css       # 全局样式
├── algorithms/             # 算法层（纯函数）
│   ├── cpuSchedule.js      # 处理器调度
│   ├── producerConsumer.js # 生产者-消费者
│   ├── banker.js           # 银行家算法
│   ├── pageReplace.js      # 页面置换
│   └── diskSchedule.js     # 磁盘调度
├── components/             # 可复用组件
│   ├── GanttChart.vue      # 甘特图
│   ├── BufferVisual.vue    # 缓冲区可视化
│   ├── MemoryGrid.vue      # 内存状态矩阵
│   └── PlaybackControl.vue # 播放控件
└── views/                  # 页面
    ├── Home.vue            # 首页
    ├── CpuSchedule.vue     # 模块1
    ├── ProducerConsumer.vue # 模块2
    ├── Banker.vue          # 模块3
    ├── PageReplace.vue     # 模块4
    └── DiskSchedule.vue    # 模块5
```

## 架构设计

**算法与可视化分离**：每个模块的算法函数是纯函数（输入参数 → 状态快照数组），可视化层只负责按时间顺序"播放"这些快照。

## 许可

课程项目，仅供学习参考。
