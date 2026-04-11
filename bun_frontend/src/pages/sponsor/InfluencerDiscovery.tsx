/**
 * Influencer Discovery Page
 * AI-powered influencer search with YouTube analytics
 */
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles } from 'lucide-react';
import { useSponsorGuard } from '../../hooks/useRoleGuard';
import { useDiscovery } from '../../hooks/useDiscovery';
import { useCampaigns } from '../../hooks/useCampaigns';
import SearchFilters from '../../components/discovery/SearchFilters';
import InfluencerCard from '../../components/discovery/InfluencerCard';
import type { Campaign } from '../../types/campaign';

const InfluencerDiscovery = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const campaignId = searchParams.get('campaign');

    const { isLoading: authLoading, isAuthorized } = useSponsorGuard();
    const { searchResults, loading, error, searchImmediate, addToCampaign, clear } = useDiscovery();
    const { campaigns, loadCampaigns, selectedCampaign, selectCampaign } = useCampaigns();

    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaignId);

    useEffect(() => {
        if (isAuthorized) {
            loadCampaigns();
        }
    }, [isAuthorized, loadCampaigns]);

    useEffect(() => {
        if (campaignId && campaigns.length > 0 && !selectedCampaignId) {
            const campaign = campaigns.find((c) => c.id === campaignId);
            if (campaign) {
                selectCampaign(campaign);
                setSelectedCampaignId(campaign.id);
            }
        }
    }, [campaignId, campaigns, selectCampaign, selectedCampaignId]);

    const handleSearch = async (niche: string, keywords: string, name: string) => {
        await searchImmediate({
            niche,
            keywords,
            description: '', // Legacy param (description removed from UI)
            name,
            limit: 20,
        });
    };

    const handleAddToCampaign = async (influencerId: string) => {
        if (selectedCampaignId) {
            await addToCampaign(selectedCampaignId, influencerId);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <button
                        onClick={() => navigate('/sponsor')}
                        className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Discover Influencers</h1>
                        <p className="text-gray-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            AI-powered matching with YouTube analytics
                        </p>
                    </div>
                </motion.div>

                {/* Campaign Selector */}
                {campaigns.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6"
                    >
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Add influencers to campaign (optional)
                        </label>
                        <select
                            value={selectedCampaignId || ''}
                            onChange={(e) => setSelectedCampaignId(e.target.value || null)}
                            className="w-full max-w-md px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">No campaign selected</option>
                            {campaigns
                                .filter((c) => c.status !== 'completed')
                                .map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name} ({campaign.status})
                                    </option>
                                ))}
                        </select>
                    </motion.div>
                )}

                {/* Search Filters */}
                <div className="mb-8">
                    <SearchFilters onSearch={handleSearch} loading={loading} />
                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Results */}
                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-400" />
                                {searchResults.length} Influencers Found
                            </h2>
                            <button
                                onClick={clear}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Clear Results
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((influencer) => (
                                <InfluencerCard
                                    key={influencer.influencer_id}
                                    influencer={influencer}
                                    onAddToCampaign={selectedCampaignId ? handleAddToCampaign : undefined}
                                    showAddButton={!!selectedCampaignId}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && searchResults.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Find Your Perfect Influencers
                        </h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Enter a niche and keywords above to discover influencers that match your campaign.
                            Our AI analyzes YouTube content to find the most relevant creators.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default InfluencerDiscovery;
