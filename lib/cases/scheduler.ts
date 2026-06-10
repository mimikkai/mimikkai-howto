export interface Scheduler {
  runIdRef: { current: number }
  scheduledTimers: Set<ReturnType<typeof setTimeout>>
  scheduledIntervals: Set<ReturnType<typeof setInterval>>
  scheduledRafs: Set<number>
  cancelAll: () => void
  schedule: (fn: () => void, ms: number) => void
  trackInterval: (id: ReturnType<typeof setInterval>) => void
  trackTimer: (id: ReturnType<typeof setTimeout>) => void
  tweenProgress: (
    from: number,
    to: number,
    durationMs: number,
    onUpdate: (v: number) => void,
    onDone?: () => void
  ) => void
  isStale: (myRunId: number) => boolean
  nextRunId: () => number
}

export interface SchedulerLogger {
  debug: (msg: string, data?: Record<string, unknown>) => void
}

export function createScheduler(logger?: SchedulerLogger): Scheduler {
  const runIdRef = { current: 0 }
  const scheduledTimers = new Set<ReturnType<typeof setTimeout>>()
  const scheduledIntervals = new Set<ReturnType<typeof setInterval>>()
  const scheduledRafs = new Set<number>()

  const log = (
    msg: string,
    data?: Record<string, unknown>
  ) => {
    if (process.env.NODE_ENV !== "production" && logger) {
      logger.debug(msg, data)
    }
  }

  const cancelAll = () => {
    log("[scheduler] cancel all", {
      timers: scheduledTimers.size,
      intervals: scheduledIntervals.size,
      rafs: scheduledRafs.size,
    })
    for (const t of scheduledTimers) clearTimeout(t)
    for (const i of scheduledIntervals) clearInterval(i)
    for (const r of scheduledRafs) cancelAnimationFrame(r)
    scheduledTimers.clear()
    scheduledIntervals.clear()
    scheduledRafs.clear()
  }

  const trackTimer = (id: ReturnType<typeof setTimeout>) => {
    scheduledTimers.add(id)
  }
  const trackInterval = (id: ReturnType<typeof setInterval>) => {
    scheduledIntervals.add(id)
  }

  const isStale = (myRunId: number) => myRunId !== runIdRef.current

  const nextRunId = () => {
    runIdRef.current = runIdRef.current + 1
    return runIdRef.current
  }

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      scheduledTimers.delete(t)
      fn()
    }, ms)
    scheduledTimers.add(t)
  }

  const tweenProgress = (
    from: number,
    to: number,
    durationMs: number,
    onUpdate: (v: number) => void,
    onDone?: () => void
  ) => {
    if (durationMs <= 0) {
      onUpdate(to)
      onDone?.()
      return
    }
    const start = performance.now()
    const myRunId = runIdRef.current
    const tick = (now: number) => {
      if (myRunId !== runIdRef.current) return
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const value = from + (to - from) * eased
      onUpdate(value)
      if (t < 1) {
        const id = requestAnimationFrame(tick)
        scheduledRafs.add(id)
      } else {
        log("[scheduler] tween done", { from, to, durationMs })
        onDone?.()
      }
    }
    const id = requestAnimationFrame(tick)
    scheduledRafs.add(id)
  }

  return {
    runIdRef,
    scheduledTimers,
    scheduledIntervals,
    scheduledRafs,
    cancelAll,
    schedule,
    trackInterval,
    trackTimer,
    tweenProgress,
    isStale,
    nextRunId,
  }
}
