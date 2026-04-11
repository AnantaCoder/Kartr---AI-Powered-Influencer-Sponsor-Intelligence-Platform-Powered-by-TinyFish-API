
import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface Sponsor {
    name: string;
    industry: string;
    fit_score: number;
    reason: string;
    logo_url?: string;
}

interface PotentialSponsorsProps {
    sponsors: Sponsor[];
    themeColor: string;
}

const PotentialSponsors: React.FC<PotentialSponsorsProps> = ({ sponsors, themeColor }) => {
    return (
        <div className="mt-8 space-y-8 pb-12">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500`}>
                    <Briefcase className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Potential Sponsors for You</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">AI-Matched Brand Partnerships</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sponsors.map((sponsor, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 hover:border-amber-500/30 transition-all duration-500 shadow-2xl overflow-hidden"
                    >
                        {/* Interactive Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[80px] group-hover:bg-amber-500/10 transition-colors" />

                        <div className="flex items-start justify-between mb-8 relative z-10">
                            {sponsor.logo_url ? (
                                <img src={sponsor.logo_url} alt={sponsor.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/5" />
                            ) : (
                                <div className="p-4 bg-white/5 rounded-[24px] group-hover:bg-amber-500/10 group-hover:scale-110 transition-all duration-500">
                                    <Sparkles className="w-6 h-6 text-amber-500" />
                                </div>
                            )}
                            <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-amber-500 font-black text-3xl">{sponsor.fit_score}</span>
                                    <span className="text-amber-500/60 font-black text-sm">%</span>
                                </div>
                                <span className="text-[10px] text-gray-600 uppercase font-black tracking-[0.2em]">Match Score</span>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-2 mb-8">
                            <h4 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors line-clamp-1">
                                {sponsor.name}
                            </h4>
                            <div className="inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    {sponsor.industry}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 bg-black/20 rounded-[28px] p-6 mb-8 border border-white/5">
                            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                <span className="text-amber-500/40 text-2xl font-serif absolute -top-1 -left-1">"</span>
                                {sponsor.reason}
                                <span className="text-amber-500/40 text-2xl font-serif">"</span>
                            </p>
                        </div>

                        <button className="relative z-10 w-full py-4 rounded-[24px] bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-3">
                            Request Introduction
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-5 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 max-w-2xl"
            >
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-widest leading-relaxed">
                    Pro-tip: Leverage your <span className="text-emerald-400">98% Safety Score</span> when reaching out to enterprise brands.
                </p>
            </motion.div>
        </div>
    );
};

export default PotentialSponsors;
