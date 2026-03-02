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

## 在服务器上部署（内网/外网访问）

### 开发环境运行（推荐用于测试）

如果你想在服务器上运行 Vite 开发服务器，允许其他人访问：

1. 确保防火墙允许端口 5173 的访问：
```bash
# Linux 防火墙
sudo ufw allow 5173
# 或检查 iptables
sudo iptables -I INPUT -p tcp --dport 5173 -j ACCEPT
```

2. 创建 `.env.local` 文件：
```
VITE_API_BASE_URL=http://43.98.254.243:8001
```

3. 运行开发服务器：
```bash
npm run dev
```

4. 服务器地址（替换为你的实际 IP）：
   - **本地访问**: `http://localhost:5173`
   - **内网访问**: `http://192.168.x.x:5173` （当前服务器 IP）
   - **外网访问**: `http://<公网IP>:5173` 或 `http://<域名>:5173`

### 生产环境部署（推荐用于长期运行）

使用构建产物 + 反向代理部署更稳定：

#### 第 1 步：构建项目
```bash
npm run build
```

输出目录：`dist/`

#### 第 2 步：配置 Web 服务器

**使用 Nginx（推荐）**：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 或服务器 IP

    # 静态文件
    location / {
        root /path/to/dist;  # 修改为实际的 dist 目录路径
        try_files $uri $uri/ /index.html;  # 前端路由 fallback
    }

    # API 代理（可选，避免跨域）
    location /api/ {
        proxy_pass http://43.98.254.243:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

然后重启 Nginx：
```bash
sudo systemctl restart nginx
```

**使用 Node.js + Express**：

```bash
npm install -g serve
serve -s dist -l 3000
```

然后通过 `http://server-ip:3000` 访问。

#### 第 3 步：生产环境变量

在启动前设置环境变量：
```bash
# 直接启动
export VITE_API_BASE_URL=http://43.98.254.243:8001
npm run dev

# 或者在 .env.production 中配置
```

### 获取服务器 IP

```bash
# 查看所有 IP 地址
hostname -I

# 查看特定网卡 IP（如 eth0）
ip addr show eth0
```

根据网络环境选择合适的 IP：
- **内网 IP** (如 192.168.x.x)：用于同一局域网内的访问
- **公网 IP** (如 x.x.x.x)：用于互联网访问
- **域名** (如 example.com)：最推荐，稳定且易记

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
