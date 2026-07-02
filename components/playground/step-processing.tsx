"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { createScheduler } from "@/lib/cases/scheduler"
import type { MimModule, MimEntry, MimEntryValue } from "@/lib/playground/types"

interface StepProcessingProps {
  mim: MimModule
  onBack: () => void
}

interface LogLine {
  id: string
  role: "agent" | "system" | "divider"
  content: string
}

type BrowserPhase = "idle" | "loading" | "search" | "typing" | "form" | "form_filling" | "submit" | "result" | "done"

interface BrowserState {
  phase: BrowserPhase
  action: string
  subPhase: number
}

const POSITIVE_WORDS = ["отлично", "супер", "рекомендую", "классный", "быстрая", "качественный", "надёжно", "приветлив"]
const NEGATIVE_WORDS = ["ужасно", "отвратительно", "никогда", "разочарована", "зависла", "ошибка"]

function detectTone(text: string): { tone: string; score: number; issue: string } {
  const lower = text.toLowerCase()
  const hasPos = POSITIVE_WORDS.some((w) => lower.includes(w))
  const hasNeg = NEGATIVE_WORDS.some((w) => lower.includes(w))

  if (hasPos && !hasNeg) return { tone: "позитивная", score: 9, issue: "Быстрая доставка и качественный товар" }
  if (hasNeg && !hasPos) return { tone: "негативная", score: 2, issue: "Проблема с комплектацией и долгий ответ поддержки" }
  if (hasPos && hasNeg) return { tone: "нейтральная", score: 5, issue: "Смешанные впечатления — есть и плюсы, и минусы" }
  if (text.length < 20) return { tone: "нейтральная", score: 5, issue: "Короткий отзыв без выраженной тональности" }
  return { tone: "нейтральная", score: 6, issue: "Стандартный отзыв без ярких эмоций" }
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  action: "",
  subPhase: 0,
}

interface BrowserActionDef {
  steps: string[]
  page: "dashboard" | "form" | "search" | "list"
}

const BROWSER_ACTIONS: BrowserActionDef[] = [
  {
    steps: ["Открываю панель управления", "Открываю раздел отзывов", "Обрабатываю раздел отзывов"],
    page: "dashboard",
  },
  {
    steps: ["Открываю сайт", "Открываю форму создания агента", "Анализирую форму"],
    page: "form",
  },
  {
    steps: ["Открываю базу отзывов", "Открываю раздел анализа", "Обрабатываю раздел анализа"],
    page: "search",
  },
  {
    steps: ["Открываю панель агента", "Открываю раздел запуска", "Анализирую панель запуска"],
    page: "list",
  },
]

function SkeletonBlock({ w, h = "h-2.5", rounded = "rounded" }: { w: string; h?: string; rounded?: string }) {
  return <div className={`${h} ${w} ${rounded} bg-muted animate-pulse`} />
}

function SkeletonCircle({ size = "size-6" }: { size?: string }) {
  return <div className={`${size} rounded-full bg-muted animate-pulse`} />
}

function BrowserPageDashboard({ phase, subPhase }: { phase: BrowserPhase; subPhase: number }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 mb-1">
        <SkeletonCircle size="size-5" />
        <SkeletonBlock w="w-24" />
        <div className="flex-1" />
        <SkeletonBlock w="w-8" />
        <SkeletonCircle size="size-5" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock w="w-full" h="h-7" rounded="rounded-md" />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-md border border-muted/60 p-2 flex flex-col gap-1.5">
            <SkeletonBlock w="w-10" h="h-1.5" />
            <SkeletonBlock w={i === 0 ? "w-16" : i === 1 ? "w-12" : "w-14"} h="h-4" />
            {phase !== "loading" && <SkeletonBlock w="w-8" h="h-1.5" />}
          </div>
        ))}
      </div>
      <div className="mt-1 rounded-md border border-muted/60 p-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <SkeletonBlock w="w-20" h="h-2" />
          <div className="flex-1" />
          <SkeletonBlock w="w-14" h="h-2" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <SkeletonCircle size="size-3" />
            <SkeletonBlock w={`w-${["full", "4/5", "3/4", "2/3"][i]}`} h="h-2" />
          </div>
        ))}
      </div>
      {subPhase >= 1 && (
        <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-2 flex flex-col gap-1.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <SkeletonBlock w="w-28" h="h-2" rounded="rounded-sm" />
          </div>
          <SkeletonBlock w="w-full" h="h-2" rounded="rounded-sm" />
          <SkeletonBlock w="w-3/5" h="h-2" rounded="rounded-sm" />
        </div>
      )}
    </div>
  )
}

function BrowserPageForm({ phase, subPhase }: { phase: BrowserPhase; subPhase: number }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 mb-1">
        <SkeletonBlock w="w-20" h="h-3" />
        <div className="flex-1" />
        <SkeletonBlock w="w-12" h="h-3" />
      </div>
      <div className="rounded-md border border-muted/60 p-2.5 flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => {
          const isFilled = subPhase >= 1 && i < Math.min(subPhase, 3)
          const isActive = subPhase >= 1 && i === Math.min(subPhase - 1, 2)
          return (
            <div key={i} className="flex flex-col gap-1">
              <SkeletonBlock w={["w-16", "w-20", "w-24", "w-12"][i]} h="h-1.5" />
              {isFilled ? (
                <div className={`h-3 rounded-sm ${isActive ? "bg-primary/20 animate-pulse" : "bg-primary/10"}`} style={{ width: ["70%", "85%", "60%", "50%"][i] }} />
              ) : (
                <SkeletonBlock w="w-full" h="h-3" rounded="rounded-sm" />
              )}
            </div>
          )
        })}
        {subPhase >= 3 && (
          <div className="flex justify-end mt-1">
            <div className="h-4 w-16 rounded-md bg-primary/30 animate-pulse" />
          </div>
        )}
      </div>
      {subPhase >= 2 && (
        <div className="rounded-md border border-muted/60 p-2 flex flex-col gap-1.5 animate-in fade-in duration-300">
          <SkeletonBlock w="w-14" h="h-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-3 rounded-sm border border-muted/60" />
              <SkeletonBlock w={`w-${["2/3", "1/2", "3/5"][i]}`} h="h-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BrowserPageSearch({ phase, subPhase }: { phase: BrowserPhase; subPhase: number }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 mb-1">
        <SkeletonCircle size="size-4" />
        <SkeletonBlock w="w-28" h="h-3" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border border-muted/60 px-2 py-1.5 flex items-center gap-1.5">
          {subPhase >= 1 ? (
            <>
              {Array.from({ length: 8 + Math.min(subPhase, 6) }).map((_, i) => (
                <div key={i} className="size-1.5 rounded-sm bg-primary/40" />
              ))}
              <div className="size-0.5 bg-primary animate-pulse" />
            </>
          ) : (
            <SkeletonBlock w="w-2/3" h="h-2" rounded="rounded-sm" />
          )}
        </div>
        <div className="h-5 w-10 rounded-md bg-primary/20" />
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {Array.from({ length: 3 }).map((_, i) => {
          const isActive = subPhase >= 2 && i === 0
          return (
            <div key={i} className={`rounded-md border p-2 flex flex-col gap-1.5 transition-colors ${isActive ? "border-primary/40 bg-primary/5" : "border-muted/60"}`}>
              <div className="flex items-center gap-1.5">
                <SkeletonBlock w="w-3/5" h="h-2" />
              </div>
              <SkeletonBlock w="w-full" h="h-1.5" />
              <SkeletonBlock w="w-4/5" h="h-1.5" />
              {isActive && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="size-2 rounded-sm bg-primary/30" />
                  <SkeletonBlock w="w-1/3" h="h-1.5" rounded="rounded-sm" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BrowserPageList({ phase, subPhase }: { phase: BrowserPhase; subPhase: number }) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 mb-1">
        <SkeletonBlock w="w-24" h="h-3" />
        <div className="flex-1" />
        <SkeletonBlock w="w-16" h="h-3" />
      </div>
      <div className="rounded-md border border-muted/60 overflow-hidden">
        <div className="flex border-b bg-muted/30 px-2 py-1 gap-2">
          <SkeletonBlock w="w-6" h="h-1.5" rounded="rounded-sm" />
          <SkeletonBlock w="w-16" h="h-1.5" rounded="rounded-sm" />
          <SkeletonBlock w="w-12" h="h-1.5" rounded="rounded-sm" />
          <div className="flex-1" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => {
          const isProcessing = subPhase >= 1 && i === Math.min(subPhase - 1, 4)
          const isDone = subPhase >= 2 && i < Math.min(subPhase - 2, 4)
          return (
            <div key={i} className={`flex items-center gap-2 border-b px-2 py-1.5 transition-colors ${isDone ? "bg-emerald-500/5" : isProcessing ? "bg-amber-500/5" : ""}`}>
              <div className={`size-2 rounded-full ${isDone ? "bg-emerald-500" : isProcessing ? "bg-amber-500 animate-pulse" : "bg-muted"}`} />
              <SkeletonBlock w="w-16" h="h-2" rounded="rounded-sm" />
              <SkeletonBlock w="w-12" h="h-2" rounded="rounded-sm" />
              <div className="flex-1" />
              {isProcessing && <div className="size-3 rounded-sm bg-amber-500/30 animate-pulse" />}
              {isDone && <div className="size-3 rounded-sm bg-emerald-500/30" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BrowserPageContent({ phase, subPhase, page }: { phase: BrowserPhase; subPhase: number; page: BrowserActionDef["page"] }) {
  switch (page) {
    case "dashboard":
      return <BrowserPageDashboard phase={phase} subPhase={subPhase} />
    case "form":
      return <BrowserPageForm phase={phase} subPhase={subPhase} />
    case "search":
      return <BrowserPageSearch phase={phase} subPhase={subPhase} />
    case "list":
      return <BrowserPageList phase={phase} subPhase={subPhase} />
  }
}

export function StepProcessing({ mim, onBack }: StepProcessingProps) {
  const [rows, setRows] = React.useState<MimEntry[]>(() =>
    mim.entry.map((e, i) => ({ ...e, id: i, status: "ожидает" }))
  )
  const [isRunning, setIsRunning] = React.useState(false)
  const [isDone, setIsDone] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(-1)
  const [logs, setLogs] = React.useState<LogLine[]>([])
  const [browser, setBrowser] = React.useState<BrowserState>(IDLE_BROWSER)
  const [browserSubPhase, setBrowserSubPhase] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const rowsRef = React.useRef(rows)
  const isRunningRef = React.useRef(isRunning)
  const currentIndexRef = React.useRef(currentIndex)
  const schedulerRef = React.useRef<ReturnType<typeof createScheduler> | null>(null)
  if (schedulerRef.current === null) {
    schedulerRef.current = createScheduler({
      debug: (msg, data) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[playground:step-processing] scheduler", { msg, ...data })
        }
      },
    })
  }
  const scheduler = schedulerRef.current

  React.useEffect(() => {
    rowsRef.current = rows
  }, [rows])
  React.useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])
  React.useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  React.useEffect(() => {
    return () => scheduler.cancelAll()
  }, [scheduler])

  const outputColumns = mim.outputColumns
  const totalRows = mim.entry.length
  const processedCount = rows.filter((r) => r.status === "готово").length
  const progress = Math.round((processedCount / totalRows) * 100)

  const addLog = React.useCallback(
    (role: LogLine["role"], content: string) => {
      setLogs((prev) => [...prev, { id: crypto.randomUUID(), role, content }])
    },
    []
  )

  React.useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [logs])

  const processNextRef = React.useRef<() => void>(() => {})

  const processNext = React.useCallback(() => {
    if (!isRunningRef.current) return
    const nextIdx = currentIndexRef.current + 1
    if (nextIdx >= totalRows) {
      setIsRunning(false)
      setIsDone(true)
      setBrowser({ ...IDLE_BROWSER, phase: "done" })
      addLog("system", "✅ Все строки обработаны.")
      return
    }

    setCurrentIndex(nextIdx)
    const row = rowsRef.current[nextIdx]
    const myRunId = scheduler.nextRunId()
    const actionIdx = nextIdx % BROWSER_ACTIONS.length

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[playground:step-processing] row start", {
        rowIndex: nextIdx,
      })
    }

    schedule(() => {
      setRows((prev) =>
        prev.map((r, i) => (i === nextIdx ? { ...r, status: "обработка" } : r))
      )
      setBrowserSubPhase(0)
      setBrowser({ phase: "loading", action: BROWSER_ACTIONS[actionIdx].steps[0], subPhase: 0 })
      addLog("divider", `Строка ${nextIdx + 1}`)
      addLog("agent", `🌐 ${BROWSER_ACTIONS[actionIdx].steps[0]}`)
    }, 0)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "search",
        action: BROWSER_ACTIONS[actionIdx].steps[1],
        subPhase: 0,
      }))
      setBrowserSubPhase(0)
      addLog("agent", `📂 ${BROWSER_ACTIONS[actionIdx].steps[1]}`)
    }, 500)

    schedule(() => {
      setBrowserSubPhase(1)
      setBrowser((prev) => ({ ...prev, subPhase: 1 }))
    }, 900)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, action: BROWSER_ACTIONS[actionIdx].steps[2] }))
      setBrowserSubPhase(2)
      setBrowser((prev) => ({ ...prev, subPhase: 2 }))
      addLog("agent", `🔍 ${BROWSER_ACTIONS[actionIdx].steps[2]}`)
    }, 1300)

    schedule(() => {
      const inputText = String(row[mim.inputColumns[1]?.id ?? mim.inputColumns[0].id] ?? "")
      setBrowser((prev) => ({ ...prev, phase: "typing", action: `Ввожу данные для анализа`, subPhase: 0 }))
      setBrowserSubPhase(0)
      addLog("agent", `⌨️ Ввожу данные: "${inputText.slice(0, 40)}${inputText.length > 40 ? "…" : ""}"`)
    }, 1700)

    schedule(() => {
      setBrowserSubPhase(1)
      setBrowser((prev) => ({ ...prev, subPhase: 1 }))
    }, 2000)

    schedule(() => {
      setBrowserSubPhase(2)
      setBrowser((prev) => ({ ...prev, subPhase: 2 }))
    }, 2300)

    schedule(() => {
      const inputText = String(row[mim.inputColumns[1]?.id ?? mim.inputColumns[0].id] ?? "")
      setBrowser((prev) => ({ ...prev, phase: "form", action: `Анализирую текст отзыва`, subPhase: 0 }))
      setBrowserSubPhase(0)
      addLog("agent", `📖 Анализирую: "${inputText.slice(0, 60)}${inputText.length > 60 ? "…" : ""}"`)
    }, 2600)

    schedule(() => {
      setBrowserSubPhase(1)
      setBrowser((prev) => ({ ...prev, subPhase: 1 }))
    }, 2900)

    schedule(() => {
      setBrowserSubPhase(2)
      setBrowser((prev) => ({ ...prev, subPhase: 2 }))
    }, 3100)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "form_filling", subPhase: 3 }))
      setBrowserSubPhase(3)
      addLog("agent", `📝 Заполняю поля результата…`)
    }, 3400)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "submit", action: "Отправляю результат…" }))
      addLog("agent", `📤 Отправляю данные…`)
    }, 3800)

    schedule(() => {
      const inputText = String(row[mim.inputColumns[1]?.id ?? mim.inputColumns[0].id] ?? "")
      const { tone, score, issue } = detectTone(inputText)
      const fields: Record<string, MimEntryValue> = {}
      if (outputColumns[0]) fields[outputColumns[0].id] = tone
      if (outputColumns[1]) fields[outputColumns[1].id] = score
      if (outputColumns[2]) fields[outputColumns[2].id] = issue

      setRows((prev) =>
        prev.map((r, i) =>
          i === nextIdx ? { ...r, ...fields, status: "готово" } : r
        )
      )
      setBrowser((prev) => ({ ...prev, phase: "result", action: `Результат: ${tone}, ${score}/10` }))
      addLog("agent", `✨ update_entry_fields("entry-${nextIdx}", ${JSON.stringify(fields)})`)
    }, 4100)

    schedule(() => {
      processNextRef.current()
    }, 4600)
  }, [totalRows, addLog, mim.inputColumns, outputColumns, scheduler])

  React.useEffect(() => {
    processNextRef.current = processNext
  }, [processNext])

  const handleStart = React.useCallback(() => {
    if (isRunning) return
    scheduler.cancelAll()
    scheduler.nextRunId()
    setLogs([{ id: crypto.randomUUID(), role: "system" as const, content: `🚀 Запуск агента «${mim.name}»` }])
    setIsRunning(true)
    setIsDone(false)
    setCurrentIndex(-1)
    setBrowserSubPhase(0)
    setRows(mim.entry.map((e, i) => ({ ...e, id: i, status: "ожидает" })))
    setBrowser(IDLE_BROWSER)
    setTimeout(() => processNextRef.current(), 300)
  }, [isRunning, mim.entry, mim.name, scheduler])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[playground:step-processing] render", {
        isRunning,
        isDone,
        currentIndex,
        processedCount,
      })
    }
  }, [isRunning, isDone, currentIndex, processedCount])

  const visibleCols = mim.columns.slice(0, 5)

  const phaseLabel: Record<BrowserPhase, string> = {
    idle: "Ожидание",
    loading: "Загрузка…",
    search: "Поиск…",
    typing: "Ввод данных…",
    form: "Анализ…",
    form_filling: "Заполнение…",
    submit: "Отправка…",
    result: "Результат",
    done: "Готово",
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 4 из 4</Badge>
        <h2 className="text-lg font-semibold">Обработка агентом</h2>
      </div>

      {(isRunning || isDone) && (
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {processedCount}/{totalRows} строк
          </span>
        </div>
      )}

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-h-0 flex flex-col lg:col-span-1">
          <CardHeader className="shrink-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="text-sm">🌐</span>
              Веб-браузер
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 pb-3">
            <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1">
              <span className={`inline-flex size-2 rounded-full ${browser.phase === "loading" ? "animate-pulse bg-amber-500" : browser.phase === "done" ? "bg-emerald-500" : browser.phase === "idle" ? "bg-gray-400" : browser.phase === "submit" ? "animate-pulse bg-blue-500" : "bg-blue-500"}`} />
              <span className="flex-1 truncate text-xs text-muted-foreground">
                {browser.action || (browser.phase === "idle" ? "Ожидание" : "…")}
              </span>
            </div>
            <div className="flex-1 overflow-hidden rounded-md border bg-white dark:bg-zinc-900">
              <div className="border-b bg-muted/30 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                  </div>
                  <div className="flex gap-1 ml-auto">
                    <div className="size-3.5 rounded bg-muted/60 flex items-center justify-center text-[6px] text-muted-foreground">←</div>
                    <div className="size-3.5 rounded bg-muted/60 flex items-center justify-center text-[6px] text-muted-foreground">→</div>
                    <div className="size-3.5 rounded bg-muted/60 flex items-center justify-center text-[6px] text-muted-foreground">↻</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col p-0 min-h-[200px]">
                {browser.phase === "idle" && (
                  <div className="flex flex-col items-center justify-center gap-3 p-4 min-h-[200px]">
                    <div className="text-3xl">🌐</div>
                    <p className="text-xs text-muted-foreground">
                      Агент начнёт работу после запуска
                    </p>
                  </div>
                )}
                {browser.phase === "loading" && (
                  <div className="flex flex-col items-center justify-center gap-3 p-4 min-h-[200px]">
                    <div className="inline-flex size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">
                      Загрузка страницы…
                    </p>
                  </div>
                )}
                {(browser.phase === "search" || browser.phase === "typing" || browser.phase === "form" || browser.phase === "form_filling" || browser.phase === "submit" || browser.phase === "result") && (
                  <BrowserPageContent
                    phase={browser.phase}
                    subPhase={browserSubPhase}
                    page={BROWSER_ACTIONS[currentIndex >= 0 ? currentIndex % BROWSER_ACTIONS.length : 0].page}
                  />
                )}
                {browser.phase === "done" && !isRunning && isDone && (
                  <div className="flex flex-col items-center justify-center gap-3 p-4 min-h-[200px]">
                    <div className="text-3xl">✅</div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Обработка завершена
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Все строки обработаны
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{phaseLabel[browser.phase]}</span>
              {browser.phase !== "idle" && browser.phase !== "done" && browser.action && (
                <span className="truncate max-w-[60%]">{browser.action}</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 flex flex-col lg:col-span-2">
          <CardHeader className="shrink-0">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Данные</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {processedCount}/{totalRows}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 flex flex-col pb-3">
            <ScrollArea className="flex-1">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-8 px-2 py-2 font-medium">#</th>
                    {visibleCols.map((col) => (
                      <th
                        key={col.id}
                        className={`px-2 py-2 font-medium ${col.kind === "output" ? "hidden lg:table-cell" : ""}`}
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">{col.id}</span>{" "}
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b transition-all duration-500 ${
                        row.status === "обработка"
                          ? "bg-amber-500/10"
                          : row.status === "готово"
                            ? "bg-purple-500/15"
                            : ""
                      }`}
                    >
                      <td className="px-2 py-2 text-muted-foreground">
                        {row.status === "готово" ? (
                          <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                        ) : (
                          <span>{row.id + 1}</span>
                        )}
                      </td>
                      {visibleCols.map((col) => {
                        const v = row[col.id]
                        const isOutput = col.kind === "output"
                        const hasValue = v !== null && v !== undefined && v !== ""
                        return (
                          <td key={col.id} className={`px-2 py-2 ${isOutput && !hasValue ? "hidden lg:table-cell" : ""}`}>
                            {isOutput && row.status === "готово" && hasValue ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 text-purple-700 dark:text-purple-300 font-semibold text-[11px]">
                                <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓</span>
                                {String(v)}
                              </span>
                            ) : isOutput && row.status === "готово" && !hasValue ? (
                              <span className="text-muted-foreground">—</span>
                            ) : isOutput ? (
                              <span className="text-muted-foreground/50">—</span>
                            ) : hasValue ? (
                              <span className="max-w-[180px] truncate inline-block text-foreground">
                                {String(v)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="min-h-0 flex flex-col" style={{ maxHeight: "200px" }}>
        <CardHeader className="shrink-0 py-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              AI
            </span>
            Лог агента
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden pb-2">
          <ScrollArea ref={scrollRef} className="h-full">
            <div className="flex flex-col gap-1 pr-4">
              {logs.length === 0 && !isRunning && !isDone && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Нажмите «Запустить агента», чтобы начать обработку
                </p>
              )}
              {logs.map((line) => (
                <div key={line.id}>
                  {line.role === "divider" ? (
                    <div className="my-1 flex items-center gap-2 text-[10px] font-medium uppercase text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      <span>{line.content}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  ) : line.role === "system" ? (
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      {line.content}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted px-3 py-1.5 text-xs whitespace-pre-wrap break-all">
                      {line.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        {!isRunning && !isDone && (
          <Button size="lg" className="gap-2" onClick={handleStart}>
            <span>🚀</span> Запустить агента
          </Button>
        )}
        {isRunning && (
          <Button size="lg" disabled className="gap-2">
            <span className="inline-flex size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Обработка…
          </Button>
        )}
        {isDone && (
          <Button size="lg" variant="outline" className="gap-2" onClick={handleStart}>
            ↺ Запустить заново
          </Button>
        )}
      </div>
    </div>
  )
}