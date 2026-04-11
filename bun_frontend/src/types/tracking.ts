/**
 * Performance tracking module types
 */

export type EventType = 'view' | 'click' | 'conversion' | 'engagement';

export interface PerformanceLogCreate {
  campaign_id: string;
  influencer_id: string;
  event_type: EventType;
  value?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceLogResponse {
  id: string;
  campaign_id: string;
  influencer_id: string;
  event_type: EventType;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  click_through_rate: number;
  conversion_rate: number;
  engagement_rate: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  metrics: PerformanceMetrics;
  trend: 'up' | 'down' | 'stable';
  period_start: string;
  period_end: string;
}

export interface InfluencerPerformance {
  influencer_id: string;
  influencer_name: string;
  metrics: PerformanceMetrics;
  campaigns_count: number;
}

export interface TrackingState {
  campaignPerformance: CampaignPerformance | null;
  influencerPerformance: InfluencerPerformance | null;
  logs: PerformanceLogResponse[];
  loading: boolean;
  error: string | null;
}
