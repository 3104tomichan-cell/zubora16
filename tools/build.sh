#!/bin/sh
# js/ の ES モジュールを1ファイル（js/app.min.js）にまとめる。js/ を変えたら必ず実行してコミットする。
# 古めの iPhone（iOS 12〜）でも動くように書き方を変換する。
cd "$(dirname "$0")/.." && npx -y esbuild@0.24.0 js/app.js --bundle --minify --format=esm --target=safari12 --outfile=js/app.min.js
