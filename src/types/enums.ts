
// Core enum types for type safety across the application
export type UserRole = 'admin' | 'employee' | 'accountant' | 'operation' | 'sales_manager';
export type EmploymentType = 'full-time' | 'part-time' | 'casual';
export type PayrollStatus = 'pending' | 'approved' | 'paid';
export type BulkPayrollStatus = 'draft' | 'processing' | 'completed' | 'failed';
export type BulkPayrollItemStatus = 'pending' | 'processed' | 'failed';
export type ClientStatus = 'active' | 'inactive';
export type ProjectStatus = 'active' | 'completed' | 'on-hold';
export type RosterStatus = 'pending' | 'confirmed' | 'cancelled';
export type WorkingHoursStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type NotificationActionType = 'approve' | 'confirm' | 'grant' | 'cancel' | 'reject' | 'none';
export type NotificationPriority = 'low' | 'medium' | 'high';
export type BankTransactionType = 'deposit' | 'withdrawal';
export type TransactionCategory = 'income' | 'expense' | 'transfer' | 'salary' | 'equipment' | 'materials' | 'travel' | 'office' | 'utilities' | 'marketing' | 'other';
