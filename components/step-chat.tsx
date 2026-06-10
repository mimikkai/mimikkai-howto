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

const ASSISTANT_GREETING =
  "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:"

const ASSISTANT_RESPONSE =
  "Отлично! Создаю ИИ-агента для проверки цен в интернете.\n\nАгент будет:\n\n• Брать название товара из колонки A таблицы\n• Открывать браузер через MCP Playwright\n• Искать актуальную цену на маркетплейсах\n• Записывать найденную цену в колонку B\n• Обновлять статус обработки в колонку C\n\nКонфигурация mim.lua сгенерирована."

const MESSAGE_DURATION_MS = 2000
const TICK_INTERVAL_MS = 30

function calcCharsPerTick(textLength: number): number {
  const totalTicks = MESSAGE_DURATION_MS / TICK_INTERVAL_MS
  return Math.max(1, Math.ceil(textLength / totalTicks))
}

export function StepChat({ onComplete }: StepChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isTyping, setIsTyping] = React.useState(false)
  const [typedText, setTypedText] = React.useState("")
  const [isDone, setIsDone] = React.useState(false)
  const [variantSelected, setVariantSelected] = React.useState(false)
  const [isUserTyping, setIsUserTyping] = React.useState(false)
  const [userTypedText, setUserTypedText] = React.useState("")
  const [chatVisible, setChatVisible] = React.useState(false)
  const [greetingDone, setGreetingDone] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const typingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const userTypingRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null
  )

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  React.useEffect(() => {
    scrollToBottom()
  }, [
    messages,
    typedText,
    isTyping,
    isUserTyping,
    userTypedText,
    scrollToBottom,
  ])

  React.useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
      if (userTypingRef.current) clearInterval(userTypingRef.current)
    }
  }, [])

  const typeAssistantMessage = React.useCallback(
    (text: string, onDone: () => void) => {
      setIsTyping(true)
      setTypedText("")
      let i = 0
      const charsPerTick = calcCharsPerTick(text.length)

      typingRef.current = setInterval(() => {
        i = Math.min(i + charsPerTick, text.length)
        setTypedText(text.slice(0, i))
        if (i >= text.length) {
          if (typingRef.current) clearInterval(typingRef.current)
          typingRef.current = null
          setIsTyping(false)
          setMessages((prev) => [...prev, { role: "assistant", content: text }])
          setTypedText("")
          onDone()
        }
      }, TICK_INTERVAL_MS)
    },
    []
  )

  const typeUserMessage = React.useCallback(
    (text: string, onDone: () => void) => {
      setIsUserTyping(true)
      setUserTypedText("")
      let i = 0
      const charsPerTick = calcCharsPerTick(text.length)

      userTypingRef.current = setInterval(() => {
        i = Math.min(i + charsPerTick, text.length)
        setUserTypedText(text.slice(0, i))
        if (i >= text.length) {
          if (userTypingRef.current) clearInterval(userTypingRef.current)
          userTypingRef.current = null
          setIsUserTyping(false)
          setMessages((prev) => [...prev, { role: "user", content: text }])
          onDone()
        }
      }, TICK_INTERVAL_MS)
    },
    []
  )

  React.useEffect(() => {
    if (!chatVisible) return
    const timeout = setTimeout(() => {
      typeAssistantMessage(ASSISTANT_GREETING, () => {
        setGreetingDone(true)
      })
    }, 300)
    return () => clearTimeout(timeout)
  }, [chatVisible, typeAssistantMessage])

  const handleCreateAgent = React.useCallback(() => {
    setChatVisible(true)
  }, [])

  const handleSelectVariant = React.useCallback(() => {
    setVariantSelected(true)

    typeUserMessage(PRESET_PROMPT, () => {
      setTimeout(() => {
        typeAssistantMessage(ASSISTANT_RESPONSE, () => {
          setIsDone(true)
        })
      }, 400)
    })
  }, [typeUserMessage, typeAssistantMessage])

  const showTyping = isTyping && typedText.length > 0
  const showCursor = isTyping && typedText.length > 0

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline">Шаг 1 из 4</Badge>
        <h2 className="text-lg font-semibold">Создание ИИ-агента</h2>
      </div>

      {!chatVisible ? (
        <div className="animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center gap-8 duration-500">
          <div className="space-y-2 text-center">
            <span className="text-5xl">🤖</span>
            <h3 className="text-2xl font-bold tracking-tight">
              Создайте ИИ-агента
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Чат с ИИ поможет настроить агента под вашу задачу
            </p>
          </div>
          <Button
            size="lg"
            className="gap-3 rounded-2xl px-6 py-5 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 sm:px-8 sm:py-6 sm:text-lg"
            onClick={handleCreateAgent}
          >
            <span className="text-xl">💬</span>
            Создать агента
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-1 flex-col gap-4 duration-500">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  AI
                </span>
                MimikkAi Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col pb-0">
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
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
                  {isUserTyping && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
                        {userTypedText}
                        <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary-foreground align-text-bottom" />
                      </div>
                    </div>
                  )}
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
                    <div className="animate-in fade-in flex justify-start duration-300">
                      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
                        <span
                          className="animate-bounce text-xs"
                          style={{ animationDelay: "0ms" }}
                        >
                          ●
                        </span>
                        <span
                          className="animate-bounce text-xs"
                          style={{ animationDelay: "150ms" }}
                        >
                          ●
                        </span>
                        <span
                          className="animate-bounce text-xs"
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
            <div className="border-t p-4">
              {!variantSelected ? (
                <div
                  className={`flex flex-col items-end gap-2 transition-all duration-500 ${greetingDone ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
                >
                  <button
                    onClick={handleSelectVariant}
                    className="flex max-w-[85%] items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left text-sm transition-all duration-200 hover:scale-[1.01] hover:border-primary/50 hover:bg-muted"
                  >
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base">
                      🔍
                    </span>
                    <div>
                      <div className="font-medium">{PRESET_PROMPT}</div>
                      <div className="text-xs text-muted-foreground">
                        Агент ищет цены на товары через браузер и заполняет
                        таблицу
                      </div>
                    </div>
                  </button>
                </div>
              ) : !isDone ? (
                <div className="px-1 py-1 text-xs text-muted-foreground">
                  {isTyping ? "ИИ-агент формируется..." : "ИИ-агент создан"}
                </div>
              ) : null}
            </div>
            {isDone && (
              <div className="animate-in fade-in slide-in-from-right-4 flex justify-end p-4 pt-0 duration-500">
                <Button
                  size="lg"
                  className="max-w-[85%] gap-3 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                  onClick={() => onComplete(PRESET_PROMPT)}
                >
                  <span>🤖</span> Посмотри ИИ-агента
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
