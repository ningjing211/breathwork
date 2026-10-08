# 03 架構

## 技術棧

本機 Node 是 24.13。Angular CLI 22 要求 Node `^22.22.3 || ^24.15.0 || >=26`，所以鎖定能在這台機器上跑的最新 Angular 21。

| 套件 | 版本 | 原因 |
| --- | --- | --- |
| Angular | 21.2 | 兩個 App 的 monorepo |
| Ionic | 9.0 | 只給 Mobile 的殼與捲動 |
| Capacitor | 8.5 | `webDir: 'www'` |
| PixiJS | 8.22 | 播放視覺。只由 Mobile 引用 |
| Vitest | 4.1 | 與 `@angular/build` 的 peer 一致。不安 Vitest 5 |
| Web Audio API | 瀏覽器內建 | 單一音樂層。不安 Tone.js |

`capacitor.config.ts`：`appId` 為 `app.breathwork.mobile`，`appName` 為 `Breathwork`，`webDir` 為 `www`。

不使用 `IonicRouteStrategy`，也不使用 `ion-router-outlet`。Ionic 的路由堆疊會留住上一頁，並把新頁設成 `pointer-events: none`。外殼是 `ion-app` 裡的 Angular `router-outlet`，離開播放頁才會銷毀元件、停音、釋放 Pixi。

## 目錄邊界

| 路徑 | 誰能用 | 放什麼 |
| --- | --- | --- |
| `shared/contracts` | Web、Mobile、未來的 Functions | 純型別。不引用 Angular、Ionic、Pixi、Firebase |
| `shared/frontend/styles` | Web、Mobile | 色彩 token |
| `apps/mobile/src/app/features` | Mobile | 四個畫面與路由 |
| `apps/mobile/src/app/core` | Mobile | BreathEngine、AudioEngine、VisualRenderer |
| `apps/mobile/src/app/data` | Mobile | mock catalog、記憶體中的這一輪 |
| `apps/web` | 瀏覽器殼 | 一頁說明 |
| `tests/unit` | Vitest | 純邏輯 |

Functions 本次不存在。存在之後也只能引用 `shared/contracts`。

別名：`@app/contracts` → `shared/contracts/index.ts`，`@app/frontend/*` → `shared/frontend/*`。

## 輸出

- `npm run build:web` → `dist/apps/web/browser`
- `npm run build:mobile` → `www/`
- `www/` 是產物，不手改、不進 git

## 播放怎麼分工

Player 只協調。呼吸用 BreathEngine，音樂用 AudioEngine，英文呼吸提示用 BreathCueSpeaker，畫面用 VisualRenderer。三個時鐘不各走各的：Player 用一個 `requestAnimationFrame` 讀 BreathEngine 的 snapshot，再把相位交給視覺與語音。音樂與人聲都預設關閉。人聲開啟後才在相位改變時說一次。音樂開啟後才淡入；關閉、暫停、離開、結束時停止。暫停只暫停已經開著的音樂。

Pixi 的 ticker 不自動跑。Player 呼叫 `render` 時才畫，並在 Angular zone 外面跑動畫迴圈。

「開啟音樂」在點擊當下同步 `prime()`，建立並恢復 AudioContext，然後才載入與播放。這是為了 iOS 的使用者手勢限制。
