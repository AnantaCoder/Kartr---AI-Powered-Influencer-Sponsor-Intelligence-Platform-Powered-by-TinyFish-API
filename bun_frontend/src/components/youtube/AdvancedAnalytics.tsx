
import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Activity, Heart, Star, Sparkles } from 'lucide-react';

interface AdvancedAnalyticsProps {
    data: {
        engagement_rate: number;
        sentiment_score: number;
        niche: string;
        audience_retention_estimate: number;
        brand_safety_score: number;
        growth_potential: string;
        suggested_partner?: string;
    };
    themeColor: string;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ data, themeColor }) => {
    // Mocking some trend data for charts
    const trendData = [
        { name: '10%', value: 30 },
        { name: '25%', value: 45 },
        { name: '50%', value: 75 },
        { name: '75%', value: 65 },
        { name: '90%', value: data.audience_retention_estimate },
    ];

    const metricCards = [
        { label: 'Engagement Rate', value: `${data.engagement_rate}%`, icon: Heart, color: 'rose' },
        { label: 'Brand Safety', value: `${data.brand_safety_score}/100`, icon: Star, color: 'emerald' },
        { label: 'Growth Potential', value: data.growth_potential, icon: TrendingUp, color: 'amber' },
        { label: 'Suggested Partner', value: data.suggested_partner || "Matched Brand", icon: Sparkles, color: 'amber', isSponsor: true },
    ];

    return (
        <div className="space-y-6 mt-8">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl bg-gradient-to-br from-${themeColor}-500/20 to-transparent text-${themeColor}-400`}>
                    <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Advanced Performance Metrics</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metricCards.map((metric, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-slate-900/40 backdrop-blur-md border ${metric.isSponsor ? 'border-amber-500/30' : 'border-white/10'} rounded-2xl p-4 hover:border-white/20 transition-all`}
                    >
                        <metric.icon className={`w-4 h-4 text-${metric.color}-400 mb-2`} />
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{metric.label}</p>
                        <p className={`text-lg font-black ${metric.isSponsor ? 'text-amber-400' : 'text-white'}`}>{metric.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {/* Retention Chart Wrapper */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col relative overflow-hidden">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 relative z-10">Estimated Audience Retention</h4>
                    <div className="flex-1 w-full min-h-[150px] relative">
                        {/* Explicit dimensions for Recharts fix */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={themeColor === 'purple' ? '#a855f7' : '#3b82f6'} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={themeColor === 'purple' ? '#a855f7' : '#3b82f6'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '10px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={themeColor === 'purple' ? '#a855f7' : '#3b82f6'}
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sentiment Chart Wrapper */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col items-center overflow-hidden">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 w-full text-left">Sentiment Analysis Breakdown</h4>
                    <div className="flex-1 w-full flex items-end justify-center gap-4 pb-4">
                        {[
                            { label: 'Pos', val: data.sentiment_score, col: '#10b981' },
                            { label: 'Neu', val: Math.max(5, 100 - data.sentiment_score - 10), col: '#9ca3af' },
                            { label: 'Neg', val: 10, col: '#ef4444' }
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end w-12">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${s.val}%` }}
                                    className="w-full rounded-t-lg shadow-lg"
                                    style={{ backgroundColor: s.col }}
                                />
                                <span className="text-[10px] font-black text-gray-500 uppercase">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
