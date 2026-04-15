# 项目交接建议与本地化实现方案

## 📋 项目交接建议

### 第一部分：交接前的准备工作

#### 1. 文档完整性检查
- [x] README.md - 项目概述和功能说明
- [x] HANDOVER.md - 项目交接文档
- [ ] API 文档 - tRPC 路由文档（建议补充）
- [ ] 数据库文档 - 表结构和关系说明（建议补充）
- [ ] 部署指南 - 生产环境部署步骤（建议补充）

**建议**：使用 Swagger/OpenAPI 或 tRPC 文档生成工具自动生成 API 文档。

#### 2. 代码质量检查
```bash
# 运行所有测试
pnpm test

# 检查 TypeScript 类型
pnpm check

# 代码格式检查
pnpm lint
```

#### 3. 环境配置清单
- [ ] 生产环境 DATABASE_URL 配置
- [ ] LLM API 密钥配置
- [ ] S3 存储配置
- [ ] OAuth 应用配置
- [ ] 邮件服务配置（如需要）

#### 4. 数据备份
```bash
# 备份数据库
mysqldump -u user -p database > backup.sql

# 备份 S3 文件
aws s3 sync s3://bucket-name ./local-backup/
```

---

### 第二部分：交接流程建议

#### 阶段 1：知识转移（1-2 天）
1. **代码走查** - 与接收方进行代码审查
   - 重点关注 `server/routers.ts` 中的 tRPC 路由
   - 解释 `characterExtractor.ts` 的 LLM 集成方式
   - 说明 `collaborationService.ts` 的权限模型

2. **架构讲解** - 说明系统架构
   - 前后端通信流程
   - 数据库设计思路
   - 第三方服务集成方式

3. **部署演示** - 演示部署过程
   - 环境配置
   - 数据库迁移
   - 应用启动

#### 阶段 2：功能演示（1 天）
1. 演示所有已完成的功能
2. 展示已知问题和限制
3. 解释错误处理和日志查看方式

#### 阶段 3：问题排查（1 天）
1. 让接收方尝试常见操作
2. 指导排查问题的方法
3. 提供故障排除指南

#### 阶段 4：交接确认（1 天）
1. 接收方独立部署和运行
2. 验证所有功能正常
3. 签署交接确认

---

### 第三部分：交接后的支持

#### 短期支持（1-2 周）
- 回答技术问题
- 协助解决紧急问题
- 提供代码优化建议

#### 中期支持（1-3 个月）
- 定期代码审查
- 性能优化指导
- 新功能开发建议

#### 长期支持（按需）
- 架构升级咨询
- 技术难题讨论
- 最佳实践分享

---

## 🌍 本地化实现方案

### 一、LLM 本地化方案（解决配额问题）

#### 方案 A：使用开源 LLM（推荐）

**优势**：
- 无需 API 配额
- 完全本地化
- 隐私保护
- 成本低

**劣势**：
- 需要 GPU 资源
- 模型精度可能不如云端 LLM
- 部署复杂

**实现步骤**：

1. **安装 Ollama 或 LM Studio**
   ```bash
   # 安装 Ollama（推荐）
   curl https://ollama.ai/install.sh | sh
   
   # 或使用 Docker
   docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
   ```

2. **选择合适的模型**
   ```bash
   # 中文支持较好的模型
   ollama pull qwen:7b          # 阿里通义千问（推荐）
   ollama pull llama2-chinese   # Llama 2 中文版
   ollama pull baichuan:7b      # 百川 AI
   ollama pull mistral          # Mistral（英文更好）
   ```

3. **修改 LLM 调用接口**
   ```typescript
   // server/_core/llm.ts - 修改为本地 LLM
   import fetch from 'node-fetch';
   
   export async function invokeLLM(params: LLMParams) {
     // 使用本地 Ollama API
     const response = await fetch('http://localhost:11434/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         model: process.env.LOCAL_LLM_MODEL || 'qwen:7b',
         messages: params.messages,
         stream: false,
       }),
     });
     
     return response.json();
   }
   ```

4. **环境配置**
   ```env
   # .env
   LLM_TYPE=local          # 使用本地 LLM
   LOCAL_LLM_API=http://localhost:11434
   LOCAL_LLM_MODEL=qwen:7b
   ```

5. **性能优化**
   - 使用量化模型（4-bit、8-bit）以减少显存占用
   - 配置模型缓存
   - 使用 GPU 加速

**硬件需求**：
- **最低配置**：8GB RAM + 4GB VRAM（使用量化模型）
- **推荐配置**：16GB RAM + 8GB VRAM
- **最佳配置**：32GB RAM + 24GB VRAM

**成本估算**：
- 一次性成本：0 元（开源）
- 硬件成本：2000-5000 元（GPU）
- 维护成本：低

---

#### 方案 B：使用国内 LLM API（备选）

**优势**：
- 无需本地硬件
- 中文支持好
- 成本相对较低

**劣势**：
- 仍需 API 配额
- 依赖网络
- 可能有审查限制

**可选 API**：
1. **阿里通义千问**
   ```typescript
   // 使用阿里 API
   const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${process.env.ALIYUN_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'qwen-plus',
       messages: params.messages,
     }),
   });
   ```

2. **百度文心一言**
3. **讯飞星火**
4. **腾讯混元**

**成本估算**：
- 按 token 计费，通常 0.001-0.01 元/千 token
- 月均成本：100-500 元

---

#### 方案 C：混合方案（最佳）

**架构**：
```
┌─────────────────────────────────────┐
│     LLM 调用管理层                   │
├─────────────────────────────────────┤
│ 1. 优先使用本地 LLM（免费）          │
│ 2. 本地 LLM 失败 → 使用国内 API      │
│ 3. API 配额耗尽 → 使用备选 API       │
└─────────────────────────────────────┘
```

**实现代码**：
```typescript
// server/_core/llm-manager.ts
export async function invokeLLMWithFallback(params: LLMParams) {
  const strategies = [
    { name: 'local', fn: invokeLocalLLM },
    { name: 'aliyun', fn: invokeAliyunLLM },
    { name: 'baidu', fn: invokeBaiduLLM },
  ];

  for (const strategy of strategies) {
    try {
      console.log(`[LLM] Trying ${strategy.name}...`);
      const result = await strategy.fn(params);
      console.log(`[LLM] Success with ${strategy.name}`);
      return result;
    } catch (error) {
      console.warn(`[LLM] ${strategy.name} failed:`, error);
      continue;
    }
  }

  throw new Error('All LLM strategies failed');
}
```

**优势**：
- 最大可用性
- 成本最优
- 用户体验最好

---

### 二、数据库本地化方案

#### 方案 A：使用 SQLite（最简单）

**适用场景**：
- 单用户或小团队
- 开发和测试环境
- 不需要并发访问

**实现步骤**：

1. **安装 SQLite 驱动**
   ```bash
   pnpm add better-sqlite3
   ```

2. **修改 Drizzle 配置**
   ```typescript
   // drizzle.config.ts
   import { defineConfig } from 'drizzle-kit';
   
   export default defineConfig({
     schema: './drizzle/schema.ts',
     driver: 'better-sqlite',
     dbCredentials: {
       url: './data/novel.db',
     },
   });
   ```

3. **修改数据库连接**
   ```typescript
   // server/db.ts
   import Database from 'better-sqlite3';
   import { drizzle } from 'drizzle-orm/better-sqlite3';
   
   const sqlite = new Database('./data/novel.db');
   const db = drizzle(sqlite);
   ```

**优势**：
- 无需数据库服务器
- 零配置
- 文件即数据库

**劣势**：
- 不支持并发写入
- 不适合多用户
- 性能有限

---

#### 方案 B：使用 PostgreSQL（推荐）

**适用场景**：
- 多用户系统
- 生产环境
- 需要高可用性

**实现步骤**：

1. **安装 PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu
   sudo apt-get install postgresql
   
   # Docker（推荐）
   docker run --name postgres -e POSTGRES_PASSWORD=password -d postgres
   ```

2. **修改 Drizzle 配置**
   ```typescript
   // drizzle.config.ts
   import { defineConfig } from 'drizzle-kit';
   
   export default defineConfig({
     schema: './drizzle/schema.ts',
     driver: 'pg',
     dbCredentials: {
       url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/novel',
     },
   });
   ```

3. **修改数据库连接**
   ```typescript
   // server/db.ts
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   
   const client = postgres(process.env.DATABASE_URL);
   const db = drizzle(client);
   ```

**优势**：
- 支持并发访问
- 功能完整
- 生产级别

**劣势**：
- 需要服务器
- 配置复杂

---

### 三、文件存储本地化方案

#### 方案 A：使用本地文件系统

**实现步骤**：

1. **创建存储目录**
   ```bash
   mkdir -p ./storage/avatars
   mkdir -p ./storage/uploads
   mkdir -p ./storage/pdfs
   ```

2. **修改存储接口**
   ```typescript
   // server/storage-local.ts
   import fs from 'fs/promises';
   import path from 'path';
   
   export async function storagePut(relKey: string, data: Buffer, contentType?: string) {
     const filePath = path.join('./storage', relKey);
     const dir = path.dirname(filePath);
     
     // 创建目录
     await fs.mkdir(dir, { recursive: true });
     
     // 写入文件
     await fs.writeFile(filePath, data);
     
     // 返回本地 URL
     return {
       key: relKey,
       url: `/storage/${relKey}`,
     };
   }
   
   export async function storageGet(relKey: string) {
     const filePath = path.join('./storage', relKey);
     return {
       key: relKey,
       url: `/storage/${relKey}`,
     };
   }
   ```

3. **配置静态文件服务**
   ```typescript
   // server/index.ts
   app.use('/storage', express.static('./storage'));
   ```

**优势**：
- 零成本
- 完全本地化
- 无依赖

**劣势**：
- 不支持分布式
- 备份复杂
- 不适合大文件

---

#### 方案 B：使用 MinIO（推荐）

**适用场景**：
- 需要 S3 兼容接口
- 多服务器部署
- 需要高可用性

**实现步骤**：

1. **安装 MinIO**
   ```bash
   # Docker（推荐）
   docker run -p 9000:9000 -p 9001:9001 \
     -e MINIO_ROOT_USER=minioadmin \
     -e MINIO_ROOT_PASSWORD=minioadmin \
     minio/minio server /minio_data --console-address ":9001"
   ```

2. **修改存储配置**
   ```typescript
   // server/storage-minio.ts
   import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
   
   const s3Client = new S3Client({
     region: 'us-east-1',
     endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
     credentials: {
       accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
       secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
     },
     forcePathStyle: true,
   });
   
   export async function storagePut(relKey: string, data: Buffer, contentType?: string) {
     await s3Client.send(new PutObjectCommand({
       Bucket: process.env.MINIO_BUCKET || 'novel',
       Key: relKey,
       Body: data,
       ContentType: contentType,
     }));
     
     return {
       key: relKey,
       url: `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${relKey}`,
     };
   }
   ```

**优势**：
- S3 兼容
- 支持分布式
- 高可用性

**劣势**：
- 需要额外部署
- 配置复杂

---

### 四、完整的本地化部署方案

#### Docker Compose 一键部署

**创建 `docker-compose.yml`**：
```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
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

  # MinIO 文件存储
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

  # Ollama LLM 服务
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # 需要 GPU 支持
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # 应用服务
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://novel:password@postgres:5432/novel_db
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
      LOCAL_LLM_API: http://ollama:11434
      LOCAL_LLM_MODEL: qwen:7b
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - minio
      - ollama

volumes:
  postgres_data:
  minio_data:
  ollama_data:
```

**启动本地化部署**：
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**访问地址**：
- 应用：http://localhost:3000
- MinIO 控制台：http://localhost:9001
- PostgreSQL：localhost:5432

---

### 五、本地化迁移检查清单

#### 数据库迁移
- [ ] 导出现有数据
- [ ] 创建新数据库
- [ ] 运行迁移脚本
- [ ] 验证数据完整性

#### 文件迁移
- [ ] 备份现有文件
- [ ] 配置本地存储
- [ ] 迁移文件到本地
- [ ] 更新文件路径

#### LLM 迁移
- [ ] 部署本地 LLM
- [ ] 测试 LLM 调用
- [ ] 配置备选方案
- [ ] 监控 LLM 性能

#### 功能验证
- [ ] 人物提取功能
- [ ] 文件上传功能
- [ ] 头像生成功能
- [ ] PDF 导出功能
- [ ] 所有 CRUD 操作

---

## 📊 方案对比表

| 方案 | 成本 | 性能 | 可用性 | 复杂度 | 推荐度 |
|------|------|------|--------|--------|--------|
| **LLM 本地化** | 低 | 中 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| **LLM API** | 中 | 高 | 中 | 低 | ⭐⭐⭐ |
| **SQLite** | 低 | 低 | 低 | 低 | ⭐⭐ |
| **PostgreSQL** | 中 | 高 | 高 | 中 | ⭐⭐⭐⭐⭐ |
| **本地文件存储** | 低 | 中 | 低 | 低 | ⭐⭐ |
| **MinIO** | 中 | 高 | 高 | 中 | ⭐⭐⭐⭐ |

---

## 🚀 推荐实施路线

### 第一阶段：快速本地化（1-2 天）
1. 使用 SQLite 替换 MySQL
2. 使用本地文件系统存储
3. 使用 Ollama 部署本地 LLM

**优势**：快速、零成本、易于测试

### 第二阶段：生产就绪（1 周）
1. 升级到 PostgreSQL
2. 部署 MinIO 文件存储
3. 配置 LLM 备选方案

**优势**：高可用、可扩展、生产级别

### 第三阶段：优化和监控（2-4 周）
1. 性能优化
2. 监控和告警
3. 备份和恢复

---

## 📝 成本对比

### 云端方案（当前）
- LLM API：200-500 元/月
- 数据库：100-300 元/月
- 文件存储：50-200 元/月
- **总计**：350-1000 元/月

### 本地化方案
- 硬件一次性投入：3000-8000 元
- 月均运维成本：100-200 元
- **ROI**：6-12 个月

---

## 🎯 建议方案

**最佳选择**：混合方案
- 使用 Ollama 部署本地 LLM（解决配额问题）
- 使用 PostgreSQL 作为数据库（支持多用户）
- 使用 MinIO 作为文件存储（支持分布式）
- 使用 Docker Compose 一键部署

**预期效果**：
- ✅ 完全解决 LLM 配额问题
- ✅ 支持多用户并发
- ✅ 完全本地化，无外部依赖
- ✅ 易于部署和维护
- ✅ 成本在 6-12 个月内收回

---

**最后更新**：2026-04-15
