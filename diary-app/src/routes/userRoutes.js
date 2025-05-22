import React from 'react';
import { Route } from 'react-router-dom';
import Login from '../components/Login';
import NewLogin from '../components/newlogin';
import Setting from '../components/Setting';
import Group from '../components/Group';
import TeamSetting from '../components/team_set';
import ResetPassword from '../components/reset_password';
import Member from '../components/member';

const UserRoutes = () => (
  <>
    <Route path="/login" element={<Login />} />
    <Route path="/newlogin" element={<NewLogin />} />
    <Route path="/Setting" element={<Setting />} />
    <Route path="/register" element={<Group />} />
    <Route path="/reset_password" element={<ResetPassword />} />
    <Route path="/team_set" element={<TeamSetting />} />
    <Route path="/member" element={<Member />} />
  </>
);

export default UserRoutes; 