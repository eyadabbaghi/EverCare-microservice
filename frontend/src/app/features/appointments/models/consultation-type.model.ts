export interface ConsultationType {
  typeId: string;
  name: string;
  description: string;
  defaultDurationMinutes: number;
  requiresCaregiver: boolean;
  environmentPreset: 'STANDARD' | 'CALM' | 'HIGH_CONTRAST' | 'DARK';
  active: boolean;
}
