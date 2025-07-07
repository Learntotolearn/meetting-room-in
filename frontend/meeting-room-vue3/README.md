# 会议室预订系统 - Vue3 版本

## 项目概述

这是会议室预订系统的 Vue3 重构版本，基于 Vite + Vue3 + TypeScript + Ant Design Vue 技术栈构建。

## 技术栈

- **Vue 3.4+** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Ant Design Vue 4.0+** - 企业级 UI 设计语言和 React 组件库
- **@dootask/tools** - DooTask 微前端工具包
- **Axios** - HTTP 客户端
- **Pinia** - Vue 状态管理库
- **Vue Router 4** - Vue.js 官方路由管理器

## 项目结构

```
meeting-room-vue3/
├── src/
│   ├── views/                 # 页面组件
│   │   ├── Login.vue         # 登录/注册页面
│   │   ├── RoomBookingPage.vue # 会议室预订页面
│   │   ├── MyBookings.vue    # 我的预订页面
│   │   ├── RoomManage.vue    # 会议室管理页面
│   │   ├── BookingManage.vue # 预订管理页面
│   │   ├── ProfilePage.vue   # 个人信息页面
│   │   └── SystemSettingsPage.vue # 系统设置页面
│   ├── components/           # 通用组件
│   ├── assets/              # 静态资源
│   ├── App.vue              # 主应用组件
│   ├── main.ts              # 应用入口
│   ├── config.ts            # API 配置
│   └── style.css            # 全局样式
├── public/                  # 公共静态资源
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── README.md               # 项目说明
```

## 主要功能

### 1. 用户认证
- 登录/注册功能
- 自动登录（微前端环境下）
- Token 管理
- 用户信息管理

### 2. 会议室预订
- 会议室列表展示
- 时间段选择
- 预订表单
- 预订状态管理

### 3. 我的预订
- 个人预订记录查看
- 预订取消功能
- 预订状态跟踪

### 4. 会议室管理（管理员）
- 会议室增删改查
- 会议室状态管理
- 容量设置

### 5. 预订管理（管理员）
- 所有预订记录查看
- 预订状态管理
- 预订取消功能

### 6. 个人信息
- 基本信息修改
- 密码修改
- 用户信息更新

### 7. 系统设置（管理员）
- 系统基本设置
- 用户管理
- 角色权限管理

## 微前端支持

### @dootask/tools 集成
- `isMicroApp()` - 检测是否为微前端环境
- `getUserInfo()` - 获取用户信息
- `appReady()` - 应用就绪状态
- `closeApp()` - 关闭应用（iframe 环境）

### 自动登录流程
1. 应用启动时调用 `appReady()`
2. 检测微前端环境
3. 获取用户信息
4. 自动登录处理
5. 设置用户状态

## 移动端适配

### 响应式设计
- 使用 Ant Design Vue 的栅格系统
- 媒体查询适配不同屏幕尺寸
- 触摸友好的交互设计

### 移动端优化
- 大按钮设计
- 简化导航
- 优化表单交互

## 开发指南

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## API 配置

### 基础配置
- 开发环境：`http://localhost:3001/api`
- 生产环境：`/api`

### 请求拦截器
- 自动添加 Authorization token
- 统一错误处理
- 401 状态自动跳转登录

### 响应拦截器
- 统一响应处理
- 错误信息提示
- Token 失效处理

## 样式系统

### 设计规范
- 使用 Ant Design Vue 设计语言
- 统一的颜色系统
- 一致的间距规范

### 移动端适配
```css
@media (max-width: 700px) {
  /* 移动端样式 */
}
```

## 状态管理

### 响应式数据
- 使用 Vue3 的 `ref` 和 `reactive`
- 组件级别的状态管理
- Props 和 Emits 通信

### 全局状态
- 用户信息状态
- 登录状态
- 应用配置状态

## 路由系统

### 页面路由
- 基于组件的路由系统
- 条件渲染页面组件
- 菜单导航联动

### 权限控制
- 基于用户角色的页面访问控制
- 管理员功能权限控制
- 动态菜单显示

## 错误处理

### 全局错误处理
- API 请求错误统一处理
- 用户友好的错误提示
- 网络错误重试机制

### 表单验证
- 客户端表单验证
- 实时验证反馈
- 自定义验证规则

## 性能优化

### 代码分割
- 基于路由的代码分割
- 组件懒加载
- 按需导入

### 构建优化
- Vite 快速构建
- TypeScript 类型检查
- 生产环境优化

## 部署说明

### 开发环境
1. 确保后端服务运行在 `http://localhost:3001`
2. 启动前端开发服务器
3. 访问 `http://localhost:3000`

### 生产环境
1. 构建项目：`npm run build`
2. 部署 `dist` 目录
3. 配置反向代理到后端 API

## 注意事项

1. **微前端环境**：确保主应用正确传递用户信息
2. **API 接口**：需要后端提供对应的 RESTful API
3. **权限控制**：管理员功能需要后端权限验证
4. **移动端测试**：建议在不同设备上测试移动端体验

## 更新日志

### v0.1.0 (2024-01-XX)
- 初始版本发布
- 完整的会议室预订功能
- Vue3 + TypeScript 重构
- 微前端支持
- 移动端适配 