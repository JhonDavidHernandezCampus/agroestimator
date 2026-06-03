import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/common/Loader';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // If restoring previous session, wait
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Redirect to dashboard if logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background-custom font-sans">
      {/* Visual Farm Backdrop (Displays on larger screens) */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=1200')" }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#141f00]/90 via-[#366b00]/70 to-[#bfff8a]/20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary-container">agriculture</span>
          <span className="text-2xl font-bold text-white tracking-tight">AgroEstimador</span>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <h1 className="text-white text-4xl font-extrabold tracking-tight leading-tight">
            Estimación y control de rendimiento agrícola de precisión.
          </h1>
          <p className="text-primary-container text-lg font-medium">
            Tome decisiones basadas en datos de muestreo directo tomados directamente en el campo. Sincronía en tiempo real lista para operaciones.
          </p>
        </div>

        <div className="relative z-10 text-white/60 font-medium text-sm">
          © 2026 AgroEstimador Systems • Todos los derechos reservados.
        </div>
      </div>

      {/* Main Login / Sign Up canvas */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
