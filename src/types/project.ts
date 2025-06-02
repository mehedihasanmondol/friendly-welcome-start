
import { ProjectStatus } from './enums';
import { Client } from './client';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  budget: number;
  created_at: string;
  updated_at: string;
  clients?: Client;
}
