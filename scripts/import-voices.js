/**
 * 火山引擎音色数据导入脚本
 * 从 docs/火山引擎音色列表.md 导入音色数据到 MongoDB
 * 支持去重功能
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_story_teller';

// 解析性别和年龄类型的辅助函数
function parseGenderAndAge(voiceName, description = '') {
  const nameAndDesc = (voiceName + ' ' + description).toLowerCase();
  
  // 性别判断
  let gender = 'neutral';
  if (nameAndDesc.includes('male') || nameAndDesc.includes('男') || 
      nameAndDesc.includes('先生') || nameAndDesc.includes('boy') ||
      nameAndDesc.includes('豪然') || nameAndDesc.includes('浩宇') || 
      nameAndDesc.includes('志强') || nameAndDesc.includes('建辉')) {
    gender = 'male';
  } else if (nameAndDesc.includes('female') || nameAndDesc.includes('女') ||
             nameAndDesc.includes('小姐') || nameAndDesc.includes('girl') ||
             nameAndDesc.includes('晓萱') || nameAndDesc.includes('诗怡') ||
             nameAndDesc.includes('梦颖') || nameAndDesc.includes('佳佳')) {
    gender = 'female';
  }
  
  // 年龄类型判断
  let ageType = 'adult';
  if (nameAndDesc.includes('child') || nameAndDesc.includes('kid') || 
      nameAndDesc.includes('小孩') || nameAndDesc.includes('儿童') ||
      nameAndDesc.includes('baby') || nameAndDesc.includes('童')) {
    ageType = 'child';
  } else if (nameAndDesc.includes('young') || nameAndDesc.includes('青年') ||
             nameAndDesc.includes('少年') || nameAndDesc.includes('teen')) {
    ageType = 'young_adult';
  } else if (nameAndDesc.includes('old') || nameAndDesc.includes('elderly') ||
             nameAndDesc.includes('老') || nameAndDesc.includes('长者') ||
             nameAndDesc.includes('爷爷') || nameAndDesc.includes('奶奶')) {
    ageType = 'elderly';
  } else if (nameAndDesc.includes('middle') || nameAndDesc.includes('中年')) {
    ageType = 'middle_aged';
  } else if (nameAndDesc.includes('narrator') || nameAndDesc.includes('旁白') ||
             nameAndDesc.includes('播音') || nameAndDesc.includes('主持')) {
    ageType = 'narrator';
  } else if (nameAndDesc.includes('divine') || nameAndDesc.includes('神') ||
             nameAndDesc.includes('仙') || nameAndDesc.includes('帝')) {
    ageType = 'divine';
  }
  
  return { gender, age_type: ageType };
}

// 解析音色风格
function parseStyle(emotions = '', scenarios = '', name = '') {
  const combined = (emotions + ' ' + scenarios + ' ' + name).toLowerCase();
  
  if (combined.includes('温和') || combined.includes('gentle') || combined.includes('soft')) {
    return '温和';
  } else if (combined.includes('威严') || combined.includes('serious') || combined.includes('formal')) {
    return '威严';
  } else if (combined.includes('活泼') || combined.includes('lively') || combined.includes('energetic')) {
    return '活泼';
  } else if (combined.includes('甜美') || combined.includes('sweet') || combined.includes('cute')) {
    return '甜美';
  } else if (combined.includes('磁性') || combined.includes('magnetic') || combined.includes('deep')) {
    return '磁性';
  } else if (combined.includes('清澈') || combined.includes('clear') || combined.includes('crisp')) {
    return '清澈';
  } else {
    return '标准';
  }
}

// 解析 Markdown 表格
function parseVoiceTable(content) {
  const lines = content.split('\n');
  const voices = [];
  let inTable = false;
  let headers = [];
  let lastRowData = {}; // 保存上一行的数据用于复用
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测表格开始
    if (trimmedLine.includes('voice_type') && trimmedLine.includes('|')) {
      headers = trimmedLine.split('|').map(h => h.trim()).filter(h => h);
      inTable = true;
      lastRowData = {}; // 重置上一行数据
      continue;
    }
    
    // 跳过表格分隔符
    if (inTable && trimmedLine.includes('---')) {
      continue;
    }
    
    // 解析表格行
    if (inTable && trimmedLine.includes('|')) {
      const rawCells = trimmedLine.split('|').map(c => c.trim());
      // 移除开头和结尾的空字符串（分割 |cell1|cell2| 产生的）
      if (rawCells.length > 0 && rawCells[0] === '') rawCells.shift();
      if (rawCells.length > 0 && rawCells[rawCells.length - 1] === '') rawCells.pop();
      
      if (rawCells.length >= 4) {
        // 处理空值，复用上一行的数据
        const cells = rawCells.map((cell, index) => {
          if (cell === '' || cell === '**多情感**' || cell === '**教育场景**' || cell === '**客服场景**' || cell === '**通用场景**') {
            // 如果是空值或分类标题，使用上一行的对应值
            return lastRowData[`col_${index}`] || cell;
          }
          return cell;
        });
        
        console.log(cells);

        // 表格结构: | 场景 | 音色名称 | voice_type | 语种 | 支持的情感 | 上线业务方 |
        const voiceData = {
            scenario: cells[0] || '',       // 场景
            name: cells[1] || '',           // 音色名称  
            voice_type: cells[2] || '',     // voice_type
            language: cells[3] || '',       // 语种
            emotions: cells[4] || '',       // 支持的情感
            business: cells[5] || ''        // 上线业务方
          };
          
        // 保存当前行数据供下一行使用（除了分类标题行）
        if (!cells[0].includes('**')) {
          lastRowData = {};
          cells.forEach((cell, index) => {
            lastRowData[`col_${index}`] = cell;
          });
        }
        
        // 验证 voice_type 格式 - 必须有效且不是表头
        if (voiceData.voice_type && 
            voiceData.voice_type !== 'voice_type' && 
            voiceData.voice_type.length > 5 &&
            (voiceData.voice_type.startsWith('zh_') || 
             voiceData.voice_type.startsWith('en_') ||
             voiceData.voice_type.includes('_'))) {
          const { gender, age_type } = parseGenderAndAge(
            voiceData.name || voiceData.voice_type,
            voiceData.description || ''
          );
          
          const voice = {
            voice_id: voiceData.voice_type,
            name: voiceData.name || voiceData.voice_type,
            gender: gender,
            age_type: age_type,
            description: voiceData.scenario || '',
            language: voiceData.language || 'zh',
            style: parseStyle(
              voiceData.emotions || '',
              voiceData.scenario || '',
              voiceData.name || ''
            ),
            provider: 'volcengine',
            created_at: new Date(),
            updated_at: new Date()
          };
          
          voices.push(voice);
        } else if (voiceData.voice_type && voiceData.voice_type !== 'voice_type') {
          // 调试信息：显示被过滤的数据
          console.log(`过滤无效voice_type: "${voiceData.voice_type}"`);
        }
      }
    }
    
    // 检测表格结束（空行或新的标题）
    if (inTable && (trimmedLine === '' || trimmedLine.startsWith('#'))) {
      inTable = false;
    }
  }
  
  return voices;
}

async function importVoices() {
  let client;
  
  try {
    // 读取音色列表文档
    const voiceListPath = path.join(__dirname, '../docs/火山引擎音色列表.md');
    console.log('读取音色列表文档:', voiceListPath);
    
    if (!fs.existsSync(voiceListPath)) {
      throw new Error(`音色列表文档不存在: ${voiceListPath}`);
    }
    
    const content = fs.readFileSync(voiceListPath, 'utf8');
    console.log('文档内容长度:', content.length);
    
    // 解析音色数据
    const parsedVoices = parseVoiceTable(content);
    console.log(`解析到 ${parsedVoices.length} 个音色`);
    
    // 对解析出的数据进行内部去重
    const voiceMap = new Map();
    parsedVoices.forEach(voice => {
      if (!voiceMap.has(voice.voice_id)) {
        voiceMap.set(voice.voice_id, voice);
      }
    });
    const voices = Array.from(voiceMap.values());
    
    if (voices.length < parsedVoices.length) {
      console.log(`解析数据内部去重: ${parsedVoices.length} -> ${voices.length}`);
    }
    
    if (voices.length === 0) {
      console.log('未找到音色数据，请检查文档格式');
      return;
    }
    
    // 连接数据库
    console.log('连接数据库...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const voicesCollection = db.collection('voices');
    
    // 获取现有音色列表用于去重
    const existingVoices = await voicesCollection.find({}, { voice_id: 1 }).toArray();
    const existingVoiceIds = new Set(existingVoices.map(v => v.voice_id));
    
    console.log(`数据库中现有 ${existingVoiceIds.size} 个音色`);
    
    // 过滤重复的音色
    const newVoices = voices.filter(voice => !existingVoiceIds.has(voice.voice_id));
    const duplicateCount = voices.length - newVoices.length;
    
    console.log(`总共 ${voices.length} 个音色，其中 ${duplicateCount} 个重复（已忽略），${newVoices.length} 个新音色`);
    
    if (newVoices.length === 0) {
      console.log('没有新音色需要导入，所有音色都已存在');
      return;
    }
    
    // 批量插入新音色
    const result = await voicesCollection.insertMany(newVoices);
    console.log(`成功导入 ${result.insertedCount} 个新音色，忽略 ${duplicateCount} 个重复音色`);
    
    // 显示导入的音色统计
    const stats = {
      male: newVoices.filter(v => v.gender === 'male').length,
      female: newVoices.filter(v => v.gender === 'female').length,
      neutral: newVoices.filter(v => v.gender === 'neutral').length,
      languages: [...new Set(newVoices.map(v => v.language))],
      styles: [...new Set(newVoices.map(v => v.style))]
    };
    
    console.log('\n导入统计:');
    console.log(`- 男声: ${stats.male} 个`);
    console.log(`- 女声: ${stats.female} 个`);
    console.log(`- 中性: ${stats.neutral} 个`);
    console.log(`- 语言: ${stats.languages.join(', ')}`);
    console.log(`- 风格: ${stats.styles.join(', ')}`);
    
    // 显示前几个导入的音色示例
    console.log('\n导入示例:');
    newVoices.slice(0, 3).forEach(voice => {
      console.log(`- ${voice.name} (${voice.voice_id}) - ${voice.gender}/${voice.age_type}/${voice.style}`);
    });
    
  } catch (error) {
    console.error('导入失败:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// 执行导入
if (require.main === module) {
  importVoices().then(() => {
    console.log('\n音色导入完成');
    process.exit(0);
  });
}

module.exports = { importVoices, parseVoiceTable };