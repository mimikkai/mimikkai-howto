# Research

Updated: 2026-06-11 15:30
Status: active

## Active Summary (input for /aif-plan)
<!-- aif:active-summary:start -->
Topic: новый кейс «Отслеживание доставок в CRM» (crm-order-tracking)
Goal: добавить 4-й активный сценарий в интерактивное демо — ИИ-агент отслеживает доставки: заходит в CRM, берёт трек-номер, проверяет статус на сайте трекинга, обновляет CRM, отправляет уведомление клиенту (Telegram/Email/WhatsApp)
Constraints:
- Next.js App Router, Tailwind CSS v4, `prefers-reduced-motion` обязателен
- Модульная архитектура: `lib/cases/<slug>/` с index, config, data, steps/
- `createScheduler()` — shared, не дублировать
- `ScenarioDefinition<TData, TRow>` + `registerScenario()` в registry
- `import "@/lib/cases/crm-order-tracking"` в page.tsx
Decisions:
- slug: `crm-order-tracking`, icon: `📦`, title: «Отслеживание доставок в CRM»
- CRM — абстрактная самописная система (не Амос/Битрикс), левый сайдбар + карточка заказа
- Трекинг-сайт — абстрактный малоизвестный («TrackPost» или «Отслеживание-Доставок.рф»)
- 3 вкладки браузера: CRM → Трекинг → Мессенджер (канал зависит от клиента)
- Статусы: «ожидает» → «обработка» → «отслежено»
- Канал уведомления: Telegram (зелёный чат), Email (синий интерфейс), WhatsApp (зелёный с галочками)
- Дефолтные статусы CRM: обновляю статус сделки + ETA
- 30 заказов, 3 входных + 5 выходных колонок
Open questions:
- Название трекинг-сайта — «TrackPost» или «Отслеживание-Доставок.рф»?
- Название CRM — «DealFlow» / «SalesPipe» / просто «CRM Система»?
Success signals:
- Карточка появляется на лендинге, все 4 шага работают end-to-end
- Processing показывает 3 вкладки браузера с корректным переключением
- `pnpm typecheck` + `pnpm test` + `pnpm build` — чисто
Next step: `/aif-plan` — создать план реализации кейса
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
