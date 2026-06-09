import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, LayoutTemplate, MapPin, Sprout, Tractor } from 'lucide-react';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Loader } from '../../components/common/Loader';
import { PageHeader } from '../../components/common/PageHeader';
import { useFarm, useFarmStatistics, useLots } from '../../hooks';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function FarmDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: farm, isLoading: farmLoading, error: farmError } = useFarm(id);
  const { data: statistics, isLoading: statsLoading, error: statsError } = useFarmStatistics(id);
  const { data: lots = [], isLoading: lotsLoading } = useLots(id);

  if (farmLoading || statsLoading || lotsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/3" />
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-list" />
      </div>
    );
  }

  if (!farm || farmError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Detalle de finca" backUrl="/farms" />
        <AlertBanner variant="error" message="No fue posible recuperar la finca solicitada desde la API." />
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title={farm.name}
        description="Detalle operativo y estadísticas reales de la finca seleccionada."
        backUrl="/farms"
        action={
          <Button variant="secondary" onClick={() => navigate(`/lots?farmId=${farm.id}`)}>
            Gestionar Lotes
          </Button>
        }
      />

      {statsError && <AlertBanner variant="error" message="No fue posible cargar las estadísticas de esta finca." />}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Cosechas</p>
          <p className="text-2xl font-black text-on-surface">{statistics?.totalHarvests ?? 0}</p>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <Tractor className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Peso Total</p>
          <p className="text-2xl font-black text-on-surface">{Number(statistics?.totalWeightKg || 0).toLocaleString('es-CO')} kg</p>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Valor Proyectado</p>
          <p className="text-2xl font-black text-on-surface">{formatCurrency(statistics?.totalValue ?? 0)}</p>
        </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card className="p-6 space-y-4 h-full">
            <h3 className="text-lg font-bold text-on-surface">Información general</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant font-semibold block">Ubicación</span>
                <strong className="text-on-surface">{farm.location || 'No registrada'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block">Municipio</span>
                <strong className="text-on-surface">{farm.municipality || 'No registrado'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block">Departamento</span>
                <strong className="text-on-surface">{farm.department || 'No registrado'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block">Hectáreas</span>
                <strong className="text-on-surface">{farm.totalHectares != null ? `${Number(farm.totalHectares).toLocaleString('es-CO')} ha` : 'No registradas'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block">Latitud</span>
                <strong className="text-on-surface">{farm.latitude ?? 'No registrada'}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant font-semibold block">Longitud</span>
                <strong className="text-on-surface">{farm.longitude ?? 'No registrada'}</strong>
              </div>
            </div>
            <div className="rounded-xl bg-surface-container p-4 text-sm font-medium text-on-surface-variant flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              Esta ficha consume los endpoints `GET /api/Farms/{'{id}'}` y `GET /api/Farms/{'{id}'}/statistics` sin datos locales temporales.
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="p-6 space-y-4 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Lotes asociados</h3>
                <p className="text-sm text-on-surface-variant font-medium">Los lotes se consultan en tiempo real por finca.</p>
              </div>
              <Button variant="secondary" onClick={() => navigate(`/lots?farmId=${farm.id}`)}>
                Administrar
              </Button>
            </div>

            {lots.length === 0 ? (
              <EmptyState
                title="Esta finca no tiene lotes"
                description="Cree el primer lote para poder usarla en el flujo de cosechas."
                actionText="Crear Lote"
                onAction={() => navigate(`/lots?farmId=${farm.id}`)}
              />
            ) : (
              <div className="space-y-3">
                {lots.map((lot) => (
                  <div key={lot.id} className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">{lot.name}</h4>
                      <p className="text-xs font-medium text-on-surface-variant mt-1">{lot.cropType || 'Cultivo no especificado'}</p>
                    </div>
                    <div className="text-right text-xs font-medium text-on-surface-variant">
                      <div>{lot.hectares != null ? `${Number(lot.hectares).toLocaleString('es-CO')} ha` : 'Sin hectáreas'}</div>
                      <div className="mt-1 flex items-center gap-1 justify-end">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {lot.plantingDate ? new Date(lot.plantingDate).toLocaleDateString('es-CO') : 'Sin siembra'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FarmDetail;