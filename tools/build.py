#!/usr/bin/env python3
"""index.src.html から、CSS と JS を中に埋め込んだ index.html を作る。

会場の回線が混んでいても、HTML 1回のダウンロードだけで画面が出て診断できるようにするため。
js/ や css/ や index.src.html を変えたら、必ずこれを実行して index.html と sw.js もコミットする。
  python3 tools/build.py
"""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

subprocess.run(
    ['npx', '-y', 'esbuild@0.24.0', 'js/app.js', '--bundle', '--minify', '--format=esm',
     '--target=safari12', '--outfile=js/app.min.js', '--log-level=warning'],
    cwd=ROOT, check=True)

config = (ROOT / 'js/config.js').read_text(encoding='utf-8')
version = re.search(r"APP_VERSION = '([^']+)'", config).group(1)
endpoint = re.search(r"RECORD_ENDPOINT = '([^']*)'", config).group(1)

css = (ROOT / 'css/style.css').read_text(encoding='utf-8').replace("url('../fonts/", "url('fonts/")
js = (ROOT / 'js/app.min.js').read_text(encoding='utf-8')
for text, tag in ((css, '</style'), (js, '</script')):
    assert tag not in text.lower(), f'{tag} が中に含まれていて埋め込めない'

html = (ROOT / 'index.src.html').read_text(encoding='utf-8')
link = '<link rel="stylesheet" href="css/style.css">'
script = '<script type="module" src="js/app.min.js"></script>'
assert link in html and script in html
html = html.replace(link, '<style>' + css + '</style>')
html = html.replace(script, '<script type="module">' + js + '</script>')
html = html.replace('__VERSION__', version).replace('__ENDPOINT__', endpoint)
html = html.replace('<!doctype html>', f'<!doctype html>\n<!-- tools/build.py が index.src.html から作ったファイル。直接編集しない（{version}） -->', 1)
(ROOT / 'index.html').write_text(html, encoding='utf-8')

# サービスワーカーのキャッシュ名に版を入れて、版が変わったら古いキャッシュを捨てる
sw = (ROOT / 'sw.src.js').read_text(encoding='utf-8').replace('__VERSION__', version)
(ROOT / 'sw.js').write_text(sw, encoding='utf-8')

print(f'index.html {len(html.encode()) // 1024} KB（{version}）')
