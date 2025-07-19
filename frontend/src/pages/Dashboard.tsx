import React from 'react';
import { Card, Row, Col, Statistic, Typography, Divider } from 'antd';
import {
  SoundOutlined,
  TeamOutlined,
  BookOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          仪表板
        </Title>
        <Paragraph className="page-description">
          欢迎使用AI故事讲述器，这里是您的工作台总览
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="custom-card">
            <Statistic
              title="音色总数"
              value={23}
              prefix={<SoundOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="custom-card">
            <Statistic
              title="角色总数"
              value={156}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="custom-card">
            <Statistic
              title="故事系列"
              value={8}
              prefix={<BookOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="custom-card">
            <Statistic
              title="转换任务"
              value={42}
              prefix={<SyncOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        {/* 近期任务 */}
        <Col xs={24} lg={12}>
          <Card 
            title="近期转换任务" 
            className="custom-card"
            extra={<a href="/conversions">查看全部</a>}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>音乐之神的故事 - 第1章</span>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                已完成 • 2分钟前
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>零食星球 - 第3章</span>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                进行中 • 进度 68%
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span>神奇画笔 - 第2章</span>
                <ClockCircleOutlined style={{ color: '#faad14' }} />
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                等待中 • 队列第2位
              </div>
            </div>
          </Card>
        </Col>

        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card title="快速操作" className="custom-card">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable
                  style={{ textAlign: 'center', border: '1px dashed #d9d9d9' }}
                  onClick={() => window.location.href = '/voices'}
                >
                  <SoundOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                  <div>添加音色</div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable
                  style={{ textAlign: 'center', border: '1px dashed #d9d9d9' }}
                  onClick={() => window.location.href = '/characters'}
                >
                  <TeamOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                  <div>管理角色</div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable
                  style={{ textAlign: 'center', border: '1px dashed #d9d9d9' }}
                  onClick={() => window.location.href = '/stories'}
                >
                  <BookOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                  <div>创作剧本</div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card 
                  size="small" 
                  hoverable
                  style={{ textAlign: 'center', border: '1px dashed #d9d9d9' }}
                  onClick={() => window.location.href = '/conversions'}
                >
                  <SyncOutlined style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }} />
                  <div>语音转换</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;