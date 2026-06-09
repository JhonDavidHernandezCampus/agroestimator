import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Edit, Eye, Search, Trash2 } from 'lucide-react';
import { useDeleteHarvest, useHarvests, useUpdateHarvest } from '../../hooks';
import { Harvest } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';

export function History() {
  const navigate = useNavigate();
  const { data: harvests, isLoading } = useHarvests();
  const { mutateAsync: deleteHarvest } = useDeleteHarvest();
  const { mutateAsync: updateHarvest } = useUpdateHarvest();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Harvest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [editLot, setEditLot] = useState('');
  const [editQuantity, setEditQuantity] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/4" />
        <Loader variant="skeleton-list" />
      </div>
    );
  }

  const formatCOP = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

  const filteredHarvests = (harvests || []).filter((harvest) => {
    const matchesSearch =
      harvest.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      harvest.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      harvest.farmName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFarm = selectedFarm ? harvest.farmName === selectedFarm : true;
    return matchesSearch && matchesFarm;
  });

  const uniqueFarms = Array.from(new Set((harvests || []).map((harvest) => harvest.farmName)));

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) {
      return;
    }

    setIsDeleting(true);
    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await deleteHarvest(deleteTargetId);
      setDeleteTargetId(null);
      setFeedbackMessage('La cosecha fue eliminada correctamente.');
    } catch (error: any) {
      setFeedbackError(error?.message || 'Error al eliminar la cosecha.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTrigger = (harvest: Harvest) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditTarget(harvest);
    setEditLot(harvest.lot);
    setEditQuantity(harvest.quantity);
  };

  const handleEditSave = async () => {
    if (!editTarget) {
      return;
    }

    setIsSavingEdit(true);
    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await updateHarvest({
        id: editTarget.id,
        harvest: {
          lot: editLot,
          quantity: editQuantity,
        },
      });

      setEditTarget(null);
      setFeedbackMessage('La cosecha fue actualizada y recalculada por la API.');
    } catch (error: any) {
      setFeedbackError(error?.message || 'Error al actualizar los datos.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title="Historial de Cosechas"
        description="Filtre, verifique detalles, edite o elimine las estimaciones registradas."
        action={
          <Button onClick={() => navigate('/harvest/new')} className="hidden sm:inline-flex">
            Registrar Cosecha
          </Button>
        }
      />

      {feedbackMessage && (
        <div className="rounded-xl border border-secondary/10 bg-secondary-container/40 px-4 py-3 text-sm font-semibold text-on-secondary-container">
          {feedbackMessage}
        </div>
      )}

      {feedbackError && (
        <div className="rounded-xl border border-error-custom/10 bg-error-container px-4 py-3 text-sm font-semibold text-error-custom">
          {feedbackError}
        </div>
      )}

      <section className="bg-surface-lowest p-4 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-sm font-medium"
            placeholder="Buscar por lote, finca o producto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
          <select
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-outline-variant bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
            value={selectedFarm}
            onChange={(event) => setSelectedFarm(event.target.value)}
          >
            <option value="">Filtro: Todas las Fincas</option>
            {uniqueFarms.map((farm) => (
              <option key={farm} value={farm}>
                {farm}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        <DataTable
          headers={['Fecha', 'Finca', 'Lote', 'Producto', 'Peso Estimado', 'Valor Proyectado', 'Acciones']}
          items={filteredHarvests}
          emptyTitle="Ninguna cosecha coincide con los filtros"
          emptyDescription="Modifique los criterios de búsqueda o cree una nueva estimación."
          renderRow={(harvest) => (
            <tr key={harvest.id} className="hover:bg-primary-container/10 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-outline" /> {harvest.date}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-on-surface">{harvest.farmName}</td>
              <td className="px-6 py-4 text-sm font-bold text-primary">{harvest.lot}</td>
              <td className="px-6 py-4 text-sm font-semibold text-on-surface-variant">{harvest.product}</td>
              <td className="px-6 py-4 text-sm font-bold text-on-surface">{(harvest.estimatedWeight / 1000).toFixed(2)} Tons</td>
              <td className="px-6 py-4 text-sm text-secondary font-black">{formatCOP(harvest.estimatedValue)}</td>
              <td className="px-6 py-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/harvest/${harvest.id}`)}
                    className="p-1 px-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTrigger(harvest)}
                    className="p-1 px-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(harvest.id)}
                    className="p-1 px-1.5 rounded-lg hover:bg-error-container/20 hover:text-error-custom transition-all cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(harvest) => (
            <Card key={harvest.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">{harvest.date}</span>
                  <h4 className="text-base font-bold text-on-surface mt-2">{harvest.lot}</h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">{harvest.farmName}</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEditTrigger(harvest)}
                    className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container text-on-surface-variant"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(harvest.id)}
                    className="p-2 border border-error-container rounded-lg hover:bg-error-container/20 text-error-custom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-outline-variant/30 text-xs">
                <div>
                  <span className="text-outline block mb-0.5">Peso Estimado</span>
                  <strong className="text-primary text-sm font-semibold">{(harvest.estimatedWeight / 1000).toFixed(2)} Tons</strong>
                </div>
                <div className="text-right">
                  <span className="text-outline block mb-0.5">Valor Bruto</span>
                  <strong className="text-secondary text-sm font-black">{formatCOP(harvest.estimatedValue)}</strong>
                </div>
              </div>
            </Card>
          )}
        />
      </section>

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Estimación de Cosecha"
        description="¿Está completamente seguro de que desea eliminar este registro de cosecha? Esta acción no se puede deshacer."
        confirmText="Eliminar permanentemente"
        isLoading={isDeleting}
      />

      {editTarget && (
        <Modal isOpen={editTarget !== null} onClose={() => setEditTarget(null)} title={`Editar Cosecha: ${editTarget.lot}`}>
          <div className="space-y-4">
            <Input id="editLot" label="Nombre del Lote / Sector" value={editLot} onChange={(event) => setEditLot(event.target.value)} />
            <Input
              id="editQuantity"
              type="number"
              label="Cantidad total de racimos/gajos"
              value={editQuantity}
              onChange={(event) => setEditQuantity(Math.max(0, parseInt(event.target.value, 10) || 0))}
            />

            <div className="py-2 border-t border-outline-variant/30 text-xs text-on-surface-variant font-medium leading-relaxed">
              La API recalculará automáticamente el peso promedio, el peso estimado y el valor proyectado al guardar los cambios.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setEditTarget(null)}>
                Cancelar
              </Button>
              <Button onClick={handleEditSave} isLoading={isSavingEdit}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
