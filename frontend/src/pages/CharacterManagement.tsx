import React from 'react';
import { Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

const { Title } = Typography;

const CharacterManagement: React.FC = () => {
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
      
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <TeamOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
        <p style={{ marginTop: 16, color: '#999' }}>角色管理功能开发中...</p>
      </div>
    </div>
  );
};

export default CharacterManagement;