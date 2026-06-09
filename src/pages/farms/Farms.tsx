import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { BarChart3, Eye, MapPin, Pencil, PlusCircle, Search, Sprout, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useCreateFarm, useDeleteFarm, useFarms, useUpdateFarm } from '../../hooks';
import { Farm, FarmMutationRequest } from '../../types';

const optionalPositiveNumber = yup
  .number()
  .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
  .nullable()
  .test('is-valid-number', 'Debe ingresar un valor numérico válido.', (value) => value == null || Number.isFinite(value))
  .moreThan(0, 'Debe ser mayor que cero.');

const farmSchema = yup.object({
  name: yup.string().trim().required('El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  location: yup.string().nullable().transform((value) => value || null).max(255, 'Máximo 255 caracteres.'),
  municipality: yup.string().nullable().transform((value) => value || null).max(100, 'Máximo 100 caracteres.'),
  department: yup.string().nullable().transform((value) => value || null).max(100, 'Máximo 100 caracteres.'),
  totalHectares: optionalPositiveNumber,
  latitude: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .nullable()
    .min(-90, 'La latitud debe estar entre -90 y 90.')
    .max(90, 'La latitud debe estar entre -90 y 90.'),
  longitude: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .nullable()
    .min(-180, 'La longitud debe estar entre -180 y 180.')
    .max(180, 'La longitud debe estar entre -180 y 180.'),
}).required();

type FarmFormValues = yup.InferType<typeof farmSchema>;

const EMPTY_FORM: FarmFormValues = {
  name: '',
  location: null,
  municipality: null,
  department: null,
  totalHectares: null,
  latitude: null,
  longitude: null,
};

function buildFarmPayload(values: FarmFormValues): FarmMutationRequest {
  return {
    name: values.name.trim(),
    location: values.location || null,
    municipality: values.municipality || null,
    department: values.department || null,
    totalHectares: values.totalHectares ?? null,
    latitude: values.latitude ?? null,
    longitude: values.longitude ?? null,
  };
}

export function Farms() {
  const navigate = useNavigate();
  const { data: farms = [], isLoading } = useFarms();
  const { mutateAsync: createFarm, isPending: isCreating } = useCreateFarm();
  const { mutateAsync: updateFarm, isPending: isUpdating } = useUpdateFarm();
  const { mutateAsync: deleteFarm, isPending: isDeleting } = useDeleteFarm();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Farm | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FarmFormValues>({
    resolver: yupResolver(farmSchema) as any,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (editingFarm) {
      reset({
        name: editingFarm.name,
        location: editingFarm.location || null,
        municipality: editingFarm.municipality || null,
        department: editingFarm.department || null,
        totalHectares: editingFarm.totalHectares ?? null,
        latitude: editingFarm.latitude ?? null,
        longitude: editingFarm.longitude ?? null,
      });
      return;
    }

    reset(EMPTY_FORM);
  }, [editingFarm, reset]);

  const filteredFarms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return farms;
    }

    return farms.filter((farm) =>
      [farm.name, farm.location, farm.municipality, farm.department]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term))
    );
  }, [farms, searchTerm]);

  const totalHectares = farms.reduce((sum, farm) => sum + Number(farm.totalHectares || 0), 0);
  const activeFarms = farms.filter((farm) => farm.isActive).length;
  const isSaving = isCreating || isUpdating;

  const openCreateModal = () => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingFarm(null);
    setIsModalOpen(true);
  };

  const openEditModal = (farm: Farm) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingFarm(farm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingFarm(null);
    setIsModalOpen(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      const payload = buildFarmPayload(values);

      if (editingFarm) {
        await updateFarm({ id: editingFarm.id, payload });
        setFeedbackMessage('La finca se actualizó correctamente.');
      } else {
        await createFarm(payload);
        setFeedbackMessage('La finca se creó correctamente.');
      }

      closeModal();
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible guardar la finca.');
    }
  });

  const handleDeleteFarm = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await deleteFarm(deleteTarget.id);
      setFeedbackMessage('La finca se eliminó correctamente.');
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible eliminar la finca.');
    }
  };

  if (isLoading) {
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
        title="Fincas"
        description="Administre las fincas reales disponibles para registrar lotes, estadísticas y cosechas."
        action={
          <Button onClick={openCreateModal} variant="secondary" icon={<PlusCircle className="w-4 h-4" />}>
            Nueva Finca
          </Button>
        }
      />

      {feedbackMessage && <AlertBanner variant="success" message={feedbackMessage} />}
      {feedbackError && <AlertBanner variant="error" message={feedbackError} />}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Fincas Registradas</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{farms.length}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Fincas Activas</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{activeFarms}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hectáreas Reportadas</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{totalHectares.toLocaleString('es-CO', { maximumFractionDigits: 1 })}</p>
          </div>
        </Card>
      </section>

      <section className="bg-surface-lowest p-4 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)]">
        <div className="relative">
          <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-sm font-medium"
            placeholder="Buscar por nombre, ubicación, municipio o departamento..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      {farms.length === 0 ? (
        <EmptyState
          title="Todavía no hay fincas registradas"
          description="Cree la primera finca para continuar con el flujo de lotes y registro de cosechas reales."
          actionText="Crear Finca"
          onAction={openCreateModal}
        />
      ) : (
        <DataTable
          headers={['Nombre', 'Ubicación', 'Municipio', 'Hectáreas', 'Estado', 'Acciones']}
          items={filteredFarms}
          emptyTitle="No hay fincas que coincidan con la búsqueda"
          emptyDescription="Pruebe con otro término o cree una nueva finca."
          renderRow={(farm) => (
            <tr key={farm.id} className="hover:bg-primary-container/10 transition-colors">
              <td className="px-6 py-4 text-sm font-bold text-on-surface">{farm.name}</td>
              <td className="px-6 py-4 text-sm text-on-surface-variant">{farm.location || 'No registrada'}</td>
              <td className="px-6 py-4 text-sm text-on-surface-variant">{farm.municipality || 'No registrado'}</td>
              <td className="px-6 py-4 text-sm font-semibold text-on-surface">{farm.totalHectares != null ? `${Number(farm.totalHectares).toLocaleString('es-CO')} ha` : 'No registradas'}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${farm.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                  {farm.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/farms/${farm.id}`)} className="p-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer" title="Ver detalle">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditModal(farm)} className="p-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer" title="Editar finca">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(farm)} className="p-1.5 rounded-lg hover:bg-error-container/20 hover:text-error-custom transition-all cursor-pointer" title="Eliminar finca">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(farm) => (
            <Card key={farm.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="text-base font-black text-on-surface">{farm.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">{farm.location || 'Ubicación no registrada'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${farm.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                  {farm.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-outline block">Municipio</span>
                  <strong className="text-on-surface">{farm.municipality || 'N/D'}</strong>
                </div>
                <div>
                  <span className="text-outline block">Hectáreas</span>
                  <strong className="text-on-surface">{farm.totalHectares != null ? `${Number(farm.totalHectares).toLocaleString('es-CO')} ha` : 'N/D'}</strong>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="w-full text-xs" variant="secondary" onClick={() => navigate(`/farms/${farm.id}`)} icon={<Eye className="w-4 h-4" />}>
                  Ver detalle
                </Button>
                <Button className="w-full text-xs" variant="ghost" onClick={() => openEditModal(farm)} icon={<Pencil className="w-4 h-4" />}>
                  Editar
                </Button>
                <Button className="w-full text-xs" variant="danger" onClick={() => setDeleteTarget(farm)} icon={<Trash2 className="w-4 h-4" />}>
                  Eliminar
                </Button>
              </div>
            </Card>
          )}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingFarm ? `Editar finca: ${editingFarm.name}` : 'Nueva finca'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input id="farm-name" label="Nombre" error={errors.name?.message} {...register('name')} />
          <Input id="farm-location" label="Ubicación" error={errors.location?.message} {...register('location')} />
          <Input id="farm-municipality" label="Municipio" error={errors.municipality?.message} {...register('municipality')} />
          <Input id="farm-department" label="Departamento" error={errors.department?.message} {...register('department')} />
          <Input id="farm-hectares" type="number" step="0.01" label="Hectáreas totales" error={errors.totalHectares?.message} {...register('totalHectares')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="farm-latitude" type="number" step="0.000001" label="Latitud" error={errors.latitude?.message} {...register('latitude')} />
            <Input id="farm-longitude" type="number" step="0.000001" label="Longitud" error={errors.longitude?.message} {...register('longitude')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Guardar finca
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFarm}
        title="Eliminar finca"
        description={deleteTarget ? `Se eliminará ${deleteTarget.name}. Si tiene lotes o cosechas asociadas, la API puede rechazar la operación.` : ''}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default Farms;