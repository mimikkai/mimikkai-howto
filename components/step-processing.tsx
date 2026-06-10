"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StepProcessingProps {
  onBack: () => void
  onComplete: () => void
}

interface DataRow {
  id: number
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
}

interface BrowserState {
  url: string
  query: string
  results: string[]
  active: boolean
}

const PRODUCTS = [
  "iPhone 15 Pro Max 256GB",
  "MacBook Air M3 15\"",
  "Samsung Galaxy S24 Ultra",
  "PlayStation 5 Slim",
  "Nintendo Switch OLED",
  "Xbox Series X",
  "iPad Pro 11\" M4",
  "AirPods Pro 2",
  "Dyson V15 Detect",
  "Sony WH-1000XM5",
  "LG OLED C4 65\"",
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
  "Samsung 49\" Odyssey G9",
  "LG 27\" UltraFine 5K",
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
  "iPhone": [89900, 129990],
  "MacBook": [99990, 329990],
  "Samsung Galaxy S": [74990, 119990],
  "PlayStation": [49990, 54990],
  "Nintendo": [34990, 39990],
  "Xbox": [49990, 54990],
  "iPad": [79990, 199990],
  "AirPods": [19990, 29990],
  "Dyson": [39990, 59990],
  "Sony WH": [24990, 34990],
  "LG OLED": [129990, 299990],
  "Bose": [24990, 44990],
  "Canon": [149990, 249990],
  "GoPro": [34990, 49990],
  "DJI": [69990, 149990],
  "Kindle": [11990, 17990],
  "Apple Watch": [29990, 79990],
  "Galaxy Watch": [24990, 44990],
  "Garmin": [49990, 89990],
  "Meta Quest": [39990, 54990],
  "Steam Deck": [49990, 69990],
  "ROG": [59990, 99990],
  "Razer": [159990, 299990],
  "ThinkPad": [99990, 199990],
  "Surface": [89990, 179990],
  "Dell XPS": [119990, 249990],
  "HP Spectre": [89990, 149990],
  "Mac Studio": [249990, 599990],
  "Mac mini": [69990, 149990],
  "NVIDIA": [89990, 199990],
  "AMD": [29990, 54990],
  "Intel": [29990, 54990],
}

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

function generateSearchResults(product: string): string[] {
  const sites = ["ozon.ru", "wildberries.ru", "market.yandex.ru", "dns-shop.ru", "citilink.ru"]
  const shuffled = sites.sort(() => Math.random() - 0.5).slice(0, 3)
  return shuffled.map((site) => `${site}/search?q=${encodeURIComponent(product)}`)
}

export function StepProcessing({ onBack, onComplete }: StepProcessingProps) {
  const [data, setData] = React.useState<DataRow[]>(() =>
    PRODUCTS.map((product, i) => ({
      id: i + 1,
      product,
      price: "",
      status: "ожидает" as const,
    }))
  )
  const [browser, setBrowser] = React.useState<BrowserState>({
    url: "",
    query: "",
    results: [],
    active: false,
  })
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isRunning, setIsRunning] = React.useState(false)
  const [isDone, setIsDone] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])

  const addLog = React.useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg])
  }, [])

  const processedCount = data.filter((r) => r.status === "найдено" || r.status === "не найдено").length
  const progress = Math.round((processedCount / data.length) * 100)

  React.useEffect(() => {
    if (!isRunning || currentIndex >= data.length) {
      if (currentIndex >= data.length && isRunning) {
        setIsRunning(false)
        setIsDone(true)
        addLog("✅ Все строки обработаны. Агент завершил работу.")
      }
      return
    }

    const product = data[currentIndex].product
    const searchUrls = generateSearchResults(product)
    const price = generatePrice(product)

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => {
      setData((prev) =>
        prev.map((row, i) =>
          i === currentIndex ? { ...row, status: "обработка" as const } : row
        )
      )
      setBrowser({ url: `https://google.com/search?q=${encodeURIComponent(product + " цена купить")}`, query: product, results: [], active: true })
      addLog(`🔍 Обработка строки ${currentIndex + 1}: ${product}`)
    }, 200))

    timers.push(setTimeout(() => {
      setBrowser((prev) => ({ ...prev, url: searchUrls[0], results: [] }))
      addLog(`  ↳ Открываю ${searchUrls[0]}`)
    }, 800))

    timers.push(setTimeout(() => {
      setBrowser((prev) => ({ ...prev, url: searchUrls[1], results: [`Найдено: ${product} — ${price}`] }))
      addLog(`  ↳ Открываю ${searchUrls[1]}`)
    }, 1400))

    timers.push(setTimeout(() => {
      setBrowser((prev) => ({ ...prev, url: searchUrls[2], results: [`Найдено: ${product} — ${price}`, `Источник: ${searchUrls[1]}`] }))
      addLog(`  ↳ Цена найдена: ${price}`)
    }, 1800))

    timers.push(setTimeout(() => {
      const found = Math.random() > 0.05
      setData((prev) =>
        prev.map((row, i) =>
          i === currentIndex
            ? { ...row, price: found ? price : "", status: found ? ("найдено" as const) : ("не найдено" as const) }
            : row
        )
      )
      setBrowser({ url: "", query: "", results: [], active: false })
      setCurrentIndex((prev) => prev + 1)
    }, 2200))

    return () => timers.forEach(clearTimeout)
  }, [isRunning, currentIndex, data, addLog])

  const handleStart = React.useCallback(() => {
    setIsRunning(true)
    addLog("🚀 Агент запущен. Начинаю обработку таблицы...")
  }, [addLog])

  const handlePause = React.useCallback(() => {
    setIsRunning(false)
    addLog("⏸ Агент приостановлен.")
  }, [addLog])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 4 из 4</Badge>
        <h2 className="text-lg font-semibold">Обработка данных ИИ-агентом</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        ИИ-агент берёт товары из таблицы, открывает браузер через MCP Playwright, ищет цены и заполняет результат.
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

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <Card className="min-h-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">📊</span>
              Таблица данных
              {currentIndex > 0 && (
                <span className="text-xs text-muted-foreground">строка {Math.min(currentIndex + 1, data.length)}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 pb-0">
            <ScrollArea className="h-[340px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-10 px-2 py-1.5 font-medium">#</th>
                    <th className="px-2 py-1.5 font-medium">Название</th>
                    <th className="w-28 px-2 py-1.5 font-medium">Цена</th>
                    <th className="w-24 px-2 py-1.5 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const isActive = row.id - 1 === currentIndex && isRunning
                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors ${
                          isActive
                            ? "bg-primary/10"
                            : row.status === "найдено"
                              ? "bg-emerald-500/5"
                              : row.status === "не найдено"
                                ? "bg-red-500/5"
                                : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="px-2 py-1.5 text-muted-foreground">{row.id}</td>
                        <td className="px-2 py-1.5 font-medium">{row.product}</td>
                        <td className="px-2 py-1.5">{row.price || "—"}</td>
                        <td className="px-2 py-1.5">
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

        <div className="flex min-h-0 flex-col gap-4">
          <Card className="min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">🌐</span>
                Chrome + MCP Playwright
                {browser.active && (
                  <span className="animate-pulse text-[10px] text-blue-500">● активно</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-1.5">
                  <div className="flex gap-1">
                    <div className="size-2.5 rounded-full bg-red-400" />
                    <div className="size-2.5 rounded-full bg-yellow-400" />
                    <div className="size-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 overflow-hidden rounded bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground truncate">
                    {browser.url || "about:blank"}
                  </div>
                </div>
                <div className="min-h-[100px] bg-background p-3">
                  {browser.active ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium">Поиск: {browser.query}</p>
                      {browser.results.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {browser.results.map((r, i) => (
                            <div key={i} className="rounded bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                              {r}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="animate-spin">⟳</span>
                          Загрузка страницы...
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Браузер ожидает запуска агента...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-0 flex-1">
            <CardHeader>
              <CardTitle className="text-xs">Лог агента</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 pb-0">
              <ScrollArea className="h-[120px]">
                <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                  {logs.length === 0 && (
                    <p className="text-muted-foreground">Нажмите «Запуск» для начала обработки</p>
                  )}
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">
                      <span className="text-[9px] opacity-50">
                        {new Date().toLocaleTimeString("ru-RU")}
                      </span>{" "}
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        {isDone && (
          <Button onClick={onComplete}>
            🎉 Гайд завершён
          </Button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "ожидает": "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    "обработка": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    "найдено": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    "не найдено": "bg-red-500/15 text-red-700 dark:text-red-400",
  }

  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${styles[status] || styles["ожидает"]}`}>
      {status === "обработка" && <span className="mr-1 animate-spin">⟳</span>}
      {status === "найдено" && <span className="mr-1">✓</span>}
      {status}
    </span>
  )
}