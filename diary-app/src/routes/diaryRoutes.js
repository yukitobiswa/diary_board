import React from 'react';
import { Route } from 'react-router-dom';
import Question1 from '../components/Question1';
import Question2 from '../components/Question2';
import Question3 from '../components/Question3';
import Question4 from '../components/Question4';
import Question5 from '../components/Question5';
import Answer1 from '../components/Answer1';
import Answer2 from '../components/Answer2';
import Answer3 from '../components/Answer3';
import Answer4 from '../components/Answer4';
import Answer5 from '../components/Answer5';
import Result from '../components/Result';
import Diary_and_Quiz from '../components/Diary_and_Quiz';

const DiaryRoutes = () => (
  <>
    <Route path="/Question1/:diaryId" element={<Question1 />} />
    <Route path="/Question2/:diaryId" element={<Question2 />} />
    <Route path="/Question3/:diaryId" element={<Question3 />} />
    <Route path="/Question4/:diaryId" element={<Question4 />} />
    <Route path="/Question5/:diaryId" element={<Question5 />} />
    <Route path="/Answer1/:diaryId" element={<Answer1 />} />
    <Route path="/Answer2/:diaryId" element={<Answer2 />} />
    <Route path="/Answer3/:diaryId" element={<Answer3 />} />
    <Route path="/Answer4/:diaryId" element={<Answer4 />} />
    <Route path="/Answer5/:diaryId" element={<Answer5 />} />
    <Route path="/Result/:diaryId" element={<Result />} />
    <Route path="/Diary_and_Quiz/:user_id" element={<Diary_and_Quiz />} />
  </>
);

export default DiaryRoutes; 