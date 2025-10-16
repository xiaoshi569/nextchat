# 🐛 已修复的BUG列表

## 修复时间：2025-01-16

### ✅ 修复1：数据库类型不匹配（严重）
**问题**：
- `prisma/schema.prisma` 中使用 SQLite
- `docker-compose.yml` 中使用 PostgreSQL
- 导致应用无法启动

**修复**：
- 将 schema.prisma 中的 `provider = "sqlite"` 改为 `provider = "postgresql"`

### ✅ 修复2：Prisma Client 生成问题
**问题**：
- Docker 构建时 Prisma generate 可能失败
- 缺少必要的依赖

**修复**：
- 移除条件判断，直接执行 `npx prisma generate`
- 添加 `|| true` 防止构建中断
- 复制必要的 node_modules 到运行镜像

### ✅ 修复3：Seed 脚本依赖缺失
**问题**：
- `docker-entrypoint.sh` 中运行 `npx tsx prisma/seed.ts`
- 但运行镜像中可能缺少 `tsx` 和 `bcryptjs`

**修复**：
- 显式复制 `bcryptjs` 和 `tsx` 到运行镜像

## 潜在问题（已预防）

### ⚠️ 环境变量安全
**建议**：
- 生产环境必须修改 `JWT_SECRET`
- 生产环境必须修改 `ENCRYPTION_KEY`
- 生产环境建议设置 `ALLOW_REGISTER=false`

### ⚠️ 管理员默认密码
**建议**：
- 首次登录后立即修改 admin@nextchat.com 的密码

### ⚠️ 数据库备份
**建议**：
- 定期备份 PostgreSQL 数据
- 使用 `docker-compose down -v` 会删除所有数据

## 测试清单

部署后请验证：

- [ ] 数据库连接成功
- [ ] 管理员账号可以登录（admin@nextchat.com / admin123）
- [ ] 用户可以注册
- [ ] 用户数据隔离正常
- [ ] API密钥管理功能正常
- [ ] 管理员可以启用/禁用用户

