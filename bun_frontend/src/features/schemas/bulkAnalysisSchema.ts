// Input Request (matches backend AnalyzeChannelRequest)
export type BulkAnalysisRequest = {
  channel_id: string;
  max_videos: number;
};

// Channel Information
export type ChannelData = {
  channel_id: string;
  title: string;
  description: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  thumbnail_url: string;
  custom_url: string;
};

// Individual Video Data
export type VideoData = {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  thumbnail_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_sponsored: boolean;
  sponsor_name: string | null;
};

// Backend response type
export interface BulkAnalysisResponse {
  channel: ChannelData;
  videos: VideoData[];
  error?: string;
}
