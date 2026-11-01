"""Zen Maru Gothic を、このアプリで使う文字だけに絞って woff2 にする。

設問や説明文の文字を変えたら、もう一度実行する。
使い方（リポジトリのいちばん上のフォルダで）:
    pip install fonttools brotli
    python3 tools/subset_fonts.py 元のTTFがあるフォルダ
元の TTF は https://github.com/google/fonts/tree/main/ofl/zenmarugothic から取得する。
"""
import pathlib
import string
import sys

from fontTools import subset

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCES = ['index.html', 'js/*.js']
WEIGHTS = {'500': 'ZenMaruGothic-Medium.ttf', '700': 'ZenMaruGothic-Bold.ttf'}


def collect_chars():
    chars = set(string.printable)
    chars |= set('０１２３４５６７８９％（）「」『』、。・：！？ー…〜／　')
    for pattern in SOURCES:
        for path in ROOT.glob(pattern):
            chars |= set(path.read_text(encoding='utf-8'))
    return ''.join(sorted(c for c in chars if c.isprintable() or c == '　'))


def main():
    src_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
    text = collect_chars()
    out_dir = ROOT / 'fonts'
    out_dir.mkdir(exist_ok=True)
    for weight, filename in WEIGHTS.items():
        out = out_dir / f'ZenMaru-{weight}.woff2'
        subset.main([
            str(src_dir / filename),
            f'--text={text}',
            '--flavor=woff2',
            '--layout-features=*',
            f'--output-file={out}',
        ])
        print(f'{out.name}: {out.stat().st_size // 1024} KB')
    print(f'{len(text)} 文字')


if __name__ == '__main__':
    main()
