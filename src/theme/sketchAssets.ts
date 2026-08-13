/**
 * 手書き素材のrequire()マップ。
 * scripts/slice-sketch.py が自動生成する（手で編集しない）。
 * React Nativeのrequireは静的パスのみ許容するため、ここで一覧化する。
 */

export const sketch = {
  paper: require("../../assets/sketch/paper.jpg"),
  artCampfire: require("../../assets/sketch/art-campfire.png"),
  artCatTheme: require("../../assets/sketch/art-cat-theme.png"),
  artDawnHill: require("../../assets/sketch/art-dawn-hill.png"),
  artPinArrow: require("../../assets/sketch/art-pin-arrow.png"),
  artStopwatch: require("../../assets/sketch/art-stopwatch.png"),
  box: require("../../assets/sketch/box.png"),
  buttonBlack: require("../../assets/sketch/button-black.png"),
  buttonBlackSm: require("../../assets/sketch/button-black-sm.png"),
  buttonBlue: require("../../assets/sketch/button-blue.png"),
  buttonRed: require("../../assets/sketch/button-red.png"),
  digit0: require("../../assets/sketch/digit-0.png"),
  digit1: require("../../assets/sketch/digit-1.png"),
  digit2: require("../../assets/sketch/digit-2.png"),
  digit3: require("../../assets/sketch/digit-3.png"),
  digit4: require("../../assets/sketch/digit-4.png"),
  digit5: require("../../assets/sketch/digit-5.png"),
  digit6: require("../../assets/sketch/digit-6.png"),
  digit7: require("../../assets/sketch/digit-7.png"),
  digit8: require("../../assets/sketch/digit-8.png"),
  digit9: require("../../assets/sketch/digit-9.png"),
  dividerFaint: require("../../assets/sketch/divider-faint.png"),
  dividerFine: require("../../assets/sketch/divider-fine.png"),
  dividerHair: require("../../assets/sketch/divider-hair.png"),
  dividerLong: require("../../assets/sketch/divider-long.png"),
  dividerMedium: require("../../assets/sketch/divider-medium.png"),
  dividerShort: require("../../assets/sketch/divider-short.png"),
  dividerTapered: require("../../assets/sketch/divider-tapered.png"),
  dividerTiny: require("../../assets/sketch/divider-tiny.png"),
  frameBottom: require("../../assets/sketch/frame-bottom.png"),
  frameTheme: require("../../assets/sketch/frame-theme.png"),
  frameTop: require("../../assets/sketch/frame-top.png"),
  humanOutline: require("../../assets/sketch/human-outline.png"),
  humanSolid: require("../../assets/sketch/human-solid.png"),
  iconMenu: require("../../assets/sketch/icon-menu.png"),
  iconSunrise: require("../../assets/sketch/icon-sunrise.png"),
  pill: require("../../assets/sketch/pill.png"),
  pillAi: require("../../assets/sketch/pill-ai.png"),
  pillLg: require("../../assets/sketch/pill-lg.png"),
  pillLgShadow: require("../../assets/sketch/pill-lg-shadow.png"),
  pillSelected: require("../../assets/sketch/pill-selected.png"),
  pillSm: require("../../assets/sketch/pill-sm.png"),
  pillSmShadow: require("../../assets/sketch/pill-sm-shadow.png"),
  resultMakeinu: require("../../assets/sketch/result-makeinu.png"),
  resultVillagerWin: require("../../assets/sketch/result-villager-win.png"),
  resultWolfWin: require("../../assets/sketch/result-wolf-win.png"),
  roleVillagerPome: require("../../assets/sketch/role-villager-pome.png"),
  roleVillagerRagdoll: require("../../assets/sketch/role-villager-ragdoll.png"),
  roleVillagerScotish: require("../../assets/sketch/role-villager-scotish.png"),
  roleWolfChiwawa: require("../../assets/sketch/role-wolf-chiwawa.png"),
  stepperMinus: require("../../assets/sketch/stepper-minus.png"),
  stepperPlus: require("../../assets/sketch/stepper-plus.png"),
} as const;

export type SketchName = keyof typeof sketch;

/**
 * 手書き数字 0-9。人数表示などで画像として組む。
 * 寸法は実行時に解決せずここに焼き込む（react-native-web には
 * Image.resolveAssetSource が無いため）。高さは全桁共通。
 */
export const sketchDigits = [
  { source: sketch.digit0, width: 15, height: 26 },
  { source: sketch.digit1, width: 6, height: 26 },
  { source: sketch.digit2, width: 17, height: 26 },
  { source: sketch.digit3, width: 10, height: 26 },
  { source: sketch.digit4, width: 14, height: 26 },
  { source: sketch.digit5, width: 14, height: 26 },
  { source: sketch.digit6, width: 11, height: 26 },
  { source: sketch.digit7, width: 12, height: 26 },
  { source: sketch.digit8, width: 16, height: 26 },
  { source: sketch.digit9, width: 13, height: 26 },
] as const;

/**
 * 横に伸ばして使うパーツの3スライス。
 * width/height は元画像の実寸、cap は端キャップの幅（元画像基準）。
 * 描画時は height から倍率を出し、cap を同じ倍率で拡縮する。
 */
export const sketchSlices = {
  frameTheme: {
    left: require("../../assets/sketch/slices/frame-theme-l.png"),
    middle: require("../../assets/sketch/slices/frame-theme-m.png"),
    right: require("../../assets/sketch/slices/frame-theme-r.png"),
    width: 595,
    height: 217,
    cap: 152,
  },
  buttonBlack: {
    left: require("../../assets/sketch/slices/button-black-l.png"),
    middle: require("../../assets/sketch/slices/button-black-m.png"),
    right: require("../../assets/sketch/slices/button-black-r.png"),
    width: 605,
    height: 129,
    cap: 90,
  },
  buttonBlackSm: {
    left: require("../../assets/sketch/slices/button-black-sm-l.png"),
    middle: require("../../assets/sketch/slices/button-black-sm-m.png"),
    right: require("../../assets/sketch/slices/button-black-sm-r.png"),
    width: 142,
    height: 34,
    cap: 24,
  },
  buttonBlue: {
    left: require("../../assets/sketch/slices/button-blue-l.png"),
    middle: require("../../assets/sketch/slices/button-blue-m.png"),
    right: require("../../assets/sketch/slices/button-blue-r.png"),
    width: 533,
    height: 124,
    cap: 87,
  },
  buttonRed: {
    left: require("../../assets/sketch/slices/button-red-l.png"),
    middle: require("../../assets/sketch/slices/button-red-m.png"),
    right: require("../../assets/sketch/slices/button-red-r.png"),
    width: 522,
    height: 124,
    cap: 87,
  },
  box: {
    left: require("../../assets/sketch/slices/box-l.png"),
    middle: require("../../assets/sketch/slices/box-m.png"),
    right: require("../../assets/sketch/slices/box-r.png"),
    width: 552,
    height: 95,
    cap: 66,
  },
  pill: {
    left: require("../../assets/sketch/slices/pill-l.png"),
    middle: require("../../assets/sketch/slices/pill-m.png"),
    right: require("../../assets/sketch/slices/pill-r.png"),
    width: 279,
    height: 63,
    cap: 44,
  },
  pillSelected: {
    left: require("../../assets/sketch/slices/pill-selected-l.png"),
    middle: require("../../assets/sketch/slices/pill-selected-m.png"),
    right: require("../../assets/sketch/slices/pill-selected-r.png"),
    width: 281,
    height: 64,
    cap: 45,
  },
  pillAi: {
    left: require("../../assets/sketch/slices/pill-ai-l.png"),
    middle: require("../../assets/sketch/slices/pill-ai-m.png"),
    right: require("../../assets/sketch/slices/pill-ai-r.png"),
    width: 278,
    height: 64,
    cap: 45,
  },
  frameTop: {
    left: require("../../assets/sketch/slices/frame-top-l.png"),
    middle: require("../../assets/sketch/slices/frame-top-m.png"),
    right: require("../../assets/sketch/slices/frame-top-r.png"),
    width: 675,
    height: 55,
    cap: 38,
  },
  frameBottom: {
    left: require("../../assets/sketch/slices/frame-bottom-l.png"),
    middle: require("../../assets/sketch/slices/frame-bottom-m.png"),
    right: require("../../assets/sketch/slices/frame-bottom-r.png"),
    width: 679,
    height: 57,
    cap: 40,
  },
} as const;

export type SketchSliceName = keyof typeof sketchSlices;

/**
 * 役職の手書きイラスト。役職ごとに複数の絵を持ち、プレイヤーごとに振り分ける。
 * 縦横比が絵ごとに違うため寸法を焼き込む（実行時に解決できない）。
 */
export const sketchRoleArt = {
  "人狼": [
    { source: sketch.roleWolfChiwawa, width: 443, height: 640 },
  ],
  "村人": [
    { source: sketch.roleVillagerPome, width: 633, height: 640 },
    { source: sketch.roleVillagerRagdoll, width: 445, height: 640 },
    { source: sketch.roleVillagerScotish, width: 446, height: 640 },
  ],
} as const;
