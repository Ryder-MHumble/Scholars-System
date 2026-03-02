# 部署指南

## 本地开发

1. 创建 `.env.local` 文件（基于 `.env.example`）：
```
VITE_API_BASE_URL=http://43.98.254.243:8001
```

2. 运行开发服务器：
```bash
npm run dev
```

## Vercel 部署

### 前置条件
- 后端 API 必须支持 CORS（跨域资源共享）
- 建议使用 HTTPS 后端避免混合内容警告

### 配置步骤

#### 1. Vercel 环境变量配置

在 Vercel 控制面板中为你的项目添加环境变量：

**Settings → Environment Variables**

添加以下变量（针对所有环境）：
- **Name**: `VITE_API_BASE_URL`
- **Value**: `http://43.98.254.243:8001` （或你的后端地址）

> **注意**：如果后端在生产环境有不同的地址，可为不同环境分别配置。

#### 2. 确保后端 CORS 配置

你的后端需要配置 CORS 响应头。对于常见的后端框架：

**FastAPI (Python)**：
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # 本地开发
        "http://localhost:5173",  # Vite dev server
        "https://your-vercel-domain.vercel.app",  # 生产环境
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Express.js (Node.js)**：
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-vercel-domain.vercel.app',
  ],
  credentials: true,
}));
```

#### 3. 构建和部署

Vercel 会自动：
1. 检测 Vite 项目配置
2. 运行 `npm run build`
3. 从 `dist/` 目录部署静态文件

### 故障排除

**问题：Failed to fetch 或 CORS error**

解决方案：
1. 检查浏览器控制台错误信息，确认是 CORS 还是网络错误
2. 在 Vercel 部署日志中查看构建过程是否正常
3. 确认后端 API 地址正确且可从 Vercel 访问
4. 在后端添加详细的日志记录，查看是否收到来自 Vercel 域名的请求

**问题：HTTPS/HTTP 混合内容警告**

解决方案：
- 在后端部署 SSL 证书，使用 HTTPS
- 或在 Vercel 配置中使用 HTTPS 代理

### 相关文件

- `.env.example` — 环境变量示例
- `src/services/facultyApi.ts` — API 服务，使用 `VITE_API_BASE_URL` 环境变量
- `vite.config.ts` — Vite 配置

### 验证部署

部署后，可以在浏览器开发者工具中：
1. 打开 Network 标签
2. 查看是否成功发起 API 请求到 `43.98.254.243:8001`
3. 检查响应状态码和 CORS 相关的响应头
