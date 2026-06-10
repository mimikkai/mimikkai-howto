# Fix Plan: Прогресс-бар в эмуляторе браузера не анимируется

**Problem:** Когда в эмуляторе браузера идёт загрузка (например, ввод запроса → загрузка результатов Google, загрузка маркетплейса, загрузка Threads), горизонтальный прогресс-бар `h-1 bg-muted → fill` не анимирует ширину плавно — он либо не виден, либо мгновенно прыгает на 100%.

**Created:** 2026-06-10 22:50

## Analysis

### Что нашлось

Анализ `lib/cases/price-search/steps/StepProcessing.tsx` (актуальный код для сценария price-search) и его legacy-аналога `components/step-processing.tsx` показал:

1. **CSS-transition на месте.** Inner fill у прогресс-баров имеет классы `transition-all duration-300` (price-search: `StepProcessing.tsx:933`, `:986`) — то есть `width` формально должен анимироваться через CSS.

2. **Значение `browser.loadingProgress` обновляется дискретными прыжками.** В `schedule()`-цепочке цены 0 → 30 → 100 для Google-фазы и 15 → 50 → 80 → 100 для маркетплейса (`StepProcessing.tsx:392, 402, 447, 452, 461` и т.д.). Нет ни setInterval, ни requestAnimationFrame, которые бы сглаживали переходы между этими точками. Между `30%` и `100%` CSS-transition видел бы только два значения подряд (например, на 3500 мс и 5000 мс) и анимировал переход за 300 мс.

3. **Stale-timer race в `schedule()`.** Хелпер (`price-search:StepProcessing.tsx:302-305`):
   ```ts
   const schedule = (fn: () => void, ms: number) =>
     setTimeout(() => {
       if (isRunningRef.current) fn()
     }, ms)
   ```
   - Не хранит id таймеров.
   - При паузе (`handlePause` → `isRunningRef.current = false`) уже запланированные таймеры остаются живыми.
   - При resume `handleStart` запускает **второй** `processNext`, который ставит **вторую волну** таймеров.
   - Старая волна таймеров при возобновлении re-check'ит `isRunningRef.current` (теперь `true`) и **срабатывает** — пишет `loadingProgress = 100` сразу после resume, до того как новая волна успеет поставить `0 → 30`. CSS-transition видит `0 → 100` за один цикл рендера, анимация не видна.

4. **То же в `lib/cases/threads-comments/steps/StepProcessing.tsx:200-203`** (идентичный `schedule()`) и в legacy `components/step-processing.tsx:420-423`.

5. **Аналогичная проблема с `setInterval` для typing-анимации** (`price-search:StepProcessing.tsx:364-375`, `threads-comments:StepProcessing.tsx:260-271, 336-348`) — интервал создаётся, но не сохраняется в ref. После resume старый interval может продолжать писать в `browser.typedQuery` или `browser.threadsTypedComment` параллельно с новым, вызывая рывки и рассинхрон.

6. **Другие анимации не страдают** — они на CSS keyframes (`animate-pulse`, `animate-bounce`) или коротких boolean-flash (`urlFlash`, `tableFlash`). Они не зависят от планировщика и работают.

### Корневая причина

`schedule()` не трекает и не очищает свои таймеры. При паузе/возобновлении, или при перерендере с новой итерацией, старые `setTimeout` и `setInterval` остаются активными и пишут в state параллельно с новыми, вызывая:

- гонку `loadingProgress` (может прыгнуть на 100 за один update — анимация не видна),
- гонку `setBrowser` (несколько волн мерцают страницу),
- гонку typing-интервалов (старый интервал продолжает писать в `typedQuery`, новый стартует с нуля).

В дополнение к этому, между дискретными точками `loadingProgress` нет сглаживающего интерполятора, поэтому даже без race CSS-transition показывает только два прыжка (например, 30%→100% за 300 мс в конце), а не плавный рост по всему ходу фазы.

### Затронутые файлы

- `lib/cases/price-search/steps/StepProcessing.tsx` — primary (price-search это сценарий "search")
- `lib/cases/threads-comments/steps/StepProcessing.tsx` — те же баги (mirror)
- `components/step-processing.tsx` (legacy) — будет удалён в Phase 5 рефакторинга, чинить не обязательно, но симметричный fix не помешает

## Fix Steps

1. **Ввести tracking таймеров в `schedule()`** — заменить helper на версию, которая хранит id в `Set<number>` (или в `useRef<NodeJS.Timeout[]>`), и добавить функцию `cancelAllScheduled()` для очистки всех. Вызывать `cancelAllScheduled()` в `handlePause()` и в начале `processNext()` (на случай если остаточные таймеры предыдущей итерации ещё живы — например, при автоматическом переходе к следующей строке).

2. **Tracking typing-интервалов** — текущий `setInterval` для typing-анимации вводить локально и сохранять id в общий tracker (`scheduledTimers`/`scheduledIntervals`). Очищать вместе с `schedule`-таймерами.

3. **Плавная интерполяция `loadingProgress`** — добавить helper `tweenProgress(from: number, to: number, durationMs: number, onUpdate: (v: number) => void, onDone?: () => void)` на базе `requestAnimationFrame`. Использовать его в `schedule()` для плавного перехода между точками `0 → 30`, `30 → 100`, `15 → 50` и т.д. Когда целевая точка достигнута, выполнить следующее `schedule`-задание (например, смену фазы). Это даст CSS-transition видимые промежуточные значения и реально плавную анимацию.

4. **Защита `processNext` от параллельного запуска** — добавить `runIdRef` (инкремент на каждый вызов `processNext`). Внутри `setTimeout`-колбэков проверять `if (runIdRef.current !== myRunId) return` перед `setBrowser`. Это страховка от stale callbacks: даже если таймер не был очищен, его запись проигнорируется, потому что `runId` уже не совпадает.

5. **Применить тот же фикс к `lib/cases/threads-comments/steps/StepProcessing.tsx`** — симметрично, чтобы не было регрессии.

6. **Logging** — добавить `[step-processing:scheduler]` debug-логи в `schedule()`, `cancelAllScheduled()`, начале `processNext` с `{ runId, queued }` и в `tweenProgress` финальном `onDone` с `{ from, to, durationMs }`. Префикс сценария (`[price-search:processing]` / `[threads-comments:processing]`) оставить для фазовых логов, scheduler-логи пусть будут под общим префиксом `[scheduler]`.

## Files to Modify

- `lib/cases/price-search/steps/StepProcessing.tsx` — основной фикс
- `lib/cases/threads-comments/steps/StepProcessing.tsx` — зеркальный фикс
- (опционально) `components/step-processing.tsx` — legacy, будет удалён в Phase 5

## Risks & Considerations

- **`requestAnimationFrame` в тестах** — tweening зависит от raf, который не вызывается в node:test. Тесты на toRow уже не задевают это, но если в будущем добавится render-тест на `StepProcessing`, нужно мокать raf или использовать `vi.useFakeTimers` / `node:test`'s mock timers.
- **Пауза/возобновление в середине tween** — если пользователь жмёт паузу во время плавного перехода `30 → 100`, текущий raf нужно прервать. `cancelAllScheduled()` уже это сделает, если `tweenProgress` отменяется через тот же механизм. Альтернатива: держать id raf-а в `scheduledTimers` и при `cancelAnimationFrame(id)` чистить.
- **Длительность tween-а** — нужно выбирать так, чтобы сумма длительностей всех tween'ов в фазе была ≤ реального тайминга schedule. Например, фаза Google: `0 → 30` за 800 мс, потом `30 → 100` за 1200 мс — итого 2000 мс (между 3500 и 5000 мс schedule есть запас).
- **При паузе-возобновлении** — после очистки таймеров и обнуления `loadingProgress = 0` (или сохранения текущего значения) процесс корректно рестартует.

## Test Coverage

- Unit-тест на новый helper `tweenProgress`: при `from=0, to=100, duration=1000` и фиктивном `requestAnimationFrame` (мокать через явный `setTimeout` или передачу raf-callback'а параметром), значения на каждом фрейме должны идти от 0 к 100 монотонно.
- Unit-тест на `cancelAllScheduled`: до вызова ставим N таймеров, вызываем cancel, проверяем что колбэки не вызвались (`setTimeout` с `vi.useFakeTimers` или `node:test` mock).
- Существующие `toPriceRow`/`toThreadsRow` тесты не должны сломаться (т.к. фикс в StepProcessing, не в StepDataTable).
- Опционально: render-smoke (требует testing-library) — при mount `StepProcessing` и trigger `handleStart` после `BATCH_DELAY_MS` * N проверить что `browser.loadingProgress` пробежал через промежуточные значения, а не сразу 100.

## Out of Scope

- Переписывание `schedule()` на очередь с приоритетами — избыточно для текущей задачи.
- Удаление legacy `components/step-processing.tsx` — это Phase 5 рефакторинга, не fix-bug.
- Дополнительная анимация fill через `@keyframes` (keyframes progress-bar) — оверкилл, CSS transition достаточен после tween-интерполяции.
