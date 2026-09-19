import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Expo Web の静的出力（`npm run export:web` で生成される ../dist）
const webDir = join(__dirname, '..', 'dist');
const app = express();
const port = process.env.PORT || 3000;

// ネイティブアプリ(iOS/Android)からの fetch は同一生成元ポリシーの対象外。
// CORS が必要なのは Expo Web（開発時の localhost / 本番の同一オリジン）のみ。
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'https://localhost',
    /\.railway\.app$/,
  ],
  methods: ['POST'],
}));
app.use(express.json());
app.use(express.static(webDir));

// SPAフォールバック。Express 5 では '*' 単体は使えず、名前付きワイルドカードが要る。
app.get('/*splat', (req, res) => {
  res.sendFile(join(webDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
