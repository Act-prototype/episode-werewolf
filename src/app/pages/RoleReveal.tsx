import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { EyeOff, ArrowRight } from "lucide-react";
import { GameState } from "../types/game";
import { assignRoles } from "../utils/gameLogic";
import { motion, AnimatePresence } from "motion/react";
import { GameMenu } from "../components/GameMenu";

export default function RoleReveal() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRoleVisible, setIsRoleVisible] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      const state: GameState = JSON.parse(savedState);

      if (!state.players[0].role) {
        const roles = assignRoles(state.players.length, state.werewolfCount);
        state.players = state.players.map((player, index) => ({
          ...player,
          role: roles[index]
        }));
        localStorage.setItem("gameState", JSON.stringify(state));
      }

      setGameState(state);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleRevealRole = () => {
    setIsRoleVisible(true);
  };

  const handleNext = () => {
    if (!gameState) return;

    const updatedPlayers = [...gameState.players];
    updatedPlayers[currentPlayerIndex].hasSeenRole = true;

    if (currentPlayerIndex < gameState.players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setIsRoleVisible(false);

      const updatedState = { ...gameState, players: updatedPlayers };
      setGameState(updatedState);
      localStorage.setItem("gameState", JSON.stringify(updatedState));
    } else {
      const updatedState = {
        ...gameState,
        players: updatedPlayers,
        currentPhase: "episodeAnnouncement" as const
      };
      localStorage.setItem("gameState", JSON.stringify(updatedState));
      navigate("/game");
    }
  };

  if (!gameState) return null;

  const currentPlayer = gameState.players[currentPlayerIndex];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-gray-50 flex flex-col shadow-xl">
      {/* プログレスバー */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-800 font-black">役割確認</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-800 font-black">
                {currentPlayerIndex + 1} / {gameState.players.length}
              </span>
              <GameMenu mode="normal" showRules={false} />
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gray-900 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${((currentPlayerIndex + 1) / gameState.players.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {!isRoleVisible ? (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                <motion.div
                  className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-gray-200"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="w-32 h-32 mx-auto bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                    <span className="text-7xl">👤</span>
                  </div>
                  <h2 className="text-5xl font-black text-gray-800 mb-3 tracking-tight">
                    {currentPlayer.name}
                  </h2>
                  <p className="text-gray-500 font-bold text-lg">あなたの番です</p>
                </motion.div>

                <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-600 text-center leading-relaxed font-bold">
                    ⚠️ 他のプレイヤーに見られないように<br />
                    あなたの役割を確認してください
                  </p>
                </div>

                <button
                  onClick={handleRevealRole}
                  className="w-full h-20 rounded-2xl bg-gray-900 text-white font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <EyeOff className="w-7 h-7" />
                  役割を見る
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="visible"
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <motion.div
                  className={`rounded-3xl shadow-2xl p-14 text-center border-4 ${
                    currentPlayer.role === "人狼"
                      ? "bg-gradient-to-br from-red-600 to-rose-600 border-red-300/50"
                      : "bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-300/50"
                  }`}
                  initial={{ rotateY: 180 }}
                  animate={{ rotateY: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="text-9xl mb-6">
                    {currentPlayer.role === "人狼" ? "🐺" : "👤"}
                  </div>
                  <div className="text-6xl font-black text-white mb-3 tracking-tight">
                    {currentPlayer.role}
                  </div>
                  <div className="text-white/90 text-xl font-black tracking-widest">
                    {currentPlayer.role === "人狼" ? "WEREWOLF" : "VILLAGER"}
                  </div>
                </motion.div>

                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
                  <div className="space-y-3">
                    {currentPlayer.role === "人狼" ? (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                          <span className="text-3xl">🎭</span>
                          <span className="text-sm font-black text-gray-800">嘘のエピソードを話す</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                          <span className="text-3xl">🤫</span>
                          <span className="text-sm font-black text-gray-800">正体がバレないように演技</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                          <span className="text-3xl">🏆</span>
                          <span className="text-sm font-black text-gray-800">村人と同数以上で勝利</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <span className="text-3xl">✨</span>
                          <span className="text-sm font-black text-gray-800">真実のエピソードを話す</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <span className="text-3xl">🗳️</span>
                          <span className="text-sm font-black text-gray-800">議論と投票で人狼を探す</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <span className="text-3xl">🏆</span>
                          <span className="text-sm font-black text-gray-800">全ての人狼を追放で勝利</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full h-20 rounded-2xl bg-gray-900 text-white font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {currentPlayerIndex < gameState.players.length - 1 ? (
                    <>
                      次のプレイヤーへ
                      <ArrowRight className="w-7 h-7" />
                    </>
                  ) : (
                    <>
                      ゲーム開始
                      <span className="text-2xl">🎮</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
}
