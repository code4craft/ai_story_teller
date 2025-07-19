import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  SoundOutlined,
  TeamOutlined,
  BookOutlined,
  SyncOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/voices',
      icon: <SoundOutlined />,
      label: '音色管理',
    },
    {
      key: '/characters',
      icon: <TeamOutlined />,
      label: '角色管理',
    },
    {
      key: '/stories',
      icon: <BookOutlined />,
      label: '剧本创作',
    },
    {
      key: '/conversions',
      icon: <SyncOutlined />,
      label: '语音转换',
    },
  ];

  const handleMenuClick = (e: any) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div 
          style={{ 
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            color: token.colorPrimary,
          }}
        >
          {collapsed ? 'AI' : 'AI故事讲述器'}
        </div>
        
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header 
          style={{ 
            padding: '0 16px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 32,
              height: 32,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              color: token.colorText,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = token.colorBgTextHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          
          <div style={{ marginLeft: 16, fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '页面'}
          </div>
        </Header>
        
        {children}
      </Layout>
    </Layout>
  );
};

export default AppLayout;