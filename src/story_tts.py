import os
import time
from pathlib import Path
from typing import List, Dict, Optional
from loguru import logger
from tqdm import tqdm
import tempfile

from config import config
from tts_client_context7 import TTSClientContext7
from script_parser import ScriptParser


class StoryTTSProcessor:
    """故事TTS处理器，负责将剧本转换为语音"""
    
    def __init__(self, roles_config_path: str = "config/roles.yml"):
        self.script_parser = ScriptParser(roles_config_path)
        self.tts_client = TTSClientContext7()
        
    def process_script_to_audio(self, script_path: str, output_path: str, 
                               story_name: str = None, chapter_name: str = None) -> bool:
        """
        将剧本文件转换为完整的音频文件
        
        Args:
            script_path: 剧本文件路径
            output_path: 输出音频文件路径
            story_name: 故事名称（用于临时文件命名）
            chapter_name: 章节名称（用于临时文件命名）
            
        Returns:
            bool: 是否成功
        """
        try:
            # 解析剧本
            logger.info(f"开始处理剧本: {script_path}")
            dialogue_lines = self.script_parser.parse_script_file(script_path)
            
            if not dialogue_lines:
                logger.warning("剧本中没有找到对话内容")
                return False
            
            # 准备TTS任务
            tasks = self.script_parser.prepare_tts_tasks(dialogue_lines)
            
            # 显示角色统计
            stats = self.script_parser.get_character_stats(dialogue_lines)
            logger.info("角色统计信息:")
            for char, stat in stats.items():
                logger.info(f"  {char}: {stat['line_count']} 行, {stat['total_chars']} 字符")
            
            # 创建临时目录存放音频片段
            temp_dir = self._create_temp_dir(story_name, chapter_name)
            
            # 生成各个音频片段
            audio_files = self._generate_audio_segments(tasks, temp_dir)
            
            if not audio_files:
                logger.error("没有成功生成音频片段")
                return False
            
            # 合并音频文件
            success = self._merge_audio_files(audio_files, output_path)
            
            # 清理临时文件
            self._cleanup_temp_files(temp_dir)
            
            return success
            
        except Exception as e:
            logger.error(f"处理剧本失败: {e}")
            return False
    
    def _create_temp_dir(self, story_name: str = None, chapter_name: str = None) -> Path:
        """创建临时目录"""
        if story_name and chapter_name:
            temp_name = f"tts_{story_name}_{chapter_name}_{int(time.time())}"
        else:
            temp_name = f"tts_{int(time.time())}"
        
        temp_dir = Path(tempfile.gettempdir()) / temp_name
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"创建临时目录: {temp_dir}")
        return temp_dir
    
    def _generate_audio_segments(self, tasks: List[Dict], temp_dir: Path) -> List[Path]:
        """生成音频片段"""
        audio_files = []
        
        logger.info(f"开始生成 {len(tasks)} 个音频片段")
        
        for task in tqdm(tasks, desc="生成音频片段"):
            try:
                # 准备输出文件名
                filename = f"{task['task_id']}_{task['character']}.mp3"
                output_file = temp_dir / filename
                
                # 获取语音配置
                voice_config = task['voice_config']
                
                # 调用TTS生成音频
                success = self.tts_client.text_to_speech(
                    text=task['text'],
                    output_file=str(output_file),
                    voice_type=voice_config.get('tts_voice'),
                    speed=voice_config.get('speed'),
                    volume=voice_config.get('volume'),
                    pitch=voice_config.get('pitch')
                )
                
                if success and output_file.exists():
                    audio_files.append(output_file)
                    logger.debug(f"生成音频: {task['character']} - {task['text'][:30]}...")
                else:
                    logger.warning(f"音频生成失败: {task['task_id']}")
                    
                # 添加小间隔，避免请求过快
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"生成音频片段失败 {task['task_id']}: {e}")
                continue
        
        logger.success(f"成功生成 {len(audio_files)}/{len(tasks)} 个音频片段")
        return audio_files
    
    def _merge_audio_files(self, audio_files: List[Path], output_path: str) -> bool:
        """合并音频文件"""
        try:
            from pydub import AudioSegment
            from pydub.silence import Silence
            
            logger.info(f"开始合并 {len(audio_files)} 个音频文件")
            
            # 确保输出目录存在
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 初始化合并音频
            merged_audio = AudioSegment.empty()
            
            for audio_file in tqdm(audio_files, desc="合并音频"):
                try:
                    # 加载音频片段
                    audio_segment = AudioSegment.from_mp3(str(audio_file))
                    
                    # 添加到合并音频中
                    merged_audio += audio_segment
                    
                    # 添加短暂间隔（0.3秒）
                    silence = AudioSegment.silent(duration=300)
                    merged_audio += silence
                    
                except Exception as e:
                    logger.warning(f"加载音频文件失败 {audio_file}: {e}")
                    continue
            
            # 导出合并后的音频
            merged_audio.export(str(output_path), format="mp3")
            
            logger.success(f"音频合并完成: {output_path}")
            logger.info(f"总时长: {len(merged_audio) / 1000:.1f} 秒")
            
            return True
            
        except ImportError:
            logger.error("请安装 pydub 库: pip install pydub")
            return False
        except Exception as e:
            logger.error(f"合并音频失败: {e}")
            return False
    
    def _cleanup_temp_files(self, temp_dir: Path):
        """清理临时文件"""
        try:
            import shutil
            if temp_dir.exists():
                shutil.rmtree(temp_dir)
                logger.info(f"清理临时目录: {temp_dir}")
        except Exception as e:
            logger.warning(f"清理临时文件失败: {e}")
    
    def batch_process_story(self, story_dir: str, output_base_dir: str) -> Dict[str, bool]:
        """批量处理故事目录下的所有章节"""
        story_dir = Path(story_dir)
        output_base_dir = Path(output_base_dir)
        
        if not story_dir.exists():
            raise FileNotFoundError(f"故事目录不存在: {story_dir}")
        
        # 获取故事名称
        story_name = story_dir.name
        
        # 找到所有markdown文件（跳过README）
        script_files = list(story_dir.glob("*.md"))
        script_files = [f for f in script_files if f.name != "README.md"]
        script_files.sort()
        
        logger.info(f"找到 {len(script_files)} 个章节文件")
        
        results = {}
        
        for script_file in script_files:
            chapter_name = script_file.stem
            
            # 创建输出路径
            output_path = output_base_dir / story_name / f"{chapter_name}.mp3"
            
            logger.info(f"处理章节: {chapter_name}")
            
            # 处理单个章节
            success = self.process_script_to_audio(
                script_path=str(script_file),
                output_path=str(output_path),
                story_name=story_name,
                chapter_name=chapter_name
            )
            
            results[chapter_name] = success
            
            if success:
                logger.success(f"章节 {chapter_name} 处理成功")
            else:
                logger.error(f"章节 {chapter_name} 处理失败")
        
        return results
    
    def get_estimated_duration(self, script_path: str) -> float:
        """估算音频时长（基于文字数量）"""
        try:
            dialogue_lines = self.script_parser.parse_script_file(script_path)
            total_chars = sum(len(line.text) for line in dialogue_lines)
            
            # 假设每分钟朗读约200个中文字符
            estimated_minutes = total_chars / 200
            
            return estimated_minutes
        except Exception as e:
            logger.warning(f"估算时长失败: {e}")
            return 0.0