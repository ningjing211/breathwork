# 07 測試

本次只跑 `npm run test:unit`（Vitest，`tests/unit`）。不跑 E2E，也不為頁面另開 `ng test`。

## 必測

- BreathEngine：相位邊界、暫停後時間不增加、繼續後接上、滿 3 分鐘 `finished`、閉氣不插入相位、`seek` 後從新時間繼續、暫停中 `seek` 時間不跑。
- `breathAmount`：吸氣變大、吐氣變小。
- `breathCue`：吸氣 `breath in`、吐氣 `breath out`、`hold` 有對照但引擎不產生該相位。
- `affirmationFrame`：均分、淡化、句數為 0。
- AudioEngine：第二次 `play` 停掉第一個 source、暫停後的 offset、`stop`、`fadeOut`、6 秒循環對 180 秒取餘數。
- catalog：四個預設、各 6 句、時長與呼吸與規格一致。
- `apps/web/src` 不含 `@ionic/`、`@capacitor/`、`pixi.js`、`tone`。

## 不在單元測試裡

Pixi 的 WebGL 生命週期。以瀏覽器走播放頁、確認離開後 canvas 移除來補。

3 分鐘自然結束由 BreathEngine 的 `finished` 覆蓋。瀏覽器驗收不需坐滿 3 分鐘。

## 建置

- `npm run build:web` 產物在 `dist/apps/web/browser/index.html`
- `npm run build:mobile` 產物在 `www/index.html`
