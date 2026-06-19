/**
 * 纾佺洏绉昏噦璋冨害绠楁硶
 * 姣忎釜鍑芥暟杩斿洖 { order[], totalDistance, path[] }
 * order: 鍝嶅簲椤哄簭
 * path: [{ step, pos, target?, boundary? }] - 纾佸ご绉诲姩璺緞
 */

/**
 * SSTF 鈥?鏈€鐭閬撴椂闂翠紭鍏?
 */
export function sstf(requests, startPos) {
  const remaining = [...requests]
  const order = []
  const path = [{ step: 0, pos: startPos, target: null, boundary: false }]
  let currentPos = startPos
  let totalDistance = 0
  let stepCount = 0

  while (remaining.length > 0) {
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
    totalDistance += Math.abs(target - currentPos)
    currentPos = target
    order.push(target)
    stepCount++
    path.push({ step: stepCount, pos: currentPos, target, boundary: false })
    remaining.splice(minIndex, 1)
  }

  return { order, totalDistance, path }
}

/**
 * SCAN 鐢垫绠楁硶
 * @param {string} direction - 'up' 鎴? 'down'
 * @param {number} maxTrack - 鏈€澶х閬撳彿
 */
export function scan(requests, startPos, direction = 'up', maxTrack = 199) {
  const sorted = [...requests].sort((a, b) => a - b)
  const order = []
  const path = [{ step: 0, pos: startPos, target: null, boundary: false }]
  let currentPos = startPos
  let totalDistance = 0
  let stepCount = 0

  const greater = sorted.filter((track) => track >= currentPos)
  const less = sorted.filter((track) => track < currentPos)
  const route = []

  if (direction === 'up') {
    route.push(...greater.map((target) => ({ target, boundary: false })))
    if (currentPos !== maxTrack && less.length > 0) {
      route.push({ target: maxTrack, boundary: true })
    }
    route.push(...less.reverse().map((target) => ({ target, boundary: false })))
  } else {
    route.push(...less.reverse().map((target) => ({ target, boundary: false })))
    if (currentPos !== 0 && greater.length > 0) {
      route.push({ target: 0, boundary: true })
    }
    route.push(...greater.map((target) => ({ target, boundary: false })))
  }

  for (const point of route) {
    totalDistance += Math.abs(point.target - currentPos)
    currentPos = point.target
    stepCount++
    path.push({
      step: stepCount,
      pos: currentPos,
      target: point.boundary ? null : point.target,
      boundary: point.boundary,
    })
    if (!point.boundary) {
      order.push(point.target)
    }
  }

  return { order, totalDistance, path }
}

/**
 * 鐢熸垚闅忔満纾侀亾璇锋眰搴忓垪
 */
export function generateRandomRequests(count = 8, maxTrack = 200) {
  const seq = []
  for (let i = 0; i < count; i++) {
    seq.push(Math.floor(Math.random() * maxTrack))
  }
  return seq
}

/**
 * 鏁欐潗缁忓吀绀轰緥
 */
export function getPresetRequests() {
  return [98, 183, 37, 122, 14, 124, 65, 67]
}
