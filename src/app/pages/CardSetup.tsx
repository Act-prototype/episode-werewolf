import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Minus, Users, Sparkles, ArrowLeft, Shuffle } from "lucide-react";
import { Input } from "../components/ui/input";
import { episodeThemes, SHUFFLE_THEME } from "../utils/episodeThemes";
import { GameMenu } from "../components/GameMenu";

export default function CardSetup() {
  const navigate = useNavigate();
  const [playerCount, setPlayerCount] = useState(2);
  const [cardsPerPlayer, setCardsPerPlayer] = useState(4);
  const [werewolfCardCount, setWerewolfCardCount] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<string>(episodeThemes[0].category);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 2 }, (_, i) => `プレイヤー${i + 1}`)
  );

  const totalCards = playerCount * cardsPerPlayer;
  const villagerCards = totalCards - werewolfCardCount;

  const updatePlayerCount = (newCount: number) => {
    if (newCount < 2) return;

    setPlayerCount(newCount);

    const newNames: string[] = [];
    for (let i = 0; i < newCount; i++) {
      newNames.push(playerNames[i] || `プレイヤー${i + 1}`);
    }
    setPlayerNames(newNames);

    const newTotalCards = newCount * cardsPerPlayer;
    if (werewolfCardCount >= newTotalCards) {
      setWerewolfCardCount(Math.max(1, newTotalCards - 1));
    }
  };

  const updateCardsPerPlayer = (newCards: number) => {
    if (newCards < 3) return;

    setCardsPerPlayer(newCards);

    const newTotalCards = playerCount * newCards;
    if (werewolfCardCount >= newTotalCards) {
      setWerewolfCardCount(Math.max(1, newTotalCards - 1));
    }
  };

  const updateWerewolfCardCount = (newCount: number) => {
    if (newCount < 1 || newCount >= totalCards) return;
    setWerewolfCardCount(newCount);
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const cardState = {
      playerNames,
      cardsPerPlayer,
      werewolfCardCount,
      selectedTheme,
      currentPlayer: 0,
      currentRound: 1,
      winner: null
    };

    localStorage.setItem("cardState", JSON.stringify(cardState));
    navigate("/card-game");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="relative bg-gray-900 px-6 py-10 overflow-hidden">
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 z-10 w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="absolute top-6 right-6 z-10">
            <GameMenu mode="card" showRules={false} />
          </div>
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-3xl mb-4">
              <span className="text-5xl">🎴</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">カードモード</h1>
            <p className="text-gray-400 text-sm font-medium tracking-wider">CARD MODE</p>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-gray-50">
          <div className="space-y-4">
            {/* プレイヤー数設定 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-black text-gray-800">プレイヤー数</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-bold">2人〜</span>
              </div>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => updatePlayerCount(playerCount - 1)}
                  disabled={playerCount <= 2}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all"
                >
                  <Minus className="w-6 h-6 mx-auto" />
                </button>
                <div className="w-28 h-28 rounded-3xl bg-gray-900 flex items-center justify-center shadow-2xl ring-4 ring-gray-300/20">
                  <span className="text-6xl font-black text-white">
                    {playerCount}
                  </span>
                </div>
                <button
                  onClick={() => updatePlayerCount(playerCount + 1)}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg active:scale-90 transition-all"
                >
                  <Plus className="w-6 h-6 mx-auto" />
                </button>
              </div>
            </div>

            {/* カード枚数設定 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🃏</span>
                  </div>
                  <span className="text-lg font-black text-gray-800">各プレイヤーのカード数</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => updateCardsPerPlayer(cardsPerPlayer - 1)}
                  disabled={cardsPerPlayer <= 3}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all"
                >
                  <Minus className="w-6 h-6 mx-auto" />
                </button>
                <div className="w-28 h-28 rounded-3xl bg-gray-900 flex items-center justify-center shadow-2xl ring-4 ring-gray-300/20">
                  <span className="text-6xl font-black text-white">
                    {cardsPerPlayer}
                  </span>
                </div>
                <button
                  onClick={() => updateCardsPerPlayer(cardsPerPlayer + 1)}
                  disabled={cardsPerPlayer >= 8}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all"
                >
                  <Plus className="w-6 h-6 mx-auto" />
                </button>
              </div>
            </div>

            {/* 人狼カード数設定 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">🐺</span>
                  </div>
                  <span className="text-lg font-black text-gray-800">人狼カード数</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full font-bold">
                  👤 村人 {villagerCards}枚
                </span>
              </div>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => updateWerewolfCardCount(werewolfCardCount - 1)}
                  disabled={werewolfCardCount <= 1}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all"
                >
                  <Minus className="w-6 h-6 mx-auto" />
                </button>
                <div className="w-28 h-28 rounded-3xl bg-gray-900 flex items-center justify-center shadow-2xl ring-4 ring-gray-300/20">
                  <span className="text-6xl font-black text-white">
                    {werewolfCardCount}
                  </span>
                </div>
                <button
                  onClick={() => updateWerewolfCardCount(werewolfCardCount + 1)}
                  disabled={werewolfCardCount >= totalCards - 1}
                  className="w-14 h-14 rounded-2xl bg-gray-800 text-white shadow-lg disabled:opacity-30 disabled:shadow-none active:scale-90 transition-all"
                >
                  <Plus className="w-6 h-6 mx-auto" />
                </button>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600 font-bold">
                合計 {totalCards} 枚（村人 {villagerCards} 枚 + 人狼 {werewolfCardCount} 枚）
              </div>
            </div>

            {/* エピソードテーマ選択 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black text-gray-800">エピソードテーマ</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setSelectedTheme(SHUFFLE_THEME)}
                  className={`p-4 rounded-2xl font-bold text-sm transition-all col-span-2 flex items-center justify-center gap-2 ${
                    selectedTheme === SHUFFLE_THEME
                      ? "bg-gray-900 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                  ランダム
                </button>
                {episodeThemes.map((theme) => (
                  <button
                    key={theme.category}
                    onClick={() => setSelectedTheme(theme.category)}
                    className={`p-4 rounded-2xl font-bold text-sm transition-all ${
                      selectedTheme === theme.category
                        ? "bg-gray-900 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                    }`}
                  >
                    {theme.category}
                  </button>
                ))}
              </div>
            </div>

            {/* プレイヤー名入力 */}
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black text-gray-800">プレイヤー名</span>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {playerNames.map((name, index) => (
                  <div key={index} className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md z-10">
                      {index + 1}
                    </div>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`プレイヤー${index + 1}`}
                      className="pl-14 h-12 rounded-2xl border-2 border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20 bg-gray-50 text-base font-semibold transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 固定ボタン */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 p-5">
          <button
            onClick={handleStart}
            className="w-full h-16 rounded-2xl bg-gray-900 text-white font-black text-xl shadow-2xl active:scale-98 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              ゲームスタート
              <span className="text-2xl">🎴</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
