# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI故事讲述器是一个基于TypeScript的全栈应用，用于创作和管理智能语音故事。系统支持剧本管理、角色配音、语音合成等功能，核心技术栈包括React前端、Express后端和MongoDB数据库。

## 开发命令

### 后端开发
```bash
cd backend
npm run dev          # 启动开发服务器 (nodemon + ts-node)
npm run build        # TypeScript编译
npm run test         # 运行Jest测试
npm run lint         # ESLint代码检查
npm run lint:fix     # 自动修复ESLint问题
```

### 前端开发
```bash
cd frontend
npm start            # 启动React开发服务器 (port 3000)
npm run build        # 构建生产版本
npm run test         # 运行React测试
npm run lint         # ESLint代码检查
npm run lint:fix     # 自动修复ESLint问题
```

### 数据脚本
```bash
cd scripts
npm run import       # 导入数据到MongoDB
npm run import-voices # 导入音色数据
npm run clean        # 清理数据库
```

## 架构设计

### 核心服务架构
系统采用分层架构设计：
- **Controller层**：处理HTTP请求和响应
- **Service层**：业务逻辑实现，包括TTSService、ConversionService、ScriptParserService
- **Model层**：MongoDB数据模型定义
- **Validator层**：Joi数据验证

### 关键组件

**TTSService**: 火山引擎TTS API集成，负责文本转语音
- 配置要求：TTS_TOKEN、TTS_APP_ID、TTS_CLUSTER环境变量
- 支持音色、语速、音量、音调参数调节

**ConversionService**: 语音转换任务管理
- 异步处理章节内容转音频
- 进度跟踪和错误处理
- 音频文件输出到 `uploads/audio/`

**ScriptParserService**: 剧本解析器
- 解析Markdown格式的故事内容
- 识别角色对话格式：`（角色名）：对话内容`
- 生成对话序列用于TTS转换

### 数据模型关系
- **StorySeries** -> **Chapter** (一对多)
- **Character** -> **Voice** (多对一)
- **ConversionTask** -> **Chapter** (一对一)
- 角色通过 `voice_id` 关联到TTS音色配置

## 环境配置

### 必需的环境变量
```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/ai_story_teller

# 服务器
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 火山引擎TTS
TTS_TOKEN=your_tts_token_here
TTS_APP_ID=your_app_id_here
TTS_CLUSTER=volcano_tts
```

### 依赖要求
- Node.js >= 18.0.0
- MongoDB >= 6.0
- 前端代理设置：`"proxy": "http://localhost:3001"`

## 开发注意事项

### 角色配置管理
- 角色配置存储在 `config/roles.yml` 中，按故事系列分类
- 每个角色必须配置对应的TTS音色ID
- 支持的音色类型：成人、儿童、老人、神话等不同年龄和性别组合

### 文件路径规范
- 故事Markdown文件：`data/input/{故事系列}/`
- 生成音频：`data/output/{故事系列}/`
- 上传音频：`backend/uploads/audio/`
- 静态文件服务：`/audio` 路由映射到 `uploads/audio`

### API端点结构
- `/api/voices` - 音色管理
- `/api/characters` - 角色管理
- `/api/stories` - 故事系列管理
- `/api/chapters` - 章节管理
- `/api/conversions` - 转换任务管理

### 错误处理
- 所有服务使用统一错误中间件 `errorHandler`
- TTS服务调用包含重试机制和详细日志
- 转换任务支持进度跟踪和错误恢复

### 测试和构建
- 运行测试前确保MongoDB服务启动
- 前端使用CRA默认测试配置
- 后端测试使用Jest + TypeScript
- 生产构建需要先编译TypeScript后启动

## 故事格式规范

### Markdown对话格式
```markdown
（角色名）：这是角色的对话内容
```

### 角色命名规则
- 角色名必须与 `config/roles.yml` 中的配置完全匹配
- 支持群体角色（如"小猪们"、"观众"等）
- 特殊角色（如"旁白"、"魔法塔"等）

### 故事系列组织
每个故事系列包含多个章节，按编号顺序组织：
- `01-章节标题.md`
- `02-章节标题.md`
- 等等