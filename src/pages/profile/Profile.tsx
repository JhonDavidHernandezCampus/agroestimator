import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, IdCard, LoaderCircle, LogOut, MapPin, Phone, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFarms, useProfile } from '../../hooks';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export function Profile() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading, refetch, isRefetching } = useProfile();
  const { data: farms = [] } = useFarms();
  const navigate = useNavigate();

  const primaryFarm = farms[0];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : user?.name;

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader title="Perfil de Usuario" description="Información cargada desde la API protegida por JWT." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 select-none">
          <Card className="p-6 text-center space-y-4">
            <div className="relative w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-3xl mx-auto border-4 border-primary shadow-md">
              {displayName?.slice(0, 2).toUpperCase() || 'US'}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-on-surface">{displayName}</h3>
              <p className="text-sm text-on-surface-variant font-medium">{profile?.role || user?.role}</p>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
              <span className="bg-[#E8F7DA] text-on-secondary-container px-3 py-1 rounded-full font-label-lg text-label-lg">
                {profile?.isActive ? 'Cuenta activa' : 'Cuenta inactiva'}
              </span>
              <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-label-lg text-label-lg">
                {profile?.createdAt ? `Alta ${new Date(profile.createdAt).getFullYear()}` : 'Usuario'}
              </span>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Shield className="w-5 h-5 text-primary" /> Información de Cuenta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Correo Electrónico</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block">{profile?.email || user?.email}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Finca Predeterminada</span>
                <span className="text-sm font-semibold text-on-surface mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary" /> {primaryFarm?.name || 'Sin finca asignada'}
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Teléfono</span>
                <span className="text-sm font-semibold text-on-surface mt-1 flex items-center gap-1">
                  <Phone className="w-4 h-4 text-primary" /> {profile?.phone || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Documento</span>
                <span className="text-sm font-semibold text-on-surface mt-1 flex items-center gap-1">
                  <IdCard className="w-4 h-4 text-secondary" /> {profile?.documentNumber || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Fecha de Alta</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-CO') : 'No disponible'}
                </span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Rol</span>
                <span className="text-sm font-semibold text-on-surface mt-1 flex items-center gap-1">
                  <Database className="w-4 h-4 text-secondary" /> {profile?.role || user?.role}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-outline uppercase tracking-wider">Sesión y Perfil</h4>
            <div className="py-2 border-t border-b border-outline-variant/30 text-xs text-on-surface-variant font-medium leading-relaxed">
              Los datos del perfil se consultan directamente desde la API. El botón de actualización vuelve a pedir la información almacenada actualmente en la base de datos.
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => refetch()} isLoading={isRefetching}>
                Actualizar Perfil
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
