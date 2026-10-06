# 01 願景與平台範圍

長期可以變成可組合的 Breathwork Experience Player：呼吸型態、音樂、口白或文字、視覺分開疊。MVP 不預做這些層，只把播放器的邊界留在三個引擎上。

## 平台

| 表面 | 本次 |
| --- | --- |
| Mobile（`apps/mobile`，iOS／Android 共用這一個 Angular build） | 首頁、調整、播放、完成 |
| Web（`apps/web`） | 只有一頁：「此體驗請用 Mobile」 |
| Cloud Functions、Firebase | 不接 |

先以 iPhone 寬度為準。文案用繁體中文。畫面像一張暗色唱片封套，不像診療室或通用身心靈模板。

Web 不載入 Ionic、Capacitor、PixiJS、音訊引擎。
