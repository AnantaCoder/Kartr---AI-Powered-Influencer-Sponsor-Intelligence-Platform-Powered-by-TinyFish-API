/**
 * useCampaigns Hook
 * Custom hook for campaign operations with loading/error states
 */
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  inactivateCampaign,
  setSelectedCampaign,
  clearError,
  selectCampaigns,
  selectSelectedCampaign,
  selectCampaignLoading,
  selectCampaignError,
} from '../store/slices/campaignSlice';
import type { Campaign, CampaignCreateRequest, CampaignUpdateRequest } from '../types/campaign';

export const useCampaigns = () => {
  const dispatch = useAppDispatch();
  const campaigns = useAppSelector(selectCampaigns);
  const selectedCampaign = useAppSelector(selectSelectedCampaign);
  const loading = useAppSelector(selectCampaignLoading);
  const error = useAppSelector(selectCampaignError);

  const loadCampaigns = useCallback(
    (page?: number, pageSize?: number) => {
      return dispatch(fetchCampaigns({ page, pageSize }));
    },
    [dispatch]
  );

  const create = useCallback(
    (data: CampaignCreateRequest) => {
      return dispatch(createCampaign(data));
    },
    [dispatch]
  );

  const update = useCallback(
    (id: string, data: CampaignUpdateRequest) => {
      return dispatch(updateCampaign({ id, data }));
    },
    [dispatch]
  );

  const remove = useCallback(
    (id: string) => {
      return dispatch(deleteCampaign(id));
    },
    [dispatch]
  );

  const activate = useCallback(
    (id: string) => {
      return dispatch(activateCampaign(id));
    },
    [dispatch]
  );

  const pause = useCallback(
    (id: string) => {
      return dispatch(pauseCampaign(id));
    },
    [dispatch]
  );

  const inactivate = useCallback(
    (id: string) => {
      // @ts-ignore
      return dispatch(inactivateCampaign(id));
    },
    [dispatch]
  );

  const selectCampaign = useCallback(
    (campaign: Campaign | null) => {
      dispatch(setSelectedCampaign(campaign));
    },
    [dispatch]
  );

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    campaigns,
    selectedCampaign,
    loading,
    error,
    // Actions
    loadCampaigns,
    create,
    update,
    remove,
    activate,
    pause,
    inactivate,
    selectCampaign,
    dismissError,
  };
};

export default useCampaigns;
