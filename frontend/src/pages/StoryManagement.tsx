import React from 'react';
import { Typography } from 'antd';
import { BookOutlined } from '@ant-design/icons';

const { Title } = Typography;

const StoryManagement: React.FC = () => {
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
      
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <BookOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
        <p style={{ marginTop: 16, color: '#999' }}>剧本创作功能开发中...</p>
      </div>
    </div>
  );
};

export default StoryManagement;