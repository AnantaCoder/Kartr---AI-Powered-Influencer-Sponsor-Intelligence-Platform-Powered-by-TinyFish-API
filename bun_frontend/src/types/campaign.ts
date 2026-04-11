/**
 * Campaign module types
 */

export interface InfluencerStageCounts {
  invited: number;
  accepted: number;
  in_progress: number;
  completed: number;
  rejected: number;
}

export interface Campaign {
  id: string;
  sponsor_id: string;
  name: string;
  description: string;
  niche: string;
  target_audience?: string;
  budget_min?: number;
  budget_max?: number;
  keywords: string[];
  requirements?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'inactive';
  created_at: string;
  updated_at: string;
  matched_influencers_count: number;
  // Influencer stage breakdown
  influencer_stages?: InfluencerStageCounts;
}

export interface CampaignCreateRequest {
  name: string;
  description: string;
  niche: string;
  target_audience?: string;
  budget_min?: number;
  budget_max?: number;
  keywords?: string[];
  requirements?: string;
}

export interface CampaignUpdateRequest {
  name?: string;
  description?: string;
  niche?: string;
  target_audience?: string;
  budget_min?: number;
  budget_max?: number;
  keywords?: string[];
  requirements?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface CampaignState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
