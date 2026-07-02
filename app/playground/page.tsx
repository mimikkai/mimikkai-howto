import type { Metadata } from "next"
import { PlaygroundContent } from "./playground-content"

export const metadata: Metadata = {
  title: "MimikkAi Playground — загрузка mim.lua",
  description:
    "Загрузите свой mim.lua или .zip с mim.lua внутри и посмотрите интерактивное демо сценария MimikkAi.",
  openGraph: {
    title: "MimikkAi Playground — загрузка mim.lua",
    description:
      "Загрузите свой mim.lua или .zip с mim.lua внутри и посмотрите интерактивное демо сценария MimikkAi.",
    url: "https://howto.mimikkai.ru/playground",
    siteName: "MimikkAi",
    locale: "ru_RU",
    type: "website",
  },
  alternates: {
    canonical: "https://howto.mimikkai.ru/playground",
  },
}

export default function PlaygroundPage() {
  return <PlaygroundContent />
}