import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useFarms, useLots, useProducts, useRegisterHarvest, useVehicles } from '../../hooks';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { HarvestSample } from '../../types';
import { CreateHarvestRequest } from '../../api/harvest.api';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Layers,
  Plus,
  Scale,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const logisticsSchema = yup.object({
  date: yup.string().required('La fecha es obligatoria'),
  farmName: yup.string().required('La finca es obligatoria'),
  lot: yup.string().required('El lote es obligatorio'),
  product: yup.string().required('El producto es obligatorio'),
  vehicle: yup.string().required('El vehículo es obligatorio'),
  quantity: yup
    .number()
    .typeError('La cantidad debe ser un número')
    .positive('La cantidad debe ser mayor que cero')
    .integer('La cantidad debe ser un número entero')
    .required('La cantidad es obligatoria'),
}).required();

type LogisticsFormInputs = yup.InferType<typeof logisticsSchema>;

export function RegisterHarvest() {
  const navigate = useNavigate();
  const { mutateAsync: registerMutation, isPending } = useRegisterHarvest();
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: vehicles = [], isLoading: vehiclesLoading } = useVehicles();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [samples, setSamples] = useState<HarvestSample[]>([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LogisticsFormInputs>({
    resolver: yupResolver(logisticsSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      farmName: '',
      lot: '',
      product: '',
      vehicle: '',
      quantity: 0,
    },
  });

  const selectedFarmName = watch('farmName');
  const selectedProductName = watch('product');
  const selectedFarm = farms.find((farm) => farm.name === selectedFarmName);
  const selectedProduct = products.find((product) => product.name === selectedProductName);
  const { data: lots = [], isLoading: lotsLoading } = useLots(selectedFarm?.id || '');

  useEffect(() => {
    if (!selectedFarmName && farms.length > 0) {
      setValue('farmName', farms[0].name, { shouldValidate: true });
    }
  }, [farms, selectedFarmName, setValue]);

  useEffect(() => {
    if (!selectedProductName && products.length > 0) {
      setValue('product', products[0].name, { shouldValidate: true });
    }
  }, [products, selectedProductName, setValue]);

  useEffect(() => {
    if (!getValues('vehicle') && vehicles.length > 0) {
      setValue('vehicle', vehicles[0].name, { shouldValidate: true });
    }
  }, [vehicles, getValues, setValue]);

  useEffect(() => {
    if (lots.length === 0) {
      setValue('lot', '', { shouldValidate: true });
      return;
    }

    const currentLot = getValues('lot');
    if (!currentLot || !lots.some((lot) => lot.name === currentLot)) {
      setValue('lot', lots[0].name, { shouldValidate: true });
    }
  }, [lots, getValues, setValue]);

  useEffect(() => {
    if (selectedProduct?.currentPricePerKg != null) {
      setPricePerKg(selectedProduct.currentPricePerKg);
    }
  }, [selectedProduct]);

  const quantity = getValues('quantity') || 0;
  const averageWeight =
    samples.length > 0
      ? parseFloat((samples.reduce((accumulator, sample) => accumulator + sample.weight, 0) / samples.length).toFixed(2))
      : 0;
  const estimatedWeight = parseFloat((quantity * averageWeight).toFixed(1));
  const estimatedValue = parseFloat((estimatedWeight * pricePerKg).toFixed(1));

  const handleAddSample = () => {
    const weightNumber = parseFloat(currentWeight);
    setFormError(null);

    if (!currentWeight || Number.isNaN(weightNumber) || weightNumber <= 0) {
      setFormError('Por favor ingrese un peso de muestra válido mayor a 0.');
      return;
    }

    let quality = 'Media';
    if (weightNumber >= 2.5) {
      quality = 'Alta';
    } else if (weightNumber < 1.8) {
      quality = 'Baja';
    }

    setSamples((currentSamples) => [
      ...currentSamples,
      {
        id: `sample_${crypto.randomUUID()}`,
        weight: weightNumber,
        quality,
      },
    ]);
    setCurrentWeight('');
  };

  const handleDeleteSample = (id: string) => {
    setSamples((currentSamples) => currentSamples.filter((sample) => sample.id !== id));
  };

  const handleNextStep1 = async () => {
    const isValid = await trigger();
    if (isValid) {
      setFormError(null);
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    if (samples.length === 0) {
      setFormError('Debe agregar al menos una muestra para calcular las estimaciones.');
      return;
    }

    setFormError(null);
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setFormError(null);

    try {
      const logisticsData = getValues();
      const payload: CreateHarvestRequest = {
        date: logisticsData.date,
        farmName: logisticsData.farmName,
        lot: logisticsData.lot,
        product: logisticsData.product,
        vehicle: logisticsData.vehicle,
        quantity: logisticsData.quantity,
        samples,
        pricePerKg,
        deviceId: navigator.userAgent,
      };

      await registerMutation(payload);
      navigate('/dashboard');
    } catch (error: any) {
      setFormError(error?.message || 'Error al guardar la cosecha.');
    }
  };

  return (
    <div className="space-y-stack-lg animate-in fade-in duration-300">
      <PageHeader title="Asistente de Estimación" description="Registre cosechas y estime pesos de campo mediante muestreo." />

      {(farmsLoading || productsLoading || vehiclesLoading || lotsLoading) && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface-variant">
          Cargando catálogos reales desde la API...
        </div>
      )}

      {formError && (
        <div className="bg-error-container text-error-custom p-4 rounded-xl flex items-start gap-2 text-sm font-bold border border-error-custom/10 max-w-xl mx-auto">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="flex items-center w-full max-w-lg mx-auto mb-10 pb-4">
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all ${step >= 1 ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>1</div>
          <span className={`text-xs font-bold mt-2 ${step >= 1 ? 'text-primary' : 'text-on-surface-variant'}`}>Logística</span>
        </div>
        <div className={`step-progress-line ${step >= 2 ? 'step-progress-line-active' : ''}`} />
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>2</div>
          <span className={`text-xs font-bold mt-2 ${step >= 2 ? 'text-primary' : 'text-on-surface-variant'}`}>Muestreo</span>
        </div>
        <div className={`step-progress-line ${step >= 3 ? 'step-progress-line-active' : ''}`} />
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 3 ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>3</div>
          <span className={`text-xs font-bold mt-2 ${step >= 3 ? 'text-primary' : 'text-on-surface-variant'}`}>Resultado</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {step === 1 && (
          <Card className="p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Calendar className="w-5 h-5 text-primary" /> Paso 1: Logística de Campo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input id="date" type="date" label="Fecha de Cosecha" error={errors.date?.message} {...register('date')} />
              <Select
                id="farmName"
                label="Finca de Procedencia"
                error={errors.farmName?.message}
                disabled={farmsLoading || farms.length === 0}
                options={farms.length > 0 ? farms.map((farm) => ({ value: farm.name, label: farm.name })) : [{ value: '', label: 'No hay fincas disponibles' }]}
                {...register('farmName')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="lot"
                label="Lote"
                error={errors.lot?.message}
                disabled={!selectedFarm || lotsLoading || lots.length === 0}
                options={lots.length > 0 ? lots.map((lot) => ({ value: lot.name, label: lot.name })) : [{ value: '', label: selectedFarm ? 'No hay lotes disponibles' : 'Seleccione una finca primero' }]}
                {...register('lot')}
              />
              <Select
                id="product"
                label="Tipo de Producto"
                error={errors.product?.message}
                disabled={productsLoading || products.length === 0}
                options={products.length > 0 ? products.map((product) => ({ value: product.name, label: product.name })) : [{ value: '', label: 'No hay productos disponibles' }]}
                {...register('product')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="vehicle"
                label="Vehículo Asignado"
                error={errors.vehicle?.message}
                disabled={vehiclesLoading || vehicles.length === 0}
                options={vehicles.length > 0 ? vehicles.map((vehicle) => ({ value: vehicle.name, label: `${vehicle.name} [${vehicle.plate}]` })) : [{ value: '', label: 'No hay vehículos disponibles' }]}
                {...register('vehicle')}
              />
              <Input id="quantity" type="number" label="Cantidad total de racimos/gajos" placeholder="ej. 1200" error={errors.quantity?.message} {...register('quantity')} />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={handleNextStep1} icon={<ChevronRight className="w-5 h-5" />}>
                Siguiente: Muestreo de Peso
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <Scale className="w-5 h-5 text-primary" /> Paso 2: Recolección de Muestras
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-container/20 p-4 rounded-xl border border-primary-container/30">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Total Racimos</span>
                <span className="text-2xl font-black text-primary mt-1 block">{quantity} Unidades</span>
              </div>
              <div className="bg-secondary-container/20 p-4 rounded-xl border border-secondary-container/30">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">Muestras Guardadas</span>
                <span className="text-2xl font-black text-secondary mt-1 block">{samples.length} Unidades</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#EEFFCD] bg-[#f9f9ff]/50 p-4 space-y-3">
              <label className="text-sm font-semibold text-on-surface block">Ingresar peso de nueva muestra (kg)</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input id="sample_weight" type="number" step="0.1" placeholder="ej. 2.4" value={currentWeight} onChange={(event) => setCurrentWeight(event.target.value)} />
                </div>
                <Button type="button" onClick={handleAddSample} variant="secondary" icon={<Plus className="w-5 h-5" />}>
                  Añadir Muestra
                </Button>
              </div>
            </div>

            {samples.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-sm font-medium border border-dashed border-outline-variant rounded-xl">
                Aún no ha ingresado muestras. Agregue al menos una para calcular la proyección.
              </div>
            ) : (
              <div className="border border-outline-variant rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#E8F7DA] border-b border-outline-variant">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">Peso (kg)</th>
                      <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">Calidad</th>
                      <th className="px-4 py-3 text-xs font-bold text-on-secondary-container uppercase">Cerrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {samples.map((sample, index) => (
                      <tr key={sample.id} className="hover:bg-primary-container/10 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-bold text-on-surface">M-{index + 1}</td>
                        <td className="px-4 py-3.5 text-sm font-bold text-on-surface">{sample.weight} kg</td>
                        <td className="px-4 py-3.5 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sample.quality === 'Alta' ? 'bg-secondary-container text-on-secondary-container' : sample.quality === 'Media' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-error-custom'}`}>
                            {sample.quality}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <button type="button" onClick={() => handleDeleteSample(sample.id)} className="text-error-custom hover:scale-105 transition-all p-1 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
              <div className="p-4 bg-surface-container rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">avg_time</span>
                <div>
                  <p className="text-xs text-on-surface-variant font-bold">Peso Promedio</p>
                  <p className="text-lg font-black text-on-surface">{averageWeight} kg</p>
                </div>
              </div>
              <div className="p-4 bg-surface-container rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">scale</span>
                <div>
                  <p className="text-xs text-on-surface-variant font-bold">Peso Proyectado</p>
                  <p className="text-lg font-black text-on-surface">{estimatedWeight} kg</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} icon={<ChevronLeft className="w-5 h-5" />}>
                Volver
              </Button>
              <Button type="button" onClick={handleNextStep2} icon={<ChevronRight className="w-5 h-5" />}>
                Calcular Estimación
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="p-6 md:p-8 space-y-6 text-center">
              <div className="mx-auto w-16 h-16 bg-primary-container text-primary rounded-xl flex items-center justify-center border-2 border-primary/25 shadow-md mb-2">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-on-surface">Proyección de Rendimiento Realizada</h3>
                <p className="text-sm font-semibold text-on-surface-variant max-w-sm mx-auto">
                  El precio inicial se toma del producto registrado en la API y puede ajustarse antes de guardar.
                </p>
              </div>

              <div className="max-w-xs mx-auto text-left py-4">
                <label className="text-sm font-semibold text-on-surface block mb-2" htmlFor="pricing_model">
                  Precio de Referencia por KG (COP $)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input
                    id="pricing_model"
                    type="number"
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-base font-bold bg-surface-container-lowest"
                    value={pricePerKg}
                    onChange={(event) => setPricePerKg(Math.max(0, parseFloat(event.target.value) || 0))}
                  />
                </div>
              </div>
            </Card>

            <div className="bg-primary p-0.5 rounded-2xl shadow-xl transition-all hover:scale-[1.01]">
              <div className="bg-[#141f00] rounded-[14px] p-6 lg:p-8 text-white relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-6 translate-y-6">
                  <DollarSign className="w-96 h-96" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container text-primary font-bold rounded-full text-[10px] uppercase tracking-wider">
                      Valoración Proyectada
                    </span>
                    <h4 className="text-2xl font-black tracking-tight text-white">Importe Bruto Proyectado</h4>
                    <p className="text-white/70 text-xs font-semibold">Basado en {estimatedWeight.toLocaleString()} KG estimados</p>
                  </div>

                  <div className="text-center md:text-right">
                    <p className="text-5xl font-black text-primary-container tracking-tight">
                      ${estimatedValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-[10px] font-bold text-primary-container/65 tracking-widest mt-1 uppercase">Pesos Colombianos • COP</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} icon={<ChevronLeft className="w-5 h-5" />}>
                Volver
              </Button>
              <Button type="button" onClick={handleFinalSubmit} isLoading={isPending} icon={<Plus className="w-5 h-5" />}>
                Registrar y Sincronizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
