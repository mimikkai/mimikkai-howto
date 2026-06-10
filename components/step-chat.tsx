"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface StepChatProps {
  onComplete: (prompt: string) => void
}

const PRESET_PROMPT = "Я хочу ИИ-агента чтобы он проверял цены в интернете"

const ASSISTANT_RESPONSE = "Отлично! Создаю ИИ-агента для проверки цен в интернете.\n\nАгент будет:\n\n• Брать название товара из колонки A таблицы\n• Открывать браузер через MCP Playwright\n• Искать актуальную цену на маркетплейсах\n• Записывать найденную цену в колонку B\n• Обновлять статус обработки в колонку C\n\nКонфигурация mim.lua сгенерирована."

const TYPING_SPEED = 18

export function StepChat({ onComplete }: StepChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [typedText, setTypedText] = React.useState("")
  const [isDone, setIsDone] = React.useState(false)
  const [variantSelected, setVariantSelected] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const typingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, typedText, isTyping, scrollToBottom])

  React.useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [])

  const handleSelectVariant = React.useCallback(() => {
    setVariantSelected(true)
    setInput(PRESET_PROMPT)

    setMessages((prev) => [
      ...prev,
      { role: "user", content: PRESET_PROMPT },
    ])
    setIsTyping(true)
    setTypedText("")

    let charIndex = 0

    typingRef.current = setInterval(() => {
      charIndex++
      setTypedText(ASSISTANT_RESPONSE.slice(0, charIndex))

      if (charIndex >= ASSISTANT_RESPONSE.length) {
        if (typingRef.current) clearInterval(typingRef.current)
        typingRef.current = null
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: ASSISTANT_RESPONSE },
        ])
        setTypedText("")
        setIsDone(true)
      }
    }, TYPING_SPEED)
  }, [])

  const showTyping = isTyping && typedText.length > 0
  const showCursor = isTyping && typedText.length > 0

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 1 из 4</Badge>
        <h2 className="text-lg font-semibold">Создание ИИ-агента через чат</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Выберите вариант — ИИ сгенерирует конфигурацию mim.lua для агента.
      </p>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">AI</span>
            MimikkAi Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ScrollArea className="h-[320px] pr-4" ref={scrollRef}>
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {showTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap text-foreground">
                    {typedText}
                    {showCursor && (
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-foreground align-text-bottom" />
                    )}
                  </div>
                </div>
              )}
              {isTyping && !showTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
                    <span className="animate-bounce text-xs" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce text-xs" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce text-xs" style={{ animationDelay: "300ms" }}>●</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="border-t p-4">
          {!variantSelected ? (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSelectVariant}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:bg-muted hover:border-primary/50"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">🔍</span>
                <div>
                  <div className="font-medium">{PRESET_PROMPT}</div>
                  <div className="text-xs text-muted-foreground">Агент ищет цены на товары через браузер и заполняет таблицу</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="px-1 py-1 text-xs text-muted-foreground">
              {isTyping ? "ИИ-агент формируется..." : "ИИ-агент создан"}
            </div>
          )}
        </div>
      </Card>

      {isDone && (
        <div className="flex justify-center animate-in fade-in duration-500">
          <Button size="lg" className="gap-2 text-base" onClick={() => onComplete(PRESET_PROMPT)}>
            <span>🤖</span> Посмотри ИИ-агента
          </Button>
        </div>
      )}
    </div>
  )
}