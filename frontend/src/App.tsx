import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';

import AppLayout from './components/Layout/AppLayout';
import VoiceManagement from './pages/VoiceManagement';
import CharacterManagement from './pages/CharacterManagement';
import StoryManagement from './pages/StoryManagement';
import ChapterDetail from './pages/ChapterDetail';
import ConversionTasks from './pages/ConversionTasks';
import Dashboard from './pages/Dashboard';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <AppLayout>
      <Content style={{ margin: 0 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/voices" element={<VoiceManagement />} />
          <Route path="/characters" element={<CharacterManagement />} />
          <Route path="/stories" element={<StoryManagement />} />
          <Route path="/stories/:seriesId/chapters/:chapterId" element={<ChapterDetail />} />
          <Route path="/conversions" element={<ConversionTasks />} />
        </Routes>
      </Content>
    </AppLayout>
  );
};

export default App;