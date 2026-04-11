import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setPerspective, selectPerspective } from "../store/slices/uiSlice";
import { selectUser, selectIsAuthenticated } from "../store/slices/authSlice";
import {
    ArrowRight,
    Play,
    Users,
    TrendingUp,
    Sparkles,
    Youtube,
    BarChart3,
    Zap,
    Shield,
    Star,
    LayoutDashboard,
    PieChart,
    Search,
    Cpu,
    Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BackgroundVideo from "../components/common/BackgroundVideo";

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const Home: React.FC = () => {
    const dispatch = useDispatch();
    const perspective = useSelector(selectPerspective);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    const isCreator = perspective === "creator";

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-purple-500/30">
            <BackgroundVideo />
            <Header />

            {/* HERO SECTION */}
            <section className="relative min-h-[95vh] flex items-center justify-center px-6 lg:px-8 pt-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto text-center">
                    {/* Perspective Switcher Mini - Only for guests */}
                    {!isAuthenticated && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-10 overflow-hidden"
                        >
                            <button
                                onClick={() => dispatch(setPerspective("creator"))}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${isCreator ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                I AM A CREATOR
                            </button>
                            <button
                                onClick={() => dispatch(setPerspective("sponsor"))}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${!isCreator ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                            >
                                <Briefcase className="w-3.5 h-3.5" />
                                I AM A SPONSOR
                            </button>
                        </motion.div>
                    )}

                    {/* Hero Title */}
                    <motion.h1
                        key={perspective}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1] mb-8 tracking-tight"
                    >
                        {isCreator ? (
                            <>
                                Amplify your creative edge <br />
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Influencers and sponsors platform</span>
                                <div className="block mt-8">
                                    <span className="text-2xl font-medium text-gray-400">Powered by Gemini 3</span>
                                </div>
                            </>
                        ) : (
                            <>
                                Revolutionising <br />
                                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Influencers and sponsors collaboration platform</span>
                                <div className="block mt-8">
                                    <span className="text-2xl font-medium text-gray-400">Powered by Gemini 3</span>
                                </div>
                            </>
                        )}
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        {isCreator
                            ? "Unlock advanced analytics, generate AI brand assets, and automate your workflow to land the sponsors you deserve."
                            : "Discover top-tier creators with audited engagement, brand-safety scores, and predictive ROI models powered by Kartr AI."
                        }
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to={isCreator ? "/signup-influencer" : "/signup-sponsor"}>
                            <Button size="lg" className={`h-16 px-10 text-lg rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl ${isCreator ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"}`}>
                                Join Kartr Platform
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link to="/VirtualAi">
                            <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-2xl font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <Cpu className="w-5 h-5 mr-2 text-purple-400" />
                                Explore Innovation Lab
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* VALUE PROPOSITION: TAILORED SECTIONS */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-bold mb-6"
                        >
                            Tailored for <span className={isCreator ? "text-purple-400" : "text-blue-400"}>{isCreator ? "Top Creators" : "Global Brands"}</span>
                        </motion.h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                            Industry-standard features designed to maximize your {isCreator ? "impact" : "ROI"}.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {(isCreator ? [
                            {
                                icon: Sparkles,
                                title: "AI Asset Studio",
                                desc: "Generate high-fidelity promotional images and captions instantly tailored to your brand niche.",
                                color: "purple"
                            },
                            {
                                icon: LayoutDashboard,
                                title: "Performance Radar",
                                desc: "Track deep-dive metrics on video sentiment, engagement radius, and predicted growth trends.",
                                color: "pink"
                            },
                            {
                                icon: Zap,
                                title: "Auto-Posting Engine",
                                desc: "Seamlessly cross-post your content to Bluesky and other platforms to expand your reach.",
                                color: "orange"
                            }
                        ] : [
                            {
                                icon: Search,
                                title: "Precision Discovery",
                                desc: "Search through millions of channels with RAG-powered natural language queries to find perfect matches.",
                                color: "blue"
                            },
                            {
                                icon: Shield,
                                title: "Brand Safety Guard",
                                desc: "AI-audited niche verification and sponsorship history analysis to ensure brand alignment.",
                                color: "indigo"
                            },
                            {
                                icon: PieChart,
                                title: "ROI Predictive Analytics",
                                desc: "Real-time data visualization of creator partnerships and industry-wide collaboration graphs.",
                                color: "cyan"
                            }
                        ]).map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-7 h-7 text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                                    {feature.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LIVE STATS TICKER */}
            <div className="py-12 bg-white/5 border-y border-white/5 active:cursor-grab">
                <div className="flex whitespace-nowrap gap-12 animate-scroll items-center">
                    {[
                        "1,240+ BRANDS ACTIVE",
                        "85k+ VIDEOS ANALYZED",
                        "98.4% AI ACCURACY",
                        "2M+ REACH TRACKED",
                        "45k+ SCRIPTS GENERATED"
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-black text-gray-400 tracking-widest">{stat}</span>
                        </div>
                    ))}
                    {/* Repeat for seamless scroll */}
                    {[
                        "1,240+ BRANDS ACTIVE",
                        "85k+ VIDEOS ANALYZED",
                        "98.4% AI ACCURACY",
                        "2M+ REACH TRACKED",
                        "45k+ SCRIPTS GENERATED"
                    ].map((stat, i) => (
                        <div key={i + "_dup"} className="flex items-center gap-4">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-black text-gray-400 tracking-widest">{stat}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECONDARY SHOWCASE: INNOVATION ACCELERATOR */}
            <section className="py-32 px-6 relative bg-gradient-to-t from-transparent via-purple-500/5 to-transparent">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <motion.span className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-4 block">Beta Feature Showcase</motion.span>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Innovation Lab: <br /> Your AI Accelerator</h2>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed max-w-lg">
                            Go beyond basic analytics. Tap into our lab features to experience how Large Language Models like Llama 3.3 and Gemini are redefining product-market fit.
                        </p>
                        <Link to="/VirtualAi">
                            <Button variant="outline" className="h-14 px-8 rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all font-bold group">
                                Enter the Lab
                                <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                    <div className="lg:w-1/2 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="relative p-1 rounded-[40px] bg-gradient-to-br from-white/20 to-transparent backdrop-blur-3xl border border-white/20"
                        >
                            <div className="bg-slate-900 rounded-[39px] p-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-mono">MVP_DEMO_v1.0.exe</div>
                                </div>
                                <div className="space-y-3 font-mono text-xs md:text-sm">
                                    <div className="text-purple-400">{">"} Initializing Kartr RAG Engine...</div>
                                    <div className="text-green-400">{">"} Status: Database Connected (Firebase)</div>
                                    <div className="text-blue-400">{">"} Query: "Show top tech sponsors for gaming influencers"</div>
                                    <div className="text-gray-300 pl-4 border-l border-white/10">
                                        Found 34 matches. Top results: <br />
                                        1. Razor (High engagement, Positive sentiment) <br />
                                        2. ExpressVPN (Broad niche fit)
                                    </div>
                                    <div className="text-orange-400 animate-pulse">{">"} Generating Video Script suggestions... |</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative py-24 px-6">
                <div className="max-w-5xl mx-auto rounded-[50px] bg-gradient-to-br from-purple-600/30 via-indigo-600/30 to-blue-600/30 border border-white/10 p-12 md:p-24 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 leading-tight">Ready to transform your {isCreator ? "reach" : "results"}?</h2>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                        <Link to={isCreator ? "/signup-influencer" : "/signup-sponsor"}>
                            <Button size="lg" className={`h-16 px-12 text-xl rounded-2xl font-bold shadow-2xl transition-all hover:scale-105 ${isCreator ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"}`}>
                                Start for Free Today
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
