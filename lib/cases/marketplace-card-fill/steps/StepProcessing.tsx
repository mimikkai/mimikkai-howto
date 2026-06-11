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
import { MARKETPLACE_PRODUCTS, type MarketplaceProduct } from "../data"
import type { NormalizedBrowserPhase } from "../../types"
import { createScheduler } from "../../scheduler"

interface StepProcessingProps {
  caseSlug: string
  onBack: () => void
}

interface MarketplaceProductRow {
  id: number
  name: string
  article: string
  exactName: string
  category: string
  subcategory: string
  brand: string
  description: string
  country: string
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  color: string
  material: string
  model: string
  keywords: string[]
  photoUrls: string[]
  equipment: string
  warranty: string
  ageCategory: string
  fillStatus: "ожидает" | "обрабатывается" | "заполнено"
}

type LocalPhase =
  | "idle"
  | "supplier_home"
  | "supplier_product"
  | "supplier_copy"
  | "ozon_card"
  | "ozon_fill_basic"
  | "ozon_fill_category"
  | "ozon_fill_attrs"
  | "ozon_fill_keywords"
  | "ozon_review"
  | "ozon_submitted"
  | "writing"

const PHASE_TO_NORMALIZED: Record<LocalPhase, NormalizedBrowserPhase> = {
  idle: "idle",
  supplier_home: "idle",
  supplier_product: "detail",
  supplier_copy: "loading",
  ozon_card: "form",
  ozon_fill_basic: "form",
  ozon_fill_category: "form",
  ozon_fill_attrs: "form",
  ozon_fill_keywords: "form",
  ozon_review: "detail",
  ozon_submitted: "done",
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
  currentProduct: MarketplaceProduct | null
  typedQuery: string
  selectedCategory: string
  selectedSubcategory: string
  selectedColor: string
  selectedCountry: string
  selectedWarranty: string
  selectedAge: string
  typedFieldName: string
  typedFieldBrand: string
  typedFieldDesc: string
  selectOpen: string
  selectHighlight: string
  photoState: "idle" | "downloading" | "uploading" | "done"
  photoProgress: number
}

const IDLE_BROWSER: BrowserState = {
  phase: "idle",
  tabs: [],
  url: "about:blank",
  currentProduct: null,
  typedQuery: "",
  selectedCategory: "",
  selectedSubcategory: "",
  selectedColor: "",
  selectedCountry: "",
  selectedWarranty: "",
  selectedAge: "",
  typedFieldName: "",
  typedFieldBrand: "",
  typedFieldDesc: "",
  selectOpen: "",
  selectHighlight: "",
  photoState: "idle",
  photoProgress: 0,
}

interface ChatMessage {
  role: "agent" | "system" | "divider"
  content: string
}

const fillStatusColor: Record<string, string> = {
  ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  обрабатывается: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  заполнено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
}

const DIALOG_COLUMNS = [
  { id: "A", label: "Наименование", key: "name" as const },
  { id: "B", label: "Артикул", key: "article" as const },
  { id: "C", label: "Точное название", key: "exactName" as const },
  { id: "D", label: "Категория", key: "category" as const },
  { id: "E", label: "Бренд", key: "brand" as const },
  { id: "T", label: "Статус", key: "fillStatus" as const },
]

export function StepProcessing({ caseSlug, onBack }: StepProcessingProps) {
  const [tableData, setTableData] = React.useState<MarketplaceProductRow[]>(
    () =>
      MARKETPLACE_PRODUCTS.map((p, i) => ({
        id: p.id,
        name: p.name,
        article: p.article,
        exactName: "",
        category: "",
        subcategory: "",
        brand: "",
        description: "",
        country: "",
        weightKg: 0,
        lengthCm: 0,
        widthCm: 0,
        heightCm: 0,
        color: "",
        material: "",
        model: "",
        keywords: [],
        photoUrls: [],
        equipment: "",
        warranty: "",
        ageCategory: "",
        fillStatus: "ожидает" as const,
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
  const [selectedRow, setSelectedRow] =
    React.useState<MarketplaceProductRow | null>(null)

  const setAgentActivePane = React.useCallback((pane: 0 | 1 | 2) => {
    setAgentPane(pane)
    if (!userTouchedTabRef.current) {
      setActivePane(pane)
    }
  }, [])

  const totalRows = MARKETPLACE_PRODUCTS.length

  const tableDataRef = React.useRef(tableData)
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
          console.debug("[marketplace-card-fill:processing] scheduler", {
            msg,
            ...data,
          })
        }
      },
    })
  }
  const scheduler = schedulerRef.current

  React.useEffect(() => {
    tableDataRef.current = tableData
  }, [tableData])
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

  const processedCount = tableData.filter(
    (r) => r.fillStatus === "заполнено"
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
        console.debug("[marketplace-card-fill:processing] phase", {
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
    if (nextIdx >= MARKETPLACE_PRODUCTS.length) {
      setIsRunning(false)
      setIsDone(true)
      addChat("system", "✅ Все карточки заполнены.")
      setBrowser({ ...IDLE_BROWSER })
      return
    }

    setCurrentIndex(nextIdx)
    const product = MARKETPLACE_PRODUCTS[nextIdx]

    const myRunId = scheduler.nextRunId()

    const schedule = (fn: () => void, ms: number) => {
      scheduler.schedule(() => {
        if (scheduler.isStale(myRunId)) return
        if (!isRunningRef.current) return
        fn()
      }, ms)
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[marketplace-card-fill:processing] row start", {
        rowIndex: nextIdx,
        name: product.name,
        article: product.article,
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
      setTableData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? { ...row, fillStatus: "обрабатывается" as const }
            : row
        )
      )
      addChat("divider", `Строка ${nextIdx + 1}`)
      addChat("agent", `🛒 Беру товар: "${product.name}" (${product.article})`)
    }, 700)

    schedule(() => {
      setAgentActivePane(2)
      addChat("agent", `🌐 Открываю сайт поставщика TechSupply.ru...`)
    }, 1800)

    schedule(() => {
      debugPhase("supplier_home", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "supplier_home",
        tabs: [
          {
            title: "TechSupply.ru",
            url: "https://techsupply.ru/",
            active: true,
          },
        ],
        url: "https://techsupply.ru/",
      })
    }, 2500)

    schedule(() => {
      addChat("agent", `🔍 Ищу по артикулу: ${product.article}...`)
      setBrowser((prev) => ({ ...prev, typedQuery: "" }))
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
          typedQuery: product.article.slice(0, charIdx),
        }))
        if (charIdx >= product.article.length) {
          clearInterval(typingInterval)
          scheduler.scheduledIntervals.delete(typingInterval)
        }
      }, 50)
      scheduler.trackInterval(typingInterval)
    }, 3500)

    schedule(() => {
      flashUrl()
      debugPhase("supplier_product", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "supplier_product",
        currentProduct: product,
        url: `https://techsupply.ru/product/${product.article}`,
        tabs: [
          {
            title: "TechSupply.ru",
            url: `https://techsupply.ru/product/${product.article}`,
            active: true,
          },
        ],
      }))
      addChat("agent", `📄 Карточка товара найдена`)
    }, 5000)

    schedule(() => {
      addChat("agent", `📋 Собираю характеристики, фото, описание...`)
    }, 6000)

    // supplier_copy: download photos from supplier to local machine
    schedule(() => {
      debugPhase("supplier_copy", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "supplier_copy",
        photoState: "downloading",
        photoProgress: 0,
      }))
      addChat("agent", `📋 Копирую данные, скачиваю фото...`)

      const totalPhotos = product.photoUrls.length
      let downloadedCount = 0
      const photoDownloadInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(photoDownloadInterval)
          scheduler.scheduledIntervals.delete(photoDownloadInterval)
          return
        }
        downloadedCount++
        setBrowser((prev) => ({
          ...prev,
          photoProgress: Math.min(downloadedCount, totalPhotos),
        }))
        if (downloadedCount >= totalPhotos) {
          clearInterval(photoDownloadInterval)
          scheduler.scheduledIntervals.delete(photoDownloadInterval)
        }
      }, 500)
      scheduler.trackInterval(photoDownloadInterval)
    }, 7500)

    // photos downloaded to local machine
    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        photoState: "done",
        photoProgress: product.photoUrls.length,
      }))
      addChat("agent", `✅ Фото сохранены локально (${product.photoUrls.length} шт.)`)
    }, 7500 + product.photoUrls.length * 500 + 500)

    schedule(() => {
      flashUrl()
      addChat("agent", `🛒 Открываю Ozon Seller...`)
    }, 8500)

    schedule(() => {
      debugPhase("ozon_card", nextIdx)
      setBrowser({
        ...IDLE_BROWSER,
        phase: "ozon_card",
        tabs: [
          {
            title: "TechSupply.ru",
            url: `https://techsupply.ru/product/${product.article}`,
            active: false,
          },
          {
            title: "Ozon Seller",
            url: "https://seller.ozon.ru/product/new",
            active: true,
          },
        ],
        url: "https://seller.ozon.ru/product/new",
        currentProduct: product,
      })
      addChat("agent", `📝 Начинаю заполнять карточку на Ozon...`)
    }, 9500)

    // ozon_fill_basic: type name, then brand, then description
    schedule(() => {
      debugPhase("ozon_fill_basic", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_fill_basic",
        typedFieldName: "",
        typedFieldBrand: "",
        typedFieldDesc: "",
      }))
      addChat("agent", `✏️ Заполняю название, бренд, описание...`)
      // Type exactName character by character
      let nameIdx = 0
      const nameInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(nameInterval)
          scheduler.scheduledIntervals.delete(nameInterval)
          return
        }
        nameIdx++
        setBrowser((prev) => ({
          ...prev,
          typedFieldName: product.exactName.slice(0, nameIdx),
        }))
        if (nameIdx >= product.exactName.length) {
          clearInterval(nameInterval)
          scheduler.scheduledIntervals.delete(nameInterval)
        }
      }, 30)
      scheduler.trackInterval(nameInterval)
    }, 10500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        typedFieldBrand: product.brand,
      }))
    }, 12000)

    schedule(() => {
      // Type description character by character (shortened for display)
      let descIdx = 0
      const shortDesc = product.description.slice(0, 80)
      const descInterval = setInterval(() => {
        if (scheduler.isStale(myRunId) || !isRunningRef.current) {
          clearInterval(descInterval)
          scheduler.scheduledIntervals.delete(descInterval)
          return
        }
        descIdx++
        setBrowser((prev) => ({
          ...prev,
          typedFieldDesc: shortDesc.slice(0, descIdx),
        }))
        if (descIdx >= shortDesc.length) {
          clearInterval(descInterval)
          scheduler.scheduledIntervals.delete(descInterval)
        }
      }, 20)
      scheduler.trackInterval(descInterval)
    }, 12500)

    // ozon_fill_category: show select dropdown opening and choosing
    schedule(() => {
      debugPhase("ozon_fill_category", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_fill_category",
        selectedCategory: "",
        selectedSubcategory: "",
        selectOpen: "category",
        selectHighlight: product.category,
      }))
      addChat("agent", `📋 Выбираю категорию...`)
    }, 14000)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedCategory: product.category,
        selectOpen: "subcategory",
        selectHighlight: product.subcategory,
      }))
      addChat("agent", `📋 Подкатегория: ${product.subcategory}`)
    }, 15000)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedSubcategory: product.subcategory,
        selectOpen: "",
        selectHighlight: "",
      }))
    }, 15500)

    // ozon_fill_attrs: fill numeric fields then animate selects
    schedule(() => {
      debugPhase("ozon_fill_attrs", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_fill_attrs",
        selectedColor: "",
        selectedCountry: "",
        selectedWarranty: "",
        selectedAge: "",
        selectOpen: "color",
        selectHighlight: product.color,
      }))
      addChat("agent", `📋 Заполняю атрибуты: вес, размеры, цвет, страна, гарантия...`)
    }, 16500)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedColor: product.color,
        selectOpen: "country",
        selectHighlight: product.country,
      }))
    }, 17200)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedCountry: product.country,
        selectOpen: "warranty",
        selectHighlight: product.warranty,
      }))
    }, 17800)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedWarranty: product.warranty,
        selectOpen: "age",
        selectHighlight: product.ageCategory,
      }))
    }, 18400)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        selectedAge: product.ageCategory,
        selectOpen: "",
        selectHighlight: "",
      }))
    }, 19000)

    // ozon_fill_keywords: tags first, then upload photos via Ozon Seller API
    schedule(() => {
      debugPhase("ozon_fill_keywords", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_fill_keywords",
        photoState: "idle",
        photoProgress: 0,
      }))
      addChat("agent", `🏷️ Добавляю ключевые слова и комплектацию...`)
    }, 20000)

    // Upload photos via Ozon Seller API
    schedule(() => {
      addChat("agent", `📤 Загружаю фото через Ozon Seller API...`)
      setBrowser((prev) => ({
        ...prev,
        photoState: "uploading",
        photoProgress: 0,
      }))
    }, 20800)

    // Animate photo upload progress
    const totalPhotos = product.photoUrls.length
    let uploadedCount = 0
    const photoUploadInterval = setInterval(() => {
      if (scheduler.isStale(myRunId) || !isRunningRef.current) {
        clearInterval(photoUploadInterval)
        scheduler.scheduledIntervals.delete(photoUploadInterval)
        return
      }
      uploadedCount++
      setBrowser((prev) => ({
        ...prev,
        photoProgress: Math.min(uploadedCount, totalPhotos),
      }))
      if (uploadedCount >= totalPhotos) {
        clearInterval(photoUploadInterval)
        scheduler.scheduledIntervals.delete(photoUploadInterval)
      }
    }, 700)
    scheduler.trackInterval(photoUploadInterval)

    schedule(() => {
      setBrowser((prev) => ({
        ...prev,
        photoState: "done",
      }))
      addChat("agent", `✅ Фото загружены через API (${totalPhotos} шт.)`)
    }, 20800 + totalPhotos * 700 + 500)

    // ozon_review: check all 18 fields
    schedule(() => {
      debugPhase("ozon_review", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_review",
      }))
      addChat("agent", `🔍 Перепроверяю все 18 полей перед отправкой...`)
    }, 24000)

    schedule(() => {
      addChat("agent", `✅ Все поля заполнены корректно, отправляю карточку`)
    }, 26000)

    schedule(() => {
      debugPhase("ozon_submitted", nextIdx)
      setBrowser((prev) => ({
        ...prev,
        phase: "ozon_submitted",
      }))
      addChat("agent", `📤 Карточка отправлена на модерацию`)
    }, 26500)

    schedule(() => {
      addChat("agent", `📝 Записываю результат в таблицу...`)
    }, 27500)

    schedule(() => {
      setAgentActivePane(0)
      setTableFlash(true)
    }, 27800)

    schedule(() => {
      setTableData((prev) =>
        prev.map((row, i) =>
          i === nextIdx
            ? {
                ...row,
                exactName: product.exactName,
                category: product.category,
                subcategory: product.subcategory,
                brand: product.brand,
                description: product.description,
                country: product.country,
                weightKg: product.weightKg,
                lengthCm: product.lengthCm,
                widthCm: product.widthCm,
                heightCm: product.heightCm,
                color: product.color,
                material: product.material,
                model: product.model,
                keywords: product.keywords,
                photoUrls: product.photoUrls,
                equipment: product.equipment,
                warranty: product.warranty,
                ageCategory: product.ageCategory,
                fillStatus: "заполнено" as const,
              }
            : row
        )
      )
      if (process.env.NODE_ENV !== "production") {
        console.info("[marketplace-card-fill:processing] row done", {
          rowIndex: nextIdx,
          name: product.name,
          article: product.article,
        })
      }
      const flashT = setTimeout(() => setTableFlash(false), 600)
      scheduler.trackTimer(flashT)
      setBrowser({ ...IDLE_BROWSER })
      setAgentActivePane(0)
      processNextRef.current()
    }, 28500)
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

  const FillStatusBadge = ({
    status,
  }: {
    status: MarketplaceProductRow["fillStatus"]
  }) => {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${fillStatusColor[status]}`}
      >
        {status === "обрабатывается" && (
          <span className="mr-1 animate-spin">⟳</span>
        )}
        {status}
      </span>
    )
  }

  const getDialogValue = (row: MarketplaceProductRow, colId: string): string => {
    switch (colId) {
      case "A": return row.name
      case "B": return row.article
      case "C": return row.exactName
      case "D": return `${row.category} / ${row.subcategory}`
      case "E": return row.brand
      case "T": return row.fillStatus
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
        ИИ-агент ищет информацию на сайте поставщика и заполняет карточки
        товаров на Ozon.
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
                    <th className="hidden px-1 py-1 font-medium sm:table-cell">
                      C
                    </th>
                    <th className="px-1 py-1 font-medium">D</th>
                    <th className="w-20 px-1 py-1 font-medium">T</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => {
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
                              : row.fillStatus === "заполнено"
                                ? "bg-emerald-500/5"
                                : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-1 py-1 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-1 py-1 font-medium">{row.name}</td>
                        <td className="hidden px-1 py-1 sm:table-cell">
                          {row.exactName || "—"}
                        </td>
                        <td className="px-1 py-1">
                          {row.category ? (
                            <span className="text-[10px]">
                              {row.category}/{row.subcategory}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-1 py-1">
                          <FillStatusBadge status={row.fillStatus} />
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
                    {browser.phase === "supplier_home"
                      ? "TechSupply.ru"
                      : browser.phase === "supplier_product"
                        ? "Карточка товара"
                        : browser.phase === "supplier_copy"
                          ? "Скачивание фото..."
                        : browser.phase === "ozon_card"
                            ? "Ozon — новая карточка"
                            : browser.phase === "ozon_fill_basic"
                              ? "Заполнение названия"
                              : browser.phase === "ozon_fill_category"
                                ? "Выбор категории"
                                : browser.phase === "ozon_fill_attrs"
                                  ? "Заполнение атрибутов"
                                  : browser.phase === "ozon_fill_keywords"
                                    ? "Ключевые слова"
                                    : browser.phase === "ozon_review"
                                      ? "Перепроверка полей"
                                      : browser.phase === "ozon_submitted"
                                        ? "Отправлено на модерацию"
                                        : "Записываю результат"}
                  </span>
                )}
              </CardTitle>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {browser.phase === "idle"
                  ? "ИИ-агент управляет браузером для заполнения карточек"
                  : browser.phase === "supplier_copy"
                    ? "ИИ-агент скачивает фото на компьютер"
                    : browser.phase.startsWith("supplier_") || browser.phase === "ozon_card"
                    ? "ИИ-агент работает на сайте поставщика"
                    : browser.phase.startsWith("ozon_fill_")
                      ? "ИИ-агент заполняет карточку на Ozon"
                      : browser.phase === "ozon_review"
                        ? "ИИ-агент проверяет все поля перед отправкой"
                        : browser.phase === "ozon_submitted"
                          ? "Карточка отправлена на модерацию Ozon"
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

                {browser.phase === "supplier_home" && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="text-xl font-bold text-blue-600">
                      TechSupply.ru
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Оптовый поставщик электроники и офисной техники
                    </div>
                    <div className="w-72 rounded-full border-2 border-blue-300 bg-background px-4 py-2 text-sm text-foreground">
                      {browser.typedQuery}
                      <span className="animate-pulse text-blue-500">|</span>
                    </div>
                    <div className="mt-1 rounded bg-blue-600 px-4 py-1.5 text-[10px] font-medium text-white">
                      Найти
                    </div>
                  </div>
                )}

                {browser.phase === "supplier_product" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded bg-muted/50 text-lg">
                          📦
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {browser.currentProduct.exactName}
                          </div>
                          <div className="font-mono text-[9px] text-muted-foreground">
                            Артикул: {browser.currentProduct.article}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border p-2.5 space-y-1.5">
                        <div className="text-[10px] font-medium text-muted-foreground mb-1">
                          Характеристики
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Бренд:</span>
                          <span className="font-medium">
                            {browser.currentProduct.brand}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">
                            Категория:
                          </span>
                          <span className="font-medium">
                            {browser.currentProduct.category} /{" "}
                            {browser.currentProduct.subcategory}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Страна:</span>
                          <span>{browser.currentProduct.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Вес:</span>
                          <span>{browser.currentProduct.weightKg} кг</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">
                            Размеры:
                          </span>
                          <span>
                            {browser.currentProduct.lengthCm}×
                            {browser.currentProduct.widthCm}×
                            {browser.currentProduct.heightCm} см
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Цвет:</span>
                          <span>{browser.currentProduct.color}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-muted-foreground">Модель:</span>
                          <span className="font-mono">
                            {browser.currentProduct.model}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border p-2.5">
                        <div className="text-[10px] font-medium text-muted-foreground mb-1">
                          Описание
                        </div>
                        <div className="text-[10px] leading-relaxed">
                          {browser.currentProduct.description}
                        </div>
                      </div>
                      <div className="rounded-lg border p-2.5">
                        <div className="text-[10px] font-medium text-muted-foreground mb-1">
                          Фото ({browser.currentProduct.photoUrls.length})
                        </div>
                        <div className="flex gap-1.5">
                          {browser.currentProduct.photoUrls.map((url, i) => (
                            <div
                              key={i}
                              className="flex size-12 items-center justify-center rounded border bg-muted/30 text-[8px] text-muted-foreground"
                            >
                              📷 {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "supplier_copy" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded bg-muted/50 text-lg">
                          📦
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {browser.currentProduct.exactName}
                          </div>
                        </div>
                      </div>
                      <div className="animate-pulse rounded-lg border-2 border-amber-300 bg-amber-50/30 p-3 dark:bg-amber-950/20">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-sm">📋</span>
                          <span className="text-[11px] font-medium">
                            Копирую данные товара...
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-600">✓</span>
                            <span>Характеристики</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-600">✓</span>
                            <span>Описание</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            {browser.photoState === "downloading" ? (
                              <>
                                <span className="text-blue-600 animate-pulse">⬇</span>
                                <span>Скачиваю фото: {browser.photoProgress}/{browser.currentProduct.photoUrls.length}</span>
                              </>
                            ) : browser.photoState === "done" ? (
                              <>
                                <span className="text-emerald-600">✓</span>
                                <span>Фото ({browser.currentProduct.photoUrls.length}) — сохранены локально</span>
                              </>
                            ) : (
                              <>
                                <span className="text-emerald-600">✓</span>
                                <span>Фото ({browser.currentProduct.photoUrls.length})</span>
                              </>
                            )}
                          </div>
                          {browser.photoState === "downloading" && (
                            <div className="mt-1">
                              <div className="flex gap-1.5">
                                {browser.currentProduct.photoUrls.map((url, i) => (
                                  <div
                                    key={i}
                                    className={`flex size-10 items-center justify-center rounded border text-[8px] transition-all duration-300 ${
                                      i < browser.photoProgress
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                        : "bg-muted/30 text-muted-foreground animate-pulse"
                                    }`}
                                  >
                                    {i < browser.photoProgress ? "✓" : "⬇"}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${browser.currentProduct.photoUrls.length > 0 ? (browser.photoProgress / browser.currentProduct.photoUrls.length) * 100 : 0}%` }}
                                />
                              </div>
                              <div className="mt-0.5 text-[8px] text-blue-600 dark:text-blue-400">
                                Сохраняю на компьютер пользователя...
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-600">✓</span>
                            <span>Комплектация</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_card" && (
                  <div className="flex flex-col gap-3 py-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        Ozon Seller
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Новая карточка товара
                      </div>
                    </div>
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <div className="text-2xl">📝</div>
                      <div className="text-[10px] text-muted-foreground">
                        Начните заполнение карточки
                      </div>
                    </div>
                  </div>
                )}

                {browser.phase === "ozon_fill_basic" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Заполнение основных полей
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Название товара *
                          </div>
                          <div className="rounded border bg-muted/30 px-2 py-1 text-[10px] min-h-[1.5em]">
                            {browser.typedFieldName}
                            {browser.typedFieldName.length < browser.currentProduct.exactName.length && (
                              <span className="animate-pulse text-blue-500">|</span>
                            )}
                            {browser.typedFieldName.length >= browser.currentProduct.exactName.length && " ✓"}
                          </div>
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Бренд *
                          </div>
                          <div className={`rounded border px-2 py-1 text-[10px] ${browser.typedFieldBrand ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30"}`}>
                            {browser.typedFieldBrand || "\u00A0"}
                            {browser.typedFieldBrand ? " ✓" : <span className="animate-pulse text-blue-500">|</span>}
                          </div>
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Описание *
                          </div>
                          <div className="rounded border bg-muted/30 px-2 py-1 text-[10px] min-h-[2em]">
                            {browser.typedFieldDesc}
                            {browser.typedFieldDesc.length < browser.currentProduct.description.slice(0, 80).length && (
                              <span className="animate-pulse text-blue-500">|</span>
                            )}
                            {browser.typedFieldDesc.length >= browser.currentProduct.description.slice(0, 80).length && browser.typedFieldDesc.length > 0 && "... ✓"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_fill_category" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Выбор категории
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Категория ▼
                          </div>
                          {browser.selectOpen === "category" ? (
                            <div className="rounded border border-blue-400 bg-white dark:bg-gray-900 overflow-hidden">
                              <div className="px-2 py-1 text-[10px] bg-muted/30 font-medium">
                                Выберите категорию
                              </div>
                              {["Электроника", "Офисное оборудование", "Сетевое оборудование", "Мебель"].map((cat) => (
                                <div
                                  key={cat}
                                  className={`px-2 py-1 text-[10px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                                    browser.selectHighlight === cat ? "bg-blue-100 dark:bg-blue-950/50 font-medium text-blue-700 dark:text-blue-400" : ""
                                  }`}
                                >
                                  {cat} {browser.selectedCategory === cat && "✓"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded border bg-blue-50 px-2 py-1.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                              {browser.selectedCategory}
                              <span className="ml-1 text-[8px]">✓</span>
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Подкатегория ▼
                          </div>
                          {browser.selectOpen === "subcategory" ? (
                            <div className="rounded border border-purple-400 bg-white dark:bg-gray-900 overflow-hidden">
                              <div className="px-2 py-1 text-[10px] bg-muted/30 font-medium">
                                Выберите подкатегорию
                              </div>
                              {browser.currentProduct.category === "Электроника"
                                ? ["Ноутбуки", "Мониторы", "Периферия"].map((sub) => (
                                    <div
                                      key={sub}
                                      className={`px-2 py-1 text-[10px] cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 ${
                                        browser.selectHighlight === sub ? "bg-purple-100 dark:bg-purple-950/50 font-medium text-purple-700 dark:text-purple-400" : ""
                                      }`}
                                    >
                                      {sub} {browser.selectedSubcategory === sub && "✓"}
                                    </div>
                                  ))
                                : browser.currentProduct.category === "Офисное оборудование"
                                  ? ["Принтеры", "ИБП", "Проекторы"].map((sub) => (
                                      <div
                                        key={sub}
                                        className={`px-2 py-1 text-[10px] cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 ${
                                          browser.selectHighlight === sub ? "bg-purple-100 dark:bg-purple-950/50 font-medium text-purple-700 dark:text-purple-400" : ""
                                        }`}
                                      >
                                        {sub} {browser.selectedSubcategory === sub && "✓"}
                                      </div>
                                    ))
                                  : browser.currentProduct.category === "Сетевое оборудование"
                                    ? ["Роутеры", "Камеры"].map((sub) => (
                                        <div
                                          key={sub}
                                          className={`px-2 py-1 text-[10px] cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 ${
                                            browser.selectHighlight === sub ? "bg-purple-100 dark:bg-purple-950/50 font-medium text-purple-700 dark:text-purple-400" : ""
                                          }`}
                                        >
                                          {sub} {browser.selectedSubcategory === sub && "✓"}
                                        </div>
                                      ))
                                    : ["Кресла", "Стойки"].map((sub) => (
                                        <div
                                          key={sub}
                                          className={`px-2 py-1 text-[10px] cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 ${
                                            browser.selectHighlight === sub ? "bg-purple-100 dark:bg-purple-950/50 font-medium text-purple-700 dark:text-purple-400" : ""
                                          }`}
                                        >
                                          {sub} {browser.selectedSubcategory === sub && "✓"}
                                        </div>
                                      ))}
                            </div>
                          ) : (
                            <div className="rounded border bg-purple-50 px-2 py-1.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/30 dark:text-purple-400">
                              {browser.selectedSubcategory}
                              <span className="ml-1 text-[8px]">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_fill_attrs" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Заполнение атрибутов
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Вес (кг):
                          </span>
                          <span className="rounded border bg-emerald-50 px-2 py-0.5 text-[10px] dark:bg-emerald-950/20">
                            {browser.currentProduct.weightKg} ✓
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Размеры:
                          </span>
                          <span className="rounded border bg-emerald-50 px-2 py-0.5 text-[10px] dark:bg-emerald-950/20">
                            {browser.currentProduct.lengthCm}×
                            {browser.currentProduct.widthCm}×
                            {browser.currentProduct.heightCm} ✓
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Цвет ▼:
                          </span>
                          {browser.selectOpen === "color" ? (
                            <div className="rounded border border-blue-400 bg-white dark:bg-gray-900 overflow-hidden text-[9px]">
                              {["Чёрный", "Белый", "Серебристый / Чёрный", "Графитовый", "Синий"].map((c) => (
                                <div
                                  key={c}
                                  className={`px-2 py-0.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                                    browser.selectHighlight === c ? "bg-blue-100 dark:bg-blue-950/50 font-medium text-blue-700 dark:text-blue-400" : ""
                                  }`}
                                >
                                  {c} {browser.selectedColor === c && "✓"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                              browser.selectedColor
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                : "bg-muted/30 text-muted-foreground"
                            }`}>
                              {browser.selectedColor || "..."}
                              {browser.selectedColor && " ✓"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Страна ▼:
                          </span>
                          {browser.selectOpen === "country" ? (
                            <div className="rounded border border-blue-400 bg-white dark:bg-gray-900 overflow-hidden text-[9px]">
                              {["Китай", "Россия", "Тайвань", "США", "Германия", "Латвия", "Австралия"].map((c) => (
                                <div
                                  key={c}
                                  className={`px-2 py-0.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                                    browser.selectHighlight === c ? "bg-blue-100 dark:bg-blue-950/50 font-medium text-blue-700 dark:text-blue-400" : ""
                                  }`}
                                >
                                  {c} {browser.selectedCountry === c && "✓"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                              browser.selectedCountry
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                : "bg-muted/30 text-muted-foreground"
                            }`}>
                              {browser.selectedCountry || "..."}
                              {browser.selectedCountry && " ✓"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Материал:
                          </span>
                          <span className="rounded border bg-emerald-50 px-2 py-0.5 text-[10px] dark:bg-emerald-950/20">
                            {browser.currentProduct.material} ✓
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Модель:
                          </span>
                          <span className="rounded border bg-emerald-50 px-2 py-0.5 text-[10px] font-mono dark:bg-emerald-950/20">
                            {browser.currentProduct.model} ✓
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Гарантия ▼:
                          </span>
                          {browser.selectOpen === "warranty" ? (
                            <div className="rounded border border-blue-400 bg-white dark:bg-gray-900 overflow-hidden text-[9px]">
                              {["6 месяцев", "12 месяцев", "18 месяцев", "24 месяца", "36 месяцев"].map((w) => (
                                <div
                                  key={w}
                                  className={`px-2 py-0.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                                    browser.selectHighlight === w ? "bg-blue-100 dark:bg-blue-950/50 font-medium text-blue-700 dark:text-blue-400" : ""
                                  }`}
                                >
                                  {w} {browser.selectedWarranty === w && "✓"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                              browser.selectedWarranty
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                : "bg-muted/30 text-muted-foreground"
                            }`}>
                              {browser.selectedWarranty || "..."}
                              {browser.selectedWarranty && " ✓"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 shrink-0 text-muted-foreground">
                            Возраст ▼:
                          </span>
                          {browser.selectOpen === "age" ? (
                            <div className="rounded border border-blue-400 bg-white dark:bg-gray-900 overflow-hidden text-[9px]">
                              {["0+", "6+", "12+", "16+"].map((a) => (
                                <div
                                  key={a}
                                  className={`px-2 py-0.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 ${
                                    browser.selectHighlight === a ? "bg-blue-100 dark:bg-blue-950/50 font-medium text-blue-700 dark:text-blue-400" : ""
                                  }`}
                                >
                                  {a} {browser.selectedAge === a && "✓"}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-medium ${
                              browser.selectedAge
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                : "bg-muted/30 text-muted-foreground"
                            }`}>
                              {browser.selectedAge || "..."}
                              {browser.selectedAge && " ✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_fill_keywords" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="text-[10px] font-medium text-muted-foreground">
                        Ключевые слова и медиа
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Ключевые слова (теги)
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {browser.currentProduct.keywords.map((kw, i) => (
                              <span
                                key={i}
                                className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            Фото товара
                            {browser.photoState === "uploading" && (
                              <span className="text-amber-600 dark:text-amber-400 animate-pulse">⬆ Загружаю через API...</span>
                            )}
                            {browser.photoState === "done" && (
                              <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                            )}
                          </div>
                          {browser.photoState === "idle" && (
                            <div className="flex gap-1.5">
                              {browser.currentProduct.photoUrls.map((url, i) => (
                                <div
                                  key={i}
                                  className="flex size-14 items-center justify-center rounded border bg-muted/30 text-[8px] text-muted-foreground"
                                >
                                  📷 {i + 1}
                                </div>
                              ))}
                            </div>
                          )}
                          {browser.photoState === "uploading" && (
                            <div className="space-y-2">
                              <div className="flex gap-1.5">
                                {browser.currentProduct.photoUrls.map((url, i) => (
                                  <div
                                    key={i}
                                    className={`flex size-14 items-center justify-center rounded border text-[10px] transition-all duration-300 ${
                                      i < browser.photoProgress
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse"
                                    }`}
                                  >
                                    {i < browser.photoProgress ? "📷 ✓" : "⬆"}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-amber-600 dark:text-amber-400">
                                <span className="animate-pulse">⬆</span>
                                Ozon Seller API: {browser.photoProgress}/{browser.currentProduct.photoUrls.length}
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                  style={{ width: `${browser.currentProduct.photoUrls.length > 0 ? (browser.photoProgress / browser.currentProduct.photoUrls.length) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {browser.photoState === "done" && (
                            <div className="space-y-1.5">
                              <div className="flex gap-1.5">
                                {browser.currentProduct.photoUrls.map((url, i) => (
                                  <div
                                    key={i}
                                    className="flex size-14 items-center justify-center rounded border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px]"
                                  >
                                    📷 ✓
                                  </div>
                                ))}
                              </div>
                              <div className="text-[9px] text-emerald-600 dark:text-emerald-400">
                                ✅ {browser.currentProduct.photoUrls.length} фото загружено через Ozon Seller API
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-[9px] text-muted-foreground mb-1">
                            Комплектация
                          </div>
                          <div className="text-[10px]">
                            {browser.currentProduct.equipment}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_review" &&
                  browser.currentProduct && (
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-lg border-2 border-amber-400 bg-amber-50/50 p-3 dark:bg-amber-950/30">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-sm">🔍</span>
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            Перепроверяю все поля перед отправкой
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Название:</span>
                            <span className="font-medium truncate">{browser.currentProduct.exactName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Категория:</span>
                            <span className="font-medium">{browser.currentProduct.category} / {browser.currentProduct.subcategory}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Бренд:</span>
                            <span className="font-medium">{browser.currentProduct.brand}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Описание:</span>
                            <span className="font-medium truncate">{browser.currentProduct.description.slice(0, 40)}...</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Страна:</span>
                            <span className="font-medium">{browser.currentProduct.country}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Вес:</span>
                            <span className="font-medium">{browser.currentProduct.weightKg} кг</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Размеры:</span>
                            <span className="font-medium">{browser.currentProduct.lengthCm}×{browser.currentProduct.widthCm}×{browser.currentProduct.heightCm}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Цвет:</span>
                            <span className="font-medium">{browser.currentProduct.color}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Материал:</span>
                            <span className="font-medium">{browser.currentProduct.material}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Модель:</span>
                            <span className="font-mono font-medium">{browser.currentProduct.model}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Ключевые слова:</span>
                            <span className="font-medium">{browser.currentProduct.keywords.length} тегов</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Фото:</span>
                            <span className="font-medium">{browser.currentProduct.photoUrls.length} фото (Ozon Seller API)</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Комплектация:</span>
                            <span className="font-medium truncate">{browser.currentProduct.equipment.slice(0, 30)}...</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Гарантия:</span>
                            <span className="font-medium">{browser.currentProduct.warranty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-600 dark:text-amber-400">✓</span>
                            <span className="text-muted-foreground">Возрастная категория:</span>
                            <span className="font-medium">{browser.currentProduct.ageCategory}</span>
                          </div>
                        </div>
                        <div className="border-t border-amber-300/50 mt-2 pt-2">
                          <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                            ✅ Все 18 полей заполнены корректно, отправляю карточку
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {browser.phase === "ozon_submitted" && (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="animate-in zoom-in text-4xl duration-300">
                      ✅
                    </div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Карточка отправлена на модерацию
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Статус: на проверке Ozon
                    </p>
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
                const isStatusCol = col.id === "T"
                return (
                  <div key={col.id} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {col.id} — {col.label}
                    </span>
                    {isStatusCol ? (
                      <FillStatusBadge status={selectedRow.fillStatus} />
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