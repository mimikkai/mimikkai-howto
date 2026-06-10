"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PRODUCTS, THREADS_POSTS } from "@/lib/case-config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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

interface ThreadsDataRow {
  id: number
  date: string
  postUrl: string
  postText: string
  comment: string
  status: "ожидает" | "обработка" | "Готово"
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
  threadsSearchQuery: string
  threadsTypedQuery: string
  threadsPosts: {
    author: string
    text: string
    time: string
    likes: number
    comments: number
  }[]
  threadsCurrentPost: {
    author: string
    text: string
    time: string
    likes: number
    comments: number
    url: string
  } | null
  threadsCommentText: string
  threadsTypedComment: string
  threadsPostUrl: string
  threadsCheckResults: string[]
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
  threadsSearchQuery: "",
  threadsTypedQuery: "",
  threadsPosts: [],
  threadsCurrentPost: null,
  threadsCommentText: "",
  threadsTypedComment: "",
  threadsPostUrl: "",
  threadsCheckResults: [],
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const isThreads = caseSlug === "threads-comments"

  const [priceData, setPriceData] = React.useState<DataRow[]>(() =>
    PRODUCTS.map((product, i) => ({
      id: i + 1,
      product,
      price: "",
      status: "ожидает" as const,
    }))
  )
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
  const [selectedRow, setSelectedRow] = React.useState<ThreadsDataRow | null>(null)

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const data = isThreads ? threadsData : priceData
  const totalRows = isThreads ? THREADS_POSTS.length : PRODUCTS.length

  const priceDataRef = React.useRef(priceData)
  const currentIndexRef = React.useRef(currentIndex)
  const isRunningRef = React.useRef(isRunning)
  const userTouchedTabRef = React.useRef(userTouchedTab)

  React.useEffect(() => {
    priceDataRef.current = priceData
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

  const processedCount = isThreads
    ? threadsData.filter((r) => r.status === "Готово").length
    : priceData.filter(
        (r) => r.status === "найдено" || r.status === "не найдено"
      ).length
  const progress = Math.round((processedCount / totalRows) * 100)

  const flashUrl = React.useCallback(() => {
    setUrlFlash(true)
    setTimeout(() => setUrlFlash(false), 400)
  }, [])

  const processNextPrice = React.useCallback(() => {
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

    // STEP 1: Read from table — first fade out & clear chat
    schedule(() => {
      setAgentActivePane(1)
      setChatFading(true)
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

    // Pause to show table highlight
    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `🔍 Начинаю поиск цены для "${product}"`)
    }, 1500)

    // STEP 2: Open Google, start typing
    schedule(() => {
      setAgentActivePane(2)
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

    // STEP 3: Writing to table
    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({
        ...prev,
        phase: "writing",
      }))
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 19500)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 20200)

    // Done, next
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
      setTimeout(() => setTableFlash(false), 600)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 21000)
  }, [addChat, flashUrl, setAgentActivePane])

  const processNextThreads = React.useCallback(() => {
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

    const schedule = (fn: () => void, ms: number) =>
      setTimeout(() => {
        if (isRunningRef.current) fn()
      }, ms)

    schedule(() => {
      setAgentActivePane(1)
      setChatFading(true)
    }, 0)

    schedule(() => {
      setChat([])
      setChatFading(false)
    }, 400)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
      setTimeout(() => setTableFlash(false), 600)
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
      setBrowser({
        ...IDLE_BROWSER,
        phase: "threads_home",
        tabs: [
          { title: "Threads", url: "https://www.threads.com/", active: true },
        ],
        url: "https://www.threads.com/",
        currentPage: "threads",
        threadsSearchQuery: searchQuery,
      })
    }, 2000)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_search_click",
      }))
      addChat("agent", `👆 Перехожу в раздел поиска...`)
    }, 3000)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_search_typing",
      }))

      let charIdx = 0
      const typingInterval = setInterval(() => {
        if (!isRunningRef.current) {
          clearInterval(typingInterval)
          return
        }
        charIdx++
        setBrowser((prev) => ({
          ...prev,
          threadsTypedQuery: searchQuery.slice(0, charIdx),
        }))
        if (charIdx >= searchQuery.length) clearInterval(typingInterval)
      }, 80)
    }, 3500)

    schedule(() => {
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_search_loading",
        url: `https://www.threads.com/search?q=${encodeURIComponent(searchQuery)}`,
        tabs: [
          {
            title: `Поиск: ${searchQuery}`,
            url: `https://www.threads.com/search?q=${encodeURIComponent(searchQuery)}`,
            active: true,
          },
        ],
        loadingProgress: 30,
      }))
      addChat("agent", `🌐 Ищу посты по запросу "${searchQuery}"...`)
    }, 4500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        loadingProgress: 70,
      }))
    }, 5500)

    schedule(() => {
      const feedPosts = THREADS_POSTS.slice(nextIdx, nextIdx + 3).map((p) => ({
        author: p.postUrl.match(/@([^/]+)/)?.[1] || "user",
        text:
          p.postText.length > 100
            ? p.postText.slice(0, 100) + "..."
            : p.postText,
        time: p.date,
        likes: Math.floor(Math.random() * 50) + 10,
        comments: Math.floor(Math.random() * 20) + 5,
      }))
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_feed",
        loadingProgress: 100,
        threadsPosts: feedPosts,
      }))
      addChat("agent", `✓ Найдены посты по теме AI`)
    }, 6500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_post_click",
      }))
      addChat("agent", `👆 Перехожу к посту @${handle}...`)
    }, 8000)

    schedule(() => {
      flashUrl()
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_post_open",
        url: post.postUrl,
        tabs: [{ title: `Пост @${handle}`, url: post.postUrl, active: true }],
        threadsCurrentPost: {
          author: handle,
          text: post.postText,
          time: post.date,
          likes: Math.floor(Math.random() * 50) + 10,
          comments: Math.floor(Math.random() * 20) + 5,
          url: post.postUrl,
        },
        threadsPostUrl: post.postUrl,
        threadsCommentText: cleanedComment,
      }))
      addChat("agent", `📄 Читаю пост: "${shortText}"`)
    }, 9000)

    schedule(() => {
      setAgentActivePane(1)
      addChat("agent", `✍️ Генерирую нативный комментарий...`)
    }, 10500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_comment_click",
      }))
      addChat("agent", `💬 Открываю поле комментария...`)
    }, 11500)

    schedule(() => {
      setAgentActivePane(2)
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_comment_typing",
      }))

      let commentCharIdx = 0
      const commentTypingInterval = setInterval(() => {
        if (!isRunningRef.current) {
          clearInterval(commentTypingInterval)
          return
        }
        commentCharIdx++
        setBrowser((prev) => ({
          ...prev,
          threadsTypedComment: cleanedComment.slice(0, commentCharIdx),
        }))
        if (commentCharIdx >= cleanedComment.length)
          clearInterval(commentTypingInterval)
      }, 20)
    }, 12500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_comment_publish",
      }))
      addChat("agent", `📤 Публикую комментарий...`)
    }, 15500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_published",
      }))
      addChat("agent", `✅ Комментарий опубликован!`)
    }, 17000)

    schedule(() => {
      setAgentActivePane(1)
      setBrowser((prev) => ({
        ...prev,
        phase: "threads_check",
      }))

      const hasEmDash = post.comment.includes("—")
      const hasFormalPhrasing = /\bследует\b|\bнеобходимо\b|\bрекомендуем\b|\bобращайтесь\b/i.test(post.comment)
      const endsWithPeriod = post.comment.trim().endsWith(".")
      const checks: string[] = []
      if (hasEmDash) checks.push("заменить длинное тире (—) на запятую или переформулировать")
      if (hasFormalPhrasing) checks.push("упростить формальный тон")
      if (endsWithPeriod) checks.push("убрать точку в конце")

      setBrowser((prev) => ({
        ...prev,
        threadsCheckResults: checks,
      }))

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
      setTimeout(() => setTableFlash(false), 600)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 21500)
  }, [addChat, flashUrl, setAgentActivePane])

  const processNext = isThreads ? processNextThreads : processNextPrice

  React.useEffect(() => {
    processNextRef.current = isThreads ? processNextThreads : processNextPrice
  }, [isThreads, processNextPrice, processNextThreads])

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
    threads_home: "Threads загружен",
    threads_search_click: "Открываю поиск...",
    threads_search_typing: "Ввожу запрос...",
    threads_search_loading: "Ищу посты...",
    threads_feed: "Лента постов",
    threads_post_click: "Перехожу к посту...",
    threads_post_open: "Читаю пост",
    threads_comment_click: "Открываю комментарий...",
    threads_comment_typing: "Пишу комментарий...",
    threads_comment_publish: "Публикую...",
    threads_published: "Опубликовано!",
    threads_check: "Проверяю комментарий...",
  }

  const [showCta, setShowCta] = React.useState(false)
  const [ctaCollapsed, setCtaCollapsed] = React.useState(true)

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
        {isThreads
          ? "ИИ-агент ищет посты в Threads, генерирует нативные комментарии и публикует их."
          : "ИИ-агент ищет цены через браузер — вводит запрос в Google, переходит на маркетплейсы и записывает результат."}
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
          { pane: 0 as const, icon: "📊", label: "Таблица", color: "emerald" },
          { pane: 1 as const, icon: "🤖", label: "Чат ИИ", color: "purple" },
          { pane: 2 as const, icon: "🌐", label: "Браузер", color: "blue" },
        ].map(({ pane, icon, label, color }) => {
          const isActive = activePane === pane
          const hasAgentSignal =
            agentPane === pane && userTouchedTab && agentPane !== activePane
          return (
            <button
              key={pane}
              onClick={() => {
                setActivePane(pane)
                if (isRunning) setUserTouchedTab(true)
              }}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? `bg-background text-foreground shadow-sm`
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {hasAgentSignal && (
                <span
                  className={`absolute -top-0.5 -right-0.5 size-2 rounded-full bg-${color}-500 animate-pulse`}
                />
              )}
              {isActive && isRunning && agentPane === pane && (
                <span
                  className={`size-1.5 rounded-full bg-${color}-500 animate-pulse`}
                />
              )}
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
              {isThreads ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-6 px-1 py-1 font-medium">#</th>
                      <th className="w-10 px-1 py-1 font-medium">A</th>
                      <th className="hidden px-1 py-1 font-medium lg:table-cell">
                        B
                      </th>
                      <th className="hidden px-1 py-1 font-medium sm:table-cell">
                        C
                      </th>
                      <th className="hidden px-1 py-1 font-medium md:table-cell">
                        D
                      </th>
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
                          className={`cursor-pointer border-b transition-all duration-300 ${
                            justUpdated
                              ? "bg-emerald-500/20 shadow-sm"
                              : isActive
                                ? "bg-primary/10"
                                : row.status === "Готово"
                                  ? "bg-emerald-500/5"
                                  : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedRow(row)}
                        >
                          <td className="px-1 py-1 text-muted-foreground">
                            {row.id}
                          </td>
                          <td className="px-1 py-1 font-medium">{row.date}</td>
                          <td className="hidden max-w-[100px] truncate px-1 py-1 text-muted-foreground lg:table-cell">
                            {row.postUrl ? (
                              <span className="text-blue-600 dark:text-blue-400">
                                ссылка
                              </span>
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
              ) : (
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
              )}
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
                    {phaseLabel[browser.phase]}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {isThreads
                  ? browser.phase === "idle"
                    ? "ИИ-агент управляет браузером для комментирования в Threads"
                    : browser.phase.startsWith("threads_search")
                      ? "ИИ-агент ищет посты по теме AI в Threads"
                      : browser.phase === "threads_feed" ||
                          browser.phase === "threads_post_click"
                        ? "ИИ-агент выбирает подходящий пост"
                        : browser.phase === "threads_post_open"
                          ? "ИИ-агент читает пост и генерирует комментарий"
                          : browser.phase.startsWith("threads_comment")
                            ? "ИИ-агент пишет и публикует комментарий"
                            : browser.phase === "threads_published"
                              ? "ИИ-агент опубликовал комментарий"
                              : browser.phase === "threads_check"
                                ? "ИИ-агент проверяет опубликованный комментарий на ИИ-маркеры"
                                : "ИИ-агент записывает результат в таблицу"
                  : browser.phase === "idle"
                    ? "ИИ-агент управляет браузером для поиска цен"
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

                {/* THREADS HOME */}
                {browser.phase === "threads_home" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-3xl">🧵</div>
                    <p className="text-xs font-medium">Threads</p>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                )}

                {/* THREADS SEARCH CLICK */}
                {browser.phase === "threads_search_click" && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
                      <span className="text-sm">🔍</span>
                      <span className="text-xs text-muted-foreground">
                        Нажимаю на поиск...
                      </span>
                    </div>
                  </div>
                )}

                {/* THREADS SEARCH TYPING */}
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

                {/* THREADS SEARCH LOADING */}
                {browser.phase === "threads_search_loading" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-2xl">🧵</div>
                    <div className="h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${browser.loadingProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Ищу посты...
                    </p>
                  </div>
                )}

                {/* THREADS FEED */}
                {browser.phase === "threads_feed" && (
                  <div className="flex flex-col gap-2">
                    {browser.threadsPosts.map((post, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-2.5 transition-all duration-200 ${
                          i === 0
                            ? "border-purple-200 bg-purple-50/50 shadow-sm hover:border-purple-300 dark:bg-purple-950/20"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-purple-200 dark:bg-purple-800" />
                          <span className="text-[11px] font-medium">
                            @{post.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {post.time}
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug">{post.text}</p>
                        <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
                          <span>❤️ {post.likes}</span>
                          <span>💬 {post.comments}</span>
                        </div>
                        {i === 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-medium text-purple-600 dark:text-purple-400">
                            <span className="inline-flex size-3 items-center justify-center rounded bg-purple-500 text-[7px] text-white">
                              ▸
                            </span>
                            ИИ-агент переходит...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* THREADS POST CLICK */}
                {browser.phase === "threads_post_click" && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <span className="text-xl text-purple-500">⟳</span>
                    <p className="text-xs text-muted-foreground">
                      Открываю пост...
                    </p>
                  </div>
                )}

                {/* THREADS POST OPEN */}
                {browser.phase === "threads_post_open" &&
                  browser.threadsCurrentPost && (
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-lg border bg-card p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="size-6 rounded-full bg-purple-200 dark:bg-purple-800" />
                          <span className="text-xs font-medium">
                            @{browser.threadsCurrentPost.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {browser.threadsCurrentPost.time}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {browser.threadsCurrentPost.text}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground">
                          <span>❤️ {browser.threadsCurrentPost.likes}</span>
                          <span>💬 {browser.threadsCurrentPost.comments}</span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* THREADS COMMENT CLICK */}
                {browser.phase === "threads_comment_click" &&
                  browser.threadsCurrentPost && (
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-lg border bg-card p-3 opacity-60">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-purple-200 dark:bg-purple-800" />
                          <span className="text-[11px] font-medium">
                            @{browser.threadsCurrentPost.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {browser.threadsCurrentPost.time}
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug">
                          {browser.threadsCurrentPost.text}
                        </p>
                      </div>
                      <div className="animate-pulse rounded-lg border border-purple-200 bg-purple-50/30 p-2.5 dark:bg-purple-950/20">
                        <div className="flex items-center gap-2">
                          <div className="size-5 rounded-full bg-muted" />
                          <span className="text-[10px] text-muted-foreground">
                            Открываю поле комментария...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* THREADS CHECK */}
                {browser.phase === "threads_check" &&
                  browser.threadsCurrentPost && (
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-lg border bg-card p-3 opacity-70">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-purple-200 dark:bg-purple-800" />
                          <span className="text-[11px] font-medium">
                            @{browser.threadsCurrentPost.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {browser.threadsCurrentPost.time}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[10px] leading-snug">
                          {browser.threadsCurrentPost.text}
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            @mimikkai
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            только что
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {browser.threadsCommentText}
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-amber-300 bg-amber-50/50 p-2.5 dark:bg-amber-950/20">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-sm">🔍</span>
                          <span className="text-[11px] font-medium">
                            Проверка на ИИ-маркеры
                          </span>
                        </div>
                        {browser.threadsCheckResults.length > 0 ? (
                          <div className="flex flex-col gap-1.5">
                            {browser.threadsCheckResults.map((check, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-1.5 text-[10px]"
                              >
                                <span className="mt-0.5 text-amber-500">⚠️</span>
                                <span className="text-amber-700 dark:text-amber-400">
                                  {check}
                                </span>
                              </div>
                            ))}
                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <span>✅</span>
                              <span className="font-medium">Исправлено</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span>✅</span>
                            <span className="font-medium">
                              Маркеры не найдены — комментарий нативный
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* THREADS COMMENT TYPING */}
                {browser.phase === "threads_comment_typing" && (
                  <div className="flex flex-col gap-2.5">
                    <div className="rounded-lg border bg-card p-2 opacity-60">
                      <div className="mb-1 flex items-center gap-2">
                        <div className="size-4 rounded-full bg-purple-200 dark:bg-purple-800" />
                        <span className="text-[10px] font-medium">
                          @{browser.threadsCurrentPost?.author}
                        </span>
                        <span className="text-[8px] text-muted-foreground">
                          {browser.threadsCurrentPost?.time}
                        </span>
                      </div>
                      <p className="text-[9px] leading-snug">
                        {browser.threadsCurrentPost?.text}
                      </p>
                    </div>
                    <div className="rounded-lg border-2 border-purple-300 bg-background p-2.5">
                      <div className="mb-1 flex items-center gap-2">
                        <div className="size-4 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          @mimikkai
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {browser.threadsTypedComment}
                        <span className="animate-pulse text-purple-500">|</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* THREADS COMMENT PUBLISH */}
                {browser.phase === "threads_comment_publish" && (
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/15">
                      <span className="text-lg text-purple-500">↑</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Публикую комментарий...
                    </p>
                  </div>
                )}

                {/* THREADS PUBLISHED */}
                {browser.phase === "threads_published" &&
                  browser.threadsCurrentPost && (
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-lg border bg-card p-3 opacity-70">
                        <div className="mb-1 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-purple-200 dark:bg-purple-800" />
                          <span className="text-[11px] font-medium">
                            @{browser.threadsCurrentPost.author}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {browser.threadsCurrentPost.time}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[10px] leading-snug">
                          {browser.threadsCurrentPost.text}
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="size-5 rounded-full bg-emerald-200 dark:bg-emerald-800" />
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            @mimikkai
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            только что
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {browser.threadsCommentText}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground">
                          <span>❤️ 0</span>
                          <span>💬 0</span>
                        </div>
                      </div>
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
                  {browser.phase !== "idle" ? "●" : "○"} Веб-браузер
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
        <div className="animate-in slide-in-from-bottom-4 fade-in fixed right-4 bottom-4 z-50 duration-500 md:right-6 md:bottom-6">
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

      {isThreads && selectedRow && (
        <Dialog
          open={!!selectedRow}
          onOpenChange={(open) => {
            if (!open) setSelectedRow(null)
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Строка {selectedRow.id}
              </DialogTitle>
              <DialogDescription>
                Данные выбранной строки таблицы
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {[
                { id: "A", label: "Дата", value: selectedRow.date },
                { id: "B", label: "Ссылка на пост", value: selectedRow.postUrl },
                { id: "C", label: "Текст поста", value: selectedRow.postText },
                { id: "D", label: "Комментарий", value: selectedRow.comment },
                { id: "E", label: "Статус", value: selectedRow.status },
              ].map((col) => (
                <div key={col.id} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {col.id} — {col.label}
                  </span>
                  {col.id === "B" && col.value ? (
                    <a
                      href={col.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-blue-600 underline dark:text-blue-400"
                    >
                      {col.value}
                    </a>
                  ) : col.id === "E" ? (
                    <ThreadsStatusBadge status={col.value} />
                  ) : (
                    <span className="whitespace-pre-wrap text-sm">
                      {col.value || "—"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
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

function ThreadsStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    Готово: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-200 ${styles[status] || styles["ожидает"]}`}
    >
      {status === "обработка" && <span className="mr-1 animate-spin">⟳</span>}
      {status === "Готово" && <span className="mr-1">✓</span>}
      {status}
    </span>
  )
}
