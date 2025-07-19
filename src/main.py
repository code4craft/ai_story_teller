import os
import sys
from pathlib import Path
from typing import List, Optional
from loguru import logger
from tqdm import tqdm

from config import config
from llm_tts_client import LLMTTSClient


class StoryToSpeech:
    """童话故事转语音主类"""
    
    def __init__(self, use_websocket: bool = False):
        # 验证配置
        config.validate()
        self.tts_client = LLMTTSClient()
        self.use_websocket = use_websocket
        
    def process_file(self, input_file: str, output_file: Optional[str] = None) -> bool:
        """
        处理单个文件
        
        Args:
            input_file: 输入文本文件路径
            output_file: 输出音频文件路径（可选）
            
        Returns:
            bool: 是否成功
        """
        try:
            # 读取文本内容
            logger.info(f"读取文件: {input_file}")
            with open(input_file, 'r', encoding='utf-8') as f:
                text = f.read().strip()
                
            if not text:
                logger.warning("文件内容为空")
                return False
                
            # 生成输出文件名
            if not output_file:
                input_path = Path(input_file)
                output_name = f"{input_path.stem}.{config.OUTPUT_FORMAT}"
                output_file = config.OUTPUT_DIR / output_name
                
            # 转换为语音
            logger.info(f"开始转换: {Path(input_file).name}")
            success = self.tts_client.text_to_speech(
                text, 
                str(output_file), 
                use_websocket=self.use_websocket
            )
            
            return success
            
        except Exception as e:
            logger.error(f"处理文件失败: {str(e)}")
            return False
    
    def process_directory(self, input_dir: str, pattern: str = "*.txt") -> List[str]:
        """
        批量处理目录中的文件
        
        Args:
            input_dir: 输入目录
            pattern: 文件匹配模式
            
        Returns:
            List[str]: 成功处理的文件列表
        """
        input_path = Path(input_dir)
        if not input_path.exists():
            logger.error(f"目录不存在: {input_dir}")
            return []
            
        # 获取所有匹配的文件
        files = list(input_path.glob(pattern))
        if not files:
            logger.warning(f"未找到匹配的文件: {pattern}")
            return []
            
        logger.info(f"找到 {len(files)} 个文件")
        
        # 批量处理
        success_files = []
        for file in tqdm(files, desc="处理进度"):
            if self.process_file(str(file)):
                success_files.append(str(file))
                
        logger.info(f"成功处理 {len(success_files)}/{len(files)} 个文件")
        return success_files
    
    def process_text(self, text: str, output_file: str) -> bool:
        """
        直接处理文本内容
        
        Args:
            text: 文本内容
            output_file: 输出文件路径
            
        Returns:
            bool: 是否成功
        """
        return self.tts_client.text_to_speech(text, output_file, use_websocket=self.use_websocket)


def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='童话故事文字转语音工具')
    parser.add_argument('input', help='输入文件或目录路径')
    parser.add_argument('-o', '--output', help='输出文件路径（仅对单文件有效）')
    parser.add_argument('-p', '--pattern', default='*.txt', help='文件匹配模式（批量处理时使用）')
    parser.add_argument('-v', '--voice', help='音色类型')
    parser.add_argument('-s', '--speed', type=float, help='语速比例（0.5-2.0）')
    parser.add_argument('--websocket', action='store_true', help='使用WebSocket流式合成')
    
    args = parser.parse_args()
    
    # 设置日志
    logger.remove()
    logger.add(sys.stderr, level="INFO")
    
    # 创建处理器
    processor = StoryToSpeech(use_websocket=args.websocket)
    
    # 判断是文件还是目录
    input_path = Path(args.input)
    
    if input_path.is_file():
        # 处理单个文件
        success = processor.process_file(args.input, args.output)
        sys.exit(0 if success else 1)
    elif input_path.is_dir():
        # 批量处理目录
        success_files = processor.process_directory(args.input, args.pattern)
        sys.exit(0 if success_files else 1)
    else:
        logger.error(f"输入路径不存在: {args.input}")
        sys.exit(1)


if __name__ == "__main__":
    main()