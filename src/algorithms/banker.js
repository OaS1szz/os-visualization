/**
 * 银行家算法 — 死锁避免
 */

/**
 * 安全性检查
 * @param {number[][]} max - 最大需求矩阵 [n][m]
 * @param {number[][]} allocation - 已分配矩阵 [n][m]
 * @param {number[]} available - 可用资源向量 [m]
 * @returns {{ safe: boolean, sequence: number[], steps: object[] }}
 */
export function checkSafety(max, allocation, available) {
  const n = max.length
  const m = available.length

  // 计算 Need 矩阵
  const need = max.map((row, i) =>
    row.map((v, j) => v - allocation[i][j])
  )

  const work = [...available]
  const finish = new Array(n).fill(false)
  const sequence = []
  const steps = []

  let found = true
  while (found) {
    found = false
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // 检查 need[i] <= work
        const canAllocate = need[i].every((v, j) => v <= work[j])
        if (canAllocate) {
          // 假设进程 i 完成，释放资源
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j]
          }
          finish[i] = true
          sequence.push(i)
          steps.push({
            process: i,
            workBefore: work.map((v, j) => v - allocation[i][j]),
            workAfter: [...work],
            finished: [...finish],
          })
          found = true
          break
        }
      }
    }
  }

  const safe = finish.every((f) => f)

  return {
    safe,
    sequence: safe ? sequence : [],
    need,
    steps,
  }
}

/**
 * 请求资源
 * @param {number[][]} max
 * @param {number[][]} allocation
 * @param {number[]} available
 * @param {number} pid - 请求进程索引
 * @param {number[]} request - 请求资源向量 [m]
 * @returns {{ granted: boolean, safe: boolean, message: string, sequence: number[] }}
 */
export function requestResources(max, allocation, available, pid, request) {
  const n = max.length
  const m = available.length

  // 计算 Need
  const need = max.map((row, i) =>
    row.map((v, j) => v - allocation[i][j])
  )

  // 1. Request <= Need?
  for (let j = 0; j < m; j++) {
    if (request[j] > need[pid][j]) {
      return {
        granted: false,
        safe: false,
        message: `请求超过最大需求！need[${pid}][${j}]=${need[pid][j]}，请求=${request[j]}`,
        sequence: [],
      }
    }
  }

  // 2. Request <= Available?
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      return {
        granted: false,
        safe: false,
        message: `资源不足！available[${j}]=${available[j]}，请求=${request[j]}`,
        sequence: [],
      }
    }
  }

  // 3. 试探分配
  const newAllocation = allocation.map((row, i) =>
    i === pid ? row.map((v, j) => v + request[j]) : [...row]
  )
  const newAvailable = available.map((v, j) => v - request[j])

  // 4. 检查安全性
  const { safe, sequence } = checkSafety(max, newAllocation, newAvailable)

  if (safe) {
    return {
      granted: true,
      safe: true,
      message: '可以分配，系统仍处于安全状态',
      sequence,
    }
  } else {
    return {
      granted: false,
      safe: false,
      message: '分配后系统处于不安全状态，不予分配',
      sequence: [],
    }
  }
}

/**
 * 生成预设示例数据
 */
export function getPresetData() {
  const max = [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]
  const allocation = [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]
  const available = [3, 3, 2]
  return { max, allocation, available }
}
