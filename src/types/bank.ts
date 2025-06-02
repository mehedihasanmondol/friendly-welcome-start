
import { BankTransactionType, TransactionCategory } from './enums';
import { Profile } from './profile';
import { Client } from './client';
import { Project } from './project';

export interface BankAccount {
  id: string;
  profile_id: string;
  bank_name: string;
  account_number: string;
  bsb_code?: string;
  swift_code?: string;
  account_holder_name: string;
  opening_balance: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  description: string;
  amount: number;
  type: BankTransactionType;
  category: TransactionCategory;
  date: string;
  created_at: string;
  updated_at: string;
  client_id?: string;
  project_id?: string;
  profile_id?: string;
  bank_account_id?: string;
  clients?: Client;
  projects?: Project;
  profiles?: Profile;
  bank_accounts?: BankAccount;
}
