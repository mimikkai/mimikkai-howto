import { Button } from "@/components/ui/button"

export function CreateAgentButton({
  size = "sm",
  className = "",
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    <Button
      asChild
      size={size}
      className={`border-0 bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.35)] transition-all hover:shadow-[0_0_24px_rgba(34,211,238,0.55)] hover:brightness-110 ${className}`}
    >
      <a
        href="https://panel.mimikkai.ru"
        target="_blank"
        rel="noopener noreferrer"
      >
        Создать агента
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </a>
    </Button>
  )
}
