"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface StepDataTableProps {
  onNext: () => void
  onBack: () => void
}

interface DataRow {
  id: number
  product: string
  price: string
  status: "ожидает" | "обработка" | "найдено" | "не найдено"
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

const BATCH_SIZE = 5
const BATCH_DELAY_MS = 50

export function StepDataTable({ onNext, onBack }: StepDataTableProps) {
  const [data, setData] = React.useState<DataRow[]>([])
  const [isFilling, setIsFilling] = React.useState(false)
  const [isFilled, setIsFilled] = React.useState(false)
  const [lastAddedCount, setLastAddedCount] = React.useState(0)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const fillProgress = Math.round((data.length / PRODUCTS.length) * 100)

  const handleFillData = React.useCallback(() => {
    if (isFilling) return
    setIsFilling(true)
    setData([])
    setIsFilled(false)

    let batchIndex = 0

    const interval = setInterval(() => {
      const start = batchIndex * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, PRODUCTS.length)
      const newRows: DataRow[] = []

      for (let i = start; i < end; i++) {
        newRows.push({
          id: i + 1,
          product: PRODUCTS[i],
          price: "",
          status: "ожидает" as const,
        })
      }

      setData((prev) => [...prev, ...newRows])
      setLastAddedCount(newRows.length)
      batchIndex++

      if (end >= PRODUCTS.length) {
        clearInterval(interval)
        setIsFilling(false)
        setIsFilled(true)
      }
    }, BATCH_DELAY_MS)
  }, [isFilling])

  React.useEffect(() => {
    if (isFilling && scrollRef.current) {
      const scrollEl = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      }
    }
  }, [data, isFilling])

  const statusColor: Record<string, string> = {
    ожидает: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
    обработка: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    найдено: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    "не найдено": "bg-red-500/15 text-red-700 dark:text-red-400",
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 3 из 4</Badge>
        <h2 className="text-lg font-semibold">Таблица данных</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Тестовые данные для обработки — 100 товаров. ИИ-агент будет брать
        название из колонки A, искать цену через браузер и заполнять результат.
      </p>

      {(isFilling || (isFilled && data.length > 0)) && (
        <div className="flex items-center gap-3">
          <Progress value={fillProgress} className="flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {data.length}/{PRODUCTS.length} строк
          </span>
        </div>
      )}

      <Card className="min-h-0 flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Данные для обработки</span>
            <span className="text-xs text-muted-foreground">
              {data.length} строк
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 pb-0">
          {data.length === 0 && !isFilling ? (
            <div className="flex h-[440px] flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h2" />
                  <path d="M14 13h2" />
                  <path d="M8 17h2" />
                  <path d="M14 17h2" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Нет данных</p>
                <p className="text-xs">
                  Нажмите кнопку ниже, чтобы заполнить таблицу
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea ref={scrollRef} className="md:h-[440px] h-[calc(100dvh-340px)]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-12 px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">
                      A — Название товара
                    </th>
                    <th className="hidden w-36 px-3 py-2 font-medium sm:table-cell">B — Цена</th>
                    <th className="w-28 px-3 py-2 font-medium">C — Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => {
                    const isNew =
                      index >= data.length - lastAddedCount && isFilling
                    return (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${isNew ? "row-animate-in" : ""}`}
                        style={
                          isNew
                            ? {
                                animationDelay: `${(index % BATCH_SIZE) * 40}ms`,
                              }
                            : undefined
                        }
                      >
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.id}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.product}</td>
                        <td className="hidden px-3 py-2 text-muted-foreground sm:table-cell">
                          {row.price || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[row.status]}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <div className="flex gap-2">
          {!isFilled && (
            <Button
              size="lg"
              className="gap-2"
              onClick={handleFillData}
              disabled={isFilling}
            >
              {isFilling ? "Заполнение..." : "Заполнить данные"}
            </Button>
          )}
          {isFilled && (
            <Button size="lg" className="gap-2" onClick={onNext}>
              Начать обработку
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
