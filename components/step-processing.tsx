"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StepProcessingProps {
  onBack: () => void
}

interface DataRow {
  id: number
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
}

type BrowserPhase =
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

interface BrowserTab {
  title: string
  url: string
  active: boolean
}

interface BrowserState {
  phase: BrowserPhase
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

const PRODUCTS = [
  "iPhone 15 Pro Max 256GB",
  'MacBook Air M3 15"',
  "Samsung Galaxy S24 Ultra",
  "PlayStation 5 Slim",
  "Nintendo Switch OLED",
  "Xbox Series X",
  'iPad Pro 11" M4',
  "AirPods Pro 2",
  "Dyson V15 Detect",
  "Sony WH-1000XM5",
  'LG OLED C4 65"',
  "Bose QuietComfort Ultra",
  "Canon EOS R6 Mark II",
  "GoPro Hero 12 Black",
  "DJI Mini 4 Pro",
  "Kindle Paperwhite 5",
  "Apple Watch Ultra 2",
  "Samsung Galaxy Watch 6 Classic",
  "Garmin Fenix 7X Pro",
  "Meta Quest 3",
  "Steam Deck OLED",
  "ROG Ally X",
  "Razer Blade 16",
  "ThinkPad X1 Carbon Gen 11",
  "Surface Pro 10",
  "Dell XPS 15 9530",
  "HP Spectre x360 14",
  "ASUS Zenbook 14 OLED",
  "Mac Studio M2 Ultra",
  "Mac mini M2 Pro",
  "Samsung 990 Pro 2TB",
  "WD Black SN850X 2TB",
  "Corsair DDR5 32GB Kit",
  "NVIDIA RTX 4090",
  "AMD Ryzen 9 7950X3D",
  "Intel Core i9-14900K",
  "ASUS ROG Maximus Z790",
  "NZXT Kraken Z73 RGB",
  "Corsair RM1000x",
  "Fractal Design Torrent",
  "Sony A7 IV Body",
  "Fujifilm X-T5",
  "Nikon Z8",
  "Sigma 24-70mm f/2.8",
  "Rode NT1 5th Gen",
  "Elgato Stream Deck MK.2",
  "Logitech MX Master 3S",
  "Keychron Q1 Pro",
  'Samsung 49" Odyssey G9',
  'LG 27" UltraFine 5K',
  "BenQ PD3220U",
  "ASUS ProArt PA32UCG-K",
  "Dell U3223QE",
  "EIZO ColorEdge CG319X",
  "Raspberry Pi 5 8GB",
  "Arduino Uno R4 WiFi",
  "ESP32-S3 DevKit",
  "Flipper Zero",
  "Anker 737 Power Bank",
  "Shargeek 140W Power Bank",
  "Apple Magic Keyboard",
  "Logitech MX Keys S",
  "Razer Huntsman V3 Pro",
  "SteelSeries Apex Pro TKL",
  "HyperX Cloud III Wireless",
  "SteelSeries Arctis Nova Pro",
  "Sennheiser HD 660S2",
  "Focal Clear Mg",
  "iFi Zen DAC V2",
  "FiiO K7",
  "Topping DX3 Pro+",
  "Audio-Technica LP120X",
  "Pro-Ject Debut Carbon EVO",
  "KEF LSX II",
  "Sonos Era 300",
  "JBL Charge 5",
  "Marshall Stanmore III",
  "Bowers & Wilkins Zeppelin",
  "Nest Hub Max",
  "Echo Show 10",
  "Apple HomePod 2",
  "Ring Doorbell 4",
  "Philips Hue Starter Kit",
  "TP-Link Deco XE75 Pro",
  "Ubiquiti Dream Machine SE",
  "Synology DS923+",
  "QNAP TS-464",
  "WD Red Plus 8TB",
  "Seagate IronWolf 8TB",
  "Tesla Model 3 Accessories Kit",
  "DJI Osmo Pocket 3",
  "Insta360 X4",
  "Peak Design Travel Tripod",
  "Moment MT-24 Lens Filter",
  "Apple AirTag 4-Pack",
  "Tile Pro 2-Pack",
  "Anker 715 PowerPort",
  "UGREEN 100W USB-C Hub",
  "CalDigit TS4 Dock",
  "Elgato Key Light Mini",
  "Rode PodMic USB",
]

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
  {
    name: "Wildberries",
    domain: "wildberries.ru",
    color: "#cb11ab",
    icon: "🟪",
  },
  {
    name: "Яндекс Маркет",
    domain: "market.yandex.ru",
    color: "#ffcc00",
    icon: "🟨",
  },
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

export function StepProcessing({ onBack }: StepProcessingProps) {
  const [data, setData] = React.useState<DataRow[]>(() =>
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
  const [tableFlash, setTableFlash] = React.useState(false)
  const [chatFading, setChatFading] = React.useState(false)

  const dataRef = React.useRef(data)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)

  React.useEffect(() => {
    dataRef.current = data
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

  const processedCount = data.filter(
    (r) => r.status === "найдено" || r.status === "не найдено"
  ).length
  const progress = Math.round((processedCount / data.length) * 100)

  const flashUrl = React.useCallback(() => {
    setUrlFlash(true)
    setTimeout(() => setUrlFlash(false), 400)
  }, [])

  const processNext = React.useCallback(() => {
    if (!isRunningRef.current) return

    const nextIdx = currentIndexRef.current + 1
    if (nextIdx >= dataRef.current.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все строки обработаны.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const product = dataRef.current[nextIdx].product
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

    // STEP 1: Read from table — first fade out & clear chat
    schedule(() => {
      setActivePane(1)
      setChatFading(true)
    }, 0)

    schedule(() => {
      setChat([])
      setChatFading(false)
    }, 400)

    schedule(() => {
      setActivePane(0)
      setTableFlash(true)
      setTimeout(() => setTableFlash(false), 600)
      setData((prev) =>
        prev.map((row, i) =>
          i === nextIdx ? { ...row, status: "обработка" as const } : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `📋 Беру данные из таблицы: "${product}"`)
    }, 700)

    // Pause to show table highlight
    schedule(() => {
      setActivePane(1)
      addChat("agent", `🔍 Начинаю поиск цены для "${product}"`)
    }, 1500)

    // STEP 2: Open Google, start typing
    schedule(() => {
      setActivePane(2)
      setBrowser({
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
    }, 2000)

    // Typing animation
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

    // Google loading after typing
    schedule(() => {
      flashUrl()
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

    // Google results appear
    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "google_results",
        loadingProgress: 100,
        searchResults: found ? searchResults : searchResults.slice(0, 1),
      }))
      if (found)
        addChat("agent", `✓ Google нашёл ${searchResults.length} результатов`)
    }, 5000)

    // Click first result
    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "click_result",
      }))
      addChat("agent", `👆 Перехожу на ${markets[0].name}...`)
    }, 6500)

    // Navigating to market
    schedule(() => {
      if (!found) return
      flashUrl()
      setBrowser({
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

    // Market loading progress
    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_loading",
        loadingProgress: 50,
      }))
    }, 8500)

    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({ ...prev, loadingProgress: 80 }))
    }, 9500)

    // Market page loaded
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

    // Highlight best price
    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_highlight",
        highlightedItem: 0,
      }))
      addChat("agent", `💰 Нашёл цену на ${markets[0].name}`)
    }, 12000)

    // Switch to second market tab
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

    // Second market loading
    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market2_loading",
        loadingProgress: 60,
      }))
    }, 14500)

    // Second market page
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

    // Highlight on second market
    schedule(() => {
      if (!found) return
      setBrowser((prev) => ({
        ...prev,
        phase: "market_highlight",
        highlightedItem: 0,
      }))
    }, 16500)

    // Price confirmed
    schedule(() => {
      setActivePane(1)
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

    // STEP 3: Writing to table
    schedule(() => {
      setActivePane(1)
      setBrowser((prev) => ({
        ...prev,
        phase: "writing",
      }))
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 19500)

    schedule(() => {
      setActivePane(0)
      setTableFlash(true)
    }, 20200)

    // Done, next
    schedule(() => {
      setData((prev) =>
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
      setTimeout(() => setTableFlash(false), 600)
      setBrowser({ ...IDLE_BROWSER })
      setActivePane(0)
      processNextRef.current()
    }, 21000)
  }, [addChat, flashUrl])

  React.useEffect(() => {
    processNextRef.current = processNext
  }, [processNext])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    isRunningRef.current = true
    addChat("agent", "🚀 Агент запущен.")
    setTimeout(() => processNextRef.current(), 300)
  }, [addChat])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    isRunningRef.current = false
    addChat("agent", "⏸ Пауза.")
  }, [addChat])

  const activeMarket = MARKETPLACES.find((m) => m.name === browser.currentPage)

  const phaseLabel: Record<BrowserPhase, string> = {
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

  const [showCta, setShowCta] = React.useState(false)
  const [ctaCollapsed, setCtaCollapsed] = React.useState(false)

  React.useEffect(() => {
    if (isRunning && !showCta) {
      const timer = setTimeout(() => setShowCta(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [isRunning, showCta])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 4 из 4</Badge>
        <h2 className="text-lg font-semibold">Обработка данных ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент ищет цены через браузер — вводит запрос в Google, переходит на
        маркетплейсы и записывает результат.
      </p>

      <div className="flex items-center gap-4">
        <Progress value={progress} className="flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">
          {processedCount}/{data.length} ({progress}%)
        </span>
        {!isDone && (
          <Button
            size="sm"
            variant={isRunning ? "outline" : "default"}
            onClick={isRunning ? handlePause : handleStart}
          >
            {isRunning ? "⏸ Пауза" : "▶ Запуск"}
          </Button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3 xl:grid-cols-3">
        <Card
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 0 && isRunning ? "shadow-md ring-2 ring-emerald-500/30" : ""}`}
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
            <ScrollArea className="h-[460px]">
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
                  {data.map((row) => {
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
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 1 && isRunning ? "shadow-md ring-2 ring-purple-500/30" : ""}`}
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
            <ScrollArea className="h-[460px] pr-2">
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
                      <span
                        className="animate-bounce text-[8px] text-muted-foreground"
                        style={{ animationDelay: "0ms" }}
                      >
                        ●
                      </span>
                      <span
                        className="animate-bounce text-[8px] text-muted-foreground"
                        style={{ animationDelay: "150ms" }}
                      >
                        ●
                      </span>
                      <span
                        className="animate-bounce text-[8px] text-muted-foreground"
                        style={{ animationDelay: "300ms" }}
                      >
                        ●
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card
          className={`flex min-h-0 flex-col transition-all duration-300 ${activePane === 2 && isRunning ? "shadow-md ring-2 ring-blue-500/30" : ""}`}
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
                    {phaseLabel[browser.phase]}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент управляет браузером через MCP Playwright для поиска цен"
                  : browser.phase === "typing" ||
                      browser.phase === "google_loading"
                    ? "ИИ-агент вводит поисковый запрос в Google"
                    : browser.phase === "google_results" ||
                        browser.phase === "click_result"
                      ? "ИИ-агент анализирует результаты и переходит на маркетплейс"
                      : browser.phase.startsWith("market") ||
                          browser.phase === "market2_loading" ||
                          browser.phase === "market2_page"
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
                {/* IDLE */}
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

                {/* TYPING in Google */}
                {browser.phase === "typing" && (
                  <div className="flex flex-col items-center gap-5 py-6">
                    <div className="text-3xl font-bold tracking-tight">
                      <span style={{ color: "#4285f4" }}>G</span>
                      <span style={{ color: "#ea4335" }}>o</span>
                      <span style={{ color: "#fbbc05" }}>o</span>
                      <span style={{ color: "#4285f4" }}>g</span>
                      <span style={{ color: "#34a853" }}>l</span>
                      <span style={{ color: "#ea4335" }}>e</span>
                    </div>
                    <div className="relative w-72">
                      <div className="w-full rounded-full border-2 border-muted bg-background px-4 py-2 text-sm text-foreground">
                        {browser.typedQuery}
                        <span className="animate-pulse text-blue-500">|</span>
                      </div>
                      <div className="absolute top-2.5 right-3 flex gap-1.5">
                        <span className="text-muted-foreground">🎤</span>
                        <span className="text-muted-foreground">🔍</span>
                      </div>
                    </div>
                    <div className="mt-1 flex gap-2">
                      <div className="rounded border bg-muted/50 px-3 py-1 text-[10px] text-muted-foreground">
                        Поиск в Google
                      </div>
                      <div className="rounded border bg-muted/50 px-3 py-1 text-[10px] text-muted-foreground">
                        Мне повезёт!
                      </div>
                    </div>
                  </div>
                )}

                {/* GOOGLE LOADING */}
                {browser.phase === "google_loading" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl font-bold">
                      <span style={{ color: "#4285f4" }}>G</span>
                      <span style={{ color: "#ea4335" }}>o</span>
                      <span style={{ color: "#fbbc05" }}>o</span>
                      <span style={{ color: "#4285f4" }}>g</span>
                      <span style={{ color: "#34a853" }}>l</span>
                      <span style={{ color: "#ea4335" }}>e</span>
                    </div>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${browser.loadingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* GOOGLE RESULTS */}
                {browser.phase === "google_results" && (
                  <div className="animate-in fade-in flex flex-col gap-2.5 duration-300">
                    <div className="mb-1 text-[10px] text-muted-foreground">
                      Около 1,2 млн результатов (0,32 сек.)
                    </div>
                    {browser.searchResults.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-2.5 transition-all duration-200 ${
                          i === 0
                            ? "cursor-pointer border-blue-200 bg-blue-50/50 shadow-sm hover:border-blue-300 hover:shadow-md dark:bg-blue-950/20"
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
                          className={`mb-0.5 text-xs font-medium ${i === 0 ? "text-blue-700 dark:text-blue-400" : "text-foreground"}`}
                        >
                          {r.title}
                        </div>
                        <div className="line-clamp-1 text-[10px] text-muted-foreground">
                          {r.snippet}
                        </div>
                        {i === 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-blue-600 dark:text-blue-400">
                            <span className="inline-flex size-3 items-center justify-center rounded bg-blue-500 text-[7px] text-white">
                              ▸
                            </span>
                            ИИ-агент переходит...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* CLICK RESULT */}
                {browser.phase === "click_result" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-8">
                    <div className="relative">
                      <span className="text-xl text-blue-500">⟳</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Переход на {browser.currentPage}...
                    </p>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full animate-pulse bg-blue-500 transition-all"
                        style={{ width: "40%" }}
                      />
                    </div>
                  </div>
                )}

                {/* PAGE TRANSITION */}
                {browser.phase === "page_transition" && (
                  <div className="flex flex-col gap-3 py-2">
                    <div className="flex items-center gap-2">
                      {activeMarket && (
                        <span className="text-sm">{activeMarket.icon}</span>
                      )}
                      <span className="text-xs font-medium">
                        {browser.currentPage}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                      <div className="h-16 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500 ease-out"
                          style={{ width: `${browser.loadingProgress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {browser.loadingProgress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* MARKET LOADING */}
                {(browser.phase === "market_loading" ||
                  browser.phase === "market2_loading") && (
                  <div className="flex flex-col gap-3 py-2">
                    <div className="flex items-center gap-2">
                      {activeMarket && (
                        <span className="text-sm">{activeMarket.icon}</span>
                      )}
                      <span className="text-xs font-medium">
                        {browser.currentPage}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-16 w-full animate-pulse rounded bg-muted" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${browser.loadingProgress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        {browser.loadingProgress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* MARKET PAGE */}
                {(browser.phase === "market_page" ||
                  browser.phase === "market2_page") && (
                  <div className="animate-in fade-in flex flex-col gap-2.5 duration-300">
                    <div className="mb-1 flex items-center gap-2">
                      {activeMarket && (
                        <span className="text-sm">{activeMarket.icon}</span>
                      )}
                      <span className="text-xs font-medium">
                        {browser.currentPage}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        — «{browser.query}»
                      </span>
                    </div>
                    {browser.marketItems.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border p-2 transition-all duration-300 ${
                          i === browser.highlightedItem
                            ? "scale-[1.01] border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-400/20 dark:bg-amber-950/20"
                            : ""
                        }`}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted/50 text-lg">
                          📦
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-amber-500">
                              ★
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.rating}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div
                            className={`text-xs font-bold ${i === browser.highlightedItem ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
                          >
                            {item.price}
                          </div>
                          {i === 0 && i !== browser.highlightedItem && (
                            <div className="text-[9px] text-muted-foreground">
                              в наличии
                            </div>
                          )}
                          {i === browser.highlightedItem && (
                            <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                              ✓ лучшая цена
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MARKET HIGHLIGHT */}
                {browser.phase === "market_highlight" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="mb-1 flex items-center gap-2">
                      {activeMarket && (
                        <span className="text-sm">{activeMarket.icon}</span>
                      )}
                      <span className="text-xs font-medium">
                        {browser.currentPage}
                      </span>
                    </div>
                    {browser.marketItems.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border p-2 transition-all duration-300 ${
                          i === browser.highlightedItem
                            ? "border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-400/30 dark:bg-amber-950/20"
                            : "opacity-60"
                        }`}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted/50 text-lg">
                          📦
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium">
                            {item.name}
                          </div>
                          <span className="text-[10px] text-amber-500">
                            ★ {item.rating}
                          </span>
                        </div>
                        <div className="shrink-0 text-right">
                          <div
                            className={`text-xs font-bold ${i === browser.highlightedItem ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
                          >
                            {item.price}
                          </div>
                          {i === browser.highlightedItem && (
                            <div className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                              ✓ лучшая цена
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB SWITCH */}
                {browser.phase === "tab_switch" && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <div className="flex items-center gap-1">
                      {browser.tabs.map((tab, i) => (
                        <div
                          key={i}
                          className={`rounded px-2 py-1 text-[9px] transition-all duration-200 ${tab.active ? "scale-110 bg-blue-500 text-white" : "bg-muted text-muted-foreground"}`}
                        >
                          {tab.title}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Переключаюсь на {browser.currentPage}...
                    </p>
                  </div>
                )}

                {/* PRICE FOUND */}
                {browser.phase === "price_found" && (
                  <div className="animate-in zoom-in flex flex-col items-center gap-3 py-6 duration-300">
                    <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
                      💰
                    </div>
                    <div className="text-center">
                      <div className="mb-1 text-xs text-muted-foreground">
                        Цена найдена:
                      </div>
                      <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                        {browser.foundPrice}
                      </div>
                    </div>
                  </div>
                )}

                {/* WRITING */}
                {browser.phase === "writing" && (
                  <div className="animate-in fade-in flex flex-col items-center gap-3 py-6 duration-200">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/15">
                      <span className="text-lg text-blue-500">↗</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Записываю результат в таблицу...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t bg-muted/20 px-2 py-0.5 text-[9px] text-muted-foreground">
                <span
                  className={
                    browser.phase !== "idle"
                      ? "text-emerald-500"
                      : "text-muted-foreground/50"
                  }
                >
                  {browser.phase !== "idle" ? "●" : "○"} MCP Playwright
                </span>
                <span>
                  {browser.phase !== "idle"
                    ? `${currentIndex + 1}/${data.length}`
                    : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        {isDone && (
          <a
            href="https://panel.mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>Создать своего ИИ-агента</Button>
          </a>
        )}
      </div>

      {showCta && !isDone && (
        <div className="animate-in slide-in-from-bottom-4 fade-in fixed right-6 bottom-6 z-50 duration-500">
          {ctaCollapsed ? (
            <a
              href="https://panel.mimikkai.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="sm"
                className="gap-1.5 shadow-lg"
                onClick={(e) => {
                  e.preventDefault()
                  setCtaCollapsed(false)
                }}
              >
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-background/20 text-[8px]">
                  ✨
                </span>
                Создать своего ИИ-агента
                <span className="ml-1 text-xs opacity-60">▲</span>
              </Button>
            </a>
          ) : (
            <div className="w-80">
              <Card className="border-primary/30 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      ✨
                    </span>
                    Создание своего агента
                    <button
                      onClick={() => setCtaCollapsed(true)}
                      className="ml-auto p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Свернуть"
                    >
                      ▼
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Пока агент работает — вы можете создать своего ИИ-агента на
                    платформе MimikkAi для своих задач.
                  </p>
                  <a
                    href="https://panel.mimikkai.ru"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="w-full">
                      Создать своего ИИ-агента →
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    найдено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    "не найдено": "bg-red-500/15 text-red-700 dark:text-red-400",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-200 ${styles[status] || styles["ожидает"]}`}
    >
      {status === "обработка" && <span className="mr-1 animate-spin">⟳</span>}
      {status === "найдено" && <span className="mr-1">✓</span>}
      {status}
    </span>
  )
}
