export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  refreshToken: string;
}

export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  documentNumber?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  role: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export interface VehicleDto {
  id: string;
  name: string;
  plate: string;
  vehicleType?: string | null;
  capacityKg: number;
  tareWeightKg?: number | null;
  fuelLevel?: number | null;
  nextServiceDate?: string | null;
  status: string;
  maintenanceNotes?: string | null;
  isActive: boolean;
}

export interface ProductDto {
  id: string;
  name: string;
  description?: string | null;
  defaultUnitId?: string | null;
  defaultUnitAbbreviation?: string | null;
  currentPricePerKg?: number | null;
  isActive: boolean;
}

export interface FarmDto {
  id: string;
  userId: string;
  name: string;
  location?: string | null;
  municipality?: string | null;
  department?: string | null;
  totalHectares?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
}

export interface LotDto {
  id: string;
  farmId: string;
  name: string;
  hectares?: number | null;
  cropType?: string | null;
  plantingDate?: string | null;
  isActive: boolean;
}

export interface HarvestSampleDto {
  id: string;
  weight: number;
  quality: string;
}

export interface HarvestDto {
  id: string;
  date: string;
  farmName: string;
  lot: string;
  product: string;
  vehicle: string;
  quantity: number;
  samples: HarvestSampleDto[];
  averageWeight: number;
  estimatedWeight: number;
  estimatedValue: number;
  pricePerKg?: number | null;
}

export interface StatisticsDto {
  totalHarvests: number;
  totalWeight: number;
  estimatedEarnings: number;
  activeVehicles: number;
  inMaintenanceVehicles: number;
}

export interface DashboardSummaryDto {
  totalHarvests: number;
  totalFarms: number;
  totalLots: number;
  totalWeightEstimated: number;
  totalValueEstimated: number;
}

export interface MonthlyProductionDto {
  month: string;
  totalHarvests: number;
  totalBunches: number;
  totalWeightKg: number;
  totalValue: number;
  avgWeightPerBunch: number;
}

export interface FarmStatsDto {
  farmId: string;
  farmName: string;
  totalHarvests: number;
  totalWeightKg: number;
  totalValue: number;
}

export interface ProductStatsDto {
  productId: string;
  productName: string;
  totalHarvests: number;
  totalWeightKg: number;
  totalValue: number;
}

export interface TrendDto {
  date: string;
  weightKg: number;
  value: number;
}

export interface StoredAuthSession {
  auth: AuthResponse;
  profile?: UserProfileDto | null;
}

export type Vehicle = VehicleDto;
export type Product = ProductDto;
export type HarvestSample = HarvestSampleDto;
export type Harvest = HarvestDto;
export type Statistics = StatisticsDto;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
