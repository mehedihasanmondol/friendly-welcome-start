
import { ClientStatus } from './enums';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}
