import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import type { YoutubeResult, YoutubeAnalysis } from "../../features/schemas/youtubeSchema"
import apiClient from "../../services/apiClient"

type YoutubeState = {
  results: YoutubeResult[]
  loading: boolean
  error: string | null
}

const initialState: YoutubeState = {
  results: [],
  loading: false,
  error: null
}

// Backend response type (matches AnalyzeVideoResponse from backend)
interface AnalyzeVideoResponse {
  video_id: string
  title: string
  description?: string
  view_count: number
  like_count: number
  comment_count?: number
  published_at?: string
  thumbnail_url?: string
  channel_id?: string
  channel_title?: string
  tags?: string[]
  analysis?: {
    is_sponsored?: boolean
    sponsor_name?: string
    sponsor_industry?: string
    influencer_niche?: string
    content_summary?: string
    sentiment?: string
    key_topics?: string[]
    error?: string
  }
  gemini_raw_response?: string
  model_used?: string
  error?: string
}

// Transform backend response to frontend YoutubeResult format
const transformResponse = (data: AnalyzeVideoResponse): YoutubeResult => {
  const sponsors = data.analysis?.sponsor_name
    ? [{ name: data.analysis.sponsor_name, industry: data.analysis.sponsor_industry }]
    : []

  return {
    video_id: data.video_id,
    title: data.title,
    description: data.description,
    thumbnail_url: data.thumbnail_url,
    view_count: data.view_count,
    like_count: data.like_count,
    channel_name: data.channel_title,
    creator_name: data.channel_title,
    creator_industry: data.analysis?.influencer_niche,
    sponsors,
    model_used: data.model_used,
    analysis: data.analysis ? {
      is_sponsored: data.analysis.is_sponsored,
      sponsor_name: data.analysis.sponsor_name,
      sponsor_industry: data.analysis.sponsor_industry,
      influencer_niche: data.analysis.influencer_niche,
      content_summary: data.analysis.content_summary,
      sentiment: data.analysis.sentiment,
      key_topics: data.analysis.key_topics,
      error: data.analysis.error,
    } : undefined
  }
}



// Bulk response type
interface AnalyzeBulkResponse {
  results: AnalyzeVideoResponse[]
  total_count: number
  success_count: number
  failed_count: number
}

export const fetchYoutubeResults = createAsyncThunk<
  YoutubeResult[],
  string | string[]
>("youtube/fetchResults", async (input, thunkAPI) => {
  try {
    const isBulk = Array.isArray(input) || (typeof input === "string" && (input.includes(",") || input.includes("\n")));

    if (isBulk) {
      const urls = Array.isArray(input)
        ? input
        : input.split(/[,\n]/).map(u => u.trim()).filter(u => u.length > 0);

      const res = await apiClient.post<AnalyzeBulkResponse>(
        "/youtube/analyze-bulk",
        { video_urls: urls }
      );

      // Transform all results
      return res.data.results.map(transformResponse);
    } else {
      // Use apiClient which has baseURL and auth token injection
      const res = await apiClient.post<AnalyzeVideoResponse>(
        "/youtube/analyze-video",
        { video_url: input }
      );

      // Check for error in response
      if (res.data.error) {
        return thunkAPI.rejectWithValue(res.data.error);
      }

      // Transform and return as array
      const result = transformResponse(res.data);
      return [result];
    }
  } catch (error: any) {
    // Handle different error types
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "Failed to analyze video";
    return thunkAPI.rejectWithValue(errorMessage);
  }
});

export const analyzeVideoFile = createAsyncThunk<
  YoutubeResult[],
  FormData
>("youtube/analyzeFile", async (formData, thunkAPI) => {
  try {
    const res = await apiClient.post<AnalyzeVideoResponse>(
      "/youtube/analyze-video-file",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (res.data.error) {
      return thunkAPI.rejectWithValue(res.data.error);
    }

    const result = transformResponse(res.data);
    return [result];
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "Failed to analyze video file";
    return thunkAPI.rejectWithValue(errorMessage);
  }
});



const youtubeSlice = createSlice({
  name: "youtube",
  initialState,
  reducers: {
    clearResults: (state) => {
      state.results = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchYoutubeResults.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchYoutubeResults.fulfilled, (state, action) => {
        state.loading = false
        state.results = action.payload
      })
      .addCase(fetchYoutubeResults.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || "Failed to fetch results"
      })
      .addCase(analyzeVideoFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeVideoFile.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(analyzeVideoFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to analyze file";
      })
  }
})

export const { clearResults } = youtubeSlice.actions
export default youtubeSlice.reducer
