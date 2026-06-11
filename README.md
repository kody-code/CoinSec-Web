# CoinSec Web

Vue 3 + TypeScript 个人财务管理 Web 前端，支持移动端（Capacitor）部署。

## 技术栈

- **Vue 3.5** + **TypeScript 6.0**
- **Vite 8** (构建工具)
- **Element Plus 2.14** (UI 组件库)
- **Pinia 2.3** (状态管理)
- **Vue Router 4** (Hash 路由)
- **Axios** (HTTP 请求)
- **Chart.js 4 + vue-chartjs** (图表)
- **Capacitor 8** (移动端容器)

## 页面路由

| 路径 | 页面 | 说明 | 需登录 |
|------|------|------|--------|
| `/login` | Login | 登录（浅色主题） | 否 |
| `/dashboard` | Dashboard | 仪表盘总览 | 是 |
| `/records` | Records | 记账记录列表 | 是 |
| `/records/new` | RecordForm | 新增记录 | 是 |
| `/records/:id/edit` | RecordForm | 编辑记录 | 是 |
| `/statistics` | Statistics | 数据统计（分类/收支切换） | 是 |
| `/accounts` | Accounts | 账户管理 | 是 |
| `/accounts/:id` | AccountDetail | 账户详情 | 是 |
| `/categories` | Categories | 分类管理 | 是 |
| `/tags` | Tags | 标签管理 | 是 |
| `/budgets` | Budgets | 预算管理 | 是 |
| `/profile` | Profile | 个人信息 | 是 |
| `/:pathMatch(.*)*` | NotFound | 404 页面 | 否 |

## 项目结构

```
src/
├── api/              # API 请求层
│   ├── base.ts       # API 基础地址
│   ├── request.ts    # Axios 实例与拦截器
│   ├── auth.ts
│   ├── account.ts
│   ├── category.ts
│   ├── record.ts
│   ├── transfer.ts
│   ├── user.ts
│   ├── tag.ts
│   └── budget.ts
├── assets/           # 静态资源
├── components/       # 通用组件
│   ├── AccountIcon.vue
│   ├── AppLayout.vue
│   ├── CategoryIcon.vue
│   ├── ClockPicker.vue
│   ├── DatePicker.vue
│   ├── EmptyState.vue
│   ├── LoadingSkeleton.vue
│   └── StatCard.vue
├── router/           # 路由配置 (含 auth guard)
├── stores/           # Pinia 状态 (auth)
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数 (colors, format, platform)
├── views/            # 页面组件
│   ├── AccountDetail.vue
│   ├── Accounts.vue
│   ├── Budgets.vue
│   ├── Categories.vue
│   ├── Dashboard.vue
│   ├── Login.vue
│   ├── NotFound.vue
│   ├── Profile.vue
│   ├── RecordForm.vue
│   ├── Records.vue
│   ├── Statistics.vue
│   └── Tags.vue
├── App.vue           # 根组件
├── main.ts           # 入口文件
└── style.css         # 全局样式
```

## 主要功能

- **记账表单**：自定义日历弹窗（带月份切换）、24h 时钟表盘弹窗（可编辑输入）、账户弹窗选择；原生端集成数字键盘 + 确认按钮
- **数据统计**：分类/收支切换图表，月度收支趋势，右侧分类详情列表
- **标签管理**：前端 CRUD（依赖后端接口）
- **预算管理**：前端 CRUD + 概览（依赖后端接口）
- **登录页**：浅色主题，毛玻璃光球背景
- **移动端**：Capacitor 8 打包 Android，原生端自适应布局

## 开发

```bash
pnpm install
pnpm dev
```

默认在 `http://localhost:3000` 启动，支持 HMR。

## 代理配置

开发服务器自动代理 `/api` 请求到 `https://coinsec.site`（生产地址）。可通过 `.env.development` 中 `VITE_API_PROXY_TARGET` 覆盖（默认 `http://192.168.1.28:8080`）。

## 构建

```bash
pnpm build
```

构建过程包含 TypeScript 类型检查（`vue-tsc -b`）+ Vite 构建，产物输出到 `dist/` 目录。

## 预览

```bash
pnpm preview
```

## 移动端

项目集成 Capacitor 8，可打包为 Android 应用：

```bash
pnpm exec cap sync     # 同步 Web 构建到原生项目
pnpm exec cap open android  # 打开 Android Studio
```

在 `App.vue` 中处理了移动端返回按钮逻辑，`utils/platform.ts` 自动检测原生环境以调整 API 基础地址。

## 项目版本

当前版本：`1.6.0`