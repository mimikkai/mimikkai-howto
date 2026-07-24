"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AgentLaunchToast, useAgentLaunchToast } from "@/components/agent-launch-toast"
import { TICKETS } from "../data"
import type { NormalizedBrowserPhase } from "../../types"
import { createScheduler } from "../../scheduler"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface DataRow {
  id: number
  date: string
  question: string
  answer: string
  source: string
  status: "ожидает" | "обработка" | "отвечено" | "не найдено"
}

type LocalPhase =
  | "idle"
  | "ticket_open"
  | "ticket_reading"
  | "new_tab_wiki"
  | "wiki_search_typing"
  | "wiki_search_loading"
  | "wiki_search_results"
  | "wiki_article_click"
  | "wiki_article_loading"
  | "wiki_article_page"
  | "wiki_answer_found"
  | "back_to_ticket"
  | "comment_typing"
  | "comment_inserted"
  | "comment_checking"
  | "comment_verified"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  ticket_open: "loading",
  ticket_reading: "detail",
  new_tab_wiki: "loading",
  wiki_search_typing: "typing",
  wiki_search_loading: "loading",
  wiki_search_results: "results",
  wiki_article_click: "results",
  wiki_article_loading: "loading",
  wiki_article_page: "detail",
  wiki_answer_found: "done",
  back_to_ticket: "writing",
  comment_typing: "typing",
  comment_inserted: "writing",
  comment_checking: "writing",
  comment_verified: "done",
}

interface BrowserTab {
  title: string
  url: string
  active: boolean
}

interface WikiSearchResult {
  title: string
  url: string
  snippet: string
}

interface WikiArticleSection {
  heading: string
  content: string
}

interface BrowserState {
  phase: LocalPhase
  tabs: BrowserTab[]
  url: string
  query: string
  typedQuery: string
  searchResults: WikiSearchResult[]
  articleTitle: string
  articleSections: WikiArticleSection[]
  foundAnswer: string
  foundSource: string
  loadingProgress: number
  highlightedSection: number
  ticketQuestion: string
  ticketId: string
  typedComment: string
  commentVerified: boolean
}

const WIKI_TOPICS = [
  {
    keywords: ["сброс", "пароль", "забыл", "восстановить", "войти"],
    query: "сброс пароля",
    results: [
      { title: "Сброс пароля — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/password-reset", snippet: "Как сбросить пароль от аккаунта. Пошаговая инструкция для восстановления доступа." },
      { title: "Вход в аккаунт — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/login", snippet: "Проблемы со входом. Решения для типичных ошибок авторизации." },
      { title: "Безопасность аккаунта — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/security", snippet: "Настройка двухфакторной аутентификации и защита аккаунта." },
    ],
    article: { title: "Сброс пароля", sections: [{ heading: "Как сбросить пароль", content: "1. Перейдите в раздел Настройки → Безопасность\n2. Нажмите «Сбросить пароль»\n3. Введите email, указанный при регистрации\n4. Следуйте инструкции из письма" }] },
    answer: "Для сброса пароля перейдите в Настройки → Безопасность и нажмите «Сбросить пароль». На ваш email будет отправлена инструкция по восстановлению доступа.",
  },
  {
    keywords: ["api", "ключ", "токен", "настроить", "интеграция"],
    query: "настройка API",
    results: [
      { title: "API — Начало работы — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/api-getting-started", snippet: "Начало работы с API. Получение ключа, первые запросы, лимиты." },
      { title: "Авторизация API — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/api-auth", snippet: "Типы авторизации: Bearer token, OAuth 2.0, API key." },
      { title: "Справочник методов API — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/api-reference", snippet: "Полный справочник REST API методов с примерами." },
    ],
    article: { title: "API — Начало работы", sections: [{ heading: "Получение API ключа", content: "1. Откройте Панель управления → Интеграции\n2. Нажмите «Создать API ключ»\n3. Скопируйте ключ и сохраните его\n4. Используйте ключ в заголовке Authorization: Bearer <ваш-ключ>" }] },
    answer: "Для настройки API откройте Панель управления → Интеграции и создайте API ключ. Используйте его в заголовке Authorization: Bearer <ваш-ключ>. Подробности в справочнике методов API.",
  },
  {
    keywords: ["оплата", "биллинг", "подписка", "списал", "тариф", "сменить"],
    query: "оплата и биллинг",
    results: [
      { title: "Оплата подписки — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/billing", snippet: "Способы оплаты, продление подписки, история платежей." },
      { title: "Тарифные планы — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/pricing", snippet: "Сравнение тарифов: Бесплатный, Стандартный, Профессиональный." },
      { title: "Возврат средств — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/refunds", snippet: "Условия возврата и инструкция по оформлению заявки." },
    ],
    article: { title: "Оплата подписки", sections: [{ heading: "Способы оплаты", content: "Принимаем: банковские карты (Visa, MasterCard, МИР), Яндекс.Деньги, QIWI.\n\nАвтоматическое продление: включается по умолчанию, отключается в Настройках." }] },
    answer: "Оплатить подписку можно банковской картой, Яндекс.Деньгами или QIWI. Автоматическое продление включается по умолчанию, но его можно отключить в Настройках.",
  },
  {
    keywords: ["crm", "amo", "bitrix", "salesforce", "подключить"],
    query: "интеграция с CRM",
    results: [
      { title: "Интеграция CRM — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/crm-integration", snippet: "Подключение amoCRM, Bitrix24, Salesforce и других CRM систем." },
      { title: "Webhook — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/webhooks", snippet: "Настройка webhook для уведомлений о событиях." },
      { title: "Экспорт данных — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/export", snippet: "Экспорт данных в CSV, Excel, JSON форматы." },
    ],
    article: { title: "Интеграция CRM", sections: [{ heading: "Подключение CRM", content: "1. Перейдите в Настройки → Интеграции\n2. Выберите вашу CRM из списка\n3. Нажмите «Подключить»\n4. Авторизуйтесь в вашей CRM\n5. Настройте синхронизацию полей" }] },
    answer: "Для интеграции с CRM перейдите в Настройки → Интеграции, выберите вашу CRM (amoCRM, Bitrix24, Salesforce) и нажмите «Подключить». После авторизации настройте синхронизацию полей.",
  },
  {
    keywords: ["уведомлен", "push", "email", "sms", "spam", "приходят"],
    query: "настройка уведомлений",
    results: [
      { title: "Уведомления — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/notifications", snippet: "Настройка push-уведомлений, email и SMS оповещений." },
      { title: "Telegram бот — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/telegram-bot", snippet: "Подключение Telegram бота для получения уведомлений." },
      { title: "Правила уведомлений — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/notification-rules", snippet: "Гибкая настройка: когда, куда и о чём уведомлять." },
    ],
    article: { title: "Уведомления", sections: [{ heading: "Настройка уведомлений", content: "1. Откройте Профиль → Уведомления\n2. Выберите каналы: push, email, SMS, Telegram\n3. Настройте правила для каждого типа событий\n4. Укажите тихие часы" }] },
    answer: "Для настройки уведомлений откройте Профиль → Уведомления. Выберите каналы (push, email, SMS, Telegram) и настройте правила для каждого типа событий. Можно задать тихие часы.",
  },
  {
    keywords: ["2fa", "двухфактор", "аутентификац", "потерял", "телефон", "код"],
    query: "двухфакторная аутентификация",
    results: [
      { title: "2FA — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/2fa", snippet: "Включение двухфакторной аутентификации для защиты аккаунта." },
      { title: "Безопасность — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/security", snippet: "Общие настройки безопасности: пароли, сессии, 2FA." },
    ],
    article: { title: "Двухфакторная аутентификация", sections: [{ heading: "Включение 2FA", content: "1. Перейдите в Настройки → Безопасность\n2. Нажмите «Включить 2FA»\n3. Отсканируйте QR-код приложением-аутентификатором\n4. Введите подтверждающий код" }] },
    answer: "Для включения 2FA перейдите в Настройки → Безопасность и нажмите «Включить 2FA». Отсканируйте QR-код приложением-аутентификатором (Google Authenticator, Authy) и введите подтверждающий код.",
  },
  {
    keywords: ["экспорт", "excel", "csv", "json", "массовый"],
    query: "экспорт данных",
    results: [
      { title: "Экспорт данных — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/export", snippet: "Экспорт в CSV, Excel, JSON. Массовый экспорт и API." },
      { title: "Резервное копирование — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/backup", snippet: "Автоматическое и ручное резервное копирование данных." },
    ],
    article: { title: "Экспорт данных", sections: [{ heading: "Как экспортировать данные", content: "1. Перейдите в раздел Данные → Экспорт\n2. Выберите формат: CSV, Excel или JSON\n3. Укажите период и фильтры\n4. Нажмите «Экспортировать»\n5. Файл будет отправлен на ваш email" }] },
    answer: "Для экспорта данных перейдите в раздел Данные → Экспорт, выберите формат (CSV, Excel, JSON), укажите период и нажмите «Экспортировать». Файл будет отправлен на ваш email.",
  },
  {
    keywords: ["403", "прав", "доступ", "ошибка", "запрещён"],
    query: "ошибка 403 доступ запрещён",
    results: [
      { title: "Коды ошибок — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/errors", snippet: "Справочник кодов ошибок: 400, 401, 403, 404, 500 и способы их решения." },
      { title: "Права доступа — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/permissions", snippet: "Настройка ролей и прав доступа для пользователей." },
    ],
    article: { title: "Коды ошибок", sections: [{ heading: "Ошибка 403 — Доступ запрещён", content: "Ошибка 403 означает, что у вас нет прав для выполнения этого действия.\n\nРешение:\n1. Проверьте вашу роль в настройках\n2. Обратитесь к администратору для получения прав\n3. Убедитесь, что ваша подписка включает нужную функцию" }] },
    answer: "Ошибка 403 означает отсутствие прав доступа. Проверьте вашу роль в настройках, обратитесь к администратору для получения прав или убедитесь, что ваша подписка включает нужную функцию.",
  },
  {
    keywords: ["мобильн", "приложен", "скачать", "app", "синхрониз"],
    query: "мобильное приложение",
    results: [
      { title: "Мобильное приложение — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/mobile-app", snippet: "Установка и настройка мобильного приложения для iOS и Android." },
      { title: "Push-уведомления — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/push", snippet: "Настройка push-уведомлений в мобильном приложении." },
    ],
    article: { title: "Мобильное приложение", sections: [{ heading: "Установка", content: "Скачайте приложение из App Store или Google Play.\n\nПоиск: «MimikkAi»\n\nВойдите с тем же аккаунтом, что и на веб-версии." }] },
    answer: "Скачайте мобильное приложение из App Store или Google Play по запросу «MimikkAi». Войдите с тем же аккаунтом — все данные синхронизируются автоматически.",
  },
  {
    keywords: ["виджет", "сайт", "установ", "отобража"],
    query: "настройка виджета",
    results: [
      { title: "Виджет на сайт — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/widget", snippet: "Установка чат-виджета на ваш сайт. Кастомизация внешнего вида." },
      { title: "Код виджета — docs.example-wiki.ru", url: "https://docs.example-wiki.ru/widget-code", snippet: "Получение кода для установки виджета." },
    ],
    article: { title: "Виджет на сайт", sections: [{ heading: "Установка виджета", content: "1. Перейдите в Настройки → Виджет\n2. Настройте внешний вид: цвет, позиция, приветствие\n3. Скопируйте код виджета\n4. Вставьте код перед </body> на вашем сайте" }] },
    answer: "Для установки виджета перейдите в Настройки → Виджет, настройте внешний вид и скопируйте код. Вставьте его перед тегом </body> на вашем сайте.",
  },
]

function matchTopic(question: string): (typeof WIKI_TOPICS)[number] {
  const lower = question.toLowerCase()
  for (const topic of WIKI_TOPICS) {
    if (topic.keywords.some((kw) => lower.includes(kw))) {
      return topic
    }
  }
  return WIKI_TOPICS[Math.floor(Math.random() * WIKI_TOPICS.length)]
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  tabs: [{ title: "Система тикетов", url: "https://support.example.com/tickets", active: true }],
  url: "https://support.example.com/tickets",
  query: "",
  typedQuery: "",
  searchResults: [],
  articleTitle: "",
  articleSections: [],
  foundAnswer: "",
  foundSource: "",
  loadingProgress: 0,
  highlightedSection: -1,
  ticketQuestion: "",
  ticketId: "",
  typedComment: "",
  commentVerified: false,
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [ticketData, setTicketData] = React.useState<DataRow[]>(() =>
    TICKETS.map((t, i) => ({
      id: i + 1,
      date: t.date,
      question: t.question,
      answer: "",
      source: "",
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

  const data = ticketData
  const totalRows = TICKETS.length

  const ticketDataRef = React.useRef(ticketData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  const [scheduler] = React.useState(() => createScheduler({
    debug: (msg, data) => console.debug(msg, data),
  }))

  React.useEffect(() => {
    ticketDataRef.current = data
  }, [data])
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

  const processedCount = ticketData.filter(
    (r) => r.status === "отвечено" || r.status === "не найдено"
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
        console.debug("[ticket-reply:processing] phase", {
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
    if (nextIdx >= ticketDataRef.current.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все тикеты обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    const myRunId = scheduler.nextRunId()

    setCurrentIndex(nextIdx)
    const ticket = TICKETS[nextIdx]
    const topic = matchTopic(ticket.question)
    const found = Math.random() > 0.05
    const searchResults = found ? topic.results : topic.results.slice(0, 1)
    const article = found ? topic.article : null
    const answer = found ? topic.answer : ""
    const source = found ? topic.results[0].url : ""
    const wikiQuery = topic.query
    const ticketId = `TK-${String(nextIdx + 1).padStart(4, "0")}`

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[ticket-reply:processing] row start", {
        rowIndex: nextIdx,
        question: ticket.question,
        topic: topic.query,
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
      setTicketData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, status: "обработка" as const } : row
        )
      )
      addChat("divider", `Тикет ${ticketId}`)
      addChat("agent", `📋 Открываю тикет ${ticketId} от ${ticket.date}`)
    }, 700)

    schedule(() => {
      setAgentActivePane(2)
      debugPhase("ticket_open", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "ticket_open",
        tabs: [
          { title: "Система тикетов", url: "https://support.example.com/tickets", active: true },
        ],
        url: `https://support.example.com/tickets/${ticketId}`,
        ticketQuestion: "",
        ticketId,
        loadingProgress: 0,
      })
      scheduler.tweenProgress(0, 50, 800, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
      addChat("agent", `🎫 Открываю тикет в системе поддержки...`)
    }, 1200)

    schedule(() => {
      debugPhase("ticket_reading", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ticket_reading",
        ticketQuestion: ticket.question,
        loadingProgress: 100,
      }))
      addChat("agent", `❓ Вопрос: "${ticket.question}"`)
    }, 2500)

    schedule(() => {
      addChat("agent", `🔍 Нужно найти ответ в базе знаний. Открываю wiki-документацию...`)
    }, 3500)

    schedule(() => {
      setAgentActivePane(2)
      debugPhase("new_tab_wiki", nextIdx)
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "new_tab_wiki",
        tabs: [
          { title: `Тикет ${ticketId}`, url: `https://support.example.com/tickets/${ticketId}`, active: false },
          { title: "Wiki Документация", url: "https://docs.example-wiki.ru/", active: true },
        ],
        url: "https://docs.example-wiki.ru/",
        query: wikiQuery,
        typedQuery: "",
        loadingProgress: 0,
      }))
      scheduler.tweenProgress(0, 30, 800, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
    }, 4200)

    schedule(() => {
      debugPhase("wiki_search_typing", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "wiki_search_typing",
      }))

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
          typedQuery: wikiQuery.slice(0, charIdx),
        }))
        if (charIdx >= wikiQuery.length) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
        }
      }, 45)
      scheduler.trackInterval(typingInterval)
    }, 5500)

    schedule(() => {
      flashUrl()
      debugPhase("wiki_search_loading", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "wiki_search_loading",
        url: `https://docs.example-wiki.ru/search?q=${encodeURIComponent(wikiQuery)}`,
        tabs: [
          { title: `Тикет ${ticketId}`, url: `https://support.example.com/tickets/${ticketId}`, active: false },
          { title: `${wikiQuery} — Wiki`, url: `https://docs.example-wiki.ru/search?q=${encodeURIComponent(wikiQuery)}`, active: true },
        ],
        loadingProgress: 30,
      }))
      scheduler.tweenProgress(30, 70, 1000, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
    }, 7000)

    schedule(() => {
      debugPhase("wiki_search_results", nextIdx)
      scheduler.tweenProgress(70, 100, 800, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      }, () => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({
          ...prev,
          phase: "wiki_search_results",
          searchResults: found ? searchResults : searchResults.slice(0, 1),
          loadingProgress: 100,
        }))
        if (found) addChat("agent", `✓ Найдено ${searchResults.length} статей в wiki`)
      })
    }, 8500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({ ...prev, phase: "wiki_article_click" }))
      addChat("agent", `👆 Перехожу к статье "${searchResults[0].title}"...`)
    }, 10000)

    schedule(() => {
      if (!found) return
      flashUrl()
      setBrowser({
        ...IDLE_BROWSER,
        phase: "wiki_article_loading",
        tabs: [
          { title: `Тикет ${ticketId}`, url: `https://support.example.com/tickets/${ticketId}`, active: false },
          { title: `${wikiQuery} — Wiki`, url: `https://docs.example-wiki.ru/search?q=${encodeURIComponent(wikiQuery)}`, active: false },
          { title: article!.title, url: searchResults[0].url, active: true },
        ],
        url: searchResults[0].url,
        query: wikiQuery,
        ticketQuestion: ticket.question,
        ticketId,
        searchResults: found ? searchResults : [],
        articleTitle: "",
        articleSections: [],
        loadingProgress: 0,
        highlightedSection: -1,
      })
      addChat("agent", `📄 Загружаю статью...`)
      scheduler.tweenProgress(0, 60, 1200, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      })
    }, 11000)

    schedule(() => {
      if (!found) return
      scheduler.tweenProgress(60, 100, 800, (v) => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({ ...prev, loadingProgress: v }))
      }, () => {
        if (scheduler.isStale(myRunId)) return
        setBrowser((prev) => ({
          ...prev,
          phase: "wiki_article_page",
          articleTitle: article!.title,
          articleSections: article!.sections,
          loadingProgress: 100,
          highlightedSection: -1,
        }))
        addChat("agent", `📖 Статья загружена, извлекаю ответ...`)
      })
    }, 13000)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        highlightedSection: 0,
      }))
      addChat("agent", `✨ Найден релевантный раздел`)
    }, 14500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "wiki_answer_found",
        foundAnswer: found ? answer : "",
        foundSource: found ? source : "",
        highlightedSection: -1,
      }))
      if (found) {
        addChat("agent", `✅ Ответ найден в wiki`)
      } else {
        addChat("agent", `❌ Ответ не найден в wiki`)
      }
    }, 15500)

    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({
        ...prev,
        phase: "back_to_ticket",
        typedComment: "",
        commentVerified: false,
      }))
      addChat("agent", `🔄 Возвращаюсь к тикету для написания ответа...`)
      debugPhase("back_to_ticket", nextIdx)
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        tabs: prev.tabs.map((tab) => ({
          ...tab,
          active: tab.title.startsWith("Тикет"),
        })),
        url: `https://support.example.com/tickets/${ticketId}`,
      }))
    }, 16500)

    schedule(() => {
      setAgentActivePane(2)
      setBrowser((prev) => ({ ...prev, phase: "comment_typing" }))
      if (found) {
        addChat("agent", `✍️ Вписываю ответ в поле комментария...`)
      } else {
        addChat("agent", `📝 Вписываю результат в поле комментария...`)
      }

      if (found) {
        let charIdx = 0
        const commentText = answer
        const typingInterval = setInterval(() => {
          if (scheduler.isStale(myRunId) || !isRunningRef.current) {
            clearInterval(typingInterval)
            scheduler.scheduledIntervals.delete(typingInterval)
            return
          }
          charIdx++
          setBrowser((prev) => ({
            ...prev,
            typedComment: commentText.slice(0, charIdx),
          }))
          if (charIdx >= commentText.length) {
            clearInterval(typingInterval)
            scheduler.scheduledIntervals.delete(typingInterval)
          }
        }, 18)
        scheduler.trackInterval(typingInterval)
      }
    }, 17500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "comment_inserted",
        typedComment: found ? answer : "Ответ не найден в базе знаний",
      }))
      addChat("agent", `📋 Комментарий вставлен в текстовое поле`)
    }, 19500)

    schedule(() => {
      setBrowser((prev) => ({ ...prev, phase: "comment_checking" }))
      addChat("agent", `🔍 Проверяю, что комментарий корректно вставился...`)
    }, 20500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "comment_verified",
        commentVerified: true,
      }))
      if (found) {
        addChat("agent", `✅ Комментарий проверен — текст совпадает, отправляю`)
      } else {
        addChat("agent", `✅ Проверка пройдена, записываю результат`)
      }
    }, 22000)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 23000)

    schedule(() => {
      setTicketData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                question: ticket.question,
                answer: found ? answer : "",
                source: found ? source : "",
                status: found ? ("отвечено" as const) : ("не найдено" as const),
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[ticket-reply:processing] row done", {
          rowIndex: nextIdx,
          found,
        })
      }
      const t = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(t)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 24000)
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
  }, [addChat, scheduler])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    isRunningRef.current = false
    setUserTouchedTab(false)
    scheduler.cancelAll()
    addChat("agent", "⏸ Пауза.")
  }, [addChat, scheduler])

  const phaseLabel: Record<LocalPhase, string> = {
    idle: "",
    ticket_open: "Открытие тикета...",
    ticket_reading: "Чтение вопроса",
    new_tab_wiki: "Открытие wiki...",
    wiki_search_typing: "Ввод запроса...",
    wiki_search_loading: "Поиск в wiki...",
    wiki_search_results: "Результаты поиска",
    wiki_article_click: "Открытие статьи...",
    wiki_article_loading: "Загрузка статьи...",
    wiki_article_page: "Статья wiki",
    wiki_answer_found: "Ответ найден!",
    back_to_ticket: "Возврат к тикету...",
    comment_typing: "Ввод комментария...",
    comment_inserted: "Комментарий вставлен",
    comment_checking: "Проверка комментария...",
    comment_verified: "Комментарий проверен ✓",
  }

  const StatusBadge = ({ status }: { status: DataRow["status"] }) => {
    const styles: Record<string, string> = {
      ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      отвечено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      "не найдено": "bg-red-500/15 text-red-700 dark:text-red-400",
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
        <h2 className="text-lg font-semibold">Обработка тикетов ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент открывает тикет, ищет ответ в wiki-документации и формирует ответ пользователю.
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
            className={
              !isRunning
                ? "shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/40 active:scale-100"
                : ""
            }
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
              Таблица тикетов
              {currentIndex >= 0 && !isDone && (
                <span className="text-xs text-muted-foreground">
                  тикет {currentIndex + 1}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 pb-0">
            <ScrollArea className="h-[calc(100dvh-320px)] md:h-[460px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-8 px-1.5 py-1 font-medium">#</th>
                    <th className="px-1.5 py-1 font-medium">Вопрос</th>
                    <th className="hidden px-1.5 py-1 font-medium sm:table-cell">Ответ</th>
                    <th className="w-20 px-1.5 py-1 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketData.map((row) => {
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
                              : row.status === "отвечено"
                                ? "bg-emerald-500/5"
                                : row.status === "не найдено"
                                  ? "bg-red-500/5"
                                  : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="px-1.5 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="max-w-[180px] truncate px-1.5 py-1 font-medium">{row.question}</td>
                        <td className="hidden max-w-[200px] truncate px-1.5 py-1 sm:table-cell">
                          {row.answer || "—"}
                        </td>
                        <td className="px-1.5 py-1">
                          <StatusBadge status={row.status} />
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
                    {phaseLabel[browser.phase]}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент ищет ответы в wiki-документации"
                  : browser.phase === "ticket_open" || browser.phase === "ticket_reading"
                    ? "ИИ-агент открывает тикет и читает вопрос"
                    : browser.phase === "new_tab_wiki"
                      ? "ИИ-агент открывает новую вкладку с wiki-документацией"
                      : browser.phase === "wiki_search_typing" || browser.phase === "wiki_search_loading"
                        ? "ИИ-агент ищет ответ в wiki-документации"
                        : browser.phase === "wiki_search_results" || browser.phase === "wiki_article_click"
                          ? "ИИ-агент анализирует результаты поиска в wiki"
                          : browser.phase === "wiki_article_loading" || browser.phase === "wiki_article_page"
                            ? "ИИ-агент изучает статью wiki и извлекает ответ"
                            : browser.phase === "wiki_answer_found"
                              ? "ИИ-агент нашёл ответ в wiki"
                              : browser.phase === "back_to_ticket"
                                ? "ИИ-агент возвращается к тикету для написания ответа"
                                : browser.phase === "comment_typing"
                                  ? "ИИ-агент вводит ответ в поле комментария тикета"
                                  : browser.phase === "comment_inserted"
                                    ? "Комментарий вставлен в текстовое поле"
                                    : browser.phase === "comment_checking"
                                      ? "ИИ-агент проверяет, что комментарий корректно вставился"
                                      : "Комментарий проверен и подтверждён"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="flex items-center overflow-x-auto border-b bg-muted/30">
                {browser.tabs.map((tab, i) => (
                  <div
                    key={i}
                    className={`flex shrink-0 items-center gap-1.5 border-r px-2 py-1 text-[9px] transition-all duration-200 ${
                      tab.active
                        ? "border-b-2 border-b-blue-500 bg-background font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab.active && (
                      <span className="size-1 animate-pulse rounded-full bg-blue-500" />
                    )}
                    <span className="max-w-[80px] truncate">{tab.title}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-b bg-muted/20 px-2 py-0.5">
                <div
                  className={`flex-1 truncate overflow-hidden rounded px-1.5 py-0.5 font-mono text-[9px] transition-colors duration-200 ${urlFlash ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" : "bg-background text-muted-foreground"} border`}
                >
                  {browser.phase === "idle" ? "about:blank" : browser.url}
                </div>
              </div>

              <div className="h-[300px] overflow-y-auto bg-background p-2.5">
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

                {(browser.phase === "ticket_open" || browser.phase === "ticket_reading") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <div className="flex size-8 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">
                        🎫
                      </div>
                      <div>
                        <div className="text-xs font-medium">Система тикетов</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.url}
                        </div>
                      </div>
                    </div>
                    {browser.phase === "ticket_open" && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${browser.loadingProgress}%` }} />
                      </div>
                    )}
                    {browser.phase === "ticket_reading" && (
                      <div className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[10px] font-medium text-muted-foreground">Тикет {browser.ticketId}</span>
                          <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 dark:text-orange-400">открыт</span>
                        </div>
                        <div className="text-xs font-medium">{browser.ticketQuestion}</div>
                      </div>
                    )}
                  </div>
                )}

                {(browser.phase === "new_tab_wiki" || browser.phase === "wiki_search_typing" || browser.phase === "wiki_search_loading" || browser.phase === "wiki_search_results" || browser.phase === "wiki_article_click") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <div className="flex size-8 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
                        W
                      </div>
                      <div className="flex-1 rounded-full border bg-background px-3 py-1.5 text-[11px]">
                        {browser.typedQuery}
                        {(browser.phase === "wiki_search_typing") && <span className="ml-0.5 animate-pulse">|</span>}
                      </div>
                    </div>
                    {(browser.phase === "wiki_search_loading" || browser.phase === "wiki_search_results" || browser.phase === "wiki_article_click") && (
                      <div className="space-y-2">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${browser.loadingProgress}%` }} />
                        </div>
                        {(browser.phase === "wiki_search_results" || browser.phase === "wiki_article_click") && (
                          <div className="flex flex-col gap-2">
                            {browser.searchResults.map((r, i) => (
                              <div
                                key={i}
                                className={`rounded-lg border p-2 transition-all duration-200 ${
                                  browser.phase === "wiki_article_click" && i === 0
                                    ? "border-blue-200 bg-blue-50/50 shadow-sm dark:bg-blue-950/20"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <div className="mb-0.5 truncate font-mono text-[10px] text-green-700 dark:text-green-400">
                                  {r.url}
                                </div>
                                <div className="mb-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                  {r.title}
                                </div>
                                <div className="line-clamp-1 text-[10px] text-muted-foreground">
                                  {r.snippet}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(browser.phase === "wiki_article_loading" || browser.phase === "wiki_article_page" || browser.phase === "wiki_answer_found") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded bg-blue-600 text-lg">
                        📖
                      </div>
                      <div>
                        <div className="text-xs font-medium">{browser.articleTitle || "Загрузка..."}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.url}
                        </div>
                      </div>
                    </div>
                    {browser.phase === "wiki_article_loading" && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${browser.loadingProgress}%` }} />
                      </div>
                    )}
                    {(browser.phase === "wiki_article_page" || browser.phase === "wiki_answer_found") && browser.articleSections.length > 0 && (
                      <div className="space-y-2">
                        {browser.articleSections.map((section, i) => (
                          <div
                            key={i}
                            className={`rounded-lg border p-2 transition-all duration-200 ${
                              browser.highlightedSection === i
                                ? "border-emerald-300 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="mb-1 text-[11px] font-semibold">{section.heading}</div>
                            <div className="text-[10px] leading-relaxed text-muted-foreground whitespace-pre-line">
                              {section.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {browser.phase === "wiki_answer_found" && browser.foundAnswer && (
                      <div className="animate-in zoom-in rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-3 duration-300 dark:bg-emerald-950/20">
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Ответ найден в wiki
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                          {browser.foundAnswer}
                        </div>
                        <div className="mt-2 truncate font-mono text-[9px] text-emerald-600 dark:text-emerald-300">
                          Источник: {browser.foundSource}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {browser.phase === "back_to_ticket" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <div className="flex size-8 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">
                        🎫
                      </div>
                      <div>
                        <div className="text-xs font-medium">Система тикетов</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.url}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">Тикет {browser.ticketId}</span>
                        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 dark:text-orange-400">открыт</span>
                      </div>
                      <div className="text-xs font-medium">{browser.ticketQuestion}</div>
                    </div>
                  </div>
                )}

                {(browser.phase === "comment_typing" || browser.phase === "comment_inserted" || browser.phase === "comment_checking" || browser.phase === "comment_verified") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <div className="flex size-8 items-center justify-center rounded bg-orange-500 text-xs font-bold text-white">
                        🎫
                      </div>
                      <div>
                        <div className="text-xs font-medium">Система тикетов</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.url}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground">Тикет {browser.ticketId}</span>
                        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 dark:text-orange-400">открыт</span>
                      </div>
                      <div className="mb-2 text-xs font-medium">{browser.ticketQuestion}</div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-muted-foreground">
                          Комментарий агента:
                        </label>
                        <div
                          className={`min-h-[60px] rounded-md border p-2 text-[11px] leading-relaxed transition-all duration-300 ${
                            browser.phase === "comment_inserted"
                              ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-300/50 dark:border-blue-600 dark:bg-blue-950/30"
                              : browser.phase === "comment_checking"
                                ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-300/50 dark:border-amber-600 dark:bg-amber-950/30"
                                : browser.phase === "comment_verified"
                                  ? "border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-300/50 dark:border-emerald-600 dark:bg-emerald-950/30"
                                  : "border-muted-foreground/20 bg-background"
                          }`}
                        >
                          <span>{browser.typedComment}</span>
                          {browser.phase === "comment_typing" && (
                            <span className="ml-0.5 animate-pulse text-muted-foreground">|</span>
                          )}
                        </div>
                        {browser.phase === "comment_inserted" && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                            <span className="animate-pulse">📥</span>
                            <span>Комментарий вставлен в текстовое поле</span>
                          </div>
                        )}
                        {browser.phase === "comment_checking" && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                            <div className="flex items-center gap-0.5">
                              <span className="inline-block animate-spin text-[8px]">⟳</span>
                            </div>
                            <span>Проверяю корректность вставленного текста...</span>
                          </div>
                        )}
                        {browser.phase === "comment_verified" && browser.commentVerified && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span>✅</span>
                            <span className="font-medium">Комментарий проверен — текст совпадает</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {browser.phase === "comment_verified" && browser.foundAnswer && (
                      <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-2 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          <span>✅</span>
                          Ответ подтверждён, отправка тикета
                        </div>
                      </div>
                    )}
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