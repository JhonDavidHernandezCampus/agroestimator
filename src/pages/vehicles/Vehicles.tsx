import React, { useState } from 'react';
import { CheckCircle, Flame, Layers, Pencil, PlusCircle, Trash2, Truck, Wrench } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Select } from '../../components/common/Select';
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from '../../hooks';
import { Vehicle } from '../../types';
import { VehicleMutationRequest } from '../../api/vehicle.api';

const EMPTY_FORM: VehicleMutationRequest = {
  name: '',
  plate: '',
  vehicleType: '',
  capacityKg: 0,
  tareWeightKg: null,
  fuelLevel: null,
  nextServiceDate: null,
  status: 'active',
  maintenanceNotes: '',
};

function isActiveStatus(status: string) {
  return ['active', 'activo'].includes(status.toLowerCase());
}

function getStatusLabel(status: string) {
  return isActiveStatus(status) ? 'Activo' : 'Mantenimiento';
}

export function Vehicles() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { mutateAsync: createVehicle, isPending: isCreating } = useCreateVehicle();
  const { mutateAsync: updateVehicle, isPending: isUpdating } = useUpdateVehicle();
  const { mutateAsync: deleteVehicle, isPending: isDeleting } = useDeleteVehicle();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [formState, setFormState] = useState<VehicleMutationRequest>(EMPTY_FORM);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isSaving = isCreating || isUpdating;
  const totalVehicles = vehicles.length;
  const activeCount = vehicles.filter((vehicle) => isActiveStatus(vehicle.status)).length;
  const maintenanceCount = vehicles.filter((vehicle) => !isActiveStatus(vehicle.status)).length;
  const sortedVehicles = [...vehicles].sort((left, right) => left.name.localeCompare(right.name));

  const openCreateModal = () => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingVehicle(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingVehicle(vehicle);
    setFormState({
      name: vehicle.name,
      plate: vehicle.plate,
      vehicleType: vehicle.vehicleType || '',
      capacityKg: vehicle.capacityKg,
      tareWeightKg: vehicle.tareWeightKg,
      fuelLevel: vehicle.fuelLevel,
      nextServiceDate: vehicle.nextServiceDate ? vehicle.nextServiceDate.split('T')[0] : null,
      status: vehicle.status,
      maintenanceNotes: vehicle.maintenanceNotes || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!formState.name.trim() || !formState.plate.trim() || formState.capacityKg <= 0) {
      setFeedbackError('Nombre, placa y capacidad son obligatorios.');
      return;
    }

    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      if (editingVehicle) {
        await updateVehicle({ id: editingVehicle.id, payload: formState });
        setFeedbackMessage('Vehículo actualizado correctamente.');
      } else {
        await createVehicle(formState);
        setFeedbackMessage('Vehículo creado correctamente.');
      }

      setIsModalOpen(false);
      setEditingVehicle(null);
      setFormState(EMPTY_FORM);
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible guardar el vehículo.');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await deleteVehicle(deleteTarget.id);
      setFeedbackMessage('Vehículo eliminado correctamente.');
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible eliminar el vehículo.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/4" />
        <Loader variant="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader
        title="Inventario de Vehículos"
        description="Gestione los tractores, cosechadoras y camiones asignados a la flota de campo."
        action={
          <Button onClick={openCreateModal} variant="secondary" icon={<PlusCircle className="w-4 h-4" />}>
            Agregar Vehículo
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

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-on-surface">{vehicle.name}</h4>
                  <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" /> Placa: {vehicle.plate}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isActiveStatus(vehicle.status) ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                  <span className={`w-2 h-2 rounded-full ${isActiveStatus(vehicle.status) ? 'bg-secondary' : 'bg-error-custom'}`} />
                  {getStatusLabel(vehicle.status)}
                </span>
              </div>

              <div className="space-y-2 border-t border-b border-outline-variant/30 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-on-surface-variant">Capacidad de Carga</span>
                  <span className="font-bold text-on-surface">{Number(vehicle.capacityKg).toLocaleString('es-CO')} kg</span>
                </div>
                {isActiveStatus(vehicle.status) ? (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Nivel de Combustible</span>
                      <span className="font-bold text-on-surface flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 text-secondary" /> {vehicle.fuelLevel != null ? `${vehicle.fuelLevel}%` : 'No registrado'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Siguiente Servicio</span>
                      <span className="font-bold text-on-surface">{vehicle.nextServiceDate ? new Date(vehicle.nextServiceDate).toLocaleDateString('es-CO') : 'No programado'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="font-semibold text-error-custom">Notas de mantenimiento</span>
                      <span className="font-bold text-error-custom">{vehicle.maintenanceNotes || 'Sin detalle'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-on-surface-variant">Tipo</span>
                      <span className="font-bold text-on-surface">{vehicle.vehicleType || 'No especificado'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => openEditModal(vehicle)} className="w-full text-xs" icon={<Pencil className="w-4 h-4" />}>
                Editar
              </Button>
              <Button variant="danger" onClick={() => setDeleteTarget(vehicle)} className="w-full text-xs" icon={<Trash2 className="w-4 h-4" />}>
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? `Editar vehículo: ${editingVehicle.name}` : 'Agregar vehículo'}>
        <div className="space-y-4">
          <Input id="vehicle-name" label="Nombre" value={formState.name} onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} />
          <Input id="vehicle-plate" label="Placa" value={formState.plate} onChange={(event) => setFormState((current) => ({ ...current, plate: event.target.value }))} />
          <Input id="vehicle-type" label="Tipo" value={formState.vehicleType || ''} onChange={(event) => setFormState((current) => ({ ...current, vehicleType: event.target.value }))} />
          <Input id="vehicle-capacity" type="number" label="Capacidad (kg)" value={formState.capacityKg} onChange={(event) => setFormState((current) => ({ ...current, capacityKg: Number(event.target.value) || 0 }))} />
          <Input id="vehicle-tare" type="number" label="Peso tara (kg)" value={formState.tareWeightKg || ''} onChange={(event) => setFormState((current) => ({ ...current, tareWeightKg: event.target.value ? Number(event.target.value) : null }))} />
          <Input id="vehicle-fuel" type="number" label="Combustible (%)" value={formState.fuelLevel || ''} onChange={(event) => setFormState((current) => ({ ...current, fuelLevel: event.target.value ? Number(event.target.value) : null }))} />
          <Input id="vehicle-next-service" type="date" label="Próximo servicio" value={formState.nextServiceDate || ''} onChange={(event) => setFormState((current) => ({ ...current, nextServiceDate: event.target.value || null }))} />
          <Select
            id="vehicle-status"
            label="Estado"
            value={formState.status}
            onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'maintenance', label: 'Mantenimiento' },
            ]}
          />
          <Input id="vehicle-notes" label="Notas de mantenimiento" value={formState.maintenanceNotes || ''} onChange={(event) => setFormState((current) => ({ ...current, maintenanceNotes: event.target.value }))} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVehicle} isLoading={isSaving}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVehicle}
        title="Eliminar vehículo"
        description={deleteTarget ? `Se eliminará ${deleteTarget.name} de la flota registrada.` : ''}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default Vehicles;
