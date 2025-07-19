import React from 'react';
import { Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ChapterDetail: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <FileTextOutlined style={{ marginRight: 8 }} />
          章节详情
        </Title>
        <p className="page-description">
          查看和编辑章节内容
        </p>
      </div>
      
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
        <p style={{ marginTop: 16, color: '#999' }}>章节详情功能开发中...</p>
      </div>
    </div>
  );
};

export default ChapterDetail;