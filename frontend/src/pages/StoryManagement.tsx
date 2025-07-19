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
  Tooltip,
  Popconfirm,
  List,
  Badge,
  Empty,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  BookOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import storyService, { CreateStoryData, CreateChapterData } from '../services/storyService';
import { StorySeries, Chapter } from '../types/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const StoryManagement: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<StorySeries | null>(null);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
  const [isChapterModalVisible, setIsChapterModalVisible] = useState(false);
  const [editingStory, setEditingStory] = useState<StorySeries | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  
  const [storyForm] = Form.useForm();
  const [chapterForm] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 查询故事系列列表
  const { data: storiesData, isLoading: isLoadingStories } = useQuery(
    ['stories'],
    () => storyService.getStorySeries({ limit: 100 }),
    {
      refetchOnWindowFocus: false,
    }
  );

  // 查询选中故事的章节列表
  const { data: chaptersData, isLoading: isLoadingChapters, error: chaptersError } = useQuery(
    ['chapters', selectedStory?._id],
    () => selectedStory ? storyService.getChaptersByStory(selectedStory._id) : null,
    {
      enabled: !!selectedStory,
      refetchOnWindowFocus: false,
    }
  );

  // 创建故事系列
  const createStoryMutation = useMutation(storyService.createStorySeries, {
    onSuccess: () => {
      message.success('故事系列创建成功');
      queryClient.invalidateQueries(['stories']);
      setIsStoryModalVisible(false);
      storyForm.resetFields();
    },
  });

  // 更新故事系列
  const updateStoryMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CreateStoryData> }) =>
      storyService.updateStorySeries(id, data),
    {
      onSuccess: () => {
        message.success('故事系列更新成功');
        queryClient.invalidateQueries(['stories']);
        setIsStoryModalVisible(false);
        setEditingStory(null);
        storyForm.resetFields();
      },
    }
  );

  // 删除故事系列
  const deleteStoryMutation = useMutation(storyService.deleteStorySeries, {
    onSuccess: () => {
      message.success('故事系列删除成功');
      queryClient.invalidateQueries(['stories']);
      setSelectedStory(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '删除失败');
    },
  });

  // 创建章节
  const createChapterMutation = useMutation(storyService.createChapter, {
    onSuccess: () => {
      message.success('章节创建成功');
      queryClient.invalidateQueries(['chapters', selectedStory?._id]);
      setIsChapterModalVisible(false);
      chapterForm.resetFields();
    },
  });

  // 更新章节
  const updateChapterMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CreateChapterData> }) =>
      storyService.updateChapter(id, data),
    {
      onSuccess: () => {
        message.success('章节更新成功');
        queryClient.invalidateQueries(['chapters', selectedStory?._id]);
        setIsChapterModalVisible(false);
        setEditingChapter(null);
        chapterForm.resetFields();
      },
    }
  );

  // 删除章节
  const deleteChapterMutation = useMutation(storyService.deleteChapter, {
    onSuccess: () => {
      message.success('章节删除成功');
      queryClient.invalidateQueries(['chapters', selectedStory?._id]);
    },
  });

  // 处理创建故事系列
  const handleCreateStory = () => {
    setEditingStory(null);
    setIsStoryModalVisible(true);
    storyForm.resetFields();
  };

  // 处理编辑故事系列
  const handleEditStory = (story: StorySeries) => {
    setEditingStory(story);
    setIsStoryModalVisible(true);
    storyForm.setFieldsValue({
      title: story.title,
      description: story.description,
      order: story.order,
      status: story.status,
    });
  };

  // 处理提交故事表单
  const handleStorySubmit = async () => {
    try {
      const values = await storyForm.validateFields();
      
      if (editingStory) {
        updateStoryMutation.mutate({ id: editingStory._id, data: values });
      } else {
        createStoryMutation.mutate(values);
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 处理创建章节
  const handleCreateChapter = () => {
    if (!selectedStory) {
      message.warning('请先选择一个故事系列');
      return;
    }
    setEditingChapter(null);
    setIsChapterModalVisible(true);
    chapterForm.resetFields();
    chapterForm.setFieldsValue({
      story_series_id: selectedStory._id,
      order: (chaptersData?.data?.length || 0) + 1,
    });
  };

  // 处理编辑章节
  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    navigate(`/stories/${selectedStory?._id}/chapters/${chapter._id}`);
  };

  // 处理提交章节表单
  const handleChapterSubmit = async () => {
    try {
      const values = await chapterForm.validateFields();
      
      if (editingChapter) {
        updateChapterMutation.mutate({ id: editingChapter._id, data: values });
      } else {
        createChapterMutation.mutate({
          ...values,
          story_series_id: selectedStory!._id,
        });
      }
    } catch (error) {
      // 表单验证失败
    }
  };

  // 状态渲染
  const renderStatus = (status: string) => {
    const statusMap = {
      draft: { color: 'default', text: '草稿' },
      published: { color: 'success', text: '已发布' },
      archived: { color: 'warning', text: '已归档' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 故事系列列表项渲染
  const renderStoryItem = (story: StorySeries) => {
    const isSelected = selectedStory?._id === story._id;
    
    return (
      <List.Item
        key={story._id}
        className={isSelected ? 'selected-story' : ''}
        onClick={() => setSelectedStory(story)}
        style={{
          cursor: 'pointer',
          backgroundColor: isSelected ? '#f0f5ff' : undefined,
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 8,
        }}
        actions={[
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEditStory(story);
              }}
            />
          </Tooltip>,
          <Popconfirm
            title="确定要删除这个故事系列吗？"
            onConfirm={(e) => {
              e?.stopPropagation();
              deleteStoryMutation.mutate(story._id);
            }}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>,
        ]}
      >
        <List.Item.Meta
          title={
            <Space>
              {story.title}
              {renderStatus(story.status)}
              <Badge count={story.order} style={{ backgroundColor: '#52c41a' }} />
            </Space>
          }
          description={story.description || '暂无描述'}
        />
      </List.Item>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <BookOutlined style={{ marginRight: 8 }} />
          剧本创作
        </Title>
        <p className="page-description">
          管理故事系列和章节，编辑剧本内容
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* 左侧：故事系列列表 */}
        <Card
          title="故事系列"
          style={{ width: 400 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateStory}
            >
              新建系列
            </Button>
          }
        >
          <Spin spinning={isLoadingStories}>
            <List
              dataSource={storiesData?.data || []}
              renderItem={renderStoryItem}
              locale={{
                emptyText: <Empty description="暂无故事系列" />,
              }}
            />
          </Spin>
        </Card>

        {/* 右侧：章节列表 */}
        <Card
          title={
            selectedStory ? (
              <Space>
                <FileTextOutlined />
                {selectedStory.title} - 章节列表
              </Space>
            ) : (
              '章节列表'
            )
          }
          style={{ flex: 1 }}
          extra={
            selectedStory && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateChapter}
              >
                新建章节
              </Button>
            )
          }
        >
          {selectedStory ? (
            <Spin spinning={isLoadingChapters}>
              {chaptersError ? (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Text type="danger">加载章节失败</Text>
                </div>
              ) : (
                <Table
                  dataSource={chaptersData?.data && Array.isArray(chaptersData.data) ? chaptersData.data : []}
                  rowKey="_id"
                  pagination={false}
                columns={[
                  {
                    title: '序号',
                    dataIndex: 'order',
                    key: 'order',
                    width: 80,
                    render: (order: number) => <Badge count={order} />,
                  },
                  {
                    title: '章节标题',
                    dataIndex: 'title',
                    key: 'title',
                    render: (title: string) => <strong>{title}</strong>,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    width: 100,
                    render: (status: string) => (
                      <Tag color={status === 'published' ? 'success' : 'default'}>
                        {status === 'published' ? '已发布' : '草稿'}
                      </Tag>
                    ),
                  },
                  {
                    title: '角色数',
                    key: 'character_count',
                    width: 100,
                    render: (_: any, record: Chapter) => (
                      <Text>{record.characters_used?.length || 0} 个</Text>
                    ),
                  },
                  {
                    title: '更新时间',
                    dataIndex: 'updated_at',
                    key: 'updated_at',
                    width: 150,
                    render: (date: string) => new Date(date).toLocaleDateString(),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    width: 150,
                    render: (_: any, record: Chapter) => (
                      <Space size="small">
                        <Tooltip title="查看/编辑">
                          <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => handleEditChapter(record)}
                          >
                            编辑
                          </Button>
                        </Tooltip>
                        <Popconfirm
                          title="确定要删除这个章节吗？"
                          onConfirm={() => deleteChapterMutation.mutate(record._id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
                />
              )}
            </Spin>
          ) : (
            <Empty description="请选择一个故事系列查看章节" />
          )}
        </Card>
      </div>

      {/* 故事系列编辑对话框 */}
      <Modal
        title={editingStory ? '编辑故事系列' : '新建故事系列'}
        open={isStoryModalVisible}
        onOk={handleStorySubmit}
        onCancel={() => {
          setIsStoryModalVisible(false);
          setEditingStory(null);
          storyForm.resetFields();
        }}
        confirmLoading={createStoryMutation.isLoading || updateStoryMutation.isLoading}
      >
        <Form
          form={storyForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label="系列标题"
            rules={[{ required: true, message: '请输入系列标题' }]}
          >
            <Input placeholder="例如：西游记" />
          </Form.Item>

          <Form.Item name="description" label="系列描述">
            <TextArea rows={3} placeholder="简要描述这个故事系列" />
          </Form.Item>

          <Form.Item
            name="order"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
            initialValue={1}
          >
            <Input type="number" placeholder="数字越小越靠前" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue="draft"
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 章节创建对话框 */}
      <Modal
        title="新建章节"
        open={isChapterModalVisible}
        onOk={handleChapterSubmit}
        onCancel={() => {
          setIsChapterModalVisible(false);
          chapterForm.resetFields();
        }}
        confirmLoading={createChapterMutation.isLoading}
      >
        <Form
          form={chapterForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="title"
            label="章节标题"
            rules={[{ required: true, message: '请输入章节标题' }]}
          >
            <Input placeholder="例如：第一章 美猴王出世" />
          </Form.Item>

          <Form.Item
            name="order"
            label="章节序号"
            rules={[{ required: true, message: '请输入章节序号' }]}
          >
            <Input type="number" placeholder="章节的顺序" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            initialValue="draft"
          >
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">已发布</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="初始内容"
            rules={[{ required: true, message: '请输入初始内容' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="输入章节的初始内容，支持对话格式：&#10;旁白：很久很久以前...&#10;孙悟空：我是美猴王！" 
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default StoryManagement;