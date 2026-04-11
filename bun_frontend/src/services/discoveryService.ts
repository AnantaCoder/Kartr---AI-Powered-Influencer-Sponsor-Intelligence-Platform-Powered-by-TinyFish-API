/**
 * Discovery API Service
 * Handles influencer discovery and search API calls
 */
import apiClient from './apiClient';
import type { DiscoverySearchParams, DiscoveryResponse } from '../types/discovery';

const DISCOVERY_BASE = '/campaigns/discover';

/**
 * Discover influencers based on niche and keywords
 * Uses AI-powered matching with YouTube analytics
 */
export const discoverInfluencers = async (
  params: DiscoverySearchParams
): Promise<DiscoveryResponse> => {
  const response = await apiClient.get(`${DISCOVERY_BASE}/influencers`, {
    params: {
      niche: params.niche,
      keywords: params.keywords || '',
      description: params.description || '',
      name: params.name || '',
      limit: params.limit || 20,
    },
  });
  return response.data;
};

/**
 * Helper to format keywords from array to comma-separated string
 */
export const formatKeywords = (keywords: string[]): string => {
  return keywords.join(',');
};

/**
 * Helper to parse keywords from comma-separated string to array
 */
export const parseKeywords = (keywords: string): string[] => {
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
};

export default {
  discoverInfluencers,
  formatKeywords,
  parseKeywords,
};
