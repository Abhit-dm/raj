import { Ambulance, Bus, Car, Caravan, Construction, Container, Forklift, Tractor, Truck, Van, type LucideIcon } from 'lucide-react';
import type { TranslationKey } from '../i18n';

/* Must match VEHICLE_TYPES in backend/src/controllers/auth.controller.ts */
export const VEHICLE_TYPES: { code: string; icon: LucideIcon; key: TranslationKey }[] = [
  { code: 'CAR', icon: Car, key: 'v_CAR' },
  { code: 'VAN', icon: Van, key: 'v_VAN' },
  { code: 'BUS', icon: Bus, key: 'v_BUS' },
  { code: 'MINI_TRUCK', icon: Truck, key: 'v_MINI_TRUCK' },
  { code: 'LORRY', icon: Container, key: 'v_LORRY' },
  { code: 'TRUCK', icon: Truck, key: 'v_TRUCK' },
  { code: 'TRAILER', icon: Caravan, key: 'v_TRAILER' },
  { code: 'TANKER', icon: Container, key: 'v_TANKER' },
  { code: 'CRANE', icon: Construction, key: 'v_CRANE' },
  { code: 'TRACTOR', icon: Tractor, key: 'v_TRACTOR' },
  { code: 'AUTO', icon: Forklift, key: 'v_AUTO' },
  { code: 'AMBULANCE', icon: Ambulance, key: 'v_AMBULANCE' },
];

export const vehicleKey = (code: string) => (VEHICLE_TYPES.find((v) => v.code === code)?.key ?? 'v_CAR') as TranslationKey;

export const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'] as const;
