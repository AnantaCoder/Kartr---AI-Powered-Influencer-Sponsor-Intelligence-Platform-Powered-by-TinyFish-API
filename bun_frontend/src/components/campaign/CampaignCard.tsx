/**
 * Campaign Card Component
 * Displays campaign summary with status and actions
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, Edit2, Trash2, Play, Pause, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import type { Campaign, CampaignStatus } from '../../types/campaign';

interface CampaignCardProps {
    campaign: Campaign;
    onEdit?: (campaign: Campaign) => void;
    onDelete?: (id: string) => void;
    onActivate?: (id: string) => void;
    onPause?: (id: string) => void;
    onInactivate?: (id: string) => void;
    onFindInfluencers?: (campaign: Campaign) => void;
}

const statusConfig: Record<CampaignStatus, { color: string; icon: any; label: string }> = {
    draft: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: null, label: 'Draft' },
    active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Play, label: 'Active' },
    paused: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Pause, label: 'Paused' },
    completed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, label: 'Completed' },
    inactive: { color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle, label: 'Inactive' },
};

const CampaignCard = ({
    campaign,
    onEdit,
    onDelete,
    onActivate,
    onPause,
    onInactivate,
    onFindInfluencers,
}: CampaignCardProps) => {
    const status = statusConfig[campaign.status];
    const StatusIcon = status.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <Link
                        to={`/sponsor/campaigns/${campaign.id}`}
                        className="text-lg font-semibold text-white mb-1 line-clamp-1 hover:text-blue-400 transition-colors flex items-center gap-2 group"
                    >
                        {campaign.name}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}
                    >
                        {StatusIcon && <StatusIcon className="w-3 h-3" />}
                        {status.label}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(campaign)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(campaign.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>

            {/* Niche & Keywords */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                    {campaign.niche}
                </span>
                {campaign.keywords?.slice(0, 3).map((keyword) => (
                    <span
                        key={keyword}
                        className="px-2 py-1 rounded-lg bg-white/5 text-gray-400 text-xs"
                    >
                        {keyword}
                    </span>
                ))}
                {campaign.keywords?.length > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">
                        +{campaign.keywords.length - 3} more
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">{campaign.matched_influencers_count} influencers</span>
                    </div>
                    {campaign.budget_min && campaign.budget_max && (
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-400" />
                            <span className="text-gray-300 text-xs">
                                ${campaign.budget_min} - ${campaign.budget_max}
                            </span>
                        </div>
                    )}
                </div>

                {/* Influencer Stage Progress */}
                {campaign.influencer_stages && campaign.matched_influencers_count > 0 && (
                    <div className="mt-3">
                        <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-white/5">
                            {campaign.influencer_stages.completed > 0 && (
                                <div
                                    className="h-full bg-purple-500"
                                    style={{ width: `${(campaign.influencer_stages.completed / campaign.matched_influencers_count) * 100}%` }}
                                    title={`Completed: ${campaign.influencer_stages.completed}`}
                                />
                            )}
                            {campaign.influencer_stages.in_progress > 0 && (
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${(campaign.influencer_stages.in_progress / campaign.matched_influencers_count) * 100}%` }}
                                    title={`In Progress: ${campaign.influencer_stages.in_progress}`}
                                />
                            )}
                            {campaign.influencer_stages.accepted > 0 && (
                                <div
                                    className="h-full bg-green-500"
                                    style={{ width: `${(campaign.influencer_stages.accepted / campaign.matched_influencers_count) * 100}%` }}
                                    title={`Accepted: ${campaign.influencer_stages.accepted}`}
                                />
                            )}
                            {campaign.influencer_stages.invited > 0 && (
                                <div
                                    className="h-full bg-yellow-500"
                                    style={{ width: `${(campaign.influencer_stages.invited / campaign.matched_influencers_count) * 100}%` }}
                                    title={`Pending: ${campaign.influencer_stages.invited}`}
                                />
                            )}
                            {campaign.influencer_stages.rejected > 0 && (
                                <div
                                    className="h-full bg-red-500/50"
                                    style={{ width: `${(campaign.influencer_stages.rejected / campaign.matched_influencers_count) * 100}%` }}
                                    title={`Rejected: ${campaign.influencer_stages.rejected}`}
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                            {campaign.influencer_stages.completed > 0 && (
                                <span className="flex items-center gap-1 text-purple-400">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    {campaign.influencer_stages.completed} done
                                </span>
                            )}
                            {campaign.influencer_stages.in_progress > 0 && (
                                <span className="flex items-center gap-1 text-blue-400">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    {campaign.influencer_stages.in_progress} working
                                </span>
                            )}
                            {campaign.influencer_stages.accepted > 0 && (
                                <span className="flex items-center gap-1 text-green-400">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {campaign.influencer_stages.accepted} accepted
                                </span>
                            )}
                            {campaign.influencer_stages.invited > 0 && (
                                <span className="flex items-center gap-1 text-yellow-400">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    {campaign.influencer_stages.invited} pending
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {campaign.status === 'draft' && onActivate && (
                    <button
                        onClick={() => onActivate(campaign.id)}
                        className="flex-1 py-2 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                    >
                        Activate
                    </button>
                )}
                {campaign.status === 'active' && onPause && (
                    <button
                        onClick={() => onPause(campaign.id)}
                        className="flex-1 py-2 px-4 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                    >
                        Pause
                    </button>
                )}
                {(campaign.status === 'active' || campaign.status === 'paused') && onInactivate && (
                    <button
                        onClick={() => onInactivate(campaign.id)}
                        className="flex-1 py-2 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
                    >
                        Make Inactive
                    </button>
                )}
                {campaign.status === 'inactive' && onActivate && (
                    <button
                        onClick={() => onActivate(campaign.id)}
                        className="flex-1 py-2 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                    >
                        Activate
                    </button>
                )}
                {onFindInfluencers && campaign.status !== 'completed' && campaign.status !== 'inactive' && (
                    <button
                        onClick={() => onFindInfluencers(campaign)}
                        className="flex-1 py-2 px-4 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                    >
                        Find Influencers
                    </button>
                )}
            </div>

            {/* Date */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                Created {new Date(campaign.created_at).toLocaleDateString()}
            </div>
        </motion.div>
    );
};

export default CampaignCard;
