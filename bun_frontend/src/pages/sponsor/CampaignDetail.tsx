/**
 * Campaign Detail Page
 * Shows campaign details and influencer statuses for sponsors
 */
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Users,
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    Play,
    Pause,
    UserPlus,
    Loader2,
    FileText,
    Download,
    ExternalLink
} from 'lucide-react';
import { useSponsorGuard } from '../../hooks/useRoleGuard';
import apiClient from '../../services/apiClient';
import Header from '../../components/layout/Header';

interface CampaignInfluencer {
    influencer_id: string;
    influencer_name: string;
    status: 'invited' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
    added_at: string;
    notes?: string;
    post_url?: string;  // URL to completed post
}

interface Campaign {
    id: string;
    name: string;
    description: string;
    niche: string;
    budget_min: number;
    budget_max: number;
    status: string;
    created_at: string;
    influencers: CampaignInfluencer[];
}

const CampaignDetail = () => {
    const { campaignId } = useParams<{ campaignId: string }>();
    const navigate = useNavigate();
    const { isLoading: authLoading, isAuthorized } = useSponsorGuard();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampaignDetails = async () => {
            if (!campaignId || !isAuthorized) return;

            try {
                // Fetch campaign details
                const campaignRes = await apiClient.get(`/campaigns/${campaignId}`);

                // Fetch influencers for this campaign
                const influencersRes = await apiClient.get(`/campaigns/${campaignId}/influencers`);

                // Map the backend response to our interface
                // Backend returns: { matched_influencers: [{ influencer_id, username, full_name, status, ... }] }
                const influencerData = influencersRes.data.matched_influencers || [];
                const mappedInfluencers = influencerData.map((item: any) => ({
                    influencer_id: item.influencer_id || item.influencer?.user_id || item.influencer?.id || '',
                    influencer_name: item.full_name || item.username || item.influencer?.channel_title || item.influencer?.username || 'Unknown Influencer',
                    status: item.status || 'invited',
                    added_at: item.added_at || item.influencer?.created_at || new Date().toISOString(),
                    notes: item.notes || item.ai_analysis || '',
                    post_url: item.post_url || null
                }));

                setCampaign({
                    ...campaignRes.data,
                    influencers: mappedInfluencers
                });
            } catch (err: any) {
                console.error('Failed to fetch campaign:', err);
                setError(err.response?.data?.detail || 'Failed to load campaign details');
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignDetails();
    }, [campaignId, isAuthorized]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'accepted':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Accepted
                    </span>
                );
            case 'rejected':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Rejected
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                        <Play className="w-4 h-4" />
                        In Progress
                    </span>
                );
            case 'completed':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Cancelled
                    </span>
                );
            default: // 'invited'
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                        <Mail className="w-4 h-4" />
                        Invited
                    </span>
                );
        }
    };

    const getCampaignStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                        <Play className="w-4 h-4" />
                        Active
                    </span>
                );
            case 'paused':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                        <Pause className="w-4 h-4" />
                        Paused
                    </span>
                );
            case 'completed':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </span>
                );
            case 'inactive':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                    </span>
                );
            case 'inactive':
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        Inactive
                    </span>
                );
            default: // 'draft'
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        Draft
                    </span>
                );
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <Header />
                <div className="p-6 lg:p-8 max-w-5xl mx-auto">
                    <Link
                        to="/sponsor"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!campaign) return null;

    // Calculate stats
    const invitedCount = campaign.influencers.filter(i => i.status === 'invited').length;
    const acceptedCount = campaign.influencers.filter(i => i.status === 'accepted').length;
    const inProgressCount = campaign.influencers.filter(i => i.status === 'in_progress').length;
    const completedCount = campaign.influencers.filter(i => i.status === 'completed').length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <Header />
            <div className="p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Link
                            to="/sponsor"
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{campaign.name}</h1>
                                <p className="text-gray-400 max-w-2xl">{campaign.description}</p>
                            </div>
                            {getCampaignStatusBadge(campaign.status)}
                        </div>
                    </motion.div>

                    {/* Campaign Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">Invited</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-400">{invitedCount}</span>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Accepted</span>
                            </div>
                            <span className="text-2xl font-bold text-green-400">{acceptedCount}</span>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Play className="w-4 h-4" />
                                <span className="text-sm">In Progress</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-400">{inProgressCount}</span>
                        </div>
                        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">Completed</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-400">{completedCount}</span>
                        </div>
                    </motion.div>

                    {/* Campaign Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="rounded-xl bg-white/5 border border-white/10 p-6 mb-8"
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">Campaign Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Users className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Niche</p>
                                    <p className="text-white font-medium">{campaign.niche}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/20">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Budget</p>
                                    <p className="text-white font-medium">
                                        ${campaign.budget_min?.toLocaleString()} - ${campaign.budget_max?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-white font-medium">
                                        {new Date(campaign.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Influencers List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Influencers ({campaign.influencers.length})</h2>
                            <button
                                onClick={() => navigate(`/sponsor/discovery?campaign=${campaign.id}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Influencers
                            </button>
                        </div>

                        {campaign.influencers.length > 0 ? (
                            <div className="space-y-3">
                                {campaign.influencers.map((influencer, index) => (
                                    <motion.div
                                        key={influencer.influencer_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between hover:border-white/20 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{influencer.influencer_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Added {new Date(influencer.added_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {influencer.notes && (
                                                <span className="text-sm text-gray-400 hidden md:block">
                                                    {influencer.notes}
                                                </span>
                                            )}
                                            {getStatusBadge(influencer.status)}
                                            {influencer.status === 'completed' && influencer.post_url && (
                                                <a
                                                    href={influencer.post_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors flex items-center gap-1"
                                                    title="View Post"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span className="text-xs hidden md:inline">View Post</span>
                                                </a>
                                            )}
                                            {influencer.status === 'completed' && !influencer.post_url && (
                                                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View Report">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                                    <Users className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No influencers yet</h3>
                                <p className="text-gray-400 max-w-md mx-auto mb-6">
                                    Start by discovering and adding influencers to this campaign.
                                </p>
                                <button
                                    onClick={() => navigate(`/sponsor/discovery?campaign=${campaign.id}`)}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-colors"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Find Influencers
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetail;
