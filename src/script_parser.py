import re
import yaml
from pathlib import Path
from typing import List, Dict, Tuple
from loguru import logger
from dataclasses import dataclass


@dataclass
class DialogueLine:
    """对话行数据结构"""
    character: str
    text: str
    line_number: int
    voice_config: Dict = None


class ScriptParser:
    """剧本解析器，解析（角色）：对话格式的剧本"""
    
    def __init__(self, roles_config_path: str):
        self.roles_config_path = Path(roles_config_path)
        self.roles_config = self._load_roles_config()
        
        # 匹配格式：（角色名）：对话内容
        self.dialogue_pattern = re.compile(r'^（([^）]+)）：(.+)$')
        
    def _load_roles_config(self) -> Dict:
        """加载角色配置文件"""
        try:
            with open(self.roles_config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            logger.info(f"成功加载角色配置: {self.roles_config_path}")
            return config
        except Exception as e:
            logger.error(f"加载角色配置失败: {e}")
            raise
    
    def parse_script_file(self, script_path: str) -> List[DialogueLine]:
        """解析剧本文件，返回对话行列表"""
        script_path = Path(script_path)
        
        if not script_path.exists():
            raise FileNotFoundError(f"剧本文件不存在: {script_path}")
            
        logger.info(f"开始解析剧本文件: {script_path}")
        
        with open(script_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        dialogue_lines = []
        
        for line_no, line in enumerate(lines, 1):
            line = line.strip()
            
            # 跳过空行和元数据行
            if not line or line.startswith('#') or line.startswith('>') or line.startswith('---'):
                continue
                
            # 匹配对话格式
            match = self.dialogue_pattern.match(line)
            if match:
                character = match.group(1)
                text = match.group(2)
                
                # 获取角色的语音配置
                voice_config = self._get_voice_config(character)
                
                dialogue_line = DialogueLine(
                    character=character,
                    text=text,
                    line_number=line_no,
                    voice_config=voice_config
                )
                
                dialogue_lines.append(dialogue_line)
                logger.debug(f"第{line_no}行 - {character}: {text[:50]}...")
        
        logger.success(f"解析完成，共找到 {len(dialogue_lines)} 行对话")
        return dialogue_lines
    
    def _get_voice_config(self, character: str) -> Dict:
        """获取角色的语音配置"""
        # 首先在各个角色分类中查找
        all_characters = {}
        
        # 合并所有分类的角色
        for category in ['pig_family', 'work_characters', 'mythical_characters', 
                        'musicians', 'group_characters', 'narrator', 'other_stories']:
            if category in self.roles_config:
                all_characters.update(self.roles_config[category])
        
        # 查找角色配置
        if character in all_characters:
            char_config = all_characters[character].copy()
            
            # 添加TTS默认配置
            if 'tts_config' in self.roles_config:
                tts_defaults = self.roles_config['tts_config']
                char_config.update({
                    'speed': tts_defaults.get('default_speed', 1.0),
                    'volume': tts_defaults.get('default_volume', 1.0),
                    'pitch': tts_defaults.get('default_pitch', 1.0),
                    'output_format': tts_defaults.get('output_format', 'mp3')
                })
            
            return char_config
        else:
            # 未找到角色，使用默认配置
            logger.warning(f"未找到角色 '{character}' 的配置，使用默认设置")
            return self._get_default_voice_config()
    
    def _get_default_voice_config(self) -> Dict:
        """获取默认语音配置"""
        tts_config = self.roles_config.get('tts_config', {})
        return {
            'name': '未知角色',
            'tts_voice': 'BV001_streaming',
            'speed': tts_config.get('default_speed', 1.0),
            'volume': tts_config.get('default_volume', 1.0),
            'pitch': tts_config.get('default_pitch', 1.0),
            'output_format': tts_config.get('output_format', 'mp3')
        }
    
    def get_character_stats(self, dialogue_lines: List[DialogueLine]) -> Dict:
        """获取角色统计信息"""
        stats = {}
        for line in dialogue_lines:
            if line.character not in stats:
                stats[line.character] = {
                    'line_count': 0,
                    'total_chars': 0,
                    'voice_config': line.voice_config
                }
            
            stats[line.character]['line_count'] += 1
            stats[line.character]['total_chars'] += len(line.text)
        
        return stats
    
    def split_long_text(self, text: str, max_length: int = 500) -> List[str]:
        """将过长的文本分割成多个片段"""
        if len(text) <= max_length:
            return [text]
        
        # 按句号、问号、感叹号分割
        sentences = re.split(r'[。！？]', text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # 如果添加这个句子不会超长，就添加
            if len(current_chunk + sentence) <= max_length:
                if current_chunk:
                    current_chunk += sentence + "。"
                else:
                    current_chunk = sentence + "。"
            else:
                # 保存当前chunk，开始新的chunk
                if current_chunk:
                    chunks.append(current_chunk.rstrip("。"))
                current_chunk = sentence + "。"
        
        # 添加最后一个chunk
        if current_chunk:
            chunks.append(current_chunk.rstrip("。"))
        
        return chunks
    
    def prepare_tts_tasks(self, dialogue_lines: List[DialogueLine]) -> List[Dict]:
        """准备TTS任务列表"""
        tasks = []
        
        for i, line in enumerate(dialogue_lines):
            # 分割过长的文本
            text_chunks = self.split_long_text(line.text)
            
            for j, chunk in enumerate(text_chunks):
                task = {
                    'task_id': f"{i:03d}_{j:02d}",
                    'character': line.character,
                    'text': chunk,
                    'voice_config': line.voice_config,
                    'line_number': line.line_number,
                    'chunk_index': j,
                    'total_chunks': len(text_chunks)
                }
                tasks.append(task)
        
        logger.info(f"准备了 {len(tasks)} 个TTS任务")
        return tasks