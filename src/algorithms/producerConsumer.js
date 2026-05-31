/**
 * 生产者-消费者同步模拟
 * 用状态机模拟多线程并发（JavaScript 单线程限制）
 *
 * config: { bufferSize, numProducers, numConsumers, continuousN, maxSteps }
 * 返回 states[] 供可视化逐帧播放
 */

export function simulate(config) {
  const {
    bufferSize = 5,
    numProducers = 2,
    numConsumers = 2,
    continuousN = 3,
    maxSteps = 50,
  } = config

  const states = []

  // 信号量
  let empty = bufferSize // 空闲缓冲区数
  let full = 0 // 已占用缓冲区数
  let mutex = 1 // 互斥信号量

  // 缓冲区：null=空，number=产品编号
  const buffer = new Array(bufferSize).fill(null)

  // 生产者状态
  const producers = []
  for (let i = 0; i < numProducers; i++) {
    producers.push({
      id: i,
      state: 'idle', // idle | producing | waiting_empty | waiting_mutex | done
      progress: 0, // 生产进度
    })
  }

  // 消费者状态
  const consumers = []
  const consumerCount = new Array(numConsumers).fill(0) // 每个消费者已连续取的产品数
  for (let i = 0; i < numConsumers; i++) {
    consumers.push({
      id: i,
      state: 'idle', // idle | consuming | waiting_full | waiting_mutex | waiting_turn | done
      progress: 0,
    })
  }

  let totalProduced = 0
  let totalConsumed = 0
  let stepNum = 0
  let log = []

  // 当前占有 mutex 的生产者/消费者
  let mutexHolder = null // { type: 'producer'|'consumer', id }

  function snapshot(action) {
    states.push({
      step: stepNum,
      buffer: [...buffer],
      empty,
      full,
      mutex,
      producers: producers.map((p) => ({ ...p })),
      consumers: consumers.map((c) => ({ ...c })),
      consumerCount: [...consumerCount],
      log: [...log],
      action,
      totalProduced,
      totalConsumed,
    })
    log = []
  }

  snapshot('初始状态')

  while (stepNum < maxSteps) {
    stepNum++
    let acted = false

    // 随机选择一个可行动的生产者或消费者
    const candidates = []

    // 生产者候选
    for (const p of producers) {
      if (p.state === 'idle') {
        candidates.push({ type: 'producer', id: p.id, action: 'start' })
      } else if (p.state === 'waiting_empty') {
        candidates.push({ type: 'producer', id: p.id, action: 'try_empty' })
      } else if (p.state === 'waiting_mutex') {
        candidates.push({ type: 'producer', id: p.id, action: 'try_mutex' })
      }
    }

    // 消费者候选
    for (const c of consumers) {
      if (c.state === 'idle') {
        candidates.push({ type: 'consumer', id: c.id, action: 'start' })
      } else if (c.state === 'waiting_full') {
        candidates.push({ type: 'consumer', id: c.id, action: 'try_full' })
      } else if (c.state === 'waiting_mutex') {
        candidates.push({ type: 'consumer', id: c.id, action: 'try_mutex' })
      } else if (c.state === 'waiting_turn') {
        // 检查是否可以继续（同一消费者连续取）
        candidates.push({ type: 'consumer', id: c.id, action: 'try_turn' })
      }
    }

    if (candidates.length === 0) {
      // 所有人都完成或阻塞，死锁
      log.push(`[步骤 ${stepNum}] 所有线程阻塞，模拟结束`)
      snapshot('死锁/结束')
      break
    }

    // 随机选择一个候选
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]

    if (chosen.type === 'producer') {
      const p = producers[chosen.id]

      if (chosen.action === 'start') {
        p.state = 'waiting_empty'
        p.progress = 0
        log.push(`生产者 P${chosen.id} 准备生产，等待 empty 信号量`)

      } else if (chosen.action === 'try_empty') {
        if (empty > 0) {
          empty--
          p.state = 'waiting_mutex'
          log.push(`生产者 P${chosen.id} 获取 empty (empty=${empty})，等待 mutex`)
        }

      } else if (chosen.action === 'try_mutex') {
        if (mutex > 0 && mutexHolder === null) {
          mutex--
          mutexHolder = { type: 'producer', id: chosen.id }
          p.state = 'done'
          p.progress = 100

          // 放入产品
          const slot = buffer.indexOf(null)
          if (slot !== -1) {
            totalProduced++
            buffer[slot] = totalProduced
            log.push(`生产者 P${chosen.id} 放入产品 #${totalProduced} 到位置 ${slot}`)
          }

          // 释放 mutex
          mutex++
          mutexHolder = null
          // 释放 full
          full++
          log.push(`生产者 P${chosen.id} 释放 mutex，signal full (full=${full})`)

          p.state = 'idle'
          p.progress = 0
          acted = true
        }
      }

    } else if (chosen.type === 'consumer') {
      const c = consumers[chosen.id]

      if (chosen.action === 'start') {
        // 检查是否有消费者正在连续取
        const anyConsuming = consumers.some(
          (oc, idx) => idx !== chosen.id && oc.state !== 'idle' && oc.state !== 'done'
        )

        // 检查该消费者是否已经在连续取中
        if (consumerCount[chosen.id] > 0) {
          c.state = 'waiting_turn'
          log.push(`消费者 C${chosen.id} 继续连续取 (${consumerCount[chosen.id]}/${continuousN})`)
        } else {
          c.state = 'waiting_full'
          log.push(`消费者 C${chosen.id} 准备消费，等待 full 信号量`)
        }

      } else if (chosen.action === 'try_full') {
        if (full > 0) {
          full--
          c.state = 'waiting_mutex'
          log.push(`消费者 C${chosen.id} 获取 full (full=${full})，等待 mutex`)
        }

      } else if (chosen.action === 'try_mutex') {
        if (mutex > 0 && mutexHolder === null) {
          mutex--
          mutexHolder = { type: 'consumer', id: chosen.id }

          // 取出产品
          const slot = buffer.findIndex((v) => v !== null)
          if (slot !== -1) {
            const product = buffer[slot]
            buffer[slot] = null

            // 模拟消费需要时间
            log.push(`消费者 C${chosen.id} 从位置 ${slot} 取出产品 #${product}`)

            consumerCount[chosen.id]++
            c.progress = Math.round((consumerCount[chosen.id] / continuousN) * 100)

            // 释放 mutex
            mutex++
            mutexHolder = null
            // 释放 empty
            empty++
            log.push(`消费者 C${chosen.id} 释放 mutex，signal empty (empty=${empty})`)

            if (consumerCount[chosen.id] >= continuousN) {
              // 完成连续取 n 个
              consumerCount[chosen.id] = 0
              c.state = 'idle'
              c.progress = 0
              totalConsumed += continuousN
              log.push(`消费者 C${chosen.id} 完成连续取 ${continuousN} 个`)
            } else {
              // 继续取
              c.state = 'waiting_turn'
              log.push(`消费者 C${chosen.id} 还需取 ${continuousN - consumerCount[chosen.id]} 个`)
            }
            acted = true
          }
        }

      } else if (chosen.action === 'try_turn') {
        c.state = 'waiting_full'
        log.push(`消费者 C${chosen.id} 等待 full 继续取`)
      }
    }

    if (acted) {
      snapshot(`步骤 ${stepNum}: ${log[log.length - 1]}`)
    }
  }

  return {
    states,
    stats: { totalProduced, totalConsumed },
  }
}
