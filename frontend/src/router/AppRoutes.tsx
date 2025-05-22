// frontend/src/router/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import MainLayout from '@/components/layout/MainLayout/MainLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CocktailDetailPage from '@/pages/CocktailDetailPage';
import AddCocktailPage from '@/pages/AddCocktailPage';
import EditCocktailPage from '@/pages/EditCocktailPage';
import ProfilePage from '@/pages/ProfilePage';
import MyFavoritesPage from '@/pages/MyFavoritesPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected Route
import ProtectedRoute from './ProtectedRoute';

// A list of all available cocktails (could be same as HomePage or a dedicated page)
const AllCocktailsPage = () => <HomePage />; // Example: HomePage lists all public cocktails

const AppRoutes: React.FC = () => (
  <Routes>
    <Route element={<MainLayout />}>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/cocktails" element={<AllCocktailsPage />} /> {/* For a general cocktail listing */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cocktail/:cocktailId" element={<CocktailDetailPage />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/add-cocktail" element={<AddCocktailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* <Route path="/profile/edit" element={<EditProfilePage />} /> Placeholder */}
        <Route path="/my-favorites" element={<MyFavoritesPage />} />
        <Route path="/edit-cocktail/:cocktailId" element={<EditCocktailPage />} />
      </Route>

      {/* Not Found */}
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Route>
  </Routes>
);

export default AppRoutes;