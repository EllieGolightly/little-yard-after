#!/bin/zsh
cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo '小院需要 Node.js 20 或以上。安装 Node.js 后，再打开这个文件。'
  read -r '?按回车关闭'
  exit 1
fi
if curl --silent --fail http://127.0.0.1:4173/ >/dev/null 2>&1; then
  open http://127.0.0.1:4173/
  exit 0
fi
(sleep 1; open http://127.0.0.1:4173/) &
echo '小院正在打开。保持这个窗口运行；玩完后按 Control-C 可以关闭。'
node scripts/server.mjs
