/**
 * Influencer Card Component
 * Displays influencer with relevance score, keywords, and YouTube stats
 */
import { motion } from 'framer-motion';
import { Youtube, Users, Eye, Star, Plus, Check, MessageCircle } from 'lucide-react';
import type { InfluencerMatch } from '../../types/discovery';

interface InfluencerCardProps {
    influencer: InfluencerMatch;
    onAddToCampaign?: (influencerId: string) => void;
    onViewProfile?: (influencerId: string) => void;
    showAddButton?: boolean;
}

const InfluencerCard = ({
    influencer,
    onAddToCampaign,
    onViewProfile,
    showAddButton = true,
}: InfluencerCardProps) => {
    const stats = influencer.channel_stats;
    const isInvited = influencer.status === 'invited' || influencer.status === 'accepted';

    // Format large numbers
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Get score color
    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'from-emerald-500 to-emerald-600';
        if (score >= 60) return 'from-blue-500 to-blue-600';
        if (score >= 40) return 'from-yellow-500 to-yellow-600';
        return 'from-gray-500 to-gray-600';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
        >
            {/* Relevance Score Badge */}
            <div className="absolute top-4 right-4">
                <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getScoreColor(
                        influencer.relevance_score
                    )} flex items-center justify-center shadow-lg`}
                >
                    <div className="text-center">
                        <span className="text-white text-lg font-bold">
                            {Math.round(influencer.relevance_score)}
                        </span>
                        <span className="text-white/70 text-[10px] block -mt-1">score</span>
                    </div>
                </div>
            </div>

            {/* Profile Header */}
            <div className="flex items-start gap-4 mb-4 pr-16">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {influencer.username?.[0]?.toUpperCase() || 'I'}
                </div>
                <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                        {influencer.full_name || influencer.username}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">@{influencer.username}</p>
                </div>
            </div>

            {/* Matching Keywords */}
            {influencer.matching_keywords && influencer.matching_keywords.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Matching Keywords</p>
                    <div className="flex flex-wrap gap-2">
                        {influencer.matching_keywords.slice(0, 5).map((keyword) => (
                            <span
                                key={keyword}
                                className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium"
                            >
                                {keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* YouTube Stats */}
            {stats && stats.total_channels > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-400">
                            {stats.total_channels} YouTube Channel{stats.total_channels > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-white text-sm font-medium">
                                {formatNumber(stats.total_subscribers)}
                            </span>
                            <span className="text-gray-500 text-xs">subs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-white text-sm font-medium">
                                {formatNumber(stats.total_views)}
                            </span>
                            <span className="text-gray-500 text-xs">views</span>
                        </div>
                    </div>
                    {stats.channels && stats.channels.length > 0 && stats.channels[0] && (
                        <div className="mt-3 pt-3 border-t border-red-500/20">
                            <p className="text-xs text-gray-500 mb-1">Top Channel</p>
                            <p className="text-sm text-white truncate">{stats.channels[0].title}</p>
                        </div>
                    )}
                </div>
            )}

            {/* AI Analysis */}
            {influencer.ai_analysis && (
                <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-300 line-clamp-2">{influencer.ai_analysis}</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {showAddButton && onAddToCampaign && (
                    <button
                        onClick={() => onAddToCampaign(influencer.influencer_id)}
                        disabled={isInvited}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${isInvited
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                            }`}
                    >
                        {isInvited ? (
                            <>
                                <Check className="w-4 h-4" />
                                Added
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Add to Campaign
                            </>
                        )}
                    </button>
                )}
                {onViewProfile && (
                    <button
                        onClick={() => onViewProfile(influencer.influencer_id)}
                        className="py-2.5 px-4 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default InfluencerCard;
