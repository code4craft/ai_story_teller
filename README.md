# 童话故事文字转语音工具

基于火山方舟平台的文字转语音工具，将童话故事文本转换为语音文件。

## 快速开始

1. 安装依赖
```bash
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入火山方舟平台的密钥
```

3. 运行转换
```bash
# 批量转换整个故事文件夹
python batch_convert_stories.py data/input/story-02-零食星球

# 跳过已存在的文件（默认）
python batch_convert_stories.py data/input/story-01-魔法森林

# 重新生成所有文件
python batch_convert_stories.py data/input/story-01-魔法森林 --no-skip

# 测试模式（只处理前3个文件）
python batch_convert_stories.py data/input/story-02-零食星球 --max-files 3
```

## 主要功能

- 单文件/批量处理
- 多种音色可选
- 可调节语速、音量、音调
- 支持 mp3、wav 等格式

## 项目结构

```
├── src/             # 源代码
├── data/            # 输入输出目录
├── tests/           # 测试文件
└── requirements.txt # 依赖列表
```

## 许可证

MIT