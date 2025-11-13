# みなみレンタカー 在庫確認システム

奄美大島のレンタカーショップ「みなみレンタカー」の在庫確認Webアプリケーションです。

## 📋 プロジェクト概要

WordPress サイト ([https://minamimaru-amami.com/](https://minamimaru-amami.com/)) に埋め込むための、レンタカー在庫確認フォームです。貸出日時、返却日時、店舗を入力することで、リアルタイムでレンタカーの在庫状況を確認できます。

## 🎨 デザインコンセプト

- **カラーテーマ**: 青色ベース（`#1e3a8a`, `#3b82f6`, `#eff6ff` など）
- **レスポンシブ**: スマートフォン・タブレット・PC対応
- **フォント**: Noto Sans JP（日本語に適したフォント）
- **UI/UX**: シンプルで使いやすいインターフェース

## 🛠 技術スタック

- **HTML5**: セマンティックなマークアップ、アクセシビリティ対応
- **CSS3**: CSS Grid、Flexbox、CSS変数、レスポンシブデザイン
- **Vanilla JavaScript**: 外部ライブラリなし、軽量で高速
- **Google Apps Script**: バックエンドAPI（別途セットアップが必要）

## 📁 ファイル構成

```
minami-rental-car-frontend/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css       # スタイルシート
├── js/
│   └── availability.js # JavaScript メインファイル
└── README.md           # このファイル
```

## ✨ 機能要件

### 入力フォーム

1. **貸出日**: date input
2. **貸出時刻**: select（09:00～18:00、30分刻み）
3. **貸出店舗**: select
   - 奄美空港店
   - 古仁屋港店
   - 瀬相港店
4. **返却日**: date input
5. **返却時刻**: select（09:00～18:00、30分刻み）
6. **返却店舗**: select（同上）
7. **在庫を確認するボタン**

### バリデーション

- 返却日時が貸出日時より後であること
- 貸出日時が過去でないこと
- 全項目必須入力

### 結果表示

APIから取得した在庫情報を表示します：

**在庫がある場合:**
```
✅ 利用可能な車両
🚗 軽自動車: 12台
🚙 普通車: 8台
🚐 ワゴン: 5台
🚙 SUV: 2台
※ この日程で予約可能です
```

**在庫がない場合:**
```
❌ 申し訳ございません
ご指定の日時は満車となっております。
別の日程をお試しください。
```

## 🔌 API連携

### エンドポイント

```
https://script.google.com/macros/s/{DEPLOY_ID}/exec
```

### リクエスト

- **メソッド**: GET
- **パラメータ**:
  - `action=checkAvailability`
  - `pickupBranch=奄美空港店`
  - `pickupDateTime=2025-11-20T10:00:00`
  - `returnDateTime=2025-11-22T18:00:00`

### レスポンス形式

```json
{
  "success": true,
  "available": {
    "軽自動車": 12,
    "普通車": 8,
    "ワゴン": 5,
    "SUV": 2
  }
}
```

在庫がない場合:
```json
{
  "success": false,
  "message": "ご指定の日時は満車となっております。"
}
```

## 🚀 セットアップ方法

### 1. ファイルの配置

プロジェクトファイルをWebサーバーまたはローカル環境に配置します。

```bash
# プロジェクトフォルダをWebサーバーのルートにコピー
cp -r minami-rental-car-frontend /path/to/webserver/
```

### 2. API エンドポイントの設定

`js/availability.js` の2行目にあるAPI_ENDPOINTを実際のGoogle Apps Script Web AppのURLに置き換えてください。

```javascript
// 変更前
const API_ENDPOINT = 'https://script.google.com/macros/s/{DEPLOY_ID}/exec';

// 変更後（実際のDEPLOY_IDを使用）
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx...xxxxx/exec';
```

### 3. ブラウザで確認

ブラウザで `index.html` を開いて動作を確認します。

```bash
# ローカルサーバーを起動する場合（Python 3の例）
cd minami-rental-car-frontend
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

## 🌐 WordPressへの埋め込み方法

### 方法1: カスタムHTMLブロック

1. WordPress管理画面で埋め込みたいページを編集
2. 「カスタムHTML」ブロックを追加
3. 以下のコードを貼り付け

```html
<!-- スタイルシートの読み込み -->
<link rel="stylesheet" href="https://your-domain.com/minami-rental-car-frontend/css/style.css">

<!-- HTMLコンテンツ -->
<div class="container">
  <!-- index.htmlの<body>内のコンテンツをコピー -->
</div>

<!-- JavaScriptの読み込み -->
<script src="https://your-domain.com/minami-rental-car-frontend/js/availability.js"></script>
```

### 方法2: ショートコード

functions.php にショートコードを追加して埋め込むこともできます。

```php
function minami_rental_car_shortcode() {
    ob_start();
    include(get_template_directory() . '/minami-rental-car-frontend/index.html');
    return ob_get_clean();
}
add_shortcode('minami_rental_car', 'minami_rental_car_shortcode');
```

ページに `[minami_rental_car]` と記載すると表示されます。

## 🎯 カスタマイズ

### カラーテーマの変更

`css/style.css` の `:root` セクションでCSS変数を変更することで、カラーテーマを簡単にカスタマイズできます。

```css
:root {
    --color-primary-dark: #1e3a8a;  /* 濃い青 */
    --color-primary: #3b82f6;        /* メイン青 */
    --color-primary-light: #60a5fa;  /* 明るい青 */
    /* その他のカラー設定 */
}
```

### 営業時間の変更

営業時間を変更する場合は、`index.html` の `<select>` タグ内の `<option>` を編集してください。

### 店舗の追加・削除

店舗を追加・削除する場合は、`index.html` の「貸出店舗」「返却店舗」の `<select>` タグ内の `<option>` を編集してください。

## 📱 レスポンシブ対応

以下のブレークポイントでデザインが最適化されています：

- **デスクトップ**: 769px以上
- **タブレット**: 481px～768px
- **スマートフォン**: 480px以下

## ♿️ アクセシビリティ対応

- セマンティックHTML
- ARIA属性（`aria-label`, `aria-required`, `aria-live`など）
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切なコントラスト比

## 🧪 テスト方法

### ローカルテスト

1. ブラウザの開発者ツール（F12）を開く
2. コンソールでエラーがないか確認
3. ネットワークタブでAPI呼び出しを確認
4. レスポンシブデザインのテスト（デバイスモードで確認）

### API接続テスト

APIエンドポイントが正しく設定されているか確認するには、ブラウザのコンソールで以下を実行：

```javascript
fetch('https://script.google.com/macros/s/{DEPLOY_ID}/exec?action=checkAvailability&pickupBranch=奄美空港店&pickupDateTime=2025-11-20T10:00:00&returnDateTime=2025-11-22T18:00:00')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🐛 トラブルシューティング

### API呼び出しがエラーになる

- API_ENDPOINTが正しく設定されているか確認
- Google Apps Script Web Appが正しくデプロイされているか確認
- CORSエラーの場合は、Google Apps Script側で適切なヘッダーを設定

### 日付選択がうまく動作しない

- ブラウザが `type="date"` をサポートしているか確認
- 古いブラウザの場合は、date pickerライブラリの追加を検討

### スタイルが適用されない

- CSSファイルのパスが正しいか確認
- ブラウザのキャッシュをクリア
- 開発者ツールでCSSが読み込まれているか確認

## 📄 ライセンス

このプロジェクトは、みなみレンタカー専用のシステムです。

## 📞 お問い合わせ

- **公式サイト**: [https://minamimaru-amami.com/](https://minamimaru-amami.com/)

---

**作成日**: 2025年11月
**最終更新**: 2025年11月
