# AI故事讲述器

基于TypeScript和主流框架的智能语音故事创作平台，支持剧本管理、角色配音和语音合成。

## 功能特性

- 🎵 **音色管理**：管理火山引擎TTS音色，支持试听和测试
- 👥 **角色管理**：管理故事角色和对应的配音设置
- 📖 **剧本创作**：管理故事系列和章节，支持Markdown编辑
- 🔄 **语音转换**：将剧本按角色自动转换为语音文件
- 📊 **任务管理**：实时监控语音转换进度和状态

## 功能展示


![功能展示](./images/20250719-232000.gif)


## 技术栈

### 后端
- **Node.js** + **TypeScript** + **Express**
- **MongoDB** + **Mongoose**
- **火山引擎TTS API**
- **Joi** 数据验证

### 前端  
- **React 18** + **TypeScript**
- **Ant Design** UI组件库
- **React Router** 路由管理
- **React Query** 数据请求
- **Axios** HTTP客户端

## 项目结构

```
ai_story_teller/
├── backend/                    # 后端API服务
│   ├── src/
│   │   ├── controllers/        # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── services/          # 业务服务
│   │   ├── middleware/        # 中间件
│   │   └── validators/        # 数据验证
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # 前端React应用
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/            # 页面
│   │   ├── services/         # API服务
│   │   ├── types/            # 类型定义
│   │   └── utils/            # 工具函数
│   ├── package.json
│   └── tsconfig.json
├── scripts/                    # 数据导入脚本
│   ├── import-data.js         # 数据导入
│   └── package.json
├── config/                     # 配置文件
│   └── roles.yml              # 角色配置
├── data/                       # 原始数据
│   ├── input/                 # 故事Markdown文件
│   └── output/                # 生成的音频文件
└── database/                   # 数据库相关
    └── schemas.js             # 数据结构定义
```

## 快速开始

### 1. 环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm 或 yarn

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖  
cd ../frontend
npm install

# 安装脚本依赖
cd ../scripts
npm install
```

### 3. 环境配置

#### 后端配置
复制 `backend/.env.example` 为 `backend/.env`：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/ai_story_teller

# 服务器配置
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# 火山引擎TTS配置
TTS_TOKEN=your_tts_token_here
TTS_APP_ID=your_app_id_here
TTS_CLUSTER=volcano_tts
```

#### 前端配置
复制 `frontend/.env.example` 为 `frontend/.env`：

```bash
cd frontend
cp .env.example .env
```

### 4. 启动MongoDB

确保MongoDB服务正在运行：

```bash
# macOS (使用Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
# 启动MongoDB服务
```

### 5. 导入数据

导入现有的角色配置和故事数据：

```bash
cd scripts
npm run import
```

### 6. 启动服务

```bash
# 启动后端服务 (端口3001)
cd backend
npm run dev

# 新终端窗口，启动前端服务 (端口3000)  
cd frontend
npm start
```

### 7. 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## API文档

### 音色管理
- `GET /api/voices` - 获取音色列表
- `POST /api/voices` - 创建音色
- `PUT /api/voices/:id` - 更新音色
- `DELETE /api/voices/:id` - 删除音色
- `POST /api/voices/:id/test` - 测试音色

### 角色管理
- `GET /api/characters` - 获取角色列表
- `POST /api/characters` - 创建角色
- `PUT /api/characters/:id` - 更新角色
- `DELETE /api/characters/:id` - 删除角色

### 故事管理
- `GET /api/stories` - 获取故事系列
- `POST /api/stories` - 创建故事系列
- `GET /api/stories/:id/chapters` - 获取章节列表

### 章节管理
- `GET /api/chapters` - 获取章节列表
- `POST /api/chapters` - 创建章节
- `POST /api/chapters/:id/parse` - 解析章节对话

### 转换任务
- `GET /api/conversions` - 获取转换任务
- `POST /api/conversions` - 创建转换任务
- `POST /api/conversions/:id/start` - 启动转换任务

## 开发指南

### 添加新的音色
1. 在音色管理页面添加音色配置
2. 配置音色的基本信息和火山引擎音色ID
3. 使用试听功能测试音色效果

### 创建新的故事
1. 在剧本创作页面创建故事系列
2. 添加章节并编写Markdown内容
3. 使用 `（角色名）：对话内容` 格式编写对话
4. 解析章节内容匹配角色

### 语音转换
1. 确保章节内容已解析并匹配角色
2. 创建转换任务并设置语音参数
3. 启动转换任务，系统将自动生成音频文件

## 许可证

本项目采用 MIT 许可证。