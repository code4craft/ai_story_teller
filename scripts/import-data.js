/**
 * 数据导入脚本
 * 将现有的YAML角色配置和Markdown故事文件导入到MongoDB
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('yamljs');
require('dotenv').config();

// 定义数据模型 Schema
const VoiceSchema = new mongoose.Schema({
  voice_id: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'neutral'] },
  age_type: { type: String, required: true, enum: ['child', 'young_adult', 'adult', 'middle_aged', 'elderly', 'divine', 'narrator'] },
  description: { type: String, trim: true },
  language: { type: String, required: true, default: 'zh' },
  style: { type: String, trim: true },
  provider: { type: String, required: true, default: 'volcengine' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const CharacterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  gender: { type: String, required: true, enum: ['male', 'female', 'mixed', 'neutral'] },
  age_type: { type: String, required: true, trim: true },
  personality: [{ type: String, trim: true }],
  voice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Voice', required: true },
  description: { type: String, trim: true },
  story_series: { type: String, trim: true },
  category: { type: String, trim: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const StorySeriesSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  order: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ChapterSchema = new mongoose.Schema({
  story_series_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StorySeries', required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
  status: { type: String, required: true, enum: ['draft', 'published'], default: 'draft' },
  characters_used: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
  audio_file_path: { type: String, trim: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// 创建模型
const Voice = mongoose.model('Voice', VoiceSchema);
const Character = mongoose.model('Character', CharacterSchema);
const StorySeries = mongoose.model('StorySeries', StorySeriesSchema);
const Chapter = mongoose.model('Chapter', ChapterSchema);

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_story_teller';

class DataImporter {
  constructor() {
    this.voiceMap = new Map(); // 音色ID映射
    this.characterMap = new Map(); // 角色名称映射
    this.storyMap = new Map(); // 故事系列映射
  }

  async connect() {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 数据库连接已关闭');
  }

  /**
   * 导入音色数据
   */
  async importVoices() {
    console.log('\n📢 开始导入音色数据...');
    
    // 预定义的音色列表（基于YAML文件中使用的音色）
    const voices = [
      {
        voice_id: 'zh_male_dongfanghaoran_moon_bigtts',
        name: '东方豪然',
        gender: 'male',
        age_type: 'adult',
        description: '威严的成年男声',
        language: 'zh',
        style: '威严',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_female_gaolengyujie_moon_bigtts',
        name: '高冷御姐',
        gender: 'female',
        age_type: 'adult',
        description: '高冷御姐音色',
        language: 'zh',
        style: '高冷',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_male_tiancaitongsheng_mars_bigtts',
        name: '天才童声',
        gender: 'male',
        age_type: 'child',
        description: '天才儿童音色',
        language: 'zh',
        style: '天真',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_female_shaoergushi_mars_bigtts',
        name: '少儿故事',
        gender: 'female',
        age_type: 'child',
        description: '适合讲故事的温和女声',
        language: 'zh',
        style: '温和',
        provider: 'volcengine'
      },
      {
        voice_id: 'ICL_zh_male_youmodaye_tob',
        name: '幽默大爷',
        gender: 'male',
        age_type: 'elderly',
        description: '幽默的老年男声',
        language: 'zh',
        style: '幽默',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_female_wanqudashu_moon_bigtts',
        name: '顽趣大叔',
        gender: 'female',
        age_type: 'adult',
        description: '顽趣大叔音色',
        language: 'zh',
        style: '顽趣',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_male_guozhoudege_moon_bigtts',
        name: '国钟的歌',
        gender: 'male',
        age_type: 'adult',
        description: '国钟的歌音色',
        language: 'zh',
        style: '磁性',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_male_wennuanahu_moon_bigtts',
        name: '温暖阿虎',
        gender: 'male',
        age_type: 'adult',
        description: '温暖的成年男声',
        language: 'zh',
        style: '温暖',
        provider: 'volcengine'
      },
      {
        voice_id: 'zh_female_popo_mars_bigtts',
        name: '婆婆',
        gender: 'female',
        age_type: 'elderly',
        description: '慈祥的老年女声',
        language: 'zh',
        style: '慈祥',
        provider: 'volcengine'
      }
    ];

    let importedCount = 0;
    
    for (const voiceData of voices) {
      try {
        // 检查是否已存在
        const existingVoice = await Voice.findOne({ voice_id: voiceData.voice_id });
        
        if (!existingVoice) {
          const voice = await Voice.create(voiceData);
          this.voiceMap.set(voiceData.voice_id, voice._id);
          importedCount++;
          console.log(`  ✓ 创建音色: ${voiceData.name} (${voiceData.voice_id})`);
        } else {
          this.voiceMap.set(voiceData.voice_id, existingVoice._id);
          console.log(`  → 音色已存在: ${voiceData.name}`);
        }
      } catch (error) {
        console.error(`  ❌ 创建音色失败 ${voiceData.name}:`, error.message);
      }
    }
    
    console.log(`📢 音色导入完成，新增 ${importedCount} 个音色`);
  }

  /**
   * 导入角色数据
   */
  async importCharacters() {
    console.log('\n👥 开始导入角色数据...');
    
    const rolesPath = path.join(__dirname, '../config/roles.yml');
    
    try {
      const rolesData = yaml.load(rolesPath);
      let importedCount = 0;
      
      // 处理每个角色分类
      for (const [categoryKey, categoryData] of Object.entries(rolesData)) {
        // 跳过配置项
        if (categoryKey.startsWith('tts_') || categoryKey === 'special_effects') {
          continue;
        }
        
        console.log(`  处理分类: ${categoryKey}`);
        
        for (const [roleName, roleData] of Object.entries(categoryData)) {
          try {
            // 查找对应的音色
            const voiceId = this.voiceMap.get(roleData.tts_voice);
            
            if (!voiceId) {
              console.warn(`  ⚠️  角色 ${roleName} 的音色 ${roleData.tts_voice} 未找到，跳过`);
              continue;
            }
            
            // 检查是否已存在
            const existingCharacter = await Character.findOne({ name: roleName });
            
            if (!existingCharacter) {
              const character = await Character.create({
                name: roleName,
                gender: roleData.gender,
                age_type: roleData.age_type,
                personality: roleData.personality || [],
                voice_id: voiceId,
                description: roleData.description,
                story_series: this.getStorySeriesFromCategory(categoryKey),
                category: categoryKey
              });
              
              this.characterMap.set(roleName, character._id);
              importedCount++;
              console.log(`    ✓ 创建角色: ${roleName}`);
            } else {
              this.characterMap.set(roleName, existingCharacter._id);
              console.log(`    → 角色已存在: ${roleName}`);
            }
          } catch (error) {
            console.error(`    ❌ 创建角色失败 ${roleName}:`, error.message);
          }
        }
      }
      
      console.log(`👥 角色导入完成，新增 ${importedCount} 个角色`);
    } catch (error) {
      console.error('❌ 读取角色配置文件失败:', error);
    }
  }

  /**
   * 导入故事系列和章节数据
   */
  async importStories() {
    console.log('\n📚 开始导入故事数据...');
    
    const inputDir = path.join(__dirname, '../data/input');
    
    try {
      const storyDirs = await fs.readdir(inputDir);
      let storyCount = 0;
      let chapterCount = 0;
      
      for (const storyDir of storyDirs) {
        const storyPath = path.join(inputDir, storyDir);
        const stat = await fs.stat(storyPath);
        
        if (!stat.isDirectory()) continue;
        
        console.log(`  处理故事系列: ${storyDir}`);
        
        // 解析故事系列信息
        const seriesTitle = this.parseStoryTitle(storyDir);
        const seriesOrder = this.parseStoryOrder(storyDir);
        
        // 创建故事系列
        let storySeries;
        const existingSeries = await StorySeries.findOne({ title: seriesTitle });
        
        if (!existingSeries) {
          storySeries = await StorySeries.create({
            title: seriesTitle,
            description: `故事系列：${seriesTitle}`,
            order: seriesOrder,
            status: 'published'
          });
          this.storyMap.set(seriesTitle, storySeries._id);
          storyCount++;
          console.log(`    ✓ 创建故事系列: ${seriesTitle}`);
        } else {
          storySeries = existingSeries;
          this.storyMap.set(seriesTitle, existingSeries._id);
          console.log(`    → 故事系列已存在: ${seriesTitle}`);
        }
        
        // 处理章节
        const chapterFiles = await fs.readdir(storyPath);
        
        for (const chapterFile of chapterFiles) {
          if (!chapterFile.endsWith('.md') || chapterFile === 'README.md') {
            continue;
          }
          
          const chapterPath = path.join(storyPath, chapterFile);
          const chapterContent = await fs.readFile(chapterPath, 'utf-8');
          
          // 解析章节信息
          const chapterTitle = this.parseChapterTitle(chapterFile);
          const chapterOrder = this.parseChapterOrder(chapterFile);
          
          // 检查是否已存在
          const existingChapter = await Chapter.findOne({
            story_series_id: storySeries._id,
            title: chapterTitle
          });
          
          if (!existingChapter) {
            await Chapter.create({
              story_series_id: storySeries._id,
              title: chapterTitle,
              content: chapterContent,
              order: chapterOrder,
              status: 'published',
              characters_used: [] // 稍后通过解析填充
            });
            chapterCount++;
            console.log(`      ✓ 创建章节: ${chapterTitle}`);
          } else {
            console.log(`      → 章节已存在: ${chapterTitle}`);
          }
        }
      }
      
      console.log(`📚 故事导入完成，新增 ${storyCount} 个故事系列，${chapterCount} 个章节`);
    } catch (error) {
      console.error('❌ 导入故事数据失败:', error);
    }
  }

  /**
   * 从分类推断故事系列
   */
  getStorySeriesFromCategory(category) {
    const seriesMapping = {
      'pig_family': '三只小猪故事系列',
      'work_characters': '三只小猪故事系列',
      'mythical_characters': '音乐之神故事系列',
      'musicians': '音乐之神故事系列',
      'school_friends': '三只小猪故事系列',
      'snack_planet_characters': '零食星球故事系列',
      'magic_brush_characters': '神奇画笔故事系列',
      'magic_kingdom_characters': '不正常魔法王国故事系列',
      'music_god_characters': '音乐之神故事系列',
      'moon_star_kingdom': '月亮和星星的王国故事系列',
      'knowledge_kingdom_characters': '知识王国故事系列'
    };
    
    return seriesMapping[category] || '';
  }

  /**
   * 解析故事标题
   */
  parseStoryTitle(dirName) {
    const match = dirName.match(/story-\d+-(.*)/);
    return match ? match[1] : dirName;
  }

  /**
   * 解析故事排序
   */
  parseStoryOrder(dirName) {
    const match = dirName.match(/story-(\d+)-/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 解析章节标题
   */
  parseChapterTitle(fileName) {
    return fileName.replace('.md', '');
  }

  /**
   * 解析章节排序
   */
  parseChapterOrder(fileName) {
    const match = fileName.match(/^(\d+)-/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 执行完整的数据导入
   */
  async importAll() {
    console.log('🚀 开始数据导入...\n');
    
    try {
      await this.connect();
      
      await this.importVoices();
      await this.importCharacters();
      await this.importStories();
      
      console.log('\n🎉 数据导入完成！');
    } catch (error) {
      console.error('\n❌ 数据导入失败:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// 执行导入
if (require.main === module) {
  const importer = new DataImporter();
  
  importer.importAll().catch(error => {
    console.error('导入过程出错:', error);
    process.exit(1);
  });
}

module.exports = DataImporter;