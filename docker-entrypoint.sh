#!/bin/sh
set -e

echo "🚀 Starting NextChat with Backend System..."

# 等待数据库准备就绪
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database..."
    until npx prisma db push --skip-generate 2>/dev/null; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "✅ Database is ready!"
    
    # 运行数据库迁移
    echo "📦 Running database migrations..."
    npx prisma db push --skip-generate || true
    
    # 初始化数据（如果需要）
    echo "🌱 Initializing database..."
    npx tsx prisma/seed.ts || echo "⚠️  Seed skipped (database may already be initialized)"
fi

export HOSTNAME="0.0.0.0"

# 检查是否需要使用代理
if [ -n "$PROXY_URL" ]; then
    echo "🔧 Configuring proxy: $PROXY_URL"
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
    
    echo "✅ Proxy configured"
    cat /etc/proxychains.conf
    
    echo "🎉 Starting application with proxy..."
    exec proxychains -f $conf node server.js
else
    echo "🎉 Starting application..."
    exec node server.js
fi

