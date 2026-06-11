# Research

Updated: 2026-06-11 18:00
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: новый кейс «Заполнение карточек товаров для маркетплейсов» (marketplace-card-fill)
Goal: добавить 6-й активный сценарий в интерактивное демо — ИИ-агент берёт наименование+артикул, ищет товар на сайте поставщика, собирает характеристики, заполняет сложную карточку Ozon (select/number/textarea/tags), перепроверяет и отправляет
Constraints:
- Next.js App Router, Tailwind CSS v4, `prefers-reduced-motion` обязателен
- Модульная архитектура: `lib/cases/<slug>/` с index, config, data, steps/
- `createScheduler()` — shared, не дублировать
- `ScenarioDefinition<TData, TRow>` + `registerScenario()` в registry
- `import "@/lib/cases/marketplace-card-fill"` в page.tsx
Decisions:
- slug: `marketplace-card-fill`, icon: `🛒`, title: «Заполнение карточек на маркетплейсе»
- Маркетплейс: Ozon (реальный, с реальными типами полей — select, number, textarea, tags)
- Сайт поставщика: абстрактный «TechSupply.ru» (один сайт, все товары там)
- 2 вкладки браузера: TechSupply.ru + Ozon Seller
- Вход: 2 колонки (A: Наименование, B: Артикул)
- Выход: 18 колонок (C-T): точное название, категория (2 уровня select), бренд, описание, страна (select), вес, длина, ширина, высота, цвет (select/multi), материал, модель, ключ.слова (tags), фото, комплектация, гарантия (select), возрастная категория (select), статус заполнения
- 30 товаров: электроника/офисная техника (ноутбуки, мониторы, МФУ, клавиатуры, роутеры, кресла и т.д.)
- Статусы: «ожидает» → «обрабатывается» → «заполнено»
- 12 LocalPhase: idle, supplier_home, supplier_product, supplier_copy, ozon_card, ozon_fill_basic, ozon_fill_category, ozon_fill_attrs, ozon_fill_keywords, ozon_review, ozon_submitted, writing
- Киллер-фича: визуализация select-полей (выпадающий список, выбор пункта) + этап ozon_review с перепроверкой
Open questions:
- (none)
Success signals:
- Карточка появляется на лендинге, все 4 шага работают end-to-end
- Processing показывает select-поля Ozon, этап перепроверки
- `pnpm typecheck` + `pnpm test` + `pnpm build` — чисто
Next step: `/aif-plan` — создать план реализации
<!-- aif:active-summary:end -->

## Sessions

### 2026-06-11 15:30 — новый кейс CRM + трекинг
What changed:
- пользователь выбрал вариант C: отслеживание доставки + обновление клиента
- CRM — абстрактная самописная, трекинг — абстрактный малоизвестный
- уведомление клиенту через Telegram/Email/WhatsApp в зависимости от клиента
- 3 вкладки браузера: CRM, Трекинг, Мессенджер
Key notes:
- флоу обработки: CRM дашборд → карточка заказа → копировать трек → сайт трекинга → результат → обновить CRM → уведомить клиента
- данные: 30 заказов, A(Клиент)/B(Город)/C(Товар) вход, D(Заказ)/E(Трек)/F(Статус)/G(ETA)/H(Уведомление) выход
- LocalPhase: crm_dashboard, crm_order_open, crm_copy_track, tracking_home, tracking_typing, tracking_results, crm_update_status, crm_notify_sent
Links (paths):
- lib/cases/email-outreach/ — ближайший референс (Яндекс + сайт компании + почтовый клиент)
- lib/cases/types.ts — ScenarioDefinition, BaseRow, CaseConfig
- lib/cases/registry.ts — registerScenario
- app/page.tsx — import + listScenarios()
- app/globals.css — keyframes + prefers-reduced-motion
- lib/cases/scheduler.ts — createScheduler

### 2026-06-10 22:15 — модуляризация сценариев
What changed:
- зафиксированы 4 ключевых решения: 4 шага в сценарии, свои данные, нормализация BrowserPhase, конфиг в `lib/cases/<slug>/`
- зафиксирована целевая структура `lib/cases/<slug>/{index,config,data,steps/}`
Key notes:
- главная боль — `step-processing.tsx` (2992 строки) с фазами всех 3 сценариев в одном `BrowserPhase` union
- `lib/case-config.tsx` совмещает типы, datasets, конфиги — нужно разделить
- StepChat и StepMimLua уже работают через `CASE_CONFIGS[slug]`, для сценария они становятся локальными копиями (или фабриками)
- `app/page.tsx` — 300 строк, содержит логику роутинга по step slugs, и лендинг со списком сценариев; роутинг остаётся, лендинг переезжает на `listScenarios()` из registry
Links (paths):
- components/step-chat.tsx:20 — точка входа `StepChat`, читает `CASE_CONFIGS[caseSlug]`
- components/step-mim-lua.tsx:14 — аналогично
- components/step-data-table.tsx:64 — три ветки через `isEmail/isThreads`
- components/step-processing.tsx:1262 — точка выбора `processNext` через `isEmail ? ... : isThreads ? ... : ...`
- lib/case-config.tsx:766 — большой `CASE_CONFIGS` объект
- app/page.tsx:91 — `PageContent` с роутингом и лендингом
