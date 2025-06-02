
import { NotificationActionType, NotificationPriority, UserRole } from './enums';

export interface RolePermission {
  id: string;
  role: UserRole;
  permission: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipient_profile_id: string;
  sender_profile_id?: string;
  related_id?: string;
  action_type: NotificationActionType;
  action_data?: any;
  is_read: boolean;
  is_actioned: boolean;
  priority: NotificationPriority;
  created_at: string;
  read_at?: string;
  actioned_at?: string;
}

export interface NotificationPermission {
  id: string;
  profile_id: string;
  can_create_notifications: boolean;
  can_create_bulk_notifications: boolean;
  created_at: string;
}
