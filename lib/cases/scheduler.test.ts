import { test } from "node:test"
import assert from "node:assert/strict"
import { createScheduler } from "./scheduler"

interface RafHandle {
  cancelled: boolean
  cb: (now: number) => void
  scheduledAt: number
}

function installRafMock() {
  const handles: RafHandle[] = []
  let nextId = 1
  let virtualNow = 0

  const originalRaf = globalThis.requestAnimationFrame
  const originalCaf = globalThis.cancelAnimationFrame
  const originalPerfNow = performance.now.bind(performance)
  performance.now = () => virtualNow

  globalThis.requestAnimationFrame = ((cb: (now: number) => void) => {
    const id = nextId++
    handles.push({ cancelled: false, cb, scheduledAt: virtualNow })
    return id
  }) as typeof globalThis.requestAnimationFrame

  globalThis.cancelAnimationFrame = ((id: number) => {
    const h = handles.find((x) => x !== undefined && handles.indexOf(x) + 1 === id)
    if (h) h.cancelled = true
  }) as typeof globalThis.cancelAnimationFrame

  return {
    tick(deltaMs: number) {
      virtualNow += deltaMs
      const due = handles.filter((h) => !h.cancelled && h.scheduledAt <= virtualNow)
      for (const h of due) {
        h.cancelled = true
        h.cb(virtualNow)
      }
    },
    restore() {
      globalThis.requestAnimationFrame = originalRaf
      globalThis.cancelAnimationFrame = originalCaf
      performance.now = originalPerfNow
    },
    pending() {
      return handles.filter((h) => !h.cancelled).length
    },
  }
}

test("tweenProgress animates monotonically from 0 to 100", () => {
  const raf = installRafMock()
  try {
    const scheduler = createScheduler()
    const values: number[] = []
    let done = false
    scheduler.tweenProgress(0, 100, 100, (v) => values.push(v), () => {
      done = true
    })

    raf.tick(25)
    assert.equal(values.length, 1)
    assert.ok(values[0] > 0 && values[0] < 100, `mid-1 should be between, got ${values[0]}`)

    raf.tick(25)
    assert.equal(values.length, 2)
    assert.ok(values[1] > values[0], `must be monotonic ascending`)

    raf.tick(50)
    assert.equal(done, true, "onDone should be called when tween completes")
    assert.equal(values[values.length - 1], 100, "last value should equal 'to'")
  } finally {
    raf.restore()
  }
})

test("tweenProgress with durationMs=0 fires onDone immediately with to-value", () => {
  const raf = installRafMock()
  try {
    const scheduler = createScheduler()
    const values: number[] = []
    let done = false
    scheduler.tweenProgress(0, 50, 0, (v) => values.push(v), () => {
      done = true
    })
    assert.equal(done, true)
    assert.deepEqual(values, [50])
  } finally {
    raf.restore()
  }
})

test("tweenProgress is no-op after cancelAll", () => {
  const raf = installRafMock()
  try {
    const scheduler = createScheduler()
    const values: number[] = []
    scheduler.tweenProgress(0, 100, 100, (v) => values.push(v))

    raf.tick(20)
    assert.equal(values.length, 1, "first frame should fire")
    const beforeCancel = values[0]

    scheduler.cancelAll()
    raf.tick(100)
    assert.equal(values.length, 1, "no frames after cancel")
    assert.equal(values[0], beforeCancel)
    assert.equal(raf.pending(), 0, "no rafs pending after cancel")
  } finally {
    raf.restore()
  }
})

test("schedule runs callback after delay; cancelAll prevents it", () => {
  const raf = installRafMock()
  const realSetTimeout = globalThis.setTimeout
  const realClearTimeout = globalThis.clearTimeout
  let pendingTimers = 0
  const fakeTimers = new Map<number, { cb: () => void; runAt: number }>()
  let nextId = 1
  let virtualTime = 0
  globalThis.setTimeout = ((cb: () => void, ms: number) => {
    const id = nextId++
    fakeTimers.set(id, { cb, runAt: virtualTime + ms })
    pendingTimers++
    return id as unknown as ReturnType<typeof setTimeout>
  }) as typeof setTimeout
  globalThis.clearTimeout = ((id: number) => {
    if (fakeTimers.delete(id)) pendingTimers--
  }) as typeof clearTimeout

  const flush = (until: number) => {
    virtualTime = until
    for (const [id, t] of [...fakeTimers.entries()]) {
      if (t.runAt <= virtualTime) {
        fakeTimers.delete(id)
        pendingTimers--
        t.cb()
      }
    }
  }

  try {
    const scheduler = createScheduler()
    let fired = false
    scheduler.schedule(() => {
      fired = true
    }, 50)
    assert.equal(fired, false, "should not fire before delay")
    assert.equal(pendingTimers, 1)

    scheduler.cancelAll()
    assert.equal(pendingTimers, 0, "cancelAll should clear pending timer")

    flush(1000)
    assert.equal(fired, false, "callback should not fire after cancel")
  } finally {
    globalThis.setTimeout = realSetTimeout
    globalThis.clearTimeout = realClearTimeout
    raf.restore()
  }
})

test("nextRunId increments and isStale detects outdated runId", () => {
  const scheduler = createScheduler()
  const id1 = scheduler.nextRunId()
  const id2 = scheduler.nextRunId()
  assert.ok(id2 > id1, "nextRunId should be strictly monotonic")
  assert.equal(scheduler.isStale(id1), true, "id1 should be stale after id2 was issued")
  assert.equal(scheduler.isStale(id2), false, "id2 should be current")
})

test("trackTimer + cancelAll cancels the tracked timer", () => {
  const realSetTimeout = globalThis.setTimeout
  const realClearTimeout = globalThis.clearTimeout
  let pendingTimers = 0
  const fakeTimers = new Map<number, { cb: () => void; runAt: number }>()
  let nextId = 1
  let virtualTime = 0
  globalThis.setTimeout = ((cb: () => void, ms: number) => {
    const id = nextId++
    fakeTimers.set(id, { cb, runAt: virtualTime + ms })
    pendingTimers++
    return id as unknown as ReturnType<typeof setTimeout>
  }) as typeof setTimeout
  globalThis.clearTimeout = ((id: number) => {
    if (fakeTimers.delete(id)) pendingTimers--
  }) as typeof clearTimeout

  const flush = (until: number) => {
    virtualTime = until
    for (const [id, t] of [...fakeTimers.entries()]) {
      if (t.runAt <= virtualTime) {
        fakeTimers.delete(id)
        pendingTimers--
        t.cb()
      }
    }
  }

  try {
    const scheduler = createScheduler()
    let fired = false
    const t = setTimeout(() => {
      fired = true
    }, 50)
    scheduler.trackTimer(t)
    scheduler.cancelAll()
    assert.equal(pendingTimers, 0, "tracked timer should be cleared by cancelAll")

    flush(1000)
    assert.equal(fired, false, "tracked timer should not fire after cancel")
  } finally {
    globalThis.setTimeout = realSetTimeout
    globalThis.clearTimeout = realClearTimeout
  }
})
