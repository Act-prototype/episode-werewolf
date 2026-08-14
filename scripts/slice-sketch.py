#!/usr/bin/env python3
"""手書き素材シートを個別パーツPNGへ切り出す。

assets/sketch/raw/*.png は「透過背景に手書きパーツが並んだシート」。
アルファチャンネルの不透明な塊（島）を検出して自動でbboxを取り、
MANIFEST の名前で assets/sketch/ に書き出す。あわせて
src/theme/sketchAssets.ts（require()マップ）を生成する。

  python3 scripts/slice-sketch.py          # スライス + マップ生成
  python3 scripts/slice-sketch.py --probe  # 検出結果に番号を振ったコンタクトシートを出力

素材を差し替えたら再実行すれば同じ結果が再現される（検出は決定的）。
MANIFEST に無い島は assets/sketch/_unnamed/ に落ちるので、--probe で確認して命名する。
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "sketch" / "raw"
OUT = ROOT / "assets" / "sketch"
TS_OUT = ROOT / "src" / "theme" / "sketchAssets.ts"

# 検出パラメータ。gap = パーツ間の最小空白px（これ未満は同一パーツ扱い）
# minArea = これ未満の面積は無視。数字や記号は細いのでシート毎に下げる。
ALPHA_THRESHOLD = 16
DEFAULT_MIN_AREA = 300

# シートごとの設定と、検出順（上→下、同バンド内は左→右）に対応する名前。
# None は使わないパーツ（重複・不要）。
SHEETS: dict[str, dict] = {
    # 設定画面のシート。枠は「上アーチ」「下アーチ」が別パーツで、2枚を離して置くと
    # 左右が開いた囲みになる（Figmaの Window01/02/03 がこの使い方）。
    "sheet-setup.png": {
        "gap": 6,
        "names": [
            "frame-top",  # 囲みの上アーチ
            None,  # ステッパーの短い罫線（同じものが2本並ぶので1本だけ採用）
            "divider-tiny",
            "frame-bottom",  # 囲みの下アーチ
            None,  # 以降のアーチは同一素材の再掲
            "divider-medium",  # 見出し下の罫線
            "pill",  # テーマ選択ピル（未選択）
            None,  # 同じピルが並ぶだけ
            None,
            None,
            None,
            None,
            "pill-selected",  # 黒塗りピル（選択中）
            "pill-ai",  # キラキラ付きピル（AIでつくる）
            None,
            None,
            "divider-short",
            "box",  # プレイヤー名の入力ボックス
            None,
            None,
            None,
            "button-black",  # 主ボタン。全シート中この個体が最も高解像度
        ],
    },
    # モード選択のシート。青／赤ボタンと手順リストの数字。
    # 数字は sheet-parts に0-9が揃っているため、統一のためこちらは採用しない。
    "sheet-mode.png": {
        "gap": 6,
        "names": [
            "divider-long",
            None,  # 手順番号 1
            None,  # 手順番号 2
            None,  # 手順番号 3
            None,  # 手順番号 4
            "button-blue",  # ノーマルモード
            None,  # 以降は上半分と同じ構成の再掲
            None,
            None,
            None,
            None,
            "button-red",  # カードモード
        ],
    },
    "sheet-hero-solid.png": {
        "gap": 8,
        "names": ["human-solid", None, None],  # 役職確認の人型（塗り）
    },
    "sheet-hero-outline.png": {
        "gap": 8,
        "names": ["human-outline", None, None],  # 同（線画）
    },
    # ゲーム進行画面のシート。日の出アイコン・メニューの3本線・テーマ表示の枠。
    "sheet-game.png": {
        "gap": 6,
        "minArea": 600,
        "names": [
            "icon-sunrise",  # ヘッダーの「N日目」に添える日の出
            None,  # 日の出の下に散った極薄のかすれ
            None,
            "icon-menu",  # ハンバーガーの3本線
            "frame-theme",  # テーマ表示の角丸枠（横に伸ばして使う）
        ],
    },
    # 数字・記号・影付きピル・罫線のシート。縦2pxしか離れていない箇所があるため vGap を詰める。
    "sheet-parts.png": {
        "gap": 6,
        "vGap": 2,
        "minArea": 40,
        "names": [
            "pill-sm",
            "pill-lg",
            "pill-sm-shadow",
            "pill-lg-shadow",
            "stepper-minus",
            "stepper-plus",
            "digit-0",
            "digit-1",
            "digit-2",
            "digit-3",
            "digit-4",
            "digit-5",
            "digit-6",
            "digit-7",
            "digit-8",
            "digit-9",
            "divider-tapered",
            "button-black-sm",
            None,  # button-black と同じもの（設定シートの方が高解像度）
            "divider-hair",
            "divider-fine",
            "divider-faint",
        ],
    },
}


def find_islands(
    im: Image.Image,
    v_gap: int,
    h_gap: int,
    min_area: int = DEFAULT_MIN_AREA,
) -> list[tuple[int, int, int, int]]:
    """不透明な塊のbboxを (x0, y0, x1, y1) で上→下・左→右順に返す。

    縦と横で許容する空白幅を分けている。シート上では別パーツが縦に2pxしか
    離れていないことがある一方、横は同一パーツ内の筆の途切れを繋ぎたいため。
    """
    alpha = im.split()[3]
    w, h = im.size
    px = alpha.load()

    def runs(flags: list[bool], gap: int) -> list[tuple[int, int]]:
        """不透明な連続区間を取り、gap未満しか離れていない区間同士は繋げて返す。

        区間の幅で間引いてはいけない（数字の「1」のような細いパーツが消える）。
        小さすぎるものの除外は min_area 側で行う。
        """
        spans: list[tuple[int, int]] = []
        start = None
        for i, on in enumerate(flags + [False]):
            if on and start is None:
                start = i
            elif not on and start is not None:
                spans.append((start, i))
                start = None
        merged: list[list[int]] = []
        for s, e in spans:
            if merged and s - merged[-1][1] < gap:
                merged[-1][1] = e
            else:
                merged.append([s, e])
        return [(s, e) for s, e in merged]

    rows = [any(px[x, y] > ALPHA_THRESHOLD for x in range(0, w, 2)) for y in range(h)]
    boxes: list[tuple[int, int, int, int]] = []
    for y0, y1 in runs(rows, v_gap):
        cols = [any(px[x, y] > ALPHA_THRESHOLD for y in range(y0, y1)) for x in range(w)]
        for x0, x1 in runs(cols, h_gap):
            if (x1 - x0) * (y1 - y0) >= min_area:
                boxes.append((x0, y0, x1, y1))
    return boxes


def probe() -> None:
    """検出結果に番号を振ったコンタクトシートを assets/sketch/_probe/ に出力。"""
    probe_dir = OUT / "_probe"
    probe_dir.mkdir(parents=True, exist_ok=True)
    for sheet, cfg in SHEETS.items():
        im = Image.open(RAW / sheet).convert("RGBA")
        boxes = find_islands(im, cfg.get("vGap", cfg["gap"]), cfg.get("hGap", cfg["gap"]), cfg.get("minArea", DEFAULT_MIN_AREA))
        width = 720
        crops = []
        for b in boxes:
            c = im.crop(b)
            c = c.crop(c.getbbox())
            scale = min(1.0, (width - 60) / c.width)
            crops.append(c.resize((max(1, int(c.width * scale)), max(1, int(c.height * scale)))))
        height = sum(c.height + 14 for c in crops) + 14
        sheet_img = Image.new("RGBA", (width, height), (246, 239, 231, 255))
        draw = ImageDraw.Draw(sheet_img)
        y = 14
        for i, c in enumerate(crops):
            sheet_img.paste(c, (56, y), c)
            draw.text((10, y + c.height // 2 - 4), str(i), fill=(200, 60, 60))
            y += c.height + 14
        dest = probe_dir / f"{Path(sheet).stem}-probe.png"
        sheet_img.convert("RGB").save(dest)
        expected = len(cfg["names"])
        flag = "" if expected == len(boxes) else f"  <-- MANIFEST は {expected} 件"
        print(f"{sheet}: {len(boxes)} parts -> {dest.relative_to(ROOT)}{flag}")


def slice_all() -> list[str]:
    unnamed_dir = OUT / "_unnamed"
    written: list[str] = []
    for sheet, cfg in SHEETS.items():
        im = Image.open(RAW / sheet).convert("RGBA")
        boxes = find_islands(im, cfg.get("vGap", cfg["gap"]), cfg.get("hGap", cfg["gap"]), cfg.get("minArea", DEFAULT_MIN_AREA))
        names = cfg["names"]
        if len(boxes) != len(names):
            print(
                f"warn: {sheet} は {len(boxes)} 件検出だが MANIFEST は {len(names)} 件。"
                " --probe で確認して SHEETS を更新してください。",
                file=sys.stderr,
            )
        for i, b in enumerate(boxes):
            crop = im.crop(b)
            name = names[i] if i < len(names) else None
            bbox = crop.getbbox()
            if name and name.startswith("digit-"):
                # 数字は横だけトリムし、帯の高さは全桁で共通に保つ。
                # 上下も詰めると 0 と 9 で基線がずれて数字が踊る。
                crop = crop.crop((bbox[0], 0, bbox[2], crop.height))
            else:
                crop = crop.crop(bbox)  # 余白を完全にトリム
            if name is None:
                unnamed_dir.mkdir(parents=True, exist_ok=True)
                crop.save(unnamed_dir / f"{Path(sheet).stem}-{i:02d}.png")
                continue
            crop.save(OUT / f"{name}.png")
            written.append(name)
            print(f"{name}.png  {crop.width}x{crop.height}")
    return written


# 役職のイラスト。1枚絵で渡されるので透明余白をトリムして表示サイズ相当まで縮める。
# 役職ごとに複数の絵を持てる（プレイヤーごとに振り分ける）。
# maxDim は長辺の上限px。実機3x（役職カードは高さ170pt前後）を賄える値。
ROLE_ART_MAX_DIM = 640
ROLE_ART: dict[str, list[dict]] = {
    "人狼": [{"file": "chiwawa.png", "name": "role-wolf-chiwawa"}],
    "村人": [
        {"file": "pome.png", "name": "role-villager-pome"},
        {"file": "ragdoll.png", "name": "role-villager-ragdoll"},
        {"file": "scotish.png", "name": "role-villager-scotish"},
        {"file": "ball_cat.png", "name": "role-villager-ballcat"},
    ],
}


# 1枚に1パーツだけの素材。透明余白をトリムするだけで、そのまま個別パーツになる。
# maxDim は長辺の上限px（実機3xを賄える値。下回る素材は拡大しない）。
SINGLES: dict[str, dict] = {
    "art-stopwatch.png": {"name": "art-stopwatch", "maxDim": 1200},
    # Figma上で180°回して配置されている素材。使う向き（丘が下・太陽が右）に直す
    "art-dawn-hill.png": {"name": "art-dawn-hill", "maxDim": 1400, "flipY": True, "flipX": True},
    "art-campfire.png": {"name": "art-campfire", "maxDim": 1200},
    # テーマ発表でテーマ枠を持ち上げる猫。素材が1x相当（83x163）なので縮小はしない
    "art-cat-theme.png": {"name": "art-cat-theme", "maxDim": 1200},
    "art-pin-arrow.png": {"name": "art-pin-arrow", "maxDim": 400},
    # 勝敗発表の手書き見出し。表示幅280pt前後なので3xで840px相当あれば足りる
    "result-wolf-win.png": {"name": "result-wolf-win", "maxDim": 900},
    "result-villager-win.png": {"name": "result-villager-win", "maxDim": 900},
    # 「負け犬」は表示幅80pt前後と小さい
    "result-makeinu.png": {"name": "result-makeinu", "maxDim": 400},
}


def process_singles() -> list[str]:
    """1パーツだけの素材をトリムして assets/sketch/ に書き出す。"""
    written: list[str] = []
    for src_name, cfg in SINGLES.items():
        src = RAW / src_name
        if not src.exists():
            print(f"warn: raw/{src_name} が無いのでスキップ", file=sys.stderr)
            continue
        im = Image.open(src).convert("RGBA")
        im = im.crop(im.getbbox())
        if cfg.get("flipY"):
            im = im.transpose(Image.FLIP_TOP_BOTTOM)
        if cfg.get("flipX"):
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        scale = min(1.0, cfg["maxDim"] / max(im.size))
        if scale < 1.0:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        im.save(OUT / f"{cfg['name']}.png")
        written.append(cfg["name"])
        print(f"{cfg['name']}.png  {im.width}x{im.height}")
    return written


def process_role_art() -> list[str]:
    """役職イラストをトリム・縮小して assets/sketch/ に書き出す。"""
    written: list[str] = []
    for role, variants in ROLE_ART.items():
        for cfg in variants:
            src = RAW / cfg["file"]
            if not src.exists():
                print(f"warn: raw/{cfg['file']} が無いのでスキップ", file=sys.stderr)
                continue
            im = Image.open(src).convert("RGBA")
            im = im.crop(im.getbbox())  # 透明な余白を落とす
            scale = min(1.0, ROLE_ART_MAX_DIM / max(im.size))
            if scale < 1.0:
                im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
            im.save(OUT / f"{cfg['name']}.png")
            written.append(cfg["name"])
            print(f"{cfg['name']}.png  {im.width}x{im.height}  ({role})")
    return written


# 幅を可変にしたいパーツ。左端・中央・右端の3枚に切り、中央だけ横に伸ばして使う
# （1枚をそのまま伸ばすと角の手描きカーブが潰れる）。
STRETCHABLE = [
    "frame-theme",
    "button-black",
    "button-black-sm",
    "button-blue",
    "button-red",
    "box",
    "pill",
    "pill-selected",
    "pill-ai",
    "frame-top",
    "frame-bottom",
]

def make_slices() -> dict[str, dict]:
    """STRETCHABLE のパーツを3分割して書き出し、寸法メタデータを返す。

    中央スライスは「両キャップの間の全域」を使う。細い帯だけ切り出して大きく
    引き伸ばすと鉛筆の粒子と線の揺れが消え、キャップとの継ぎ目が段差に見える。
    全域を使えば実寸に近い幅で描くかぎり倍率がほぼ1倍に収まり、質感が保たれる。
    """
    meta: dict[str, dict] = {}
    slice_dir = OUT / "slices"
    slice_dir.mkdir(parents=True, exist_ok=True)
    for name in STRETCHABLE:
        src = OUT / f"{name}.png"
        if not src.exists():
            print(f"warn: {name}.png が無いのでスライスをスキップ", file=sys.stderr)
            continue
        im = Image.open(src).convert("RGBA")
        w, h = im.size
        # 端キャップは高さの7割程度（角のカーブが収まる幅）。中央に最低16pxは残す。
        cap = min(int(round(h * 0.7)), (w - 16) // 2)
        cap = max(cap, 1)
        im.crop((0, 0, cap, h)).save(slice_dir / f"{name}-l.png")
        im.crop((cap, 0, w - cap, h)).save(slice_dir / f"{name}-m.png")
        im.crop((w - cap, 0, w, h)).save(slice_dir / f"{name}-r.png")
        meta[name] = {"width": w, "height": h, "cap": cap}
        print(f"slices/{name}-l|m|r.png  cap={cap} middle={w - cap * 2} of {w}x{h}")
    return meta


def generate_ts(names: list[str], slices: dict[str, dict]) -> None:
    def key(n: str) -> str:
        parts = n.split("-")
        return parts[0] + "".join(p.capitalize() for p in parts[1:])

    lines = [
        "/**",
        " * 手書き素材のrequire()マップ。",
        " * scripts/slice-sketch.py が自動生成する（手で編集しない）。",
        " * React Nativeのrequireは静的パスのみ許容するため、ここで一覧化する。",
        " */",
        "",
        "export const sketch = {",
        '  paper: require("../../assets/sketch/paper.jpg"),',
    ]
    for n in sorted(names):
        lines.append(f'  {key(n)}: require("../../assets/sketch/{n}.png"),')
    lines += [
        "} as const;",
        "",
        "export type SketchName = keyof typeof sketch;",
        "",
        "/**",
        " * 手書き数字 0-9。人数表示などで画像として組む。",
        " * 寸法は実行時に解決せずここに焼き込む（react-native-web には",
        " * Image.resolveAssetSource が無いため）。高さは全桁共通。",
        " */",
        "export const sketchDigits = [",
    ]
    for d in range(10):
        with Image.open(OUT / f"digit-{d}.png") as digit:
            dw, dh = digit.size
        lines.append(f"  {{ source: sketch.digit{d}, width: {dw}, height: {dh} }},")
    lines += [
        "] as const;",
        "",
        "/**",
        " * 横に伸ばして使うパーツの3スライス。",
        " * width/height は元画像の実寸、cap は端キャップの幅（元画像基準）。",
        " * 描画時は height から倍率を出し、cap を同じ倍率で拡縮する。",
        " */",
        "export const sketchSlices = {",
    ]
    for n in STRETCHABLE:
        if n not in slices:
            continue
        m = slices[n]
        lines += [
            f"  {key(n)}: {{",
            f'    left: require("../../assets/sketch/slices/{n}-l.png"),',
            f'    middle: require("../../assets/sketch/slices/{n}-m.png"),',
            f'    right: require("../../assets/sketch/slices/{n}-r.png"),',
            f'    width: {m["width"]},',
            f'    height: {m["height"]},',
            f'    cap: {m["cap"]},',
            "  },",
        ]
    lines += [
        "} as const;",
        "",
        "export type SketchSliceName = keyof typeof sketchSlices;",
        "",
        "/**",
        " * 役職の手書きイラスト。役職ごとに複数の絵を持ち、プレイヤーごとに振り分ける。",
        " * 縦横比が絵ごとに違うため寸法を焼き込む（実行時に解決できない）。",
        " */",
        "export const sketchRoleArt = {",
    ]
    for role, variants in ROLE_ART.items():
        lines.append(f'  "{role}": [')
        for cfg in variants:
            path = OUT / f"{cfg['name']}.png"
            if not path.exists():
                continue
            with Image.open(path) as art:
                aw, ah = art.size
            lines.append(
                f"    {{ source: sketch.{key(cfg['name'])}, width: {aw}, height: {ah} }},"
            )
        lines.append("  ],")
    lines += [
        "} as const;",
        "",
    ]
    TS_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"\ngenerated {TS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    if "--probe" in sys.argv:
        probe()
    else:
        written = slice_all() + process_singles() + process_role_art()
        generate_ts(written, make_slices())
