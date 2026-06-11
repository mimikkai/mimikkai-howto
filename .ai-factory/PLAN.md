# Implementation Plan: Кейс «Заполнение карточек товаров для маркетплейса»

Branch: none
Created: 2026-06-11

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Research Context
Source: `.ai-factory/RESEARCH.md` (Active Summary)

Topic: новый кейс «Заполнение карточек товаров для маркетплейсов» (marketplace-card-fill)
Goal: ИИ-агент берёт наименование+артикул, ищет товар на сайте поставщика TechSupply.ru, собирает характеристики, заполняет сложную карточку Ozon (select/number/textarea/tags), перепроверяет и отправляет
Constraints:
- Модульная архитектура: `lib/cases/<slug>/` с index, config, data, steps/
- `createScheduler()` — shared, не дублировать
- `ScenarioDefinition<TData, TRow>` + `registerScenario()` в registry
- `prefers-reduced-motion` обязателен для всех анимаций
Decisions:
- slug: `marketplace-card-fill`, icon: `🛒`, title: «Заполнение карточек на маркетплейсе»
- Маркетплейс: Ozon (реальный), сайт поставщика: абстрактный «TechSupply.ru»
- 2 вкладки браузера: TechSupply.ru + Ozon Seller
- Вход: 2 колонки (A: Наименование, B: Артикул), Выход: 18 колонок (C-T)
- 30 товаров: электроника/офисная техника
- 12 LocalPhase: idle, supplier_home, supplier_product, supplier_copy, ozon_card, ozon_fill_basic, ozon_fill_category, ozon_fill_attrs, ozon_fill_keywords, ozon_review, ozon_submitted, writing
- Киллер-фича: визуализация select-полей + этап ozon_review

## Commit Plan
- **Commit 1** (после задач 1-5): `feat: add marketplace-card-fill scenario`

## Tasks

### Phase 1: Данные и конфигурация

- [x] Task 1: Создать `lib/cases/marketplace-card-fill/data.ts` — интерфейс `MarketplaceProduct` и массив `MARKETPLACE_PRODUCTS` (30 товаров). Поля: id, name, article, exactName, category, subcategory, brand, description, country, weightKg, lengthCm, widthCm, heightCm, color, material, model, keywords (string[]), photoUrls (string[]), equipment, warranty, ageCategory. 30 реалистичных товаров (ноутбуки, мониторы, МФУ, клавиатуры, мыши, наушники, веб-камеры, роутеры, ИБП, планшеты, телефоны, проекторы, сканеры, док-станции, серверы, ИП-камеры, кресла, стойки, принтеры, микрофоны, акустика, кабели, сумки, зарядки, хабы, моноблоки, плоттеры, уничтожители, детекторы). Категории: Электроника (Ноутбуки, Мониторы, Периферия), Офисное оборудование (Принтеры, ИБП, Проекторы), Сетевое оборудование (Роутеры, Камеры), Мебель (Кресла, Стойки).
  - Files: `lib/cases/marketplace-card-fill/data.ts`
  - **LOGGING:** `console.debug('[marketplace-card-fill:data] loaded', { count: MARKETPLACE_PRODUCTS.length })`

- [x] Task 2: Создать `lib/cases/marketplace-card-fill/config.ts` — CaseConfig для marketplace-card-fill. Chat: presetPrompt="Я хочу ИИ-агента для заполнения карточек товаров на Ozon", presetPromptDesc="Агент ищет информацию на сайте поставщика и заполняет карточку товара на маркетплейсе", assistantResponse (описание: взять наименование+артикул → найти на сайте поставщика → собрать характеристики → заполнить карточку Ozon → перепроверить → отправить). MimLua: inputColumns A(Наименование)/B(Артикул), outputColumns C-T (18 колонок). promptSteps: 9 шагов. DataTable: 20 колонок A-T (2 input + 18 output).
  - Files: `lib/cases/marketplace-card-fill/config.ts`
  - **LOGGING:** отсутствует (статический конфиг)

### Phase 2: Компоненты шагов

- [x] Task 3: Создать `lib/cases/marketplace-card-fill/steps/StepChat.tsx` — копия с заменой import config на локальный. Иконка preset-кнопки: `🛒`.
  - Files: `lib/cases/marketplace-card-fill/steps/StepChat.tsx`
  - **LOGGING:** `console.debug('[marketplace-card-fill:chat] render')`

- [x] Task 4: Создать `lib/cases/marketplace-card-fill/steps/StepMimLua.tsx` — копия с заменой import config на локальный.
  - Files: `lib/cases/marketplace-card-fill/steps/StepMimLua.tsx`
  - **LOGGING:** `console.debug('[marketplace-card-fill:mimlua] render')`

- [x] Task 5: Создать `lib/cases/marketplace-card-fill/steps/StepDataTable.tsx` — MarketplaceProductRow extends BaseRow с 20 полями. Экспортировать `toMarketplaceProductRow`. Локальный `fillStatusColor`. Видимые колонки: A(Наименование), C(Точное название), D(Категория), E(Бренд), T(Статус). Dialog со всеми 20 колонками. Статусы: «ожидает» (серый), «обрабатывается» (amber), «заполнено» (emerald). Специальные колонки: D — категория с подкатегорией, L — цвет badge, O — теги как badge, P — фото ссылки, T — статус badge.
  - Files: `lib/cases/marketplace-card-fill/steps/StepDataTable.tsx`
  - **LOGGING:** `console.debug('[marketplace-card-fill:datatable] render', { rowCount, selectedRow })`, `console.debug('[marketplace-card-fill:datatable] fillData', { count })`

### Phase 3: StepProcessing — эмуляция браузера

- [x] Task 6: Создать `lib/cases/marketplace-card-fill/steps/StepProcessing.tsx` — главный файл эмуляции. LocalPhase: idle, supplier_home, supplier_product, supplier_copy, ozon_card, ozon_fill_basic, ozon_fill_category, ozon_fill_attrs, ozon_fill_keywords, ozon_review, ozon_submitted, writing. PHASE_TO_NORMALIZED маппинг. BrowserState с 2 вкладками (TechSupply.ru / Ozon Seller). Использовать `createScheduler()`. Processing flow (один товар, ~19с): t=0 чат очистка → t=700 подсветка строки, статус «обрабатывается» → t=2000 вкладка TechSupply.ru (поиск по артикулу) → t=4000 карточка товара (характеристики, фото, описание) → t=6000 копирование данных → t=8000 вкладка Ozon (пустая форма карточки) → t=9000 заполнение базовых полей (название typing, бренд, описание typing) → t=10500 заполнение категории: select-поле с выпадающим списком (Категория ▼ → Электроника, Подкатегория ▼ → Ноутбуки) → t=12000 заполнение атрибутов (вес, размеры, цвет select, страна select, материал, модель, гарантия select, возрастная категория select) → t=14000 ключевые слова (tags), фото (ссылки), комплектация → t=15500 ozon_review: перепроверка всех 18 полей с зелёными галочками ✓ → t=17500 ozon_submitted: карточка отправлена на модерацию → t=19000 обновление таблицы.
  - Files: `lib/cases/marketplace-card-fill/steps/StepProcessing.tsx`
  - **LOGGING:** `console.debug('[marketplace-card-fill:processing] phase', { phase, normalized, rowIndex })` на каждом фазовом переходе; `console.info('[marketplace-card-fill:processing] row done', { rowIndex, name, article })` по завершении строки; `console.debug('[marketplace-card-fill:processing] scheduler', { action, runId })` на schedule/cancel

### Phase 4: Регистрация и подключение

- [x] Task 7: Создать `lib/cases/marketplace-card-fill/index.ts` — экспорт `ScenarioDefinition<MarketplaceProduct, MarketplaceProductRow>` + `registerScenario("marketplace-card-fill", ...)`. Добавить `import "@/lib/cases/marketplace-card-fill"` в `app/page.tsx`.
  - Files: `lib/cases/marketplace-card-fill/index.ts`, `app/page.tsx`
  - **LOGGING:** через registry при module init

## Ключевые моменты реализации

### BrowserPhase нормализация (Task 6)
```
idle                → idle
supplier_home       → idle
supplier_product    → detail
supplier_copy       → loading
ozon_card           → form
ozon_fill_basic     → form
ozon_fill_category  → form
ozon_fill_attrs     → form
ozon_fill_keywords  → form
ozon_review         → detail
ozon_submitted      → done
writing             → writing
```

### 2 вкладки браузера
- **TechSupply.ru** — карточка товара: название, фото, описание, характеристики (таблица спецификаций)
- **Ozon Seller** — форма карточки: текстовые поля, select-выпадаки, числовые поля, textarea, tags input, фото-ссылки

### Select-поля Ozon (Task 6 — киллер-фича)
Визуализация select с открытием списка и выбором:
- Категория: выпадающий список → выбор «Электроника»
- Подкатегория: зависимый select → выбор «Ноутбуки»
- Цвет: multi-select → выбор цвета
- Страна: select → выбор «Китай» / «Россия» / «Тайвань»
- Гарантия: select → «6 месяцев» / «12 месяцев» / «24 месяца»
- Возрастная категория: select → «0+» / «6+» / «12+» / «16+»

### ozon_review — перепроверка (Task 6)
Аналог messenger_review в crm-order-tracking:
- Жёлтая рамка, иконка 🔍
- Список всех 18 полей с зелёными галочками ✓
- Каждый пункт: ✓ Название: ... ✓ Категория: ... ✓ Вес: ... и т.д.
- Итог: «✅ Все поля заполнены корректно, отправляю карточку»

### ContentEnter анимация
Уже реализована в `app/globals.css` (`.content-animate-in`). Применить `key={browser.phase}` + `content-animate-in` на content container в StepProcessing.