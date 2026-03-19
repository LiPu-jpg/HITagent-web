# HITA Agent - LibreChat Edition

基于 [LibreChat](https://github.com/danny-avila/LibreChat) 的哈工大智能助手 Web 端。

## 架构

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│   用户      │────▶│  LibreChat   │────▶│  agent-backend │
│  (浏览器)   │◀────│  (Web UI)    │◀────│  (localhost:   │
│             │     │  :3080       │     │   8080)        │
└─────────────┘     └──────────────┘     └────────────────┘
                           │
                    ┌──────┴──────┐
                    │   MiniMax   │
                    │  M2.7 API   │
                    └─────────────┘
```

## 快速启动

### 方式一: Docker Compose (推荐)

```bash
# 1. 复制环境变量
cp .env.example .env

# 2. 启动 (确保 localhost:8080 后端已运行)
docker-compose up -d

# 3. 访问 http://localhost:3080
```

### 方式二: 手动安装 LibreChat

```bash
# 1. 克隆 LibreChat
git clone https://github.com/danny-avila/LibreChat.git
cd LibreChat

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 添加:
# MINIMAX_API_KEY=your_key
# AGENT_BACKEND_URL=http://localhost:8080

# 4. 复制 HITA Agent 配置
cp /path/to/hita-agent-config.yaml ./config/agents/

# 5. 启动
npm run start
```

## 配置说明

### MiniMax API

```env
MINIMAX_API_KEY=sk-cp-xqBXPT7PTX8CG_...
MINIMAX_API_BASE=https://api.minimaxi.com
MINIMAX_MODEL=MiniMax-M2.7
```

### Agent Backend

确保 agent-backend 在 `localhost:8080` 运行:

```bash
# 后端启动命令 (参考 agent-backend 文档)
cd agent-backend
npm run dev
```

## 功能

- 🔍 **统一搜索**: rag/brave/course/hit_teacher 多数据源
- 📚 **课程查询**: 课程信息、README、评价
- 📝 **PR 提交**: 支持深圳/本部/威海三校区
- 👨‍🏫 **老师查询**: 教师信息检索
- 🌐 **网页抓取**: crawl4ai 集成
- 📦 **COS 存储**: 文件管理
- 🔧 **MCP 工具**: 扩展能力

## PR 提交规则 (2026-03-18)

| 校区 | 支持操作 |
|------|---------|
| shenzhen | `append_course_section_item`, `add_course_teacher_review` 等 |
| harbin/weihai | 仅 `add_section_item`, `add_lecturer_review` |

**禁止**: `append_course_review` (已废弃)

## 文件结构

```
HITagent-web/
├── docker-compose.yml     # Docker 部署配置
├── .env.example           # 环境变量模板
├── hita-agent-config.yaml # HITA Agent 技能配置
└── README.md
```

## License

MIT
