/**
 * useDiscovery Hook
 * Custom hook for influencer discovery with debounced search
 */
import { useCallback, useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  searchInfluencers,
  findCampaignInfluencers,
  addInfluencerToCampaign,
  clearResults,
  clearError,
  selectSearchResults,
  selectDiscoveryLoading,
  selectDiscoveryError,
  selectLastSearch,
} from '../store/slices/discoverySlice';
import type { DiscoverySearchParams } from '../types/discovery';

interface UseDiscoveryOptions {
  debounceMs?: number;
}

export const useDiscovery = (options: UseDiscoveryOptions = {}) => {
  const { debounceMs = 500 } = options;
  const dispatch = useAppDispatch();
  const searchResults = useAppSelector(selectSearchResults);
  const loading = useAppSelector(selectDiscoveryLoading);
  const error = useAppSelector(selectDiscoveryError);
  const lastSearch = useAppSelector(selectLastSearch);

  const [searchParams, setSearchParams] = useState<DiscoverySearchParams | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!searchParams) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      dispatch(searchInfluencers(searchParams));
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchParams, debounceMs, dispatch]);

  const search = useCallback((params: DiscoverySearchParams) => {
    setSearchParams(params);
  }, []);

  const searchImmediate = useCallback(
    (params: DiscoverySearchParams) => {
      return dispatch(searchInfluencers(params));
    },
    [dispatch]
  );

  const findForCampaign = useCallback(
    (campaignId: string) => {
      return dispatch(findCampaignInfluencers(campaignId));
    },
    [dispatch]
  );

  const addToCampaign = useCallback(
    (campaignId: string, influencerId: string, notes?: string) => {
      return dispatch(addInfluencerToCampaign({ campaignId, influencerId, notes }));
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    dispatch(clearResults());
    setSearchParams(null);
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    searchResults,
    loading,
    error,
    lastSearch,
    // Actions
    search,
    searchImmediate,
    findForCampaign,
    addToCampaign,
    clear,
    dismissError,
  };
};

export default useDiscovery;
