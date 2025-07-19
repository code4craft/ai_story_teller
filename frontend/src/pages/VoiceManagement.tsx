import React, { useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  EditOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import voiceService, { CreateVoiceData, TestVoiceData } from '../services/voiceService';
import { Voice } from '../types/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const VoiceManagement: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedAgeType, setSelectedAgeType] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testingVoice, setTestingVoice] = useState<Voice | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [saveSample, setSaveSample] = useState(false);
  
  // 获取后端服务器URL
  const getBackendUrl = () => {
    return process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001';
  };
  
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();
  const queryClient = useQueryClient();

  // 查询音色列表
  const { data: voicesData, isLoading } = useQuery(
    ['voices', searchText, selectedGender, selectedAgeType, currentPage, pageSize],
    () => {
      // 如果有搜索文本，使用搜索API
      if (searchText && searchText.trim()) {
        return voiceService.searchVoices({
          q: searchText,
          gender: selectedGender || undefined,
          age_type: selectedAgeType || undefined,
          page: currentPage,
          limit: pageSize,
        });
      } else {
        // 否则使用普通列表API
        return voiceService.getVoices({
          gender: selectedGender || undefined,
          age_type: selectedAgeType || undefined,
          page: currentPage,
          limit: pageSize,
        });
      }
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // 创建音色
  const createMutation = useMutation(voiceService.createVoice, {
    onSuccess: () => {
      message.success('音色创建成功');
      queryClient.invalidateQueries(['voices']);
      setIsModalVisible(false);
      form.resetFields();
    },
  });

  // 更新音色
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CreateVoiceData> }) =>
      voiceService.updateVoice(id, data),
    {
      onSuccess: () => {
        message.success('音色更新成功');
        queryClient.invalidateQueries(['voices']);
        setIsModalVisible(false);
        setEditingVoice(null);
        form.resetFields();
      },
    }
  );


  // 测试音色
  const testMutation = useMutation(
    ({ id, data }: { id: string; data: TestVoiceData }) =>
      voiceService.testVoice(id, data),
    {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        message.success('音频生成成功');
        
        // 如果保存了样本，刷新列表
        if (saveSample) {
          queryClient.invalidateQueries(['voices']);
          message.success('音色样本已保存');
        }
      },
    }
  );

  const handleCreate = () => {
    setEditingVoice(null);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (record: Voice) => {
    setEditingVoice(record);
    setIsModalVisible(true);
    form.setFieldsValue(record);
  };


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingVoice) {
        updateMutation.mutate({ id: editingVoice._id, data: values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  const handleTest = (record: Voice) => {
    setTestingVoice(record);
    setTestModalVisible(true);
    setAudioUrl('');
    setSaveSample(false);
    testForm.setFieldsValue({ text: '你好，这是音色测试。' });
  };

  const handleTestSubmit = async () => {
    if (!testingVoice) return;
    
    try {
      const values = await testForm.validateFields();
      testMutation.mutate({ 
        id: testingVoice._id, 
        data: { ...values, save_sample: saveSample }
      });
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

  const handleAgeTypeChange = (value: string) => {
    setSelectedAgeType(value);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: '音色ID',
      dataIndex: 'voice_id',
      key: 'voice_id',
      width: 200,
      ellipsis: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender: string) => {
        const colorMap = { male: 'blue', female: 'pink', neutral: 'default' };
        const textMap = { male: '男', female: '女', neutral: '中性' };
        return <Tag color={colorMap[gender as keyof typeof colorMap]}>{textMap[gender as keyof typeof textMap]}</Tag>;
      },
    },
    {
      title: '年龄类型',
      dataIndex: 'age_type',
      key: 'age_type',
      width: 100,
      render: (ageType: string) => {
        const textMap = {
          child: '儿童',
          young_adult: '青年',
          adult: '成人',
          middle_aged: '中年',
          elderly: '老年',
          divine: '神圣',
          narrator: '旁白',
        };
        return textMap[ageType as keyof typeof textMap] || ageType;
      },
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      width: 100,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '样本试听',
      key: 'sample_audio',
      width: 80,
      render: (_: any, record: Voice) => {
        console.log('音色记录:', record.name, 'sample_audio:', record.sample_audio);
        
        if (record.sample_audio?.url) {
          return (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                if (!record.sample_audio?.url) {
                  message.error('音频URL不存在');
                  return;
                }
                const audioUrl = `${getBackendUrl()}${record.sample_audio.url}`;
                console.log('尝试播放音频:', audioUrl);
                const audio = new Audio(audioUrl);
                audio.play().catch((error) => {
                  console.error('音频播放失败:', error);
                  message.error('音频播放失败，请检查文件是否存在');
                });
              }}
            >
              播放
            </Button>
          );
        }
        return <span style={{ color: '#999' }}>无样本</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: Voice) => (
        <Space size="small">
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTest(record)}
          >
            测试
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
          <SoundOutlined style={{ marginRight: 8 }} />
          音色管理
        </Title>
        <p className="page-description">
          管理AI语音合成使用的音色，支持试听和测试功能
        </p>
      </div>

      <Card className="custom-card">
        <div className="toolbar">
          <div className="toolbar-left">
            <Input
              placeholder="搜索音色名称或ID"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: 250 }}
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
              <Option value="neutral">中性</Option>
            </Select>
            <Select
              placeholder="选择年龄类型"
              value={selectedAgeType}
              onChange={handleAgeTypeChange}
              style={{ width: 140 }}
              allowClear
            >
              <Option value="child">儿童</Option>
              <Option value="young_adult">青年</Option>
              <Option value="adult">成人</Option>
              <Option value="middle_aged">中年</Option>
              <Option value="elderly">老年</Option>
              <Option value="divine">神圣</Option>
              <Option value="narrator">旁白</Option>
            </Select>
          </div>
          <div className="toolbar-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              添加音色
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={voicesData?.data || []}
          rowKey="_id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            total: voicesData?.pagination?.total || 0,
            pageSize: pageSize,
            current: currentPage,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 创建/编辑音色对话框 */}
      <Modal
        title={editingVoice ? '编辑音色' : '添加音色'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingVoice(null);
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
            name="voice_id"
            label="音色ID"
            rules={[{ required: true, message: '请输入音色ID' }]}
          >
            <Input placeholder="例如：zh_male_dongfanghaoran_moon_bigtts" />
          </Form.Item>

          <Form.Item
            name="name"
            label="音色名称"
            rules={[{ required: true, message: '请输入音色名称' }]}
          >
            <Input placeholder="例如：东方豪然" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="选择性别">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="neutral">中性</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="age_type"
            label="年龄类型"
            rules={[{ required: true, message: '请选择年龄类型' }]}
          >
            <Select placeholder="选择年龄类型">
              <Option value="child">儿童</Option>
              <Option value="young_adult">青年</Option>
              <Option value="adult">成人</Option>
              <Option value="middle_aged">中年</Option>
              <Option value="elderly">老年</Option>
              <Option value="divine">神圣</Option>
              <Option value="narrator">旁白</Option>
            </Select>
          </Form.Item>

          <Form.Item name="style" label="音色风格">
            <Input placeholder="例如：温和、威严、活泼" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="音色的详细描述" />
          </Form.Item>

          <Form.Item name="language" label="语言" initialValue="zh">
            <Select>
              <Option value="zh">中文</Option>
              <Option value="en">英文</Option>
            </Select>
          </Form.Item>

          <Form.Item name="provider" label="提供商" initialValue="volcengine">
            <Select>
              <Option value="volcengine">火山引擎</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 测试音色对话框 */}
      <Modal
        title={`测试音色 - ${testingVoice?.name}`}
        open={testModalVisible}
        onOk={handleTestSubmit}
        onCancel={() => {
          setTestModalVisible(false);
          setTestingVoice(null);
          setAudioUrl('');
          setSaveSample(false);
          testForm.resetFields();
        }}
        confirmLoading={testMutation.isLoading}
        width={500}
      >
        <Form
          form={testForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="text"
            label="测试文本"
            rules={[{ required: true, message: '请输入测试文本' }]}
          >
            <TextArea
              rows={4}
              placeholder="输入要转换为语音的文本"
              maxLength={200}
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Checkbox
              checked={saveSample}
              onChange={(e) => setSaveSample(e.target.checked)}
            >
              保存为音色样本（将替换现有样本）
            </Checkbox>
          </Form.Item>
        </Form>

        {testingVoice?.sample_audio && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              当前样本文本：{testingVoice.sample_audio.text}
            </p>
            <div style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  if (!testingVoice.sample_audio?.url) {
                    message.error('样本音频URL不存在');
                    return;
                  }
                  const audioUrl = `${getBackendUrl()}${testingVoice.sample_audio.url}`;
                  console.log('尝试播放样本音频:', audioUrl);
                  const audio = new Audio(audioUrl);
                  audio.play().catch((error) => {
                    console.error('样本音频播放失败:', error);
                    message.error('样本音频播放失败，请检查文件是否存在');
                  });
                }}
              >
                播放当前样本
              </Button>
            </div>
          </div>
        )}

        {audioUrl && (
          <div style={{ marginTop: 16 }}>
            <p>生成的音频：</p>
            <audio controls style={{ width: '100%' }}>
              <source src={audioUrl} type="audio/mpeg" />
              您的浏览器不支持音频播放。
            </audio>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VoiceManagement;