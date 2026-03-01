export interface DailyTask {
  id?: number;
  patientId: string;
  title: string;
  taskType: 'MEDICATION' | 'MEAL' | 'EXERCISE' | 'APPOINTMENT' | 'SOCIAL' | 'OTHER';
  scheduledTime: string; // must be "HH:mm"
  completed: boolean;
  notes?: string;
}
