# 会议室预订系统

一个支持中英文切换、PC和移动端自适应的会议室预订管理系统。

---

## 目录结构

```
metting-room/
├── backend/   # Go 后端服务
├── frontend/  # React 前端项目
```

---

## 后端（Go + Gin + SQLite）

### 依赖安装
```bash
cd backend
# 安装依赖
go mod tidy
```

### 启动开发环境
```bash
go run main.go
# 默认监听 80 端口
```

### 生产环境构建
```bash
go build -o server main.go
./server
```

---

## 前端（React + Ant Design）

### 依赖安装
```bash
cd frontend
npm install --legacy-peer-deps
```

### 启动开发环境
```bash
npm start
# 默认监听 3000 端口
```

### 生产环境打包
```bash
npm run build
# 生成的静态文件在 frontend/build 目录
```

---

## Nginx 部署示例

1. 后端服务监听 80 端口，前端静态文件放到 Nginx 静态目录
2. Nginx 配置反向代理 API 和前端静态资源

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /path/to/metting-room/frontend/build;
        try_files $uri /index.html;
    }
}
```

---

## 其他说明
- 后端接口文档：访问 http://localhost/swagger/index.html
- 默认管理员账号：admin / admin
- 支持PC和移动端自适应
- 支持中英文切换
- 密码加密存储，安全性高
- 如有问题请联系开发者。 