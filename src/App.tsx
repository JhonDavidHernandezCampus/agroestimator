import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { RegisterHarvest } from './pages/harvest/RegisterHarvest';
import { History } from './pages/history/History';
import { HarvestDetail } from './pages/harvest/HarvestDetail';
import { Vehicles } from './pages/vehicles/Vehicles';
import { Profile } from './pages/profile/Profile';

// Create TanStack query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            {/* Authenticated routes grouping */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/harvest/new" element={<RegisterHarvest />} />
              <Route path="/history" element={<History />} />
              <Route path="/harvest/:id" element={<HarvestDetail />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Guest/Auth routes grouping */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Root Navigation fallbacks */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
