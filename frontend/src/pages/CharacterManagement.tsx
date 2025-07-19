import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Card,
  Typography,
  Checkbox,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  EditOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import characterService, { CreateCharacterData } from '../services/characterService';
import voiceService from '../services/voiceService';
import { Character, Voice } from '../types/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CharacterManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedStorySeries, setSelectedStorySeries] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);
  
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 查询角色列表
  const { data: charactersData, isLoading } = useQuery(
    ['characters', searchText, selectedGender, selectedStorySeries, selectedCategory, currentPage, pageSize],
    () => {
      // 如果有搜索文本，使用搜索API
      if (searchText && searchText.trim()) {
        return characterService.searchCharacters({
          q: searchText,
          gender: selectedGender || undefined,
          story_series: selectedStorySeries || undefined,
          category: selectedCategory || undefined,
          page: currentPage,
          limit: pageSize,
        });
      } else {
        // 否则使用普通列表API
        return characterService.getCharacters({
          gender: selectedGender || undefined,
          story_series: selectedStorySeries || undefined,
          category: selectedCategory || undefined,
          page: currentPage,
          limit: pageSize,
        });
      }
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询音色列表（用于下拉选择）
  const { data: voicesData } = useQuery(
    ['voices-for-character'],
    () => voiceService.getVoices({ limit: 1000 }),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询故事系列列表
  const { data: storySeries } = useQuery(
    ['character-story-series'],
    () => characterService.getStorySeries(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询角色分类列表
  const { data: categories } = useQuery(
    ['character-categories'],
    () => characterService.getCategories(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 创建角色
  const createMutation = useMutation(characterService.createCharacter, {
    onSuccess: () => {
      message.success('角色创建成功');
      queryClient.invalidateQueries(['characters']);
      setIsModalVisible(false);
      form.resetFields();
    },
  });

  // 更新角色
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CreateCharacterData> }) =>
      characterService.updateCharacter(id, data),
    {
      onSuccess: () => {
        message.success('角色更新成功');
        queryClient.invalidateQueries(['characters']);
        setIsModalVisible(false);
        setEditingCharacter(null);
        form.resetFields();
      },
    }
  );

  const handleCreate = () => {
    setEditingCharacter(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (record: Character) => {
    setEditingCharacter(record);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...record,
      voice_id: typeof record.voice_id === 'object' ? record.voice_id._id : record.voice_id,
    });
  };

  const handleDetail = (record: Character) => {
    setViewingCharacter(record);
    setDetailModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCharacter) {
        updateMutation.mutate({ id: editingCharacter._id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理表格分页、排序、过滤变化
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // 处理搜索条件改变时重置到第一页
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleGenderChange = (value: string) => {
    setSelectedGender(value);
    setCurrentPage(1);
  };

  const handleStorySeriesChange = (value: string) => {
    setSelectedStorySeries(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
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

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => {
        const colorMap = { 
          male: 'blue', 
          female: 'pink', 
          mixed: 'purple',
          neutral: 'default' 
        };
        const textMap = { 
          male: '男', 
          female: '女', 
          mixed: '混合',
          neutral: '中性' 
        };
        return <Tag color={colorMap[gender as keyof typeof colorMap]}>{textMap[gender as keyof typeof textMap]}</Tag>;
      },
    },
    {
      title: '年龄类型',
      dataIndex: 'age_type',
      key: 'age_type',
      width: 100,
    },
    {
      title: '配音',
      key: 'voice',
      width: 150,
      render: (_: any, record: Character) => {
        const voice = record.voice_id as Voice;
        if (voice && typeof voice === 'object') {
          return (
            <Space size="small">
              <span>{voice.name}</span>
              {voice.sample_audio?.url && (
                <Button
                  type="link"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => playVoiceSample(voice)}
                  title="试听音色样本"
                />
              )}
            </Space>
          );
        }
        return <span style={{ color: '#999' }}>未配置</span>;
      },
    },
    {
      title: '性格特点',
      dataIndex: 'personality',
      key: 'personality',
      render: (personality: string[]) => (
        <Space size={4} wrap>
          {personality?.map((trait, index) => (
            <Tag key={index}>{trait}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '故事系列',
      dataIndex: 'story_series',
      key: 'story_series',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: Character) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <TeamOutlined style={{ marginRight: 8 }} />
          角色管理
        </Title>
        <p className="page-description">
          管理故事中的角色配置和对应的音色设置
        </p>
      </div>

      <Card className="custom-card">
        <div className="toolbar">
          <div className="toolbar-left">
            <Input
              placeholder="搜索角色名称、描述、性格特点"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="选择性别"
              value={selectedGender}
              onChange={handleGenderChange}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="mixed">混合</Option>
              <Option value="neutral">中性</Option>
            </Select>
            <Select
              placeholder="选择故事系列"
              value={selectedStorySeries}
              onChange={handleStorySeriesChange}
              style={{ width: 160 }}
              allowClear
            >
              {storySeries?.map(series => (
                <Option key={series} value={series}>{series}</Option>
              ))}
            </Select>
            <Select
              placeholder="选择分类"
              value={selectedCategory}
              onChange={handleCategoryChange}
              style={{ width: 140 }}
              allowClear
            >
              {categories?.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </div>
          <div className="toolbar-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              添加角色
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={charactersData?.data || []}
          rowKey="_id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            total: charactersData?.pagination?.total || 0,
            pageSize: pageSize,
            current: currentPage,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 创建/编辑角色对话框 */}
      <Modal
        title={editingCharacter ? '编辑角色' : '添加角色'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingCharacter(null);
          form.resetFields();
        }}
        confirmLoading={createMutation.isLoading || updateMutation.isLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="例如：大宝、猪爸爸" />
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
            <Input placeholder="例如：child、adult、elderly" />
          </Form.Item>

          <Form.Item
            name="voice_id"
            label="配音音色"
            rules={[{ required: true, message: '请选择配音音色' }]}
          >
            <Select 
              placeholder="选择音色"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
              optionRender={(option) => {
                const voice = voicesData?.data?.find(v => v._id === option.value);
                if (!voice) return <span>{option.label}</span>;
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{voice.name} ({voice.voice_id})</span>
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
                );
              }}
            >
              {voicesData?.data?.map(voice => (
                <Option key={voice._id} value={voice._id}>
                  {voice.name} ({voice.voice_id})
                </Option>
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

          <Form.Item name="story_series" label="故事系列">
            <Input placeholder="例如：三只小猪、零食星球" />
          </Form.Item>

          <Form.Item name="category" label="角色分类">
            <Input placeholder="例如：主角、配角、反派" />
          </Form.Item>

          <Form.Item name="description" label="角色描述">
            <TextArea rows={3} placeholder="详细描述角色的背景、特征等" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色详情对话框 */}
      <Modal
        title="角色详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setViewingCharacter(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {viewingCharacter && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="角色名称" span={2}>
              <strong>{viewingCharacter.name}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="性别">
              <Tag color={
                viewingCharacter.gender === 'male' ? 'blue' : 
                viewingCharacter.gender === 'female' ? 'pink' : 
                viewingCharacter.gender === 'mixed' ? 'purple' : 'default'
              }>
                {{
                  male: '男',
                  female: '女', 
                  mixed: '混合',
                  neutral: '中性'
                }[viewingCharacter.gender]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="年龄类型">
              {viewingCharacter.age_type}
            </Descriptions.Item>
            <Descriptions.Item label="配音音色" span={2}>
              {typeof viewingCharacter.voice_id === 'object' ? (
                <Space>
                  <span>{viewingCharacter.voice_id.name}</span>
                  <span style={{ color: '#666' }}>({viewingCharacter.voice_id.voice_id})</span>
                  {viewingCharacter.voice_id.sample_audio?.url && (
                    <Button
                      type="link"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => playVoiceSample(viewingCharacter.voice_id as Voice)}
                    >
                      试听样本
                    </Button>
                  )}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>未配置</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="性格特点" span={2}>
              <Space size={4} wrap>
                {viewingCharacter.personality?.map((trait, index) => (
                  <Tag key={index}>{trait}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="故事系列">
              {viewingCharacter.story_series || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="角色分类">
              {viewingCharacter.category || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="角色描述" span={2}>
              {viewingCharacter.description || '暂无描述'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(viewingCharacter.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(viewingCharacter.updated_at).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CharacterManagement;