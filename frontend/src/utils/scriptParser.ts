export interface ParsedDialogue {
  character: string;
  text: string;
  lineNumber: number;
  originalLine: string;
}

export interface ScriptParseResult {
  dialogues: ParsedDialogue[];
  characters: string[];
  stats: {
    totalLines: number;
    dialogueLines: number;
    uniqueCharacters: number;
  };
}

/**
 * 解析剧本文本，提取角色对话
 * 支持格式：（角色名）：对话内容
 */
export function parseScript(content: string): ScriptParseResult {
  if (!content || typeof content !== 'string') {
    return {
      dialogues: [],
      characters: [],
      stats: {
        totalLines: 0,
        dialogueLines: 0,
        uniqueCharacters: 0,
      },
    };
  }

  const lines = content.split('\n');
  const dialogues: ParsedDialogue[] = [];
  const charactersSet = new Set<string>();

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // 匹配格式：（角色名）：对话内容
    // 支持中文括号（）和英文括号()
    const dialogueMatch = trimmedLine.match(/^[（(]([^）)]+)[）)][:：](.+)$/);
    
    if (dialogueMatch) {
      const character = dialogueMatch[1].trim();
      const text = dialogueMatch[2].trim();
      
      if (character && text) {
        dialogues.push({
          character,
          text,
          lineNumber: index + 1,
          originalLine: trimmedLine,
        });
        charactersSet.add(character);
      }
    }
  });

  const characters = Array.from(charactersSet).sort();

  return {
    dialogues,
    characters,
    stats: {
      totalLines: lines.length,
      dialogueLines: dialogues.length,
      uniqueCharacters: characters.length,
    },
  };
}

/**
 * 生成剧本统计信息
 */
export function generateScriptStats(parseResult: ScriptParseResult) {
  const { dialogues, characters, stats } = parseResult;
  
  // 统计每个角色的对话数量
  const characterStats = characters.map(character => {
    const dialogueCount = dialogues.filter(d => d.character === character).length;
    const totalWords = dialogues
      .filter(d => d.character === character)
      .reduce((sum, d) => sum + d.text.length, 0);
    
    return {
      character,
      dialogueCount,
      totalWords,
      percentage: ((dialogueCount / stats.dialogueLines) * 100).toFixed(1),
    };
  }).sort((a, b) => b.dialogueCount - a.dialogueCount);

  return {
    ...stats,
    characterStats,
  };
}

/**
 * 验证剧本格式并提供建议
 */
export function validateScriptFormat(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const issues: string[] = [];
  const suggestions: string[] = [];

  let hasValidDialogue = false;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // 检查是否为有效对话格式
    const isValidDialogue = /^[（(]([^）)]+)[）)][:：](.+)$/.test(trimmedLine);
    
    if (isValidDialogue) {
      hasValidDialogue = true;
    } else {
      // 检查可能的格式错误
      const possibleCharacterLine = /^[（(]([^）)]+)[）)]/.test(trimmedLine);
      const possibleColonMissing = /^[（(]([^）)]+)[）)][^：:]/.test(trimmedLine);
      
      if (possibleCharacterLine && possibleColonMissing) {
        issues.push(`第${lineNumber}行：缺少冒号，应为"（角色名）：对话内容"`);
      } else if (/^[^（(].*[:：]/.test(trimmedLine)) {
        issues.push(`第${lineNumber}行：角色名需要用括号包围，如"（${trimmedLine.split(/[:：]/)[0].trim()}）"`);
      }
    }
  }

  if (!hasValidDialogue && lines.length > 0) {
    suggestions.push('建议使用格式：（角色名）：对话内容');
    suggestions.push('例如：（猪爸爸）：可是......我该怎么做？');
  }

  return {
    isValid: hasValidDialogue,
    issues,
    suggestions,
  };
}