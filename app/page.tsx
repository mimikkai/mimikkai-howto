"use client"

import { useRouter } from "next/navigation"
import { listScenarios } from "@/lib/cases/registry"
import "@/lib/cases/price-search"
import "@/lib/cases/threads-comments"
import "@/lib/cases/email-outreach"
import "@/lib/cases/ticket-reply"
import "@/lib/cases/crm-order-tracking"
import "@/lib/cases/marketplace-card-fill"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Page() {
  const router = useRouter()
  const scenarios = listScenarios()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 text-lg font-bold">
              <svg
                width="24"
                height="22"
                viewBox="0 0 32 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <path
                  d="M31.8496 0.150391V24.3906L26.292 29.8496H23.6797V16.7969L23.4219 17.0605L16.1504 24.4971V21.7861L26.2031 11.7402V26.6143L26.4609 26.3477L29.2842 23.4297L29.3262 23.3867V3.9668L29.0703 4.22461L16.1504 17.2217V13.5098L29.2383 0.150391H31.8496ZM2.76172 0.150391L15.8496 13.5098V17.2217L2.92969 4.22461L2.67383 3.9668V23.3867L2.71582 23.4297L5.53906 26.3477L5.79688 26.6143V11.7402L15.8496 21.7861V24.4971L8.57812 17.0605L8.32031 16.7969V29.8496H5.70801L0.150391 24.3906V0.150391H2.76172Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.3"
                />
              </svg>
              MimikkAi
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Интерактивное демо
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Выберите сценарий</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Интерактивное демо — выберите кейс, чтобы увидеть примеры работы
              ИИ-агента
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {scenarios.map((scenario) => {
              const meta = scenario.meta
              return (
                <Card
                  key={meta.slug}
                  className={`aspect-square w-48 cursor-pointer transition-all ${
                    meta.available
                      ? "hover:border-primary/50 hover:shadow-md"
                      : "cursor-default opacity-50"
                  }`}
                  onClick={() => meta.available && router.push(`/${meta.slug}`)}
                >
                  <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="text-4xl">{meta.icon}</span>
                    <span className="text-sm font-semibold">{meta.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {meta.available ? meta.description : "Скоро"}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
            <Card
              className="aspect-square w-48 cursor-pointer border-primary/30 bg-primary/5 transition-all hover:border-primary/60 hover:shadow-md"
              onClick={() => router.push("/playground")}
            >
              <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="text-4xl">🧪</span>
                <span className="text-sm font-semibold">Playground</span>
                <span className="text-xs text-muted-foreground">
                  Загрузите свой mim.lua и посмотрите демо
                </span>
              </CardContent>
            </Card>
          </div>
          <div className="my-2 w-full border-t" />
          <a
            href="https://panel.mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full max-w-2xl"
          >
            <Card className="w-full transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
                <span className="text-5xl">⚡</span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-lg font-bold">
                    Создай свой ИИ-агент
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Перейдите в панель управления MimikkAi, чтобы создать и настроить
                    собственного ИИ-агента под ваши задачи
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                    Открыть panel.mimikkai.ru →
                  </span>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </main>
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-3 py-2 sm:px-6 sm:py-3">
          <a
            href="https://mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            mimikkai.ru
          </a>
        </div>
      </footer>
    </div>
  )
}