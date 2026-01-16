import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Statistics from './pages/Statistics';
import StudyHours from './pages/StudyHours';
import PrivateRoute from './utils/PrivateRoute';
import { PomodoroProvider } from './contexts/PomodoroContext';
import FloatingTimer from './components/FloatingTimer';
import TopNavigation from './components/TopNavigation';
import { authService } from './services/auth';
import { notificationService } from './services/notifications';
import './App.css';

function App() {
  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      // Solicitar permissão de notificações
      notificationService.requestPermission();
      
      // Verificar inatividade
      notificationService.checkInactivity();
      
      // Atualizar último acesso
      notificationService.updateLastAccess();
    }
  }, []);

  return (
    <PomodoroProvider>
      <Router>
        {authService.isAuthenticated() && <TopNavigation />}
        <Routes>
        <Route
          path="/login"
          element={
            authService.isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            authService.isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <Statistics />
            </PrivateRoute>
          }
        />
        <Route
          path="/study-hours"
          element={
            <PrivateRoute>
              <StudyHours />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {authService.isAuthenticated() && <FloatingTimer />}
    </Router>
    </PomodoroProvider>
  );
}

export default App;
