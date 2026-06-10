# Implementation Plan: Кейс «Отслеживание доставок в CRM»

Branch: none
Created: 2026-06-11

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Research Context
Source: `.ai-factory/RESEARCH.md` (Active Summary)

Topic: новый кейс `crm-order-tracking` — ИИ-агент отслеживает доставки: заходит в CRM, берёт трек-номер, проверяет статус на сайте трекинга, обновляет CRM, отправляет уведомление клиенту (Telegram/Email/WhatsApp)
Goal: добавить 4-й активный сценарий в интерактивное демо
Constraints:
- Модульная архитектура: `lib/cases/<slug>/` с index, config, data, steps/
- `createScheduler()` — shared, не дублировать
- `ScenarioDefinition<TData, TRow>` + `registerScenario()` в registry
- `import "@/lib/cases/crm-order-tracking"` в page.tsx
- `prefers-reduced-motion` обязателен для всех анимаций
Decisions:
- slug: `crm-order-tracking`, icon: `📦`, title: «Отслеживание доставок в CRM»
- CRM — абстрактная «CRM Система» (левый сайдбар + карточка заказа)
- Трекинг-сайт — «Отслеживание-Доставок.рф»
- 3 вкладки браузера: CRM → Трекинг → Мессенджер (канал зависит от клиента)
- Статусы: «ожидает» → «обрабатывается» → «отслежено»
- Канал уведомления: Telegram / Email / WhatsApp

## Commit Plan
- **Commit 1** (после задач 1-5): `feat: add crm-order-tracking scenario`

## Tasks

### Phase 1: Данные и конфигурация

- [ ] Task 1: Создать `lib/cases/crm-order-tracking/data.ts` — интерфейс `CrmOrder` и массив `CRM_ORDERS` (30 заказов). Поля: id, client (клиент), city (город), product (товар), orderNumber (номер заказа), trackNumber (трек-номер), notifyChannel ("telegram" | "email" | "whatsapp"), deliveryStatus (статус доставки: "Принят"/"Сортировка"/"В пути"/"Доставка"), eta (ETA дата), trackingSteps (массив шагов трекинга: {status, date, city}). 30 реалистичных российских B2B-клиентов из разных городов (Москва, Тула, Новосибирск, Екатеринбург, Казань, Краснодар и т.д.), товары — офисная техника и оборудование, каналы уведомления — смесь telegram/email/whatsapp.
  - Files: `lib/cases/crm-order-tracking/data.ts`
  - **LOGGING:** `console.debug('[crm-order-tracking:data] loaded', { count: CRM_ORDERS.length })`

- [ ] Task 2: Создать `lib/cases/crm-order-tracking/config.ts` — CaseConfig для crm-order-tracking. Chat: presetPrompt="Я хочу ИИ-агента для отслеживания доставок в CRM", presetPromptDesc="Агент проверяет статус доставки, обновляет CRM и уведомляет клиента", assistantResponse (описание: открыть CRM → найти заказ → скопировать трек → проверить на сайте трекинга → обновить CRM → уведомить клиента). MimLua: inputColumns A(Клиент)/B(Город)/C(Товар), outputColumns D(Заказ №)/E(Трек-номер)/F(Статус доставки)/G(ETA)/H(Уведомление). promptSteps: 8 шагов (открыть CRM → найти заказ → скопировать трек → открыть трекинг → ввести трек → обновить CRM → отправить уведомление → записать результат). agentTitle="Отслеживание доставок", agentDesc, promptIntro. DataTable: 8 колонок A-H (3 input + 5 output), description, fillButtonText, empty*.
  - Files: `lib/cases/crm-order-tracking/config.ts`
  - **LOGGING:** отсутствует (статический конфиг)

### Phase 2: Компоненты шагов

- [ ] Task 3: Создать `lib/cases/crm-order-tracking/steps/StepChat.tsx` — копия email-outreach/threads-comments версий с заменой import config на локальный. Иконка preset-кнопки: `📦`.
  - Files: `lib/cases/crm-order-tracking/steps/StepChat.tsx`
  - **LOGGING:** `console.debug('[crm-order-tracking:chat] render')`

- [ ] Task 4: Создать `lib/cases/crm-order-tracking/steps/StepMimLua.tsx` — копия с заменой import config на локальный.
  - Files: `lib/cases/crm-order-tracking/steps/StepMimLua.tsx`
  - **LOGGING:** `console.debug('[crm-order-tracking:mimlua] render')`

- [ ] Task 5: Создать `lib/cases/crm-order-tracking/steps/StepDataTable.tsx` — CrmOrderRow extends BaseRow с полями: client, city, product, orderNumber, trackNumber, deliveryStatus, eta, notifyChannel. Экспортировать `toCrmOrderRow`. Локальный `crmStatusColor`. Видимые колонки: A(Клиент), C(Товар), F(Статус), G(ETA), H(Уведомление). Dialog со всеми 8 колонками. Статусы: «ожидает» (серый), «обрабатывается» (amber), «отслежено» (emerald). Канал уведомления: иконка + текст (📱 Telegram / 📧 Email / 💬 WhatsApp).
  - Files: `lib/cases/crm-order-tracking/steps/StepDataTable.tsx`
  - **LOGGING:** `console.debug('[crm-order-tracking:datatable] render', { rowCount, selectedRow })`, `console.debug('[crm-order-tracking:datatable] fillData', { count })`

### Phase 3: StepProcessing — эмуляция браузера

- [ ] Task 6: Создать `lib/cases/crm-order-tracking/steps/StepProcessing.tsx` — главный файл эмуляции. LocalPhase: idle, crm_dashboard, crm_order_open, crm_copy_track, tracking_home, tracking_typing, tracking_results, crm_update_status, crm_notify_sent, writing. PHASE_TO_NORMALIZED маппинг. BrowserState с 3 вкладками (CRM Система / Отслеживание-Доставок.рф / Мессенджер). Использовать `createScheduler()`. Processing flow (один заказ, ~16.5с): t=0 переключение на чат → t=400 очистка чата → t=700 подсветка строки, статус «обрабатывается» → t=2000 браузер вкладка CRM (дашборд со списком сделок) → t=3500 карточка заказа (клиент, товар, трек-номер) → t=5500 копирование трека → t=7000 браузер вкладка Трекинг (поле ввода) → t=7500 typing трек-номера → t=9000 результат трекинга (шаги: принят/сортировка/в пути/доставка, ETA) → t=11500 возврат в CRM, обновление статуса → t=13500 вкладка Мессенджер (Telegram/Email/WhatsApp в зависимости от notifyChannel) → t=15000 уведомление отправлено → t=16500 обновление таблицы. Таблица в processing: A(Клиент), F(Статус), G(ETA), H(Уведомление). Dialog по клику.
  - Files: `lib/cases/crm-order-tracking/steps/StepProcessing.tsx`
  - **LOGGING:** `console.debug('[crm-order-tracking:processing] phase', { phase, normalized, rowIndex })` на каждом фазовом переходе; `console.info('[crm-order-tracking:processing] row done', { rowIndex, client, trackNumber })` по завершении строки; `console.debug('[crm-order-tracking:processing] scheduler', { action, runId })` на schedule/cancel

### Phase 4: Регистрация и подключение

- [ ] Task 7: Создать `lib/cases/crm-order-tracking/index.ts` — экспорт `ScenarioDefinition<CrmOrder, CrmOrderRow>` + `registerScenario("crm-order-tracking", ...)`. Добавить `import "@/lib/cases/crm-order-tracking"` в `app/page.tsx`.
  - Files: `lib/cases/crm-order-tracking/index.ts`, `app/page.tsx`
  - **LOGGING:** через registry при module init

## Ключевые моменты реализации

### BrowserPhase нормализация (Task 6)
```
idle                → idle
crm_dashboard       → loading
crm_order_open      → detail
crm_copy_track      → loading
tracking_home       → idle
tracking_typing     → typing
tracking_results    → results
crm_update_status   → form
crm_notify_sent     → done
writing             → writing
```

### 3 вкладки браузера
- **CRM Система** — абстрактный интерфейс: левый мини-сайдбар (Сделки/Контакты/Настройки), дашборд со списком сделок, карточка заказа
- **Отслеживание-Доставок.рф** — поле ввода трек-номера + результат (шаги доставки + ETA)
- **Мессенджер** — переключается: Telegram (зелёный чат-пузырь), Email (синий интерфейс письма), WhatsApp (зелёный с галочками)

### Канал уведомления (Task 6)
Каждый заказ имеет `notifyChannel`: "telegram" | "email" | "whatsapp". Третья вкладка браузера показывает соответствующий интерфейс:
- Telegram: аватарка + имя + чат-пузырь «Ваш заказ #N в пути. Прибытие ~DATE, г. CITY. Трек: TRACK»
- Email: To/Subject/Body + кнопка «Отправить»
- WhatsApp: аватарка + имя + сообщение + галочки ✓✓

### Scheduler (Task 6)
Использовать shared `createScheduler()` из `lib/cases/scheduler.ts`:
- `scheduler.schedule()` вместо `setTimeout`
- `scheduler.tweenProgress()` для прогресс-бара
- `scheduler.cancelAll()` при pause/unmount
- `scheduler.nextRunId()` / `scheduler.isStale(runId)` для stale-run защиты

### ContentEnter анимация
Уже реализована в `app/globals.css` (`.content-animate-in`). Применить `key={browser.phase}` + `content-animate-in` на content container в StepProcessing.