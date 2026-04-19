import React from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { 
    MessageSquare, 
    TrendingUp, 
    HelpCircle, 
    ShieldCheck, 
    Quote,
    Activity,
    BrainCircuit,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import type { CommentsAnalysisResponse } from "@/features/schemas/youtubeSchema";

interface Props {
    analysis: CommentsAnalysisResponse;
    themeColor?: "purple" | "blue";
}

const CommentsAnalysisBoard: React.FC<Props> = ({ analysis, themeColor = "purple" }) => {
    const {
        overall_sentiment,
        sentiment_distribution,
        key_themes,
        audience_questions,
        brand_mentions,
        top_comments,
        total_comments_analyzed,
        error
    } = analysis;

    const sentimentData = [
        { name: "Positive", value: sentiment_distribution.positive, color: "#10b981" },
        { name: "Neutral", value: sentiment_distribution.neutral, color: "#9ca3af" },
        { name: "Negative", value: sentiment_distribution.negative, color: "#ef4444" },
    ];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (error && total_comments_analyzed === 0) {
        return (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] flex items-center gap-4 text-red-400">
                <AlertCircle className="w-6 h-6" />
                <p className="font-bold">{error}</p>
            </div>
        );
    }

    return (
        <motion.div
            className="w-full space-y-8 mt-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex items-center gap-4 mb-2">
                <div className={`p-3 rounded-2xl bg-${themeColor}-500/10 border border-${themeColor}-500/20 shadow-lg`}>
                    <BrainCircuit className={`w-6 h-6 text-${themeColor}-400`} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Audience Intelligence</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Scanned {total_comments_analyzed} comments via TinyFish Web Agent
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sentiment Distribution */}
                <motion.div 
                    className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl flex flex-col group hover:border-emerald-500/20 transition-all"
                    variants={itemVariants}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Sentiment Pulse</h3>
                    </div>

                    <div className="flex-1 w-full relative min-h-[200px]">
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-black text-white">{overall_sentiment}</span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Tone</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200} minWidth={1}>
                            <PieChart>
                                <Pie
                                    data={sentimentData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {sentimentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {sentimentData.map((item) => (
                            <div key={item.name} className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{item.name}</span>
                                <span className="text-sm font-black text-white" style={{ color: item.color }}>{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Key Themes & Mentions */}
                <motion.div 
                    className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={itemVariants}
                >
                    <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Core Themes</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {key_themes.map((theme, i) => (
                                <span key={i} className="px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[10px] font-black uppercase text-blue-300">
                                    {theme}
                                </span>
                            ))}
                        </div>
                        
                        <div className="mt-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Brand Mentions</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {brand_mentions.length > 0 ? brand_mentions.map((brand, i) => (
                                    <span key={i} className="px-3 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] font-black uppercase text-orange-300">
                                        {brand}
                                    </span>
                                )) : (
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No brand mentions detected</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Audience Questions</h3>
                        </div>
                        <div className="space-y-4">
                            {audience_questions.length > 0 ? audience_questions.map((q, i) => (
                                <div key={i} className="flex gap-3 items-start group">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 group-hover:scale-150 transition-transform" />
                                    <p className="text-xs text-gray-300 font-medium leading-relaxed italic line-clamp-2">"{q}"</p>
                                </div>
                            )) : (
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No direct questions found</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Representative Comments */}
            <motion.div 
                className="bg-card/40 backdrop-blur-xl border border-border rounded-[32px] p-8 shadow-xl"
                variants={itemVariants}
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                        <Quote className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Voice of the Audience</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {top_comments.map((comment, i) => (
                        <div key={i} className="relative p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-[10px] font-black text-white">
                                        {comment.author.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">{comment.author}</span>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                    comment.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    comment.sentiment === 'Negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                }`}>
                                    {comment.sentiment}
                                </span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-medium line-clamp-3">
                                {comment.text}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CommentsAnalysisBoard;
