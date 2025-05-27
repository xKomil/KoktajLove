// frontend/src/App.tsx

import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './router/AppRoutes';
import './styles/global.css'; // More specific global styles

function App() {
  return (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
  );
}

export default App;