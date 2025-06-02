
import { PayrollStatus, BulkPayrollStatus, BulkPayrollItemStatus } from './enums';
import { Profile } from './profile';
import { Client } from './client';
import { Project } from './project';
import { BankAccount } from './bank';

export interface Payroll {
  id: string;
  profile_id: string;
  pay_period_start: string;
  pay_period_end: string;
  total_hours: number;
  hourly_rate: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  status: PayrollStatus;
  created_at: string;
  updated_at: string;
  bank_account_id?: string;
  profiles?: Profile;
  bank_accounts?: BankAccount;
}

export interface BulkPayroll {
  id: string;
  name: string;
  description?: string;
  pay_period_start: string;
  pay_period_end: string;
  created_by: string;
  status: BulkPayrollStatus;
  total_records: number;
  processed_records: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  bulk_payroll_items?: BulkPayrollItem[];
  profiles?: Profile;
}

export interface BulkPayrollItem {
  id: string;
  bulk_payroll_id: string;
  profile_id: string;
  payroll_id?: string;
  status: BulkPayrollItemStatus;
  error_message?: string;
  created_at: string;
  profiles?: Profile;
  payroll?: Payroll;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description?: string;
  profile_id?: string;
  client_id?: string;
  project_id?: string;
  bank_account_id?: string;
  base_hourly_rate: number;
  overtime_multiplier: number;
  deduction_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  clients?: Client;
  projects?: Project;
  bank_accounts?: BankAccount;
}
