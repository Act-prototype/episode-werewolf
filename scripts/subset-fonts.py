#!/usr/bin/env python3
"""同梱フォントをサブセット化して assets/fonts/ に書き出す。

  python3 scripts/subset-fonts.py            # サブセットを生成
  python3 scripts/subset-fonts.py --measure   # 日本語本文フォントの選択肢のサイズを比較

なぜ書体ごとに扱いが違うか:

- Hina Mincho は「結果発表（追放なし）の朝の語り」1文だけに使う。文字が固定なので
  その文字だけに絞れる。2文字追加するときはここを直して再生成する。
- Readex Pro は英数字の見出しとタイマーにしか使わないのでASCIIで足りる。
- Zen Kaku Gothic New は本文すべて＝プレイヤー名（ユーザー入力）とAI生成のお題を
  含む。任意の文字が来るためサブセット化すると豆腐（□）が出る。既定では絞らない。

依存: pip install fonttools brotli
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NODE_FONTS = ROOT / "node_modules" / "@expo-google-fonts"
OUT = ROOT / "assets" / "fonts"

# Hina Mincho で描く文字。src/game/quotes.ts の PEACEFUL_MORNING と一致させる。
MINCHO_TEXT = "嗚呼。深く澄み渡る、風もない清寂の朝だ。"

# Readex Pro はASCIIのみ（SETTING / Who are you? / Day1 / 2:58 など）
READEX_UNICODES = "U+0020-007E"


def run_subset(src: Path, dest: Path, *args: str) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(src),
        f"--output-file={dest}",
        "--layout-features=*",
        "--drop-tables+=DSIG",
        "--recalc-bounds",
        *args,
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    before = src.stat().st_size
    after = dest.stat().st_size
    print(f"{dest.name:34s} {before//1024:5d}KB -> {after//1024:5d}KB  ({after/before:.1%})")


def build() -> None:
    run_subset(
        NODE_FONTS / "hina-mincho" / "400Regular" / "HinaMincho_400Regular.ttf",
        OUT / "HinaMincho_400Regular.subset.ttf",
        f"--text={MINCHO_TEXT}",
    )
    run_subset(
        NODE_FONTS / "readex-pro" / "300Light" / "ReadexPro_300Light.ttf",
        OUT / "ReadexPro_300Light.subset.ttf",
        f"--unicodes={READEX_UNICODES}",
    )
    print(
        "\nZen Kaku Gothic New はサブセット化しない（プレイヤー名とAI生成のお題に"
        "任意の文字が入るため）。選択肢の比較は --measure を参照。"
    )


def measure() -> None:
    """日本語本文フォントを絞った場合のサイズを比較する（生成物は捨てる）。"""
    src = NODE_FONTS / "zen-kaku-gothic-new" / "500Medium" / "ZenKakuGothicNew_500Medium.ttf"
    tmp = OUT / "_measure"
    options = {
        # かな・記号・第1水準漢字のおおよその範囲
        "かな＋第1水準相当": "U+0020-007E,U+3000-303F,U+3040-309F,U+30A0-30FF,U+FF00-FFEF,U+4E00-9FFF",
        "かなのみ": "U+0020-007E,U+3000-303F,U+3040-309F,U+30A0-30FF,U+FF00-FFEF",
    }
    for label, unicodes in options.items():
        dest = tmp / f"{label}.ttf"
        run_subset(src, dest, f"--unicodes={unicodes}")
    print(f"\n（比較用の生成物は {tmp.relative_to(ROOT)} に置いた。不要なら削除して良い）")


if __name__ == "__main__":
    if "--measure" in sys.argv:
        measure()
    else:
        build()
