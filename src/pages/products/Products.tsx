import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { BadgeDollarSign, Package, Pencil, PlusCircle, Search, Trash2 } from 'lucide-react';
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
import { useAuth } from '../../contexts/AuthContext';
import { useCreateProduct, useDeleteProduct, useProducts, useUpdateProduct } from '../../hooks';
import { Product, ProductMutationRequest } from '../../types';

const productSchema = yup.object({
  name: yup.string().trim().required('El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  description: yup.string().nullable().transform((value) => value || null).max(500, 'Máximo 500 caracteres.'),
  currentPricePerKg: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .nullable()
    .min(0, 'Debe ser mayor o igual a cero.'),
}).required();

type ProductFormValues = yup.InferType<typeof productSchema>;

const EMPTY_FORM: ProductFormValues = {
  name: '',
  description: null,
  currentPricePerKg: null,
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function Products() {
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutateAsync: deleteProduct, isPending: isDeleting } = useDeleteProduct();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const canManageProducts = user?.role?.toLowerCase() === 'admin';
  const isSaving = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: yupResolver(productSchema) as any,
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        description: editingProduct.description || null,
        currentPricePerKg: editingProduct.currentPricePerKg ?? null,
      });
      return;
    }

    reset(EMPTY_FORM);
  }, [editingProduct, reset]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return products;
    }

    return products.filter((product) => [product.name, product.description].filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [products, searchTerm]);

  const averagePrice =
    products.length > 0
      ? products.reduce((sum, product) => sum + Number(product.currentPricePerKg || 0), 0) / products.length
      : 0;

  const openCreateModal = () => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFeedbackError(null);
    setFeedbackMessage(null);
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFeedbackError(null);
    setFeedbackMessage(null);

    const payload: ProductMutationRequest = {
      name: values.name.trim(),
      description: values.description || null,
      currentPricePerKg: values.currentPricePerKg ?? null,
      defaultUnitId: null,
    };

    try {
      if (editingProduct) {
        await updateProduct({ id: editingProduct.id, payload });
        setFeedbackMessage('El producto se actualizó correctamente.');
      } else {
        await createProduct(payload);
        setFeedbackMessage('El producto se creó correctamente.');
      }

      closeModal();
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible guardar el producto.');
    }
  });

  const handleDeleteProduct = async () => {
    if (!deleteTarget) {
      return;
    }

    setFeedbackError(null);
    setFeedbackMessage(null);

    try {
      await deleteProduct(deleteTarget.id);
      setFeedbackMessage('El producto se eliminó correctamente.');
      setDeleteTarget(null);
    } catch (error: any) {
      setFeedbackError(error?.message || 'No fue posible eliminar el producto.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 bg-surface-container animate-pulse rounded-lg w-1/4" />
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-list" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
      <PageHeader
        title="Productos"
        description="Catálogo real de productos usado por el dashboard y por el formulario de cosechas."
        action={
          <Button onClick={openCreateModal} variant="secondary" icon={<PlusCircle className="w-4 h-4" />} disabled={!canManageProducts}>
            Nuevo Producto
          </Button>
        }
      />

      {!canManageProducts && (
        <AlertBanner
          variant="info"
          message="La API restringe crear, editar y eliminar productos al rol admin. El listado y la búsqueda siguen consumiendo datos reales."
        />
      )}
      {feedbackMessage && <AlertBanner variant="success" message={feedbackMessage} />}
      {feedbackError && <AlertBanner variant="error" message={feedbackError} />}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Productos</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{products.length}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Precio promedio</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{formatCurrency(averagePrice)}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Productos activos</p>
            <p className="text-xl font-black text-on-surface mt-0.5">{products.filter((product) => product.isActive).length}</p>
          </div>
        </Card>
      </section>

      <section className="bg-surface-lowest p-4 rounded-xl border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)]">
        <div className="relative">
          <Search className="w-5 h-5 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-lowest focus:border-primary focus:ring-4 focus:ring-primary-container outline-none transition-all text-sm font-medium"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </section>

      {products.length === 0 ? (
        <EmptyState
          title="No hay productos registrados"
          description="Cree al menos un producto real para habilitar el registro de cosechas."
          actionText={canManageProducts ? 'Crear producto' : undefined}
          onAction={canManageProducts ? openCreateModal : undefined}
        />
      ) : (
        <DataTable
          headers={['Nombre', 'Descripción', 'Precio/kg', 'Unidad', 'Estado', 'Acciones']}
          items={filteredProducts}
          emptyTitle="No hay productos que coincidan con la búsqueda"
          emptyDescription="Pruebe con otro término o cree un nuevo producto."
          renderRow={(product) => (
            <tr key={product.id} className="hover:bg-primary-container/10 transition-colors">
              <td className="px-6 py-4 text-sm font-bold text-on-surface">{product.name}</td>
              <td className="px-6 py-4 text-sm text-on-surface-variant">{product.description || 'Sin descripción'}</td>
              <td className="px-6 py-4 text-sm font-semibold text-on-surface">{formatCurrency(product.currentPricePerKg)}</td>
              <td className="px-6 py-4 text-sm text-on-surface-variant">{product.defaultUnitAbbreviation || 'kg'}</td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(product)} disabled={!canManageProducts} className="p-1.5 rounded-lg hover:bg-surface-container hover:text-primary transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none" title="Editar producto">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(product)} disabled={!canManageProducts} className="p-1.5 rounded-lg hover:bg-error-container/20 hover:text-error-custom transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none" title="Eliminar producto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )}
          renderMobileCard={(product) => (
            <Card key={product.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h4 className="text-base font-black text-on-surface">{product.name}</h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">{product.description || 'Sin descripción'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.isActive ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-error-custom'}`}>
                  {product.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-outline block">Precio/kg</span>
                  <strong className="text-on-surface">{formatCurrency(product.currentPricePerKg)}</strong>
                </div>
                <div>
                  <span className="text-outline block">Unidad</span>
                  <strong className="text-on-surface">{product.defaultUnitAbbreviation || 'kg'}</strong>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="w-full text-xs" variant="secondary" onClick={() => openEditModal(product)} icon={<Pencil className="w-4 h-4" />} disabled={!canManageProducts}>
                  Editar
                </Button>
                <Button className="w-full text-xs" variant="danger" onClick={() => setDeleteTarget(product)} icon={<Trash2 className="w-4 h-4" />} disabled={!canManageProducts}>
                  Eliminar
                </Button>
              </div>
            </Card>
          )}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? `Editar producto: ${editingProduct.name}` : 'Nuevo producto'}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input id="product-name" label="Nombre" error={errors.name?.message} {...register('name')} />
          <Input id="product-description" label="Descripción" error={errors.description?.message} {...register('description')} />
          <Input id="product-price" type="number" step="0.01" label="Precio por kg" error={errors.currentPricePerKg?.message} {...register('currentPricePerKg')} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving} disabled={!canManageProducts}>
              Guardar producto
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Eliminar producto"
        description={deleteTarget ? `Se eliminará ${deleteTarget.name}. Si está en uso por cosechas existentes, la API puede rechazar la operación.` : ''}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default Products;