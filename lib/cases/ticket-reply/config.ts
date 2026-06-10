import type { CaseConfig } from "../types"

export const ticketReplyConfig: CaseConfig = {
  slug: "ticket-reply",
  chat: {
    greeting:
      "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:",
    presetPrompt: "Я хочу ИИ-агента для ответов на тикеты техподдержки",
    presetPromptDesc:
      "Агент ищет ответ в wiki-документации и формирует ответ пользователю",
    assistantResponse:
      "Отлично! Создаю ИИ-агента для ответов на тикеты техподдержки.\n\nАгент будет:\n\n• Брать дату обращения из колонки A таблицы\n• Открывать wiki-документацию через браузер\n• Искать подходящую статью по теме вопроса\n• Извлекать ответ из статьи\n• Формировать текст ответа для пользователя\n• Записывать ответ и источник в таблицу\n\nКонфигурация mim.lua сгенерирована.",
  },
  mimLua: {
    inputColumns: [
      {
        id: "A",
        label: "Дата тикета",
        example: "11.06.2026",
      },
    ],
    outputColumns: [
      { id: "B", label: "Ответ", example: "Для сброса пароля перейдите в Настройки..." },
      { id: "C", label: "Источник", example: "https://docs.example-wiki.ru/password-reset" },
      { id: "D", label: "Статус", example: "отвечено" },
    ],
    promptSteps: [
      { text: "Открыть wiki-документацию", icon: "🌐" },
      { text: "Найти статью по запросу", icon: "🔍" },
      { text: "Извлечь ответ из статьи", icon: "📄" },
      { text: "Сформировать ответ пользователю", icon: "✍️" },
      { text: "Записать результат в таблицу", icon: "📝" },
    ],
    agentTitle: "Ответ на тикеты",
    agentDesc: "ИИ-агент для обработки обращений техподдержки через wiki-документацию",
    promptIntro:
      "«Ты — агент техподдержки. Для каждого обращения найди ответ в wiki-документации, извлеки релевантную информацию и сформируй ответ пользователю.»",
  },
  dataTable: {
    columns: [
      { id: "A", label: "Дата тикета", type: "input" },
      { id: "B", label: "Ответ", type: "output" },
      { id: "C", label: "Источник", type: "output" },
      { id: "D", label: "Статус", type: "output" },
    ],
    description:
      "Тестовые данные для обработки — 30 обращений в техподдержку. ИИ-агент будет искать ответы в wiki-документации и заполнять результат.",
    fillButtonText: "Заполнить данные",
    emptyIcon: "📋",
    emptyTitle: "Нет данных",
    emptyDesc: "Нажмите кнопку ниже, чтобы заполнить таблицу",
  },
}

if (process.env.NODE_ENV !== "production") {
  console.debug("[ticket-reply:config] loaded", { slug: ticketReplyConfig.slug })
}