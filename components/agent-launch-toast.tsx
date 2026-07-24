"use client"

import * as React from "react"

interface AgentLaunchToastProps {
  /** show = true → "запустите агента", show = false → показываем celebration только если isRunning */
  showStartPrompt: boolean
  showCelebration: boolean
  isRunning: boolean
  isDone: boolean
  toastVisible: boolean
  onStart: () => void
  onCloseStart: () => void
  onCloseCelebration: () => void
}

export function AgentLaunchToast({
  showStartPrompt,
  showCelebration,
  isRunning,
  isDone,
  toastVisible,
  onStart,
  onCloseStart,
  onCloseCelebration,
}: AgentLaunchToastProps) {
  return (
    <>
      {showStartPrompt && !isRunning && !isDone && (
        <div
          className="fixed bottom-4 right-4 z-[100] w-[calc(100%-2rem)] max-w-xs"
          style={{
            backgroundColor: "rgb(249, 250, 251)",
            color: "#111",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid rgb(15, 118, 110)",
            position: "fixed",
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          <button
            onClick={onCloseStart}
            aria-label="Закрыть"
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            ✕
          </button>
          <div className="flex items-start gap-2">
            <span className="text-xl shrink-0">🚀</span>
            <div className="flex-1">
              <p className="text-sm font-bold">Запустите агента</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Нажмите кнопку, чтобы увидеть демо
              </p>
              <button
                onClick={onStart}
                className="mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: "rgb(15, 118, 110)",
                  color: "#fff",
                }}
              >
                🚀 Запустить агента
              </button>
            </div>
          </div>
        </div>
      )}

      {showCelebration && isRunning && !isDone && (
        <div
          className="fixed bottom-4 right-4 z-[100] w-[calc(100%-2rem)] max-w-xs"
          style={{
            backgroundColor: "rgb(249, 250, 251)",
            color: "#111",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid rgb(5, 150, 105)",
            position: "fixed",
            opacity: toastVisible ? 1 : 0,
            transform: toastVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          <button
            onClick={onCloseCelebration}
            aria-label="Закрыть"
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            ✕
          </button>
          <div className="flex items-start gap-2">
            <span className="text-xl shrink-0">🎉</span>
            <div className="flex-1">
              <p className="text-sm font-bold">Ура! Агент работает!</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Попробуйте создать своего агента на платформе{" "}
                <a
                  href="https://panel.mimikkai.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                  style={{ color: "rgb(15, 118, 110)" }}
                >
                  MimikkAi
                </a>
              </p>
              <a
                href="https://panel.mimikkai.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg px-3 py-2 text-center text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundColor: "rgb(5, 150, 105)",
                  color: "#fff",
                }}
              >
                Создать агента
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Hook that manages the toast state. Returns props to pass to <AgentLaunchToast />.
 */
export function useAgentLaunchToast(isRunning: boolean, isDone: boolean) {
  const [showStartPrompt, setShowStartPrompt] = React.useState(false)
  const [showCelebration, setShowCelebration] = React.useState(false)
  const [toastVisible, setToastVisible] = React.useState(false)

  React.useEffect(() => {
    if (!isRunning && !isDone) {
      const t = setTimeout(() => {
        setShowStartPrompt(true)
        setToastVisible(true)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [isRunning, isDone])

  const triggerCelebration = React.useCallback(() => {
    setShowStartPrompt(false)
    setToastVisible(false)
    setTimeout(() => {
      setShowCelebration(true)
      setToastVisible(true)
    }, 800)
  }, [])

  const closeStart = React.useCallback(() => {
    setShowStartPrompt(false)
  }, [])

  const closeCelebration = React.useCallback(() => {
    setShowCelebration(false)
  }, [])

  return {
    showStartPrompt,
    showCelebration,
    toastVisible,
    triggerCelebration,
    closeStart,
    closeCelebration,
  }
}