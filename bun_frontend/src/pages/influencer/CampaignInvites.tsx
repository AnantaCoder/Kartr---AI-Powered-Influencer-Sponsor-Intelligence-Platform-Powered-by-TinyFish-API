/**
 * Influencer Campaign Invites Page
 * Shows campaign invitations from sponsors
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, DollarSign, CheckCircle, XCircle, Clock, ArrowLeft, User } from 'lucide-react';
import { useInfluencerGuard } from '../../hooks/useRoleGuard';
import apiClient from '../../services/apiClient';
import { getInfluencerInvitations } from '../../services/campaignService';

interface CampaignInvite {
    id: string;
    campaign_id: string;
    campaign_name: string;
    sponsor_name: string; // Note: Backend might need to provide this or we use ID
    description: string;
    budget: number;
    deadline: string;
    status: 'invited' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
}

const CampaignInvites = () => {
    const { isLoading: authLoading } = useInfluencerGuard();
    const [invites, setInvites] = useState<CampaignInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'invited' | 'accepted' | 'rejected' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const response = await getInfluencerInvitations();
                // Map backend response to frontend interface
                const mappedInvites = response.invitations.map((inv: any) => ({
                    id: inv.campaign.id, // Use campaign ID as invite ID for now if no specific invite ID
                    campaign_id: inv.campaign.id,
                    campaign_name: inv.campaign.name,
                    sponsor_name: inv.sponsor_name || "Unknown Sponsor",
                    description: inv.campaign.description,
                    budget: inv.campaign.budget_max || inv.campaign.budget_min,
                    deadline: inv.campaign.requirements?.deadline || '',
                    status: inv.status,
                    created_at: inv.invited_at
                }));
                setInvites(mappedInvites);
            } catch (error) {
                console.error('Failed to fetch invites:', error);
                setInvites([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInvites();
    }, []);

    const handleRespond = async (campaignId: string, accept: boolean) => {
        setActionLoading(campaignId);
        try {
            await apiClient.post(`/campaigns/invitations/${campaignId}/respond`, { accept });
            setInvites(invites.map(inv =>
                inv.campaign_id === campaignId
                    ? { ...inv, status: accept ? 'accepted' : 'rejected' }
                    : inv
            ));
        } catch (error) {
            console.error(`Failed to ${accept ? 'accept' : 'reject'} invite:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
        setActionLoading(campaignId);
        try {
            await apiClient.patch(`/campaigns/invitations/${campaignId}/status`, { status: newStatus });
            setInvites(invites.map(inv =>
                inv.campaign_id === campaignId
                    ? { ...inv, status: newStatus as any }
                    : inv
            ));
        } catch (error) {
            console.error(`Failed to update status:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredInvites = invites.filter(invite =>
        filter === 'all' ? true : invite.status === filter
    );

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
                        <Clock className="w-4 h-4" />
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
            default: // 'invited' or pending
                return (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">
                        <Clock className="w-4 h-4" />
                        Pending
                    </span>
                );
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
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link
                        to="/influencer"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Campaign Invites</h1>
                    <p className="text-gray-400">Review and respond to campaign invitations from sponsors</p>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 mb-6 overflow-x-auto pb-2"
                >
                    {(['all', 'invited', 'accepted', 'in_progress', 'completed', 'rejected'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors whitespace-nowrap ${filter === tab
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {tab === 'invited' ? 'Pending' : tab.replace('_', ' ')}
                            {tab === 'invited' && invites.filter(i => i.status === 'invited').length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                    {invites.filter(i => i.status === 'invited').length}
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Invites List */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                    </div>
                ) : filteredInvites.length > 0 ? (
                    <div className="space-y-4">
                        {filteredInvites.map((invite, index) => (
                            <motion.div
                                key={invite.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-purple-500/30 transition-colors"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-white">{invite.campaign_name}</h3>
                                            {getStatusBadge(invite.status)}
                                        </div>

                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{invite.description}</p>

                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <User className="w-4 h-4" />
                                                <span>{invite.sponsor_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <DollarSign className="w-4 h-4" />
                                                <span>${invite.budget?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {invite.deadline
                                                        ? new Date(invite.deadline).toLocaleDateString()
                                                        : 'No deadline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons based on status */}
                                    {invite.status === 'invited' && (
                                        <div className="flex gap-3 lg:flex-col">
                                            <button
                                                onClick={() => handleRespond(invite.campaign_id, true)}
                                                disabled={actionLoading === invite.campaign_id}
                                                className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium disabled:opacity-50"
                                            >
                                                {actionLoading === invite.campaign_id ? 'Loading...' : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(invite.campaign_id, false)}
                                                disabled={actionLoading === invite.campaign_id}
                                                className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors font-medium disabled:opacity-50"
                                            >
                                                {actionLoading === invite.campaign_id ? 'Loading...' : 'Reject'}
                                            </button>
                                        </div>
                                    )}

                                    {invite.status === 'accepted' && (
                                        <div className="flex gap-3 lg:flex-col">
                                            <button
                                                onClick={() => handleUpdateStatus(invite.campaign_id, 'in_progress')}
                                                disabled={actionLoading === invite.campaign_id}
                                                className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors font-medium disabled:opacity-50"
                                            >
                                                Start Work
                                            </button>
                                        </div>
                                    )}

                                    {invite.status === 'in_progress' && (
                                        <div className="flex gap-3 lg:flex-col">
                                            <button
                                                onClick={() => handleUpdateStatus(invite.campaign_id, 'completed')}
                                                disabled={actionLoading === invite.campaign_id}
                                                className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors font-medium disabled:opacity-50"
                                            >
                                                Mark Complete
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(invite.campaign_id, 'cancelled')}
                                                disabled={actionLoading === invite.campaign_id}
                                                className="flex-1 lg:flex-none px-6 py-2.5 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors font-medium disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                            <Briefcase className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No invites yet</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            {filter === 'all'
                                ? "You haven't received any campaign invitations yet. Make sure your profile is complete and your YouTube channel is connected to attract sponsors."
                                : `No ${filter} invites to show.`}
                        </p>
                        <Link
                            to="/influencer/profile"
                            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors font-medium"
                        >
                            Complete Your Profile
                        </Link>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default CampaignInvites;
