import React from 'react';
import { Typography } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ConversionTasks: React.FC = () => {
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
      
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <SyncOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
        <p style={{ marginTop: 16, color: '#999' }}>语音转换功能开发中...</p>
      </div>
    </div>
  );
};

export default ConversionTasks;