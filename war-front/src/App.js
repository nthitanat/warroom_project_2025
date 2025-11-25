import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute/PrivateRoute';
import Navbar from './components/common/Navbar/Navbar';

// Pages
import Home from './pages/Home/Home';
import SignIn from './pages/SignIn/SignIn';
import SignUp from './pages/SignUp/SignUp';
import Analytics from './pages/Analytics/Analytics';
import Charities from './pages/Charities/Charities';
import CharityDetail from './pages/CharityDetail/CharityDetail';
import Lessons from './pages/Lessons/Lessons';
import LessonsPM from './pages/LessonsPM/LessonsPM';
import WarRoom from './pages/WarRoom/WarRoom';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import Unauthorized from './pages/Unauthorized/Unauthorized';

import './App.scss';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Public Routes - No Authentication Required */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/charities" element={<Charities />} />
            <Route path="/charity/:id" element={<CharityDetail />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/lessons-pm" element={<LessonsPM />} />
            <Route path="/warroom" element={<WarRoom />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute adminOnly>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
