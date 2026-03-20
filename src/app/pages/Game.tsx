import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Sun,
  Moon,
  MessageCircle,
  Vote,
  Skull,
  Users,
  BookOpen,
  Home,
} from "lucide-react";
import { GameState } from "../types/game";
import { checkGameOver, eliminatePlayer } from "../utils/gameLogic";
import { getTopicForTheme } from "../utils/episodeThemes";
import { generateAITheme } from "../utils/aiTheme";
import { RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GameMenu } from "../components/GameMenu";

export default function Game() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [votes, setVotes] = useState<{ [playerId: number]: number }>({});
  const [suspectedPlayers, setSuspectedPlayers] = useState<number[]>([]);
  const [skipExile, setSkipExile] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");

  useEffect(() => {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      const state: GameState = JSON.parse(savedState);
      setGameState(state);

      if (!state.currentTopic && state.currentPhase === "episodeAnnouncement") {
        const topic = getTopicForTheme(state.selectedTheme);
        state.currentTopic = topic;
        localStorage.setItem("gameState", JSON.stringify(state));
        setGameState({ ...state });
      }

      if (state.currentPhase === "discussion") {
        setIsTimerRunning(true);
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (!isTimerRunning || !gameState || gameState.currentPhase !== "discussion") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, gameState]);

  const updateGameState = (newState: GameState) => {
    setGameState(newState);
    localStorage.setItem("gameState", JSON.stringify(newState));
  };

  const handlePhaseTransition = () => {
    if (!gameState) return;

    const newState = { ...gameState };

    switch (gameState.currentPhase) {
      case "episodeAnnouncement":
        newState.currentPhase = "episodeTime";
        break;
      case "episodeTime":
        newState.currentPhase = "discussion";
        setTimeRemaining(180);
        setIsTimerRunning(true);
        break;
      case "discussion":
        newState.currentPhase = "voting";
        setVotes({});
        setSuspectedPlayers([]);
        setSkipExile(false);
        setIsTimerRunning(false);
        break;
      case "voting":
        if (skipExile) {
          newState.eliminatedTonight = null;
        } else {
          const voteCounts: { [key: number]: number } = {};
          suspectedPlayers.forEach(playerId => {
            voteCounts[playerId] = (voteCounts[playerId] || 0) + 1;
          });

          let maxVotes = 0;
          let eliminatedId: number | null = null;
          Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
              maxVotes = count;
              eliminatedId = parseInt(id);
            }
          });

          if (eliminatedId !== null) {
            newState.players = eliminatePlayer(newState.players, eliminatedId);
            newState.eliminatedTonight = eliminatedId;
          }
        }

        newState.currentPhase = "voteResult";
        break;
      case "voteResult":
        const winnerAfterVoting = checkGameOver(newState.players);
        if (winnerAfterVoting) {
          newState.winner = winnerAfterVoting;
          newState.currentPhase = "gameOver";
        } else {
          newState.currentDay += 1;
          newState.currentTopic = getTopicForTheme(newState.selectedTheme);
          newState.currentPhase = "episodeAnnouncement";
        }
        newState.eliminatedTonight = null;
        break;
    }

    updateGameState(newState);
  };

  const toggleSuspectedPlayer = (playerId: number) => {
    setSuspectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleChangeTopic = () => {
    if (!gameState) return;
    const newTopic = getTopicForTheme(gameState.selectedTheme);
    const newState = { ...gameState, currentTopic: newTopic };
    updateGameState(newState);
  };

  const handleGenerateAITopic = async () => {
    if (!gameState || isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const topic = await generateAITheme(gameState.selectedTheme, aiCustomPrompt || undefined);
      const newState = { ...gameState, currentTopic: topic };
      updateGameState(newState);
      setAiCustomPrompt("");
    } catch (e) {
      console.error('AI theme generation failed:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem("gameState");
    navigate("/");
  };

  if (!gameState) return null;

  const alivePlayers = gameState.players.filter(p => p.isAlive);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🐺</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">エピソード人狼</h1>
              <p className="text-xs text-gray-500 font-bold">
                {alivePlayers.length}人生存
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 rounded-full shadow-lg">
              <span className="text-white font-black text-base">Day{gameState.currentDay}</span>
            </div>
            <GameMenu mode="normal" />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {/* ゲームオーバー */}
        {gameState.currentPhase === "gameOver" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
              <div className="text-9xl mb-6">
                {gameState.winner === "人狼" ? "🐺" : "👥"}
              </div>
              <h2 className="text-4xl font-black text-gray-800 mb-2">
                {gameState.winner}の勝利！
              </h2>
              <p className="text-gray-600 text-base font-medium">
                {gameState.winner === "人狼"
                  ? "人狼が村を支配しました"
                  : "村人が人狼を追放しました"}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
              <h3 className="text-lg font-black text-gray-800 mb-4 text-center">
                プレイヤー結果
              </h3>
              <div className="space-y-2">
                {gameState.players.map(player => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-xl flex items-center justify-between border-2 ${
                      player.role === "人狼"
                        ? "bg-red-50 border-red-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{player.role === "人狼" ? "🐺" : "👤"}</span>
                      <div>
                        <div className="font-bold text-gray-800">{player.name}</div>
                        <div className="text-xs text-gray-500 font-medium">{player.role}</div>
                      </div>
                    </div>
                    {!player.isAlive && (
                      <Skull className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              新しいゲームを始める
            </button>
          </motion.div>
        )}

        {/* エピソード発表フェーズ */}
        {gameState.currentPhase === "episodeAnnouncement" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-orange-400 to-yellow-400 rounded-3xl shadow-xl p-6 border border-orange-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center shadow-md">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Day{gameState.currentDay}の朝</h2>
                  <p className="text-white/90 text-xs font-bold">MORNING</p>
                </div>
              </div>

              {gameState.eliminatedTonight !== null && (
                <div className="bg-red-500/40 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/50 mb-4">
                  <p className="text-white text-center font-bold text-sm">
                    💀 {gameState.players[gameState.eliminatedTonight].name}さんが<br />
                    人狼に襲われました
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 text-center shadow-lg">
                <div className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-black mb-3">
                  TODAY'S THEME
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-2">
                  {gameState.currentTopic?.category}
                </h3>
                <p className="text-base text-gray-700 font-bold">
                  「{gameState.currentTopic?.topic}」
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-900 leading-relaxed font-medium text-center">
                このテーマでエピソードを話そう<br />
                🐺 人狼=嘘 / 👤 村人=真実
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
              onClick={handlePhaseTransition}
              className="w-full h-14 rounded-xl bg-white text-orange-600 font-black text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-2 border-orange-200"
            >
              <BookOpen className="w-5 h-5" />
              エピソードタイムへ
            </button>
          </motion.div>
        )}

        {/* エピソードタイム */}
        {gameState.currentPhase === "episodeTime" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl shadow-xl p-6 border border-purple-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center shadow-md">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-white">エピソードタイム</h2>
                  <p className="text-white/90 text-xs font-bold">EPISODE TIME</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-xs text-gray-500 mb-1 font-bold">THEME</div>
                <div className="font-black text-gray-800 text-base">
                  {gameState.currentTopic?.category}
                </div>
                <div className="text-gray-700 text-sm font-bold">
                  「{gameState.currentTopic?.topic}」
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-xs text-purple-900 leading-relaxed font-medium text-center">
                🎭 順番は自由！それぞれエピソードを話してください<br />
                🐺 人狼=嘘のエピソード / 👤 村人=本当のエピソード
              </p>
            </div>

            <button
              onClick={handlePhaseTransition}
              className="w-full h-14 rounded-xl bg-white text-purple-600 font-black text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-2 border-purple-200"
            >
              <MessageCircle className="w-5 h-5" />
              議論フェーズへ
            </button>
          </motion.div>
        )}

        {/* 議論フェーズ */}
        {gameState.currentPhase === "discussion" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl shadow-xl p-6 border border-blue-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center shadow-md">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-white">議論タイム</h2>
                  <p className="text-white/90 text-xs font-bold">DISCUSSION</p>
                </div>
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg">
                  <div className={`text-2xl font-black ${timeRemaining <= 30 ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="text-xs text-gray-500 mb-1 font-bold">THEME</div>
                <div className="font-black text-gray-800 text-base">
                  {gameState.currentTopic?.category}
                </div>
                <div className="text-gray-700 text-sm font-bold">
                  「{gameState.currentTopic?.topic}」
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <p className="text-xs text-yellow-900 leading-relaxed font-medium text-center">
                📢 タイマー終了後、みんなで一斉に発表<br />
                🤔 誰が人狼か推理してください
              </p>
            </div>

            <button
              onClick={handlePhaseTransition}
              className="w-full h-14 rounded-xl bg-white text-blue-600 font-black text-base shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-2 border-blue-200"
            >
              <Vote className="w-5 h-5" />
              投票フェーズへ
            </button>
          </motion.div>
        )}

        {/* 投票フェーズ */}
        {gameState.currentPhase === "voting" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-xl p-6 border border-purple-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center shadow-md">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">投票タイム</h2>
                  <p className="text-white/90 text-xs font-bold">VOTING</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <p className="text-xs text-purple-900 text-center font-medium">
                🗳️ 人狼だと疑われたプレイヤーを選択<br />
                複数選択可能
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
              <div className="font-bold text-gray-800 mb-3 text-sm">疑われているプレイヤー</div>
              <div className="grid grid-cols-2 gap-2">
                {alivePlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (skipExile) {
                        setSkipExile(false);
                      }
                      toggleSuspectedPlayer(player.id);
                    }}
                    className={`h-11 rounded-xl font-bold text-sm transition-all ${
                      suspectedPlayers.includes(player.id)
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md scale-105"
                        : "bg-gray-100 text-gray-700 active:scale-95"
                    }`}
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
              <button
                onClick={() => {
                  setSkipExile(!skipExile);
                  if (!skipExile) {
                    setSuspectedPlayers([]);
                  }
                }}
                className={`w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  skipExile
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md scale-105"
                    : "bg-gray-100 text-gray-700 active:scale-95"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                  <path d="M395-235q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM163-480q14-119 104-199.5T479-760q73 0 135 29.5T720-650v-110h80v280H520v-80h168q-32-54-86.5-87T480-680q-88 0-155 57t-81 143h-81Z"/>
                </svg>
                今回は追放しない
              </button>
            </div>

            <button
              onClick={handlePhaseTransition}
              disabled={!skipExile && suspectedPlayers.length === 0}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-base shadow-lg disabled:opacity-50 disabled:scale-100 active:scale-95 transition-transform"
            >
              投票結果を確定
            </button>
          </motion.div>
        )}

        {/* 投票結果フェーズ */}
        {gameState.currentPhase === "voteResult" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
              <div className="text-8xl mb-6">⚖️</div>
              <h2 className="text-3xl font-black text-gray-800 mb-4">
                投票結果
              </h2>
              {gameState.eliminatedTonight !== null ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                  <p className="text-2xl font-black text-red-600 mb-2">
                    {gameState.players[gameState.eliminatedTonight].name}
                  </p>
                  <p className="text-base text-gray-700 font-bold">
                    が追放されました
                  </p>
                  <div className="mt-4 text-5xl">
                    {gameState.players[gameState.eliminatedTonight].role === "人狼" ? "🐺" : "👤"}
                  </div>
                  <div className="mt-2 text-xl font-bold text-gray-700">
                    {gameState.players[gameState.eliminatedTonight].role}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6">
                  <p className="text-2xl font-black text-gray-600 mb-2">
                    誰も追放されませんでした
                  </p>
                  <p className="text-base text-gray-700 font-bold">
                    今回は様子を見ることにしました
                  </p>
                  <div className="mt-4 text-5xl">
                    🤝
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handlePhaseTransition}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base shadow-lg active:scale-95 transition-transform"
            >
              次へ進む
            </button>
          </motion.div>
        )}

        {/* 夜フェーズ */}
        {gameState.currentPhase === "night" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl shadow-xl p-6 border border-slate-600">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-md">
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">夜のフェーズ</h2>
                  <p className="text-white/80 text-xs font-bold">NIGHT</p>
                </div>
              </div>

              <div className="bg-red-500/30 backdrop-blur-sm rounded-2xl p-4 border-2 border-red-400">
                <p className="text-xs text-red-100 text-center leading-relaxed font-medium">
                  🐺 人狼は除外する村人を選択<br />
                  👤 村人は目を閉じて待機
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
              <div className="font-bold text-gray-800 mb-3 text-sm">除外するプレイヤー</div>
              <div className="grid grid-cols-2 gap-2">
                {alivePlayers
                  .filter(p => p.role !== "人狼")
                  .map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player.id)}
                      className={`h-11 rounded-xl font-bold text-sm transition-all ${
                        selectedPlayer === player.id
                          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-700 active:scale-95"
                      }`}
                    >
                      {player.name}
                    </button>
                  ))}
              </div>
            </div>

            <button
              onClick={handlePhaseTransition}
              disabled={selectedPlayer === null}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-black text-base shadow-lg disabled:opacity-50 disabled:scale-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Sun className="w-5 h-5" />
              朝を迎える
            </button>
          </motion.div>
        )}

        {/* プレイヤーステータス */}
        {gameState.currentPhase !== "gameOver" && (
          <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-700" />
              <span className="font-black text-gray-800 text-sm">
                プレイヤー ({alivePlayers.length}人生存)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {gameState.players.map(player => (
                <div
                  key={player.id}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between ${
                    player.isAlive
                      ? "bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200"
                      : "bg-gray-100 opacity-50 border border-gray-200"
                  }`}
                >
                  <span className="text-xs font-bold text-gray-800 truncate">
                    {player.name}
                  </span>
                  {!player.isAlive && (
                    <Skull className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
