# 部署指南

## 📤 上传代码到 GitHub

### 1. 初始化 Git 仓库（如果还没有）
```bash
cd NextChat
git init
git add .
git commit -m "feat: 添加后台管理系统支持"
```

### 2. 添加远程仓库并推送
```bash
git remote add origin https://github.com/xiaoshi569/nextchat.git
git branch -M main
git push -u origin main
```

## 🐳 自动构建 Docker 镜像

### 配置 GitHub Secrets

1. 访问仓库设置：https://github.com/xiaoshi569/nextchat/settings/secrets/actions
2. 添加以下 Secrets：
   - `DOCKER_USERNAME`：你的 Docker Hub 用户名
   - `DOCKER_PASSWORD`：你的 Docker Hub 密码或 Access Token

### 触发构建

推送代码后会自动触发构建：
```bash
git push origin main
```

或手动触发：
- 访问 Actions 页面
- 选择 "Build and Push Docker Image"
- 点击 "Run workflow"

构建完成后，镜像会推送到：
```
docker.io/<your-username>/nextchat:latest
```

## 🚀 使用自己的镜像部署

修改 `docker-compose.yml` 中的镜像地址：

```yaml
services:
  chatgpt-next-web:
    # image: yidadaa/chatgpt-next-web
    image: <your-username>/nextchat:latest  # 使用自己构建的镜像
```

然后启动：
```bash
docker-compose up -d
```

## 📝 完整部署流程

```bash
# 1. 配置环境变量
cp env.docker.example .env
nano .env  # 修改密码和密钥

# 2. 拉取镜像并启动
docker-compose pull
docker-compose up -d

# 3. 查看日志
docker-compose logs -f app

# 4. 访问应用
# http://localhost:3000
# 默认管理员：admin@nextchat.com / admin123
```

## 🔄 更新部署

```bash
# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

