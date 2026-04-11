import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BackgroundVideo from "../components/common/BackgroundVideo";
import { motion } from "framer-motion";
import { Rocket, Target, BarChart3, Users, ArrowLeft, Share2, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdvancedAnalytics from "../components/youtube/AdvancedAnalytics";
import TopInfluencers from "../components/youtube/TopInfluencers";

const SponsorCampaign: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);

    // Mock data matching the ID provided by user
    const campaignData = {
        id: id || "campaign_400cbdc66d28",
        name: "Winter Tech Gear 2026",
        status: "Active",
        budget: "$25,000",
        spent: "$12,450",
        objective: "Brand Awareness & Re-targeting",
        niche: "Tech",
        analytics: {
            engagement_rate: 6.8,
            sentiment_score: 82,
            niche: "Tech",
            audience_retention_estimate: 72.5,
            brand_safety_score: 98.0,
            growth_potential: "High",
            suggested_partner: "Marques Brownlee"
        },
        topInfluencers: [
            { name: "Marques Brownlee", handle: "@mkbhd", engagement_rate: 8.5, subscribers: "18.5M", score: 98 },
            { name: "Linus Tech Tips", handle: "@LinusTechTips", engagement_rate: 7.2, subscribers: "15.6M", score: 95 },
            { name: "iJustine", handle: "@ijustine", engagement_rate: 6.8, subscribers: "7.1M", score: 92 }
        ]
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            <BackgroundVideo />
            <Header />

            <main className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto">
                {/* Breadcrumbs / Back */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Link to="/ad-studio" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Ad Studio
                    </Link>
                </motion.div>

                {/* Campaign Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                {campaignData.status}
                            </span>
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">ID: {campaignData.id}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                            {campaignData.name}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-gray-400">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold uppercase tracking-wider">{campaignData.objective}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold uppercase tracking-wider">{campaignData.budget} Total Budget</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="flex gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl px-6 h-12 text-xs font-black uppercase tracking-widest">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { label: "Spent to Date", value: campaignData.spent, icon: Zap, color: "blue" },
                        { label: "Active Creators", value: "12", icon: Users, color: "purple" },
                        { label: "Est. Impressions", value: "2.4M", icon: Target, color: "emerald" },
                    ].map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-8"
                        >
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 text-${stat.color}-400 w-fit mb-6`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                            <p className="text-3xl font-black text-white">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                        <Rocket className="w-12 h-12 animate-pulse text-blue-500 mb-4" />
                        <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-xs">Synchronizing Data...</p>
                    </div>
                ) : (
                    <>
                        <AdvancedAnalytics data={campaignData.analytics} themeColor="blue" />
                        <TopInfluencers influencers={campaignData.topInfluencers} niche={campaignData.niche} themeColor="blue" />
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default SponsorCampaign;
