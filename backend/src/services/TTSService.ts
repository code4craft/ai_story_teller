import axios from 'axios';

export class TTSService {
  private apiToken: string;
  private appId: string;
  private cluster: string;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.TTS_TOKEN || '';
    this.appId = process.env.TTS_APP_ID || '';
    this.cluster = process.env.TTS_CLUSTER || 'volcano_tts';
    this.baseUrl = 'https://openspeech.bytedance.com/api/v1/tts';
    
    console.log('🔧 TTS配置检查:');
    console.log('  TTS_TOKEN:', this.apiToken ? `已配置 (${this.apiToken.slice(0, 15)}...)` : '未配置');
    console.log('  TTS_APP_ID:', this.appId ? `已配置 (${this.appId})` : '未配置');
    console.log('  TTS_CLUSTER:', this.cluster);
    
    if (!this.apiToken || !this.appId) {
      throw new Error('TTS服务配置缺失：需要TTS_TOKEN和TTS_APP_ID');
    }
  }

  /**
   * 生成请求ID
   */
  private generateReqId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 文本转语音
   * @param text 要转换的文本
   * @param voiceId 音色ID
   * @param options 额外选项
   * @returns 音频Buffer
   */
  async textToSpeech(
    text: string, 
    voiceId: string, 
    options: {
      speed?: number;
      volume?: number;
      pitch?: number;
    } = {}
  ): Promise<Buffer> {
    // 检查配置
    if (!this.apiToken || !this.appId) {
      throw new Error('TTS服务未配置，请设置TTS_TOKEN和TTS_APP_ID环境变量');
    }
    
    try {
      // 使用Python版本相同的数据结构
      const requestData = {
        app: {
          appid: this.appId,
          token: this.apiToken,
          cluster: this.cluster
        },
        user: {
          uid: "default_user"
        },
        audio: {
          voice_type: voiceId,
          encoding: 'mp3',
          speed_ratio: options.speed || 1.0,
          volume_ratio: options.volume || 1.0,
          pitch_ratio: options.pitch || 1.0
        },
        request: {
          reqid: this.generateReqId(),
          text: text,
          operation: "query"
        }
      };

      console.log('🚀 发送TTS请求:');
      console.log('  URL:', this.baseUrl);
      console.log('  AppID:', this.appId);
      console.log('  VoiceType:', voiceId);
      console.log('  Text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer;${this.apiToken}`,
        },
        responseType: 'json', // 先改为json，因为返回的是base64编码的音频
        timeout: 30000 // 30秒超时
      });

      if (response.status !== 200) {
        throw new Error(`TTS API响应错误: ${response.status}`);
      }

      const result = response.data;
      
      // 检查API返回的错误码
      if (result.code !== 3000) {
        console.error('TTS API返回错误:', result);
        throw new Error(`TTS API错误: ${result.code} - ${result.message || '未知错误'}`);
      }

      // 获取base64编码的音频数据
      const audioData = result.data;
      if (!audioData) {
        throw new Error('未获取到音频数据');
      }

      // 解码base64音频数据
      const audioBuffer = Buffer.from(audioData, 'base64');
      console.log(`✅ 成功生成音频，大小: ${audioBuffer.length} bytes`);
      
      return audioBuffer;
    } catch (error: any) {
      console.error('TTS服务调用失败:', error.message);
      
      if (error.response) {
        console.error('TTS API错误响应:', error.response.data);
        throw new Error(`TTS API错误: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`TTS服务不可用: ${error.message}`);
    }
  }

  /**
   * 检查TTS服务健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 使用简短文本测试服务
      await this.textToSpeech('测试', 'zh_female_shaoergushi_mars_bigtts');
      return true;
    } catch (error) {
      console.error('TTS健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取支持的音色列表
   */
  async getSupportedVoices(): Promise<any[]> {
    // 由于火山引擎没有提供获取音色列表的API，这里返回预定义的音色列表
    // 实际项目中可以从配置文件或数据库读取
    return [
      {
        voice_id: 'zh_female_shaoergushi_mars_bigtts',
        name: '少儿故事',
        gender: 'female',
        age_type: 'child',
        description: '适合讲故事的温和女声'
      },
      {
        voice_id: 'zh_male_dongfanghaoran_moon_bigtts',
        name: '东方豪然',
        gender: 'male',
        age_type: 'adult',
        description: '威严的成年男声'
      },
      // 更多音色可以从数据库读取
    ];
  }
}