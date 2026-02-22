# いのちだいじ
## 犬の健康を“履歴”で守るヘルスログSaaS
対象フェーズ：Phase0（MVP）

---

# 1. 本ドキュメントの目的

本ドキュメントは、Phase0における設計方針・技術選定理由・データ設計・将来拡張戦略を明文化することを目的とする。

Phase0は「完璧な健康管理」ではなく
**「続く記録」の検証フェーズ**である。

---

# 2. Phase0の設計思想

## 優先順位

- 1分以内で入力が完結すること
- 未入力日・未入力項目があっても履歴が破綻しないこと
- ダッシュボード起点で最短2タップ以内
- 通知や強制に依存しない継続性

## やらないこと

- ログイン機能
- 共有機能
- クラウド保存
- 通知
- 分析
- エクスポート

---

# 3. 技術スタック

## フロントエンド

- Nuxt 3（Vue 3）
- TypeScript
- Pinia（UI状態のみ）

## データ保存

- IndexedDB
- Dexie

## グラフ

- Chart.js（vue-chartjs）

---

# 4. データ設計

## dogs

- id
- name（必須）
- birthday
- breed
- memo
- targetMin
- targetMax
- createdAt
- updatedAt

## daily_logs

- id
- dogId
- logDate（YYYY-MM-DD / JST）
- weight（0.01kg単位）
- memo
- photoId
- createdAt
- updatedAt

## photos

- id
- dogId
- logDate
- blob
- mimeType
- size
- createdAt

---

# 5. 一意制約

同一犬・同一日付のログは1件。

IndexedDB複合インデックス `[dogId+logDate]` を利用。

---

# 6. 将来拡張

Phase1以降：

- ログイン
- 共有
- クラウド同期
- 分析機能
- Laravel API導入想定