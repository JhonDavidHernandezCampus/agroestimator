import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDashboardProductStats,
  useDashboardSummary,
  useDashboardTrends,
  useHarvests,
  useStatistics,
} from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Loader } from '../../components/common/Loader';
import {
  Sparkles,
  TrendingUp,
  CircleGauge,
  PlusCircle,
  History,
  Truck,
  CloudSun,
  Scale,
  Calendar,
  DollarSign,
  Tractor
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: harvests, isLoading: harvestsLoading } = useHarvests();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: productStats = [], isLoading: productStatsLoading } = useDashboardProductStats();
  const { data: trends = [], isLoading: trendsLoading } = useDashboardTrends();
  const navigate = useNavigate();

  const loading = statsLoading || harvestsLoading || summaryLoading || productStatsLoading || trendsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-surface-container animate-pulse rounded-xl w-1/3" />
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-list" />
      </div>
    );
  }

  // Format currencies
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formattedEarnings = stats ? formatCOP(stats.estimatedEarnings) : '$0';
  const totalWeightInTons = stats ? (stats.totalWeight / 1000).toFixed(1) : '0';
  const welcomeName = user?.name?.split(' ')[0] || 'Operador';

  const recentHarvests = harvests ? harvests.slice(0, 3) : [];
  const topProduct = [...productStats].sort((a, b) => b.totalValue - a.totalValue)[0];
  const latestTrend = [...trends].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      {/* Welcome header */}
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Hola, {welcomeName}</h2>
          <p className="text-sm font-semibold text-on-surface-variant mt-0.5">
            Hoy es {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full border border-on-secondary-container/10">
          <CloudSun className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-bold">{summary?.totalFarms ?? 0} fincas • {summary?.totalLots ?? 0} lotes conectados</span>
        </div>
      </section>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <Tractor className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-primary flex items-center bg-primary-container/30 px-2 py-0.5 rounded-full">
              {summary?.totalFarms ?? 0} fincas <TrendingUp className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cosechas Totales</p>
            <p className="text-2xl font-black text-on-surface mt-1">{stats?.totalHarvests}</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-tertiary flex items-center bg-tertiary-container/35 px-2 py-0.5 rounded-full">
              {summary?.totalLots ?? 0} lotes
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Peso Total Proyectado</p>
            <p className="text-2xl font-black text-on-surface mt-1">
              {totalWeightInTons} <span className="text-sm font-semibold text-on-surface-variant">Tons</span>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-secondary flex items-center bg-secondary-container/40 px-2 py-0.5 rounded-full">
              {topProduct?.productName || 'Sin producto líder'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Valor Estimado Bruto</p>
            <p className="text-2xl font-black text-on-surface mt-1 truncate">{formattedEarnings}</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
              <CircleGauge className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant flex items-center bg-surface-container/50 px-2 py-0.5 rounded-full">
              {stats?.inMaintenanceVehicles ?? 0} en mantenimiento
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vehículos Activos</p>
            <p className="text-2xl font-black text-on-surface mt-1">0{stats?.activeVehicles}</p>
          </div>
        </Card>
      </section>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Highlight Banner */}
        <div className="lg:col-span-8 relative min-h-64 rounded-2xl overflow-hidden group border border-[#EEFFCD]">
          <img
            alt="Plato de cosecha"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            src="https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=1200"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#141f00]/95 via-[#141f00]/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 space-y-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-on-primary-container font-bold rounded-full text-xs border border-primary/20 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> Recomendación de Cosecha
            </span>
            <h3 className="text-white text-2xl font-black tracking-tight">
              {topProduct ? `${topProduct.productName} concentra el mejor valor estimado` : 'Sin suficientes datos para recomendaciones'}
            </h3>
            <p className="text-white/85 text-sm font-medium max-w-xl leading-relaxed">
              {latestTrend
                ? `La última tendencia registrada corresponde al ${latestTrend.date} con ${Number(latestTrend.weightKg).toLocaleString('es-CO')} kg proyectados y ${formatCOP(latestTrend.value)} estimados.`
                : 'Registre nuevas cosechas para habilitar recomendaciones basadas en datos reales de la base de datos.'}
            </p>
          </div>
        </div>

        {/* Quick Access Menu list */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <button
            onClick={() => navigate('/harvest/new')}
            className="flex items-center justify-between w-full h-21 bg-primary text-white rounded-2xl px-6 hover:brightness-110 active:scale-[0.98] transition-all shadow-md cursor-pointer border-2 border-primary"
          >
            <div className="flex items-center gap-4">
              <PlusCircle className="w-8 h-8" />
              <span className="font-bold text-base">Registrar Nueva Cosecha</span>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <button
            onClick={() => navigate('/history')}
            className="flex items-center justify-between w-full h-21 border-2 border-primary text-primary bg-white hover:bg-primary-container/10 rounded-2xl px-6 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <History className="w-8 h-8" />
              <span className="font-bold text-base">Historial y Detalles</span>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <button
            onClick={() => navigate('/vehicles')}
            className="flex items-center justify-between w-full h-21 bg-secondary-container text-on-secondary-container rounded-2xl px-6 hover:brightness-95 active:scale-[0.98] transition-all shadow-sm cursor-pointer border border-[#EEFFCD]"
          >
            <div className="flex items-center gap-4">
              <Truck className="w-8 h-8" />
              <span className="font-bold text-base">Gestionar Flotilla</span>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Recents Widget list */}
      <section className="bg-surface-lowest rounded-2xl border border-[#EEFFCD] p-6 shadow-[0px_4px_20px_rgba(30,41,59,0.05)] space-y-6">
        <header className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Últimas Cosechas Evaluadas</h3>
          <button
            onClick={() => navigate('/history')}
            className="text-primary font-bold text-sm tracking-wide hover:underline cursor-pointer"
          >
            Ver Historial Completo
          </button>
        </header>

        {recentHarvests.length === 0 ? (
          <div className="py-6 text-center text-on-surface-variant font-medium text-sm">
            No hay cosechas registradas todavía. ¡Comience tocando 'Registrar Nueva Cosecha'!
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {recentHarvests.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/harvest/${h.id}`)}
                className="flex items-center py-4 hover:bg-surface-container/20 transition-colors rounded-xl px-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mr-4">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
                <div className="grow min-w-0">
                  <h4 className="text-sm font-bold text-on-surface truncate">
                    {h.lot || 'Lote sin nombre'} : {h.product}
                  </h4>
                  <p className="text-xs font-semibold text-on-surface-variant flex items-center mt-0.5">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {h.date} • {h.farmName}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold text-primary">
                    {formatCOP(h.estimatedValue)}
                  </p>
                  <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                    {(h.estimatedWeight / 1000).toFixed(1)} Tons ({h.quantity} Racimos)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
