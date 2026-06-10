import type { CaseConfig } from "../types"

export const threadsCommentsConfig: CaseConfig = {
  slug: "threads-comments",
  chat: {
    greeting:
      "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:",
    presetPrompt: "Я хочу ИИ-агента для комментирования постов в Threads",
    presetPromptDesc:
      "Агент находит посты об AI в Threads и оставляет нативные комментарии",
    assistantResponse:
      "Отлично! Создаю ИИ-агента для комментирования в Threads.\n\nАгент будет:\n\n• Открывать Threads через браузер\n• Искать посты на тему AI и автоматизации\n• Анализировать контекст поста\n• Генерировать нативный комментарий с упоминанием Mimikkai\n• Публиковать комментарий\n• Записывать результат в таблицу: ссылка, текст поста, комментарий, статус\n\nКонфигурация mim.lua сгенерирована.",
  },
  mimLua: {
    inputColumns: [{ id: "A", label: "Дата", example: "18.05" }],
    outputColumns: [
      {
        id: "B",
        label: "Ссылка на пост",
        example: "https://www.threads.com/@user/post/abc",
      },
      { id: "C", label: "Текст поста", example: "Ищу AI для автоматизации" },
      { id: "D", label: "Комментарий", example: "Попробуйте Mimikkai..." },
      { id: "E", label: "Статус", example: "Готово" },
    ],
    promptSteps: [
      { text: "Открой Threads через браузер", icon: "🌐" },
      { text: "Найди пост по теме AI", icon: "🔍" },
      { text: "Проанализируй контекст поста", icon: "🧠" },
      { text: "Сгенерируй нативный комментарий", icon: "✍️" },
      { text: "Опубликуй комментарий", icon: "💬" },
      { text: "Запиши результат в таблицу", icon: "📝" },
    ],
    agentTitle: "Комментирование в Threads",
    agentDesc: "ИИ-агент для поиска постов и нативного комментирования",
    promptIntro:
      "«Ты — агент по комментированию постов в Threads. Найди пост про AI, сгенерируй нативный комментарий с упоминанием Mimikkai и опубликуй.»",
  },
  dataTable: {
    columns: [
      { id: "A", label: "Дата", type: "input" },
      { id: "B", label: "Ссылка на пост", type: "output" },
      { id: "C", label: "Текст поста", type: "output" },
      { id: "D", label: "Комментарий", type: "output" },
      { id: "E", label: "Статус", type: "output" },
    ],
    description:
      "Тестовые данные для обработки — 30 записей. ИИ-агент будет искать посты в Threads, генерировать комментарии и записывать результаты.",
    fillButtonText: "Заполнить данные",
    emptyIcon: "📋",
    emptyTitle: "Нет данных",
    emptyDesc: "Нажмите кнопку ниже, чтобы заполнить таблицу",
  },
}
