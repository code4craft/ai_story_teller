import os
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class Config:
    # 火山方舟平台配置（保留用于兼容性）
    VOLC_ACCESS_KEY_ID = os.getenv('VOLC_ACCESS_KEY_ID')
    VOLC_SECRET_ACCESS_KEY = os.getenv('VOLC_SECRET_ACCESS_KEY')
    VOLC_REGION = os.getenv('VOLC_REGION', 'cn-beijing')
    
    # 大模型TTS API配置
    TTS_TOKEN = os.getenv('TTS_TOKEN')  # Bearer Token
    TTS_APP_ID = os.getenv('TTS_APP_ID')
    TTS_CLUSTER = os.getenv('TTS_CLUSTER', 'volcano_tts')
    
    # 新的音色和参数配置
    TTS_VOICE_TYPE = os.getenv('TTS_VOICE_TYPE', 'zh_male_M392_conversation_wvae_bigtts')
    TTS_SPEED_RATIO = float(os.getenv('TTS_SPEED_RATIO', '1.0'))
    
    # 兼容旧参数（已弃用）
    TTS_SPEED = float(os.getenv('TTS_SPEED', '1.0'))
    TTS_VOLUME = float(os.getenv('TTS_VOLUME', '1.0'))
    TTS_PITCH = float(os.getenv('TTS_PITCH', '1.0'))
    
    # 输出配置
    OUTPUT_FORMAT = os.getenv('OUTPUT_FORMAT', 'mp3')
    
    # 路径配置
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / 'data'
    INPUT_DIR = DATA_DIR / 'input'
    OUTPUT_DIR = DATA_DIR / 'output'
    
    @classmethod
    def validate(cls):
        """验证必要的配置是否存在"""
        # 新API必要配置
        required_vars = [
            'TTS_TOKEN',
            'TTS_APP_ID'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not getattr(cls, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"缺少必要的环境变量: {', '.join(missing_vars)}")
        
        # 确保输出目录存在
        cls.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

config = Config()