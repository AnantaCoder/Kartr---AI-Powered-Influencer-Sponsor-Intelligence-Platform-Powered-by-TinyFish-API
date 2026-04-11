/**
 * Influencer discovery module types
 */

export interface ChannelStats {
  total_subscribers: number;
  total_views: number;
  total_channels: number;
  average_videos: number;
  channels: ChannelInfo[];
}

export interface ChannelInfo {
  title: string;
  subscribers: number;
  niche?: string;
}

export interface InfluencerMatch {
  influencer_id: string;
  username: string;
  full_name: string;
  relevance_score: number;
  matching_keywords: string[];
  channel_stats: ChannelStats | null;
  ai_analysis: string | null;
  status: 'suggested' | 'invited' | 'accepted' | 'declined';
}

export interface DiscoverySearchParams {
  niche: string;
  keywords?: string;
  description?: string;
  name?: string;
  limit?: number;
}

export interface DiscoveryResponse {
  influencers: InfluencerMatch[];
  total_count: number;
  niche: string;
  keywords: string[];
}

export interface CampaignInfluencersResponse {
  campaign: {
    id: string;
    name: string;
  };
  matched_influencers: InfluencerMatch[];
  total_matches: number;
}

export interface DiscoveryState {
  searchResults: InfluencerMatch[];
  loading: boolean;
  error: string | null;
  lastSearch: DiscoverySearchParams | null;
}
