import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'capacitor://localhost',
    'https://localhost',
    'http://localhost:5172',
  ],
  methods: ['POST'],
}));
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

app.post('/api/generate-theme', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { currentTheme, customPrompt } = req.body;
  console.log('[generate-theme] Request:', { currentTheme, customPrompt });

  const systemPrompt = `あなたはパーティーゲーム「エピソード人狼」のテーマ生成AIです。
大人の友人同士で遊ぶゲームなので、プレイヤーのリクエストに柔軟に対応してください。

ルール:
- 下ネタ、恋愛、ちょっとした暴露系など、大人の飲み会で盛り上がるテーマもOK
- プレイヤーのリクエストにできるだけ忠実にテーマを生成すること
- ただし、特定個人への誹謗中傷や犯罪を助長するテーマは避けること
- トピックは「〇〇」や「◯◯」のような伏せ字を絶対に使わず、具体的な言葉で書くこと
- 「〇〇」や「◯◯」のような伏せ字は使わない
- 末尾に「話」「こと」を付けない
- 15文字以内
- 特定の場所・場面・動作を入れない（「カラオケで」「転んだ」「叫んだ」等はNG）
- 誰でも1つは自分のエピソードが思い浮かぶ、普遍的なテーマにする
- 「あなたの○○は？」と聞かれて誰でも答えられるレベルの抽象度にする
- お手本:
  「人生最大の黒歴史」「バレたくなかった秘密」「忘れられない恋愛エピソード」
  「言えなかった本音」「誰にも話していない野望」「やらかした黒歴史」
  「人生で一番焦った瞬間」「友達に引かれた自分の癖」「密かに続けている習慣」

必ず以下のJSON形式で返してください: {"category": "カテゴリ名", "topic": "具体的なトピック"}`;

  let userPrompt;
  if (customPrompt) {
    userPrompt = `以下のリクエストに沿ったトピックを1つ生成してください: ${customPrompt}`;
  } else if (currentTheme && currentTheme !== 'シャッフル') {
    userPrompt = `「${currentTheme}」のカテゴリに関連する新しいトピックを1つ生成してください。`;
  } else {
    userPrompt = `自由なカテゴリで面白いトピックを1つ生成してください。`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `OpenAI API error: ${err}` });
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    const result = { category: content.category, topic: content.topic };
    console.log('[generate-theme] Response:', result);
    console.log('[generate-theme] Tokens:', data.usage);
    res.json(result);
  } catch (e) {
    console.error('[generate-theme] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
