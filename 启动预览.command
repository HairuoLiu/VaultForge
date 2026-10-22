#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")"
if ! command -v python3 >/dev/null 2>&1; then
  print '未找到 Python 3。请安装 Python 3 后重新打开，或直接打开 index.html 并选择项目文件夹。'
  read -r '?按回车退出…'
  exit 1
fi
exec python3 scripts/preview-server.py
