"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PRODUCTS } from "../data"
import type { NormalizedBrowserPhase } from "../../types"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface DataRow {
  id: number
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
}

type LocalPhase =
  | "idle"
  | "typing"
  | "google_loading"
  | "google_results"
  | "click_result"
  | "page_transition"
  | "market_loading"
  | "market_page"
  | "market_highlight"
  | "tab_switch"
  | "market2_loading"
  | "market2_page"
  | "price_found"
  | "writing"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  typing: "typing",
  google_loading: "loading",
  google_results: "results",
  click_result: "results",
  page_transition: "loading",
  market_loading: "loading",
  market_page: "detail",
  market_highlight: "detail",
  tab_switch: "loading",
  market2_loading: "loading",
  market2_page: "detail",
  price_found: "done",
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
  query: string
  typedQuery: string
  currentPage: string
  searchResults: { title: string; url: string; snippet: string }[]
  marketItems: { name: string; price: string; rating: string }[]
  foundPrice: string
  loadingProgress: number
  highlightedItem: number
}

const PRICE_RANGES: Record<string, [number, number]> = {
  iPhone: [89900, 129990],
  MacBook: [99990, 329990],
  "Samsung Galaxy S": [74990, 119990],
  PlayStation: [49990, 54990],
  Nintendo: [34990, 39990],
  Xbox: [49990, 54990],
  iPad: [79990, 199990],
  AirPods: [19990, 29990],
  Dyson: [39990, 59990],
  "Sony WH": [24990, 34990],
  "LG OLED": [129990, 299990],
  Bose: [24990, 44990],
  Canon: [149990, 249990],
  GoPro: [34990, 49990],
  DJI: [69990, 149990],
  Kindle: [11990, 17990],
  "Apple Watch": [29990, 79990],
  "Galaxy Watch": [24990, 44990],
  Garmin: [49990, 89990],
  "Meta Quest": [39990, 54990],
  "Steam Deck": [49990, 69990],
  ROG: [59990, 99990],
  Razer: [159990, 299990],
  ThinkPad: [99990, 199990],
  Surface: [89990, 179990],
  "Dell XPS": [119990, 249990],
  "HP Spectre": [89990, 149990],
  "Mac Studio": [249990, 599990],
  "Mac mini": [69990, 149990],
  NVIDIA: [89990, 199990],
  AMD: [29990, 54990],
  Intel: [29990, 54990],
}

const MARKETPLACES = [
  { name: "Ozon", domain: "ozon.ru", color: "#005bff", icon: "🟦" },
  { name: "Wildberries", domain: "wildberries.ru", color: "#cb11ab", icon: "🟪" },
  { name: "Яндекс Маркет", domain: "market.yandex.ru", color: "#ffcc00", icon: "🟨" },
  { name: "DNS", domain: "dns-shop.ru", color: "#ff6600", icon: "🟧" },
  { name: "Ситилинк", domain: "citilink.ru", color: "#e30611", icon: "🟥" },
]

function generatePrice(product: string): string {
  for (const [key, [min, max]] of Object.entries(PRICE_RANGES)) {
    if (product.includes(key)) {
      const price = Math.round((min + Math.random() * (max - min)) / 100) * 100
      return `${price.toLocaleString("ru-RU")} ₽`
    }
  }
  const price = Math.round((9990 + Math.random() * 80000) / 100) * 100
  return `${price.toLocaleString("ru-RU")} ₽`
}

function pickMarkets() {
  const shuffled = [...MARKETPLACES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function generateSearchResults(product: string, price: string) {
  const markets = pickMarkets()
  return [
    {
      title: `${product} — купить на ${markets[0].name}`,
      url: `https://${markets[0].domain}/catalog/${encodeURIComponent(product.toLowerCase())}`,
      snippet: `${product} по цене от ${price}. Доставка по всей России. Гарантия.`,
    },
    {
      title: `${product} — ${markets[1].name}`,
      url: `https://${markets[1].domain}/product/${encodeURIComponent(product.toLowerCase())}`,
      snippet: `Купить ${product} с быстрой доставкой. ${price}. Отзывы покупателей.`,
    },
    {
      title: `${product} цена — ${markets[2].name}`,
      url: `https://${markets[2].domain}/search?q=${encodeURIComponent(product)}`,
      snippet: `${product} в наличии. Цена: ${price}. Сравните цены.`,
    },
    {
      title: `${product} отзывы и цены`,
      url: `https://review-site.ru/${encodeURIComponent(product.toLowerCase())}`,
      snippet: `Обзоры и сравнение цен. Рейтинг 4.7 из 5.`,
    },
  ]
}

function generateMarketItems(product: string, price: string) {
  const num = parseInt(price.replace(/\D/g, ""))
  const discounted = Math.round((num * 0.92) / 100) * 100
  const bundled = Math.round((num * 1.15) / 100) * 100
  return [
    { name: product, price, rating: (4 + Math.random()).toFixed(1) },
    {
      name: `${product} (скидка)`,
      price: `${discounted.toLocaleString("ru-RU")} ₽`,
      rating: (4.2 + Math.random() * 0.7).toFixed(1),
    },
    {
      name: `${product} комплект`,
      price: `${bundled.toLocaleString("ru-RU")} ₽`,
      rating: (4.3 + Math.random() * 0.6).toFixed(1),
    },
  ]
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  tabs: [{ title: "Новая вкладка", url: "about:blank", active: true }],
  url: "about:blank",
  query: "",
  typedQuery: "",
  currentPage: "",
  searchResults: [],
  marketItems: [],
  foundPrice: "",
  loadingProgress: 0,
  highlightedItem: -1,
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [priceData, setPriceData] = React.useState<DataRow[]>(() =>
    PRODUCTS.map((product, i) => ({
      id: i + 1,
      product,
      price: "",
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

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const data = priceData
  const totalRows = PRODUCTS.length

  const priceDataRef = React.useRef(priceData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  React.useEffect(() => {
    priceDataRef.current = data
  }, [data])
  React.useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])
  React.useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  const processNextRef = React.useRef<() => void>(() => {})

  const addChat = React.useCallback(
    (role: "agent" | "system" | "divider", content: string) => {
      setChat((prev) => [...prev, { role, content }])
    },
    []
  )

  const processedCount = priceData.filter(
    (r) => r.status === "найдено" || r.status === "не найдено"
  ).length
  const progress = Math.round((processedCount / totalRows) * 100)

  const flashUrl = React.useCallback(() => {
    setUrlFlash(true)
    setTimeout(() => setUrlFlash(false), 400)
  }, [])

  const debugPhase = React.useCallback(
    (phase: LocalPhase, rowIndex: number) => {
      const normalized = PHASE_TO_NORMALIZED[phase]
      if (process.env.NODE_ENV !== "production") {
        console.debug("[price-search:processing] phase", {
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
    if (nextIdx >= priceDataRef.current.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все строки обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const product = priceDataRef.current[nextIdx].product
    const price = generatePrice(product)
    const found = Math.random() > 0.05
    const markets = pickMarkets()
    const googleQuery = product + " цена купить"

    const searchResults = found ? generateSearchResults(product, price) : []
    const marketItems1 = found ? generateMarketItems(product, price) : []
    const marketItems2 = found ? generateMarketItems(product, price) : []

    const schedule = (fn: () => void, ms: number) =>
      setTimeout(() => {
        if (isRunningRef.current) fn()
      }, ms)

    if (process.env.NODE_ENV !== "production") {
      console.info("[price-search:processing] row start", {
        rowIndex: nextIdx,
        product,
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
      setTimeout(() => setTableFlash(false), 600)
      setPriceData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, status: "обработка" as const } : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `📋 Беру данные из таблицы: "${product}"`)
    }, 700)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `🔍 Начинаю поиск цены для "${product}"`)
    }, 1500)

    schedule(() => {
      setAgentActivePane(2)
      debugPhase("typing", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "typing",
        tabs: [
          { title: "Google", url: "https://www.google.com/", active: true },
        ],
        url: "https://www.google.com/",
        query: googleQuery,
        typedQuery: "",
        currentPage: "google",
        searchResults: [],
        marketItems: [],
        foundPrice: "",
        loadingProgress: 0,
        highlightedItem: -1,
      })

      let charIdx = 0
      const typingInterval = setInterval(() => {
        if (!isRunningRef.current) {
          clearInterval(typingInterval)
          return
        }
        charIdx++
        setBrowser((prev) => ({
          ...prev,
          typedQuery: googleQuery.slice(0, charIdx),
        }))
        if (charIdx >= googleQuery.length) clearInterval(typingInterval)
      }, 50)
    }, 2000)

    schedule(() => {
      flashUrl()
      debugPhase("google_loading", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "google_loading",
        url: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`,
        tabs: [
          {
            title: `${googleQuery} — Google`,
            url: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`,
            active: true,
          },
        ],
        loadingProgress: 30,
      }))
      addChat("agent", `🌐 Ищу в Google: "${googleQuery}"`)
    }, 3500)

    schedule(() => {
      debugPhase("google_results", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "google_results",
        loadingProgress: 100,
        searchResults: found ? searchResults : searchResults.slice(0, 1),
      }))
      if (found)
        addChat("agent", `✓ Google нашёл ${searchResults.length} результатов`)
    }, 5000)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({ ...prev, phase: "click_result" }))
      addChat("agent", `👆 Перехожу на ${markets[0].name}...`)
    }, 6500)

    schedule(() => {
      if (!found) return
      flashUrl()
      setBrowser({
        ...IDLE_BROWSER,
        phase: "page_transition",
        tabs: [
          {
            title: `${googleQuery} — Google`,
            url: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`,
            active: false,
          },
          {
            title: markets[0].name,
            url: `https://${markets[0].domain}/product/${encodeURIComponent(product.toLowerCase())}`,
            active: true,
          },
        ],
        url: `https://${markets[0].domain}/product/${encodeURIComponent(product.toLowerCase())}`,
        query: product,
        typedQuery: "",
        currentPage: markets[0].name,
        searchResults: found ? searchResults : [],
        marketItems: [],
        foundPrice: "",
        loadingProgress: 15,
        highlightedItem: -1,
      })
    }, 7500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({ ...prev, phase: "market_loading", loadingProgress: 50 }))
    }, 8500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({ ...prev, loadingProgress: 80 }))
    }, 9500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_page",
        marketItems: marketItems1,
        loadingProgress: 100,
        highlightedItem: -1,
      }))
      addChat("agent", `📄 ${markets[0].name} загружен, ищу цену...`)
    }, 10500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_highlight",
        highlightedItem: 0,
      }))
      addChat("agent", `💰 Нашёл цену на ${markets[0].name}`)
    }, 12000)

    schedule(() => {
      if (!found) return
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "tab_switch",
        tabs: [
          {
            title: `${googleQuery} — Google`,
            url: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`,
            active: false,
          },
          {
            title: markets[0].name,
            url: `https://${markets[0].domain}/product/${encodeURIComponent(product.toLowerCase())}`,
            active: false,
          },
          {
            title: markets[1].name,
            url: `https://${markets[1].domain}/catalog/${encodeURIComponent(product.toLowerCase())}`,
            active: true,
          },
        ],
        url: `https://${markets[1].domain}/catalog/${encodeURIComponent(product.toLowerCase())}`,
        currentPage: markets[1].name,
        highlightedItem: -1,
        loadingProgress: 20,
      }))
      addChat("agent", `🔄 Проверяю ${markets[1].name} для сравнения...`)
    }, 13500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market2_loading",
        loadingProgress: 60,
      }))
    }, 14500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market2_page",
        marketItems: marketItems2,
        loadingProgress: 100,
        highlightedItem: -1,
      }))
    }, 15500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_highlight",
        highlightedItem: 0,
      }))
    }, 16500)

    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({
        ...prev,
        phase: "price_found",
        foundPrice: found ? price : "",
        highlightedItem: -1,
      }))
      if (found) {
        addChat("agent", `✅ Цена подтверждена: ${price}`)
      } else {
        addChat("agent", `❌ Цена не найдена`)
      }
    }, 18000)

    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({ ...prev, phase: "writing" }))
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 19500)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 20200)

    schedule(() => {
      setPriceData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                price: found ? price : "",
                status: found ? ("найдено" as const) : ("не найдено" as const),
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[price-search:processing] row done", {
          rowIndex: nextIdx,
          found,
          price: found ? price : null,
        })
      }
      setTimeout(() => setTableFlash(false), 600)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 21000)
  }, [addChat, flashUrl, setAgentActivePane, debugPhase])

  React.useEffect(() => {
    processNextRef.current = processNext
  }, [processNext])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    isRunningRef.current = true
    setUserTouchedTab(false)
    addChat("agent", "🚀 Агент запущен.")
    setTimeout(() => processNextRef.current(), 300)
  }, [addChat])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    isRunningRef.current = false
    setUserTouchedTab(false)
    addChat("agent", "⏸ Пауза.")
  }, [addChat])

  const activeMarket = MARKETPLACES.find((m) => m.name === browser.currentPage)

  const phaseLabel: Record<LocalPhase, string> = {
    idle: "",
    typing: "Ввод запроса...",
    google_loading: "Поиск в Google...",
    google_results: "Результаты поиска",
    click_result: "Клик по результату",
    page_transition: "Переход на сайт...",
    market_loading: "Загрузка страницы...",
    market_page: "Страница маркетплейса",
    market_highlight: "Проверяю цену",
    tab_switch: "Переключение вкладки...",
    market2_loading: "Загрузка страницы...",
    market2_page: "Страница маркетплейса",
    price_found: "Цена найдена!",
    writing: "Запись в таблицу...",
  }

  const StatusBadge = ({ status }: { status: DataRow["status"] }) => {
    const styles: Record<string, string> = {
      ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      найдено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
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
        <h2 className="text-lg font-semibold">Обработка данных ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент ищет цены через браузер — вводит запрос в Google, переходит на маркетплейсы и записывает результат.
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
                    <th className="w-8 px-1.5 py-1 font-medium">#</th>
                    <th className="px-1.5 py-1 font-medium">Название</th>
                    <th className="w-24 px-1.5 py-1 font-medium">Цена</th>
                    <th className="w-20 px-1.5 py-1 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {priceData.map((row) => {
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
                              : row.status === "найдено"
                                ? "bg-emerald-500/5"
                                : row.status === "не найдено"
                                  ? "bg-red-500/5"
                                  : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="px-1.5 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-1.5 py-1 font-medium">
                          {row.product}
                        </td>
                        <td className="px-1.5 py-1">{row.price || "—"}</td>
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
                  ? "ИИ-агент управляет браузером для поиска цен"
                  : browser.phase === "typing" || browser.phase === "google_loading"
                    ? "ИИ-агент вводит поисковый запрос в Google"
                    : browser.phase === "google_results" || browser.phase === "click_result"
                      ? "ИИ-агент анализирует результаты и переходит на маркетплейс"
                      : browser.phase.startsWith("market") || browser.phase === "market2_loading" || browser.phase === "market2_page"
                        ? "ИИ-агент ищет товар и проверяет цену на маркетплейсе"
                        : browser.phase === "tab_switch"
                          ? "ИИ-агент переключается на другой маркетплейс для сравнения"
                          : browser.phase === "price_found"
                            ? "ИИ-агент подтвердил цену и готов записать результат"
                            : browser.phase === "page_transition"
                              ? "ИИ-агент переходит на страницу маркетплейса"
                              : "ИИ-агент записывает найденную цену в таблицу данных"}
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
                    <span className="max-w-[60px] truncate">{tab.title}</span>
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

                {(browser.phase === "typing" || browser.phase === "google_loading" || browser.phase === "google_results" || browser.phase === "click_result") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <span className="text-base font-bold">
                        {browser.phase === "google_results" || browser.phase === "click_result" ? "G" : "G"}
                      </span>
                      <div className="flex-1 rounded-full border bg-background px-3 py-1.5 text-[11px]">
                        {browser.typedQuery}
                        {(browser.phase === "typing") && <span className="ml-0.5 animate-pulse">|</span>}
                      </div>
                    </div>
                    {(browser.phase === "google_loading" || browser.phase === "google_results" || browser.phase === "click_result") && (
                      <div className="space-y-2">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${browser.loadingProgress}%` }} />
                        </div>
                        {browser.phase === "google_results" || browser.phase === "click_result" ? (
                          <div className="flex flex-col gap-2">
                            {browser.searchResults.map((r, i) => (
                              <div
                                key={i}
                                className={`rounded-lg border p-2 transition-all duration-200 ${
                                  browser.phase === "click_result" && i === 0
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
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {(browser.phase === "page_transition" ||
                  browser.phase === "market_loading" ||
                  browser.phase === "market_page" ||
                  browser.phase === "market_highlight" ||
                  browser.phase === "tab_switch" ||
                  browser.phase === "market2_loading" ||
                  browser.phase === "market2_page" ||
                  browser.phase === "price_found") && (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded text-lg" style={{ background: activeMarket?.color || "#888", color: "white" }}>
                        {activeMarket?.icon?.[1] || "🟦"}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{browser.currentPage}</div>
                        <div className="font-mono text-[9px] text-muted-foreground">
                          {browser.url}
                        </div>
                      </div>
                    </div>
                    {browser.phase !== "price_found" && (
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full transition-all duration-300" style={{ width: `${browser.loadingProgress}%`, background: activeMarket?.color || "#888" }} />
                      </div>
                    )}
                    {(browser.phase === "market_page" || browser.phase === "market_highlight" || browser.phase === "market2_page" || browser.phase === "price_found") && (
                      <div className="space-y-1.5">
                        {browser.marketItems.map((item, i) => (
                          <div
                            key={i}
                            className={`rounded-lg border p-2 transition-all duration-200 ${
                              browser.highlightedItem === i
                                ? "border-emerald-300 bg-emerald-50/50 shadow-sm dark:bg-emerald-950/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[11px] font-medium">{item.name}</div>
                              <div className="text-[11px] font-bold text-foreground">{item.price}</div>
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              ⭐ {item.rating}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {browser.phase === "price_found" && browser.foundPrice && (
                      <div className="animate-in zoom-in rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-3 duration-300 dark:bg-emerald-950/20">
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          Цена подтверждена
                        </div>
                        <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                          {browser.foundPrice}
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
    </div>
  )
}
