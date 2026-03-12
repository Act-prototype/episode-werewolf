import { useState } from "react";
import { Menu, X, Home, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

interface GameMenuProps {
  mode: "normal" | "card";
}

export function GameMenu({ mode }: GameMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const navigate = useNavigate();

  const handleGoHome = () => {
    setShowConfirmDialog(true);
  };

  const confirmGoHome = () => {
    localStorage.removeItem("gameState");
    localStorage.removeItem("cardGameState");
    navigate("/");
  };

  const handleShowRules = () => {
    setShowRulesDialog(true);
    setIsOpen(false);
  };

  return (
    <>
      {/* メニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-all border border-gray-200"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* メニューオーバーレイ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* メニューパネル */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* ヘッダー */}
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white">メニュー</h2>
                    <p className="text-white/80 text-xs font-bold mt-1">
                      {mode === "normal" ? "通常モード" : "カードバトル"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* メニュー項目 */}
              <div className="flex-1 p-4 space-y-2">
                <button
                  onClick={handleShowRules}
                  className="w-full h-16 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 flex items-center gap-4 px-5 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-800 text-base">ルール説明</div>
                    <div className="text-xs text-gray-600 font-bold">遊び方を確認</div>
                  </div>
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-full h-16 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 flex items-center gap-4 px-5 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-gray-800 text-base">ホームに戻る</div>
                    <div className="text-xs text-gray-600 font-bold">ゲームを終了</div>
                  </div>
                </button>
              </div>

              {/* フッター */}
              <div className="p-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center font-medium">
                  エピソード人狼 v1.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {showConfirmDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowConfirmDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    ゲームを終了しますか？
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">
                    現在のゲーム進行状況は失われます
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={confirmGoHome}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                  >
                    終了してホームへ
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="w-full h-12 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm active:scale-95 transition-all"
                  >
                    キャンセル
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ルール説明ダイアログ */}
      <AnimatePresence>
        {showRulesDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRulesDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
              >
                {/* ヘッダー */}
                <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white">ルール説明</h3>
                    <button
                      onClick={() => setShowRulesDialog(false)}
                      className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {mode === "normal" ? (
                    <>
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">🎯</span>
                          基本ルール
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          エピソードテーマに沿って、村人は真実、人狼は嘘のエピソードを話します。議論と投票で人狼を見破りましょう！
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">🏆</span>
                          勝利条件
                        </h4>
                        <ul className="text-sm text-gray-700 space-y-1 font-medium">
                          <li>👤 <strong>村人</strong>：全ての人狼を追放</li>
                          <li>🐺 <strong>人狼</strong>：村人と同数以上になる</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">📖</span>
                          ゲームの流れ
                        </h4>
                        <ol className="text-sm text-gray-700 space-y-1 font-medium list-decimal list-inside">
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
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">🎯</span>
                          基本ルール
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          各プレイヤーに村人カードと人狼カードが配られます。毎ラウンド1枚選んでエピソードを話し、人狼カードを見破りましょう！
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">🏆</span>
                          勝利条件
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          全てのカードを使い切った人が勝ち！同時の場合は人狼カード使用数が多い方が勝利。
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">📖</span>
                          ゲームの流れ
                        </h4>
                        <ol className="text-sm text-gray-700 space-y-1 font-medium list-decimal list-inside">
                          <li>全員がカードを1枚選択</li>
                          <li>順番にエピソードを発表</li>
                          <li>ダウトタイム（疑う人を選択）</li>
                          <li>カード公開と判定</li>
                          <li>失敗した方に+1枚</li>
                          <li>誰かが全カード使い切るまで</li>
                        </ol>
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                        <h4 className="font-black text-gray-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">💡</span>
                          ダウトのコツ
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          ダウト成功で相手に+1枚、失敗で自分に+1枚。確信がない時はパスも戦略！
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* フッター */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowRulesDialog(false)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm shadow-lg active:scale-95 transition-all"
                  >
                    閉じる
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
