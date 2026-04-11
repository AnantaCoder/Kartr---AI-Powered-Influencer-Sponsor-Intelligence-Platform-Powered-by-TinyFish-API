/**
 * Tracking API Service
 * Handles performance tracking API calls
 */
import apiClient from './apiClient';
import type {
  PerformanceLogCreate,
  PerformanceLogResponse,
  CampaignPerformance,
  InfluencerPerformance,
} from '../types/tracking';

const TRACKING_BASE = '/tracking';

/**
 * Log a performance event
 */
export const logEvent = async (
  data: PerformanceLogCreate
): Promise<PerformanceLogResponse> => {
  const response = await apiClient.post(`${TRACKING_BASE}/log`, data);
  return response.data;
};

/**
 * Get performance metrics for a campaign
 */
export const getCampaignPerformance = async (
  campaignId: string,
  startDate?: string,
  endDate?: string
): Promise<CampaignPerformance> => {
  const response = await apiClient.get(`${TRACKING_BASE}/campaign/${campaignId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

/**
 * Get performance metrics for an influencer
 */
export const getInfluencerPerformance = async (
  influencerId: string,
  startDate?: string,
  endDate?: string
): Promise<InfluencerPerformance> => {
  const response = await apiClient.get(`${TRACKING_BASE}/influencer/${influencerId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export default {
  logEvent,
  getCampaignPerformance,
  getInfluencerPerformance,
};
