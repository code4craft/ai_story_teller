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
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
// import MonacoEditor from '@monaco-editor/react';
import storyService from '../services/storyService';
import characterService from '../services/characterService';
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

  const [form] = Form.useForm();

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
                  {voice && typeof voice === 'object' && voice.sample_audio?.url && (
                    <Button
                      type="link"
                      icon={<PlayCircleOutlined />}
                      onClick={() => playVoiceSample(voice)}
                      size="small"
                    >
                      试听
                    </Button>
                  )}
                  {!isMatched && (
                    <Select
                      placeholder="选择角色"
                      style={{ width: 120, marginLeft: 8 }}
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
                            {voice && typeof voice === 'object' && voice.sample_audio?.url && (
                              <Button
                                type="link"
                                icon={<PlayCircleOutlined />}
                                onClick={() => playVoiceSample(voice)}
                                size="small"
                              />
                            )}
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
    </div>
  );
};

export default ChapterDetail;