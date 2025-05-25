// frontend/src/router/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import MainLayout from '@/components/layout/MainLayout/MainLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CocktailsPage from '@/pages/CocktailsPage';
import CocktailDetailPage from '@/pages/CocktailDetailPage';
import AddCocktailPage from '@/pages/AddCocktailPage';
import EditCocktailPage from '@/pages/EditCocktailPage';
import ProfilePage from '@/pages/ProfilePage';
import MyFavoritesPage from '@/pages/MyFavoritesPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected Route
import ProtectedRoute from './ProtectedRoute';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<MainLayout />}>
      {/* Public Routes */}
      <Route index element={<HomePage />} /> {/* Landing page / business card */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="add-cocktail" element={<AddCocktailPage />} />
        <Route path="edit-cocktail/:id" element={<EditCocktailPage />} />
        <Route path="cocktails" element={<CocktailsPage />} />
        <Route path="cocktails/:id" element={<CocktailDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="favorites" element={<MyFavoritesPage />} />
      </Route>
      
      {/* Not Found */}
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Route>
  </Routes>
);

export default AppRoutes;