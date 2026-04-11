/**
 * Admin module types
 */

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  user_type: 'admin' | 'sponsor' | 'influencer';
  is_active: boolean;
  date_registered: string;
  bluesky_handle?: string;
}

export interface UserListResponse {
  users: AdminUser[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface UserUpdateRequest {
  username?: string;
  email?: string;
  full_name?: string;
  user_type?: 'admin' | 'sponsor' | 'influencer';
  is_active?: boolean;
}

export interface UserFilterParams {
  user_type?: 'admin' | 'sponsor' | 'influencer';
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PlatformAnalytics {
  total_users: number;
  total_sponsors: number;
  total_influencers: number;
  total_admins: number;
  new_users_today: number;
  new_users_this_week: number;
  active_users: number;
}

export interface AdminDashboardResponse {
  analytics: PlatformAnalytics;
  recent_users: AdminUser[];
}

export interface AdminState {
  users: AdminUser[];
  selectedUser: AdminUser | null;
  analytics: PlatformAnalytics | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}
