# エピソード人狼 (Episode Werewolf)

エピソードで人狼を見破るパーティーゲーム。
**Expo (React Native) による iOS / Android / Web 共通の1コードベース**で動作します。

## 技術スタック

- **Expo SDK 54** + **Expo Router**（ファイルベースのルーティング、iOS/Android/Web 共通）
- **React Native 0.81 / React 19**（New Architecture 有効）
- **react-native-reanimated / gesture-handler** — ネイティブな画面遷移・押下アニメーション
- **expo-haptics** — 役職めくり・カード公開などの触覚フィードバック
- **@expo/vector-icons (Material Icons)** — 絵文字は不使用。Google の Material Icons に統一
- **@react-native-async-storage/async-storage** — 画面間のゲーム状態の受け渡し
- AIテーマ生成バックエンド … `server/`（Express + OpenAI）

## ディレクトリ構成

```
app/                  Expo Router の画面（ルート）
  _layout.tsx         Stack ナビゲーション + 各種 Provider
  index.tsx           モード選択（トップ）
  setup-normal.tsx    通常モード設定
  setup-card.tsx      カードモード設定
  role-reveal.tsx     役職確認（カードめくり演出）
  game.tsx            通常モード本編（フェーズ進行・議論タイマー・投票）
  card-game.tsx       カードモード本編（カード選択〜ダウト〜公開）
src/
  theme/tokens.ts     デザイントークン（色・余白・角丸・タイポ・影）
  components/         共通UI（Button, Card, Stepper, Header, GameMenu, Icon …）
  game/               プラットフォーム非依存のゲームロジック（Web版から流用）
server/server.js      AIテーマ生成API + Web静的配信
assets/               アイコン等
```

## セットアップ

```bash
npm install
```

## 開発（Expo Go で確認）

TestFlight 等の配信前は **Expo Go** で実機確認できます（独自ネイティブモジュールは未使用のため Expo Go だけで完結します）。

```bash
npm start          # Metro を起動。表示される QR を Expo Go アプリで読み取る
npm run android    # Android エミュレータ/実機
npm run ios        # iOS シミュレータ/実機
npm run web        # ブラウザ
```

> ヒント: AIテーマ生成を試す場合は、別ターミナルで `OPENAI_API_KEY=... npm run server` を起動してください（ネイティブからは `src/game/apiConfig.ts` の本番URLを参照します）。

## 配信（TestFlight / Google Play）

[EAS Build](https://docs.expo.dev/build/introduction/) を使用します（設定済み: `eas.json`）。

```bash
npm i -g eas-cli
eas login
eas build -p ios --profile production      # → eas submit -p ios で TestFlight へ
eas build -p android --profile production
```

## Web（統合ターゲット）

```bash
npm run export:web   # dist/ に静的サイトを出力（server/server.js が配信可能）
```

## 型チェック

```bash
npm run typecheck
```
