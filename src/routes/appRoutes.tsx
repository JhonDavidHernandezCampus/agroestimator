import React from 'react';
import { History as HistoryIcon, LayoutDashboard, Package, PlusCircle, Sprout, Tractor, User, Layers as LayersIcon } from 'lucide-react';
import { Dashboard } from '../pages/dashboard/Dashboard';
import { Farms } from '../pages/farms/Farms';
import { FarmDetail } from '../pages/farms/FarmDetail';
import { RegisterHarvest } from '../pages/harvest/RegisterHarvest';
import { HarvestDetail } from '../pages/harvest/HarvestDetail';
import { History } from '../pages/history/History';
import { Lots } from '../pages/lots/Lots';
import { Products } from '../pages/products/Products';
import { Profile } from '../pages/profile/Profile';
import { Vehicles } from '../pages/vehicles/Vehicles';

export interface NavigationRoute {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navigationRoutes: NavigationRoute[] = [
  { label: 'Panel', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Fincas', path: '/farms', icon: Sprout },
  { label: 'Lotes', path: '/lots', icon: LayersIcon },
  { label: 'Productos', path: '/products', icon: Package },
  { label: 'Nueva Cosecha', path: '/harvest/new', icon: PlusCircle },
  { label: 'Historial', path: '/history', icon: HistoryIcon },
  { label: 'Vehículos', path: '/vehicles', icon: Tractor },
  { label: 'Perfil', path: '/profile', icon: User },
];

export const authenticatedRoutes = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/farms', element: <Farms /> },
  { path: '/farms/:id', element: <FarmDetail /> },
  { path: '/lots', element: <Lots /> },
  { path: '/products', element: <Products /> },
  { path: '/harvest/new', element: <RegisterHarvest /> },
  { path: '/history', element: <History /> },
  { path: '/harvest/:id', element: <HarvestDetail /> },
  { path: '/vehicles', element: <Vehicles /> },
  { path: '/profile', element: <Profile /> },
];