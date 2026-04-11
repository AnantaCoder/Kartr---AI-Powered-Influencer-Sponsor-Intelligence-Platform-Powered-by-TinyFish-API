import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    MessageSquare,
    FileText,
    Image as ImageIcon,
    Send,
    ArrowRight,
    Search,
    Play,
    Zap,
    Cpu,
    ExternalLink,
    Loader2,
    Copy,
    Check,
    Download,
    Share2,
    Twitter,
    Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { InnovationCard } from "../components/showcase/InnovationCard";
import { useSelector } from "react-redux";
import { selectPerspective } from "../store/slices/uiSlice";
import { selectToken } from "../store/slices/authSlice";

const MvpShowcase: React.FC = () => {
    const perspective = useSelector(selectPerspective);
    const token = useSelector(selectToken);
    const isCreator = perspective === "creator";

    // --- AI Image Demo State ---
    const [imagePrompt, setImagePrompt] = useState(isCreator ? "Self-portrait tech studio" : "Luxury product showcase");
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [copied, setCopied] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<{
        image_base64?: string;
        image_url?: string;
        enhanced_prompt?: string;
        caption?: string;
    } | null>(null);

    // --- RAG Demo State ---
    const [chatQuery, setChatQuery] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [chatResult, setChatResult] = useState<{
        answer: string;
        context?: string;
    } | null>(null);

    // --- Video Demo State ---
    const [videoPrompt, setVideoPrompt] = useState(isCreator ? "Cyberpunk drone shot" : "Abstract brand reveal");
    const [isGeneratingVid, setIsGeneratingVid] = useState(false);
    const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
    const [videoProgress, setVideoProgress] = useState(0);
    const [videoResult, setVideoResult] = useState<{
        video_url?: string;
    } | null>(null);

    // --- Social State ---
    const [isPosting, setIsPosting] = useState(false);

    // --- themeColor derived from perspective ---
    const themeColor = perspective === "creator" ? "purple" : "blue";

    // --- GraphRAG State ---
    const [isAnalyzingGraph, setIsAnalyzingGraph] = useState(false);
    const [graphQuery, setGraphQuery] = useState(isCreator ? "Who are the most influential sponsors?" : "Which creators have the most partnerships?");
    const [graphResult, setGraphResult] = useState<{ answer: string } | null>(null);

    const handleCopyCaption = () => {
        if (generatedResult?.caption) {
            navigator.clipboard.writeText(generatedResult.caption);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleImageDemo = async () => {
        if (!imagePrompt) return;
        setIsGeneratingImg(true);
        setGeneratedResult(null);
        try {
            const response = await fetch("http://localhost:8000/api/ad-studio/generate-ad", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_name: imagePrompt,
                    target_audience: isCreator ? "Global Tech Audience" : "Premium Consumers",
                    tone: "Aesthetic & Inspirational",
                    brand_identity: "Kartr AI Ecosystem"
                })
            });
            const data = await response.json();
            if (data.success) {
                setGeneratedResult(data);
            }
        } catch (error) {
            console.error("Image demo failed:", error);
        } finally {
            setIsGeneratingImg(false);
        }
    };

    const handleRagDemo = async () => {
        if (!chatQuery) return;
        setIsThinking(true);
        try {
            const response = await fetch("http://localhost:8000/api/chat/quick", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: chatQuery
                })
            });
            const data = await response.json();
            if (data.success) {
                // The new ChatService now retrieves context automatically
                setChatResult({
                    answer: data.assistant_message.content,
                    context: data.assistant_message.content.includes("Source:")
                        ? "RAG Context Verified"
                        : "General Knowledge (No direct match)"
                });
            }
        } catch (error) {
            console.error("RAG demo failed:", error);
        } finally {
            setIsThinking(false);
        }
    };

    const pollVideoStatus = async (taskId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/video/status/${taskId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.status === "completed") {
                setVideoResult({ video_url: data.result_url });
                setIsGeneratingVid(false);
                setVideoTaskId(null);
            } else if (data.status === "failed") {
                alert("Video generation failed: " + data.error);
                setIsGeneratingVid(false);
                setVideoTaskId(null);
            } else {
                setVideoProgress(data.progress || 0);
                setTimeout(() => pollVideoStatus(taskId), 3000);
            }
        } catch (error) {
            console.error("Polling error:", error);
            setIsGeneratingVid(false);
        }
    };

    const handleVideoDemo = async () => {
        if (!videoPrompt) return;
        setIsGeneratingVid(true);
        setVideoResult(null);
        setVideoProgress(10);
        try {
            const response = await fetch("http://localhost:8000/api/video/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: videoPrompt,
                    num_frames: 16,
                    fps: 8
                })
            });
            const data = await response.json();
            if (data.task_id) {
                setVideoTaskId(data.task_id);
                pollVideoStatus(data.task_id);
            } else {
                setIsGeneratingVid(false);
                alert("Could not start video task.");
            }
        } catch (error) {
            console.error("Video demo failed:", error);
            setIsGeneratingVid(false);
        }
    };

    const handleGraphDemo = async () => {
        if (!graphQuery) return;
        setIsAnalyzingGraph(true);
        setGraphResult(null);
        try {
            const response = await fetch("http://localhost:8000/api/questions/ask-graph", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ question: graphQuery })
            });
            const data = await response.json();
            setGraphResult(data);
        } catch (error) {
            console.error("GraphRAG failed:", error);
        } finally {
            setIsAnalyzingGraph(false);
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Download failed. Try right-clicking the media.");
        }
    };

    const handleBlueSkyPost = async (type: 'image' | 'video', url: string, text: string) => {
        setIsPosting(true);
        try {
            // Truncate text to 280 chars to be safe (Bluesky limit is 300)
            const safeText = text.length > 280 ? text.substring(0, 277) + "..." : text;

            const formData = new FormData();
            formData.append("text", safeText);
            if (type === 'image') formData.append("image_url", url);
            else formData.append("video_url", url);

            const response = await fetch("http://localhost:8000/api/bluesky/post", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                alert("Posted to BlueSky successfully! ✅");
            } else {
                alert("Post failed: " + (data.detail || "Check your BlueSky connection in Settings."));
            }
        } catch (error) {
            console.error("BlueSky post failed:", error);
        } finally {
            setIsPosting(false);
        }
    };

    // return block starts here

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
            <Header />

            {/* HERO SECTION */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-${themeColor}-600/10 blur-[120px] rounded-full pointer-events-none`} />

                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-${themeColor}-400 text-xs font-bold uppercase tracking-wider mb-6`}
                    >
                        <Cpu className="w-4 h-4" />
                        <span>Innovation Lab v1.1.0</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent leading-tight"
                    >
                        {isCreator ? "The Content" : "The Brand"} <br />
                        <span className={`text-${themeColor}-500`}>Neural Engine.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg max-w-2xl mx-auto mb-10"
                    >
                        Test our RAG-enhanced pipelines. Now with advanced caption generation and live platform data awareness.
                    </motion.p>
                </div>
            </section>

            {/* SHOWCASE GRID */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* FEATURE 1: IMAGE & CAPTION GEN */}
                    <InnovationCard
                        title={isCreator ? "Creative Studio" : "Brand Asset Forge"}
                        description={isCreator
                            ? "AI-generated visuals and captions tailored to your audience's sentiment."
                            : "Develop and test ad concepts with integrated AI copy generation."}
                        icon={ImageIcon}
                        color={isCreator ? "from-purple-500 to-pink-600" : "from-blue-500 to-cyan-500"}
                    >
                        <div className="space-y-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={imagePrompt}
                                    onChange={(e) => setImagePrompt(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-600"
                                    placeholder="Enter a product/idea..."
                                />
                                <Button
                                    onClick={handleImageDemo}
                                    disabled={isGeneratingImg}
                                    className={`absolute right-2 top-2 h-10 px-4 rounded-xl ${isCreator ? "bg-purple-600 hover:bg-purple-700 font-bold" : "bg-blue-600 hover:bg-blue-700 font-bold"}`}
                                >
                                    {isGeneratingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </Button>
                            </div>

                            <AnimatePresence mode="wait">
                                {generatedResult ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className={`p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 shadow-2xl overflow-hidden`}>
                                            <div className="aspect-square rounded-[1.8rem] overflow-hidden">
                                                <img
                                                    src={`data:image/png;base64,${generatedResult.image_base64}`}
                                                    alt="AI Result"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest text-${themeColor}-400`}>AI Generated Caption</span>
                                                <button
                                                    onClick={handleCopyCaption}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                                                >
                                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-300 leading-relaxed italic">
                                                "{generatedResult.caption}"
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                onClick={() => handleDownload(`data:image/png;base64,${generatedResult.image_base64}`, "kartr-asset.png")}
                                                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl h-12 gap-2"
                                            >
                                                <Download className="w-4 h-4" /> Save Local
                                            </Button>
                                            <Button
                                                onClick={() => handleBlueSkyPost('image', generatedResult.image_url || `data:image/png;base64,${generatedResult.image_base64}`, generatedResult.caption || "Generated with Kartr AI")}
                                                disabled={isPosting}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 gap-2"
                                            >
                                                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4" />} Post BlueSky
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="aspect-[4/3] rounded-3xl bg-slate-900/50 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-gray-700">
                                        <ImageIcon className="w-12 h-12 opacity-10" />
                                        <div className="text-center">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-20 block">Matrix Dormant</span>
                                            <span className="text-[10px] opacity-10 font-medium">Define your vision to materialize assets</span>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </InnovationCard>

                    {/* FEATURE 2: RAG Q&A */}
                    <InnovationCard
                        title={isCreator ? "Platform Brain (RAG)" : "Direct Discovery (RAG)"}
                        description={isCreator
                            ? "Context-aware AI that searches platform data to answer niche-specific rate and trend questions."
                            : "Neural search across the creator database to find perfect-fit sponsorships."}
                        icon={MessageSquare}
                        color={isCreator ? "from-pink-500 to-rose-400" : "from-cyan-500 to-blue-400"}
                    >
                        <div className="bg-slate-950/40 rounded-3xl p-6 border border-white/5 space-y-6 flex flex-col h-full">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">RAG Query Interface</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatQuery}
                                        onChange={(e) => setChatQuery(e.target.value)}
                                        placeholder={isCreator ? "What are top tech sponsor rates?" : "Who sponsors lifestyle vloggers?"}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-emerald-500/50 h-12"
                                    />
                                    <Button
                                        onClick={handleRagDemo}
                                        disabled={isThinking}
                                        className="bg-emerald-600 hover:bg-emerald-700 h-12 w-12 p-0 rounded-xl shadow-lg shadow-emerald-500/20"
                                    >
                                        {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {chatResult ? (
                                    <motion.div
                                        key="results"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-4 flex-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <Zap className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Contextual Response</span>
                                        </div>

                                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl rounded-tr-none text-xs text-emerald-50/80 leading-relaxed shadow-inner font-medium">
                                            {chatResult.answer.split('Source:')[0]}
                                        </div>

                                        {chatResult.answer.includes('Source:') && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <Search className="w-3 h-3 text-gray-500" />
                                                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Retrieved Context Sources</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {chatResult.answer.split('Source:').slice(1).map((src, i) => (
                                                        <div key={i} className="text-[10px] text-gray-400 font-mono italic leading-snug border-l border-white/10 pl-3 py-1">
                                                            Source: {src.substring(0, 100)}...
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-20">
                                        <Cpu className="w-12 h-12 mb-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Neural Link Offline</span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </InnovationCard>

                    {/* FEATURE 3: VIDEO GENERATION */}
                    <InnovationCard
                        title={isCreator ? "Cinematic Forge (Demo Only)" : "Dynamic Ad Creator (Demo Only)"}
                        description={isCreator
                            ? "Generate short-form video content from text prompts, perfect for social media."
                            : "Rapidly prototype video ads with AI-driven visuals and voiceovers."}
                        icon={Video}
                        color={isCreator ? "from-red-500 to-orange-600" : "from-green-500 to-teal-500"}
                    >
                        <div className="space-y-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={videoPrompt}
                                    onChange={(e) => setVideoPrompt(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-white/20 transition-all placeholder:text-gray-600"
                                    placeholder="Describe a short video..."
                                />
                                <Button
                                    onClick={handleVideoDemo}
                                    disabled={isGeneratingVid}
                                    className={`absolute right-2 top-2 h-10 px-4 rounded-xl ${isCreator ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-green-600 hover:bg-green-700 font-bold"}`}
                                >
                                    {isGeneratingVid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                </Button>
                            </div>

                            <AnimatePresence mode="wait">
                                {videoResult ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className={`p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 shadow-2xl overflow-hidden relative`}>
                                            <div className="aspect-video rounded-[1.8rem] overflow-hidden bg-black flex items-center justify-center">
                                                {videoResult.video_url ? (
                                                    <video
                                                        src={videoResult.video_url}
                                                        controls
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-700 text-center">
                                                        <Video className="w-12 h-12 opacity-10 mx-auto mb-2" />
                                                        <span className="text-xs font-black uppercase tracking-widest opacity-20 block">Video Not Available</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white">AI Neural Sequence</span>
                                            </div>

                                            <div className="absolute bottom-4 right-4 flex gap-2">
                                                <button
                                                    onClick={() => videoResult.video_url && handleDownload(videoResult.video_url, "kartr-video.mp4")}
                                                    className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => videoResult.video_url && handleBlueSkyPost('video', videoResult.video_url, "New cinematic sequence from Kartr AI Forge!")}
                                                    disabled={isPosting}
                                                    className="p-2 rounded-lg bg-blue-600 border border-white/10 hover:bg-blue-700 transition-all"
                                                >
                                                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="aspect-[4/3] rounded-3xl bg-slate-900/50 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 text-gray-700">
                                        <Video className="w-12 h-12 opacity-10" />
                                        <div className="text-center">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-20 block">Matrix Dormant</span>
                                            <span className="text-[10px] opacity-10 font-medium">Define your vision to materialize assets</span>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </InnovationCard>

                    {/* FEATURE 4: GRAPHRAG ANALYSIS */}
                    <InnovationCard
                        title="GraphRAG Structural Insights"
                        description="Analyzes the creator-sponsor network topology to identify influence clusters and direct partnership paths."
                        icon={Cpu}
                        color="from-amber-500 to-orange-600"
                    >
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={graphQuery}
                                    onChange={(e) => setGraphQuery(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-orange-500/50"
                                />
                                <Button
                                    onClick={handleGraphDemo}
                                    disabled={isAnalyzingGraph}
                                    className="bg-orange-600 hover:bg-orange-700 rounded-xl px-4"
                                >
                                    {isAnalyzingGraph ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
                                </Button>
                            </div>

                            <AnimatePresence mode="wait">
                                {graphResult ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl text-[11px] text-amber-50/80 leading-relaxed font-medium"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-3 h-3 text-orange-400" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Topological Findings</span>
                                        </div>
                                        {graphResult.answer}
                                    </motion.div>
                                ) : (
                                    <div className="aspect-[2/1] bg-slate-900/40 rounded-xl border border-dashed border-white/5 flex items-center justify-center opacity-10">
                                        <Cpu className="w-8 h-8" />
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </InnovationCard>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 px-6 text-center relative">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-${themeColor}-600/5 blur-3xl rounded-full`} />

                <h2 className="text-4xl md:text-5xl font-black mb-8 relative z-10 leading-tight">Empower your <br />{isCreator ? "influence" : "brand"} with AI.</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <Link to={isCreator ? "/signup-influencer" : "/signup-sponsor"}>
                        <Button size="lg" className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white rounded-2xl px-12 h-16 text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-${themeColor}-500/40`}>
                            {isCreator ? "Start Creating" : "Scale Campaign"}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default MvpShowcase;
