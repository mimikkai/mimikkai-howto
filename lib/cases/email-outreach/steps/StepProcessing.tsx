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
import { EMAIL_CONTACTS, type EmailContact } from "../data"
import type { NormalizedBrowserPhase } from "../../types"
import { createScheduler } from "../../scheduler"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface EmailDataRow {
  id: number
  sphere: string
  senderName: string
  caseUsed: string
  company: string
  site: string
  email: string
  phone: string
  letter1: string
  sendStatus: "ожидает" | "обработка" | "Письмо отправлено и сохранено" | "ошибка"
  letter2: string
  letter3: string
  letter4: string
}

type LocalPhase =
  | "idle"
  | "email_yandex_home"
  | "email_yandex_typing"
  | "email_yandex_results"
  | "email_company_click"
  | "email_company_site"
  | "email_contacts_page"
  | "email_found"
  | "email_compose"
  | "email_send_click"
  | "email_sent_confirmed"
  | "writing"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  email_yandex_home: "idle",
  email_yandex_typing: "typing",
  email_yandex_results: "results",
  email_company_click: "loading",
  email_company_site: "detail",
  email_contacts_page: "loading",
  email_found: "results",
  email_compose: "form",
  email_send_click: "loading",
  email_sent_confirmed: "done",
  writing: "writing",
}

interface BrowserTab {
  title: string
  url: string
  active: boolean
}

interface SearchResult {
  title: string
  url: string
  snippet: string
}

interface BrowserState {
  phase: LocalPhase
  tabs: BrowserTab[]
  url: string
  emailTypedQuery: string
  emailSearchResults: SearchResult[]
  emailCompanyName: string
  emailCompanySite: string
  emailCompanyDesc: string
  emailFoundEmail: string
  emailFoundPhone: string
  emailLetterSubject: string
  emailLetterBody: string
  emailTypedBody: string
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  tabs: [],
  url: "about:blank",
  emailTypedQuery: "",
  emailSearchResults: [],
  emailCompanyName: "",
  emailCompanySite: "",
  emailCompanyDesc: "",
  emailFoundEmail: "",
  emailFoundPhone: "",
  emailLetterSubject: "",
  emailLetterBody: "",
  emailTypedBody: "",
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

const emailStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "Письмо отправлено и сохранено":
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  ошибка: "bg-red-500/15 text-red-700 dark:text-red-400",
}

const DIALOG_COLUMNS = [
  { id: "A", label: "Сфера", key: "sphere" as const },
  { id: "B", label: "Имя отправителя", key: "senderName" as const },
  { id: "C", label: "Кейс", key: "caseUsed" as const },
  { id: "D", label: "Компания", key: "company" as const },
  { id: "E", label: "Сайт", key: "site" as const },
  { id: "F", label: "Почта", key: "email" as const },
  { id: "G", label: "Телефон", key: "phone" as const },
  { id: "H", label: "Письмо 1", key: "letter1" as const },
  { id: "I", label: "Статус", key: "sendStatus" as const },
  { id: "J", label: "Письмо 2", key: "letter2" as const },
  { id: "K", label: "Письмо 3", key: "letter3" as const },
  { id: "L", label: "Письмо 4", key: "letter4" as const },
]

const LETTER_COL_IDS = ["H", "J", "K", "L"]

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [emailData, setEmailData] = React.useState<EmailDataRow[]>(() =>
    EMAIL_CONTACTS.map((c, i) => ({
      id: c.id,
      sphere: c.sphere,
      senderName: c.senderName,
      caseUsed: c.caseUsed,
      company: "",
      site: "",
      email: "",
      phone: "",
      letter1: "",
      sendStatus: "ожидает" as const,
      letter2: "",
      letter3: "",
      letter4: "",
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
  const [selectedRow, setSelectedRow] = React.useState<EmailDataRow | null>(
    null
  )

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const totalRows = EMAIL_CONTACTS.length

  const emailDataRef = React.useRef(emailData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  const schedulerRef = React.useRef<ReturnType<typeof createScheduler> | null>(
    null
  )
  if (schedulerRef.current === null) {
    schedulerRef.current = createScheduler({
      debug: (msg, data) => {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[email-outreach:processing] scheduler", { msg, ...data })
        }
      },
    })
  }
  const scheduler = schedulerRef.current

  React.useEffect(() => {
    emailDataRef.current = emailData
  }, [emailData])
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

  const processedCount = emailData.filter(
    (r) => r.sendStatus === "Письмо отправлено и сохранено"
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
        console.debug("[email-outreach:processing] phase", {
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
    if (nextIdx >= EMAIL_CONTACTS.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все строки обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const contact = EMAIL_CONTACTS[nextIdx]
    const sphere = contact.sphere
    const company = contact.company
    const site = contact.site
    const emailAddr = contact.email
    const phone = contact.phone
    const letterBody = contact.letter1
    const subjectMatch = letterBody.match(/^Subject:\s*(.+)\n/)
    const subject = subjectMatch ? subjectMatch[1] : "ai-агент под вашу рутину"
    const bodyText = letterBody.replace(/^Subject:\s*.+\n\n?/, "")
    const searchQuery = `компания ${sphere} ${company}`
    const companyDesc =
      contact.letter1.match(
        /Мы внимательно изучили ваш сайт и видим\s*([^\.]+\.)/
      )?.[1] || "компания в сфере " + sphere

    const searchResults: SearchResult[] = [
      {
        title: `${company} — Официальный сайт`,
        url: site,
        snippet: `${company}. ${companyDesc} Контакты и информация.`,
      },
      {
        title: `${company} отзывы`,
        url: `https://reviews.ru/${encodeURIComponent(company.toLowerCase())}`,
        snippet: `Отзывы о ${company}. Рейтинг 4.5 из 5.`,
      },
      {
        title: `${company} контакты`,
        url: `${site}/contacts`,
        snippet: `Контактная информация ${company}. Email, телефон, адрес.`,
      },
      {
        title: `${sphere} компании — рейтинг`,
        url: `https://rating.ru/${encodeURIComponent(sphere.toLowerCase())}`,
        snippet: `Лучшие компании в сфере ${sphere}. Сравнение и отзывы.`,
      },
    ]

    const myRunId = scheduler.nextRunId()

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[email-outreach:processing] row start", {
        rowIndex: nextIdx,
        sphere,
        company,
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
      setEmailData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, sendStatus: "обработка" as const } : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `📋 Беру сферу из таблицы: "${sphere}"`)
    }, 700)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `🔍 Начинаю поиск компании в сфере ${sphere}`)
    }, 1500)

    schedule(() => {
      setAgentActivePane(2)
      debugPhase("email_yandex_home", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "email_yandex_home",
        tabs: [{ title: "Яндекс", url: "https://ya.ru/", active: true }],
        url: "https://ya.ru/",
      })
    }, 2000)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "email_yandex_typing" }))
      debugPhase("email_yandex_typing", nextIdx)
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
          emailTypedQuery: searchQuery.slice(0, charIdx),
        }))
        if (charIdx >= searchQuery.length) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
        }
      }, 50)
      scheduler.trackInterval(typingInterval)
    }, 3500)

    schedule(() => {
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "email_yandex_results",
        url: `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}`,
        tabs: [
          {
            title: `${searchQuery} — Яндекс`,
            url: `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}`,
            active: true,
          },
        ],
        emailSearchResults: searchResults,
      }))
      addChat("agent", `🌐 Ищу в Яндексе: "${searchQuery}"`)
    }, 4500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "email_company_click" }))
      addChat("agent", `👆 Перехожу на сайт ${company}...`)
    }, 6000)

    schedule(() => {
      flashUrl()
      debugPhase("email_company_site", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "email_company_site",
        tabs: [
          {
            title: `${searchQuery} — Яндекс`,
            url: `https://yandex.ru/search/?text=${encodeURIComponent(searchQuery)}`,
            active: false,
          },
          { title: company, url: site, active: true },
        ],
        url: site,
        emailCompanyName: company,
        emailCompanySite: site,
        emailCompanyDesc: companyDesc,
        emailSearchResults: searchResults,
      })
      addChat("agent", `📄 Сайт ${company} загружен, изучаю...`)
    }, 7000)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "email_contacts_page" }))
      addChat("agent", `🔍 Ищу контакты на сайте...`)
    }, 8500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "email_found",
        emailFoundEmail: emailAddr,
        emailFoundPhone: phone,
      }))
      addChat("agent", `✅ Найден email: ${emailAddr}`)
    }, 9500)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `✍️ Генерирую персонализированное письмо`)
    }, 10500)

    schedule(() => {
      setAgentActivePane(2)
      setBrowser((prev) => ({
        ...prev,
        phase: "email_compose",
        emailLetterSubject: subject,
        emailLetterBody: bodyText,
      }))
    }, 11000)

    schedule(() => {
      let bodyCharIdx = 0
      const bodyTypingInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(bodyTypingInterval)
          scheduler.scheduledIntervals.delete(bodyTypingInterval)
          return
        }
        bodyCharIdx += 3
        setBrowser((prev) => ({
          ...prev,
          emailTypedBody: bodyText.slice(0, bodyCharIdx),
        }))
        if (bodyCharIdx >= bodyText.length) {
          clearInterval(bodyTypingInterval)
          scheduler.scheduledIntervals.delete(bodyTypingInterval)
        }
      }, 20)
      scheduler.trackInterval(bodyTypingInterval)
    }, 12500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "email_send_click" }))
      addChat("agent", `📤 Отправляю письмо через SMTP...`)
    }, 13500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "email_sent_confirmed" }))
      debugPhase("email_sent_confirmed", nextIdx)
      addChat("agent", `✅ Письмо отправлено и сохранено`)
    }, 15000)

    schedule(() => {
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 15700)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 16000)

    schedule(() => {
      setEmailData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                company: contact.company,
                site: contact.site,
                email: contact.email,
                phone: contact.phone,
                letter1: contact.letter1,
                sendStatus: "Письмо отправлено и сохранено" as const,
                letter2: contact.letter2,
                letter3: contact.letter3,
                letter4: contact.letter4,
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[email-outreach:processing] row done", {
          rowIndex: nextIdx,
          company: contact.company,
          email: contact.email,
        })
      }
      const flashT = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(flashT)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 16500)
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

  const EmailStatusBadge = ({
    status,
  }: {
    status: EmailDataRow["sendStatus"]
  }) => {
    const styles: Record<string, string> = {
      ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      "Письмо отправлено и сохранено":
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      ошибка: "bg-red-500/15 text-red-700 dark:text-red-400",
    }
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
      >
        {status === "обработка" && <span className="mr-1 animate-spin">⟳</span>}
        {status}
      </span>
    )
  }

  const getDialogValue = (row: EmailDataRow, colId: string): string => {
    switch (colId) {
      case "A": return row.sphere
      case "B": return row.senderName
      case "C": return row.caseUsed
      case "D": return row.company
      case "E": return row.site
      case "F": return row.email
      case "G": return row.phone
      case "H": return row.letter1
      case "I": return row.sendStatus
      case "J": return row.letter2
      case "K": return row.letter3
      case "L": return row.letter4
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
        ИИ-агент ищет компании в Яндексе, находит контакты и отправляет
        персонализированные письма.
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
                    <th className="hidden px-1 py-1 font-medium md:table-cell">D</th>
                    <th className="px-1 py-1 font-medium">E</th>
                    <th className="hidden px-1 py-1 font-medium lg:table-cell">F</th>
                    <th className="w-20 px-1 py-1 font-medium">I</th>
                  </tr>
                </thead>
                <tbody>
                  {emailData.map((row) => {
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
                              : row.sendStatus === "Письмо отправлено и сохранено"
                                ? "bg-emerald-500/5"
                                : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-1 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-1 py-1 font-medium">{row.sphere}</td>
                        <td className="hidden px-1 py-1 sm:table-cell">
                          {row.senderName || "—"}
                        </td>
                        <td className="hidden px-1 py-1 font-medium md:table-cell">
                          {row.company || "—"}
                        </td>
                        <td className="px-1 py-1">
                          {row.site ? (
                            <a
                              href={row.site}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400"
                            >
                              сайт
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="hidden px-1 py-1 text-muted-foreground lg:table-cell">
                          {row.email || "—"}
                        </td>
                        <td className="px-1 py-1">
                          <EmailStatusBadge status={row.sendStatus} />
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
                    {browser.phase === "email_yandex_home"
                      ? "Яндекс загружен"
                      : browser.phase === "email_yandex_typing"
                        ? "Ввожу запрос..."
                        : browser.phase === "email_yandex_results"
                          ? "Результаты поиска"
                          : browser.phase === "email_company_click"
                            ? "Перехожу на сайт..."
                            : browser.phase === "email_company_site"
                              ? "Сайт компании"
                              : browser.phase === "email_contacts_page"
                                ? "Ищу контакты..."
                                : browser.phase === "email_found"
                                  ? "Email найден!"
                                  : browser.phase === "email_compose"
                                    ? "Пишу письмо..."
                                    : browser.phase === "email_send_click"
                                      ? "Отправляю..."
                                      : browser.phase ===
                                          "email_sent_confirmed"
                                        ? "Отправлено!"
                                        : "Записываю результат"}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент управляет браузером для поиска компаний и отправки писем"
                  : browser.phase.startsWith("email_yandex")
                    ? "ИИ-агент ищет компании через Яндекс"
                    : browser.phase === "email_company_click" ||
                        browser.phase === "email_company_site"
                      ? "ИИ-агент изучает сайт компании"
                      : browser.phase === "email_contacts_page" ||
                          browser.phase === "email_found"
                        ? "ИИ-агент ищет контакты на сайте"
                        : browser.phase === "email_compose"
                          ? "ИИ-агент генерирует персонализированное письмо"
                          : browser.phase === "email_send_click"
                            ? "ИИ-агент отправляет письмо через SMTP"
                            : browser.phase === "email_sent_confirmed"
                              ? "ИИ-агент подтвердил отправку письма"
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
                        <span className="max-w-[60px] truncate">{tab.title}</span>
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

                {browser.phase === "email_yandex_home" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: "#ffcc00" }}
                    >
                      Яндекс
                    </div>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                )}

                {browser.phase === "email_yandex_typing" && (
                  <div className="flex flex-col items-center gap-5 py-6">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: "#ffcc00" }}
                    >
                      Яндекс
                    </div>
                    <div className="relative w-72">
                      <div className="w-full rounded-full border-2 border-red-300 bg-background px-4 py-2 text-sm text-foreground">
                        {browser.emailTypedQuery}
                        <span className="animate-pulse text-red-500">|</span>
                      </div>
                      <div className="absolute top-2.5 right-3 flex gap-1.5">
                        <span className="text-muted-foreground">🎤</span>
                        <span className="text-muted-foreground">🔍</span>
                      </div>
                    </div>
                    <div className="mt-1 flex gap-2">
                      <div className="rounded border bg-muted/50 px-3 py-1 text-[10px] text-muted-foreground">
                        Найти
                      </div>
                      <div className="rounded border bg-muted/50 px-3 py-1 text-[10px] text-muted-foreground">
                        Мне повезёт!
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "email_yandex_results" && (
                  <div className="animate-in fade-in flex flex-col gap-2.5 duration-300">
                    <div className="mb-1 text-[10px] text-muted-foreground">
                      Нашлось {browser.emailSearchResults.length} результатов
                    </div>
                    {browser.emailSearchResults.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-2.5 transition-all duration-200 ${
                          i === 0
                            ? "cursor-pointer border-red-200 bg-red-50/50 shadow-sm hover:border-red-300 hover:shadow-md dark:bg-red-950/20"
                            : "hover:bg-muted/50"
                        }`}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <div className="mb-0.5 flex items-center gap-1">
                          <div className="size-3 rounded-full bg-muted" />
                          <div className="truncate font-mono text-[10px] text-green-700 dark:text-green-400">
                            {r.url}
                          </div>
                        </div>
                        <div
                          className={`mb-0.5 text-xs font-medium ${i === 0 ? "text-red-700 dark:text-red-400" : "text-foreground"}`}
                        >
                          {r.title}
                        </div>
                        <div className="line-clamp-1 text-[10px] text-muted-foreground">
                          {r.snippet}
                        </div>
                        {i === 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-red-600 dark:text-red-400">
                            <span className="inline-flex size-3 items-center justify-center rounded bg-red-500 text-[7px] text-white">
                              ▸
                            </span>
                            ИИ-агент переходит...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {browser.phase === "email_company_click" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="relative">
                      <span className="text-xl text-red-500">⟳</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Переход на {browser.emailCompanyName || "сайт компании"}...
                    </p>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full animate-pulse bg-red-500 transition-all"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                )}

                {browser.phase === "email_company_site" && (
                  <div className="animate-in fade-in flex flex-col gap-3 duration-300">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        🏢
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {browser.emailCompanyName}
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.emailCompanySite}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-[9px] text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">Главная</span>
                      <span className="rounded bg-muted px-2 py-0.5">
                        О компании
                      </span>
                      <span className="rounded bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        Контакты
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5">Услуги</span>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {browser.emailCompanyDesc}
                      </p>
                    </div>
                  </div>
                )}

                {browser.phase === "email_contacts_page" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        🏢
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {browser.emailCompanyName}
                        </div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.emailCompanySite}/contacts
                        </div>
                      </div>
                    </div>
                    <div className="animate-pulse rounded-lg border-2 border-amber-300 bg-amber-50/30 p-3 dark:bg-amber-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">🔍</span>
                        <span className="text-[11px] font-medium">
                          Ищу контакты на странице...
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                        <div className="h-3 w-3/4 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "email_found" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                        🏢
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {browser.emailCompanyName}
                        </div>
                      </div>
                    </div>
                    <div className="animate-in zoom-in rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-3 duration-300 dark:bg-emerald-950/20">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">✅</span>
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Контакты найдены
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {browser.emailFoundEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground">Тел:</span>
                          <span className="font-medium">
                            {browser.emailFoundPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "email_compose" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-t-lg border border-b-0 bg-blue-50 px-3 py-1.5 dark:bg-blue-950/30">
                      <span className="text-sm">✉️</span>
                      <span className="text-[11px] font-medium">Новое письмо</span>
                    </div>
                    <div className="rounded-b-lg border border-t-0 bg-background p-3">
                      <div className="mb-2 flex items-center gap-2 border-b pb-2">
                        <span className="text-[10px] text-muted-foreground">
                          Кому:
                        </span>
                        <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          {browser.emailFoundEmail}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center gap-2 border-b pb-2">
                        <span className="text-[10px] text-muted-foreground">
                          Тема:
                        </span>
                        <span className="text-[11px] font-medium">
                          {browser.emailLetterSubject}
                        </span>
                      </div>
                      <div className="min-h-[120px] text-[11px] leading-relaxed">
                        {browser.emailTypedBody || ""}
                        <span className="animate-pulse text-blue-500">|</span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <div className="rounded-lg bg-blue-600 px-4 py-1.5 text-[10px] font-medium text-white">
                          Отправить
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "email_send_click" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/15">
                      <span className="text-xl text-blue-500">↑</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Отправляю письмо через SMTP...
                    </p>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full animate-pulse bg-blue-500 transition-all"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                )}

                {browser.phase === "email_sent_confirmed" && (
                  <div className="animate-in zoom-in flex flex-col items-center gap-3 py-6 duration-300">
                    <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
                      ✉️
                    </div>
                    <div className="text-center">
                      <div className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Письмо отправлено и сохранено
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {browser.emailFoundEmail}
                      </div>
                    </div>
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
                const isUrlCol = col.id === "E"
                const isStatusCol = col.id === "I"
                const isLetterCol = LETTER_COL_IDS.includes(col.id)
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    {isUrlCol && value ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-blue-600 underline dark:text-blue-400"
                      >
                        {value}
                      </a>
                    ) : isStatusCol ? (
                      <EmailStatusBadge status={selectedRow.sendStatus} />
                    ) : isLetterCol && value ? (
                      <ScrollArea className="max-h-32 rounded border bg-muted/30 p-2">
                        <span className="whitespace-pre-wrap text-sm">
                          {value}
                        </span>
                      </ScrollArea>
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