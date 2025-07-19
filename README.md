# 🎭 AI故事讲述器

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

基于TypeScript和现代Web技术栈的**智能语音故事创作平台**，集成火山引擎TTS API，为内容创作者提供一站式的剧本创作、角色配音和语音合成解决方案。

## ✨ 核心功能

### 🎵 智能音色管理
- **音色库管理**：集成火山引擎280+优质音色，支持中英文、多语言
- **实时试听**：一键试听音色效果，支持自定义文本测试
- **样本管理**：自动保存音色样本，便于后续对比选择
- **批量测试**：提供批量音色测试脚本，快速筛选合适音色

### 👥 专业角色管理  
- **角色档案**：详细的角色信息管理（姓名、性别、年龄、性格特点）
- **配音绑定**：为每个角色配置专属音色，支持实时预览
- **智能搜索**：多维度搜索功能（名称、性别、年龄类型、性格）
- **分类组织**：按故事系列、角色类型等维度灵活分类

### 📖 高效剧本创作
- **可视化编辑**：支持Markdown格式，实时预览编辑效果
- **智能解析**：自动识别对话格式 `（角色名）：对话内容`
- **角色匹配**：智能匹配脚本中的角色与角色库
- **章节管理**：完善的故事系列和章节组织结构

### 🔄 自动语音转换
- **批量转换**：一键将整个章节转换为多角色语音
- **参数调节**：支持语速、音量、音调等细节调节
- **旁白处理**：自动为旁白配置合适的叙述音色
- **容错机制**：未配音角色自动使用默认音色，确保转换完整性

### 📊 任务状态监控
- **实时进度**：可视化显示转换任务进度和状态
- **任务管理**：支持启动、暂停、取消转换任务
- **历史记录**：完整的转换历史和文件管理
- **错误处理**：详细的错误信息和重试机制

## 🎬 功能展示

![功能展示](./images/20250719-232000.gif)

## 🏗️ 架构设计

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 React    │───▶│   后端 API      │───▶│  火山引擎 TTS   │
│                 │    │                 │    │                 │
│ • 用户界面      │    │ • 业务逻辑      │    │ • 语音合成      │
│ • 状态管理      │    │ • 数据验证      │    │ • 音色管理      │
│ • 路由管理      │    │ • 任务调度      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │              ┌─────────────────┐              
         └──────────────▶│   MongoDB       │              
                         │                 │              
                         │ • 用户数据      │              
                         │ • 故事内容      │              
                         │ • 音频文件      │              
                         └─────────────────┘              
```

### 数据流转
1. **内容创作**：用户在前端创建故事系列和章节
2. **脚本解析**：后端解析剧本内容，识别角色和对话
3. **角色匹配**：自动或手动匹配角色与音色
4. **语音合成**：调用火山引擎API生成音频
5. **文件管理**：音频文件存储和访问管理

## 💻 技术栈

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
├── scripts/                    # 工具脚本
│   ├── import-data.js         # 数据导入脚本
│   ├── import-voices.js       # 音色批量导入
│   ├── batch-test-voices.js   # 音色批量测试
│   └── package.json
├── config/                     # 配置文件
│   └── roles.yml              # 角色配置模板
├── data/                       # 数据文件
│   ├── input/                 # 故事Markdown源文件
│   └── output/                # 生成的音频文件
├── images/                     # 项目展示图片
├── docs/                       # 文档
│   ├── SDK_Integration_zh.md  # SDK集成文档
│   └── 火山引擎音色列表.md    # 音色清单
├── database/                   # 数据库相关
│   └── schemas.js             # 数据模型定义
└── uploads/                    # 上传文件存储
    ├── audio/                 # 生成的音频文件
    └── voices/                # 音色样本文件
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

## 🚀 使用指南

### 基本工作流程

#### 1. 音色管理
```bash
# 导入火山引擎音色库
cd scripts
node import-voices.js

# 批量测试音色效果
node batch-test-voices.js
```

#### 2. 创建角色
- 访问"角色管理"页面
- 点击"添加角色"，填写角色信息
- 为角色选择合适的音色
- 使用"试听"功能确认效果

#### 3. 编写剧本
- 访问"剧本创作"页面
- 创建新的故事系列和章节
- 使用以下格式编写对话：
```markdown
（旁白）：在一个遥远的王国里...
（小明）：你好，我叫小明！
（小红）：很高兴认识你，小明。
```

#### 4. 角色绑定
- 在章节详情页面，系统会自动解析角色
- 为每个角色选择对应的配音演员
- 支持实时试听和调整

#### 5. 语音转换
- 确保所有角色都已配置音色
- 创建转换任务，设置语音参数
- 启动转换，系统将自动生成完整音频

### 高级功能

#### 智能角色匹配
系统支持自动匹配角色：
- 根据角色名称进行模糊匹配
- 支持角色别名和变体识别
- 手动调整匹配结果

#### 批量操作
- **批量角色创建**：通过配置文件批量导入角色
- **批量音色测试**：一键测试所有音色效果
- **批量转换任务**：同时处理多个章节转换

#### 参数优化
转换参数建议：
- **语速**：0.8-1.2 (1.0为正常语速)
- **音量**：0.8-1.2 (1.0为正常音量)  
- **音调**：0.9-1.1 (1.0为原始音调)

## 📋 最佳实践

### 剧本编写规范
1. **对话格式**：严格使用 `（角色名）：对话内容` 格式
2. **角色命名**：使用简洁、一致的角色名称
3. **旁白处理**：使用"旁白"作为叙述角色名
4. **内容分段**：适当分段，便于音频生成和播放

### 音色选择建议
1. **角色匹配**：根据角色年龄、性格选择合适音色
2. **语言一致**：同一作品内保持语言风格一致
3. **对比测试**：使用相同文本测试不同音色效果
4. **样本保存**：为常用音色保存测试样本

### 性能优化
1. **分批转换**：大型项目建议分章节转换
2. **参数复用**：相同类型角色使用相似参数
3. **缓存管理**：定期清理过期的音频文件
4. **监控资源**：注意API调用频率和配额限制

## 📚 API文档

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

## 🔧 故障排除

### 常见问题

#### 1. MongoDB 连接失败
```bash
# 检查 MongoDB 服务状态
brew services list | grep mongodb  # macOS
systemctl status mongod           # Linux

# 重启 MongoDB 服务
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod           # Linux
```

#### 2. TTS API 调用失败
- 检查 `.env` 文件中的 TTS 配置
- 确认火山引擎账户余额和API权限
- 验证网络连接和防火墙设置

#### 3. 音频文件无法播放
- 检查浏览器音频支持（推荐Chrome/Firefox）
- 确认音频文件路径和权限
- 检查CORS配置

#### 4. 角色匹配失败
- 确保剧本格式正确：`（角色名）：对话内容`
- 检查角色名称的一致性
- 使用手动匹配功能

### 性能调优

#### 数据库优化
```javascript
// MongoDB 索引优化
db.characters.createIndex({ "name": 1, "story_series": 1 })
db.chapters.createIndex({ "story_series_id": 1, "order": 1 })
db.conversions.createIndex({ "status": 1, "created_at": -1 })
```

#### 内存管理
```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 清理临时文件
npm run clean  # 清理构建文件
```

## 🤝 贡献指南

### 开发环境
1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建 Pull Request

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 编写单元测试
- 更新相关文档

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 其他杂项
```

## 📞 支持与反馈

### 技术支持
- 📧 邮箱：[your-email@example.com]
- 💬 讨论：[GitHub Discussions](https://github.com/your-username/ai_story_teller/discussions)
- 🐛 问题报告：[GitHub Issues](https://github.com/your-username/ai_story_teller/issues)

### 功能建议
欢迎提出新功能建议和改进意见：
1. 在 Issues 中详细描述需求
2. 说明使用场景和预期效果
3. 提供相关的设计稿或原型

## 🔄 更新日志

### v1.0.0 (2025-07-19)
- ✨ 初始版本发布
- 🎵 完整的音色管理系统
- 👥 角色管理和配音绑定
- 📖 剧本创作和解析功能
- 🔄 自动语音转换系统
- 📊 任务状态监控面板

### 即将发布
- 🎨 自定义音效和背景音乐
- 🌐 多语言界面支持
- 📱 移动端适配
- ☁️ 云端存储集成
- 🔗 第三方平台发布

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**⭐ 如果这个项目对您有帮助，请给个星标支持！**

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/ai_story_teller&type=Date)](https://star-history.com/#your-username/ai_story_teller&Date)