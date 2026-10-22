import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Jobs from './pages/Jobs';
import Projects from './pages/Projects';
import Auth from './pages/Auth';
import UniverseLanding from './pages/UniverseLanding';
import PreOrder from './pages/PreOrder';
import apiClient from './services/api';
import './i18n/config';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#22d3ee' },
    secondary: { main: '#8b5cf6' },
    background: { default: '#04060f', paper: '#0b1026' },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (apiClient.getToken()) return <>{children}</>;
  const redirect = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?redirect=${redirect}`} replace />;
}

function AppRoutes() {
  const location = useLocation();
  const isPublicSurface = location.pathname === '/' || location.pathname === '/preorder';

  return (
    <>
      {!isPublicSurface && <Navbar />}
      <Routes>
        <Route path="/" element={<UniverseLanding />} />
        <Route path="/preorder" element={<PreOrder />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    setIsLoading(false);
  }, [i18n]);

  if (isLoading) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
