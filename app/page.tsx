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
import { CreateAgentButton } from "@/components/create-agent-button"
import { SiteHeader } from "@/components/site-header"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Page() {
  const router = useRouter()
  const scenarios = listScenarios()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader label="Интерактивное демо">
        <CreateAgentButton className="hidden sm:inline-flex" />
        <ThemeToggle />
      </SiteHeader>

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
            <Card className="relative w-full overflow-hidden border-cyan-400/40 transition-all hover:border-cyan-400/70 hover:shadow-[0_0_30px_rgba(34,211,238,0.18)]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-cyan-400/15 opacity-70" />
              <CardContent className="relative flex flex-col items-center gap-5 p-8 text-center sm:flex-row sm:text-left">
                <span className="text-5xl">⚡</span>
                <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-lg font-bold">Создай свой ИИ-агент</span>
                    <span className="text-sm text-muted-foreground">
                      Перейдите в панель управления MimikkAi, чтобы создать и настроить
                      собственного ИИ-агента под ваши задачи
                    </span>
                  </div>
                  <CreateAgentButton size="lg" className="mt-1 w-full sm:w-auto" />
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