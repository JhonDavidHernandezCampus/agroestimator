export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  capacity: number;
  fuelLevel: number;
  nextService: string;
  status: 'Activo' | 'Mantenimiento';
  problem?: string;
  returnDate?: string;
}

export interface Product {
  id: string;
  name: string;
}

export interface HarvestSample {
  id: string;
  weight: number;
  quality: 'Alta' | 'Media' | 'Baja';
}

export interface Harvest {
  id: string;
  date: string;
  farmName: string;
  lot: string;
  product: string;
  vehicle: string;
  quantity: number; // total bunches or clusters
  samples: HarvestSample[];
  averageWeight: number; // calculated automatically
  estimatedWeight: number; // calculated automatically: quantity * averageWeight
  estimatedValue: number; // calculated automatically: estimatedWeight * pricePerKg
  pricePerKg?: number; // optional, can be entered on the final step
}

export interface Statistics {
  totalHarvests: number;
  totalWeight: number; // in tons or kg
  estimatedEarnings: number;
  activeVehicles: number;
  inMaintenanceVehicles: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
