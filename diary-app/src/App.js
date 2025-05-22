import React from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import AppRoutes from './routes'; // 新しいルートコンポーネントをインポート

// Main App Component
function App() {
  return (
    <Router basename="/diaryboard">
      <Routes>
        <AppRoutes /> {/* 集約されたルートコンポーネントを使用 */}
      </Routes>
    </Router>
  );
}

export default App;
