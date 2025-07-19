/**
 * 剧本解析服务
 * 解析Markdown格式的剧本内容，提取对话和角色信息
 */

export interface DialogueLine {
  character: string;
  text: string;
  line_number: number;
}

export interface ParseResult {
  dialogues: DialogueLine[];
  characters_detected: string[];
}

export class ScriptParserService {
  /**
   * 解析章节内容
   * @param content Markdown格式的章节内容
   * @returns 解析结果
   */
  async parseChapterContent(content: string): Promise<ParseResult> {
    const dialogues: DialogueLine[] = [];
    const charactersSet = new Set<string>();
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行、标题和旁白
      if (!line || line.startsWith('#') || line.startsWith('>')) {
        continue;
      }
      
      // 匹配对话格式：（角色名）：对话内容
      const dialogueMatch = line.match(/^（(.+?)）[：:]\s*(.+)$/);
      if (dialogueMatch) {
        const character = dialogueMatch[1].trim();
        const text = dialogueMatch[2].trim();
        
        // 过滤掉"旁白"
        if (character !== '旁白') {
          dialogues.push({
            character,
            text,
            line_number: i + 1
          });
          
          charactersSet.add(character);
        }
      }
    }
    
    return {
      dialogues,
      characters_detected: Array.from(charactersSet)
    };
  }

  /**
   * 验证角色名称格式
   * @param characterName 角色名称
   * @returns 是否为有效的角色名称
   */
  isValidCharacterName(characterName: string): boolean {
    // 排除一些常见的非角色名称
    const excludeList = ['旁白', '音乐', '背景', '场景', '声音', '音效'];
    return !excludeList.includes(characterName) && characterName.length > 0;
  }

  /**
   * 清理文本内容
   * @param text 原始文本
   * @returns 清理后的文本
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/[""]/g, '"') // 统一引号
      .replace(/['']/g, "'") // 统一单引号
      .trim();
  }

  /**
   * 统计章节信息
   * @param content 章节内容
   * @returns 统计信息
   */
  getChapterStats(content: string) {
    const parseResult = this.parseChapterContent(content);
    
    return {
      total_lines: content.split('\n').length,
      dialogue_lines: parseResult.then(r => r.dialogues.length),
      unique_characters: parseResult.then(r => r.characters_detected.length),
      estimated_duration: parseResult.then(r => 
        Math.ceil(r.dialogues.reduce((sum, d) => sum + d.text.length, 0) / 6) // 假设每秒6个字符
      )
    };
  }
}