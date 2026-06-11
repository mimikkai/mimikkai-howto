import type { Metadata } from "next"
import { listScenarioSlugs, getScenario } from "@/lib/cases/registry"
import "@/lib/cases/price-search"
import "@/lib/cases/threads-comments"
import "@/lib/cases/email-outreach"
import "@/lib/cases/ticket-reply"
import "@/lib/cases/crm-order-tracking"
import "@/lib/cases/marketplace-card-fill"
import { ScenarioPageContent } from "./scenario-page-content"

const BASE_URL = "https://howto.mimikkai.ru"

export function generateStaticParams() {
  return listScenarioSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const scenario = getScenario(slug)
    const title = scenario
      ? `MimikkAi Howto - ${scenario.meta.title}`
      : "MimikkAi Howto"
    const description = scenario?.meta.description ?? "Интерактивное демо ИИ-агентов MimikkAi"
    const url = `${BASE_URL}/${slug}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "MimikkAi",
        locale: "ru_RU",
        type: "website",
      },
      alternates: {
        canonical: url,
      },
    }
  })
}

export default function ScenarioPage() {
  return <ScenarioPageContent />
}