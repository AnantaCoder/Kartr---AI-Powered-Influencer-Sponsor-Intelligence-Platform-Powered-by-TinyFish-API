/**
 * Discovery Redux Slice
 * Manages influencer discovery state
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DiscoveryState, DiscoverySearchParams, InfluencerMatch } from '../../types/discovery';
import discoveryService from '../../services/discoveryService';
import campaignService from '../../services/campaignService';

const initialState: DiscoveryState = {
  searchResults: [],
  loading: false,
  error: null,
  lastSearch: null,
};

// Async thunks
export const searchInfluencers = createAsyncThunk(
  'discovery/searchInfluencers',
  async (params: DiscoverySearchParams, { rejectWithValue }) => {
    try {
      const response = await discoveryService.discoverInfluencers(params);
      return { results: response.influencers, params };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Search failed');
    }
  }
);

export const findCampaignInfluencers = createAsyncThunk(
  'discovery/findCampaignInfluencers',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const response = await campaignService.getCampaignInfluencers(campaignId, true);
      return response.matched_influencers;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to find influencers');
    }
  }
);

export const addInfluencerToCampaign = createAsyncThunk(
  'discovery/addInfluencerToCampaign',
  async (
    { campaignId, influencerId, notes }: { campaignId: string; influencerId: string; notes?: string },
    { rejectWithValue }
  ) => {
    try {
      await campaignService.addInfluencerToCampaign(campaignId, influencerId, notes);
      return influencerId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to add influencer');
    }
  }
);

const discoverySlice = createSlice({
  name: 'discovery',
  initialState,
  reducers: {
    clearResults: (state) => {
      state.searchResults = [];
      state.lastSearch = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateInfluencerStatus: (state, action: PayloadAction<{ id: string; status: InfluencerMatch['status'] }>) => {
      const influencer = state.searchResults.find((i) => i.influencer_id === action.payload.id);
      if (influencer) {
        influencer.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // searchInfluencers
      .addCase(searchInfluencers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchInfluencers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.results;
        state.lastSearch = action.payload.params;
      })
      .addCase(searchInfluencers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // findCampaignInfluencers
      .addCase(findCampaignInfluencers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findCampaignInfluencers.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(findCampaignInfluencers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // addInfluencerToCampaign
      .addCase(addInfluencerToCampaign.fulfilled, (state, action) => {
        const influencer = state.searchResults.find((i) => i.influencer_id === action.payload);
        if (influencer) {
          influencer.status = 'invited';
        }
      });
  },
});

export const { clearResults, clearError, updateInfluencerStatus } = discoverySlice.actions;

// Selectors
export const selectSearchResults = (state: { discovery: DiscoveryState }) => state.discovery.searchResults;
export const selectDiscoveryLoading = (state: { discovery: DiscoveryState }) => state.discovery.loading;
export const selectDiscoveryError = (state: { discovery: DiscoveryState }) => state.discovery.error;
export const selectLastSearch = (state: { discovery: DiscoveryState }) => state.discovery.lastSearch;

export default discoverySlice.reducer;
