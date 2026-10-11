#!/bin/bash
# 构建脚本：将网站文件复制到dist目录

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$ROOT_DIR/dist"

echo "开始构建..."
echo "根目录: $ROOT_DIR"
echo "输出目录: $DIST_DIR"

# 清理dist目录
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# 复制前端文件
cp "$ROOT_DIR/index.html" "$DIST_DIR/" 2>/dev/null || echo "警告: index.html 不存在"
cp "$ROOT_DIR/api.php" "$DIST_DIR/" 2>/dev/null || echo "警告: api.php 不存在"

# 复制数据目录
if [ -d "$ROOT_DIR/data" ]; then
  cp -r "$ROOT_DIR/data" "$DIST_DIR/"
  echo "数据文件已复制"
else
  echo "警告: data 目录不存在"
fi

# 创建cache目录
mkdir -p "$DIST_DIR/cache"

# 复制静态资源（如果有）
for dir in css js images assets; do
  if [ -d "$ROOT_DIR/$dir" ]; then
    cp -r "$ROOT_DIR/$dir" "$DIST_DIR/"
    echo "$dir 已复制"
  fi
done

echo "构建完成！"
ls -la "$DIST_DIR/"
