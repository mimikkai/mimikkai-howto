"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AgentLaunchToast, useAgentLaunchToast } from "@/components/agent-launch-toast"
import { THREADS_POSTS } from "../data"
import type { NormalizedBrowserPhase } from "../../types"
import { createScheduler } from "../../scheduler"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface ThreadsDataRow {
  id: number
  date: string
  postUrl: string
  postText: string
  comment: string
  status: "ожидает" | "обработка" | "Готово"
}

type LocalPhase =
  | "idle"
  | "threads_home"
  | "threads_search_click"
  | "threads_search_typing"
  | "threads_search_loading"
  | "threads_feed"
  | "threads_post_click"
  | "threads_post_open"
  | "threads_comment_click"
  | "threads_comment_typing"
  | "threads_comment_publish"
  | "threads_published"
  | "threads_check"
  | "writing"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  threads_home: "loading",
  threads_search_click: "loading",
  threads_search_typing: "typing",
  threads_search_loading: "loading",
  threads_feed: "results",
  threads_post_click: "results",
  threads_post_open: "detail",
  threads_comment_click: "loading",
  threads_comment_typing: "typing",
  threads_comment_publish: "writing",
  threads_published: "done",
  threads_check: "form",
  writing: "writing",
}

interface BrowserState {
  phase: LocalPhase
  loadingProgress: number
  threadsTypedQuery: string
  threadsTypedComment: string
  threadsPostUrl: string
  threadsCurrentPost: {
    author: string
    text: string
    time: string
    likes: number
    comments: number
    url: string
  } | null
  threadsCheckResults: string[]
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  loadingProgress: 0,
  threadsTypedQuery: "",
  threadsTypedComment: "",
  threadsPostUrl: "",
  threadsCurrentPost: null,
  threadsCheckResults: [],
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [threadsData, setThreadsData] = React.useState<ThreadsDataRow[]>(() =>
    THREADS_POSTS.map((post, i) => ({
      id: i + 1,
      date: post.date,
      postUrl: "",
      postText: "",
      comment: "",
      status: "ожидает" as const,
    }))
  )
  const [browser, setBrowser] = React.useState<BrowserState>(IDLE_BROWSER)
  const [currentIndex, setCurrentIndex] = React.useState(-1)
  const [isRunning, setIsRunning] = React.useState(false)
  const [isDone, setIsDone] = React.useState(false)
  const [chat, setChat] = React.useState<ChatMessage[]>([])
  const [urlFlash, setUrlFlash] = React.useState(false)
  const [activePane, setActivePane] = React.useState<0 | 1 | 2>(0)
  const [userTouchedTab, setUserTouchedTab] = React.useState(false)
  const [agentPane, setAgentPane] = React.useState<0 | 1 | 2>(0)
  const [tableFlash, setTableFlash] = React.useState(false)
  const [chatFading, setChatFading] = React.useState(false)
  const agentToast = useAgentLaunchToast(isRunning, isDone)

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const totalRows = THREADS_POSTS.length

  const threadsDataRef = React.useRef(threadsData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  const [scheduler] = React.useState(() => createScheduler({
    debug: (msg, data) => console.debug(msg, data),
  }))

  React.useEffect(() => {
    threadsDataRef.current = threadsData
  }, [threadsData])
  React.useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])
  React.useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  React.useEffect(() => {
    return () => {
      scheduler.cancelAll()
    }
  }, [scheduler])

  const processNextRef = React.useRef<() => void>(() => {})

  const addChat = React.useCallback(
    (role: "agent" | "system" | "divider", content: string) => {
      setChat((prev) => [...prev, { role, content }])
    },
    []
  )

  const processedCount = threadsData.filter((r) => r.status === "Готово").length
  const progress = Math.round((processedCount / totalRows) * 100)

  const flashUrl = React.useCallback(() => {
    setUrlFlash(true)
    const t = setTimeout(() => setUrlFlash(false), 400)
    scheduler.trackTimer(t)
  }, [scheduler])

  const debugPhase = React.useCallback(
    (phase: LocalPhase, rowIndex: number) => {
      const normalized = PHASE_TO_NORMALIZED[phase]
      if (process.env.NODE_ENV !== "production") {
        console.debug("[threads-comments:processing] phase", {
          phase,
          normalized,
          rowIndex,
        })
      }
    },
    []
  )

  const processNext = React.useCallback(() => {
    if (!isRunningRef.current) return

    const nextIdx = currentIndexRef.current + 1
    if (nextIdx >= THREADS_POSTS.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все строки обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const post = THREADS_POSTS[nextIdx]
    const searchQuery = "ai"
    const handle = post.postUrl.match(/@([^/]+)/)?.[1] || "user"
    const shortText =
      post.postText.length > 80
        ? post.postText.slice(0, 80) + "..."
        : post.postText

    let cleanedComment = post.comment
      .replace(/—/g, ",")
      .replace(/\bследует\b/gi, "стоит")
      .replace(/\bнеобходимо\b/gi, "нужно")
      .replace(/\bрекомендуем\b/gi, "советуем")
      .replace(/\bобращайтесь\b/gi, "пишите")
    if (cleanedComment.trim().endsWith(".")) {
      cleanedComment = cleanedComment.trim().slice(0, -1)
    }

    const myRunId = scheduler.nextRunId()

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[threads-comments:processing] row start", {
        rowIndex: nextIdx,
        date: post.date,
      })
    }

    schedule(() => {
      setAgentActivePane(1)
      setChatFading(true)
      debugPhase("idle", nextIdx)
    }, 0)

    schedule(() => {
      setChat([])
      setChatFading(false)
    }, 400)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
      const flashT = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(flashT)
      setThreadsData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, status: "обработка" as const } : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `📋 Беру дату из таблицы: ${post.date}`)
    }, 700)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `🔍 Начинаю поиск поста в Threads...`)
    }, 1500)

    schedule(() => {
      setAgentActivePane(2)
      debugPhase("threads_home", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "threads_home",
        loadingProgress: 0,
      })
      scheduler.tweenProgress(0, 60, 1000, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
    }, 2000)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_search_click" }))
      addChat("agent", `👆 Перехожу в раздел поиска...`)
    }, 3000)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_search_typing" }))
      debugPhase("threads_search_typing", nextIdx)
      let charIdx = 0
      const typingInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
          return
        }
        charIdx++
        setBrowser((prev) => ({
          ...prev,
          threadsTypedQuery: searchQuery.slice(0, charIdx),
        }))
        if (charIdx >= searchQuery.length) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
        }
      }, 80)
      scheduler.trackInterval(typingInterval)
    }, 3500)

    schedule(() => {
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_search_loading",
        loadingProgress: 0,
      }))
      scheduler.tweenProgress(0, 30, 1000, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
      addChat("agent", `🌐 Ищу посты по запросу "${searchQuery}"...`)
    }, 4500)

    schedule(() => {
      scheduler.tweenProgress(30, 70, 1000, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
    }, 5500)

    schedule(() => {
      scheduler.tweenProgress(70, 100, 1000, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      }, () => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({
          ...prev,
          phase: "threads_feed",
        }))
        addChat("agent", `✓ Найдены посты по теме AI`)
      })
    }, 6500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_post_click" }))
      addChat("agent", `👆 Перехожу к посту @${handle}...`)
    }, 8000)

    schedule(() => {
      flashUrl()
      debugPhase("threads_post_open", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_post_open",
        threadsCurrentPost: {
          author: handle,
          text: post.postText,
          time: post.date,
          likes: Math.floor(Math.random() * 50) + 10,
          comments: Math.floor(Math.random() * 20) + 5,
          url: post.postUrl,
        },
        threadsPostUrl: post.postUrl,
      }))
      addChat("agent", `📄 Читаю пост: "${shortText}"`)
    }, 9000)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `✍️ Генерирую нативный комментарий...`)
    }, 10500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_comment_click" }))
      addChat("agent", `💬 Открываю поле комментария...`)
    }, 11500)

    schedule(() => {
      setAgentActivePane(2)
      setBrowser((prev) => ({ ...prev, phase: "threads_comment_typing" }))
      debugPhase("threads_comment_typing", nextIdx)
      let commentCharIdx = 0
      const commentTypingInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(commentTypingInterval)
          scheduler.scheduledIntervals.delete(commentTypingInterval)
          return
        }
        commentCharIdx++
        setBrowser((prev) => ({
          ...prev,
          threadsTypedComment: cleanedComment.slice(0, commentCharIdx),
        }))
        if (commentCharIdx >= cleanedComment.length) {
          clearInterval(commentTypingInterval)
          scheduler.scheduledIntervals.delete(commentTypingInterval)
        }
      }, 20)
      scheduler.trackInterval(commentTypingInterval)
    }, 12500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_comment_publish" }))
      addChat("agent", `📤 Публикую комментарий...`)
    }, 15500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "threads_published" }))
      debugPhase("threads_published", nextIdx)
      addChat("agent", `✅ Комментарий опубликован!`)
    }, 17000)

    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({ ...prev, phase: "threads_check" }))

      const hasEmDash = post.comment.includes("—")
      const hasFormalPhrasing = /\bследует\b|\bнеобходимо\b|\bрекомендуем\b|\bобращайтесь\b/i.test(post.comment)
      const endsWithPeriod = post.comment.trim().endsWith(".")
      const checks: string[] = []
      if (hasEmDash) checks.push("заменить длинное тире (—) на запятую или переформулировать")
      if (hasFormalPhrasing) checks.push("упростить формальный тон")
      if (endsWithPeriod) checks.push("убрать точку в конце")

      setBrowser((prev) => ({ ...prev, threadsCheckResults: checks }))

      if (checks.length > 0) {
        addChat("agent", `🔍 Проверяю опубликованный комментарий на ИИ-маркеры...`)
        addChat("agent", `⚠️ Найдены маркеры: ${checks.join("; ")}. Исправляю.`)
      } else {
        addChat("agent", `✅ Проверка пройдена: комментарий выглядит нативным`)
      }
    }, 18000)

    schedule(() => {
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 20000)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 20700)

    schedule(() => {
      setThreadsData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                postUrl: post.postUrl,
                postText: post.postText,
                comment: cleanedComment,
                status: "Готово" as const,
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[threads-comments:processing] row done", {
          rowIndex: nextIdx,
          postUrl: post.postUrl,
        })
      }
      const flashT = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(flashT)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 21500)
  }, [addChat, flashUrl, setAgentActivePane, debugPhase, scheduler])

  React.useEffect(() => {
    processNextRef.current = processNext
  }, [processNext])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    isRunningRef.current = true
    setUserTouchedTab(false)
    agentToast.triggerCelebration()
    addChat("agent", "🚀 Агент запущен.")
    const t = setTimeout(() => processNextRef.current(), 300)
    scheduler.trackTimer(t)
  }, [addChat, scheduler, agentToast])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    isRunningRef.current = false
    setUserTouchedTab(false)
    scheduler.cancelAll()
    addChat("agent", "⏸ Пауза.")
  }, [addChat, scheduler])

  const ThreadsStatusBadge = ({ status }: { status: ThreadsDataRow["status"] }) => {
    const styles: Record<string, string> = {
      ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      Готово: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 4 из 4</Badge>
        <h2 className="text-lg font-semibold">Обработка данных ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент ищет посты в Threads, генерирует нативные комментарии и публикует их.
      </p>

      <AgentLaunchToast
        showStartPrompt={agentToast.showStartPrompt}
        showCelebration={agentToast.showCelebration}
        isRunning={isRunning}
        isDone={isDone}
        toastVisible={agentToast.toastVisible}
        onStart={handleStart}
        onCloseStart={agentToast.closeStart}
        onCloseCelebration={agentToast.closeCelebration}
      />

      <div className="flex items-center gap-4">
        <Progress value={progress} className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">
          {processedCount}/{totalRows} ({progress}%)
        </span>
        {!isDone && (
          <Button
            size={isRunning ? "sm" : "default"}
            variant={isRunning ? "outline" : "default"}
            onClick={isRunning ? handlePause : handleStart}
          >
            {isRunning ? "⏸ Пауза" : "🚀 Запустить агента"}
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {[
          { pane: 0 as const, icon: "📊", label: "Таблица" },
          { pane: 1 as const, icon: "🤖", label: "Чат ИИ" },
          { pane: 2 as const, icon: "🌐", label: "Браузер" },
        ].map(({ pane, icon, label }) => {
          const isActive = activePane === pane
          return (
            <button
              key={pane}
              onClick={() => {
                setActivePane(pane)
                if (isRunning) setUserTouchedTab(true)
              }}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 md:grid md:grid-cols-3 md:gap-3">
        <Card
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 0 && isRunning ? "shadow-md ring-2 ring-emerald-500/30" : ""} ${activePane !== 0 ? "hidden md:flex" : "flex"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                📊
              </span>
              Таблица данных
              {currentIndex >= 0 && !isDone && (
                <span className="text-xs text-muted-foreground">
                  строка {currentIndex + 1}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 pb-0">
            <ScrollArea className="h-[calc(100dvh-320px)] md:h-[460px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-6 px-1 py-1 font-medium">#</th>
                    <th className="w-10 px-1 py-1 font-medium">A</th>
                    <th className="hidden px-1 py-1 font-medium lg:table-cell">B</th>
                    <th className="hidden px-1 py-1 font-medium sm:table-cell">C</th>
                    <th className="hidden px-1 py-1 font-medium md:table-cell">D</th>
                    <th className="w-14 px-1 py-1 font-medium">E</th>
                  </tr>
                </thead>
                <tbody>
                  {threadsData.map((row) => {
                    const isActive = row.id - 1 === currentIndex && isRunning
                    const justUpdated = tableFlash && isActive
                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-all duration-300 ${
                          justUpdated
                            ? "bg-emerald-500/20 shadow-sm"
                            : isActive
                              ? "bg-primary/10"
                              : row.status === "Готово"
                                ? "bg-emerald-500/5"
                                : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="px-1 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-1 py-1 font-medium">{row.date}</td>
                        <td className="hidden max-w-[100px] truncate px-1 py-1 text-muted-foreground lg:table-cell">
                          {row.postUrl ? (
                            <span className="text-blue-600 dark:text-blue-400">ссылка</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="hidden max-w-[120px] truncate px-1 py-1 text-muted-foreground sm:table-cell">
                          {row.postText || "—"}
                        </td>
                        <td className="hidden max-w-[100px] truncate px-1 py-1 text-muted-foreground md:table-cell">
                          {row.comment || "—"}
                        </td>
                        <td className="px-1 py-1">
                          <ThreadsStatusBadge status={row.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 1 && isRunning ? "shadow-md ring-2 ring-purple-500/30" : ""} ${activePane !== 1 ? "hidden md:flex" : "flex"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-purple-600 text-[10px] text-white">
                🤖
              </span>
              Чат ИИ-агента
              {isRunning && (
                <span className="animate-pulse text-[10px] text-purple-500">●</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 pb-0">
            <ScrollArea className="h-[calc(100dvh-320px)] pr-2 md:h-[460px]">
              <div
                className={`flex flex-col gap-2 transition-opacity duration-300 ${chatFading ? "opacity-0" : "opacity-100"}`}
              >
                {chat.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <span className="text-3xl opacity-30">🤖</span>
                    <p className="text-xs">Чат агента пуст</p>
                  </div>
                )}
                {chat.map((msg, i) => (
                  <div key={i}>
                    {msg.role === "divider" ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 border-t" />
                        <span className="shrink-0 text-[9px] font-medium text-muted-foreground">
                          {msg.content}
                        </span>
                        <div className="flex-1 border-t" />
                      </div>
                    ) : (
                      <div
                        className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                            msg.role === "agent"
                              ? "bg-muted text-foreground"
                              : "border border-primary/20 bg-primary/10 text-primary"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isRunning && browser.phase !== "idle" && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5">
                      <span className="animate-bounce text-[8px] text-muted-foreground" style={{ animationDelay: "0ms" }}>●</span>
                      <span className="animate-bounce text-[8px] text-muted-foreground" style={{ animationDelay: "150ms" }}>●</span>
                      <span className="animate-bounce text-[8px] text-muted-foreground" style={{ animationDelay: "300ms" }}>●</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 2 && isRunning ? "shadow-md ring-2 ring-blue-500/30" : ""} ${activePane !== 2 ? "hidden md:flex" : "flex"}`}
        >
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                    🌐
                  </span>
                  Браузер
                  {browser.phase !== "idle" && (
                    <span className="animate-pulse text-[10px] text-blue-500">●</span>
                  )}
                </div>
                {browser.phase !== "idle" && (
                  <span className="text-[10px] text-muted-foreground">
                    {browser.phase === "threads_home" ? "Threads загружен" :
                     browser.phase === "threads_search_click" ? "Открываю поиск..." :
                     browser.phase === "threads_search_typing" ? "Ввожу запрос..." :
                     browser.phase === "threads_search_loading" ? "Ищу посты..." :
                     browser.phase === "threads_feed" ? "Лента постов" :
                     browser.phase === "threads_post_click" ? "Перехожу к посту..." :
                     browser.phase === "threads_post_open" ? "Читаю пост" :
                     browser.phase === "threads_comment_click" ? "Открываю комментарий..." :
                     browser.phase === "threads_comment_typing" ? "Пишу комментарий..." :
                     browser.phase === "threads_comment_publish" ? "Публикую..." :
                     browser.phase === "threads_published" ? "Опубликовано!" :
                     browser.phase === "threads_check" ? "Проверяю комментарий..." :
                     "Записываю результат"}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент управляет браузером для комментирования в Threads"
                  : browser.phase.startsWith("threads_search")
                    ? "ИИ-агент ищет посты по теме AI в Threads"
                    : browser.phase === "threads_feed" || browser.phase === "threads_post_click"
                      ? "ИИ-агент выбирает подходящий пост"
                      : browser.phase === "threads_post_open"
                        ? "ИИ-агент читает пост и генерирует комментарий"
                        : browser.phase.startsWith("threads_comment")
                          ? "ИИ-агент пишет и публикует комментарий"
                          : browser.phase === "threads_published"
                            ? "ИИ-агент опубликовал комментарий"
                            : browser.phase === "threads_check"
                              ? "ИИ-агент проверяет опубликованный комментарий на ИИ-маркеры"
                              : "ИИ-агент записывает результат в таблицу"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="flex items-center gap-1.5 border-b bg-muted/20 px-2 py-0.5">
                <div
                  className={`flex-1 truncate overflow-hidden rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors duration-200 ${urlFlash ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" : "bg-background text-muted-foreground"} border`}
                >
                  {browser.phase === "idle" ? "about:blank" :
                   browser.phase === "threads_home" ? "https://www.threads.com/" :
                   browser.phase === "threads_search_loading" || browser.phase === "threads_search_typing" ? `https://www.threads.com/search?q=ai` :
                   browser.threadsPostUrl || "https://www.threads.com/"}
                </div>
              </div>

              <div key={browser.phase} className="content-animate-in h-[300px] overflow-y-auto bg-background p-2.5">
                {browser.phase === "idle" && !isDone && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="text-4xl opacity-30">🌐</div>
                    <p className="text-xs text-muted-foreground">Браузер ожидает запуска</p>
                  </div>
                )}
                {browser.phase === "idle" && isDone && (
                  <div className="flex flex-col items-center justify-center gap-2 py-10">
                    <span className="text-4xl">✅</span>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Обработка завершена
                    </p>
                  </div>
                )}

                {browser.phase === "threads_home" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-3xl">🧵</div>
                    <p className="text-xs font-medium">Threads</p>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${browser.loadingProgress}%` }} />
                    </div>
                  </div>
                )}

                {browser.phase === "threads_search_typing" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl">🧵</div>
                    <div className="relative w-72">
                      <div className="w-full rounded-full border-2 border-purple-300 bg-background px-4 py-2 text-sm text-foreground">
                        {browser.threadsTypedQuery}
                        <span className="animate-pulse text-purple-500">|</span>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "threads_search_loading" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl">🧵</div>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${browser.loadingProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Ищу посты...</p>
                  </div>
                )}

                {browser.phase === "threads_feed" && (
                  <div className="flex flex-col gap-2">
                    {THREADS_POSTS.slice(currentIndex, currentIndex + 3).map((post, i) => {
                      const author = post.postUrl.match(/@([^/]+)/)?.[1] || "user"
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-2.5 ${i === 0 ? "border-purple-200 bg-purple-50/50 shadow-sm dark:bg-purple-950/20" : ""}`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <div className="size-5 rounded-full bg-purple-200 dark:bg-purple-800" />
                            <span className="text-[11px] font-medium">@{author}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-foreground">
                            {post.postText.slice(0, 120)}{post.postText.length > 120 ? "..." : ""}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {browser.phase === "threads_post_click" && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <span className="text-2xl">👆</span>
                    <p className="text-xs text-muted-foreground">Перехожу к посту...</p>
                  </div>
                )}

                {browser.phase === "threads_post_open" && browser.threadsCurrentPost && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-purple-200 dark:bg-purple-800" />
                      <div>
                        <div className="text-xs font-medium">@{browser.threadsCurrentPost.author}</div>
                        <div className="text-[9px] text-muted-foreground">{browser.threadsCurrentPost.time}</div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-[11px] leading-relaxed">{browser.threadsCurrentPost.text}</p>
                    </div>
                  </div>
                )}

                {browser.phase === "threads_comment_click" && (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-2xl">💬</span>
                    <p className="text-xs text-muted-foreground">Открываю поле комментария...</p>
                  </div>
                )}

                {browser.phase === "threads_comment_typing" && (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg border bg-background p-3">
                      <div className="text-[11px] leading-relaxed text-foreground">
                        {browser.threadsTypedComment}
                        <span className="ml-0.5 animate-pulse text-purple-500">|</span>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "threads_comment_publish" && (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-2xl">📤</span>
                    <p className="text-xs text-muted-foreground">Публикую комментарий...</p>
                  </div>
                )}

                {browser.phase === "threads_published" && (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <span className="text-3xl">✅</span>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Комментарий опубликован
                    </p>
                  </div>
                )}

                {browser.phase === "threads_check" && (
                  <div className="flex flex-col gap-2">
                    {browser.threadsCheckResults.length > 0 ? (
                      <div className="rounded-lg border-2 border-amber-300 bg-amber-50/30 p-3 dark:bg-amber-950/20">
                        <div className="mb-2 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          ⚠️ Найдены ИИ-маркеры
                        </div>
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                          {browser.threadsCheckResults.map((r, i) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/30 p-3 dark:bg-emerald-950/20">
                        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          ✅ Комментарий выглядит нативным
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {browser.phase === "writing" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="text-3xl opacity-30">📝</div>
                    <p className="text-xs text-muted-foreground">Записываю результат в таблицу</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
      </div>
    </div>
  )
}
