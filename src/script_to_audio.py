#!/usr/bin/env python3
"""
剧本转语音模块
解析markdown剧本，根据角色配置选择音色，生成并合并音频
"""

import re
import os
import yaml
import io
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import time

try:
    from loguru import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

from llm_tts_client import LLMTTSClient

# 音频处理 - 使用简单的二进制合并方式
# 对于MP3文件，简单的二进制拼接通常是有效的


class ScriptToAudioConverter:
    """剧本转语音转换器"""
    
    def __init__(self, roles_config_path: str = "config/roles.yml"):
        """
        初始化转换器
        
        Args:
            roles_config_path: 角色配置文件路径
        """
        self.tts_client = LLMTTSClient()
        self.roles_config = self._load_roles_config(roles_config_path)
        
    def _load_roles_config(self, config_path: str) -> Dict:
        """加载角色配置"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            logger.info(f"成功加载角色配置: {config_path}")
            return config
        except Exception as e:
            logger.error(f"加载角色配置失败: {e}")
            return {}
    
    def _get_character_voice(self, character_name: str) -> str:
        """
        根据角色名获取对应的音色
        
        Args:
            character_name: 角色名称
            
        Returns:
            str: 音色类型
        """
        # 在所有角色分类中查找
        for category in self.roles_config.values():
            if isinstance(category, dict):
                for char_name, char_info in category.items():
                    if char_name == character_name and isinstance(char_info, dict):
                        voice = char_info.get('tts_voice', 'zh_female_shaoergushi_mars_bigtts')
                        logger.debug(f"角色 '{character_name}' 使用音色: {voice}")
                        return voice
        
        # 如果没找到，使用默认音色
        default_voice = 'zh_female_shaoergushi_mars_bigtts'
        logger.warning(f"未找到角色 '{character_name}' 的配置，使用默认音色: {default_voice}")
        return default_voice
    
    def _parse_script(self, script_content: str) -> List[Tuple[str, str, str]]:
        """
        解析markdown剧本内容
        
        Args:
            script_content: 剧本文本内容
            
        Returns:
            List[Tuple[str, str, str]]: [(角色名, 对话内容, 行类型)]
        """
        lines = []
        
        for line_num, line in enumerate(script_content.split('\n'), 1):
            line = line.strip()
            if not line or line.startswith('#') or line.startswith('>'):
                continue
            
            # 忽略末尾的角色信息行
            if line.startswith('---') or line.startswith('*该小节涉及的角色'):
                logger.debug(f"第{line_num}行 - 忽略角色信息行: {line[:30]}...")
                break  # 遇到角色信息行就停止解析
            
            # 匹配角色对话: （角色名）：对话内容
            dialogue_match = re.match(r'（(.+?)）：(.+)', line)
            if dialogue_match:
                character = dialogue_match.group(1)
                content = dialogue_match.group(2)
                lines.append((character, content, 'dialogue'))
                logger.debug(f"第{line_num}行 - 对话: {character}: {content[:30]}...")
                continue
            
            # 如果包含中文内容，视为旁白
            if re.search(r'[\u4e00-\u9fff]', line):
                lines.append(('旁白', line, 'narration'))
                logger.debug(f"第{line_num}行 - 旁白: {line[:30]}...")
        
        logger.info(f"解析完成，共提取 {len(lines)} 行对话和旁白")
        return lines
    
    def _generate_audio_segment(self, character: str, content: str, 
                              segment_id: int, max_retries: int = 3) -> Optional[bytes]:
        """
        生成单个音频片段
        
        Args:
            character: 角色名
            content: 对话内容
            segment_id: 片段ID
            max_retries: 最大重试次数
            
        Returns:
            Optional[bytes]: 音频字节数据
        """
        voice_type = self._get_character_voice(character)
        
        logger.info(f"生成音频片段 {segment_id}: {character} - {content[:50]}...")
        
        try:
            audio_bytes = self.tts_client.text_to_speech(
                text=content,
                voice_type=voice_type,
                max_retries=max_retries
            )
            
            if audio_bytes:
                logger.info(f"片段 {segment_id} 生成成功，大小: {len(audio_bytes)} bytes")
                return audio_bytes
            else:
                logger.error(f"片段 {segment_id} 生成失败")
                return None
                
        except Exception as e:
            logger.error(f"片段 {segment_id} 生成异常: {e}")
            return None
    
    def _merge_audio_files(self, audio_segments: List[bytes], output_path: str) -> bool:
        """
        使用简单的二进制拼接合并MP3音频片段
        
        Args:
            audio_segments: 音频字节数据列表
            output_path: 输出文件路径
            
        Returns:
            bool: 是否成功
        """
        
        try:
            # 创建输出目录
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"开始合并 {len(audio_segments)} 个音频片段...")
            
            if not audio_segments:
                logger.error("没有音频片段可合并")
                return False
            
            # 简单的二进制拼接方式
            # 对于MP3文件，这种方式通常是有效的
            combined_data = b''
            
            for i, audio_bytes in enumerate(audio_segments, 1):
                if audio_bytes:
                    combined_data += audio_bytes
                    logger.debug(f"已合并片段 {i}/{len(audio_segments)}，当前大小: {len(combined_data)} bytes")
                else:
                    logger.warning(f"跳过空的音频片段 {i}")
            
            if not combined_data:
                logger.error("没有有效的音频数据可合并")
                return False
            
            # 写入合并后的文件
            with open(output_path, 'wb') as f:
                f.write(combined_data)
            
            logger.info(f"音频合并完成: {output_path}")
            logger.info(f"合并后文件大小: {len(combined_data)} bytes")
            return True
            
        except Exception as e:
            logger.error(f"音频合并失败: {e}")
            return False
    
    def convert_script_to_audio(self, input_file: str, output_file: str, 
                              max_conversations: int = 100) -> bool:
        """
        将剧本转换为音频
        
        Args:
            input_file: 输入的markdown剧本文件路径
            output_file: 输出的mp3文件路径
            max_conversations: 最多处理的对话数量（用于测试）
            
        Returns:
            bool: 是否成功
        """
        logger.info(f"开始转换剧本: {input_file} -> {output_file}")
        logger.info(f"最多处理 {max_conversations} 段对话")
        
        # 读取剧本文件
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                script_content = f.read()
        except Exception as e:
            logger.error(f"读取剧本文件失败: {e}")
            return False
        
        # 解析剧本
        parsed_lines = self._parse_script(script_content)
        if not parsed_lines:
            logger.error("剧本解析失败，没有提取到有效内容")
            return False
        
        # 限制处理数量（用于测试）
        if max_conversations > 0:
            parsed_lines = parsed_lines[:max_conversations]
            logger.info(f"限制处理前 {max_conversations} 段内容")
        
        # 生成音频片段
        audio_segments = []
        success_count = 0
        
        for i, (character, content, line_type) in enumerate(parsed_lines, 1):
            logger.info(f"处理第 {i}/{len(parsed_lines)} 段: {character}")
            
            audio_bytes = self._generate_audio_segment(character, content, i)
            
            if audio_bytes:
                audio_segments.append(audio_bytes)
                success_count += 1
            else:
                logger.warning(f"跳过第 {i} 段（生成失败）")
            
            # 添加小延迟避免请求过快
            time.sleep(0.5)
        
        logger.info(f"音频生成完成: {success_count}/{len(parsed_lines)} 段成功")
        
        if not audio_segments:
            logger.error("没有成功生成任何音频片段")
            return False
        
        # 合并音频文件
        return self._merge_audio_files(audio_segments, output_file)


# 辅助函数
def convert_story_script(input_file: str, output_file: str, max_conversations: int = 100) -> bool:
    """
    便捷函数：转换故事剧本为音频
    
    Args:
        input_file: 输入的markdown剧本文件路径  
        output_file: 输出的mp3文件路径
        max_conversations: 最多处理的对话数量
        
    Returns:
        bool: 是否成功
    """
    converter = ScriptToAudioConverter()
    return converter.convert_script_to_audio(input_file, output_file, max_conversations)


if __name__ == "__main__":
    # 示例用法
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python script_to_audio.py <输入文件> <输出文件> [最大对话数]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    max_conv = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    success = convert_story_script(input_file, output_file, max_conv)
    if success:
        print(f"✅ 转换成功: {output_file}")
    else:
        print("❌ 转换失败")
        sys.exit(1)