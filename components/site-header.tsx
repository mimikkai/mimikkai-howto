import * as React from "react"

export function SiteHeader({
  label,
  children,
}: {
  label?: string
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
        <div className="flex items-center gap-2">
          <a
            href="https://mimikkai.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-lg font-bold"
          >
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
          </a>
          {label ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {label}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
