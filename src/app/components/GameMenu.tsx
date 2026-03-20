import { useState } from "react";
import { Menu, X, Home, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

interface GameMenuProps {
  mode: "normal" | "card";
  showRules?: boolean;
}

export function GameMenu({ mode, showRules = true }: GameMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const navigate = useNavigate();

  const confirmGoHome = () => {
    localStorage.removeItem("gameState");
    localStorage.removeItem("cardState");
    navigate("/");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center active:scale-95 transition-all"
      >
        <Menu className="w-5 h-5 text-gray-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 max-w-[80vw] bg-gray-900 z-50 flex flex-col"
            >
              <div className="px-5 py-5 flex items-center justify-between border-b border-gray-800">
                <span className="text-lg font-black text-white">メニュー</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 p-4 space-y-2">
                {showRules && (
                  <button
                    onClick={() => {
                      setShowRulesDialog(true);
                      setIsOpen(false);
                    }}
                    className="w-full h-14 rounded-xl bg-gray-800 flex items-center gap-3 px-4 active:scale-95 transition-all hover:bg-gray-750"
                  >
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-white text-sm">ルール説明</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowConfirmDialog(true);
                    setIsOpen(false);
                  }}
                  className="w-full h-14 rounded-xl bg-gray-800 flex items-center gap-3 px-4 active:scale-95 transition-all hover:bg-gray-750"
                >
                  <Home className="w-5 h-5 text-gray-400" />
                  <span className="font-bold text-white text-sm">ホームに戻る</span>
                </button>
              </div>

              <div className="px-5 py-4 border-t border-gray-800">
                <p className="text-xs text-gray-600 text-center">エピソード人狼 v1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full"
            >
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">
                  ホームに戻りますか？
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  ゲームの進行状況は失われます
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={confirmGoHome}
                  className="w-full h-11 rounded-xl bg-gray-900 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  ホームへ戻る
                </button>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="w-full h-11 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm active:scale-95 transition-all"
                >
                  キャンセル
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ルール説明ダイアログ */}
      <AnimatePresence>
        {showRulesDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRulesDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-800">ルール説明</h3>
                <button
                  onClick={() => setShowRulesDialog(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {mode === "normal" ? (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">🎯 基本ルール</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        エピソードテーマに沿って、村人は真実、人狼は嘘のエピソードを話します。議論と投票で人狼を見破りましょう！
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">🏆 勝利条件</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>👤 <strong>村人</strong>：全ての人狼を追放</li>
                        <li>🐺 <strong>人狼</strong>：村人と同数以上になる</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">📖 ゲームの流れ</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>エピソードテーマ発表</li>
                        <li>エピソードタイム（自由に話す）</li>
                        <li>議論タイム（3分間）</li>
                        <li>投票で人狼を追放</li>
                        <li>勝利条件まで繰り返し</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">🎯 基本ルール</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        各プレイヤーに村人カードと人狼カードが配られます。毎ラウンド1枚選んでエピソードを話し、人狼カードを見破りましょう！
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">🏆 勝利条件</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        全てのカードを使い切った人が勝ち！同時の場合は人狼カード使用数が多い方が勝利。
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">📖 ゲームの流れ</h4>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>全員がカードを1枚選択</li>
                        <li>順番にエピソードを発表</li>
                        <li>ダウトタイム（疑う人を選択）</li>
                        <li>カード公開と判定</li>
                        <li>失敗した方に+1枚</li>
                        <li>誰かが全カード使い切るまで</li>
                      </ol>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-black text-gray-800 mb-2 text-sm">💡 ダウトのコツ</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        ダウト成功で相手に+1枚、失敗で自分に+1枚。確信がない時はパスも戦略！
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowRulesDialog(false)}
                  className="w-full h-11 rounded-xl bg-gray-900 text-white font-bold text-sm active:scale-95 transition-all"
                >
                  閉じる
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
