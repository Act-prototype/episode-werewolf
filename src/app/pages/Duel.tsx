import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Home, AlertCircle, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { GameMenu } from "../components/GameMenu";
import { getTopicForTheme } from "../utils/episodeThemes";
import { generateAITheme } from "../utils/aiTheme";

interface PlayerState {
  name: string;
  cards: number;
  usedCards: number;
  werewolfCardsUsed: number;
  finished: boolean;
}

interface CardGameState {
  playerNames: string[];
  cardsPerPlayer: number;
  werewolfCardCount: number;
  selectedTheme: string;
  currentPlayer: number;
  currentRound: number;
  winner: string | null;
}

interface SelectedCard {
  playerIndex: number;
  cardType: "werewolf" | "villager";
  cardIndex: number;
}

export default function Duel() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<CardGameState | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [playerCards, setPlayerCards] = useState<("werewolf" | "villager")[][]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [phase, setPhase] = useState<"themeAnnouncement" | "cardSelect" | "episode" | "doubt" | "result" | "reveal">("themeAnnouncement");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [currentSelectingPlayer, setCurrentSelectingPlayer] = useState(0);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<"werewolf" | "villager" | null>(null);
  const [showCardToPlayer, setShowCardToPlayer] = useState(false);
  const [currentEpisodePlayer, setCurrentEpisodePlayer] = useState(0);
  const [currentDoubtingPlayer, setCurrentDoubtingPlayer] = useState(0);
  const [doubtResult, setDoubtResult] = useState<{
    doubterIndex: number | null;
    targetIndex: number | null;
    isSuccess: boolean;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cardState");
    if (saved) {
      const state: CardGameState = JSON.parse(saved);
      setGameState(state);

      const totalCards = state.playerNames.length * state.cardsPerPlayer;
      const cards: ("werewolf" | "villager")[] = [];

      for (let i = 0; i < state.werewolfCardCount; i++) {
        cards.push("werewolf");
      }

      for (let i = 0; i < totalCards - state.werewolfCardCount; i++) {
        cards.push("villager");
      }

      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }

      const distributedCards: ("werewolf" | "villager")[][] = [];
      for (let i = 0; i < state.playerNames.length; i++) {
        const start = i * state.cardsPerPlayer;
        const end = start + state.cardsPerPlayer;
        distributedCards.push(cards.slice(start, end));
      }
      setPlayerCards(distributedCards);

      const initialPlayers: PlayerState[] = state.playerNames.map((name) => ({
        name,
        cards: state.cardsPerPlayer,
        usedCards: 0,
        werewolfCardsUsed: 0,
        finished: false,
      }));
      setPlayers(initialPlayers);

      const topic = getTopicForTheme(state.selectedTheme);
      setCurrentTopic(topic.topic);
      setCurrentCategory(topic.category);
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!gameState || players.length === 0) return null;

  const handleChangeTopic = () => {
    if (!gameState) return;
    const topic = getTopicForTheme(gameState.selectedTheme);
    setCurrentTopic(topic.topic);
    setCurrentCategory(topic.category);
  };

  const handleGenerateAITopic = async () => {
    if (!gameState || isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const topic = await generateAITheme(gameState.selectedTheme, aiCustomPrompt || undefined);
      setCurrentTopic(topic.topic);
      setCurrentCategory(topic.category);
      setAiCustomPrompt("");
    } catch (e) {
      console.error('AI theme generation failed:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCardSelect = (index: number) => {
    const cardType = playerCards[currentSelectingPlayer][index];
    setSelectedCardIndex(index);
    setSelectedCardType(cardType);
    setShowCardToPlayer(true);
  };

  const handleConfirmCard = () => {
    const newSelectedCards = [...selectedCards, {
      playerIndex: currentSelectingPlayer,
      cardType: selectedCardType!,
      cardIndex: selectedCardIndex!,
    }];
    setSelectedCards(newSelectedCards);

    let nextPlayer = currentSelectingPlayer + 1;
    while (nextPlayer < players.length && players[nextPlayer].cards === 0) {
      nextPlayer++;
    }

    if (nextPlayer >= players.length) {
      setPhase("episode");
      setCurrentEpisodePlayer(newSelectedCards[0].playerIndex);
      setShowCardToPlayer(false);
      setSelectedCardIndex(null);
      setSelectedCardType(null);
    } else {
      setCurrentSelectingPlayer(nextPlayer);
      setShowCardToPlayer(false);
      setSelectedCardIndex(null);
      setSelectedCardType(null);
    }
  };

  const handleNextEpisode = () => {
    const currentIndex = selectedCards.findIndex(sc => sc.playerIndex === currentEpisodePlayer);

    if (currentIndex < selectedCards.length - 1) {
      setCurrentEpisodePlayer(selectedCards[currentIndex + 1].playerIndex);
    } else {
      let firstDoubter = 0;
      while (firstDoubter < players.length && players[firstDoubter].cards === 0) {
        firstDoubter++;
      }
      setCurrentDoubtingPlayer(firstDoubter);
      setPhase("doubt");
    }
  };

  const handleDoubtFromPlayer = (targetIndex: number) => {
    const targetCard = selectedCards.find(sc => sc.playerIndex === targetIndex);

    if (!targetCard) return;

    setDoubtResult({
      doubterIndex: currentDoubtingPlayer,
      targetIndex,
      isSuccess: targetCard.cardType === "werewolf",
    });
    setPhase("reveal");
  };

  const handlePassFromPlayer = () => {
    let nextDoubter = currentDoubtingPlayer + 1;
    while (nextDoubter < players.length && players[nextDoubter].cards === 0) {
      nextDoubter++;
    }

    if (nextDoubter >= players.length) {
      setDoubtResult({
        doubterIndex: null,
        targetIndex: null,
        isSuccess: false,
      });
      setPhase("reveal");
    } else {
      setCurrentDoubtingPlayer(nextDoubter);
    }
  };

  const processRoundEnd = (
    newPlayers: PlayerState[],
    newPlayerCards: ("werewolf" | "villager")[][],
    penalizedPlayerIndex: number,
  ) => {
    const cardsByPlayer: { [key: number]: number[] } = {};

    selectedCards.forEach(sc => {
      if (penalizedPlayerIndex !== -1 && sc.playerIndex === penalizedPlayerIndex) {
        return;
      }

      if (!cardsByPlayer[sc.playerIndex]) {
        cardsByPlayer[sc.playerIndex] = [];
      }
      cardsByPlayer[sc.playerIndex].push(sc.cardIndex);
    });

    selectedCards.forEach(sc => {
      if (penalizedPlayerIndex !== -1 && sc.playerIndex === penalizedPlayerIndex) {
        return;
      }

      newPlayers[sc.playerIndex].usedCards += 1;
      newPlayers[sc.playerIndex].cards -= 1;

      if (sc.cardType === "werewolf") {
        newPlayers[sc.playerIndex].werewolfCardsUsed += 1;
      }
    });

    Object.entries(cardsByPlayer).forEach(([playerIdx, indices]) => {
      const sortedIndices = indices.sort((a, b) => b - a);
      sortedIndices.forEach(idx => {
        newPlayerCards[parseInt(playerIdx)].splice(idx, 1);
      });
    });

    setPlayers(newPlayers);
    setPlayerCards(newPlayerCards);

    checkWinner(newPlayers);
  };

  const checkWinner = (updatedPlayers: PlayerState[]) => {
    const finishedPlayers = updatedPlayers.filter(p => p.cards === 0);

    if (finishedPlayers.length > 0) {
      const winner = finishedPlayers.reduce((prev, current) => {
        return current.werewolfCardsUsed > prev.werewolfCardsUsed ? current : prev;
      });

      setGameState({
        ...gameState!,
        winner: winner.name,
      });
      setPhase("result");
    } else {
      nextRound();
    }
  };

  const nextRound = () => {
    setGameState({
      ...gameState!,
      currentRound: gameState!.currentRound + 1,
    });

    let firstPlayer = 0;
    while (firstPlayer < players.length && players[firstPlayer].cards === 0) {
      firstPlayer++;
    }

    setCurrentSelectingPlayer(firstPlayer);
    setSelectedCards([]);
    setSelectedCardIndex(null);
    setSelectedCardType(null);
    setShowCardToPlayer(false);
    setPhase("themeAnnouncement");

    const topic = getTopicForTheme(gameState!.selectedTheme);
    setCurrentTopic(topic.topic);
    setCurrentCategory(topic.category);
  };

  const handleRestart = () => {
    localStorage.removeItem("cardState");
    navigate("/");
  };

  // テーマ発表フェーズ
  if (phase === "themeAnnouncement") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">カードモード</h1>
                <p className="text-white/80 text-sm font-bold">Day{gameState.currentRound}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                <div className="inline-block bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-black mb-4">
                  TODAY'S THEME
                </div>
                {currentCategory && (
                  <div className="text-gray-500 text-sm font-bold mb-2">{currentCategory}</div>
                )}
                <h2 className="text-2xl font-black text-gray-800">
                  「{currentTopic}」
                </h2>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-blue-900 leading-relaxed font-medium text-center">
                  このテーマでエピソードを話します<br />
                  テーマを変えたい場合は下のボタンから
                </p>
              </div>

              <button
                onClick={handleChangeTopic}
                className="w-full h-11 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                テーマを変える
              </button>

              <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-bold text-gray-700">AIでテーマ生成</span>
                </div>
                <input
                  type="text"
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="例: 食べ物に関するテーマ、もっと面白く"
                  className="w-full h-10 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-gray-50 px-3 text-sm font-medium transition-all outline-none"
                />
                <button
                  onClick={handleGenerateAITopic}
                  disabled={isGeneratingAI}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGeneratingAI ? "生成中..." : "AIで生成"}
                </button>
              </div>

              <button
                onClick={() => setPhase("cardSelect")}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white font-black text-lg shadow-2xl active:scale-95 transition-all"
              >
                このテーマで始める
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // カード選択フェーズ
  if (phase === "cardSelect") {
    const currentPlayerState = players[currentSelectingPlayer];
    const currentPlayerCardList = playerCards[currentSelectingPlayer] || [];

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          {/* ヘッダー */}
          <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-black text-white">カードモード</h1>
                <p className="text-white/80 text-sm font-bold">Day{gameState.currentRound}</p>
              </div>
              <div className="text-white text-xs font-bold">
                {selectedCards.length}/{players.filter(p => p.cards > 0).length} 選択完了
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {players.map((player, idx) => {
                const hasSelected = selectedCards.some(sc => sc.playerIndex === idx);

                return (
                  <div
                    key={idx}
                    className={`bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 ${
                      idx === currentSelectingPlayer ? "ring-2 ring-white" : ""
                    } ${hasSelected ? "opacity-60" : ""}`}
                  >
                    <div className="text-white text-xs font-bold truncate flex items-center gap-1">
                      {hasSelected && <span>✓</span>}
                      {player.name}
                    </div>
                    <div className="text-white/90 text-xs font-bold">
                      {player.cards === 0 ? "完了" : `🃏 ${player.cards}枚`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
            <AnimatePresence mode="wait">
              {!showCardToPlayer ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full space-y-6"
                >
                  <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                      <span className="text-5xl">👤</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-800 mb-2">{currentPlayerState.name}</h2>
                    <p className="text-gray-600 font-bold">カードを選んでください</p>
                    <div className="mt-4 text-sm font-bold text-gray-600">
                      残り {currentPlayerState.cards} 枚
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                    <div className="text-center">
                      {currentCategory && (
                        <div className="text-amber-700 text-xs font-bold mb-1">{currentCategory}</div>
                      )}
                      <div className="text-base font-black text-amber-900">{currentTopic}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-center text-sm font-bold text-gray-600">カードを1枚選んでください</p>
                    <div className="grid grid-cols-3 gap-3">
                      {currentPlayerCardList.map((card, index) => (
                        <button
                          key={index}
                          onClick={() => handleCardSelect(index)}
                          className="aspect-[2/3] rounded-2xl shadow-xl active:scale-95 transition-all bg-gradient-to-br from-gray-700 to-gray-900 hover:shadow-2xl"
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-5xl">🃏</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, rotateY: 180 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.6 }}
                  className="w-full space-y-6"
                >
                  <div className={`rounded-3xl shadow-2xl p-12 text-center ${
                    selectedCardType === "werewolf"
                      ? "bg-gradient-to-br from-red-600 to-rose-600"
                      : "bg-gradient-to-br from-blue-600 to-cyan-600"
                  }`}>
                    <div className="text-8xl mb-4">
                      {selectedCardType === "werewolf" ? "🐺" : "👤"}
                    </div>
                    <div className="text-5xl font-black text-white mb-2">
                      {selectedCardType === "werewolf" ? "人狼" : "村人"}カード
                    </div>
                    <div className="text-white/90 text-lg font-bold">
                      {selectedCardType === "werewolf" ? "嘘のエピソードを話す" : "本当のエピソードを話す"}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200">
                    <p className="text-sm text-amber-900 text-center font-bold leading-relaxed">
                      このカードを覚えておいてください。<br />
                      全員がカードを選んだら、順番にエピソードを話します。
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmCard}
                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-2xl active:scale-95 transition-all"
                  >
                    次のプレイヤーへ
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // エピソード発表フェーズ
  if (phase === "episode") {
    const currentIndex = selectedCards.findIndex(sc => sc.playerIndex === currentEpisodePlayer);
    const isLast = currentIndex === selectedCards.length - 1;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-fuchsia-600 px-6 py-5">
            <div className="text-center">
              <h1 className="text-2xl font-black text-white">エピソード発表</h1>
              <p className="text-white/80 text-sm font-bold">
                {currentIndex + 1} / {selectedCards.length}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100 w-full"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                <span className="text-5xl">🎭</span>
              </div>
              <h2 className="text-4xl font-black text-gray-800 mb-2">
                {players[currentEpisodePlayer].name}
              </h2>
              <p className="text-gray-600 font-bold">がエピソードを話します</p>
            </motion.div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 w-full">
              <div className="text-center">
                <div className="text-amber-900 text-sm font-bold mb-2">トピック</div>
                <div className="text-xl font-black text-amber-900">{currentTopic}</div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200 w-full">
              <p className="text-sm text-blue-900 text-center font-bold leading-relaxed">
                {players[currentEpisodePlayer].name}さん、選んだカードに従って<br />
                エピソードを話してください。
              </p>
            </div>

            <button
              onClick={handleNextEpisode}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-2xl active:scale-95 transition-all"
            >
              {isLast ? "ダウトタイムへ進む" : "次のプレイヤーへ"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ダウトフェーズ
  if (phase === "doubt") {
    const currentDoubter = players[currentDoubtingPlayer];

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          <div className="bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-black text-white">ダウトタイム</h1>
                <p className="text-white/80 text-sm font-bold">誰かをダウトしますか？</p>
              </div>
              <div className="text-white text-xs font-bold">
                {currentDoubtingPlayer + 1}/{players.filter(p => p.cards > 0).length}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {players.map((player, idx) => {
                if (player.cards === 0) return null;

                return (
                  <div
                    key={idx}
                    className={`bg-white/10 backdrop-blur-xl rounded-xl px-3 py-2 ${
                      idx === currentDoubtingPlayer ? "ring-2 ring-white" : ""
                    }`}
                  >
                    <div className="text-white text-xs font-bold truncate flex items-center gap-1">
                      {player.name}
                    </div>
                    <div className="text-white/90 text-xs font-bold">
                      🃏 {player.cards}枚
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100 w-full"
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                <span className="text-5xl">🤔</span>
              </div>
              <h2 className="text-4xl font-black text-gray-800 mb-2">{currentDoubter.name}</h2>
              <p className="text-gray-600 font-bold">誰をダウトしますか？</p>
            </motion.div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border-2 border-red-200 w-full">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900 font-bold leading-relaxed">
                  <p className="mb-2">誰かのエピソードが人狼カード（嘘）だと思いますか？</p>
                  <p className="text-xs">
                    • ダウト成功 → 出した人にカード+1枚<br />
                    • ダウト失敗 → ダウトした人にカード+1枚
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              <p className="text-center text-sm font-bold text-gray-700">ダウトする相手を選択</p>

              {selectedCards.map((sc, idx) => {
                if (sc.playerIndex === currentDoubtingPlayer) return null;

                return (
                  <button
                    key={idx}
                    onClick={() => handleDoubtFromPlayer(sc.playerIndex)}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    🎯 {players[sc.playerIndex].name} をダウト！
                  </button>
                );
              })}

              <button
                onClick={handlePassFromPlayer}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-black text-lg shadow-xl active:scale-95 transition-all mt-2"
              >
                ✓ パス（信じる）
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 発表フェーズ
  if (phase === "reveal") {
    if (doubtResult?.doubterIndex === null) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
            <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-6 py-5">
              <div className="text-center">
                <h1 className="text-2xl font-black text-white">カード公開</h1>
                <p className="text-white/80 text-sm font-bold">全員パス</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-4">
              <h2 className="text-xl font-black text-gray-800 mb-2">今回出したカード</h2>
              <div className="w-full space-y-3">
                {selectedCards.map((sc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    className={`rounded-2xl shadow-lg p-5 ${
                      sc.cardType === "werewolf"
                        ? "bg-gradient-to-br from-red-500 to-rose-500"
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">
                          {sc.cardType === "werewolf" ? "🐺" : "👤"}
                        </div>
                        <div>
                          <div className="text-white font-black text-lg">{players[sc.playerIndex].name}</div>
                          <div className="text-white/80 text-sm font-bold">
                            {sc.cardType === "werewolf" ? "人狼カード" : "村人カード"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => processRoundEnd(players, playerCards, -1)}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-2xl active:scale-95 transition-all mt-6"
              >
                次のラウンドへ
              </button>
            </div>
          </div>
        </div>
      );
    }

    const targetCard = selectedCards.find(sc => sc.playerIndex === doubtResult?.targetIndex);
    const targetPlayer = players[doubtResult?.targetIndex || 0];
    const doubterPlayer = players[doubtResult?.doubterIndex || 0];

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          <div className={`px-6 py-5 ${
            doubtResult?.isSuccess
              ? "bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600"
              : "bg-gradient-to-br from-orange-600 via-red-600 to-rose-600"
          }`}>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white">カード公開</h1>
              <p className="text-white/80 text-sm font-bold">
                {doubterPlayer.name} が {targetPlayer.name} をダウト！
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.6 }}
              className={`rounded-3xl shadow-2xl p-12 text-center w-full ${
                targetCard?.cardType === "werewolf"
                  ? "bg-gradient-to-br from-red-600 to-rose-600"
                  : "bg-gradient-to-br from-blue-600 to-cyan-600"
              }`}
            >
              <div className="text-9xl mb-4">
                {targetCard?.cardType === "werewolf" ? "🐺" : "👤"}
              </div>
              <div className="text-5xl font-black text-white mb-2">
                {targetCard?.cardType === "werewolf" ? "人狼" : "村人"}カード
              </div>
              <div className="text-white/90 text-xl font-bold">
                {targetPlayer.name} のカード
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`rounded-2xl shadow-lg p-6 text-center w-full border-4 ${
                doubtResult?.isSuccess
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="text-6xl mb-3">
                {doubtResult?.isSuccess ? "✅" : "❌"}
              </div>
              <div className={`text-3xl font-black mb-2 ${
                doubtResult?.isSuccess ? "text-green-900" : "text-red-900"
              }`}>
                {doubtResult?.isSuccess ? "ダウト成功！" : "ダウト失敗！"}
              </div>
              <div className={`text-lg font-bold ${
                doubtResult?.isSuccess ? "text-green-800" : "text-red-800"
              }`}>
                {doubtResult?.isSuccess
                  ? `${targetPlayer.name} にカード+1枚`
                  : `${doubterPlayer.name} にカード+1枚`
                }
              </div>
            </motion.div>

            <div className="w-full space-y-2">
              <h3 className="text-sm font-black text-gray-700 px-2">今回出したカード</h3>
              {selectedCards.map((sc, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl shadow p-3 ${
                    sc.cardType === "werewolf"
                      ? "bg-red-100 border-2 border-red-300"
                      : "bg-blue-100 border-2 border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">
                        {sc.cardType === "werewolf" ? "🐺" : "👤"}
                      </div>
                      <div className={`font-bold text-sm ${
                        sc.cardType === "werewolf" ? "text-red-900" : "text-blue-900"
                      }`}>
                        {players[sc.playerIndex].name}
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${
                      sc.cardType === "werewolf" ? "text-red-700" : "text-blue-700"
                    }`}>
                      {sc.cardType === "werewolf" ? "人狼" : "村人"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (doubtResult?.isSuccess) {
                  const newPlayers = [...players];
                  newPlayers[doubtResult.targetIndex!].cards += 1;
                  const newPlayerCards = [...playerCards];
                  newPlayerCards[doubtResult.targetIndex!] = [...newPlayerCards[doubtResult.targetIndex!], "villager"];
                  processRoundEnd(newPlayers, newPlayerCards, doubtResult.targetIndex!);
                } else {
                  const newPlayers = [...players];
                  newPlayers[doubtResult!.doubterIndex!].cards += 1;
                  const newPlayerCards = [...playerCards];
                  newPlayerCards[doubtResult!.doubterIndex!] = [...newPlayerCards[doubtResult!.doubterIndex!], "villager"];
                  processRoundEnd(newPlayers, newPlayerCards, -1);
                }
              }}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-lg shadow-2xl active:scale-95 transition-all"
            >
              次のラウンドへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 結果フェーズ
  if (phase === "result") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
          <div className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 px-6 py-10">
            <div className="text-center">
              <div className="text-7xl mb-4">🏆</div>
              <h1 className="text-4xl font-black text-white mb-2">ゲーム終了！</h1>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl p-10 text-center border-4 border-yellow-400 w-full"
            >
              <div className="text-8xl mb-6">🎉</div>
              <div className="text-5xl font-black text-gray-800 mb-4">{gameState.winner}</div>
              <div className="text-2xl font-bold text-gray-600">の勝利！</div>
            </motion.div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 w-full">
              <div className="text-center mb-4">
                <h3 className="text-lg font-black text-gray-800">ゲーム統計</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-700">
                  <span>総日数</span>
                  <span>Day{gameState.currentRound}</span>
                </div>
                {players.map((player, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div className="font-black text-gray-800">{player.name}</div>
                      <div className="text-sm font-bold text-gray-600">
                        🐺 {player.werewolfCardsUsed}枚使用
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={handleRestart}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xl shadow-2xl active:scale-95 transition-all"
              >
                トップに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
