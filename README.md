# CoinSec Web

Vue 3 + TypeScript 个人财务管理 Web 前端。

## 技术栈

- Vue 3.5 + TypeScript 6.0
- Vite 8.0
- Element Plus 2.14（UI 组件库）
- Pinia（状态管理）
- Vue Router 4（路由）
- Axios（HTTP 请求）
- Chart.js + vue-chartjs（图表）

## 页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | Login | 登录/注册 |
| `/` | Dashboard | 仪表盘总览 |
| `/records` | Records | 记账记录列表 |
| `/record/new` | RecordForm | 新增记录 |
| `/record/:id/edit` | RecordForm | 编辑记录 |
| `/accounts` | Accounts | 账户管理 |
| `/categories` | Categories | 分类管理 |
| `/statistics` | Statistics | 数据统计 |
| `/profile` | Profile | 个人信息 |
| `/:pathMatch(.*)*` | NotFound | 404 |

## 开发

```bash
pnpm install
pnpm dev
```

默认在 `http://localhost:3000` 启动，支持 HMR。

开发服务器自动代理 `/api` 到 `http://localhost:8080`。

## 构建

```bash
pnpm build
```

产物输出到 `dist/` 目录。

## 预览

```bash
pnpm preview
```
