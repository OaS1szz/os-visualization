/**
 * 磁盘移臂调度算法
 * 每个函数返回 { order[], totalDistance, path[] }
 * order: 响应顺序
 * path: [{ step, pos, target? }] - 磁头移动路径
 */

/**
 * SSTF — 最短寻道时间优先
 */
export function sstf(requests, startPos) {
  const remaining = [...requests]
  const order = []
  const path = [{ step: 0, pos: startPos, target: null }]
  let currentPos = startPos
  let totalDistance = 0
  let stepCount = 0

  while (remaining.length > 0) {
    // 找最近的请求
    let minDist = Infinity
    let minIndex = -1

    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.abs(remaining[i] - currentPos)
      if (dist < minDist) {
        minDist = dist
        minIndex = i
      }
    }

    const target = remaining[minIndex]
    const dist = Math.abs(target - currentPos)
    totalDistance += dist
    currentPos = target
    order.push(target)

    stepCount++
    path.push({ step: stepCount, pos: currentPos, target })

    remaining.splice(minIndex, 1)
  }

  return { order, totalDistance, path }
}

/**
 * SCAN — 电梯算法
 * @param {string} direction - 'up' (向外/增大) 或 'down' (向内/减小)
 */
export function scan(requests, startPos, direction = 'up') {
  const sorted = [...requests].sort((a, b) => a - b)
  const order = []
  const path = [{ step: 0, pos: startPos, target: null }]
  let currentPos = startPos
  let totalDistance = 0
  let stepCount = 0

  // 分离大于和小于当前磁道的请求
  const greater = sorted.filter((t) => t >= currentPos)
  const less = sorted.filter((t) => t < currentPos)

  let serveOrder
  if (direction === 'up') {
    // 先向外（增大）服务，再折返服务内侧
    serveOrder = [...greater, ...less.reverse()]
  } else {
    // 先向内（减小）服务，再折返服务外侧
    serveOrder = [...less.reverse(), ...greater]
  }

  for (const target of serveOrder) {
    const dist = Math.abs(target - currentPos)
    totalDistance += dist
    currentPos = target
    order.push(target)
    stepCount++
    path.push({ step: stepCount, pos: currentPos, target })
  }

  return { order, totalDistance, path }
}

/**
 * 生成随机磁道请求序列
 */
export function generateRandomRequests(count = 8, maxTrack = 200) {
  const seq = []
  for (let i = 0; i < count; i++) {
    seq.push(Math.floor(Math.random() * maxTrack))
  }
  return seq
}

/**
 * 教材经典示例
 */
export function getPresetRequests() {
  return [98, 183, 37, 122, 14, 124, 65, 67]
}
