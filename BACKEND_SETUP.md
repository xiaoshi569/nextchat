# NextChat 后台管理系统

## 🚀 快速启动

### 方式一：Docker Compose 部署（推荐生产环境）

#### 1. 配置环境变量
```bash
cp env.docker.example .env
# 编辑 .env 文件，修改密码和密钥
```

#### 2. 启动服务
```bash
# 构建并启动（首次运行）
docker-compose up -d --build

# 后续启动
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

#### 3. 访问应用
访问 http://localhost:3000

### 方式二：本地开发

#### 1. 安装依赖
```bash
yarn install
```

#### 2. 配置环境变量
创建 `.env.local` 文件：
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-secret-key"
ENCRYPTION_KEY="your-32-chars-encryption-key-here"
ALLOW_REGISTER=true
```

#### 3. 初始化数据库
```bash
yarn db:generate
yarn db:push
yarn db:seed
```

#### 4. 启动
```bash
yarn dev
```

---

## 👤 默认管理员账号
- 邮箱：`admin@nextchat.com`
- 密码：`admin123`

⚠️ 首次登录后请立即修改密码！

---

## 🎯 功能说明

**用户功能**
- 注册/登录（访问 `/#/login`）
- 独立的聊天会话和数据

**管理员功能**（访问 `/#/admin`）
- 用户管理（启用/禁用/删除）
- API密钥管理（统一配置多个AI提供商）
- 数据隔离和权限控制

---

## 🐳 Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 进入应用容器
docker-compose exec app sh

# 清理所有数据（包括数据库）
docker-compose down -v
```

---

## 🛠️ 本地开发命令

```bash
yarn dev              # 开发
yarn db:studio        # 查看数据库
yarn db:push          # 同步数据库
yarn db:seed          # 重置并初始化
```

---

## ⚠️ 注意事项

### 生产环境部署
- ✅ 修改 `.env` 中的 `DB_PASSWORD`
- ✅ 修改 `JWT_SECRET` 和 `ENCRYPTION_KEY`
- ✅ 设置 `ALLOW_REGISTER=false`（关闭公开注册）
- ✅ 使用 HTTPS（建议配置 Nginx 反向代理）
- ✅ 定期备份 PostgreSQL 数据

### 安全建议
- 使用强密码（至少16位随机字符）
- 不要暴露数据库端口（删除 ports: 5432）
- 定期更新 Docker 镜像
