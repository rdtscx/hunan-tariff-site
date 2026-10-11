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

# 验证关键文件大小，防止部署空文件
for f in index.html api.php; do
  if [ -f "$DIST_DIR/$f" ]; then
    size=$(stat -c%s "$DIST_DIR/$f" 2>/dev/null || stat -f%z "$DIST_DIR/$f" 2>/dev/null || echo 0)
    if [ "$size" -lt 100 ]; then
      echo "错误: $f 文件大小异常 ($size bytes)，中止构建"
      exit 1
    fi
    echo "$f 大小验证通过: $size bytes"
  else
    echo "错误: $f 不存在，中止构建"
    exit 1
  fi
done

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
