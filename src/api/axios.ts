import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Harvest, Statistics, User, Vehicle } from '../types';

// In absolute production mode, this would draw from import.meta.env
const BASE_URL = (import.meta as any).env.VITE_API_URL || 'https://agroestimator-placeholder.api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Seed Initial Local Data
const INITIAL_HARVESTS: Harvest[] = [
  {
    id: 'h1',
    date: '2023-10-14',
    farmName: 'Hacienda Palma del Norte',
    lot: 'Campo Norte Palma A1',
    product: 'RFF Palma de Aceite',
    vehicle: 'Tractor JD 7210R',
    quantity: 1240,
    samples: [
      { id: 's1', weight: 2.3, quality: 'Alta' },
      { id: 's2', weight: 2.5, quality: 'Alta' },
      { id: 's3', weight: 2.7, quality: 'Alta' }
    ],
    averageWeight: 2.5,
    estimatedWeight: 3100, // in kg
    estimatedValue: 1240 * 2.5 * 1000 // quantity * avgWeight * pricing projection
  },
  {
    id: 'h2',
    date: '2023-10-12',
    farmName: 'Huerto del Río',
    lot: 'Arboleda del Río',
    product: 'Coco',
    vehicle: 'Tractor MZ-120 [VH-441]',
    quantity: 850,
    samples: [
      { id: 's4', weight: 2.0, quality: 'Alta' },
      { id: 's5', weight: 2.2, quality: 'Media' },
      { id: 's6', weight: 2.4, quality: 'Alta' }
    ],
    averageWeight: 2.2,
    estimatedWeight: 1870,
    estimatedValue: 850 * 2.2 * 1150
  },
  {
    id: 'h3',
    date: '2023-10-10',
    farmName: 'Finca Altiplano',
    lot: 'Terraza de la Colina B',
    product: 'Dátiles',
    vehicle: 'Camión de Carga-5 [VH-012]',
    quantity: 2100,
    samples: [
      { id: 's7', weight: 3.1, quality: 'Alta' },
      { id: 's8', weight: 2.9, quality: 'Media' },
      { id: 's9', weight: 3.0, quality: 'Alta' }
    ],
    averageWeight: 3.0,
    estimatedWeight: 6300,
    estimatedValue: 2100 * 3.0 * 850
  }
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    name: 'Tractor JD 7210R',
    plate: 'AG-8842-X',
    capacity: 12500,
    fuelLevel: 82,
    nextService: '2024-10-12',
    status: 'Activo'
  },
  {
    id: 'v2',
    name: 'F-450 Harvest Hauler',
    plate: 'PK-1102-W',
    capacity: 8000,
    fuelLevel: 12,
    nextService: '2023-11-25',
    status: 'Mantenimiento',
    problem: 'Fuga Hidráulica',
    returnDate: 'Mañana'
  },
  {
    id: 'v3',
    name: 'Claas Lexion 8900',
    plate: 'HV-5590-M',
    capacity: 15000,
    fuelLevel: 45,
    nextService: '2024-11-02',
    status: 'Activo'
  }
];

// Initialize LocalStorage Data if not present
if (!localStorage.getItem('agro_harvests')) {
  localStorage.setItem('agro_harvests', JSON.stringify(INITIAL_HARVESTS));
}
if (!localStorage.getItem('agro_vehicles')) {
  localStorage.setItem('agro_vehicles', JSON.stringify(INITIAL_VEHICLES));
}

// Request Interceptor: Attach authentication tokens and log requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userJson = localStorage.getItem('agro_user');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      if (user.token && config.headers) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor & Centralized Mock Server Routing
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    const { url, method, data } = config;
    const body = data ? JSON.parse(data) : null;

    // Simulate Network Latency
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Custom Mock Server Logic
    try {
      if (url?.includes('/api/auth/login') && method === 'post') {
        const { email, password } = body;
        if (password && email) {
          // Allow any login for convenience in field preview, default fallback
          const matchedUser: User = {
            id: 'u1',
            name: email.split('@')[0].toUpperCase(),
            email: email,
            role: 'Líder de Operaciones Senior',
            token: 'mock-jwt-token-99887711'
          };
          localStorage.setItem('agro_user', JSON.stringify(matchedUser));
          return createMockResponse(matchedUser);
        } else {
          return createMockErrorResponse(400, 'Correo y contraseña requeridos');
        }
      }

      if (url?.includes('/api/auth/logout') && method === 'post') {
        localStorage.removeItem('agro_user');
        return createMockResponse({ loggedOut: true });
      }

      // Harvests list
      if (url?.endsWith('/api/harvests') && method === 'get') {
        const harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        return createMockResponse(harvests);
      }

      // Single harvest fetch
      const harvestIdMatch = url?.match(/\/api\/harvests\/([a-zA-Z0-9_-]+)$/);
      if (harvestIdMatch && method === 'get') {
        const harvestId = harvestIdMatch[1];
        const harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        const harvest = harvests.find((h) => h.id === harvestId);
        if (harvest) {
          return createMockResponse(harvest);
        } else {
          return createMockErrorResponse(404, 'Cosecha no encontrada');
        }
      }

      // Add harvest (POST)
      if (url?.endsWith('/api/harvests') && method === 'post') {
        const harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        const newHarvest: Harvest = {
          ...body,
          id: 'harvest_' + Date.now().toString(36),
        };
        harvests.unshift(newHarvest);
        localStorage.setItem('agro_harvests', JSON.stringify(harvests));
        return createMockResponse(newHarvest);
      }

      // Edit harvest (PUT)
      if (harvestIdMatch && method === 'put') {
        const harvestId = harvestIdMatch[1];
        const harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        const index = harvests.findIndex((h) => h.id === harvestId);
        if (index !== -1) {
          const updated: Harvest = { ...harvests[index], ...body };
          harvests[index] = updated;
          localStorage.setItem('agro_harvests', JSON.stringify(harvests));
          return createMockResponse(updated);
        } else {
          return createMockErrorResponse(404, 'Cosecha no encontrada para editar');
        }
      }

      // Delete harvest (DELETE)
      if (harvestIdMatch && method === 'delete') {
        const harvestId = harvestIdMatch[1];
        let harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        const filtered = harvests.filter((h) => h.id !== harvestId);
        localStorage.setItem('agro_harvests', JSON.stringify(filtered));
        return createMockResponse({ id: harvestId, deleted: true });
      }

      // Statistics retrieval
      if (url?.includes('/api/statistics') && method === 'get') {
        const harvests: Harvest[] = JSON.parse(localStorage.getItem('agro_harvests') || '[]');
        const totalHarvests = harvests.length;
        const totalWeight = harvests.reduce((acc, h) => acc + (h.estimatedWeight || 0), 0);
        const estimatedEarnings = harvests.reduce((acc, h) => acc + (h.estimatedValue || 0), 0);

        const vehicles: Vehicle[] = JSON.parse(localStorage.getItem('agro_vehicles') || '[]');
        const activeVehicles = vehicles.filter((v) => v.status === 'Activo').length;
        const inMaintenanceVehicles = vehicles.filter((v) => v.status === 'Mantenimiento').length;

        const stats: Statistics = {
          totalHarvests,
          totalWeight,
          estimatedEarnings,
          activeVehicles,
          inMaintenanceVehicles,
        };

        return createMockResponse(stats);
      }

      // Default mock fallback or trigger real network request if configured
      return Promise.reject(error);
    } catch (e: any) {
      return createMockErrorResponse(500, e.message || 'Error de simulación del servidor');
    }
  }
);

// Helpers to simulate correct mock formatting
function createMockResponse(data: any): Promise<any> {
  return Promise.resolve({
    data: {
      success: true,
      data,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  });
}

function createMockErrorResponse(status: number, message: string): Promise<any> {
  const customError = new AxiosError(
    message,
    status.toString(),
    {} as any,
    {} as any,
    {
      data: { success: false, message },
      status,
      statusText: 'Error',
      headers: {},
      config: {} as any,
    }
  );
  return Promise.reject(customError);
}
