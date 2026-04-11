/**
 * Tracking Redux Slice
 * Manages performance tracking state
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { TrackingState, PerformanceLogCreate } from '../../types/tracking';
import trackingService from '../../services/trackingService';

const initialState: TrackingState = {
  campaignPerformance: null,
  influencerPerformance: null,
  logs: [],
  loading: false,
  error: null,
};

// Async thunks
export const logPerformanceEvent = createAsyncThunk(
  'tracking/logEvent',
  async (data: PerformanceLogCreate, { rejectWithValue }) => {
    try {
      return await trackingService.logEvent(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to log event');
    }
  }
);

export const fetchCampaignPerformance = createAsyncThunk(
  'tracking/fetchCampaignPerformance',
  async (
    { campaignId, startDate, endDate }: { campaignId: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      return await trackingService.getCampaignPerformance(campaignId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch performance');
    }
  }
);

export const fetchInfluencerPerformance = createAsyncThunk(
  'tracking/fetchInfluencerPerformance',
  async (
    { influencerId, startDate, endDate }: { influencerId: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      return await trackingService.getInfluencerPerformance(influencerId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch performance');
    }
  }
);

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    clearPerformance: (state) => {
      state.campaignPerformance = null;
      state.influencerPerformance = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // logPerformanceEvent
      .addCase(logPerformanceEvent.fulfilled, (state, action) => {
        state.logs.unshift(action.payload);
      })
      // fetchCampaignPerformance
      .addCase(fetchCampaignPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.campaignPerformance = action.payload;
      })
      .addCase(fetchCampaignPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchInfluencerPerformance
      .addCase(fetchInfluencerPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInfluencerPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.influencerPerformance = action.payload;
      })
      .addCase(fetchInfluencerPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPerformance, clearError } = trackingSlice.actions;

// Selectors
export const selectCampaignPerformance = (state: { tracking: TrackingState }) => state.tracking.campaignPerformance;
export const selectInfluencerPerformance = (state: { tracking: TrackingState }) => state.tracking.influencerPerformance;
export const selectTrackingLoading = (state: { tracking: TrackingState }) => state.tracking.loading;
export const selectTrackingError = (state: { tracking: TrackingState }) => state.tracking.error;

export default trackingSlice.reducer;
