import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Zap,
    Image as ImageIcon,
    Share2,
    Sparkles,
    Rocket,
    BarChart3,
    ArrowRight,
    Loader2,
    Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useSelector } from "react-redux";
import { selectToken } from "../store/slices/authSlice";

const AdStudio: React.FC = () => {
    const token = useSelector(selectToken);

    // Form State
    const [productName, setProductName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    // Result State
    const [generatedAd, setGeneratedAd] = useState<{
        image_base64?: string;
        caption?: string;
        enhanced_prompt?: string;
    } | null>(null);
    const [postResult, setPostResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleGenerate = async () => {
        if (!productName) return;
        setIsGenerating(true);
        setPostResult(null);

        try {
            const response = await fetch("http://localhost:8000/api/ad-studio/generate-ad", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_name: productName,
                    target_audience: "Gen Z & Millennials",
                    tone: "Energetic & Modern",
                    brand_identity: "Kartr Tech-First"
                })
            });

            const data = await response.json();
            if (data.success) {
                setGeneratedAd(data);
            } else {
                alert("Generation failed: " + (data.error || data.detail || "Unknown error"));
            }
        } catch (error) {
            console.error("Error generating ad:", error);
            alert("An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = async () => {
        if (!generatedAd) return;
        setIsPosting(true);

        try {
            const response = await fetch("http://localhost:8000/api/ad-studio/post-ad", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    caption: generatedAd.caption,
                    image_base64: generatedAd.image_base64,
                    platforms: ["bluesky"]
                })
            });

            const data = await response.json();
            setPostResult({
                success: data.success || data.post_uri ? true : false,
                message: data.message || (data.post_uri ? "Successfully posted to Bluesky!" : "Failed to post.")
            });
        } catch (error) {
            console.error("Error posting ad:", error);
            setPostResult({ success: false, message: "Network error while posting." });
        } finally {
            setIsPosting(false);
        }
    };

    const plans = [
        {
            name: "Free",
            price: "0",
            description: "Try out the core features with no commitment.",
            features: [
                "1 AI Asset / mo",
                "1 AI Caption",
                "Community Support",
                "Kartr Watermark included"
            ],
            color: "slate",
            btnText: "Get Started",
            isPopular: false
        },
        {
            name: "Starter",
            price: "49",
            description: "Perfect for emerging brands testing the waters.",
            features: [
                "5 AI Generated Assets / mo",
                "5 Smart AI Captions",
                "1 Social Account Link",
                "Basic Performance Analytics",
                "Email Support"
            ],
            color: "blue",
            btnText: "Start Free Trial",
            isPopular: false
        },
        {
            name: "Pro",
            price: "149",
            description: "Advanced tools for high-growth brand campaigns.",
            features: [
                "25 AI Generated Assets / mo",
                "25 Groq-Enhanced Captions",
                "5 Social Account Links",
                "Advanced ROI Tracking",
                "Priority 24/7 Support",
                "Custom Brand Voice"
            ],
            color: "indigo",
            btnText: "Upgrade to Pro",
            isPopular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "Seamless infrastructure for global brand reach.",
            features: [
                "Unlimited AI Generation",
                "Unlimited Social Posting",
                "White-label Reports",
                "Dedicated Account Manager",
                "Custom AI Model Training",
                "API Access"
            ],
            color: "slate",
            btnText: "Contact Sales",
            isPopular: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
            <Header />

            {/* HERO SECTION */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden text-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <Sparkles className="w-4 h-4" />
                        AI Ad Studio
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                        Create. Caption. <span className="text-blue-500">Post.</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                        Automate your high-fidelity brand assets using Kartr's AI engine. From generation to cross-platform posting, we've got your scale covered.
                    </p>
                </motion.div>
            </section>

            {/* INTERACTIVE SANDBOX */}
            <section className="py-20 px-6 relative z-10" id="sandbox">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* Left: Input */}
                            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/5">
                                <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-blue-400">
                                    <Zap className="w-6 h-6" />
                                    Ad Sandbox
                                </h3>
                                <p className="text-gray-400 text-sm mb-8">
                                    Experience the magic. Enter your product name and watch Kartr generate a professional ad and caption instantly.
                                </p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Product or Service Name</label>
                                        <input
                                            type="text"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="e.g. SolarPulse Wireless Earbuds"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !productName}
                                        className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Generating Creative...
                                            </>
                                        ) : (
                                            <>
                                                Generate Ad Preview
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {generatedAd && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10"
                                    >
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">AI Generated Caption</h4>
                                        <p className="text-sm text-gray-300 italic leading-relaxed">
                                            "{generatedAd.caption}"
                                        </p>

                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <Button
                                                onClick={handlePost}
                                                disabled={isPosting}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                            >
                                                {isPosting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="w-3.5 h-3.5 mr-2" />
                                                        Post to Bluesky
                                                    </>
                                                )}
                                            </Button>

                                            {postResult && (
                                                <p className={`text-[10px] font-bold mt-4 text-center uppercase tracking-widest ${postResult.success ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {postResult.message}
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Right: Preview */}
                            <div className="bg-slate-900/40 p-12 flex flex-col items-center justify-center min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {generatedAd ? (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="w-full aspect-square rounded-[2rem] overflow-hidden border border-white/10 relative group"
                                        >
                                            <img
                                                src={`data:image/png;base64,${generatedAd.image_base64}`}
                                                alt="AI Ad Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
                                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Enhanced Prompt</p>
                                                <p className="text-[10px] text-gray-400 line-clamp-3">{generatedAd.enhanced_prompt}</p>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center space-y-6"
                                        >
                                            <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 border-dashed">
                                                <ImageIcon className="w-10 h-10 text-gray-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold mb-2">No Ad Generated</h4>
                                                <p className="text-gray-500 text-sm max-w-[240px]">Enter your product info on the left to see the AI in action.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING GRID */}
            <section className="py-20 px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Choose your <span className="text-blue-500">scale</span></h2>
                    <p className="text-gray-500">From free exploratory seats to global enterprise reach.</p>
                </div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative p-8 rounded-3xl border ${plan.isPopular ? "bg-white/5 border-blue-500 shadow-2xl shadow-blue-500/10" : "bg-black/40 border-white/10"} flex flex-col`}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1">
                                <span className="text-4xl font-black">{plan.price !== "Custom" ? "$" : ""}{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-gray-500 text-sm font-bold">/mo</span>}
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className="flex items-start gap-3">
                                        <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center ${plan.isPopular ? "bg-blue-500" : "bg-white/10"}`}>
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                        <span className="text-sm text-gray-400">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-105 active:scale-95 ${plan.isPopular ? "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20" : "bg-white/5 hover:bg-white/10 border border-white/10"}`}
                            >
                                {plan.btnText}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FEATURES OVERVIEW */}
            <section className="py-24 px-6 bg-slate-900/40">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Unified Ad Infrastructure</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Brand-consistent creative at the speed of thought.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500/30 transition-all">
                                <ImageIcon className="w-6 h-6 text-purple-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-4">Groq-Enhanced Assets</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Our platform uses Llama-3 to expand simple ideas into professional art-direction prompts, ensuring high-fidelity results every time.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:bg-blue-500/30 transition-all">
                                <Zap className="w-6 h-6 text-blue-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-4">Instant Posting</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Connect your brand's social accounts and post generated content instantly. No more context switching between tools.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500/30 transition-all">
                                <BarChart3 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h4 className="text-xl font-bold mb-4">Deep ROI Tracking</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Track performance of every AI-generated post. See which visuals convert better and double down on what works.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-4xl mx-auto p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden shadow-2xl shadow-blue-500/30">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[120px] rounded-full -mr-40 -mt-40" />
                    <h2 className="text-4xl md:text-6xl font-black mb-10 relative z-10 leading-tight">Ready to scale your <br />brand's reach?</h2>
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 rounded-2xl px-14 h-20 text-xl font-black uppercase tracking-widest relative z-10 shadow-xl">
                        Start Now
                        <Rocket className="w-6 h-6 ml-3" />
                    </Button>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AdStudio;
