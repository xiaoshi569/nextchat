# 基础镜像
FROM node:18-alpine AS base

# 依赖安装阶段
FROM base AS deps

# 安装依赖库
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 复制依赖文件
COPY package.json yarn.lock ./

# 配置 npm 镜像源并安装依赖
RUN yarn config set registry 'https://registry.npmmirror.com/'
RUN yarn install

# 构建阶段
FROM base AS builder

# 安装构建工具
RUN apk update && apk add --no-cache git openssl

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量（避免构建时连接数据库）
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# 生成 Prisma Client（必须在构建前生成）
RUN npx prisma generate 2>&1 || echo "Prisma generate skipped"

# 构建应用
RUN yarn build

# 运行阶段
FROM base AS runner
WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache proxychains-ng openssl

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

# 复制 Prisma 相关文件
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# 复制 seed 脚本需要的依赖
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx

# 创建数据目录
RUN mkdir -p /app/data && chmod 777 /app/data

# 创建 MCP 配置目录
RUN mkdir -p /app/app/mcp && chmod 777 /app/app/mcp
COPY --from=builder /app/app/mcp/mcp_config.default.json /app/app/mcp/mcp_config.json

# 复制启动脚本
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["/app/docker-entrypoint.sh"]
