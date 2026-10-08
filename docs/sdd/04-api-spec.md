# 04 進程內契約

沒有對外 REST，也沒有 `/api`。沒有 Firebase Callable。下面是 Mobile 進程裡的契約。

## BreathEngine

建構時接收 `BreathPattern`、這一輪時長（毫秒）、以及可替換的 `now()`。

- `start(now?)`
- `pause(now?)`
- `resume(now?)`
- `snapshot(now?)` → `BreathSnapshot`

`BreathSnapshot`：

- `phase`：`inhale` 或 `exhale`
- `progress`：此相位內 0 到 1
- `phaseRemainingMs`
- `sessionElapsedMs`
- `finished`
- `paused`

循環長度只用吸氣與吐氣。`holdAfterInhale`、`holdAfterExhale` 不產生相位。

## AudioEngine

由 Angular factory 提供單例。測試直接 `new AudioEngine(deps)`。

- `prime()`：同步建立 context 並呼叫 `resume()`
- `load(url)`
- `play(fadeMs = 1500)`：從 0 開始，先停掉既有 source，再淡入
- `pause()` / `resume()`：resume 不重做淡入
- `stop()`：立刻停止
- `fadeOut(ms = 1500)`：音量降到 0 後停止
- `setVolume(value)`：0 到 1，預設 0.8。畫面沒有音量控制
- `status`：`idle`、`playing`、`paused`

同一實例不得同時有兩個未停止的 source。

## VisualRenderer

- `mount(host)`
- `render({ phase, progress })`
- `destroy()`

`createVisualRenderer(preset, color)` 回傳光球、波或粒子。規模由 `breathAmount` 決定：吸氣 0.72→1，吐氣 1→0.72。不做 shader，不接音訊分析。

## 肯定句

`affirmationFrame(elapsedMs, sessionDurationMs, count)` 回傳 `{ index, opacity }`。`count` 為 0 時回傳 `null`。

## 呼吸提示

`breathCue(phase)` 只做對照，不發聲：

- `inhale` → `breath in`
- `exhale` → `breath out`
- `hold` → `hold`
- 其他 → `null`

`BreathCueSpeaker` 只在 `apps/mobile`。人聲預設關閉。「開啟人聲」的點擊直接 `speak` 目前相位。之後 `speak(phase)` 只在人聲開著且相位改變時呼叫。較新的一句會取代還沒說完的上一句。`stop()` 用於關閉人聲、暫停、離開與結束。底層是 `@capacitor-community/text-to-speech`，`lang` 為 `en-US`，`category` 為 `ambient`，`queueStrategy` 為 `Flush`。
