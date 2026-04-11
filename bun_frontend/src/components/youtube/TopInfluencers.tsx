
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Award, Briefcase, Sparkles, Target, DollarSign } from 'lucide-react';

export interface InfluencerOrBrand {
    name: string;
    handle?: string; // Optional for brands
    engagement_rate?: number; // Optional for brands
    subscribers?: string; // Optional for brands
    industry?: string; // For brands
    score: number;
    thumbnail_url?: string;
    reason?: string; // AI reason for recommendation
}

interface TopInfluencersProps {
    influencers: InfluencerOrBrand[];
    niche: string;
    themeColor: string;
    mode?: 'creator' | 'brand'; // 'creator' = viewing creators (default), 'brand' = viewing brands
    onApply?: (brandName: string) => void;
}

const TopInfluencers: React.FC<TopInfluencersProps> = ({ influencers, niche, themeColor, mode = 'creator' }) => {
    const isBrandView = mode === 'brand';
    const title = isBrandView ? `Top ${niche} Sponsors` : `Top ${niche} Creators`;
    const subtitle = isBrandView ? "AI-recommended brands for your content" : "Perfect alignment for your brand";

    // Helper to get budget tier label
    const getBudgetLabel = (score: number) => {
        if (score >= 90) return { label: 'Premium', color: 'text-emerald-400', tier: '$$$' };
        if (score >= 75) return { label: 'Standard', color: 'text-blue-400', tier: '$$' };
        return { label: 'Starter', color: 'text-yellow-400', tier: '$' };
    };

    // Helper to get fit label
    const getFitLabel = (score: number) => {
        if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400' };
        if (score >= 75) return { label: 'Strong', color: 'text-blue-400' };
        if (score >= 60) return { label: 'Good', color: 'text-yellow-400' };
        return { label: 'Fair', color: 'text-orange-400' };
    };

    return (
        <div className="mt-12 space-y-8">
            <div className="flex items-center gap-3 justify-start">
                <div className={`p-3 rounded-2xl bg-${themeColor}-500/10 border border-${themeColor}-500/20 text-${themeColor}-400`}>
                    {isBrandView ? <Briefcase className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div className="text-left">
                    <h3 className="text-2xl font-black text-white uppercase tracking-wider text-left">{title}</h3>
                    <p className={`text-[10px] font-bold uppercase tracking-widest text-left ${isBrandView ? 'text-purple-400' : 'text-emerald-400'}`}>
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {influencers.map((item, idx) => {
                    const budget = getBudgetLabel(item.score);
                    const fit = getFitLabel(item.score);

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`group relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 transition-all duration-500 shadow-2xl overflow-hidden ${isBrandView ? 'hover:border-purple-500/30' : 'hover:border-emerald-500/30'}`}
                        >
                            {/* Rank Badge */}
                            <div className={`absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' : idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'}`}>
                                #{idx + 1}
                            </div>

                            {/* Avatar & Name */}
                            <div className="flex items-center gap-4 mb-6">
                                {item.thumbnail_url ? (
                                    <div className="w-14 h-14 rounded-2xl border-2 border-white/10 overflow-hidden flex-shrink-0">
                                        <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 flex items-center justify-center text-xl font-black text-white border-2 border-white/10 flex-shrink-0`}>
                                        {item.name.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h4 className={`text-lg font-black text-white truncate transition-colors ${isBrandView ? 'group-hover:text-purple-400' : 'group-hover:text-emerald-400'}`}>
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-semibold truncate">
                                        {isBrandView ? item.industry : item.handle}
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Target className="w-3 h-3 text-gray-500" />
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                            Niche Fit
                                        </p>
                                    </div>
                                    <p className={`text-sm font-black ${fit.color}`}>
                                        {fit.label}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <DollarSign className="w-3 h-3 text-gray-500" />
                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                                            {isBrandView ? 'Avg. Budget' : 'Followers'}
                                        </p>
                                    </div>
                                    <p className={`text-sm font-black ${isBrandView ? budget.color : 'text-white'}`}>
                                        {isBrandView ? budget.tier : item.subscribers}
                                    </p>
                                </div>
                            </div>

                            {/* Alignment Score */}
                            <div className={`flex items-center justify-between p-3 rounded-xl border ${isBrandView ? 'bg-purple-500/5 border-purple-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                                <div className="flex items-center gap-2">
                                    <Sparkles className={`w-4 h-4 ${isBrandView ? 'text-purple-400' : 'text-emerald-400'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isBrandView ? 'text-purple-400' : 'text-emerald-400'}`}>
                                        Match Score
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isBrandView ? 'bg-purple-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-black ${isBrandView ? 'text-purple-400' : 'text-emerald-400'}`}>
                                        {item.score}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopInfluencers;
