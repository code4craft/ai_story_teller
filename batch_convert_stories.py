#!/usr/bin/env python3
"""
批量转换故事文件夹中的所有章节为音频
"""

import sys
import os
from pathlib import Path
from typing import List, Optional

# 添加src目录到路径
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from script_to_audio import convert_story_script
from loguru import logger

def find_story_files(input_folder: str) -> List[Path]:
    """
    查找文件夹中所有的.md文件
    
    Args:
        input_folder: 输入文件夹路径
        
    Returns:
        List[Path]: MD文件路径列表
    """
    folder_path = Path(input_folder)
    if not folder_path.exists():
        logger.error(f"文件夹不存在: {input_folder}")
        return []
    
    # 查找所有.md文件并排序
    md_files = sorted(folder_path.glob("*.md"))
    logger.info(f"在 {input_folder} 中找到 {len(md_files)} 个MD文件")
    
    return md_files

def get_output_path(input_file: Path, input_folder: str, output_base: str = "out") -> Path:
    """
    根据输入文件路径生成输出文件路径
    
    Args:
        input_file: 输入文件路径
        input_folder: 输入文件夹路径
        output_base: 输出基础目录
        
    Returns:
        Path: 输出文件路径
    """
    # 获取相对路径结构
    input_folder_path = Path(input_folder)
    relative_path = input_file.relative_to(input_folder_path.parent)
    
    # 构建输出路径，将.md替换为.mp3
    output_path = Path(output_base) / relative_path.with_suffix('.mp3')
    
    return output_path

def check_file_exists(file_path: Path) -> bool:
    """
    检查文件是否存在
    
    Args:
        file_path: 文件路径
        
    Returns:
        bool: 文件是否存在
    """
    return file_path.exists()

def batch_convert_stories(input_folder: str, skip_existing: bool = True, max_files: Optional[int] = None, max_conversations_per_file: Optional[int] = None):
    """
    批量转换故事文件夹中的所有章节
    
    Args:
        input_folder: 输入文件夹路径，例如 "data/input/story-02-零食星球"
        skip_existing: 是否跳过已存在的输出文件
        max_files: 最多处理的文件数量（用于测试）
        max_conversations_per_file: 每个文件最多处理的对话数（用于测试）
    """
    logger.info(f"开始批量转换: {input_folder}")
    
    # 查找所有MD文件
    md_files = find_story_files(input_folder)
    if not md_files:
        logger.error("没有找到任何MD文件")
        return
    
    # 限制处理数量（如果指定）
    if max_files:
        md_files = md_files[:max_files]
        logger.info(f"限制处理前 {max_files} 个文件")
    
    # 统计信息
    total_files = len(md_files)
    processed = 0
    skipped = 0
    success = 0
    failed = 0
    
    logger.info(f"准备处理 {total_files} 个文件")
    
    # 逐个处理文件
    for i, input_file in enumerate(md_files, 1):
        logger.info(f"\n处理第 {i}/{total_files} 个文件: {input_file.name}")
        
        # 生成输出路径
        output_file = get_output_path(input_file, input_folder)
        
        # 检查是否需要跳过
        if skip_existing and check_file_exists(output_file):
            logger.info(f"跳过已存在的文件: {output_file}")
            skipped += 1
            continue
        
        # 创建输出目录
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 转换文件
        logger.info(f"输入: {input_file}")
        logger.info(f"输出: {output_file}")
        
        try:
            # 执行转换
            max_conv = max_conversations_per_file if max_conversations_per_file else 0
            result = convert_story_script(
                input_file=str(input_file),
                output_file=str(output_file),
                max_conversations=max_conv  # 0表示不限制
            )
            
            if result:
                logger.info(f"✅ 转换成功: {output_file.name}")
                success += 1
            else:
                logger.error(f"❌ 转换失败: {input_file.name}")
                failed += 1
                
        except Exception as e:
            logger.error(f"❌ 转换异常: {input_file.name} - {e}")
            failed += 1
        
        processed += 1
        
        # 显示进度
        logger.info(f"进度: {processed}/{total_files} (成功: {success}, 失败: {failed}, 跳过: {skipped})")
    
    # 显示总结
    logger.info("\n" + "=" * 50)
    logger.info("批量转换完成！")
    logger.info(f"总文件数: {total_files}")
    logger.info(f"已处理: {processed}")
    logger.info(f"成功: {success}")
    logger.info(f"失败: {failed}")
    logger.info(f"跳过: {skipped}")
    
    if success > 0:
        logger.info(f"\n✅ 音频文件已保存到: {Path('out') / Path(input_folder).name}")

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="批量转换故事文件夹中的章节为音频")
    parser.add_argument("input_folder", help="输入文件夹路径，例如: data/input/story-02-零食星球")
    parser.add_argument("--no-skip", action="store_true", help="不跳过已存在的文件，重新生成")
    parser.add_argument("--max-files", type=int, help="最多处理的文件数量（用于测试）")
    parser.add_argument("--max-conversations", type=int, help="每个文件最多处理的对话数（用于测试）")
    
    args = parser.parse_args()
    
    # 执行批量转换
    batch_convert_stories(
        input_folder=args.input_folder,
        skip_existing=not args.no_skip,
        max_files=args.max_files,
        max_conversations_per_file=args.max_conversations
    )

if __name__ == "__main__":
    main()