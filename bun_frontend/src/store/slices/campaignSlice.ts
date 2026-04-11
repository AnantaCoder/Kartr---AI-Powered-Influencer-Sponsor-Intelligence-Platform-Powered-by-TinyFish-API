/**
 * Campaign Redux Slice
 * Manages sponsor campaign state
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Campaign, CampaignState, CampaignCreateRequest, CampaignUpdateRequest } from '../../types/campaign';
import campaignService from '../../services/campaignService';

const initialState: CampaignState = {
  campaigns: [],
  selectedCampaign: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
};

// Helper to safely extract error message
const getErrorMessage = (error: any, defaultMessage: string) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      // Handle Pydantic validation errors
      return detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
    }
    return JSON.stringify(detail);
  }
  return defaultMessage;
};

// Async thunks
export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
    try {
      return await campaignService.listCampaigns(page, pageSize);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch campaigns'));
    }
  }
);

export const createCampaign = createAsyncThunk(
  'campaigns/createCampaign',
  async (data: CampaignCreateRequest, { rejectWithValue }) => {
    try {
      return await campaignService.createCampaign(data);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create campaign'));
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async ({ id, data }: { id: string; data: CampaignUpdateRequest }, { rejectWithValue }) => {
    try {
      return await campaignService.updateCampaign(id, data);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update campaign'));
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      await campaignService.deleteCampaign(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete campaign'));
    }
  }
);

export const activateCampaign = createAsyncThunk(
  'campaigns/activateCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      return await campaignService.activateCampaign(id);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to activate campaign'));
    }
  }
);

export const pauseCampaign = createAsyncThunk(
  'campaigns/pauseCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      return await campaignService.pauseCampaign(id);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to pause campaign'));
    }
  }
);

export const inactivateCampaign = createAsyncThunk(
  'campaigns/inactivateCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      return await campaignService.inactivateCampaign(id);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error, 'Failed to inactivate campaign'));
    }
  }
);

const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setSelectedCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.selectedCampaign = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCampaigns
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns = action.payload.campaigns;
        state.totalCount = action.payload.total_count;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createCampaign
      .addCase(createCampaign.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.loading = false;
        state.campaigns.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateCampaign
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
        if (state.selectedCampaign?.id === action.payload.id) {
          state.selectedCampaign = action.payload;
        }
      })
      // deleteCampaign
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c.id !== action.payload);
        state.totalCount -= 1;
      })
      // activateCampaign
      .addCase(activateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      // pauseCampaign
      .addCase(pauseCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      })
      // inactivateCampaign
      .addCase(inactivateCampaign.fulfilled, (state, action) => {
        const index = state.campaigns.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.campaigns[index] = action.payload;
        }
      });
  },
});

export const { setSelectedCampaign, clearError } = campaignSlice.actions;

// Selectors
export const selectCampaigns = (state: { campaigns: CampaignState }) => state.campaigns.campaigns;
export const selectSelectedCampaign = (state: { campaigns: CampaignState }) => state.campaigns.selectedCampaign;
export const selectCampaignLoading = (state: { campaigns: CampaignState }) => state.campaigns.loading;
export const selectCampaignError = (state: { campaigns: CampaignState }) => state.campaigns.error;

export default campaignSlice.reducer;
