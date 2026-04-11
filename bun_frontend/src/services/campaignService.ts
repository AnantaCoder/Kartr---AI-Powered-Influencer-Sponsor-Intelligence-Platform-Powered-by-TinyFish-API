/**
 * Campaign API Service
 * Handles all campaign-related API calls for sponsors
 */
import apiClient from './apiClient';
import type {
  Campaign,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  CampaignListResponse,
} from '../types/campaign';
import type { CampaignInfluencersResponse } from '../types/discovery';

const CAMPAIGNS_BASE = '/campaigns';

/**
 * Create a new campaign
 */
export const createCampaign = async (data: CampaignCreateRequest): Promise<Campaign> => {
  const response = await apiClient.post(CAMPAIGNS_BASE, data);
  return response.data;
};

/**
 * List all campaigns for the current sponsor
 */
export const listCampaigns = async (page = 1, pageSize = 20): Promise<CampaignListResponse> => {
  const response = await apiClient.get(CAMPAIGNS_BASE, {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

/**
 * Get a specific campaign by ID
 */
export const getCampaign = async (campaignId: string): Promise<Campaign> => {
  const response = await apiClient.get(`${CAMPAIGNS_BASE}/${campaignId}`);
  return response.data;
};

/**
 * Update a campaign
 */
export const updateCampaign = async (
  campaignId: string,
  data: CampaignUpdateRequest
): Promise<Campaign> => {
  const response = await apiClient.put(`${CAMPAIGNS_BASE}/${campaignId}`, data);
  return response.data;
};

/**
 * Delete a campaign
 */
export const deleteCampaign = async (
  campaignId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`${CAMPAIGNS_BASE}/${campaignId}`);
  return response.data;
};

/**
 * Get influencers for a campaign (optionally find new matches)
 */
export const getCampaignInfluencers = async (
  campaignId: string,
  findNew = false
): Promise<CampaignInfluencersResponse> => {
  const response = await apiClient.get(`${CAMPAIGNS_BASE}/${campaignId}/influencers`, {
    params: { find_new: findNew },
  });
  return response.data;
};

/**
 * Add an influencer to a campaign
 */
export const addInfluencerToCampaign = async (
  campaignId: string,
  influencerId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`${CAMPAIGNS_BASE}/${campaignId}/influencers`, {
    influencer_id: influencerId,
    notes,
  });
  return response.data;
};

/**
 * Activate a draft campaign
 */
export const activateCampaign = async (campaignId: string): Promise<Campaign> => {
  const response = await apiClient.post(`${CAMPAIGNS_BASE}/${campaignId}/activate`);
  return response.data;
};

/**
 * Pause an active campaign
 */
export const pauseCampaign = async (campaignId: string): Promise<Campaign> => {
  const response = await apiClient.post(`${CAMPAIGNS_BASE}/${campaignId}/pause`);
  return response.data;
};

/**
 * Mark a campaign as inactive
 */
export const inactivateCampaign = async (campaignId: string): Promise<Campaign> => {
  const response = await apiClient.post(`${CAMPAIGNS_BASE}/${campaignId}/inactivate`);
  return response.data;
};

/**
 * Mark a campaign as completed
 */
export const completeCampaign = async (campaignId: string): Promise<Campaign> => {
  const response = await apiClient.post(`${CAMPAIGNS_BASE}/${campaignId}/complete`);
  return response.data;
};

/**
 * Get invitations for the current influencer
 */
export const getInfluencerInvitations = async (): Promise<{ invitations: any[]; count: number }> => {
  // Use the dedicated influencer endpoint
  const response = await apiClient.get('/influencer/invitations');
  // Backend returns a list directly, so wrap it to match expected interface if needed, 
  // or update the return type. 
  // Py backend: returns lists of dicts. 
  // Let's assume it returns { invitations: [...] } or just [...]
  // Reading `mock_db` or logic: `CampaignService.get_influencer_invitations` returns `results` (list).
  // So response.data is the list.
  return { invitations: response.data, count: response.data.length };
};

/**
 * Respond to an invitation (accept/reject)
 */
export const respondToInvitation = async (
  campaignId: string,
  accept: boolean
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/influencer/campaigns/${campaignId}/respond`, {
    accept,
  });
  return response.data;
};

/**
 * Update campaign working status
 */
export const updateCampaignStatus = async (
  campaignId: string,
  status: 'in_progress' | 'completed' | 'cancelled'
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/influencer/campaigns/${campaignId}/status`, {
    status,
  });
  return response.data;
};

export default {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignInfluencers,
  addInfluencerToCampaign,
  activateCampaign,
  pauseCampaign,
  completeCampaign,
  inactivateCampaign,
  getInfluencerInvitations,
  respondToInvitation,
  updateCampaignStatus,
};
