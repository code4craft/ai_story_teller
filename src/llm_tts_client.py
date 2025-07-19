"""
大模型语音合成API客户端
使用HTTP方式进行语音合成
"""

import json
import base64
import uuid
import asyncio
import aiohttp
from typing import Optional, Dict, Any
import concurrent.futures

try:
    from loguru import logger
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

from config import config


class LLMTTSClient:
    """大模型语音合成API客户端"""
    
    # API端点
    HTTP_URL = "https://openspeech.bytedance.com/api/v1/tts"
    
    def __init__(self):
        """初始化客户端"""
        self._validate_config()
        
    def _validate_config(self):
        """验证配置"""
        required_vars = ['TTS_TOKEN', 'TTS_APP_ID']
        missing_vars = []
        
        for var in required_vars:
            if not hasattr(config, var) or not getattr(config, var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ValueError(f"缺少必要的配置: {', '.join(missing_vars)}")
    
    def text_to_speech(self, text: str, 
                      voice_type: Optional[str] = None,
                      speed_ratio: Optional[float] = None,
                      encoding: Optional[str] = None,
                      max_retries: int = 3) -> Optional[bytes]:
        """
        将文本转换为语音
        
        Args:
            text: 要转换的文本
            voice_type: 音色类型
            speed_ratio: 语速比例
            encoding: 音频编码格式
            max_retries: 最大重试次数，默认3次
            
        Returns:
            Optional[bytes]: 音频字节数据，失败返回None
        """
        # 确保至少尝试一次
        actual_retries = max(1, max_retries)
        
        for attempt in range(actual_retries):
            try:
                logger.info(f"TTS请求第 {attempt + 1}/{actual_retries} 次尝试")
                result = self._run_async_task(self._http_tts(text, voice_type, speed_ratio, encoding))
                if result:
                    return result
                else:
                    logger.warning(f"第 {attempt + 1} 次尝试失败，返回结果为空")
            except Exception as e:
                logger.error(f"第 {attempt + 1} 次尝试失败: {str(e)}")
                if attempt < actual_retries - 1:
                    wait_time = (attempt + 1) * 2  # 递增等待时间：2秒、4秒、6秒...
                    logger.info(f"等待 {wait_time} 秒后重试...")
                    import time
                    time.sleep(wait_time)
                else:
                    logger.error(f"已达到最大重试次数 {actual_retries}，TTS转换失败")
        
        return None
    
    def _run_async_task(self, coro):
        """运行异步任务，处理事件循环冲突"""
        try:
            # 尝试获取当前事件循环
            loop = asyncio.get_running_loop()
            # 如果已经在事件循环中，使用线程池运行
            import concurrent.futures
            
            def run_in_thread():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                try:
                    return new_loop.run_until_complete(coro)
                finally:
                    new_loop.close()
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(run_in_thread)
                return future.result()
                
        except RuntimeError:
            # 没有事件循环，直接运行
            return asyncio.run(coro)
    
    async def _http_tts(self, text: str, voice_type: Optional[str], 
                       speed_ratio: Optional[float], encoding: Optional[str]) -> Optional[bytes]:
        """HTTP语音合成"""
        try:
            # 构建请求
            request_data = self._build_request(text, voice_type, speed_ratio, encoding)
            
            # 发送HTTP请求
            headers = {
                "Authorization": f"Bearer;{config.TTS_TOKEN}",
                "Content-Type": "application/json"
            }
            
            # 设置10分钟超时
            timeout = aiohttp.ClientTimeout(total=600)
            
            async with aiohttp.ClientSession() as session:
                logger.info("发送HTTP TTS请求...")
                logger.debug(f"请求URL: {self.HTTP_URL}")
                logger.debug(f"文本长度: {len(text)} 字符")
                
                async with session.post(self.HTTP_URL, 
                                      json=request_data, 
                                      headers=headers,
                                      timeout=timeout) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"HTTP请求失败: {response.status}")
                        logger.error(f"响应头: {dict(response.headers)}")
                        logger.error(f"错误内容: {error_text}")
                        
                        # 根据状态码判断是否应该重试
                        if response.status in [500, 502, 503, 504]:  # 服务器错误，可重试
                            raise Exception(f"服务器错误 {response.status}，可重试")
                        elif response.status == 429:  # 限流，可重试
                            raise Exception("请求过于频繁，可重试")
                        else:  # 客户端错误等，不应重试
                            logger.error("客户端错误或认证失败，不再重试")
                            return None
                    
                    result = await response.json()
                    
                    if result.get("code") != 3000:
                        logger.error(f"TTS API返回错误: {result}")
                        error_code = result.get("code")
                        error_msg = result.get("message", "")
                        
                        # 根据错误码判断是否应该重试
                        if "quota exceeded" in error_msg.lower() and "concurrency" in error_msg.lower():
                            raise Exception("并发超限，可重试")
                        elif error_code in [5000, 5001, 5002]:  # 假设5xxx是服务器错误
                            raise Exception(f"服务器内部错误 {error_code}，可重试")
                        else:
                            logger.error("业务错误，不再重试")
                            return None
                    
                    # 获取音频数据
                    audio_data = result.get("data")
                    if not audio_data:
                        logger.error("未获取到音频数据")
                        return None
                    
                    # 解码音频
                    audio_bytes = base64.b64decode(audio_data)
                    logger.info(f"成功生成音频，大小: {len(audio_bytes)} bytes")
                    return audio_bytes
                    
        except Exception as e:
            logger.error(f"HTTP TTS请求失败: {str(e)}")
            return None
    
    
    def _build_request(self, text: str, voice_type: Optional[str], 
                      speed_ratio: Optional[float], encoding: Optional[str]) -> Dict[str, Any]:
        """构建TTS请求"""
        return {
            "app": {
                "appid": config.TTS_APP_ID,
                "token": config.TTS_TOKEN,
                "cluster": getattr(config, 'TTS_CLUSTER', 'volcano_tts')
            },
            "user": {
                "uid": "default_user"
            },
            "audio": {
                "voice_type": voice_type or getattr(config, 'TTS_VOICE_TYPE', 'zh_male_M392_conversation_wvae_bigtts'),
                "encoding": encoding or getattr(config, 'OUTPUT_FORMAT', 'mp3'),
                "speed_ratio": speed_ratio or getattr(config, 'TTS_SPEED_RATIO', 1.0)
            },
            "request": {
                "reqid": str(uuid.uuid4()),
                "text": text,
                "operation": "query"
            }
        }
    
    
    def test_connection(self) -> bool:
        """测试连接"""
        try:
            # 测试HTTP连接
            return self._run_async_task(self._test_http_connection())
        except Exception as e:
            logger.error(f"连接测试失败: {str(e)}")
            return False
    
    async def _test_http_connection(self) -> bool:
        """测试HTTP连接"""
        try:
            test_request = self._build_request("测试", None, None, None)
            headers = {
                "Authorization": f"Bearer;{config.TTS_TOKEN}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.HTTP_URL, 
                                      json=test_request, 
                                      headers=headers,
                                      timeout=aiohttp.ClientTimeout(total=10)) as response:
                    
                    logger.info(f"HTTP连接测试响应状态: {response.status}")
                    return response.status == 200
                    
        except Exception as e:
            logger.error(f"HTTP连接测试失败: {str(e)}")
            return False