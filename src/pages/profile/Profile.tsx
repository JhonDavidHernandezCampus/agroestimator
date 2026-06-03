import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { User, LogOut, Shield, MapPin, Database, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader title="Perfil de Usuario" description="Gestione sus credenciales y configure el centro de operaciones agrícola." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Card */}
        <div className="lg:col-span-4 select-none">
          <Card className="p-6 text-center space-y-4">
            <div className="relative w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-3xl mx-auto border-4 border-primary shadow-md">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-on-surface">{user?.name}</h3>
              <p className="text-sm text-on-surface-variant font-medium">{user?.role}</p>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
              <span className="bg-[#E8F7DA] text-on-secondary-container px-3 py-1 rounded-full font-label-lg text-label-lg">Plantación Activa</span>
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-label-lg text-label-lg">Certificado 2024</span>
            </div>
          </Card>
        </div>

        {/* Configurations detail list */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Shield className="w-5 h-5 text-primary" /> Información de Cuenta y Licencia
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Correo Electrónico</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block">{user?.email}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Finca Predeterminada</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" /> Hacienda Palma del Norte
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">ID del Terminal</span>
                <span className="text-sm font-mono font-semibold text-on-surface mt-1 block">TERM-CO-2026-9922</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Versión del Software</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block flex items-center gap-1">
                  <Database className="w-4 h-4 text-secondary" /> AgroEstimador v2.4.0
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-outline uppercase tracking-wider">Ajustes de Sincronización</h4>
            <div className="py-2 border-t border-b border-outline-variant/30 text-xs text-on-surface-variant font-medium leading-relaxed">
              La sincronización fuera de línea está activa de manera predeterminada. Los datos guardados en el almacenamiento local se subirán automáticamente a los servidores centrales de la compañía agrícola en cuanto se detecte conectividad de campo.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => alert('Sincronización forzada completada con éxito!')}>
                Sincronizar Ahora
              </Button>
              <Button variant="danger" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
                Cerrar Sesión
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default Profile;
