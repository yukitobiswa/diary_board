import React from 'react';
import DiaryRoutes from './diaryRoutes';
import QuizRoutes from './quizRoutes';
import UserRoutes from './userRoutes';
import TeacherRoutes from './teacherRoutes';
import OtherRoutes from './otherRoutes';

const AppRoutes = () => (
  <>
    <OtherRoutes />
    <DiaryRoutes />
    <QuizRoutes />
    <UserRoutes />
    <TeacherRoutes />
  </>
);

export default AppRoutes; 