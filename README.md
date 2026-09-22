# エピソード人狼 (Episode Werewolf)

エピソードで人狼を見破るパーティーゲーム。
**Expo (React Native) による iOS / Android / Web 共通の1コードベース**で動作します。

## 通常モードのルール

- 設定画面は解放済みのテーマをランダムに1つ表示し、「テーマを変える」から一覧を開きます。
- 3〜20人で遊び、人狼の人数は設定で選べます（1人以上、村人は最低2人）。全員でテーマを話して投票し、選ばれた人の正体を発表してから勝敗画面へ進みます。
- 全員が同時に指さし投票し、最多票の1人をアプリで選びます。人狼を1人でも当てたら村人の勝ち、外れなら人狼の勝ちです。同票では「今回は誰も追放しない」を選び、朝の演出から同じ配役で次のお題へ進みます（勝敗・加点なし）。
- 負けた陣営の各メンバーに1ポイント（ビールグラス1杯）を加算します。少ない人ほど上位、同数は同率です。
- 終了すると、イラスト・名前・杯数でこのメンバーの全体集計を表示します。「同じメンバーで0杯から」は保存された杯数・ゲーム数もリセットします。途中でやめたゲームは集計しません。再戦とアプリ再開で累計を引き継ぎ、メンバーを変えると0杯から始めます。
- ポイント導入前の履歴は保存されていないため、直近の確定結果が残っている場合はその1ゲームから集計します。
- 途中脱落はありません。結果画面の「同じメンバーでもう1回」で全員の役を再抽選します。テーマの種類・自作テーマは引き継ぎます。
- 旧ルールの途中データは、名前とテーマを引き継ぎ、全員が役を確認する新しい1戦へ移行します。

## 技術スタック

- **Expo SDK 54** + **Expo Router**（ファイルベースのルーティング、iOS/Android/Web 共通）
- **React Native 0.81 / React 19**（New Architecture 有効）
- **react-native-reanimated / gesture-handler** — ネイティブな画面遷移・押下アニメーション
- **expo-haptics** — 役職めくり・カード公開などの触覚フィードバック
- **@expo/vector-icons (Material Icons)** — 絵文字は不使用。Google の Material Icons に統一
- **@react-native-async-storage/async-storage** — 画面間のゲーム状態の受け渡し
- トピック購入 … RevenueCat（iOS / Androidの非消費型アプリ内課金）
- 自分でテーマを作成 … 無料・最大40文字

## ディレクトリ構成

```
app/                  Expo Router の画面（ルート）
  _layout.tsx         Stack ナビゲーション + 各種 Provider
  index.tsx           モード選択（トップ）
  setup-normal.tsx    通常モード設定
  setup-card.tsx      カードモード設定
  shop.tsx            トピックショップ・試し読み・買い切り購入
  role-reveal.tsx     役職確認（カードめくり演出）
  game.tsx            通常モード本編（フェーズ進行・議論タイマー・投票）
  card-game.tsx       カードモード本編（カード選択〜ダウト〜公開）
src/
  theme/tokens.ts     デザイントークン（色・余白・角丸・タイポ・影）
  components/         共通UI（Button, Card, Stepper, Header, GameMenu, Icon …）
  game/               プラットフォーム非依存のゲームロジック（Web版から流用）
server/server.js      Web静的配信
assets/               アイコン等
```

## セットアップ

```bash
npm install
```

## 開発（Expo Go で確認）

TestFlight 等の配信前は **Expo Go** で実機確認できます（購入以外の画面・ゲームを確認できます。実決済にはネイティブビルドが必要です）。

```bash
npm start          # Metro を起動。表示される QR を Expo Go アプリで読み取る
npm run android    # Android エミュレータ/実機
npm run ios        # iOS シミュレータ/実機
npm run web        # ブラウザ
```

> ショップの実決済にはストアの商品登録とRevenueCatの公開SDKキーが必要です。[設定手順と商品一覧](docs/topic-shop.md)を参照してください。

## 配信（TestFlight / Google Play）

[EAS Build](https://docs.expo.dev/build/introduction/) を使用します（設定済み: `eas.json`）。

```bash
npm i -g eas-cli
eas login
eas build -p ios --profile production      # → eas submit -p ios で TestFlight へ
eas build -p android --profile production
```

## iPhone の Expo Go で常に最新を見る（EAS Update）

PCを開いて pull → QR を毎回やらずに、**main にマージされた最新を Expo Go で自動反映**する仕組み。
`.github/workflows/eas-update.yml` が main への push ごとに OTA 更新を配信する。

### 一度だけの初期設定

```bash
npm i -g eas-cli
eas login                 # Expoアカウントでログイン
eas init                  # プロジェクト作成（app.json に projectId が入る）
eas update:configure      # Update 用の設定を追記
git commit -am "eas: configure update" && git push   # 設定変更を反映
```

GitHub のリポジトリ Settings → Secrets and variables → Actions に
**`EXPO_TOKEN`**（[expo.dev のアクセストークン](https://expo.dev/settings/access-tokens)）を登録する。

### 以降の運用

1. main にマージ → GitHub Actions が `eas update --branch main` を自動実行
2. iPhone で初回だけ、配信された Update の QR / リンクを Expo Go で開く
3. 次回からは Expo Go の **「最近開いた (Recently opened)」** から開き直すだけで最新を取得

> 課金SDKの追加により、新しいネイティブビルドが必要です。runtimeVersionはfingerprintを使い、異なるネイティブ構成へのOTA配信を防ぎます。

### すぐ試す / 同一Wi-Fi外で見るだけなら

PCで Metro を起動したまま、トンネル経由で接続（PCは必要）:

```bash
npx expo start --tunnel
```

## Web（統合ターゲット）

```bash
npm run export:web   # dist/ に静的サイトを出力（server/server.js が配信可能）
```

## 検証

```bash
npm run typecheck
node scripts/test-normal-game.cjs
npm run test:topics
```

通常モードの勝敗・全員参加での再戦・旧データの移行と、購入状態に応じたテーマ抽選を確認します。
