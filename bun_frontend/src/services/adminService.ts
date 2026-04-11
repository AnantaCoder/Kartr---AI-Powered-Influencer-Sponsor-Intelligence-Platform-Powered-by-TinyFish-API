/**
 * Admin API Service
 * Handles all admin-related API calls
 */
import apiClient from './apiClient';
import type {
  AdminUser,
  UserListResponse,
  UserUpdateRequest,
  UserFilterParams,
  PlatformAnalytics,
  AdminDashboardResponse,
} from '../types/admin';

const ADMIN_BASE = '/admin';

/**
 * List all users with optional filters
 */
export const listUsers = async (params?: UserFilterParams): Promise<UserListResponse> => {
  const response = await apiClient.get(`${ADMIN_BASE}/users`, { params });
  return response.data;
};

/**
 * List only sponsors
 */
export const listSponsors = async (page = 1, pageSize = 20): Promise<UserListResponse> => {
  const response = await apiClient.get(`${ADMIN_BASE}/sponsors`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

/**
 * List only influencers
 */
export const listInfluencers = async (page = 1, pageSize = 20): Promise<UserListResponse> => {
  const response = await apiClient.get(`${ADMIN_BASE}/influencers`, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

/**
 * Get a specific user by ID
 */
export const getUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiClient.get(`${ADMIN_BASE}/users/${userId}`);
  return response.data;
};

/**
 * Update user details
 */
export const updateUser = async (
  userId: string,
  data: UserUpdateRequest
): Promise<AdminUser> => {
  const response = await apiClient.put(`${ADMIN_BASE}/users/${userId}`, data);
  return response.data;
};

/**
 * Delete a user (soft delete by default)
 */
export const deleteUser = async (
  userId: string,
  hardDelete = false
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`${ADMIN_BASE}/users/${userId}`, {
    params: { hard_delete: hardDelete },
  });
  return response.data;
};

/**
 * Get platform analytics
 */
export const getAnalytics = async (): Promise<PlatformAnalytics> => {
  const response = await apiClient.get(`${ADMIN_BASE}/analytics`);
  return response.data;
};

/**
 * Get full admin dashboard data
 */
export const getDashboard = async (): Promise<AdminDashboardResponse> => {
  const response = await apiClient.get(`${ADMIN_BASE}/dashboard`);
  return response.data;
};

export default {
  listUsers,
  listSponsors,
  listInfluencers,
  getUser,
  updateUser,
  deleteUser,
  getAnalytics,
  getDashboard,
};
