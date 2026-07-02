"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { CRM_ORDERS, type CrmOrder } from "../data"
import type { NormalizedBrowserPhase } from "../../types"
import { createScheduler } from "../../scheduler"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface CrmOrderRow {
  id: number
  orderNumber: string
  client: string
  trackNumber: string
  deliveryStatus: "ожидает" | "обрабатывается" | "отслежено"
  eta: string
  notifyChannel: "telegram" | "email" | "whatsapp"
  notifySent: boolean
}

type LocalPhase =
  | "idle"
  | "crm_dashboard"
  | "crm_order_open"
  | "crm_copy_track"
  | "tracking_home"
  | "tracking_typing"
  | "tracking_results"
  | "crm_update_status"
  | "messenger_review"
  | "crm_notify_sent"
  | "writing"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  crm_dashboard: "loading",
  crm_order_open: "detail",
  crm_copy_track: "loading",
  tracking_home: "idle",
  tracking_typing: "typing",
  tracking_results: "results",
  crm_update_status: "form",
  messenger_review: "detail",
  crm_notify_sent: "done",
  writing: "writing",
}

interface BrowserTab {
  title: string
  url: string
  active: boolean
}

interface BrowserState {
  phase: LocalPhase
  tabs: BrowserTab[]
  url: string
  crmCurrentOrder: CrmOrder | null
  trackTypedQuery: string
  trackingResult: CrmOrder | null
  messengerMessage: string
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  tabs: [],
  url: "about:blank",
  crmCurrentOrder: null,
  trackTypedQuery: "",
  trackingResult: null,
  messengerMessage: "",
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

const crmStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обрабатывается: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  отслежено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}

const channelIcon: Record<string, string> = {
  telegram: "📱",
  email: "📧",
  whatsapp: "💬",
}

const channelLabel: Record<string, string> = {
  telegram: "Telegram",
  email: "Email",
  whatsapp: "WhatsApp",
}

const DIALOG_COLUMNS = [
  { id: "A", label: "Номер заказа", key: "orderNumber" as const },
  { id: "B", label: "Клиент", key: "client" as const },
  { id: "C", label: "Трек-номер", key: "trackNumber" as const },
  { id: "D", label: "Статус", key: "deliveryStatus" as const },
  { id: "E", label: "ETA", key: "eta" as const },
  { id: "F", label: "Уведомление", key: "notifyChannel" as const },
]

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [crmData, setCrmData] = React.useState<CrmOrderRow[]>(() =>
    CRM_ORDERS.map((o, i) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      client: o.client,
      trackNumber: o.trackNumber,
      deliveryStatus: "ожидает" as const,
      eta: o.eta,
      notifyChannel: o.notifyChannel,
      notifySent: false,
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
  const [selectedRow, setSelectedRow] = React.useState<CrmOrderRow | null>(
    null
  )

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const totalRows = CRM_ORDERS.length

  const crmDataRef = React.useRef(crmData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  const [scheduler] = React.useState(() => createScheduler({
    debug: (msg, data) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[crm-order-tracking:processing] scheduler", { msg, ...data })
      }
    },
  }))

  React.useEffect(() => {
    crmDataRef.current = crmData
  }, [crmData])
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

  const processedCount = crmData.filter(
    (r) => r.deliveryStatus === "отслежено"
  ).length
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
        console.debug("[crm-order-tracking:processing] phase", {
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
    if (nextIdx >= CRM_ORDERS.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все заказы обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const order = CRM_ORDERS[nextIdx]
    const trackNumber = order.trackNumber
    const notifyMsg = `Ваш заказ ${order.orderNumber} в пути. Прибытие ~${order.eta}, г. ${order.city}. Трек: ${trackNumber}`

    const myRunId = scheduler.nextRunId()

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[crm-order-tracking:processing] row start", {
        rowIndex: nextIdx,
        orderNumber: order.orderNumber,
        trackNumber: order.trackNumber,
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
      setCrmData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, deliveryStatus: "обрабатывается" as const } : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `📋 Беру номер заказа: "${order.orderNumber}"`)
    }, 700)

    schedule(() => {
      setAgentActivePane(2)
      addChat("agent", `📂 Открываю CRM...`)
    }, 1500)

    schedule(() => {
      debugPhase("crm_dashboard", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "crm_dashboard",
        tabs: [
          { title: "CRM Система", url: "https://crm.example.ru/dashboard", active: true },
        ],
        url: "https://crm.example.ru/dashboard",
      })
    }, 2000)

    schedule(() => {
      addChat("agent", `🔍 Нахожу заказ ${order.orderNumber}...`)
    }, 3000)

    schedule(() => {
      debugPhase("crm_order_open", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "crm_order_open",
        crmCurrentOrder: order,
      }))
      addChat("agent", `📄 Карточка заказа открыта`)
    }, 3500)

    schedule(() => {
      debugPhase("crm_copy_track", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "crm_copy_track",
      }))
      addChat("agent", `📋 Копирую трек-номер: ${trackNumber}`)
    }, 5500)

    schedule(() => {
      flashUrl()
      addChat("agent", `🌐 Открываю сайт трекинга...`)
    }, 7000)

    schedule(() => {
      debugPhase("tracking_home", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "tracking_home",
        tabs: [
          { title: "CRM Система", url: "https://crm.example.ru/orders/" + order.orderNumber, active: false },
          { title: "Отслеживание-Доставок.рф", url: "https://доставка.рф/", active: true },
        ],
        url: "https://доставка.рф/",
      })
    }, 7500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "tracking_typing" }))
      debugPhase("tracking_typing", nextIdx)
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
          trackTypedQuery: trackNumber.slice(0, charIdx),
        }))
        if (charIdx >= trackNumber.length) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
        }
      }, 50)
      scheduler.trackInterval(typingInterval)
    }, 8000)

    schedule(() => {
      flashUrl()
      debugPhase("tracking_results", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "tracking_results",
        trackingResult: order,
      }))
      addChat("agent", `✅ Статус: ${order.deliveryStatus}, ETA: ${order.eta}`)
    }, 9000)

    schedule(() => {
      flashUrl()
      addChat("agent", `🔙 Возвращаюсь в CRM для обновления...`)
    }, 11500)

    schedule(() => {
      debugPhase("crm_update_status", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "crm_update_status",
        tabs: [
          { title: "CRM Система", url: "https://crm.example.ru/orders/" + order.orderNumber, active: true },
          { title: "Отслеживание-Доставок.рф", url: "https://доставка.рф/track/" + trackNumber, active: false },
        ],
        url: "https://crm.example.ru/orders/" + order.orderNumber,
        crmCurrentOrder: order,
      })
      addChat("agent", `✏️ Обновляю статус и ETA в CRM`)
    }, 12000)

    schedule(() => {
      addChat("agent", `📝 Формирую уведомление для ${order.client} через ${channelLabel[order.notifyChannel]}...`)
    }, 13500)

    schedule(() => {
      debugPhase("messenger_review", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "messenger_review",
        tabs: [
          { title: "CRM Система", url: "https://crm.example.ru/orders/" + order.orderNumber, active: false },
          { title: "Отслеживание-Доставок.рф", url: "https://доставка.рф/track/" + trackNumber, active: false },
          { title: channelLabel[order.notifyChannel], url: `https://${order.notifyChannel}.example.ru/`, active: true },
        ],
        url: `https://${order.notifyChannel}.example.ru/`,
        crmCurrentOrder: order,
        trackingResult: order,
        messengerMessage: notifyMsg,
      })
      addChat("agent", `📝 Уведомление сформировано, проверяю корректность...`)
    }, 14000)

    schedule(() => {
      addChat("agent", `✅ Уведомление корректно: номер заказа, статус, ETA, трек — всё верно`)
    }, 15500)

    schedule(() => {
      debugPhase("crm_notify_sent", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "crm_notify_sent",
      }))
      addChat("agent", `📱 Отправляю уведомление...`)
    }, 16500)

    schedule(() => {
      addChat("agent", `✅ Уведомление отправлено`)
    }, 17200)

    schedule(() => {
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 17500)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 17800)

    schedule(() => {
      setCrmData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                deliveryStatus: "отслежено" as const,
                notifySent: true,
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[crm-order-tracking:processing] row done", {
          rowIndex: nextIdx,
          orderNumber: order.orderNumber,
          trackNumber: order.trackNumber,
        })
      }
      const flashT = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(flashT)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 18000)
  }, [addChat, flashUrl, setAgentActivePane, debugPhase, scheduler])

  React.useEffect(() => {
    processNextRef.current = processNext
  }, [processNext])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    isRunningRef.current = true
    setUserTouchedTab(false)
    addChat("agent", "🚀 Агент запущен.")
    const t = setTimeout(() => processNextRef.current(), 300)
    scheduler.trackTimer(t)
  }, [addChat, scheduler])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    isRunningRef.current = false
    setUserTouchedTab(false)
    scheduler.cancelAll()
    addChat("agent", "⏸ Пауза.")
  }, [addChat, scheduler])

  const CrmStatusBadge = ({
    status,
  }: {
    status: CrmOrderRow["deliveryStatus"]
  }) => {
    const styles: Record<string, string> = {
      ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      обрабатывается: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      отслежено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
      >
        {status === "обрабатывается" && <span className="mr-1 animate-spin">⟳</span>}
        {status}
      </span>
    )
  }

  const getDialogValue = (row: CrmOrderRow, colId: string): string => {
    switch (colId) {
      case "A": return row.orderNumber
      case "B": return row.client
      case "C": return row.trackNumber
      case "D": return row.deliveryStatus
      case "E": return row.eta
      case "F": return row.notifySent
        ? `${channelIcon[row.notifyChannel]} ${channelLabel[row.notifyChannel]} — отправлено`
        : "—"
      default: return ""
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 4 из 4</Badge>
        <h2 className="text-lg font-semibold">Обработка данных ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент проверяет статус доставок в CRM, обновляет данные и уведомляет
        клиентов.
      </p>

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
                    <th className="px-1 py-1 font-medium">A</th>
                    <th className="hidden px-1 py-1 font-medium sm:table-cell">B</th>
                    <th className="px-1 py-1 font-medium">D</th>
                    <th className="w-20 px-1 py-1 font-medium">F</th>
                  </tr>
                </thead>
                <tbody>
                  {crmData.map((row) => {
                    const isActive = row.id - 1 === currentIndex && isRunning
                    const justUpdated = tableFlash && isActive
                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b transition-all duration-300 ${
                          justUpdated
                            ? "bg-emerald-500/20 shadow-sm"
                            : isActive
                              ? "bg-primary/10"
                              : row.deliveryStatus === "отслежено"
                                ? "bg-emerald-500/5"
                                : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-1 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-1 py-1 font-medium">{row.orderNumber}</td>
                        <td className="hidden px-1 py-1 sm:table-cell">
                          {row.client || "—"}
                        </td>
                        <td className="px-1 py-1">
                          <CrmStatusBadge status={row.deliveryStatus} />
                        </td>
                        <td className="px-1 py-1">
                          {row.notifySent ? (
                            <span className="text-[10px]">
                              {channelIcon[row.notifyChannel]} {channelLabel[row.notifyChannel]}
                            </span>
                          ) : (
                            "—"
                          )}
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
                <span className="animate-pulse text-[10px] text-purple-500">
                  ●
                </span>
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
                    <span className="animate-pulse text-[10px] text-blue-500">
                      ●
                    </span>
                  )}
                </div>
                {browser.phase !== "idle" && (
                  <span className="text-[10px] text-muted-foreground">
                    {browser.phase === "crm_dashboard"
                      ? "CRM дашборд"
                      : browser.phase === "crm_order_open"
                        ? "Карточка заказа"
                        : browser.phase === "crm_copy_track"
                          ? "Копирование трека..."
                          : browser.phase === "tracking_home"
                            ? "Сайт трекинга"
                            : browser.phase === "tracking_typing"
                              ? "Ввожу трек..."
                              : browser.phase === "tracking_results"
                                ? "Результат трекинга"
                                : browser.phase === "crm_update_status"
                                  ? "Обновление CRM"
                                  : browser.phase === "messenger_review"
                                    ? "Проверка уведомления"
                                    : browser.phase === "crm_notify_sent"
                                      ? "Уведомление отправлено"
                                      : "Записываю результат"}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент управляет браузером для отслеживания доставок"
                  : browser.phase.startsWith("crm_") && browser.phase !== "crm_notify_sent"
                    ? "ИИ-агент работает в CRM системе"
                    : browser.phase.startsWith("tracking_")
                      ? "ИИ-агент проверяет статус на сайте трекинга"
                      : browser.phase === "messenger_review"
                        ? "ИИ-агент проверяет уведомление перед отправкой"
                        : browser.phase === "crm_notify_sent"
                          ? "ИИ-агент отправил уведомление клиенту"
                          : "ИИ-агент записывает результат в таблицу"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="flex items-center gap-1.5 border-b bg-muted/20 px-2 py-0.5">
                {browser.tabs.length > 0 && (
                  <div className="flex gap-0.5 overflow-x-auto">
                    {browser.tabs.map((tab, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1 rounded-t px-2 py-0.5 text-[9px] ${
                          tab.active
                            ? "bg-background font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span className="max-w-[80px] truncate">{tab.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={`flex-1 truncate overflow-hidden rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors duration-200 ${urlFlash ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" : "bg-background text-muted-foreground"} border`}
                >
                  {browser.url}
                </div>
              </div>

              <div key={browser.phase} className="content-animate-in h-[300px] overflow-y-auto bg-background p-2.5">
                {browser.phase === "idle" && !isDone && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="text-4xl opacity-30">🌐</div>
                    <p className="text-xs text-muted-foreground">
                      Браузер ожидает запуска
                    </p>
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

                {browser.phase === "crm_dashboard" && (
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0 space-y-1 border-r pr-2">
                      <div className="rounded bg-primary/10 px-2 py-1 text-[9px] font-medium text-primary">Сделки</div>
                      <div className="rounded px-2 py-1 text-[9px] text-muted-foreground">Контакты</div>
                      <div className="rounded px-2 py-1 text-[9px] text-muted-foreground">Настройки</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="text-[10px] font-medium text-muted-foreground">Сделки</div>
                      {CRM_ORDERS.slice(0, 6).map((o, i) => {
                        const highlight = i === currentIndex
                        return (
                          <div
                            key={o.id}
                            className={`flex items-center gap-2 rounded border p-1.5 text-[9px] ${
                              highlight
                                ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <span className="shrink-0">{highlight ? "▶" : "○"}</span>
                            <span className="font-medium truncate">{o.client}</span>
                            <span className="ml-auto shrink-0 text-muted-foreground">{o.orderNumber}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {browser.phase === "crm_order_open" && browser.crmCurrentOrder && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        📋
                      </div>
                      <div>
                        <div className="text-xs font-medium">Заказ {browser.crmCurrentOrder.orderNumber}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.crmCurrentOrder.client}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Клиент:</span>
                        <span className="font-medium">{browser.crmCurrentOrder.client}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Город:</span>
                        <span>{browser.crmCurrentOrder.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Товар:</span>
                        <span>{browser.crmCurrentOrder.product}</span>
                      </div>
                      <div className="flex items-center gap-2 border-t pt-1.5 text-[10px]">
                        <span className="text-muted-foreground">Трек-номер:</span>
                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                          {browser.crmCurrentOrder.trackNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "crm_copy_track" && browser.crmCurrentOrder && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        📋
                      </div>
                      <div>
                        <div className="text-xs font-medium">Заказ {browser.crmCurrentOrder.orderNumber}</div>
                      </div>
                    </div>
                    <div className="animate-pulse rounded-lg border-2 border-amber-300 bg-amber-50/30 p-3 dark:bg-amber-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">📋</span>
                        <span className="text-[11px] font-medium">Копирую трек-номер...</span>
                      </div>
                      <div className="font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        {browser.crmCurrentOrder.trackNumber}
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "tracking_home" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl font-bold text-blue-600">
                      Отслеживание-Доставок.рф
                    </div>
                    <div className="w-72 rounded-full border-2 border-blue-300 bg-background px-4 py-2 text-sm text-muted-foreground">
                      Введите трек-номер
                      <span className="animate-pulse text-blue-500">|</span>
                    </div>
                    <div className="mt-1 rounded bg-blue-600 px-4 py-1.5 text-[10px] font-medium text-white">
                      Отследить
                    </div>
                  </div>
                )}

                {browser.phase === "tracking_typing" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl font-bold text-blue-600">
                      Отслеживание-Доставок.рф
                    </div>
                    <div className="w-72">
                      <div className="w-full rounded-full border-2 border-blue-300 bg-background px-4 py-2 text-sm text-foreground">
                        {browser.trackTypedQuery}
                        <span className="animate-pulse text-blue-500">|</span>
                      </div>
                    </div>
                    <div className="mt-1 rounded bg-blue-600 px-4 py-1.5 text-[10px] font-medium text-white">
                      Отследить
                    </div>
                  </div>
                )}

                {browser.phase === "tracking_results" && browser.trackingResult && (
                  <div className="animate-in fade-in flex flex-col gap-2.5 duration-300">
                    <div className="mb-1 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                      Результат отслеживания
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:bg-blue-950/20">
                      <div className="mb-2 flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Трек:</span>
                        <span className="font-mono font-medium">{browser.trackingResult.trackNumber}</span>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">Статус:</span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          {browser.trackingResult.deliveryStatus}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-2 text-[10px]">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="font-medium">{browser.trackingResult.eta}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {browser.trackingResult.trackingSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px]">
                          <div className={`size-2 shrink-0 rounded-full ${i === browser.trackingResult!.trackingSteps.length - 1 ? "bg-emerald-500" : "bg-blue-400"}`} />
                          <span className="text-muted-foreground">{step.date}</span>
                          <span className="font-medium">{step.status}</span>
                          <span className="text-muted-foreground">— г. {step.city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {browser.phase === "crm_update_status" && browser.crmCurrentOrder && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        📋
                      </div>
                      <div>
                        <div className="text-xs font-medium">Заказ {browser.crmCurrentOrder.orderNumber}</div>
                      </div>
                    </div>
                    <div className="animate-pulse rounded-lg border-2 border-emerald-300 bg-emerald-50/30 p-3 dark:bg-emerald-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">✏️</span>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Обновляю статус в CRM...
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Статус:</span>
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">отслежено</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">ETA:</span>
                          <span className="font-medium">{browser.crmCurrentOrder.eta}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "messenger_review" && browser.crmCurrentOrder && (
                  <div className="flex flex-col gap-2.5">
                    <div className="rounded-lg border-2 border-amber-400 bg-amber-50/50 p-3 dark:bg-amber-950/30">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">🔍</span>
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          Проверяю уведомление перед отправкой
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">✓</span>
                          <span className="text-muted-foreground">Номер заказа:</span>
                          <span className="font-medium">{browser.crmCurrentOrder.orderNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">✓</span>
                          <span className="text-muted-foreground">Статус доставки:</span>
                          <span className="font-medium">{browser.crmCurrentOrder.deliveryStatus}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">✓</span>
                          <span className="text-muted-foreground">ETA:</span>
                          <span className="font-medium">{browser.crmCurrentOrder.eta}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">✓</span>
                          <span className="text-muted-foreground">Трек-номер:</span>
                          <span className="font-mono font-medium">{browser.crmCurrentOrder.trackNumber}</span>
                        </div>
                      </div>
                      <div className="border-t border-amber-300/50 pt-2">
                        <div className="text-[9px] font-medium text-muted-foreground mb-1">Текст уведомления:</div>
                        <div className="rounded bg-white/70 p-2 text-[10px] leading-relaxed dark:bg-black/20">
                          {browser.messengerMessage}
                        </div>
                      </div>
                    </div>
                    {browser.crmCurrentOrder.notifyChannel === "telegram" && (
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>📱</span> Канал: Telegram → {browser.crmCurrentOrder.client}
                      </div>
                    )}
                    {browser.crmCurrentOrder.notifyChannel === "email" && (
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>📧</span> Канал: Email → {browser.crmCurrentOrder.client}
                      </div>
                    )}
                    {browser.crmCurrentOrder.notifyChannel === "whatsapp" && (
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>💬</span> Канал: WhatsApp → {browser.crmCurrentOrder.client}
                      </div>
                    )}
                  </div>
                )}

                {browser.phase === "crm_notify_sent" && browser.crmCurrentOrder && (
                  <div className="flex flex-col gap-2.5">
                    <div className="animate-in zoom-in rounded-lg border-2 border-emerald-400 bg-emerald-50/50 p-3 duration-300 dark:bg-emerald-950/30">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Уведомление отправлено
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] mb-2">
                        <span className="text-muted-foreground">Канал:</span>
                        <span className="font-medium">{channelIcon[browser.crmCurrentOrder.notifyChannel]} {channelLabel[browser.crmCurrentOrder.notifyChannel]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] mb-2">
                        <span className="text-muted-foreground">Клиент:</span>
                        <span className="font-medium">{browser.crmCurrentOrder.client}</span>
                      </div>
                      <div className="rounded bg-white/70 p-2 text-[10px] leading-relaxed dark:bg-black/20">
                        {browser.messengerMessage}
                      </div>
                    </div>
                    {browser.crmCurrentOrder.notifyChannel === "telegram" && (
                      <div className="flex items-start gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-[8px] text-white">M</div>
                        <div className="flex flex-col gap-0.5">
                          <div className="rounded-lg bg-white p-2 text-[10px] leading-relaxed shadow-sm dark:bg-green-900/30">{browser.messengerMessage}</div>
                          <div className="flex justify-end text-[8px] text-green-600 dark:text-green-400">✓✓ Доставлено</div>
                        </div>
                      </div>
                    )}
                    {browser.crmCurrentOrder.notifyChannel === "email" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 bg-blue-50 px-3 py-1.5 dark:bg-blue-950/30">
                          <span className="text-sm">📧</span>
                          <span className="text-[11px] font-medium">Email</span>
                        </div>
                        <div className="rounded-b-lg border border-t-0 bg-background p-3">
                          <div className="mb-2 flex items-center gap-2 border-b pb-2 text-[10px]">
                            <span className="text-muted-foreground">Кому:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{browser.crmCurrentOrder.client}</span>
                          </div>
                          <div className="mb-2 flex items-center gap-2 border-b pb-2 text-[10px]">
                            <span className="text-muted-foreground">Тема:</span>
                            <span className="font-medium">Статус заказа {browser.crmCurrentOrder.orderNumber}</span>
                          </div>
                          <div className="min-h-[40px] text-[10px] leading-relaxed">{browser.messengerMessage}</div>
                        </div>
                      </div>
                    )}
                    {browser.crmCurrentOrder.notifyChannel === "whatsapp" && (
                      <div className="flex items-start gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-[8px] text-white">M</div>
                        <div className="flex flex-col gap-0.5">
                          <div className="rounded-lg bg-white p-2 text-[10px] leading-relaxed shadow-sm dark:bg-green-900/30">{browser.messengerMessage}</div>
                          <div className="flex justify-end text-[8px] text-green-600 dark:text-green-400">✓✓ Доставлено</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {browser.phase === "writing" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="text-3xl opacity-30">📝</div>
                    <p className="text-xs text-muted-foreground">
                      Записываю результат в таблицу
                    </p>
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

      {selectedRow && (
        <Dialog
          open={!!selectedRow}
          onOpenChange={(open) => {
            if (!open) setSelectedRow(null)
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Строка {selectedRow.id}</DialogTitle>
              <DialogDescription>
                Данные выбранной строки таблицы
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {DIALOG_COLUMNS.map((col) => {
                const value = getDialogValue(selectedRow, col.id)
                const isStatusCol = col.id === "D"
                const isNotifyCol = col.id === "F"
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    {isStatusCol ? (
                      <CrmStatusBadge status={selectedRow.deliveryStatus} />
                    ) : isNotifyCol ? (
                      <span className="whitespace-pre-wrap text-sm">
                        {selectedRow.notifySent
                          ? `${channelIcon[selectedRow.notifyChannel]} ${channelLabel[selectedRow.notifyChannel]} — отправлено`
                          : "—"}
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap text-sm">
                        {value || "—"}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}