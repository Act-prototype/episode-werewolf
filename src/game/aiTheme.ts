import { getApiBaseUrl } from './apiConfig';

/** AI生成のお題は既存カテゴリに属さないので、表示上のカテゴリはこれで固定する */
export const AI_THEME_CATEGORY = 'カスタムテーマ';

export interface AIThemeRequest {
  /** 選択中のエピソードテーマ（カテゴリ） */
  category?: string;
  /** いま画面に出ているお題。「もっと面白く」のような相対的な指示の基準になる */
  currentTopic?: string;
  /** ユーザーの自由入力 */
  customPrompt?: string;
}

/**
 * AIにお題を作らせる。
 *
 * カテゴリはサーバの返り値を使わず必ず AI_THEME_CATEGORY にする。
 * サーバ側を更新・再デプロイしていない環境でも表示が揺れないようにするため。
 */
export async function generateAITheme(
  params: AIThemeRequest = {}
): Promise<{ category: string; topic: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/generate-theme`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // サーバ側の既存フィールド名に合わせる
      currentTheme: params.category,
      currentTopic: params.currentTopic,
      customPrompt: params.customPrompt,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'AI theme generation failed');
  }
  const data = await res.json();
  return { category: AI_THEME_CATEGORY, topic: data.topic };
}
