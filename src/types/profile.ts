
import { UserRole, EmploymentType } from './enums';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  full_address?: string;
  employment_type?: EmploymentType;
  hourly_rate?: number;
  salary?: number;
  tax_file_number?: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
}
