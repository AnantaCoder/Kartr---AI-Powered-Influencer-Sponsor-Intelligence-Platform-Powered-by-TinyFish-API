import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { BulkAnalysisRequest, BulkAnalysisResponse, ChannelData, VideoData } from "../../features/schemas/bulkAnalysisSchema";
import apiClient from "../../services/apiClient";

export type BulkAnalysisState = {
  channel: ChannelData | null;
  videos: VideoData[];
  loading: boolean;
  error: string | null;
};

const initialState: BulkAnalysisState = {
  channel: null,
  videos: [],
  loading: false,
  error: null,
};

// Async thunk to fetch bulk analysis results
export const fetchBulkAnalysisResults = createAsyncThunk<
  BulkAnalysisResponse,
  BulkAnalysisRequest
>("bulkAnalysis/fetchResults", async (request, thunkAPI) => {
  try {
    // Make API call to backend
    const res = await apiClient.post<BulkAnalysisResponse>(
      "/youtube/analyze-channel",
      {
        channel_id: request.channel_id,
        max_videos: request.max_videos,
      }
    );

    // Check for error in response
    if (res.data.error) {
      return thunkAPI.rejectWithValue(res.data.error);
    }

    // Return response with channel and videos
    return res.data;
  } catch (error: any) {
    // Handle different error types
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "Failed to analyze channel";
    return thunkAPI.rejectWithValue(errorMessage);
  }
});

const bulkAnalysisSlice = createSlice({
  name: "bulkAnalysis",
  initialState,
  reducers: {
    clearResults: (state) => {
      state.channel = null;
      state.videos = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBulkAnalysisResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBulkAnalysisResults.fulfilled, (state, action) => {
        state.loading = false;
        state.channel = action.payload.channel;
        state.videos = action.payload.videos;
      })
      .addCase(fetchBulkAnalysisResults.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch results";
      });
  },
});

export const { clearResults } = bulkAnalysisSlice.actions;
export default bulkAnalysisSlice.reducer;
