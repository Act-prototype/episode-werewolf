# トピックショップ

無料は「恥ずかしい失敗談」「初めての経験」「本音トーク」の3つで固定。自分でテーマを作る機能も無料で、プレイ中のテーマ発表画面だけに表示します。設定画面には作成入口を置きません。プレイ中は無料・購入済みのトピックだけを選択でき、購入・ショップの導線は表示しません。設定画面の未購入トピックは価格を出さずロックアイコンだけを添え、価格は購入画面・ショップで表示します。任意テーマは40文字までで、そのゲームの次のラウンドでも使われます。ランダム出題には無料・購入済みのみが含まれます。

有料は12トピック（各7問）、単品120円、関連する3トピックのパック300円、現在の有料12トピック全部入り980円を予定しています。単品合計1,440円、4パック合計1,200円なのでまとめ買いほどお得です。将来追加する商品は全部入りv1には含めません。

## ストアの接続（リリース前に必要）

アプリ側は RevenueCat の非消費型ストア購入・復元・権限変更通知に接続しています。実際の商品登録と公開SDKキーはこのリポジトリにはまだありません。未設定時、Expo Go、Webでは試し読みだけができ、購入ボタンを押しても解放するような模擬課金はありません。

1. App Store Connect / Google Play Console に非消費型の買い切り商品を作成します。商品IDは `src/game/topicCatalog.ts` の `topicProducts` に完全一致させます。
2. RevenueCat に両ストアのアプリと商品を接続します。各有料トピックに `topic_<id>` の entitlement を作ります。**単品だけでなく、そのトピックを含むパックと全部入りの商品も、その entitlement に関連付けます。** 権限は購入履歴の有無ではなく `CustomerInfo.entitlements.active` で判定するため、返金による失効にも追従します。
3. EASのビルド・アップデート環境に `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` を設定します。RevenueCatのプラットフォーム別公開SDKキーのみを使用してください。秘密APIキーはアプリに入れません。
4. 日本のストア価格を単品120円・パック300円・全部980円に設定（ストアで利用できる価格を確認）。販売時のボタンにはストア取得価格を表示し、割引額も取得価格から算出します。
5. `react-native-purchases` を追加したため、EASで新しいネイティブビルドを作成してください。`runtimeVersion` は fingerprint に変更し、SDK未搭載の旧ビルドに新しいJSが届かないようにしています。SDKはExpo Goでは実決済できません。

| 商品ID | 内容 / entitlement |
| --- | --- |
| `topic_relationships`, `topic_regrets`, `topic_values`, `topic_romance`, `topic_dreams`, `topic_friends`, `topic_school`, `topic_family`, `topic_work`, `topic_travel`, `topic_food`, `topic_secrets` | 商品IDと同名のentitlementを1つ |
| `pack_connections` | `topic_relationships`, `topic_romance`, `topic_friends` |
| `pack_memories` | `topic_regrets`, `topic_school`, `topic_family` |
| `pack_everyday` | `topic_work`, `topic_travel`, `topic_food` |
| `pack_inner` | `topic_values`, `topic_dreams`, `topic_secrets` |
| `all_topics_v1` | 上記の12 entitlementすべて |

購入済み商品は再購入不可。部分所有時は追加される数と差額返金がないことを表示し、残りを単品・パックで揃える方が安い場合はそちらへ案内します。購入中は多重送信を防止し、キャンセル・失敗・保留では解放しません。復元は購入時のストアアカウントが必要です。アプリ独自のログインはないため、異なるOSの間で購入を同期する仕様ではありません。

## 検証

`npm run test:topics` はカタログ、権限フィルタ、任意作成、部分所有価格とネイティブ決済アダプターをモックで検証します。`npm run typecheck` と `npm run export:web` も実行してください。モックはテスト内のみで、アプリには入れません。

実機サンドボックスでは単品→3商品を解放するパック→全部入り、購入キャンセル、通信失敗、承認待ち、復元、再起動後の保持、返金時の失効を検証します。ショップからゲームに戻り、お題・手札・ラウンドが保持されることも確認してください。

公式資料: [Expo integration](https://www.revenuecat.com/docs/getting-started/installation/expo)、[Non-subscription purchases](https://www.revenuecat.com/docs/platform-resources/non-subscriptions)、[Restore](https://www.revenuecat.com/docs/getting-started/restoring-purchases)。
