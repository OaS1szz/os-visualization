/**
 * 处理器调度算法
 * 每个函数接收进程列表，返回 { gantt, results }
 * gantt: [{ pid, start, end }]
 * results: [{ id, finishTime, turnaroundTime, weightedTurnaroundTime }]
 */

/**
 * 先来先服务 (FCFS)
 */
export function fcfs(processes) {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)
  const gantt = []
  const results = []
  let currentTime = 0

  for (const p of sorted) {
    if (currentTime < p.arrivalTime) {
      currentTime = p.arrivalTime
    }
    const start = currentTime
    const end = start + p.burstTime
    gantt.push({ pid: p.id, start, end })
    currentTime = end

    const finishTime = end
    const turnaroundTime = finishTime - p.arrivalTime
    const weightedTurnaroundTime = turnaroundTime / p.burstTime
    results.push({
      id: p.id,
      finishTime,
      turnaroundTime,
      weightedTurnaroundTime: parseFloat(weightedTurnaroundTime.toFixed(2)),
    })
  }

  return { gantt, results }
}

/**
 * 时间片轮转 (RR)
 */
export function rr(processes, timeQuantum) {
  const queue = processes.map((p) => ({
    ...p,
    remaining: p.burstTime,
  }))
  // 按到达时间排序
  queue.sort((a, b) => a.arrivalTime - b.arrivalTime)

  const gantt = []
  const finishMap = {}
  let currentTime = 0
  const readyQueue = []
  let index = 0

  // 将已到达的进程加入就绪队列
  function enqueueArrived() {
    while (index < queue.length && queue[index].arrivalTime <= currentTime) {
      readyQueue.push(queue[index])
      index++
    }
  }

  enqueueArrived()

  while (readyQueue.length > 0) {
    const p = readyQueue.shift()
    const execTime = Math.min(timeQuantum, p.remaining)

    // 如果 CPU 空闲，快进到下一个进程到达时间
    if (currentTime < p.arrivalTime) {
      // 检查是否有更早的
    }

    gantt.push({ pid: p.id, start: currentTime, end: currentTime + execTime })
    currentTime += execTime
    p.remaining -= execTime

    // 推进过程中新到达的进程
    enqueueArrived()

    if (p.remaining > 0) {
      readyQueue.push(p)
    } else {
      finishMap[p.id] = currentTime
    }

    // 如果就绪队列空但还有未到达进程
    if (readyQueue.length === 0 && index < queue.length) {
      currentTime = queue[index].arrivalTime
      enqueueArrived()
    }
  }

  // 合并连续的相同 pid 甘特图段
  const mergedGantt = []
  for (const seg of gantt) {
    const last = mergedGantt[mergedGantt.length - 1]
    if (last && last.pid === seg.pid && last.end === seg.start) {
      last.end = seg.end
    } else {
      mergedGantt.push({ ...seg })
    }
  }

  const results = processes.map((p) => {
    const finishTime = finishMap[p.id]
    const turnaroundTime = finishTime - p.arrivalTime
    const weightedTurnaroundTime = turnaroundTime / p.burstTime
    return {
      id: p.id,
      finishTime,
      turnaroundTime,
      weightedTurnaroundTime: parseFloat(weightedTurnaroundTime.toFixed(2)),
    }
  })

  return { gantt: mergedGantt, results }
}

/**
 * 短进程优先 - 抢占式 (SJF Preemptive / SRTF)
 */
export function sjfPreemptive(processes) {
  const procs = processes.map((p) => ({
    ...p,
    remaining: p.burstTime,
  }))
  const gantt = []
  const finishMap = {}
  let currentTime = 0
  let completed = 0
  let lastPid = null

  while (completed < procs.length) {
    // 找出已到达且剩余时间最短的进程
    let shortest = null
    for (const p of procs) {
      if (p.remaining > 0 && p.arrivalTime <= currentTime) {
        if (!shortest || p.remaining < shortest.remaining) {
          shortest = p
        }
      }
    }

    if (!shortest) {
      // 没有进程就绪，推进到下一个到达时间
      const nextArrival = procs
        .filter((p) => p.remaining > 0)
        .reduce((min, p) => Math.min(min, p.arrivalTime), Infinity)
      currentTime = nextArrival
      continue
    }

    // 抢占：如果换了进程，记录甘特图段
    if (lastPid !== shortest.id) {
      if (gantt.length > 0) {
        gantt[gantt.length - 1].end = currentTime
      }
      gantt.push({ pid: shortest.id, start: currentTime, end: currentTime })
      lastPid = shortest.id
    }

    // 执行一个时间单位
    shortest.remaining--
    currentTime++

    if (shortest.remaining === 0) {
      finishMap[shortest.id] = currentTime
      completed++
      // 结束当前甘特图段
      gantt[gantt.length - 1].end = currentTime
      lastPid = null
    }
  }

  // 过滤掉 start === end 的空段
  const validGantt = gantt.filter((g) => g.start < g.end)

  const results = processes.map((p) => {
    const finishTime = finishMap[p.id]
    const turnaroundTime = finishTime - p.arrivalTime
    const weightedTurnaroundTime = turnaroundTime / p.burstTime
    return {
      id: p.id,
      finishTime,
      turnaroundTime,
      weightedTurnaroundTime: parseFloat(weightedTurnaroundTime.toFixed(2)),
    }
  })

  return { gantt: validGantt, results }
}

/**
 * 最高响应比优先 (HRN)
 */
export function hrn(processes) {
  const remaining = processes.map((p) => ({ ...p }))
  const gantt = []
  const results = []
  let currentTime = 0

  while (remaining.length > 0) {
    // 计算每个已到达进程的响应比
    let best = null
    let bestRatio = -1
    let bestIndex = -1

    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i]
      if (p.arrivalTime <= currentTime) {
        const waitTime = currentTime - p.arrivalTime
        const ratio = (waitTime + p.burstTime) / p.burstTime
        if (ratio > bestRatio) {
          bestRatio = ratio
          best = p
          bestIndex = i
        }
      }
    }

    if (!best) {
      // 没有已到达进程，推进时间
      const nextArrival = remaining.reduce(
        (min, p) => Math.min(min, p.arrivalTime),
        Infinity
      )
      currentTime = nextArrival
      continue
    }

    const start = currentTime
    const end = start + best.burstTime
    gantt.push({ pid: best.id, start, end })
    currentTime = end

    const finishTime = end
    const turnaroundTime = finishTime - best.arrivalTime
    const weightedTurnaroundTime = turnaroundTime / best.burstTime
    results.push({
      id: best.id,
      finishTime,
      turnaroundTime,
      weightedTurnaroundTime: parseFloat(weightedTurnaroundTime.toFixed(2)),
    })

    remaining.splice(bestIndex, 1)
  }

  return { gantt, results }
}

// 预设色板
const COLORS = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9b59b6',
  '#1abc9c', '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
]

/**
 * 为甘特图段分配颜色
 */
export function assignColors(gantt) {
  const pidSet = [...new Set(gantt.map((g) => g.pid))]
  const colorMap = {}
  pidSet.forEach((pid, i) => {
    colorMap[pid] = COLORS[i % COLORS.length]
  })
  return gantt.map((g) => ({
    ...g,
    color: colorMap[g.pid],
  }))
}
