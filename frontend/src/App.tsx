// frontend/src/App.tsx
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './router/AppRoutes';
import './styles/global.css'; // More specific global styles

function App() {
  return (
    <React.StrictMode>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </React.StrictMode>
  );
}

export default App;