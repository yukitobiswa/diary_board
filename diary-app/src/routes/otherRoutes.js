import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ChatApp from '../components/Chat';
import Log from '../components/log';
import StartPage from '../components/StartPage';
import Ranking from '../components/Ranking';

const OtherRoutes = () => (
  <>
    {/* 初期ページを /StartPage にリダイレクト */}
    <Route path="/" element={<Navigate to="/StartPage" replace />} />
    <Route path="/StartPage" element={<StartPage />} />
    <Route path="/Chat" element={<ChatApp />} />
    <Route path="/log" element={<Log />} />
    <Route path="/Ranking" element={<Ranking />} />
  </>
);

export default OtherRoutes; 