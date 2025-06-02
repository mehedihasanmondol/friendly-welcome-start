
import { RosterStatus } from './enums';
import { Profile } from './profile';
import { Client } from './client';
import { Project } from './project';

export interface RosterProfile {
  id: string;
  roster_id: string;
  profile_id: string;
  created_at: string;
  profiles?: Profile;
}

export interface Roster {
  id: string;
  profile_id: string;
  client_id: string;
  project_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  status: RosterStatus;
  notes?: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  expected_profiles?: number;
  per_hour_rate?: number;
  is_editable?: boolean;
  end_date?: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
  roster_profiles?: RosterProfile[];
}
