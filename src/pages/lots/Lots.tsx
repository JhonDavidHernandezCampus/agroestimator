import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Filter, Layers, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertBanner } from '../../components/common/AlertBanner';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { PageHeader } from '../../components/common/PageHeader';
import { Select } from '../../components/common/Select';
import { useCreateLot, useDeleteLot, useFarms, useLots, useUpdateLot } from '../../hooks';
import { Lot, LotMutationRequest } from '../../types';

const lotSchema = yup.object({
  farmId: yup.string().uuid('Debe seleccionar una finca válida.').required('La finca es obligatoria.'),
  name: yup.string().trim().required('El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  hectares: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .nullable()
    .moreThan(0, 'Debe ser mayor que cero.'),
  cropType: yup.string().nullable().transform((value) => value || null).max(100, 'Máximo 100 caracteres.'),
  plantingDate: yup.string().nullable().transform((value) => value || null),
}).required();

type LotFormValues = yup.InferType<typeof lotSchema>;

const EMPTY_FORM: LotFormValues = {
  farmId: '',
  name: '',
  hectares: null,
  cropType: null,
  plantingDate: null,
};

export function Lots() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const [selectedFarmId, setSelectedFarmId] = useState(searchParams.get('farmId') || '');
  const { data: lots = [], isLoading: lotsLoading } = useLots(selectedFarmId || undefined);
  const { mutateAsync: createLot, isPending: isCreating } = useCreateLot();
  const { mutateAsync: updateLot, isPending: isUpdating } = useUpdateLot();
  const { mutateAsync: deleteLot, isPending: isDeleting } = useDeleteLot();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LotFormValues>({
    resolver: yupResolver(lotSchema) as any,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!selectedFarmId && farms.length > 0) {
      const nextFarmId = searchParams.get('farmId') || farms[0].id;
      setSelectedFarmId(nextFarmId);
      setSearchParams(nextFarmId ? { farmId: nextFarmId } : {});
    }
  }, [farms, searchParams, selectedFarmId, setSearchParams]);

  useEffect(() => {
    if (editingLot) {
      reset({
        farmId: editingLot.farmId,
        name: editingLot.name,
        hectares: editingLot.hectares ?? null,
        cropType: editingLot.cropType || null,
        plantingDate: editingLot.plantingDate ? editingLot.plantingDate.split('T')[0] : null,
      });
      return;
    }

    reset({ ...EMPTY_FORM, farmId: selectedFarmId });
  }, [editingLot, reset, selectedFarmId]);

  const filteredLots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return lots;
    }

    return lots.filter((lot) => [lot.name, lot.cropType].filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [lots, searchTerm]);

  const totalHectares = lots.reduce((sum, lot) => sum + Number(lot.hectares || 0), 0);
  const activeLots = lots.filter((lot) => lot.isActive).length;
  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
  const isSaving = isCreating || isUpdating;

  const openCreateModal = () => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingLot(null);
    setValue('farmId', selectedFarmId);
    setIsModalOpen(true);
  };

  const openEditModal = (lot: Lot) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingLot(lot);
    setIsModalOpen(true);
  };

  const handleFarmChange = (nextFarmId: string) => {
    setSelectedFarmId(nextFarmId);
    setSearchParams(nextFarmId ? { farmId: nextFarmId } : {});
  };

  const closeModal = () => {
    setEditingLot(null);
    setIsModalOpen(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFeedbackError(null);
    setFeedbackMessage(null);

    const payload: LotMutationRequest = {
      farmId: values.farmId,
      name: values.name.trim(),
      hectares: values.hectares ?? null,
      cropType: values.cropType || null,
      plantingDate: values.plantingDate || null,
    };

    try {
      if (editingLot) {
        await updateLot({
          id: editingLot.id,
          farmId: editingLot.farmId,
          payload: {
            name: payload.name,
            hectares: payload.hectares,
            cropType: payload.cropType,
            plantingDate: payload.plantingDate,
          },
        });
        setFeedbackMessage('El lote se actualizó correctamente.');
      } else {
        await createLot(payload);
        setFeedbackMessage('El lote se creó correctamente.');
        handleFarmChange(payload.farmId);
      }

      closeModal();
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible guardar el lote.');
    }
  });

  const handleDeleteLot = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await deleteLot({ id: deleteTarget.id, farmId: deleteTarget.farmId });
      setFeedbackMessage('El lote se eliminó correctamente.');
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible eliminar el lote.');
    }
  };

  if (farmsLoading || lotsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/4" />
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-list" />
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title="Lotes"
        description="Gestione los lotes asociados a cada finca y mantenga el selector dependiente para cosechas reales."
        action={
          <Button onClick={openCreateModal} variant="secondary" icon={<PlusCircle className="w-4 h-4" />} disabled={!selectedFarmId}>
            Nuevo Lote
          </Button>
        }
      />

      {feedbackMessage && <AlertBanner variant="success" message={feedbackMessage} />}
      {feedbackError && <AlertBanner variant="error" message={feedbackError} />}

      {farms.length === 0 ? (
        <EmptyState
          title="Primero debe crear una finca"
          description="Los lotes dependen de una finca real. Cree la finca y vuelva aquí para registrar los lotes asociados."
          actionText="Ir a Fincas"
          onAction={() => navigate('/farms')}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-primary">
                <Filter className="w-5 h-5" />
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Finca actual</span>
              </div>
              <Select
                id="lot-farm-filter"
                value={selectedFarmId}
                onChange={(event) => handleFarmChange(event.target.value)}
                options={farms.map((farm) => ({ value: farm.id, label: farm.name }))}
              />
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Lotes activos</p>
                <p className="text-xl font-black text-on-surface mt-0.5">{activeLots}</p>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hectáreas en lotes</p>
                <p className="text-xl font-black text-on-surface mt-0.5">{totalHectares.toLocaleString('es-CO', { maximumFractionDigits: 1 })} ha</p>
              </div>
            </Card>
          </section>

          <section className="bg-surface-lowest p-4 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-sm font-medium"
                placeholder="Buscar por nombre o tipo de cultivo..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex items-center rounded-xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface-variant">
              {selectedFarm ? `Mostrando lotes de ${selectedFarm.name}` : 'Seleccione una finca'}
            </div>
          </section>

          {selectedFarmId && lots.length === 0 ? (
            <EmptyState
              title="Esta finca no tiene lotes"
              description="Registre el primer lote para habilitar el selector dependiente del formulario de cosechas."
              actionText="Crear lote"
              onAction={openCreateModal}
            />
          ) : (
            <DataTable
              headers={['Nombre', 'Cultivo', 'Hectáreas', 'Siembra', 'Estado', 'Acciones']}
              items={filteredLots}
              emptyTitle="No hay lotes que coincidan con la búsqueda"
              emptyDescription="Pruebe con otro criterio o cree un nuevo lote."
              renderRow={(lot) => (
                <tr key={lot.id} className="hover:bg-primary-container/10 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-on-surface">{lot.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{lot.cropType || 'No especificado'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-on-surface">{lot.hectares != null ? `${Number(lot.hectares).toLocaleString('es-CO')} ha` : 'No registradas'}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{lot.plantingDate ? new Date(lot.plantingDate).toLocaleDateString('es-CO') : 'No registrada'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lot.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                      {lot.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(lot)} className="p-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer" title="Editar lote">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(lot)} className="p-1.5 rounded-lg hover:bg-error-container/20 hover:text-error-custom transition-all cursor-pointer" title="Eliminar lote">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              renderMobileCard={(lot) => (
                <Card key={lot.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h4 className="text-base font-black text-on-surface">{lot.name}</h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">{lot.cropType || 'Cultivo no especificado'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${lot.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                      {lot.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-outline block">Hectáreas</span>
                      <strong className="text-on-surface">{lot.hectares != null ? `${Number(lot.hectares).toLocaleString('es-CO')} ha` : 'N/D'}</strong>
                    </div>
                    <div>
                      <span className="text-outline block">Siembra</span>
                      <strong className="text-on-surface">{lot.plantingDate ? new Date(lot.plantingDate).toLocaleDateString('es-CO') : 'N/D'}</strong>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button className="w-full text-xs" variant="secondary" onClick={() => openEditModal(lot)} icon={<Pencil className="w-4 h-4" />}>
                      Editar
                    </Button>
                    <Button className="w-full text-xs" variant="danger" onClick={() => setDeleteTarget(lot)} icon={<Trash2 className="w-4 h-4" />}>
                      Eliminar
                    </Button>
                  </div>
                </Card>
              )}
            />
          )}
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingLot ? `Editar lote: ${editingLot.name}` : 'Nuevo lote'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Select
            id="lot-farm"
            label="Finca"
            error={errors.farmId?.message}
            disabled={!!editingLot}
            options={farms.map((farm) => ({ value: farm.id, label: farm.name }))}
            {...register('farmId')}
          />
          <Input id="lot-name" label="Nombre" error={errors.name?.message} {...register('name')} />
          <Input id="lot-crop" label="Tipo de cultivo" error={errors.cropType?.message} {...register('cropType')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="lot-hectares" type="number" step="0.01" label="Hectáreas" error={errors.hectares?.message} {...register('hectares')} />
            <Input id="lot-planting" type="date" label="Fecha de siembra" error={errors.plantingDate?.message} {...register('plantingDate')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Guardar lote
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLot}
        title="Eliminar lote"
        description={deleteTarget ? `Se eliminará ${deleteTarget.name}. Si tiene cosechas asociadas, la API puede impedir la eliminación.` : ''}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default Lots;