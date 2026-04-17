# 暗标检测系统 V2 — Web 版需求文档 V2

## 1. 项目概述

### 1.1 项目背景
暗标检测系统是招投标行业的专业工具，用于自动检测 Word 文档（.docx）是否符合"暗标"编制规则。原系统为 Python Flask 本地桌面应用，现需要重构为现代化 Web 应用，部署到 Vercel，使用 Supabase 作为后端数据库。

### 1.2 项目目标
- 前后端分离的 Web 应用，全部部署在 Vercel
- 用户注册/登录系统（Supabase Auth）
- 保留激活系统，用户与激活码关联
- 支持内置地区规则 + 用户自定义地区规则（保存到数据库）
- 单文件检测（不支持批量）
- 新增：一键修复检测问题 + 下载修复后的文件

### 1.3 目标用户
- 招投标从业人员
- 投标文件编制人员
- 招标代理机构

---

## 2. 技术架构

### 2.1 整体架构

```
Vercel
├── /app                    # Next.js 前端 (App Router)
├── /api/detect             # Python Serverless - 检测接口
├── /api/fix                # Python Serverless - 一键修复接口
├── /api/regions            # Python Serverless - 规则管理
└── /api/activation         # Python Serverless - 激活管理

Supabase (数据库 + Auth)
├── auth (用户认证)
├── profiles (用户资料)
├── activations (激活记录)
├── custom_regions (用户自定义规则)
└── detection_history (检测历史)
```

### 2.2 前端技术栈
- **框架**: Next.js 14+ (App Router)
- **UI 库**: Tailwind CSS + shadcn/ui
- **状态管理**: React Hooks / Zustand
- **文件上传**: react-dropzone
- **Supabase 客户端**: @supabase/supabase-js

### 2.3 后端技术栈
- **API**: Vercel Python Serverless Functions (FastAPI)
- **文档处理**: python-docx (检测 + 修复)
- **数据库 + Auth**: Supabase

### 2.4 数据库设计 (Supabase)

```sql
-- 用户资料（Supabase Auth 自动管理 auth.users）
create table profiles (
  id uuid references auth.users primary key,
  email text,
  display_name text,
  created_at timestamptz default now()
);

-- 激活记录
create table activations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  activation_code text unique not null,
  mode text check (mode in ('time', 'count')),
  total_count int,          -- 次数模式
  remaining_count int,      -- 次数模式剩余
  expire_date timestamptz,  -- 时间模式到期日
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 用户自定义地区规则
create table custom_regions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  name text not null,
  description text,
  config jsonb not null,    -- 完整的检测配置 JSON
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 检测历史
create table detection_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  file_name text,
  region_code text,
  overall_result text,      -- 'pass' or 'fail'
  total_issues int,
  result_data jsonb,        -- 完整检测结果
  created_at timestamptz default now()
);
```

### 2.5 部署方案
| 组件 | 平台 | 说明 |
|------|------|------|
| 前端 | Vercel | Next.js App Router |
| 后端 API | Vercel | Python Serverless Functions |
| 数据库 | Supabase | PostgreSQL + Auth + Storage |
| 文件存储 | Supabase Storage | 临时存储上传文件（可选） |

---

## 3. 功能需求

### 3.1 用户系统

#### 3.1.1 注册/登录
- 邮箱 + 密码注册登录
- Supabase Auth 管理
- 登录状态持久化
- 登出功能

#### 3.1.2 激活系统
- 输入激活码激活账号
- 激活码类型：
  - **时间模式**：激活后 N 天内有效
  - **次数模式**：激活后可使用 N 次
- 激活信息保存到 Supabase
- 未激活用户受限使用（如每天限检 1 次）

#### 3.1.3 用户中心
- 查看激活状态（有效期/剩余次数）
- 查看检测历史记录
- 管理自定义地区规则

### 3.2 核心检测功能（单文件）

#### 3.2.1 文件上传
- 支持 .docx 格式
- 最大 16MB
- **仅支持单文件**（不支持批量）
- 拖拽或点击上传

#### 3.2.2 检测规则
- **页面格式检测**：A4 纸张、方向、页边距、页眉页脚、页码、空白页
- **字体格式检测**：字体名称、字号、颜色、斜体、下划线、行间距、段落间距
- **标题格式检测**：编号模式、层级检查
- **内容检查**：敏感词、图片、电子签名

#### 3.2.3 检测报告
- 总体通过/不通过
- 按类别分组问题列表
- 严重程度分级
- 问题位置 + 当前值 vs 应有值
- 修改建议

### 3.3 地区规则管理

#### 3.3.1 内置地区规则
- 预置若干城市规则（洛阳市等）
- 从代码/config 读取，不可修改
- 用户可选择使用

#### 3.3.2 用户自定义规则
- 用户可创建自定义检测规则
- 配置项：页边距、字体、字号、行距、标题模式、敏感词等
- 保存到 Supabase，与用户 ID 关联
- 支持增删改查
- 检测时可选择使用自定义规则

### 3.4 一键修复功能（新功能）

#### 3.4.1 功能说明
- 检测出问题后，提供"一键修复"按钮
- 后端根据检测结果自动修复文档中的问题
- 修复范围：
  - 页面格式：调整页边距、删除页眉页脚页码
  - 字体格式：统一字体、字号、颜色、行距
  - 标题格式：标准化编号
  - 内容：提示但**不自动删除**敏感内容（仅标注）
- 修复后生成新 .docx 文件供下载

#### 3.4.2 修复流程
1. 用户上传文件 → 检测完成
2. 点击"一键修复"
3. 后端读取原始文件 + 检测结果
4. 逐项修复可自动修复的问题
5. 生成修复后的文件
6. 返回下载链接
7. 用户下载修复后的文件

#### 3.4.3 修复报告
- 修复了哪些问题
- 哪些问题无法自动修复（需手动处理）
- 修复前后对比摘要

---

## 4. UI 设计需求

### 4.1 设计风格
- **待确认**：用户需要先看参考图片确认风格方向
- 候选风格：现代科技风 / 简约商务风 / 暗色主题专业风

### 4.2 页面结构

#### 页面列表
1. **登录/注册页** — 简洁表单
2. **首页（上传+检测）** — 核心功能页
3. **检测中** — 加载/进度动画
4. **结果页** — 检测结果 + 一键修复
5. **用户中心** — 激活状态 + 历史 + 自定义规则
6. **自定义规则编辑页** — 规则配置表单

---

## 5. API 设计

```
POST   /api/detect              # 上传 .docx 文件，返回检测结果
POST   /api/fix                 # 根据检测结果修复文件，返回修复后文件
GET    /api/regions             # 获取内置地区列表
GET    /api/regions/{id}        # 获取地区规则详情
POST   /api/regions/custom      # 创建自定义规则（需登录）
PUT    /api/regions/custom/{id} # 更新自定义规则
DELETE /api/regions/custom/{id} # 删除自定义规则
POST   /api/activation/verify   # 验证激活码
GET    /api/activation/status   # 获取当前用户激活状态
```

---

## 6. 开发计划

### Phase 0：需求确认 + UI 设计（1-2天）
- [ ] 确认 UI 风格方向（看参考图）
- [ ] 确认页面布局 wireframe
- [ ] 确认配色方案

### Phase 1：项目搭建 + Supabase 配置（1天）
- [ ] Next.js 项目初始化 + Tailwind + shadcn/ui
- [ ] Supabase 项目创建 + 数据库表
- [ ] 环境变量配置
- [ ] Vercel 项目配置

### Phase 2：用户系统（1-2天）
- [ ] 登录/注册页面
- [ ] Supabase Auth 集成
- [ ] 激活码验证
- [ ] 用户中心页面

### Phase 3：后端检测 API（2-3天）
- [ ] Python 检测逻辑迁移
- [ ] POST /api/detect 接口
- [ ] 地区规则管理
- [ ] 自定义规则 CRUD

### Phase 4：前端核心页面（2-3天）
- [ ] 首页：文件上传 + 配置
- [ ] 检测中：加载动画
- [ ] 结果页：检测结果展示

### Phase 5：一键修复功能（2-3天）
- [ ] Python 修复逻辑开发
- [ ] POST /api/fix 接口
- [ ] 前端修复按钮 + 下载

### Phase 6：集成测试 + 部署（1-2天）
- [ ] 前后端联调
- [ ] 真实文件测试
- [ ] Vercel 部署上线
