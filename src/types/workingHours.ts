
import { WorkingHoursStatus } from './enums';
import { Profile } from './profile';
import { Client } from './client';
import { Project } from './project';

export interface WorkingHour {
  id: string;
  profile_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: WorkingHoursStatus;
  roster_id?: string;
  created_at: string;
  updated_at: string;
  sign_in_time?: string;
  sign_out_time?: string;
  actual_hours?: number;
  overtime_hours?: number;
  hourly_rate?: number;
  payable_amount?: number;
  notes?: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
}
