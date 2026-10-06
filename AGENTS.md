# AGENTS.md

規格是唯一權威：`docs/prd/PRD.md` 與 `docs/sdd/`。不要用現有程式反推需求。

## 流程

改執行邏輯之前先做 Spec Check：範圍、Acceptance Criteria、資料模型、進程內契約、UI 狀態、測試都能對上。對不上就停，不要自己補需求。

只有改執行邏輯才建 `tasks/*.md`。改 PRD、SDD、README 不用建 task。`tasks/*.md` 不進 git；只提交 `tasks/README.md`。

一次只做本次 AC。不為之後的功能預留欄位、抽象或空套件。

## 硬限制

- 未獲確認，不改 PRD／SDD、不加欄位、不加流程。
- Functions 不得 import `shared/frontend`。Functions 只能看 `shared/contracts`。
- Web build 不得輸出到 `www/`。不得手寫 `www/`。
- `apps/web` 不得引用 Ionic、Capacitor、PixiJS、Tone。
- 不得新增對外 REST `/api`。
- 播放器的呼吸、音訊、視覺分別留在三個引擎，不要寫進元件裡。

## 做完要回報

實作結果、測試、沒覆蓋到的風險、與規格不一致的地方。
