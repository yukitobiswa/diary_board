import React from 'react';
import { Route } from 'react-router-dom';
import Quiz1 from '../components/Quiz1';
import Quiz2 from '../components/Quiz2';
import Quiz_log from '../components/Quiz _log';

const QuizRoutes = () => (
  <>
    <Route path="/Quiz1" element={<Quiz1 />} />
    <Route path="/Quiz2" element={<Quiz2 />} />
    <Route path="/Quiz_Log" element={<Quiz_log />} />
  </>
);

export default QuizRoutes; 