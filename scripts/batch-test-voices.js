/**
 * 批量测试音色脚本
 * 功能：获取所有音色，逐个进行测试并保存样本
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// 配置
const config = {
  baseUrl: 'http://localhost:3001',
  testText: '你好，这是音色测试。',
  timeout: 60000, // 60秒超时
  retryCount: 3,   // 重试次数
  retryDelay: 2000 // 重试延迟(毫秒)
};

// 日志函数
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 创建axios实例
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 获取所有音色
 */
async function getAllVoices() {
  try {
    log.info('正在获取音色列表...');
    const response = await api.get('/api/voices', {
      params: {
        limit: 1000 // 获取所有音色
      }
    });
    
    if (response.data.success) {
      const voices = response.data.data;
      log.info(`成功获取 ${voices.length} 个音色`);
      return voices;
    } else {
      throw new Error('获取音色列表失败');
    }
  } catch (error) {
    log.error(`获取音色列表失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试单个音色并保存样本
 */
async function testVoice(voice, retryCount = 0) {
  try {
    log.info(`正在测试音色: ${voice.name} (${voice.voice_id})`);
    
    const response = await api.post(`/api/voices/${voice._id}/test`, {
      text: config.testText,
      save_sample: true
    }, {
      responseType: 'arraybuffer' // 接收二进制数据
    });
    
    if (response.status === 200) {
      log.success(`音色 ${voice.name} 测试成功，样本已保存`);
      return {
        success: true,
        voice: voice.name,
        voiceId: voice.voice_id,
        audioSize: response.data.length
      };
    } else {
      throw new Error(`HTTP状态码: ${response.status}`);
    }
  } catch (error) {
    if (retryCount < config.retryCount) {
      log.warn(`音色 ${voice.name} 测试失败，${config.retryDelay/1000}秒后重试 (${retryCount + 1}/${config.retryCount})`);
      await delay(config.retryDelay);
      return testVoice(voice, retryCount + 1);
    } else {
      log.error(`音色 ${voice.name} 测试失败 (已重试${config.retryCount}次): ${error.message}`);
      return {
        success: false,
        voice: voice.name,
        voiceId: voice.voice_id,
        error: error.message
      };
    }
  }
}

/**
 * 批量测试所有音色
 */
async function batchTestVoices() {
  const startTime = Date.now();
  log.info('开始批量测试音色...');
  
  try {
    // 获取所有音色
    const voices = await getAllVoices();
    
    if (voices.length === 0) {
      log.warn('没有找到音色数据');
      return;
    }
    
    // 结果统计
    const results = {
      total: voices.length,
      success: 0,
      failed: 0,
      details: []
    };
    
    // 逐个测试音色
    for (let i = 0; i < voices.length; i++) {
      const voice = voices[i];
      log.info(`进度: ${i + 1}/${voices.length}`);
      
      const result = await testVoice(voice);
      results.details.push(result);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
      
      // 避免请求过于频繁，每次测试后延迟1秒
      if (i < voices.length - 1) {
        await delay(1000);
      }
    }
    
    // 输出统计结果
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log.info('='.repeat(50));
    log.info('批量测试完成！');
    log.info(`总耗时: ${duration}秒`);
    log.info(`总音色数: ${results.total}`);
    log.success(`成功: ${results.success}`);
    log.error(`失败: ${results.failed}`);
    log.info('='.repeat(50));
    
    // 保存详细结果到文件
    const reportFile = path.join(__dirname, `voice-test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
    await fs.writeFile(reportFile, JSON.stringify({
      ...results,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: `${duration}秒`
    }, null, 2));
    
    log.info(`详细报告已保存到: ${reportFile}`);
    
    // 输出失败的音色
    if (results.failed > 0) {
      log.warn('失败的音色:');
      results.details
        .filter(r => !r.success)
        .forEach(r => log.warn(`  - ${r.voice} (${r.voiceId}): ${r.error}`));
    }
    
  } catch (error) {
    log.error(`批量测试过程中发生错误: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 检查服务器连接
 */
async function checkServerConnection() {
  try {
    log.info('检查服务器连接...');
    const response = await api.get('/health');
    if (response.data.status === 'ok') {
      log.success('服务器连接正常');
      return true;
    } else {
      throw new Error('服务器健康检查失败');
    }
  } catch (error) {
    log.error(`无法连接到服务器 ${config.baseUrl}: ${error.message}`);
    log.error('请确保后端服务器正在运行');
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🎵 AI故事讲述器 - 批量音色测试脚本');
    console.log('='.repeat(50));
    
    // 检查服务器连接
    const serverOk = await checkServerConnection();
    if (!serverOk) {
      process.exit(1);
    }
    
    // 开始批量测试
    await batchTestVoices();
    
    log.success('所有任务完成！');
    
  } catch (error) {
    log.error(`脚本执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 处理中断信号
process.on('SIGINT', () => {
  log.warn('收到中断信号，正在退出...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.warn('收到终止信号，正在退出...');
  process.exit(0);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  batchTestVoices,
  getAllVoices,
  testVoice
};