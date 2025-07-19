import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Typography,
  Progress,
  Tooltip,
  Popconfirm,
  DatePicker,
  Badge,
  Alert,
  Row,
  Col,
  Statistic,
  Descriptions,
} from 'antd';
import {
  SyncOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  DownloadOutlined,
  StopOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import conversionService, { CreateConversionTaskData } from '../services/conversionService';
import storyService from '../services/storyService';
import { ConversionTask, Chapter, StorySeries } from '../types/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ConversionTasks: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | ''>('');
  const [selectedType, setSelectedType] = useState<'chapter' | 'dialogue' | ''>('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewingTask, setViewingTask] = useState<ConversionTask | null>(null);
  
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 查询转换任务列表
  const { data: tasksData, isLoading } = useQuery(
    ['conversion-tasks', currentPage, pageSize, selectedStatus, selectedType],
    () => conversionService.getConversionTasks({
      page: currentPage,
      limit: pageSize,
      status: selectedStatus === '' ? undefined : selectedStatus,
      type: selectedType === '' ? undefined : selectedType,
    }),
    {
      refetchOnWindowFocus: false,
      refetchInterval: 5000, // 每5秒自动刷新一次以更新进度
    }
  );

  // 查询所有故事系列（用于创建转换任务时选择章节）
  const { data: storiesData } = useQuery(
    ['stories-for-conversion'],
    () => storyService.getStorySeries({ limit: 1000 }),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询选中故事系列的章节
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const { data: chaptersData } = useQuery(
    ['chapters-for-conversion', selectedStoryId],
    () => selectedStoryId ? storyService.getChaptersByStory(selectedStoryId) : null,
    {
      enabled: !!selectedStoryId,
      refetchOnWindowFocus: false,
    }
  );

  // 创建转换任务
  const createTaskMutation = useMutation(conversionService.createConversionTask, {
    onSuccess: () => {
      message.success('转换任务创建成功');
      queryClient.invalidateQueries(['conversion-tasks']);
      setIsCreateModalVisible(false);
      form.resetFields();
      setSelectedStoryId('');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建转换任务失败');
    },
  });

  // 启动转换任务
  const startTaskMutation = useMutation(conversionService.startConversionTask, {
    onSuccess: () => {
      message.success('转换任务已启动');
      queryClient.invalidateQueries(['conversion-tasks']);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '启动转换任务失败');
    },
  });

  // 取消转换任务
  const cancelTaskMutation = useMutation(conversionService.cancelConversionTask, {
    onSuccess: () => {
      message.success('转换任务已取消');
      queryClient.invalidateQueries(['conversion-tasks']);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '取消转换任务失败');
    },
  });

  // 删除转换任务
  const deleteTaskMutation = useMutation(conversionService.deleteConversionTask, {
    onSuccess: () => {
      message.success('转换任务已删除');
      queryClient.invalidateQueries(['conversion-tasks']);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除转换任务失败');
    },
  });

  // 处理创建转换任务
  const handleCreate = () => {
    setIsCreateModalVisible(true);
    form.resetFields();
    setSelectedStoryId('');
  };

  // 处理查看详情
  const handleDetail = (record: ConversionTask) => {
    setViewingTask(record);
    setDetailModalVisible(true);
  };

  // 处理提交创建表单
  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      createTaskMutation.mutate(values);
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理表格变化
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // 渲染状态标签
  const renderStatus = (status: string) => {
    const statusConfig = {
      pending: { color: 'default', text: '等待中', icon: <ClockCircleOutlined /> },
      processing: { color: 'processing', text: '处理中', icon: <SyncOutlined spin /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '失败', icon: <ExclamationCircleOutlined /> },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 渲染类型标签
  const renderType = (type: string) => {
    const typeConfig = {
      chapter: { color: 'blue', text: '章节转换' },
      dialogue: { color: 'orange', text: '对话转换' },
    };
    const config = typeConfig[type as keyof typeof typeConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 渲染进度条
  const renderProgress = (progress: number, status: string) => {
    const getProgressStatus = () => {
      if (status === 'completed') return 'success';
      if (status === 'failed') return 'exception';
      if (status === 'processing') return 'active';
      return 'normal';
    };

    return (
      <Progress
        percent={progress}
        size="small"
        status={getProgressStatus()}
        showInfo={progress > 0}
      />
    );
  };

  // 获取统计数据
  const getStats = () => {
    const tasks = tasksData?.data || [];
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  };

  const stats = getStats();

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id: string) => (
        <Text code style={{ fontSize: '12px' }}>
          {id.slice(-8)}
        </Text>
      ),
    },
    {
      title: '章节',
      dataIndex: 'chapter_id',
      key: 'chapter',
      render: (chapter: Chapter) => (
        <div>
          <Text strong>{chapter.title}</Text>
          {typeof chapter.story_series_id === 'object' && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {(chapter.story_series_id as StorySeries).title}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: renderType,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: renderStatus,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record: ConversionTask) => 
        renderProgress(progress, record.status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ConversionTask) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleDetail(record)}
            />
          </Tooltip>
          
          {record.status === 'pending' && (
            <Tooltip title="启动任务">
              <Button
                type="link"
                icon={<PlayCircleOutlined />}
                onClick={() => startTaskMutation.mutate(record._id)}
                loading={startTaskMutation.isLoading}
              />
            </Tooltip>
          )}
          
          {(record.status === 'pending' || record.status === 'processing') && (
            <Tooltip title="取消任务">
              <Popconfirm
                title="确定要取消这个任务吗？"
                onConfirm={() => cancelTaskMutation.mutate(record._id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<StopOutlined />}
                  danger
                  loading={cancelTaskMutation.isLoading}
                />
              </Popconfirm>
            </Tooltip>
          )}
          
          {record.status === 'completed' && record.output_file_path && (
            <Tooltip title="下载音频">
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => window.open(record.output_file_path, '_blank')}
              />
            </Tooltip>
          )}
          
          {record.status !== 'processing' && (
            <Tooltip title="删除任务">
              <Popconfirm
                title="确定要删除这个任务吗？"
                onConfirm={() => deleteTaskMutation.mutate(record._id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  icon={<DeleteOutlined />}
                  danger
                  loading={deleteTaskMutation.isLoading}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <SyncOutlined style={{ marginRight: 8 }} />
          语音转换
        </Title>
        <p className="page-description">
          将剧本转换为语音，管理转换任务
        </p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="等待中"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.processing}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="custom-card">
        <div className="toolbar">
          <div className="toolbar-left">
            <Select
              placeholder="状态筛选"
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="pending">等待中</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
            <Select
              placeholder="类型筛选"
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="chapter">章节转换</Option>
              <Option value="dialogue">对话转换</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries(['conversion-tasks'])}
            >
              刷新
            </Button>
          </div>
          <div className="toolbar-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建转换任务
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={tasksData?.data || []}
          rowKey="_id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            total: tasksData?.pagination?.total || 0,
            pageSize: pageSize,
            current: currentPage,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 创建转换任务对话框 */}
      <Modal
        title="创建转换任务"
        open={isCreateModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => {
          setIsCreateModalVisible(false);
          form.resetFields();
          setSelectedStoryId('');
        }}
        confirmLoading={createTaskMutation.isLoading}
        width={600}
      >
        <Alert
          message="注意"
          description="转换任务将根据章节内容和角色配音生成语音文件。请确保章节已完成角色配置。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="选择故事系列"
          >
            <Select
              placeholder="先选择故事系列"
              value={selectedStoryId}
              onChange={(value) => {
                setSelectedStoryId(value);
                form.setFieldsValue({ chapter_id: undefined }); // 清空章节选择
              }}
              showSearch
            >
              {storiesData?.data?.map(story => (
                <Option key={story._id} value={story._id}>
                  {story.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="chapter_id"
            label="选择章节"
            rules={[{ required: true, message: '请选择要转换的章节' }]}
          >
            <Select 
              placeholder={selectedStoryId ? "选择章节" : "请先选择故事系列"}
              disabled={!selectedStoryId}
              showSearch
            >
              {chaptersData?.data?.map(chapter => (
                <Option key={chapter._id} value={chapter._id}>
                  {chapter.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="type"
            label="转换类型"
            rules={[{ required: true, message: '请选择转换类型' }]}
            initialValue="chapter"
          >
            <Select>
              <Option value="chapter">章节转换</Option>
              <Option value="dialogue">对话转换</Option>
            </Select>
          </Form.Item>

          <Form.Item label="语音设置">
            <Input.Group>
              <Row gutter={8}>
                <Col span={8}>
                  <Form.Item
                    name={['settings', 'voice_speed']}
                    label="语速"
                    initialValue={1.0}
                  >
                    <Input type="number" min={0.5} max={2.0} step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={['settings', 'voice_volume']}
                    label="音量"
                    initialValue={1.0}
                  >
                    <Input type="number" min={0.1} max={2.0} step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name={['settings', 'voice_pitch']}
                    label="音调"
                    initialValue={1.0}
                  >
                    <Input type="number" min={0.5} max={2.0} step={0.1} />
                  </Form.Item>
                </Col>
              </Row>
            </Input.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情对话框 */}
      <Modal
        title="转换任务详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setViewingTask(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewingTask && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="任务ID" span={2}>
              <Text code>{viewingTask._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="章节">
              {typeof viewingTask.chapter_id === 'object' ? 
                viewingTask.chapter_id.title : 
                viewingTask.chapter_id}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {renderType(viewingTask.type)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {renderStatus(viewingTask.status)}
            </Descriptions.Item>
            <Descriptions.Item label="进度">
              {renderProgress(viewingTask.progress, viewingTask.status)}
            </Descriptions.Item>
            <Descriptions.Item label="语音设置" span={2}>
              <Space>
                <Text>语速: {viewingTask.settings.voice_speed}</Text>
                <Text>音量: {viewingTask.settings.voice_volume}</Text>
                <Text>音调: {viewingTask.settings.voice_pitch}</Text>
              </Space>
            </Descriptions.Item>
            {viewingTask.output_file_path && (
              <Descriptions.Item label="输出文件" span={2}>
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(viewingTask.output_file_path!, '_blank')}
                >
                  下载音频文件
                </Button>
              </Descriptions.Item>
            )}
            {viewingTask.error_message && (
              <Descriptions.Item label="错误信息" span={2}>
                <Text type="danger">{viewingTask.error_message}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {dayjs(viewingTask.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(viewingTask.updated_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {viewingTask.completed_at && (
              <Descriptions.Item label="完成时间" span={2}>
                {dayjs(viewingTask.completed_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ConversionTasks;