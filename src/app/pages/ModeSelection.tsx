import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ModeSelection() {
  const navigate = useNavigate();
  const [expandedMode, setExpandedMode] = useState<"normal" | "card" | null>(null);

  const handleModeSelect = (mode: "normal" | "card") => {
    if (mode === "normal") {
      navigate("/setup-normal");
    } else {
      navigate("/setup-card");
    }
  };

  const toggleExpand = (mode: "normal" | "card") => {
    setExpandedMode(expandedMode === mode ? null : mode);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-white flex flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-4 shadow-xl">
              <span className="text-5xl">🐺</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">エピソード人狼</h1>
            <p className="text-white/90 text-sm font-medium tracking-wider">EPISODE WEREWOLF</p>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto px-5 py-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-black text-gray-800 mb-2">ゲームモードを選択</h2>
            <p className="text-sm text-gray-600 font-bold">ルールを確認して遊び方を選んでください</p>
          </div>

          <div className="space-y-4">
            {/* 通常モード */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden">
              <button
                onClick={() => toggleExpand("normal")}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">👥</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-gray-800">通常モード</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 font-bold">3人以上</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-black rounded-full">
                        大人数におすすめ
                      </span>
                    </div>
                  </div>
                </div>
                {expandedMode === "normal" ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {expandedMode === "normal" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4">
                      {/* ルール説明 */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border-2 border-amber-200">
                        <h4 className="font-black text-amber-900 mb-2">📖 ルール</h4>
                        <ul className="text-sm text-amber-900 space-y-1.5 font-bold">
                          <li>• 各プレイヤーに役割（村人 or 人狼）が配られます</li>
                          <li>• 人狼は<strong>嘘のエピソード</strong>を話します</li>
                          <li>• 村人は<strong>本当のエピソード</strong>を話します</li>
                          <li>• 議論後に投票で人狼を見つけ出します</li>
                          <li>• 人狼を全員追放すれば村人の勝ち</li>
                          <li>• 人狼の数 ≧ 村人の数になったら人狼の勝ち</li>
                        </ul>
                      </div>

                      {/* 選択ボタン */}
                      <button
                        onClick={() => handleModeSelect("normal")}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                      >
                        通常モードで遊ぶ 🎮
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* カードモード */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100/50 overflow-hidden">
              <button
                onClick={() => toggleExpand("card")}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-4xl">🎴</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-gray-800">カードモード</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 font-bold">2人以上</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-black rounded-full">
                        二人でも楽しめる
                      </span>
                    </div>
                  </div>
                </div>
                {expandedMode === "card" ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {expandedMode === "card" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4">
                      {/* ルール説明 */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                        <h4 className="font-black text-blue-900 mb-2">📖 ルール</h4>
                        <ul className="text-sm text-blue-900 space-y-1.5 font-bold">
                          <li>• 各プレイヤーに伏せカードが配られます</li>
                          <li>• 人狼カード🐺 = 嘘のエピソード</li>
                          <li>• 村人カード👤 = 本当のエピソード</li>
                          <li>• 順番にカードを1枚選んでエピソードを話す</li>
                          <li>• 他プレイヤーは「ダウト！」できる</li>
                          <li>• ダウト成功 = カード出した人に+1枚</li>
                          <li>• ダウト失敗 = ダウトした人に+1枚</li>
                          <li>• <strong>全カード使い切った人が勝ち！</strong></li>
                          <li>• 同時使い切り = 人狼カード使用数で判定</li>
                        </ul>
                      </div>

                      {/* 選択ボタン */}
                      <button
                        onClick={() => handleModeSelect("card")}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                      >
                        カードモードで遊ぶ 🎴
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
