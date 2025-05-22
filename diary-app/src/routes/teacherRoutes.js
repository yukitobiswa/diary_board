import React from 'react';
import { Route } from 'react-router-dom';
import Teacher_login from '../components/Teacher_login';
import Teacher_startpage from '../components/Teacher_startpage';
import Teacher_newlogin from '../components/Teacher_newlogin';
import Teacher_page from '../components/Teacher_page';

const TeacherRoutes = () => (
  <>
    <Route path="/Teacher_login" element={<Teacher_login />} />
    <Route path="/Teacher_startpage" element={<Teacher_startpage />} />
    <Route path="/Teacher_newlogin" element={<Teacher_newlogin />} />
    <Route path="/Teacher_page" element={<Teacher_page />} />
  </>
);

export default TeacherRoutes; 