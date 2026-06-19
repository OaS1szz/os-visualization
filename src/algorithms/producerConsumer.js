/**
 * 生产者-消费者同步模拟
 * config: { bufferSize, numProducers, numConsumers, continuousN, maxSteps }
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
  let empty = bufferSize
  let full = 0
  let mutex = 1
  const buffer = new Array(bufferSize).fill(null)

  const producers = Array.from({ length: numProducers }, (_, id) => ({
    id,
    state: 'idle',
    progress: 0,
  }))

  const consumers = Array.from({ length: numConsumers }, (_, id) => ({
    id,
    state: 'idle',
    progress: 0,
  }))

  const consumerCount = new Array(numConsumers).fill(0)

  let totalProduced = 0
  let totalConsumed = 0
  let stepNum = 0
  let log = []
  let mutexHolder = null

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
    const candidates = []

    for (const p of producers) {
      if (p.state === 'idle') {
        candidates.push({ type: 'producer', id: p.id, action: 'start' })
      } else if (p.state === 'waiting_empty') {
        candidates.push({ type: 'producer', id: p.id, action: 'try_empty' })
      } else if (p.state === 'waiting_mutex') {
        candidates.push({ type: 'producer', id: p.id, action: 'try_mutex' })
      }
    }

    for (const c of consumers) {
      if (c.state === 'idle') {
        candidates.push({ type: 'consumer', id: c.id, action: 'start' })
      } else if (c.state === 'waiting_full') {
        candidates.push({ type: 'consumer', id: c.id, action: 'try_full' })
      } else if (c.state === 'waiting_mutex') {
        candidates.push({ type: 'consumer', id: c.id, action: 'try_mutex' })
      } else if (c.state === 'waiting_turn') {
        candidates.push({ type: 'consumer', id: c.id, action: 'try_turn' })
      }
    }

    if (candidates.length === 0) {
      log.push(`[步骤 ${stepNum}] 所有线程阻塞，模拟结束`)
      snapshot('死锁/结束')
      break
    }

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

          const slot = buffer.indexOf(null)
          if (slot !== -1) {
            totalProduced++
            buffer[slot] = totalProduced
            p.state = 'done'
            p.progress = 100
            log.push(`生产者 P${chosen.id} 放入产品 #${totalProduced} 到位置 ${slot}`)
          }

          mutex++
          mutexHolder = null
          full++
          log.push(`生产者 P${chosen.id} 释放 mutex，signal full (full=${full})`)

          p.state = 'idle'
          p.progress = 0
          acted = true
        }
      }
    } else {
      const c = consumers[chosen.id]

      if (chosen.action === 'start') {
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

          const slot = buffer.findIndex((v) => v !== null)
          if (slot !== -1) {
            const product = buffer[slot]
            buffer[slot] = null
            totalConsumed++
            log.push(`消费者 C${chosen.id} 从位置 ${slot} 取出产品 #${product}`)

            consumerCount[chosen.id]++
            c.progress = Math.round((consumerCount[chosen.id] / continuousN) * 100)

            mutex++
            mutexHolder = null
            empty++
            log.push(`消费者 C${chosen.id} 释放 mutex，signal empty (empty=${empty})`)

            if (consumerCount[chosen.id] >= continuousN) {
              consumerCount[chosen.id] = 0
              c.state = 'idle'
              c.progress = 0
              log.push(`消费者 C${chosen.id} 完成连续取 ${continuousN} 个`)
            } else {
              c.state = 'waiting_turn'
              log.push(`消费者 C${chosen.id} 还需取 ${continuousN - consumerCount[chosen.id]} 个`)
            }
            acted = true
          } else {
            mutex++
            mutexHolder = null
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
