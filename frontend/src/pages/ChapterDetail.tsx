import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Alert,
  Modal,
  List,
  Avatar,
  Tooltip,
  Badge,
  Tabs,
  Form,
  Spin,
  Empty,
  Statistic,
  Progress,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CheckOutlined,
  PlusOutlined,
  UserOutlined,
  MessageOutlined,
  BarChartOutlined,
  SoundOutlined,
  LoadingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
// import MonacoEditor from '@monaco-editor/react';
import storyService from '../services/storyService';
import characterService from '../services/characterService';
import voiceService from '../services/voiceService';
import { Chapter, Character, Voice } from '../types/api';
import { parseScript, generateScriptStats, validateScriptFormat, ParsedDialogue } from '../utils/scriptParser';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ChapterDetail: React.FC = () => {
  const { seriesId, chapterId } = useParams<{ seriesId: string; chapterId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [parsedDialogues, setParsedDialogues] = useState<ParsedDialogue[]>([]);
  const [scriptCharacters, setScriptCharacters] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [characterMapping, setCharacterMapping] = useState<Record<string, string>>({});
  const [isCharacterModalVisible, setIsCharacterModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [scriptStats, setScriptStats] = useState<any>(null);
  const [formatValidation, setFormatValidation] = useState<any>(null);
  const [generatingAudio, setGeneratingAudio] = useState<Set<number>>(new Set());
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [selectedCharacterForVoiceUpdate, setSelectedCharacterForVoiceUpdate] = useState<Character | null>(null);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const [isCreateCharacterModalVisible, setIsCreateCharacterModalVisible] = useState(false);
  const [pendingCharacterName, setPendingCharacterName] = useState<string>('');

  const [form] = Form.useForm();
  const [voiceForm] = Form.useForm();
  const [createCharacterForm] = Form.useForm();

  // 查询章节详情
  const { data: chapterData, isLoading: isLoadingChapter } = useQuery(
    ['chapter', chapterId],
    () => storyService.getChapterById(chapterId!),
    {
      enabled: !!chapterId,
      onSuccess: (data) => {
        if (data.data) {
          setContent(data.data.content);
          form.setFieldsValue({
            title: data.data.title,
            status: data.data.status,
          });
          // 设置已选择的角色
          const characterIds = data.data.characters_used?.map(char => 
            typeof char === 'string' ? char : char._id
          ) || [];
          setSelectedCharacters(characterIds);
        }
      },
      refetchOnWindowFocus: false,
    }
  );

  // 查询所有角色
  const { data: charactersData } = useQuery(
    ['characters-for-chapter'],
    () => characterService.getCharacters({ limit: 1000 }),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询所有音色（用于配音更新）
  const { data: voicesData } = useQuery(
    ['voices-for-voice-update'],
    () => import('../services/voiceService').then(mod => mod.default.getVoices({ limit: 1000 })),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询当前章节的故事系列信息
  const { data: storySeriesData } = useQuery(
    ['story-series', seriesId],
    () => storyService.getStorySeriesById(seriesId!),
    {
      enabled: !!seriesId,
      refetchOnWindowFocus: false,
    }
  );

  // 查询故事系列列表（用于新建角色时选择）
  const { data: allStorySeriesData } = useQuery(
    ['all-story-series'],
    () => characterService.getStorySeries(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 更新章节
  const updateChapterMutation = useMutation(
    (data: any) => storyService.updateChapter(chapterId!, data),
    {
      onSuccess: () => {
        message.success('章节保存成功');
        queryClient.invalidateQueries(['chapter', chapterId]);
        queryClient.invalidateQueries(['chapters', seriesId]);
      },
    }
  );

  // 解析章节内容
  const parseChapterMutation = useMutation(
    () => storyService.parseChapter(chapterId!),
    {
      onSuccess: (data) => {
        if (data.data) {
          setParsedDialogues(data.data.dialogues || []);
          message.success('内容解析成功');
        }
      },
    }
  );

  // 生成对话音频
  const generateDialogueAudioMutation = useMutation(
    (data: { text: string; characterId: string; voiceId?: string; index: number }) =>
      storyService.generateDialogueAudio({
        text: data.text,
        characterId: data.characterId,
        voiceId: data.voiceId,
      }).then(blob => ({ blob, index: data.index })),
    {
      onSuccess: ({ blob, index }) => {
        // 创建音频URL并播放
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        setPlayingAudio(index);
        audio.onended = () => {
          setPlayingAudio(null);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.play().catch((error) => {
          console.error('音频播放失败:', error);
          message.error('音频播放失败');
          setPlayingAudio(null);
        });
        
        setGeneratingAudio(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      },
      onError: (error, variables) => {
        console.error('音频生成失败:', error);
        message.error('音频生成失败');
        setGeneratingAudio(prev => {
          const newSet = new Set(prev);
          newSet.delete(variables.index);
          return newSet;
        });
      },
    }
  );

  // 更新角色配音
  const updateCharacterVoiceMutation = useMutation(
    ({ characterId, voiceId }: { characterId: string; voiceId: string }) =>
      characterService.updateCharacterVoice(characterId, voiceId),
    {
      onSuccess: () => {
        message.success('配音更新成功');
        queryClient.invalidateQueries(['characters-for-chapter']);
        setIsVoiceModalVisible(false);
        setSelectedCharacterForVoiceUpdate(null);
        voiceForm.resetFields();
      },
      onError: () => {
        message.error('配音更新失败');
      },
    }
  );

  // 创建新角色
  const createCharacterMutation = useMutation(
    characterService.createCharacter,
    {
      onSuccess: (response) => {
        message.success('角色创建成功');
        queryClient.invalidateQueries(['characters-for-chapter']);
        
        // 自动将新创建的角色与当前剧本角色关联
        if (pendingCharacterName && response?.data?._id) {
          const newCharacterId = response.data._id;
          setCharacterMapping(prev => ({
            ...prev,
            [pendingCharacterName]: newCharacterId
          }));
          if (!selectedCharacters.includes(newCharacterId)) {
            setSelectedCharacters(prev => [...prev, newCharacterId]);
          }
        }
        
        setIsCreateCharacterModalVisible(false);
        setPendingCharacterName('');
        createCharacterForm.resetFields();
      },
      onError: () => {
        message.error('角色创建失败');
      },
    }
  );

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      updateChapterMutation.mutate({
        ...values,
        content,
        characters_used: selectedCharacters,
      });
    } catch (error) {
      message.error('请检查表单填写是否正确');
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate('/stories');
  };

  // 解析剧本内容
  const parseContent = () => {
    const parseResult = parseScript(content);
    const stats = generateScriptStats(parseResult);
    const validation = validateScriptFormat(content);
    
    setParsedDialogues(parseResult.dialogues);
    setScriptCharacters(parseResult.characters);
    setScriptStats(stats);
    setFormatValidation(validation);
    
    // 自动匹配角色
    autoMatchCharacters(parseResult.characters);
    
    if (parseResult.dialogues.length > 0) {
      message.success(`解析完成：找到 ${parseResult.characters.length} 个角色，${parseResult.dialogues.length} 句对话`);
    } else if (content.trim()) {
      message.warning('未找到有效的对话格式，请检查格式是否正确');
    }
  };

  // 自动匹配角色
  const autoMatchCharacters = (scriptChars: string[]) => {
    const newMapping: Record<string, string> = {};
    const matchedCharacterIds: string[] = [];

    scriptChars.forEach(scriptChar => {
      // 精确匹配
      const exactMatch = charactersData?.data?.find(
        char => char.name === scriptChar
      );
      
      if (exactMatch) {
        newMapping[scriptChar] = exactMatch._id;
        matchedCharacterIds.push(exactMatch._id);
      } else {
        // 模糊匹配（包含关系）
        const fuzzyMatch = charactersData?.data?.find(
          char => char.name.includes(scriptChar) || scriptChar.includes(char.name)
        );
        
        if (fuzzyMatch) {
          newMapping[scriptChar] = fuzzyMatch._id;
          matchedCharacterIds.push(fuzzyMatch._id);
        }
      }
    });

    setCharacterMapping(newMapping);
    
    // 更新选中的角色
    const uniqueIds = Array.from(new Set([...selectedCharacters, ...matchedCharacterIds]));
    setSelectedCharacters(uniqueIds);
  };

  // 播放音色样本
  const playVoiceSample = (voice: Voice) => {
    if (voice.sample_audio?.url) {
      const audioUrl = `http://localhost:3001${voice.sample_audio.url}`;
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        console.error('音频播放失败:', error);
        message.error('音频播放失败');
      });
    } else {
      message.warning('该音色没有样本音频');
    }
  };

  // 生成并播放对话音频
  const handleGenerateDialogueAudio = (dialogue: ParsedDialogue, index: number) => {
    const mappedCharacterId = characterMapping[dialogue.character];
    const character = charactersData?.data?.find(char => char._id === mappedCharacterId);
    
    if (!character) {
      message.warning('请先为角色选择配音');
      return;
    }
    
    const voice = character.voice_id as Voice;
    if (!voice || typeof voice !== 'object') {
      message.warning('该角色没有配置配音');
      return;
    }
    
    setGeneratingAudio(prev => new Set(prev).add(index));
    generateDialogueAudioMutation.mutate({
      text: dialogue.text,
      characterId: character._id,
      voiceId: voice._id,
      index,
    });
  };

  // 打开配音更换对话框
  const handleOpenVoiceModal = (character: Character) => {
    setSelectedCharacterForVoiceUpdate(character);
    setIsVoiceModalVisible(true);
    
    const currentVoice = character.voice_id as Voice;
    voiceForm.setFieldsValue({
      voice_id: currentVoice && typeof currentVoice === 'object' ? currentVoice._id : undefined,
    });
  };

  // 提交配音更换
  const handleVoiceUpdate = async () => {
    if (!selectedCharacterForVoiceUpdate) return;
    
    try {
      const values = await voiceForm.validateFields();
      updateCharacterVoiceMutation.mutate({
        characterId: selectedCharacterForVoiceUpdate._id,
        voiceId: values.voice_id,
      });
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理新建角色
  const handleCreateNewCharacter = (scriptCharacterName: string) => {
    setPendingCharacterName(scriptCharacterName);
    setIsCreateCharacterModalVisible(true);
    
    // 设置默认值
    createCharacterForm.setFieldsValue({
      name: scriptCharacterName,
      story_series: storySeriesData?.data?.title || '',
      gender: 'neutral',
      age_type: 'adult',
    });
  };

  // 提交新建角色
  const handleCreateCharacterSubmit = async () => {
    try {
      const values = await createCharacterForm.validateFields();
      createCharacterMutation.mutate(values);
    } catch (error) {
      // 表单验证失败
    }
  };

  // 渲染对话预览
  const renderDialoguePreview = () => {
    if (parsedDialogues.length === 0) {
      return (
        <div>
          {formatValidation?.suggestions.length > 0 && (
            <Alert
              message="格式建议"
              description={
                <ul>
                  {formatValidation.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
          )}
          <Empty
            description="暂无对话内容"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={parseContent}>
              解析内容
            </Button>
          </Empty>
        </div>
      );
    }

    return (
      <div>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="总对话数"
              value={scriptStats?.dialogueLines || 0}
              prefix={<MessageOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="角色数量"
              value={scriptStats?.uniqueCharacters || 0}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已匹配角色"
              value={Object.keys(characterMapping).length}
              prefix={<CheckOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="匹配率"
              value={scriptCharacters.length > 0 ? 
                Math.round((Object.keys(characterMapping).length / scriptCharacters.length) * 100) : 0}
              suffix="%"
              prefix={<BarChartOutlined />}
            />
          </Col>
        </Row>

        {/* 格式验证问题 */}
        {formatValidation?.issues.length > 0 && (
          <Alert
            message="格式问题"
            description={
              <ul>
                {formatValidation.issues.map((issue: string, index: number) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            }
            type="warning"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 对话列表 */}
        <List
          dataSource={parsedDialogues}
          renderItem={(dialogue, index) => {
            const mappedCharacterId = characterMapping[dialogue.character];
            const character = charactersData?.data?.find(
              char => char._id === mappedCharacterId
            );
            const voice = character?.voice_id as Voice;
            const isMatched = !!character;
            
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Badge count={dialogue.lineNumber} size="small">
                      <Avatar style={{ 
                        backgroundColor: isMatched ? '#1890ff' : '#999',
                        fontSize: 12 
                      }}>
                        {dialogue.character.charAt(0)}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <Space>
                      <Text strong>{dialogue.character}</Text>
                      {character && (
                        <>
                          <Tag color={character.gender === 'male' ? 'blue' : 'pink'}>
                            {character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '其他'}
                          </Tag>
                          {voice && typeof voice === 'object' && (
                            <Tag color="green">{voice.name}</Tag>
                          )}
                        </>
                      )}
                      {!isMatched && (
                        <Tag color="orange">未匹配</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text>{dialogue.text}</Text>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                        第 {dialogue.lineNumber} 行
                      </div>
                    </div>
                  }
                />
                <div>
                  <Space>
                    {/* 样本试听 */}
                    {voice && typeof voice === 'object' && voice.sample_audio?.url && (
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={() => playVoiceSample(voice)}
                        size="small"
                      >
                        样本
                      </Button>
                    )}
                    
                    {/* 对话试听 */}
                    {isMatched && (
                      <Button
                        type="link"
                        icon={generatingAudio.has(index) ? <LoadingOutlined /> : <SoundOutlined />}
                        onClick={() => handleGenerateDialogueAudio(dialogue, index)}
                        size="small"
                        loading={generatingAudio.has(index)}
                        disabled={playingAudio === index}
                      >
                        {playingAudio === index ? '播放中' : '试听'}
                      </Button>
                    )}
                    
                    {/* 角色选择 */}
                    {!isMatched && (
                      <Select
                        placeholder="选择角色"
                        style={{ width: 120 }}
                        size="small"
                        value={mappedCharacterId}
                        onChange={(characterId) => {
                          setCharacterMapping(prev => ({
                            ...prev,
                            [dialogue.character]: characterId
                          }));
                          if (!selectedCharacters.includes(characterId)) {
                            setSelectedCharacters(prev => [...prev, characterId]);
                          }
                        }}
                      >
                        {charactersData?.data?.map(char => (
                          <Option key={char._id} value={char._id}>
                            {char.name}
                          </Option>
                        ))}
                      </Select>
                    )}
                  </Space>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
    );
  };

  if (isLoadingChapter) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  const chapter = chapterData?.data;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
            <Title level={2} className="page-title" style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: 8 }} />
              {chapter?.title || '章节详情'}
            </Title>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={updateChapterMutation.isLoading}
            >
              保存
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="title"
                    label="章节标题"
                    rules={[{ required: true, message: '请输入章节标题' }]}
                  >
                    <Input placeholder="例如：第一章 美猴王出世" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Option value="draft">草稿</Option>
                      <Option value="published">已发布</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            <Divider />

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="编辑内容" key="edit">
                <div style={{ marginBottom: 16 }}>
                  <Alert
                    message="剧本格式说明"
                    description={
                      <div>
                        <p>请使用以下格式编写剧本内容：</p>
                        <p><code>（角色名）：对话内容</code></p>
                        <p>例如：</p>
                        <p><code>（猪爸爸）：可是......我该怎么做？我现在连音乐都听不到了，感受不到了，我怎么找回音乐的初心啊？</code></p>
                        <p><code>（旁白）：很久很久以前，在一个美丽的森林里...</code></p>
                        <p>支持中文括号（）和英文括号()，冒号可以是中文：或英文:</p>
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </div>
                
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                  placeholder="输入剧本内容..."
                />
              </TabPane>

              <TabPane tab="预览对话" key="preview">
                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" onClick={parseContent}>
                    解析内容
                  </Button>
                  <Text style={{ marginLeft: 16 }}>
                    共 {parsedDialogues.length} 句对话
                  </Text>
                </div>
                {renderDialoguePreview()}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                角色配置
                {scriptCharacters.length > 0 && (
                  <Badge count={scriptCharacters.length} style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>
            }
            extra={
              <Space>
                <Button size="small" onClick={parseContent}>
                  解析角色
                </Button>
                <Button
                  type="link"
                  onClick={() => setIsCharacterModalVisible(true)}
                >
                  手动选择
                </Button>
              </Space>
            }
          >
            {scriptCharacters.length > 0 ? (
              <div>
                <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                  剧本中的角色（{scriptCharacters.length}个）
                </Text>
                <List
                  size="small"
                  dataSource={scriptCharacters}
                  renderItem={(scriptChar) => {
                    const mappedCharacterId = characterMapping[scriptChar];
                    const character = charactersData?.data?.find(
                      char => char._id === mappedCharacterId
                    );
                    const voice = character?.voice_id as Voice;
                    const isMatched = !!character;
                    const dialogueCount = parsedDialogues.filter(d => d.character === scriptChar).length;
                    
                    return (
                      <List.Item style={{ paddingTop: 8, paddingBottom: 8 }}>
                        <div style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Space>
                              <Avatar size="small" style={{ 
                                backgroundColor: isMatched ? '#1890ff' : '#999',
                                fontSize: 12 
                              }}>
                                {scriptChar.charAt(0)}
                              </Avatar>
                              <Text strong>{scriptChar}</Text>
                              <Badge count={dialogueCount} size="small" />
                            </Space>
                            <Space size={4}>
                              {voice && typeof voice === 'object' && voice.sample_audio?.url && (
                                <Button
                                  type="link"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => playVoiceSample(voice)}
                                  size="small"
                                />
                              )}
                              {isMatched && character && (
                                <Button
                                  type="link"
                                  icon={<SwapOutlined />}
                                  onClick={() => handleOpenVoiceModal(character)}
                                  size="small"
                                >
                                  换音
                                </Button>
                              )}
                            </Space>
                          </div>
                          
                          {isMatched ? (
                            <div style={{ paddingLeft: 24 }}>
                              <Space size={4}>
                                <Tag color="green">已匹配</Tag>
                                <Text style={{ fontSize: 12 }}>{character.name}</Text>
                                {voice && typeof voice === 'object' && (
                                  <Tag color="blue">{voice.name}</Tag>
                                )}
                              </Space>
                            </div>
                          ) : (
                            <div style={{ paddingLeft: 24 }}>
                              <Select
                                placeholder="选择角色"
                                style={{ width: '100%' }}
                                size="small"
                                value={mappedCharacterId}
                                onChange={(characterId) => {
                                  if (characterId === 'CREATE_NEW') {
                                    handleCreateNewCharacter(scriptChar);
                                    return;
                                  }
                                  setCharacterMapping(prev => ({
                                    ...prev,
                                    [scriptChar]: characterId
                                  }));
                                  if (!selectedCharacters.includes(characterId)) {
                                    setSelectedCharacters(prev => [...prev, characterId]);
                                  }
                                }}
                                allowClear
                                onClear={() => {
                                  setCharacterMapping(prev => {
                                    const newMapping = { ...prev };
                                    delete newMapping[scriptChar];
                                    return newMapping;
                                  });
                                }}
                                dropdownRender={(menu) => (
                                  <>
                                    {menu}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Button
                                      type="text"
                                      icon={<PlusOutlined />}
                                      style={{ width: '100%', textAlign: 'left' }}
                                      onClick={() => handleCreateNewCharacter(scriptChar)}
                                    >
                                      新建角色 "{scriptChar}"
                                    </Button>
                                  </>
                                )}
                              >
                                {charactersData?.data?.map(char => (
                                  <Option key={char._id} value={char._id}>
                                    <Space>
                                      {char.name}
                                      <Tag color={char.gender === 'male' ? 'blue' : 'pink'}>
                                        {char.gender === 'male' ? '男' : '女'}
                                      </Tag>
                                    </Space>
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    );
                  }}
                />
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="请先在左侧编写剧本内容，然后点击解析角色按钮"
              />
            )}
          </Card>

          <Card title="章节信息" style={{ marginTop: 16 }}>
            <Paragraph>
              <Text type="secondary">创建时间：</Text>
              <br />
              {chapter && new Date(chapter.created_at).toLocaleString()}
            </Paragraph>
            <Paragraph>
              <Text type="secondary">更新时间：</Text>
              <br />
              {chapter && new Date(chapter.updated_at).toLocaleString()}
            </Paragraph>
            {chapter?.audio_file_path && (
              <Paragraph>
                <Text type="secondary">音频文件：</Text>
                <br />
                <a href={chapter.audio_file_path} target="_blank" rel="noopener noreferrer">
                  下载音频
                </a>
              </Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      {/* 角色选择对话框 */}
      <Modal
        title="选择角色"
        open={isCharacterModalVisible}
        onOk={() => setIsCharacterModalVisible(false)}
        onCancel={() => setIsCharacterModalVisible(false)}
        width={600}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择参与本章节的角色"
          value={selectedCharacters}
          onChange={setSelectedCharacters}
          optionFilterProp="children"
        >
          {charactersData?.data?.map(character => (
            <Option key={character._id} value={character._id}>
              <Space>
                {character.name}
                <Tag color={character.gender === 'male' ? 'blue' : 'pink'} >
                  {character.gender === 'male' ? '男' : '女'}
                </Tag>
              </Space>
            </Option>
          ))}
        </Select>
      </Modal>

      {/* 配音更换对话框 */}
      <Modal
        title={`为 ${selectedCharacterForVoiceUpdate?.name} 更换配音`}
        open={isVoiceModalVisible}
        onOk={handleVoiceUpdate}
        onCancel={() => {
          setIsVoiceModalVisible(false);
          setSelectedCharacterForVoiceUpdate(null);
          voiceForm.resetFields();
        }}
        confirmLoading={updateCharacterVoiceMutation.isLoading}
      >
        <Alert
          message="注意"
          description="更换配音会全局应用到该角色的所有对话中。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={voiceForm}
          layout="vertical"
        >
          <Form.Item
            name="voice_id"
            label="选择音色"
            rules={[{ required: true, message: '请选择音色' }]}
          >
            <Select
              placeholder="搜索音色名称、性别、年龄类型..."
              showSearch
              filterOption={(input, option) => {
                const voice = voicesData?.data?.find(v => v._id === option?.value);
                if (!voice) return false;
                
                const searchText = input.toLowerCase();
                const searchFields = [
                  voice.name.toLowerCase(),
                  voice.voice_id.toLowerCase(),
                  voice.gender === 'male' ? '男声' : voice.gender === 'female' ? '女声' : '其他',
                  voice.age_type.toLowerCase(),
                  voice.description?.toLowerCase() || '',
                  // 添加拼音和常用搜索词
                  voice.gender === 'male' ? 'nan nv male' : 'nv female',
                  voice.age_type.includes('child') ? 'child kid 儿童 小孩' : '',
                  voice.age_type.includes('adult') ? 'adult 成人 大人' : '',
                  voice.age_type.includes('elderly') ? 'elderly old 老人 老年' : '',
                ].join(' ');
                
                return searchFields.includes(searchText);
              }}
              style={{ width: '100%' }}
            >
              {voicesData?.data?.map((voice: Voice) => (
                <Option key={voice._id} value={voice._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space>
                      <Text strong>{voice.name}</Text>
                      <Tag color={voice.gender === 'male' ? 'blue' : 'pink'}>
                        {voice.gender === 'male' ? '男声' : voice.gender === 'female' ? '女声' : '其他'}
                      </Tag>
                      <Tag color="default" style={{ fontSize: '11px' }}>
                        {voice.age_type}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {voice.voice_id}
                      </Text>
                    </Space>
                    {voice.sample_audio?.url && (
                      <Button
                        type="link"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceSample(voice);
                        }}
                        size="small"
                        title="试听音色样本"
                      >
                        试听
                      </Button>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建角色对话框 */}
      <Modal
        title={`新建角色 "${pendingCharacterName}"`}
        open={isCreateCharacterModalVisible}
        onOk={handleCreateCharacterSubmit}
        onCancel={() => {
          setIsCreateCharacterModalVisible(false);
          setPendingCharacterName('');
          createCharacterForm.resetFields();
        }}
        confirmLoading={createCharacterMutation.isLoading}
        width={600}
      >
        <Form
          form={createCharacterForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="角色名称" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="选择性别">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="mixed">混合</Option>
              <Option value="neutral">中性</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="age_type"
            label="年龄类型"
            rules={[{ required: true, message: '请输入年龄类型' }]}
          >
            <Select placeholder="选择年龄类型">
              <Option value="child">儿童</Option>
              <Option value="young_adult">青少年</Option>
              <Option value="adult">成年人</Option>
              <Option value="middle_aged">中年人</Option>
              <Option value="elderly">老年人</Option>
              <Option value="narrator">旁白</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="voice_id"
            label="配音音色"
            rules={[{ required: true, message: '请选择配音音色' }]}
          >
            <Select 
              placeholder="搜索音色名称、性别、年龄类型..."
              showSearch
              filterOption={(input, option) => {
                const voice = voicesData?.data?.find(v => v._id === option?.value);
                if (!voice) return false;
                
                const searchText = input.toLowerCase();
                const searchFields = [
                  voice.name.toLowerCase(),
                  voice.voice_id.toLowerCase(),
                  voice.gender === 'male' ? '男声' : voice.gender === 'female' ? '女声' : '其他',
                  voice.age_type.toLowerCase(),
                  voice.description?.toLowerCase() || '',
                  // 添加拼音和常用搜索词
                  voice.gender === 'male' ? 'nan male' : 'nv female',
                  voice.age_type.includes('child') ? 'child kid 儿童 小孩' : '',
                  voice.age_type.includes('adult') ? 'adult 成人 大人' : '',
                  voice.age_type.includes('elderly') ? 'elderly old 老人 老年' : '',
                  voice.age_type.includes('narrator') ? 'narrator 旁白 解说' : '',
                ].join(' ');
                
                return searchFields.includes(searchText);
              }}
              style={{ width: '100%' }}
            >
              {voicesData?.data?.map(voice => (
                <Option key={voice._id} value={voice._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space>
                      <Text strong>{voice.name}</Text>
                      <Tag color={voice.gender === 'male' ? 'blue' : 'pink'}>
                        {voice.gender === 'male' ? '男声' : voice.gender === 'female' ? '女声' : '其他'}
                      </Tag>
                      <Tag color="default" style={{ fontSize: '11px' }}>
                        {voice.age_type}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {voice.voice_id}
                      </Text>
                    </Space>
                    {voice.sample_audio?.url && (
                      <Button
                        type="link"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          playVoiceSample(voice);
                        }}
                        title="试听音色样本"
                      />
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="story_series"
            label="故事系列"
          >
            <Select 
              placeholder="选择故事系列"
              allowClear
            >
              {allStorySeriesData?.map(series => (
                <Option key={series} value={series}>{series}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="personality"
            label="性格特点"
          >
            <Select
              mode="tags"
              placeholder="输入性格特点，按回车添加"
              style={{ width: '100%' }}
            >
              <Option value="温和">温和</Option>
              <Option value="活泼">活泼</Option>
              <Option value="聪明">聪明</Option>
              <Option value="善良">善良</Option>
              <Option value="勇敢">勇敢</Option>
              <Option value="调皮">调皮</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="角色描述">
            <TextArea rows={3} placeholder="描述角色的背景、特征等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ChapterDetail;