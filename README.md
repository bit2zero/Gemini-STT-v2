# AI Transcription and Translation

リアルタイム音声認識・転写・多言語翻訳アプリケーション

Google Gemini APIを活用した、マイクから入力された音声をリアルタイムで文字起こしし、複数の言語への自動翻訳を提供するWebアプリケーションです。

View your app in AI Studio: https://ai.studio/apps/drive/1FWXzKkc7-4k3DDnCmOB0uaPgH6Yx_VVC

## 主な機能

- **リアルタイム音声認識**: マイクから入力された音声を即座にテキストに変換
- **多言語対応**: 6つの言語をサポート（日本語、英語、中国語、ベトナム語、韓国語、ポルトガル語）
- **自動翻訳**: 認識されたテキストを選択した言語へ自動翻訳
- **APIログ表示**: Gemini APIからの応答をリアルタイムで確認可能
- **レスポンシブUI**: Tailwind CSSを使用したモダンなデザイン

## 対応言語

| 言語コード | 言語名 |
|-----------|--------|
| `ja-JP` | 日本語 (Japanese) |
| `en-US` | English (英語) |
| `zh-CN` | 中文 (中国語) |
| `vi-VN` | Tiếng Việt (ベトナム語) |
| `ko-KR` | 한국어 (韓国語) |
| `pt-BR` | Português (ポルトガル語) |

## セットアップ

### 前提条件

- Node.js (v18以上推奨)
- Gemini API Key ([Google AI Studio](https://ai.google.dev/)で取得)

### インストール手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **環境変数の設定**

   `.env.local`ファイルを作成し、Gemini APIキーを設定:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

   アプリケーションは `http://localhost:3000` で起動します。

## 使用方法

1. **言語選択**: ドロップダウンから音声認識する言語を選択
2. **翻訳言語選択** (オプション): 翻訳先の言語を選択（「None」で翻訳なし）
3. **録音開始**: 「Start Recording」ボタンをクリックしてマイクへのアクセスを許可
4. **音声入力**: マイクに向かって話すと、リアルタイムでテキストが表示されます
5. **録音停止**: 「Stop Recording」ボタンで録音を終了

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **フロントエンド** | React 19.2.0 |
| **言語** | TypeScript 5.8 |
| **ビルドツール** | Vite 6.2.0 |
| **スタイリング** | Tailwind CSS |
| **AI API** | Google Gemini API (v1.29.1) |
| **音声処理** | Web Audio API |

## 開発

### ビルド

プロダクション用のビルド:
```bash
npm run build
```

### プレビュー

ビルドしたアプリケーションのプレビュー:
```bash
npm run preview
```

### テスト

テストの実行:
```bash
npm test
```

## プロジェクト構造

```
Gemini-STT-v2/
├── App.tsx              # メインアプリケーションコンポーネント
├── index.tsx            # エントリーポイント
├── index.html           # HTMLテンプレート
├── package.json         # 依存関係とスクリプト
├── tsconfig.json        # TypeScript設定
├── vite.config.ts       # Vite設定
├── vitest.config.ts     # Vitest設定
├── metadata.json        # アプリメタデータ
└── services/
    └── geminiService.ts # API サービス（将来の拡張用）
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
