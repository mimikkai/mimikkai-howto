import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "MimikkAi Howto - интерактивное демо ИИ-агентов",
  description:
    "Посмотрите, как ИИ-агенты MimikkAi обрабатывают заявки, ищут товары, заполняют карточки на маркетплейсах и отвечают на тикеты. Выберите сценарий и наблюдайте за работой агента в реальном времени.",
  keywords: [
    "ИИ-агент",
    "автоматизация",
    "MimikkAi",
    "демо",
    "чат-бот",
    "обработка заявок",
    "маркетплейс",
  ],
  openGraph: {
    title: "MimikkAi Howto - интерактивное демо ИИ-агентов",
    description:
      "Посмотрите, как ИИ-агенты MimikkAi обрабатывают заявки, ищут товары, заполняют карточки на маркетплейсах и отвечают на тикеты. Выберите сценарий и наблюдайте за работой агента в реальном времени.",
    url: "https://howto.mimikkai.ru",
    siteName: "MimikkAi",
    locale: "ru_RU",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://howto.mimikkai.ru",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
