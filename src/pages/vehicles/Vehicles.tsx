import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Vehicle } from '../../types';
import { harvestApi } from '../../api/harvest.api';
import { Truck, Wrench, Shield, CheckCircle, Flame, Layers } from 'lucide-react';

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    harvestApi.getVehicles().then((data) => {
      setVehicles(data || []);
    });
  }, []);

  const totalVehicles = vehicles.length;
  const activeCount = vehicles.filter((v) => v.status === 'Activo').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'Mantenimiento').length;

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title="Inventario de Vehículos"
        description="Gestione los tractores, cosechadoras y camiones asignados a la flota de campo."
        action={
          <Button onClick={() => alert('Función de agregar vehículos disponible en versión Enterprise')} variant="secondary">
            Agregar Vehículo
          </Button>
        }
      />

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Flota Total</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{totalVehicles} Unidades</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Activos Ahora</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{activeCount} Unidades</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-error-container text-error-custom flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">En Mantenimiento</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{maintenanceCount} Unidades</p>
          </div>
        </div>
      </section>

      {/* Vehicles Grid / List */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <Card key={v.id} className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-on-surface">{v.name}</h4>
                  <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Placa: {v.plate}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  v.status === 'Activo'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-error-container text-error-custom'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${v.status === 'Activo' ? 'bg-secondary' : 'bg-error-custom'}`} />
                  {v.status}
                </span>
              </div>

              {/* Specs */}
              <div className="space-y-2 border-t border-b border-outline-variant/30 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-on-surface-variant">Capacidad de Carga</span>
                  <span className="font-bold text-on-surface">{v.capacity.toLocaleString()} kg</span>
                </div>
                {v.status === 'Activo' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Nivel de Combustible</span>
                      <span className="font-bold text-on-surface flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 text-secondary" /> {v.fuelLevel}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Siguiente Servicio</span>
                      <span className="font-bold text-on-surface">{v.nextService}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold text-error-custom">Problema Reportado</span>
                      <span className="font-bold text-error-custom">{v.problem}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Retorno Estimado</span>
                      <span className="font-bold text-on-surface">{v.returnDate}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => alert(`Ficha de mantenimiento para ${v.name} en desarrollo`)}
              className="w-full text-xs"
            >
              Ficha del Vehículo
            </Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
export default Vehicles;
