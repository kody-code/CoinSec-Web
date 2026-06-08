# CoinSec Web 前端设计

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | ^3.5 | 框架 |
| TypeScript | ~6.0 | 类型安全 |
| Vite | ^8.0 | 构建工具 |
| vue-router | ^4.x | 路由管理 |
| Pinia | ^2.x | 状态管理 |
| Axios | ^1.x | HTTP 请求 |
| Element Plus | ^2.x | UI 组件库 |
| ECharts / vue-echarts | 待定 | 图表统计 |
| @element-plus/icons-vue | ^2.x | 图标库 |
| pnpm | - | 包管理 |

## 项目结构

```
src/
├── main.ts                    # 入口
├── App.vue                    # 根组件
├── style.css                  # 全局样式
├── api/                       # API 请求层
│   ├── request.ts             # Axios 封装（拦截器、token）
│   ├── auth.ts                # Auth API
│   ├── user.ts                # User API
│   ├── category.ts            # Category API
│   ├── account.ts             # Account API
│   ├── record.ts              # Record API
│   └── transfer.ts            # Transfer API
├── router/
│   └── index.ts               # 路由配置
├── stores/                    # Pinia Store
│   ├── auth.ts                # 认证状态
│   └── app.ts                 # 全局状态
├── views/                     # 页面组件
│   ├── Login.vue              # 登录/初始化页
│   ├── Dashboard.vue          # 首页仪表盘
│   ├── Records.vue            # 账单列表
│   ├── RecordForm.vue         # 新增/编辑记录
│   ├── Statistics.vue         # 统计页面
│   ├── Accounts.vue           # 账户管理
│   ├── Categories.vue         # 分类管理
│   └── Profile.vue            # 个人中心
├── components/                # 可复用组件
│   ├── AppLayout.vue          # 主布局（侧边栏+顶栏+内容区）
│   ├── Sidebar.vue            # 侧边导航
│   ├── TopBar.vue             # 顶部栏
│   ├── StatCard.vue           # 统计卡片
│   ├── RecordItem.vue         # 账单条目
│   ├── CategoryIcon.vue       # 分类图标
│   ├── EmptyState.vue         # 空状态
│   ├── LoadingSpinner.vue     # 加载
│   └── Pagination.vue         # 分页
├── types/                     # TypeScript 类型
│   └── index.ts               # 接口类型定义
└── utils/                     # 工具
    └── format.ts              # 金额/日期格式化
```

## 页面路由

| 路径 | 视图 | 说明 | 需要登录 |
|------|------|------|---------|
| `/login` | Login | 登录 / 首次初始化 | 否 |
| `/dashboard` | Dashboard | 首页仪表盘 | 是 |
| `/records` | Records | 账单列表 + 筛选 | 是 |
| `/records/new` | RecordForm | 新增记录 | 是 |
| `/records/:id/edit` | RecordForm | 编辑记录 | 是 |
| `/statistics` | Statistics | 收支统计 + 图表 | 是 |
| `/accounts` | Accounts | 账户管理 | 是 |
| `/categories` | Categories | 分类管理 | 是 |
| `/profile` | Profile | 个人中心 | 是 |

## 页面设计

### 1. 登录页 `/login`

- 判断是否已初始化（调用 `GET /api/user/info` 是否返回 401）
  - 如果未初始化 → 显示注册表单（用户名 + 密码 + 确认密码）
  - 如果已初始化 → 显示登录表单（用户名 + 密码）
- 登录成功后跳转 `/dashboard`

### 2. 首页仪表盘 `/dashboard`

```
┌──────────┬──────────┬──────────┐
│ 本月收入  │ 本月支出  │  结余     │
│  ¥5,000  │  ¥3,200  │  ¥1,800  │
├──────────┴──────────┴──────────┤
│ 近7日收支趋势（折线图）          │
├────────────────────────────────┤
│ 账户概览                        │
│ 微信  ¥1,000                    │
│ 支付宝 ¥500                     │
│ 现金    ¥300                    │
├────────────────────────────────┤
│ 最近5条记录                      │
│ 餐饮  25.00    06-04            │
│ 交通  10.00    06-04            │
│ ...                             │
└────────────────────────────────┘
```

### 3. 账单列表 `/records`

```
┌────────────────────────────────┐
│ 筛选栏: [日期范围] [分类] [类型] │
├────────────────────────────────┤
│ 餐饮    25.00    06-04  🍔     │
│ 交通    10.00    06-04  🚗     │
│ 工资  5000.00    06-01  💰     │
│ ...                             │
├────────────────────────────────┤
│ [上一页]  1/5  [下一页]          │
└────────────────────────────────┘
```

### 4. 新增/编辑记录 `/records/new`

- 悬浮按钮或页面右上角"+"进入
- 表单字段：类型（收入/支出切换）、金额、分类（图标列表选择）、账户、日期时间、备注
- 提交后关闭并刷新列表

### 5. 统计页面 `/statistics`

- 日期范围选择（月/自定义）
- 环形图：支出分类占比
- 柱状图：每日收支对比
- 表格：各分类汇总数据

### 6. 账户管理 `/accounts`

- 卡片列表展示各账户余额
- 新增/编辑/删除账户
- 删除确认弹窗

### 7. 分类管理 `/categories`

- 分「支出」「收入」两个 tab
- 列表展示分类图标 + 名称
- 新增/编辑/删除分类

### 8. 个人中心 `/profile`

- 头像上传
- 昵称修改
- 密码修改

## 布局方案

采用侧边栏 + 顶栏 + 内容区的经典管理后台布局：

```
┌────────┬──────────────────────────┐
│        │  顶栏（标题 + 用户信息）   │
│ 侧边栏  ├──────────────────────────┤
│        │                          │
│ 导航    │      内容区               │
│        │                          │
│        │                          │
└────────┴──────────────────────────┘
```

侧边栏菜单：
- 📊 首页
- 📝 账单
- 📈 统计
- 💳 账户
- 🏷️ 分类
- 👤 个人中心

## API 对接

请求封装（`api/request.ts`）：

```typescript
// Axios 实例，自动注入 satoken header
// 401 响应时自动跳转登录页
// 统一错误提示
```

所有后端 API 路径见 `docs/Backend/API.md`。

## 开发顺序

1. 项目基建：安装依赖（router、pinia、axios）、搭建目录结构
2. 请求封装 + 类型定义
3. 登录/初始化页
4. 主布局（侧边栏 + 路由）
5. 首页仪表盘
6. 账单列表 + 新增记录
7. 统计页面
8. 账户管理
9. 分类管理
10. 个人中心

## 待定事项

- 图表库选型（ECharts / Chart.js）
- 移动端适配方案
