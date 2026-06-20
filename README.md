# 操作系统核心算法可视化系统

> 课设做的小垃圾，但好像也能用




基于 **Vue 3 + Vite + Element Plus + ECharts** 的操作系统经典算法交互式演示项目。将课设涉及的五大核心领域共 14 个算法做成可交互、可回放、可演示的 Web 应用。

## 技术栈

| 技术 | 版本 | 用途 |
| ---- | ---- | ---- |
| Vue 3 | ^3.5 | 前端框架（Composition API） |
| Vite | ^8.0 | 构建工具 |
| Element Plus | ^2.14 | UI 组件库 |
| ECharts | ^6.1 | 可视化图表 |
| Vue Router | ^4.6 | Hash 路由 |

## 已实现模块

### 1. 处理器调度

FCFS / RR（时间片可调）/ SJF（抢占式 SRTF）/ HRN

- 动态增删进程，实时编辑到达时间和服务时间
- ECharts 自定义甘特图（三层渲染：边框 + 彩色主体 + 标签）
- 输出：完成时间、周转时间、带权周转时间、平均值

### 2. 生产者-消费者同步

多生产者 / 多消费者 + 信号量机制 + 步骤回放

- 消费者需连续取 n 个产品后其他消费者方可取
- 可配置：缓冲区大小、生产/消费线程数、连续取 n、步数上限
- BufferVisual 彩色格子 + 线程状态面板 + 执行日志
- PlaybackControl 回放：播放/暂停/步进/后退/变速（0.25x–5x）

### 3. 银行家算法

安全性检查 + 资源请求模拟

- 动态编辑 Available / Max / Allocation，Need 自动计算
- 三步检查法：Need 校验 → Available 校验 → 试探分配 + 安全性检查
- el-steps 箭头链展示安全序列，el-alert 反馈请求结果
- 内置教材经典示例（5 进程 × 3 资源）

### 4. 页面置换

OPT / LRU / FIFO + 步骤回放

- 手册输入 / 随机生成 / 加载教材示例三种输入方式
- MemoryGrid：ECharts 热力图 + 红色图钉标记缺页
- 缺页次数、缺页率、命中次数统计
- PlaybackControl 回放，热力图联动推进

### 5. 磁盘调度

SSTF / SCAN（方向可设）+ 寻道轨迹

- 折线图磁头轨迹 + 红色散点标记请求 + 绿色菱形标记边界折返
- 输出：响应顺序链、总寻道长度、平均寻道长度、步骤详情表

## 运行

```bash
npm install
npm run dev        # 开发服务器，默认 http://localhost:5173
npm run build      # 生产构建 → dist/
npm run preview    # 预览构建产物
```

## 项目结构

```text
src/
├── main.js                       # 入口：注册 ElementPlus + Router
├── App.vue                       # 根组件
├── styles/global.css             # 全局样式 + CSS 变量
├── router/index.js               # Hash 路由（6 条）
├── algorithms/                   # 算法层（纯函数，与视图解耦）
│   ├── cpuSchedule.js            # FCFS / RR / SRTF / HRN
│   ├── producerConsumer.js       # 生产者-消费者状态机模拟
│   ├── banker.js                 # 银行家算法
│   ├── pageReplace.js            # OPT / LRU / FIFO
│   └── diskSchedule.js           # SSTF / SCAN
├── views/                        # 视图层（页面组件）
│   ├── Home.vue                  # 首页模块导航卡片
│   ├── CpuSchedule.vue           # 处理器调度
│   ├── ProducerConsumer.vue      # 生产者-消费者
│   ├── Banker.vue                # 银行家算法
│   ├── PageReplace.vue           # 页面置换
│   └── DiskSchedule.vue          # 磁盘调度
└── components/                   # 可视化组件层（可复用）
    ├── GanttChart.vue            # ECharts 自定义甘特图
    ├── BufferVisual.vue          # 缓冲区格子 + 线程状态
    ├── MemoryGrid.vue            # 热力图内存矩阵 + 缺页标记
    └── PlaybackControl.vue       # 通用回放控件
```

## 设计原则

- **算法与视图分离**：algorithms/ 下全部为纯函数，无 Vue/DOM 依赖，算法可独立测试
- **组件 Props 驱动**：可视化组件无内部状态，完全由父组件数据驱动渲染
- **预设数据策略**：每个模块内置教材经典示例，一键加载，确保课堂演示零风险

## 详细报告

见 [项目最终报告.md](./项目最终报告.md)
