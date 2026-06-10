export interface ChatConfig {
  greeting: string
  presetPrompt: string
  presetPromptDesc: string
  assistantResponse: string
}

export interface MimLuaColumn {
  id: string
  label: string
  example: string
}

export interface MimLuaPromptStep {
  text: string
  icon: string
}

export interface MimLuaConfig {
  inputColumns: MimLuaColumn[]
  outputColumns: MimLuaColumn[]
  promptSteps: MimLuaPromptStep[]
  agentTitle: string
  agentDesc: string
  promptIntro: string
}

export interface DataTableColumn {
  id: string
  label: string
  type: "input" | "output"
}

export interface DataTableConfig {
  columns: DataTableColumn[]
  description: string
  fillButtonText: string
  emptyIcon: string
  emptyTitle: string
  emptyDesc: string
}

export interface CaseConfig {
  slug: string
  chat: ChatConfig
  mimLua: MimLuaConfig
  dataTable: DataTableConfig
}

export const PRODUCTS = [
  "iPhone 15 Pro Max 256GB",
  'MacBook Air M3 15"',
  "Samsung Galaxy S24 Ultra",
  "PlayStation 5 Slim",
  "Nintendo Switch OLED",
  "Xbox Series X",
  'iPad Pro 11" M4',
  "AirPods Pro 2",
  "Dyson V15 Detect",
  "Sony WH-1000XM5",
  'LG OLED C4 65"',
  "Bose QuietComfort Ultra",
  "Canon EOS R6 Mark II",
  "GoPro Hero 12 Black",
  "DJI Mini 4 Pro",
  "Kindle Paperwhite 5",
  "Apple Watch Ultra 2",
  "Samsung Galaxy Watch 6 Classic",
  "Garmin Fenix 7X Pro",
  "Meta Quest 3",
  "Steam Deck OLED",
  "ROG Ally X",
  "Razer Blade 16",
  "ThinkPad X1 Carbon Gen 11",
  "Surface Pro 10",
  "Dell XPS 15 9530",
  "HP Spectre x360 14",
  "ASUS Zenbook 14 OLED",
  "Mac Studio M2 Ultra",
  "Mac mini M2 Pro",
  "Samsung 990 Pro 2TB",
  "WD Black SN850X 2TB",
  "Corsair DDR5 32GB Kit",
  "NVIDIA RTX 4090",
  "AMD Ryzen 9 7950X3D",
  "Intel Core i9-14900K",
  "ASUS ROG Maximus Z790",
  "NZXT Kraken Z73 RGB",
  "Corsair RM1000x",
  "Fractal Design Torrent",
  "Sony A7 IV Body",
  "Fujifilm X-T5",
  "Nikon Z8",
  "Sigma 24-70mm f/2.8",
  "Rode NT1 5th Gen",
  "Elgato Stream Deck MK.2",
  "Logitech MX Master 3S",
  "Keychron Q1 Pro",
  'Samsung 49" Odyssey G9',
  'LG 27" UltraFine 5K',
  "BenQ PD3220U",
  "ASUS ProArt PA32UCG-K",
  "Dell U3223QE",
  "EIZO ColorEdge CG319X",
  "Raspberry Pi 5 8GB",
  "Arduino Uno R4 WiFi",
  "ESP32-S3 DevKit",
  "Flipper Zero",
  "Anker 737 Power Bank",
  "Shargeek 140W Power Bank",
  "Apple Magic Keyboard",
  "Logitech MX Keys S",
  "Razer Huntsman V3 Pro",
  "SteelSeries Apex Pro TKL",
  "HyperX Cloud III Wireless",
  "SteelSeries Arctis Nova Pro",
  "Sennheiser HD 660S2",
  "Focal Clear Mg",
  "iFi Zen DAC V2",
  "FiiO K7",
  "Topping DX3 Pro+",
  "Audio-Technica LP120X",
  "Pro-Ject Debut Carbon EVO",
  "KEF LSX II",
  "Sonos Era 300",
  "JBL Charge 5",
  "Marshall Stanmore III",
  "Bowers & Wilkins Zeppelin",
  "Nest Hub Max",
  "Echo Show 10",
  "Apple HomePod 2",
  "Ring Doorbell 4",
  "Philips Hue Starter Kit",
  "TP-Link Deco XE75 Pro",
  "Ubiquiti Dream Machine SE",
  "Synology DS923+",
  "QNAP TS-464",
  "WD Red Plus 8TB",
  "Seagate IronWolf 8TB",
  "Tesla Model 3 Accessories Kit",
  "DJI Osmo Pocket 3",
  "Insta360 X4",
  "Peak Design Travel Tripod",
  "Moment MT-24 Lens Filter",
  "Apple AirTag 4-Pack",
  "Tile Pro 2-Pack",
  "Anker 715 PowerPort",
  "UGREEN 100W USB-C Hub",
  "CalDigit TS4 Dock",
  "Elgato Key Light Mini",
  "Rode PodMic USB",
]

export const THREADS_POSTS = [
  {
    date: "18.05",
    postText:
      "Идея дня: личный радар лидов. Не \"купить базу\", не спамить людям, а собрать агента, который мониторит открытые чаты/сообщества и вытаскивает реальные запросы: кому нужен сайт, бот, дизайн, автоматизация. Потом складывает в каталог и предлагает нормальный человеческий ответ. Вот это уже похоже на полезный AI-инструмент, а не инфоцыганский \"у нас горы клиентов\".",
    postUrl: "https://www.threads.com/@radar.1ooi/post/DYegQYSDR7q",
    comment:
      "Круто, что вы это озвучили) У нас как раз похожий кейс, настроили ии агента, который мониторит чаты и сообщества по ключевым словам, собирает запросы в таблицу и готовит черновики ответов. Главное преимущество, агент не устаёт и не пропускает сообщения. Такой сценарий можно описать за 10-15 минут и он будет работать в фоне",
  },
  {
    date: "18.05",
    postText:
      "целые полчаса вайбкодил свой стартап сайт ии сервис, но до сих пор 0 пользователей, в чем дело? протестируйте, пожалуйста 🙏 localhost:3000",
    postUrl: "https://www.threads.com/@selfifyai/post/DYcVh8YFzLU",
    comment:
      "Пока вы кодили 30 минут, потенциальные пользователи так и не узнали про сервис) ИИ-агенты крутая штука для рутины: рассылки, обработка заявок, проверка данных. Через нашу платформу можно настраивать сценарии без кода. Но тут важнее другое. Если сервис на localhost его никто не увидит. Сначала деплой, потом пользователи)",
  },
  {
    date: "02.06",
    postText:
      "Странное наблюдение: многие боятся, что AI заменит творчество. Но шаблонного контента стало слишком много ещё ДО AI.",
    postUrl: "https://www.threads.com/@osokina_helga/post/DYc207dEjkk",
    comment:
      "Мы не согласны с этим страхом) Тут важный момент, ии не заменит творчество полностью, но заберёт ту часть, которая связана с рутинными операциями. Как это работает у нас в MimikkAi: 1. Описываешь сценарий, агент собирает данные, готовит черновики 2. Человек редактирует, добавляет смысл 3. Агент отправляет результат Ии это инструмент, который забирает рутину, а не творчество",
  },
  {
    date: "03.06",
    postText:
      "Представьте, что у вас успешный бизнес и вы строите свою срм систему. Какую необычную функцию вы бы себе навайбкодили? Ну типа свой собственный зум или нотион. Или какую-то автоматизацию?",
    postUrl: "https://www.threads.com/@dent1st_bali_love/post/DZGdUxFAgcb",
    comment:
      "Вот как раз через ии агентов такие вещи и делаются) 1. Автоматическое создание заявок из входящих писем 2. Проверка цен конкурентов 3. Персонализированные рассылки 4. Подготовка документов Описываешь сценарий агенту и он работает вместо людей. Через MimikkAi можно собрать свою CRM, где рутину забирают агенты, а не люди",
  },
  {
    date: "04.06",
    postText:
      "Кто-нибудь автоматизировал обработку входящих заявок с сайта? У нас каждый день 50-100 обращений и менеджер не справляется, часть теряется",
    postUrl: "https://www.threads.com/@crm_builder/post/DZk9fMsTa11",
    comment:
      "Именно для этого и создавали MimikkAi, агент сам принимает заявку, квалифицирует и отвечает, создаётся за несколько текстовых запросов без разработчиков",
  },
  {
    date: "04.06",
    postText:
      "Нейросети для бизнеса это хайп или реально помогает? Кто внедрял, поделитесь опытом",
    postUrl: "https://www.threads.com/@bizcoach_anna/post/DZl2nKpR3mQ",
    comment:
      "Реально помогает, если применять правильно) У нас на платформе MimikkAi агенты автоматизируют конкретные задачи: обработка заявок, мониторинг цен, рассылки. Не абстрактный ии, а рабочий инструмент за 10 минут",
  },
  {
    date: "05.06",
    postText:
      "Потратил 3 часа на ручной парсинг цен конкурентов. Есть же способ это автоматизировать? Или только программиста нанимать?",
    postUrl: "https://www.threads.com/@price_hunter77/post/DZm8VcNwP2R",
    comment:
      "Программист не нужен) В Mimikkai создаёшь агента, он сам ходит по браузеру, собирает нужные данные и складывает в таблицу, никакого кода",
  },
  {
    date: "05.06",
    postText:
      "AI агент который сам отвечает на комментарии в соцсетях, это реально? Или только мечты?",
    postUrl: "https://www.threads.com/@social_media_pro/post/DZn1BxQwK4T",
    comment:
      "Реально, мы это уже делаем) Через MimikkAi описываешь стиль ответов и агент отвечает на комментарии сам, можно настроить за 15 минут",
  },
  {
    date: "06.06",
    postText:
      "Устал каждый день вручную заполнять одни и те же документы по шаблону. КП, договоры, коммерческие. Есть автоматизация?",
    postUrl: "https://www.threads.com/@docflow_master/post/DZo5YtAkL7n",
    comment:
      "Это можно делегировать агенту, в Mimikkai создаёшь его без кода, просто описываешь задачу словами и он сам формирует документы по шаблону",
  },
  {
    date: "06.06",
    postText:
      "Какие есть бесплатные AI инструменты для малого бизнеса? Бюджет нулевой, но рутину надо убирать",
    postUrl: "https://www.threads.com/@small_biz_ru/post/DZp3NvRm9Kw",
    comment:
      "MimikkAi как раз для малого бизнеса, там можно создать агента бесплатно для базовых задач: ответы на заявки, обработка данных, рассылки",
  },
  {
    date: "07.06",
    postText:
      "Вот бы был AI ассистент который мониторит изменения цен на маркетплейсах и присылает алерт. Такой инструмент существует?",
    postUrl: "https://www.threads.com/@market_watch_ru/post/DZq7HfTpN2L",
    comment:
      "Существует) В Mimikkai описываешь сценарий и агент сам мониторит цены, сравнивает и шлёт алерт когда цена падает. Без кода, за 10 минут",
  },
  {
    date: "07.06",
    postText:
      "Каждый день теряю 2 часа на переписку с клиентами в WhatsApp. Можно ли это как-то оптимизировать?",
    postUrl: "https://www.threads.com/@whatsapp_guru/post/DZr4KjWpM8N",
    comment:
      "Можно) ИИ-агент через Mimikkai сам отвечает на типовые вопросы, перенаправляет сложные на вас. Создаётся за несколько запросов в чат",
  },
  {
    date: "08.06",
    postText:
      "Слушайте, а кто-нибудь использовал AI для автоматизации работы с маркетплейсами? Карточки, цены, отзывы",
    postUrl: "https://www.threads.com/@wb_seller_pro/post/DZs6LmQnR3V",
    comment:
      "Да, через Mimikkai можно настроить агента для маркетплейсов: обновление карточек, мониторинг цен, анализ отзывов. Всё без кода",
  },
  {
    date: "08.06",
    postText:
      "Ищу сервис где можно создать Telegram бота без программирования. Чтобы он принимал заявки и квалифицировал их",
    postUrl: "https://www.threads.com/@tg_bot_maker/post/DZt8NbWkP5X",
    comment:
      "Попробуйте Mimikkai, там можно создать такого бота буквально за несколько запросов в чат, никакой сложной настройки и кода",
  },
  {
    date: "09.06",
    postText:
      "Автоматизация это не про программистов больше. Сейчас любой может описать задачу словами и получить рабочего агента. Будущее уже тут",
    postUrl: "https://www.threads.com/@future_today_ai/post/DZu2HcRlQ7J",
    comment:
      "Согласны на 100%) Именно это мы и делаем в Mimikkai, описываешь задачу словами и агент готов. Рутина уходит, люди занимаются творчеством",
  },
  {
    date: "09.06",
    postText:
      "Как быстро собрать MVP если ты не умеешь кодить? Есть ли AI-инструменты которые реально помогают?",
    postUrl: "https://www.threads.com/@mvp_builder/post/DZv5JdSnT9K",
    comment:
      "Mimikkai как раз про это, создаёшь агента без кода для автоматизации рутины: обработка заявок, рассылки, мониторинг. MVP за 15 минут",
  },
  {
    date: "10.06",
    postText:
      "Поставил эксперимент: пусть AI обрабатывает входящие письма неделю. Результат: скорость ответа x3, ошибки снизились. Но нужен контроль",
    postUrl: "https://www.threads.com/@email_hacker/post/DZw8LfRoU2P",
    comment:
      "Контроль это ключевой момент) В Mimikkai агент работает по сценарию, а человек контролирует результаты. Идеальный баланс автоматизации и контроля",
  },
  {
    date: "10.06",
    postText:
      "Ребят, нужен бот который будет собирать отзывы о компании из интернета и складывать в таблицу. Кто может сделать?",
    postUrl: "https://www.threads.com/@reputation_mgr/post/DZx1MgSpV3R",
    comment:
      "Не нужен программист) В Mimikkai описываешь задачу и агент сам ходит по сайтам, собирает отзывы и складывает в таблицу",
  },
  {
    date: "11.06",
    postText:
      "AI для бизнеса это не chatgpt в браузере. Это агент который работает 24/7 и не жалуется на зарплату",
    postUrl: "https://www.threads.com/@ai_enthusiast/post/DZy4NhTqW5L",
    comment:
      "Точно) Через Mimikkai можно создать такого агента за 15 минут: обработка заявок, мониторинг, рассылки. Работает 24/7 без перерывов",
  },
  {
    date: "11.06",
    postText:
      "Кто-нибудь делал автоматическую генерацию КП и договоров? У нас менеджеры тратят по часу на каждый документ",
    postUrl: "https://www.threads.com/@sales_ops_ru/post/DZz7PiUrX2M",
    comment:
      "Именно для этого и подходит Mimikkai, агент генерирует документы по шаблону, подставляет данные клиента, менеджер только проверяет. Экономия часа 3 в день",
  },
  {
    date: "12.06",
    postText:
      "Подскажите инструмент для массовой персонализированной рассылки. Не спам, а нормальные письма по базе клиентов",
    postUrl: "https://www.threads.com/@email_outreach_ru/post/Ea01QjVsN4K",
    comment:
      "В Mimikkai можно настроить агента для рассылок: он генерирует персонализированный текст для каждого клиента и отправляет. Не спам, а индивидуальный подход",
  },
  {
    date: "12.06",
    postText:
      "Тренд 2025: no-code AI агенты которые заменяют целые отделы. Не верите? У нас агент обрабатывает 200 заявок в день вместо 3 менеджеров",
    postUrl: "https://www.threads.com/@trend_watcher/post/Ea14RkWtP7L",
    comment:
      "Подтверждаем тренд) В Mimikkai такие агенты создаются без кода за несколько минут. Описываешь задачу и агент работает, люди занимаются стратегией",
  },
  {
    date: "13.06",
    postText:
      "Как автоматизировать обновление цен на Wildberries? Каждый день вручную 200 карточек править это ад",
    postUrl: "https://www.threads.com/@wb_manager/post/Ea27SlXuQ2N",
    comment:
      "Попробуйте Mimikkai, там агент сам ходит по маркетплейсу, обновляет цены и карточки. Описываешь сценарий словами и он работает в фоне",
  },
  {
    date: "13.06",
    postText:
      "Ищу способ автоматически мониторить упоминания бренда в соцсетях. Кто-нибудь реализовывал?",
    postUrl: "https://www.threads.com/@brand_monitor/post/Ea30TmYvR5Q",
    comment:
      "В Mimikkai можно настроить агента для мониторинга: он сканирует соцсети по ключевым словам и присылает алерт при упоминании бренда",
  },
  {
    date: "14.06",
    postText:
      "Залипательно наблюдать как AI агент сам заполняет таблицу из PDF. Будущее рутинной работы это точно не за людьми",
    postUrl: "https://www.threads.com/@data_nerd_ru/post/Ea43UnZwS8R",
    comment:
      "Именно) В Mimikkai агент не только из PDF, но и из браузера, писем, чатов. Описываешь источник и он сам всё собирает",
  },
  {
    date: "14.06",
    postText:
      "Срочно нужен AI который отвечает на отзывы в Яндекс Картах и 2GIS. Кто подскажет сервис?",
    postUrl: "https://www.threads.com/@local_biz_ai/post/Ea56VpAxT1K",
    comment:
      "Mimikkai может это) Создаёшь агента, задаёшь стиль ответов и он сам отвечает на отзывы в карте. Настроить можно за 10 минут без кода",
  },
  {
    date: "15.06",
    postText:
      "Фрилансер который автоматизировал себе 80% задач через AI. Теперь берёт в 3 раза больше проектов. Вот это правильное применение",
    postUrl: "https://www.threads.com/@freelance_hack/post/Ea69WqByU4L",
    comment:
      "Правильный подход) В Mimikkai можно описать каждую рутинную задачу и агент будет делать её сам: ответы клиентам, обработка данных, рассылки",
  },
  {
    date: "15.06",
    postText:
      "Кто-нибудь пробовал AI для подбора кандидатов? HR тратит кучу времени на резюме, может автоматизировать?",
    postUrl: "https://www.threads.com/@hr_tech_ru/post/Ea72ZrCvW3N",
    comment:
      "В Mimikkai можно создать агента для HR: он фильтрует резюме по критериям, квалифицирует кандидатов и пишет черновики ответов. Без кода за 15 минут",
  },
  {
    date: "16.06",
    postText:
      "Наконец-то нашёл сервис где не надо кодить чтобы создать AI агента. Описал задачу словами и всё работает. Это магия",
    postUrl: "https://www.threads.com/@nocode_magic/post/Ea85AsDxX6P",
    comment:
      "Добро пожаловать в Mimikkai) Именно так и работает: описал задачу, агент готов, работает 24/7. Никакого кода и сложной настройки",
  },
  {
    date: "16.06",
    postText:
      "Задача дня: автоматизировать отчёты для руководства. Сейчас 2 часа каждый понедельник уходит на сбор данных из 5 источников",
    postUrl: "https://www.threads.com/@report_auto/post/Ea98BtEwY9R",
    comment:
      "В Mimikkai агент может собирать данные из разных источников и формировать отчёт по расписанию. Описываешь задачу и он делает это каждый понедельник сам",
  },
]

export const CASE_CONFIGS: Record<string, CaseConfig> = {
  "price-search": {
    slug: "price-search",
    chat: {
      greeting:
        "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:",
      presetPrompt: "Я хочу ИИ-агента чтобы он проверял цены в интернете",
      presetPromptDesc:
        "Агент ищет цены на товары через браузер и заполняет таблицу",
      assistantResponse:
        "Отлично! Создаю ИИ-агента для проверки цен в интернете.\n\nАгент будет:\n\n• Брать название товара из колонки A таблицы\n• Открывать браузер через MCP Playwright\n• Искать актуальную цену на маркетплейсах\n• Записывать найденную цену в колонку B\n• Обновлять статус обработки в колонку C\n\nКонфигурация mim.lua сгенерирована.",
    },
    mimLua: {
      inputColumns: [
        {
          id: "A",
          label: "Название товара",
          example: "iPhone 15 Pro Max 256GB",
        },
      ],
      outputColumns: [
        { id: "B", label: "Цена", example: "109 990 ₽" },
        { id: "C", label: "Статус", example: "найдено" },
      ],
      promptSteps: [
        { text: "Открой браузер через MCP Playwright", icon: "🌐" },
        { text: "Найди товар на маркетплейсах", icon: "🔍" },
        { text: "Определи актуальную цену", icon: "💰" },
        { text: "Запиши результат в колонку B", icon: "📝" },
        { text: "Обнови статус в колонку C", icon: "✅" },
      ],
      agentTitle: "Поиск цен на товары",
      agentDesc: "ИИ-агент для поиска актуальных цен через браузер",
      promptIntro:
        "«Ты — агент для поиска цен на товары в интернете. Для каждого товара выполни шаги ниже.»",
    },
    dataTable: {
      columns: [
        { id: "A", label: "Название товара", type: "input" },
        { id: "B", label: "Цена", type: "output" },
        { id: "C", label: "Статус", type: "output" },
      ],
      description:
        "Тестовые данные для обработки — 100 товаров. ИИ-агент будет брать название из колонки A, искать цену через браузер и заполнять результат.",
      fillButtonText: "Заполнить данные",
      emptyIcon: "📋",
      emptyTitle: "Нет данных",
      emptyDesc: "Нажмите кнопку ниже, чтобы заполнить таблицу",
    },
  },
  "threads-comments": {
    slug: "threads-comments",
    chat: {
      greeting:
        "Привет! Я помогу создать ИИ-агента на платформе MimikkAi.\n\nВыберите, какого агента вы хотите создать:",
      presetPrompt:
        "Я хочу ИИ-агента для комментирования постов в Threads",
      presetPromptDesc:
        "Агент находит посты об AI в Threads и оставляет нативные комментарии",
      assistantResponse:
        "Отлично! Создаю ИИ-агента для комментирования в Threads.\n\nАгент будет:\n\n• Открывать Threads через браузер\n• Искать посты на тему AI и автоматизации\n• Анализировать контекст поста\n• Генерировать нативный комментарий с упоминанием Mimikkai\n• Публиковать комментарий\n• Записывать результат в таблицу: ссылка, текст поста, комментарий, статус\n\nКонфигурация mim.lua сгенерирована.",
    },
    mimLua: {
      inputColumns: [{ id: "A", label: "Дата", example: "18.05" }],
      outputColumns: [
        { id: "B", label: "Ссылка на пост", example: "https://www.threads.com/@user/post/abc" },
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
  },
}