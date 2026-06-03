import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHarvest } from '../../hooks';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  Layers,
  Scale,
  Award,
  Truck,
  FileSpreadsheet,
  Globe,
  DollarSign
} from 'lucide-react';

export function HarvestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: harvest, isLoading, error } = useHarvest(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/4" />
        <Loader />
      </div>
    );
  }

  if (error || !harvest) {
    return (
      <div className="space-y-6 p-8 text-center bg-surface-container rounded-2xl">
        <h3 className="text-xl font-bold text-error-custom">Error al cargar la cosecha</h3>
        <p className="text-sm text-on-surface-variant">La cosecha solicitada no existe o fue eliminada de la base de datos local.</p>
        <Button onClick={() => navigate('/history')}>Volver al Historial</Button>
      </div>
    );
  }

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title={`Detalle de Cosecha: ${harvest.lot}`}
        description={`Finca: ${harvest.farmName} • Análisis técnico del rendimiento de campo`}
        backUrl="/history"
        action={
          <Button onClick={() => window.print()} variant="secondary" icon={<FileSpreadsheet className="w-5 h-5" />}>
            Imprimir Reporte
          </Button>
        }
      />

      {/* Main summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Weight Valuation */}
        <div className="md:col-span-2 bg-[#141f00] text-white p-8 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-6 translate-y-6">
            <Scale className="w-64 h-64 text-primary-container" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <span className="inline-block px-3 py-1 bg-primary-container text-primary font-bold rounded-full text-xs uppercase tracking-wider mb-3">
                Rendimiento de Campo
              </span>
              <p className="text-sm font-semibold opacity-80">Peso Total Estimado</p>
              <h2 className="text-4xl lg:text-5xl font-black text-primary-container tracking-tight mt-1">
                {(harvest.estimatedWeight / 1000).toFixed(2)} <span className="text-lg">Tons</span>
              </h2>
              <p className="text-xs font-semibold opacity-70 mt-2">Equivalente a {harvest.estimatedWeight.toLocaleString()} KG sobre un total de {harvest.quantity} racimos</p>
            </div>
            <div className="bg-primary/20 p-4 rounded-xl border border-primary-container/20">
              <span className="text-xs text-primary-container/85 block mb-1">Cálculo de Confianza</span>
              <span className="text-xl font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                95% Óptimo
              </span>
            </div>
          </div>
        </div>

        {/* Currency projection */}
        <div className="bg-[#def6a5] p-8 rounded-2xl shadow-md border border-[#c9ec85] flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-[#4b670c]/10 text-[#4b670c] font-bold rounded-full text-[10px] uppercase tracking-wider mb-4">
              Valoración Económica
            </span>
            <p className="text-xs font-semibold text-[#4b670c] uppercase">Importe bruto estimado</p>
            <p className="text-3xl font-black text-[#141f00] mt-1 tracking-tight">
              {formatCOP(harvest.estimatedValue)}
            </p>
          </div>
          <p className="text-xs text-[#4b670c] font-medium leading-relaxed mt-4">
            Precio de referencia por KG: ${harvest.pricePerKg || 1150} COP.
          </p>
        </div>
      </section>

      {/* Grid detailing logic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Logistics metadata and samples list */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Calendar className="w-5 h-5 text-primary" /> Logística y Especificación
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Fecha</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block">{harvest.date}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Producto</span>
                <span className="text-sm font-semibold text-on-surface mt-1 block">{harvest.product}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant font-bold block">Peso Promedio Muestra</span>
                <span className="text-sm font-bold text-primary mt-1 block">{harvest.averageWeight} kg</span>
              </div>
            </div>
          </Card>

          {/* Core samples table */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 pb-4 border-b border-outline-variant/30 mb-4">
              <Award className="w-5 h-5 text-primary" /> Muestras Registradas
            </h3>
            <div className="border border-outline-variant rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#E8F7DA] border-b border-outline-variant">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">ID</th>
                    <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">Peso Individual (kg)</th>
                    <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">Calidad Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {harvest.samples.map((s, index) => (
                    <tr key={s.id} className="hover:bg-primary-container/10 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-bold text-on-surface">M-{index + 1}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-on-surface">{s.weight} kg</td>
                      <td className="px-4 py-3.5 text-sm">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.quality === 'Alta'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : s.quality === 'Media'
                            ? 'bg-tertiary-container text-on-tertiary-container'
                            : 'bg-error-container text-error-custom'
                        }`}>
                          {s.quality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Vehicle / Maquinaria right-side details card */}
        <div className="lg:col-span-4">
          <Card className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Truck className="w-5 h-5 text-primary" /> Vehículo Responsable
            </h3>
            <div className="text-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center mx-auto shadow-sm">
                <Truck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant font-bold">Lote de Maquinaria</p>
                <p className="text-base font-black text-on-surface mt-1">{harvest.vehicle}</p>
                <p className="text-xs font-semibold text-on-surface-variant mt-0.5">Operador Autorizado de Turno</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-on-surface-variant">Capacidad Máxima</span>
                <span className="font-bold text-on-surface">15,000 kg</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-on-surface-variant">Combustible Utilizado</span>
                <span className="font-bold text-on-surface">74%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-on-surface-variant">Sincronización GPS</span>
                <span className="font-bold text-primary flex items-center gap-1">
                  <Globe className="w-4 h-4 animate-bounce" /> Activo
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default HarvestDetail;
