module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4 はワークレット処理を react-native-worklets に分離。
    // プラグインは最後に置く。
    plugins: ["react-native-worklets/plugin"],
  };
};
