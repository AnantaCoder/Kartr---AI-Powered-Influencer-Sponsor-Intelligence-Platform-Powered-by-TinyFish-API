import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { useSelector } from "react-redux";
import { useState } from "react";
import { selectPerspective } from "../../store/slices/uiSlice";
import {
    Activity,
    Award,
    BrainCircuit,
    ExternalLink,
    Eye,
    MessageCircle,
    Share2,
    Target,
    ThumbsUp,
    TrendingUp,
    Zap,
    Download,
    ShieldCheck,
    Users,
    LineChart,
    LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { YoutubeResult } from "@/features/schemas/youtubeSchema";
import PotentialSponsors from "./PotentialSponsors";
import TopInfluencers from "./TopInfluencers";
import { useNavigate } from "react-router-dom";

import apiClient from "@/services/apiClient";

interface Props {
    result: YoutubeResult;
}

const AnalysisDashboard: React.FC<Props> = ({ result }) => {
    const perspective = useSelector(selectPerspective);
    const isCreator = perspective === "creator";
    const [isDownloading, setIsDownloading] = useState(false);
    const navigate = useNavigate();

    const handleApply = (brandName: string) => {
        // Redirect to Influencer Dashboard with brand pre-filled
        navigate(`/influencer?tab=sponsorships&brand=${encodeURIComponent(brandName)}`);
    };

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const response = await apiClient.post('/influencer/export-report', result, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Analysis_Report_${result.video_id || 'report'}.docx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download report.");
        } finally {
            setIsDownloading(false);
        }
    };

    const {
        title,
        thumbnail_url,
        channel_name,
        view_count,
        like_count,
        analysis,
        model_used
    } = result;

    const isSponsored = analysis?.is_sponsored;
    const sponsorName = analysis?.sponsor_name || "None";
    const sponsorIndustry = analysis?.sponsor_industry || "N/A";
    const influencerNiche = analysis?.influencer_niche || "General";
    const sentiment = analysis?.sentiment || "Neutral";
    const contentSummary = analysis?.content_summary || "";
    const keyTopics = analysis?.key_topics || [];

    const engagementData = [
        { name: "Views", value: view_count, fill: isCreator ? "#a855f7" : "#3b82f6" },
        { name: "Likes", value: like_count, fill: isCreator ? "#ec4899" : "#06b6d4" },
    ];

    let sentimentData = [
        { name: "Positive", value: 70, color: "#10b981" },
        { name: "Neutral", value: 20, color: "#9ca3af" },
        { name: "Negative", value: 10, color: "#ef4444" },
    ];

    if (sentiment?.toLowerCase().includes("positive")) {
        sentimentData = [
            { name: "Positive", value: 85, color: "#10b981" },
            { name: "Neutral", value: 10, color: "#9ca3af" },
            { name: "Negative", value: 5, color: "#ef4444" },
        ];
    } else if (sentiment?.toLowerCase().includes("negative")) {
        sentimentData = [
            { name: "Positive", value: 20, color: "#10b981" },
            { name: "Neutral", value: 20, color: "#9ca3af" },
            { name: "Negative", value: 60, color: "#ef4444" },
        ];
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const themeColor = isCreator ? "purple" : "blue";

    return (
        <motion.div
            className="w-full max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >


            {/* Perspective Header Stats */}
            <div className="flex flex-wrap items-center justify-between mb-10 gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-${themeColor}-500/10 border border-${themeColor}-500/20`}>
                        <LayoutDashboard className={`w-6 h-6 text-${themeColor}-400`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{isCreator ? "Self-Audit Dashboard" : "Brand Placement Audit"}</h2>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            {isCreator ? "Optimizing for growth & brand appeal" : "Evaluating ROI & brand alignment"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {model_used && (
                        <div className="px-3 py-1 rounded-xl bg-secondary/50 border border-border text-[10px] text-muted-foreground font-mono flex flex-col items-center justify-center h-11">
                            <span className="opacity-50 uppercase tracking-wider">AI Model</span>
                            <span className="text-gray-300 font-semibold">{model_used}</span>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleDownloadReport}
                        disabled={isDownloading}
                        className="rounded-xl border-white/10 bg-white/5 text-muted-foreground hover:text-white h-11 px-6 font-bold text-xs uppercase transition-all"
                    >
                        {isDownloading ? (
                            <span className="animate-spin mr-2">⏳</span>
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Export {isCreator ? "Analysis Data" : "ROI Report"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: VIDEO INFO */}
                <motion.div
                    className="lg:col-span-1 space-y-6"
                    variants={itemVariants}
                >
                    <div className={`group relative bg-card/50 backdrop-blur-md rounded-[32px] overflow-hidden border border-border shadow-2xl hover:border-${themeColor}-500/50 transition-all duration-500`}>
                        <div className="relative aspect-video overflow-hidden">
                            <img
                                src={thumbnail_url || ""}
                                alt={title}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full pl-1 pr-4 py-1 border border-white/10">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${isCreator ? "from-purple-500 to-pink-500" : "from-blue-500 to-indigo-500"} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                    {channel_name?.charAt(0) || "C"}
                                </div>
                                <span className="text-white text-[10px] font-black uppercase tracking-wider">{channel_name}</span>
                            </div>
                        </div>

                        <div className="p-8 relative">
                            <h2 className="text-white font-bold text-xl leading-snug mb-6 line-clamp-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-white group-hover:to-white transition-all">
                                {title}
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className={`bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center group/stat hover:border-${themeColor}-500/30 transition-colors`}>
                                    <Eye className={`w-5 h-5 text-${themeColor}-400 mb-2 group-hover/stat:scale-110 transition-transform`} />
                                    <span className="text-white font-black text-lg">{view_count?.toLocaleString() || "0"}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Views</span>
                                </div>
                                <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center group/stat hover:border-emerald-500/30 transition-colors">
                                    <ThumbsUp className="w-5 h-5 text-emerald-400 mb-2 group-hover/stat:scale-110 transition-transform" />
                                    <span className="text-white font-black text-lg">{like_count?.toLocaleString() || "0"}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Likes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isCreator ? (
                        <div className="bg-gradient-to-b from-purple-900/40 to-slate-900/40 backdrop-blur-xl border border-purple-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="font-black text-white text-sm uppercase tracking-widest">Creator Signal</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Hook Rating</p>
                                    <p className={`text-lg font-black ${(analysis?.hook_rating || "Medium") === "High" ? "text-emerald-400" :
                                        (analysis?.hook_rating || "Medium") === "Medium" ? "text-yellow-400" : "text-red-400"
                                        }`}>
                                        {analysis?.hook_rating || "Medium"}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Retention Risk</p>
                                    <p className={`text-lg font-black ${(analysis?.retention_risk || "Low") === "Low" ? "text-emerald-400" :
                                        (analysis?.retention_risk || "Low") === "Medium" ? "text-yellow-400" : "text-red-400"
                                        }`}>
                                        {analysis?.retention_risk || "Low"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Est. CPM</p>
                                    <p className="text-xl font-black text-white">{analysis?.cpm_estimate || "$12-$18"}</p>
                                </div>
                                <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                    <span className="text-green-400 font-bold">$</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-b from-blue-900/40 to-slate-900/40 backdrop-blur-xl border border-blue-500/20 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="font-black text-white text-sm uppercase tracking-widest">Brand Safety Audit</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Safety Score</span>
                                    <span className="text-emerald-400 font-black">{analysis?.brand_safety_score || 98}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${analysis?.brand_safety_score || 98}%` }} />
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                    {analysis?.brand_safety_score && analysis.brand_safety_score < 70
                                        ? "Caution: Content may contain topics sensitive to some advertisers."
                                        : "Content is family-friendly and aligns with Tier-1 advertiser standards."}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>


                {/* RIGHT COLUMN: ANALYTICS DASHBOARD */}
                <div className="lg:col-span-2 space-y-6">

                    {/* TOP ROW: NICHE & SPONSOR */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        variants={itemVariants}
                    >
                        {/* Niche Box */}
                        <div className={`relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-${isCreator ? "purple-600 via-pink-600 to-rose-600" : "blue-600 via-indigo-600 to-cyan-600"} text-white shadow-2xl group transition-transform duration-300 hover:-translate-y-1`}>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                            <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12 group-hover:scale-110 transition-all duration-500">
                                <Target className="w-40 h-40" />
                            </div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 mb-6 shadow-inner">
                                    <Users className="w-3 h-3 text-white fill-white" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isCreator ? "Self-Niche" : "Creator Niche"}</span>
                                </div>

                                {analysis?.video_category && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6 ml-3 shadow-inner">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{analysis.video_category}</span>
                                    </div>
                                )}

                                <h3 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 drop-shadow-md uppercase">
                                    {influencerNiche}
                                </h3>
                                <p className="text-white/70 font-bold text-xs uppercase tracking-widest mt-4">
                                    {isCreator ? "Your content identity" : "Audience Alignment"}
                                </p>
                            </div>
                        </div>

                        {/* Sponsor/Alignment Box */}
                        <div className={`
                            rounded-[32px] p-8 relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 shadow-2xl
                            ${isSponsored
                                ? `bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white shadow-orange-900/20`
                                : "bg-card/40 backdrop-blur-xl border border-border"}
                        `}>
                            {isSponsored && (
                                <div className="absolute -right-6 -top-6 opacity-20 rotate-[-10deg] group-hover:rotate-0 transition-all duration-500">
                                    <Award className="w-40 h-40" />
                                </div>
                            )}

                            <div className="relative z-10 h-full flex flex-col">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 backdrop-blur-sm shadow-inner ${isSponsored ? "bg-black/20 text-white" : "bg-white/5 text-muted-foreground border border-white/5"}`}>
                                    <TrendingUp className="w-3 h-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isSponsored ? "Partner Status" : (isCreator ? "Revenue Potential" : "Sponsor Fit")}</span>
                                </div>

                                {isSponsored ? (
                                    <>
                                        <h3 className="text-3xl font-black mb-1 drop-shadow-md uppercase text-white">{sponsorName}</h3>
                                        <p className="text-orange-100 font-bold text-sm uppercase tracking-widest opacity-90 mt-2">{sponsorIndustry} Partner</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-3xl font-black text-gray-300 mb-2 uppercase">{isCreator ? "Open for Ads" : "High Synergy"}</h3>
                                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                                            {isCreator ? "Target premium tech sponsors" : "Match with your portfolio"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* MIDDLE ROW: CHARTS */}
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        variants={itemVariants}
                    >
                        {/* Engagement Chart */}
                        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl flex flex-col hover:border-indigo-500/20 transition-colors group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Engagement Radius</h3>
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagementData} layout="vertical" margin={{ left: 0, right: 30, bottom: 0, top: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            stroke="#9ca3af"
                                            fontSize={10}
                                            fontWeight={900}
                                            tickLine={false}
                                            axisLine={false}
                                            width={60}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            radius={[0, 6, 6, 0]}
                                            barSize={32}
                                            animationDuration={1500}
                                        >
                                            {engagementData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sentiment Chart */}
                        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl flex flex-col hover:border-emerald-500/20 transition-colors group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Sentiment Pulse</h3>
                                </div>
                            </div>

                            <div className="flex-1 w-full relative min-h-[220px]">
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-4xl font-black text-white drop-shadow-lg">{sentimentData[0]?.value ?? 0}%</span>
                                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full mt-1">Positive</span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sentimentData}
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={6}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {sentimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest mt-2">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Positive
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-gray-500" /> Neutral
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> Negative
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Summary Box */}
                    <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl bg-${themeColor}-500/10 text-${themeColor}-400`}>
                                <LineChart className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{isCreator ? "Performance Summary" : "Campaign Outlook"}</h3>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed font-medium">
                            {contentSummary || "AI analysis of performance indicators suggests a steady growth trajectory for this content type."}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {keyTopics.map((topic, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-lg bg-secondary/20 border border-border text-[10px] font-black uppercase text-muted-foreground">
                                    #{topic}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* MARKET OPPORTUNITIES SECTION */}
                    <div className="mt-8">
                        {isCreator ? (
                            <TopInfluencers
                                themeColor="purple"
                                niche={influencerNiche}
                                mode="brand"
                                onApply={handleApply}
                                influencers={result.recommendations && result.recommendations.length > 0 ? result.recommendations.map(r => ({
                                    name: r.name,
                                    industry: r.industry || "General",
                                    score: r.fit_score || 85,
                                    thumbnail_url: r.logo_url,
                                    engagement_rate: 0, // Not relevant for brand
                                    handle: "", // Not relevant
                                    subscribers: "" // Not relevant
                                })) : [
                                    { name: "NordVPN", industry: "Cybersecurity", score: 95, thumbnail_url: "https://ui-avatars.com/api/?name=NordVPN&background=0D8ABC&color=fff" },
                                    { name: "Skillshare", industry: "Education", score: 88, thumbnail_url: "https://ui-avatars.com/api/?name=Skillshare&background=00FF84&color=000" },
                                    { name: "Corsair", industry: "Hardware", score: 82, thumbnail_url: "https://ui-avatars.com/api/?name=Corsair&background=000&color=fff" }
                                ]}
                            />
                        ) : (
                            <TopInfluencers
                                themeColor="blue"
                                niche={influencerNiche}
                                mode="creator"
                                influencers={result.recommendations && result.recommendations.length > 0 ? result.recommendations.map(r => ({
                                    name: r.name,
                                    handle: r.handle || "@unknown",
                                    engagement_rate: r.engagement_rate || 5.0,
                                    subscribers: r.subscribers || "N/A",
                                    score: r.fit_score,
                                    thumbnail_url: r.logo_url // Backend returns 'logo_url' for creators too in analysis_service
                                })) : [
                                    { name: "Marques Brownlee", handle: "@mkbhd", engagement_rate: 8.5, subscribers: "18.5M", score: 98, thumbnail_url: "https://ui-avatars.com/api/?name=MKBHD" },
                                    { name: "Linus Tech Tips", handle: "@LinusTechTips", engagement_rate: 7.2, subscribers: "15.6M", score: 95, thumbnail_url: "https://ui-avatars.com/api/?name=LTT" },
                                    { name: "iJustine", handle: "@ijustine", engagement_rate: 6.8, subscribers: "7.1M", score: 92, thumbnail_url: "https://ui-avatars.com/api/?name=iJ" }
                                ]}
                            />
                        )}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AnalysisDashboard;
