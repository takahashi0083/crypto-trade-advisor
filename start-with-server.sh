#!/bin/bash

echo "🚀 Crypto Trade Advisor 起動中..."

# サーバーディレクトリに移動してインストール
cd server
if [ ! -d "node_modules" ]; then
  echo "📦 サーバーの依存関係をインストール中..."
  npm install
fi

# サーバーを起動
echo "🖥️  LINE通知サーバーを起動中..."
npm start &
SERVER_PID=$!

# メインアプリに戻る
cd ..

# 開発サーバーを起動
echo "🌐 アプリケーションを起動中..."
npm run dev -- --host

# 終了時にサーバーも停止
trap "kill $SERVER_PID" EXIT