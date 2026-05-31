/**
 * 页面置换算法
 * 每个函数返回 { states[], totalFaults, faultRate }
 * states[i]: { step, refPage, memory[], fault, replacedPage? }
 */

/**
 * OPT — 最优置换
 */
export function opt(refSeq, frameCount) {
  const states = []
  const memory = []
  let totalFaults = 0

  for (let step = 0; step < refSeq.length; step++) {
    const refPage = refSeq[step]
    const index = memory.indexOf(refPage)

    if (index !== -1) {
      // 命中
      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: false,
        replacedPage: null,
      })
    } else {
      // 缺页
      totalFaults++
      let replacedPage = null

      if (memory.length < frameCount) {
        // 还有空闲块
        memory.push(refPage)
      } else {
        // 需要淘汰：找最晚使用或永不使用的页
        let farthest = -1
        let replaceIndex = 0

        for (let i = 0; i < memory.length; i++) {
          const page = memory[i]
          let nextUse = Infinity
          for (let j = step + 1; j < refSeq.length; j++) {
            if (refSeq[j] === page) {
              nextUse = j
              break
            }
          }
          if (nextUse > farthest) {
            farthest = nextUse
            replaceIndex = i
          }
        }

        replacedPage = memory[replaceIndex]
        memory[replaceIndex] = refPage
      }

      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: true,
        replacedPage,
      })
    }
  }

  return {
    states,
    totalFaults,
    faultRate: parseFloat(((totalFaults / refSeq.length) * 100).toFixed(1)),
  }
}

/**
 * LRU — 最近最久未使用
 */
export function lru(refSeq, frameCount) {
  const states = []
  const memory = [] // 按访问顺序，最近使用的在末尾
  let totalFaults = 0

  for (let step = 0; step < refSeq.length; step++) {
    const refPage = refSeq[step]
    const index = memory.indexOf(refPage)

    if (index !== -1) {
      // 命中：移到末尾（最近使用）
      memory.splice(index, 1)
      memory.push(refPage)
      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: false,
        replacedPage: null,
      })
    } else {
      // 缺页
      totalFaults++
      let replacedPage = null

      if (memory.length < frameCount) {
        memory.push(refPage)
      } else {
        // 淘汰队首（最久未使用）
        replacedPage = memory.shift()
        memory.push(refPage)
      }

      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: true,
        replacedPage,
      })
    }
  }

  return {
    states,
    totalFaults,
    faultRate: parseFloat(((totalFaults / refSeq.length) * 100).toFixed(1)),
  }
}

/**
 * FIFO — 先进先出
 */
export function fifo(refSeq, frameCount) {
  const states = []
  const memory = [] // 队列，队首是最早进入的
  let totalFaults = 0

  for (let step = 0; step < refSeq.length; step++) {
    const refPage = refSeq[step]
    const index = memory.indexOf(refPage)

    if (index !== -1) {
      // 命中
      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: false,
        replacedPage: null,
      })
    } else {
      // 缺页
      totalFaults++
      let replacedPage = null

      if (memory.length < frameCount) {
        memory.push(refPage)
      } else {
        replacedPage = memory.shift()
        memory.push(refPage)
      }

      states.push({
        step,
        refPage,
        memory: [...memory],
        fault: true,
        replacedPage,
      })
    }
  }

  return {
    states,
    totalFaults,
    faultRate: parseFloat(((totalFaults / refSeq.length) * 100).toFixed(1)),
  }
}

/**
 * 生成随机页面引用序列
 */
export function generateRandomSeq(length = 20, maxPage = 9) {
  const seq = []
  for (let i = 0; i < length; i++) {
    seq.push(Math.floor(Math.random() * (maxPage + 1)))
  }
  return seq
}

/**
 * 教材经典示例序列
 */
export function getPresetSeq() {
  return [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
}
