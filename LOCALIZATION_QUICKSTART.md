# 本地化快速开始指南

## ⚡ 5 分钟快速本地化

### 前置条件
- Docker 和 Docker Compose 已安装
- Node.js 22+ 已安装
- 至少 8GB RAM

### 步骤 1：克隆项目
```bash
git clone <repository-url>
cd novel_character_web
```

### 步骤 2：创建 docker-compose.yml
在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: novel
      POSTGRES_PASSWORD: password
      POSTGRES_DB: novel_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/minio_data
    command: server /minio_data --console-address ":9001"

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  minio_data:
  ollama_data:
```

### 步骤 3：启动服务
```bash
# 启动所有服务
docker-compose up -d

# 等待服务启动（约 30 秒）
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 步骤 4：配置环境变量
创建 `.env.local`：

```env
# 数据库
DATABASE_URL=postgresql://novel:password@localhost:5432/novel_db

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=novel
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Ollama LLM
LLM_TYPE=local
LOCAL_LLM_API=http://localhost:11434
LOCAL_LLM_MODEL=qwen:7b

# OAuth（保持原有配置）
VITE_APP_ID=<your-app-id>
OAUTH_SERVER_URL=https://api.manus.im
```

### 步骤 5：下载 LLM 模型
```bash
# 进入 Ollama 容器
docker-compose exec ollama bash

# 下载模型（选择一个）
ollama pull qwen:7b          # 推荐，中文支持好
ollama pull llama2           # 英文更好
ollama pull mistral          # 速度快

# 退出容器
exit
```

### 步骤 6：数据库迁移
```bash
# 安装依赖
pnpm install

# 运行迁移
pnpm db:push

# 验证迁移
pnpm db:studio
```

### 步骤 7：启动应用
```bash
# 开发模式
pnpm dev

# 应用将在 http://localhost:3000 启动
```

### 步骤 8：验证功能
1. 打开 http://localhost:3000
2. 登录（使用 OAuth）
3. 创建新项目
4. 上传文本进行人物提取
5. 检查 MinIO 控制台：http://localhost:9001

---

## 🔧 常见问题解决

### Q1: Ollama 下载模型很慢
**解决方案**：
```bash
# 使用国内镜像
docker-compose exec ollama bash
export OLLAMA_MODELS=/root/.ollama/models
ollama pull qwen:7b
```

### Q2: GPU 加速不工作
**解决方案**：
在 `docker-compose.yml` 中为 ollama 服务添加 GPU 支持：
```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

### Q3: 内存不足
**解决方案**：
使用量化模型：
```bash
docker-compose exec ollama ollama pull qwen:7b-q4_0
```

### Q4: 数据库连接失败
**解决方案**：
```bash
# 检查 PostgreSQL 是否运行
docker-compose ps

# 查看日志
docker-compose logs postgres

# 重启服务
docker-compose restart postgres
```

### Q5: MinIO 无法访问
**解决方案**：
```bash
# 检查 MinIO 状态
docker-compose logs minio

# 重启 MinIO
docker-compose restart minio

# 访问控制台
# URL: http://localhost:9001
# 用户名: minioadmin
# 密码: minioadmin
```

---

## 📊 性能优化建议

### 1. LLM 性能优化
```bash
# 使用量化模型（更快，占用内存更少）
ollama pull qwen:7b-q4_0

# 在 .env 中配置
LOCAL_LLM_MODEL=qwen:7b-q4_0
```

### 2. 数据库性能优化
```sql
-- 创建索引
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_characters_novelId ON characters(novelId);
CREATE INDEX idx_novels_userId ON novels(userId);
```

### 3. 缓存优化
```typescript
// 在 server/_core/llm.ts 中添加缓存
const llmCache = new Map<string, any>();

export async function invokeLLMWithCache(params: LLMParams) {
  const cacheKey = JSON.stringify(params);
  if (llmCache.has(cacheKey)) {
    return llmCache.get(cacheKey);
  }
  
  const result = await invokeLLM(params);
  llmCache.set(cacheKey, result);
  return result;
}
```

---

## 🚀 生产部署

### 使用 Docker 部署
```bash
# 构建镜像
docker build -t novel-character-web .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e MINIO_ENDPOINT=... \
  novel-character-web
```

### 使用 Kubernetes 部署
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: novel-character-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: novel-character-web
  template:
    metadata:
      labels:
        app: novel-character-web
    spec:
      containers:
      - name: app
        image: novel-character-web:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
```

---

## 📈 监控和日志

### 查看服务日志
```bash
# 查看所有日志
docker-compose logs

# 实时查看特定服务
docker-compose logs -f postgres

# 查看最后 100 行
docker-compose logs --tail=100 ollama
```

### 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看数据库连接
docker-compose exec postgres psql -U novel -d novel_db -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔄 数据备份和恢复

### 备份数据库
```bash
# 导出数据库
docker-compose exec postgres pg_dump -U novel novel_db > backup.sql

# 压缩备份
gzip backup.sql
```

### 恢复数据库
```bash
# 解压
gunzip backup.sql.gz

# 恢复
docker-compose exec -T postgres psql -U novel novel_db < backup.sql
```

### 备份文件存储
```bash
# 备份 MinIO 数据
docker cp $(docker-compose ps -q minio):/minio_data ./minio_backup

# 恢复
docker cp ./minio_backup $(docker-compose ps -q minio):/minio_data
```

---

## 🛑 停止和清理

### 停止服务
```bash
# 停止所有服务（保留数据）
docker-compose stop

# 停止并删除容器（保留数据）
docker-compose down

# 停止并删除所有数据
docker-compose down -v
```

---

## 📚 进阶配置

### 使用 Redis 缓存
```yaml
# docker-compose.yml 中添加
redis:
  image: redis:7
  ports:
    - "6379:6379"
```

```typescript
// server/_core/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCached<T>(key: string, fn: () => Promise<T>, ttl = 3600) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  
  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}
```

### 使用 Elasticsearch 全文搜索
```yaml
# docker-compose.yml 中添加
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
```

---

## ✅ 检查清单

本地化部署完成检查：

- [ ] Docker 和 Docker Compose 已安装
- [ ] 所有服务已启动（postgres, minio, ollama）
- [ ] 环境变量已配置
- [ ] 数据库迁移已完成
- [ ] LLM 模型已下载
- [ ] 应用已启动（http://localhost:3000）
- [ ] 登录功能正常
- [ ] 人物提取功能正常
- [ ] 文件上传功能正常
- [ ] PDF 导出功能正常
- [ ] MinIO 控制台可访问
- [ ] 数据库备份已完成

---

## 🎯 下一步

1. **性能优化** - 根据实际使用情况调整 LLM 模型和缓存策略
2. **监控告警** - 部署 Prometheus + Grafana 进行监控
3. **CI/CD** - 配置 GitHub Actions 自动化部署
4. **高可用** - 配置负载均衡和数据库主从复制

---

**最后更新**：2026-04-15

**难度等级**：⭐⭐⭐ 中等

**预计时间**：30-60 分钟
