#!/bin/sh
set -e

echo "🚀 启动 NextChat 后台管理系统..."

# 等待数据库准备就绪
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ 等待数据库启动..."
    until npx prisma db push --skip-generate 2>/dev/null; do
        echo "数据库未就绪 - 等待中"
        sleep 2
    done
    echo "✅ 数据库已就绪！"
    
    # 运行数据库迁移
    echo "📦 执行数据库迁移..."
    npx prisma db push --skip-generate || true
    
    # 初始化数据（如果需要）
    echo "🌱 初始化数据库..."
    npx tsx prisma/seed.ts || echo "⚠️  跳过数据初始化（数据库可能已初始化）"
fi

export HOSTNAME="0.0.0.0"

# 检查是否需要使用代理
if [ -n "$PROXY_URL" ]; then
    echo "🔧 配置代理: $PROXY_URL"
    protocol=$(echo $PROXY_URL | cut -d: -f1)
    host=$(echo $PROXY_URL | cut -d/ -f3 | cut -d: -f1)
    port=$(echo $PROXY_URL | cut -d: -f3)
    conf=/etc/proxychains.conf
    
    echo "strict_chain" > $conf
    echo "proxy_dns" >> $conf
    echo "remote_dns_subnet 224" >> $conf
    echo "tcp_read_time_out 15000" >> $conf
    echo "tcp_connect_time_out 8000" >> $conf
    echo "localnet 127.0.0.0/255.0.0.0" >> $conf
    echo "localnet ::1/128" >> $conf
    echo "[ProxyList]" >> $conf
    echo "$protocol $host $port" >> $conf
    
    echo "✅ 代理配置完成"
    cat /etc/proxychains.conf
    
    echo "🎉 使用代理启动应用..."
    exec proxychains -f $conf node server.js
else
    echo "🎉 启动应用..."
    exec node server.js
fi

