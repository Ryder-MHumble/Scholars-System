#!/bin/bash
# 重启 ScholarDB-System 前端

cd /Users/sunminghao/Desktop/ScholarDB-System

echo "==> 停止现有进程..."
pkill -f "vite.*5174" || true

echo "==> 启动开发服务器..."
npm run dev &

echo "==> 等待服务启动..."
sleep 3

echo "==> 前端已启动: http://10.100.64.56:5174"
echo "==> 学者页面: http://10.100.64.56:5174/?tab=scholars"
