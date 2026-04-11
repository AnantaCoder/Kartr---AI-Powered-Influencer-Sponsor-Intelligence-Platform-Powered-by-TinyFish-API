/**
 * Admin Redux Slice
 * Manages admin state: users, analytics, dashboard
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AdminState, AdminUser, UserFilterParams, PlatformAnalytics } from '../../types/admin';
import adminService from '../../services/adminService';

const initialState: AdminState = {
  users: [],
  selectedUser: null,
  analytics: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 20,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params: UserFilterParams | undefined, { rejectWithValue }) => {
    try {
      return await adminService.listUsers(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getAnalytics();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analytics');
    }
  }
);

export const fetchDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getDashboard();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch dashboard');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, data }: { userId: string; data: Partial<AdminUser> }, { rejectWithValue }) => {
    try {
      return await adminService.updateUser(userId, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async ({ userId, hardDelete = false }: { userId: string; hardDelete?: boolean }, { rejectWithValue }) => {
    try {
      await adminService.deleteUser(userId, hardDelete);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete user');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<AdminUser | null>) => {
      state.selectedUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.totalCount = action.payload.total_count;
        state.currentPage = action.payload.page;
        state.pageSize = action.payload.page_size;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchAnalytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchDashboard
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.analytics = action.payload.analytics;
        state.users = action.payload.recent_users;
      })
      // updateUser
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        state.selectedUser = null;
      })
      // deleteUser
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      });
  },
});

export const { setSelectedUser, clearError, setPage } = adminSlice.actions;

// Selectors
export const selectUsers = (state: { admin: AdminState }) => state.admin.users;
export const selectSelectedUser = (state: { admin: AdminState }) => state.admin.selectedUser;
export const selectAnalytics = (state: { admin: AdminState }) => state.admin.analytics;
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.loading;
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error;

export default adminSlice.reducer;
