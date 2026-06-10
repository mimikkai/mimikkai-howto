# Implementation Plan: Кейс «Email рассылка»

Branch: none
Created: 2026-06-10

## Settings
- Testing: no
- Logging: standard
- Docs: no

## Context
Добавить интерактивный демо-кейс «Email рассылка» — третий доступный сценарий. Агент ищет компании в заданной сфере через Яндекс, изучает сайт, находит email, генерирует 4 персонализированных холодных письма и отправляет первое через SMTP (MCP Mail). Основан на реальном mim.lua из `C:\Users\dealenx\Downloads\Поиск клиентов и генерация холодных писем _ MimikkAi\mim.lua`.

Ключевые решения из исследования:
- Таблица: 30 строк, видимые колонки A(Сфера), B(От кого), D(Компания), E(Сайт), F(Почта), I(Статус). Клик по строке → модалка со всеми 12 колонками A-L.
- Обработка: имитация Яндекс → сайт компании → контакты → письмо → SMTP отправка → подтверждение.

## Commit Plan
- **Commit 1** (after tasks 1-2): "feat: add email-outreach case config and seed data"
- **Commit 2** (after tasks 3-5): "feat: add email-outreach flow to step components"

## Tasks

### Phase 1: Конфигурация и данные
- [x] Task 1: Добавить конфигурацию email-outreach в `lib/case-config.tsx`. В CASE_CONFIGS добавить ключ "email-outreach" с: chat (greeting, presetPrompt="Я хочу ИИ-агента для email-рассылки компаниям", presetPromptDesc, assistantResponse — описание агента: поиск компаний → изучение сайта → email → 4 письма → отправка через SMTP), mimLua (inputColumns: A-Сфера, B-От кого, C-Кейс; outputColumns: D-Компания, E-Сайт, F-Почта, G-Телефон, H-Письмо 1, I-Статус, J-Письмо 2, K-Письмо 3, L-Письмо 4; promptSteps: 7 шагов — открыть Яндекс, найти компанию, проверить уникальность, изучить сайт, найти контакты, сгенерировать письма, отправить письмо; agentTitle="Email рассылка", agentDesc, promptIntro), dataTable (12 колонок A-L: A-input, B-input, C-input, остальные output; description, fillButtonText, empty*). Добавить интерфейс/тип для email-строк при необходимости.
  - Files: `lib/case-config.tsx`

- [x] Task 2: Сгенерировать 30 строк seed-данных для email-outreach в `lib/case-config.tsx`. Массив EMAIL_CONTACTS с объектами: {id, sphere, senderName, caseUsed, company, site, email, phone, letter1, sendStatus, letter2, letter3, letter4}. 30 реалистичных российских компаний из разных сфер (Финансы, Потребительские товары, Автопром, Фарма, Юридические услуги, Медицинские услуги, Туризм, Образование, SMM, Маркетинг). Письма — короткие персонализированные тексты по шаблону из mim.lua. Статус: «ожидает».
  - Files: `lib/case-config.tsx`

### Phase 2: Ветвление Step-компонентов
- [x] Task 3: Обновить `app/page.tsx` — установить `available: true` для email-outreach. Остальное не трогать (caseSlug уже пробрасывается).
  - Files: `app/page.tsx`

- [ ] Task 4: Обновить `components/step-data-table.tsx` — добавить ветвление для email-outreach. Новый интерфейс EmailDataRow, флаг `isEmail = caseSlug === "email-outreach"`. Визуальные колонки таблицы: A(Сфера), B(От кого), D(Компания), E(Сайт), F(Почта), I(Статус) — остальные скрыть через responsive classes. HandleFillData: заполнять из EMAIL_CONTACTS. Модалка по клику на строку: Dialog со всеми 12 колонками A-L, специальный рендер: E(Сайт) как ссылка, H/J/K/L(Письма) — truncate с expand, I(Статус) — badge. Статусы: «ожидает» (серый), «отправлено» (зелёный), «ошибка» (красный).
  - Files: `components/step-data-table.tsx`

- [ ] Task 5: Обновить `components/step-processing.tsx` — добавить полный цикл имитации для email-outreach. Новые BrowserPhase значения: email_yandex_home, email_yandex_typing, email_yandex_results, email_company_click, email_company_site, email_contacts_page, email_found, email_compose, email_send_click, email_sent_confirmed. Новая функция processNextEmail. UI фаз: Яндекс (поиск по сфере) → карточки результатов поиска с названиями компаний → сайт компании (логотип, описание, контакты) → найденный email → почтовый клиент (поле To, Subject, тело письма, кнопка Отправить) → подтверждение отправки. Таблица в processing: те же 6 видимых колонок + Dialog по клику. Chat-сообщения: «Начинаю поиск компании в сфере X», «Изучаю сайт компании», «Найден email: ...», «Генерирую персонализированное письмо», «Письмо отправлено и сохранено».
  - Files: `components/step-processing.tsx`