/**
 * Sponsor Dashboard Page
 * Overview with campaigns, quick stats, and discovery shortcut
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BarChart2, Users, Briefcase, TrendingUp, Loader2, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSponsorGuard } from '../../hooks/useRoleGuard';
import { useCampaigns } from '../../hooks/useCampaigns';
import CampaignCard from '../../components/campaign/CampaignCard';
import CampaignForm from '../../components/campaign/CampaignForm';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import Header from '../../components/layout/Header';
import TopInfluencers from '../../components/youtube/TopInfluencers';
import type { Campaign, CampaignCreateRequest, CampaignUpdateRequest } from '../../types/campaign';
import SponsorOutreachModal from '../../components/sponsor/SponsorOutreachModal';
import apiClient from '../../services/apiClient';

const SponsorDashboard = () => {
    const navigate = useNavigate();
    const { isLoading: authLoading, isAuthorized } = useSponsorGuard();
    const {
        campaigns,
        loading,
        error,
        loadCampaigns,
        create,
        update,
        remove,
        activate,
        pause,
        inactivate,
        selectedCampaign,
        selectCampaign,
    } = useCampaigns();

    const [showForm, setShowForm] = useState(false);

    // New Features State
    const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
    const [recommendedCreators, setRecommendedCreators] = useState<any[]>([]);
    const [loadingInsights, setLoadingInsights] = useState(true);
    const [showOutreachModal, setShowOutreachModal] = useState(false);
    const [selectedCreator, setSelectedCreator] = useState<any | null>(null);

    const fetchLatestInsights = async () => {
        setLoadingInsights(true);
        try {
            const latestRes = await apiClient.get('/campaigns/latest');
            setLatestCampaign(latestRes.data);

            // Robust Mock Data for UI Demo (Ensuring no empty dashes)
            setRecommendedCreators([
                {
                    name: "TechReviewer Pro",
                    niche: "Technology",
                    thumbnail_url: "https://ui-avatars.com/api/?name=TR&background=random",
                    subscribers: "1.2M",
                    score: 95
                },
                {
                    name: "Gadget King",
                    niche: "Consumer Electronics",
                    thumbnail_url: "https://ui-avatars.com/api/?name=GK&background=random",
                    subscribers: "850K",
                    score: 88
                },
                {
                    name: "Daily Vlog",
                    niche: "Lifestyle",
                    thumbnail_url: "https://ui-avatars.com/api/?name=DV&background=random",
                    subscribers: "2.1M",
                    score: 92
                },
                {
                    name: "Art Station",
                    niche: "Art",
                    thumbnail_url: "https://ui-avatars.com/api/?name=AS&background=random",
                    subscribers: "500K",
                    score: 90
                }
            ]);
        } catch (error) {
            console.error('Failed to fetch dashboard insights:', error);
        } finally {
            setLoadingInsights(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            loadCampaigns();
            fetchLatestInsights();
        }
    }, [isAuthorized, loadCampaigns]);

    const handleCreate = async (data: CampaignCreateRequest | CampaignUpdateRequest) => {
        await create(data as CampaignCreateRequest);
        setShowForm(false);
    };

    const handleUpdate = async (data: CampaignCreateRequest | CampaignUpdateRequest) => {
        if (selectedCampaign) {
            await update(selectedCampaign.id, data);
            selectCampaign(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            await remove(id);
        }
    };

    const handleFindInfluencers = (campaign: Campaign) => {
        navigate(`/sponsor/discovery?campaign=${campaign.id}`);
    };

    // Calculate stats
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const totalMatched = campaigns.reduce((sum, c) => sum + c.matched_influencers_count, 0);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                    >
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Sponsor Dashboard</h1>
                            <p className="text-muted-foreground">Manage your campaigns and find influencers</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/sponsor/discovery')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors font-medium"
                            >
                                <Search className="w-4 h-4" />
                                Discover Influencers
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                New Campaign
                            </button>
                        </div>
                    </motion.div>

                    {/* Error Alert */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}

                    <Tabs defaultValue="overview" className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <TabsList className="bg-white/5 border border-white/10">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Overview</TabsTrigger>
                                <TabsTrigger value="campaigns" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Your Campaigns</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AnalyticsCard
                                    title="Total Campaigns"
                                    value={campaigns.length}
                                    icon={Briefcase}
                                    color="blue"
                                />
                                <AnalyticsCard
                                    title="Active Campaigns"
                                    value={activeCampaigns}
                                    icon={TrendingUp}
                                    color="green"
                                />
                                <AnalyticsCard
                                    title="Total Influencers Matched"
                                    value={totalMatched}
                                    icon={Users}
                                    color="purple"
                                />
                            </div>

                            {/* Trending Creators Section */}
                            <div>
                                <TopInfluencers
                                    themeColor="blue"
                                    niche="Trending"
                                    mode="creator"
                                    influencers={[
                                        { name: "MrBeast", handle: "@MrBeast", engagement_rate: 12.4, subscribers: "230M", score: 99, thumbnail_url: "https://ui-avatars.com/api/?name=MrBeast&background=random" },
                                        { name: "Marques Brownlee", handle: "@mkbhd", engagement_rate: 8.5, subscribers: "18.5M", score: 98, thumbnail_url: "https://ui-avatars.com/api/?name=MKBHD&background=random" },
                                        { name: "Linus Tech Tips", handle: "@LinusTechTips", engagement_rate: 7.2, subscribers: "15.6M", score: 95, thumbnail_url: "https://ui-avatars.com/api/?name=LTT&background=random" }
                                    ]}
                                    onApply={(name) => {
                                        setSelectedCreator({ name, niche: "Trending", thumbnail_url: "" });
                                        setShowOutreachModal(true);
                                    }}
                                />
                            </div>

                            {/* Latest Insights & Recommended Creators */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Latest Campaign Insights */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="lg:col-span-1 rounded-2xl border border-border bg-card p-6 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-green-400" />
                                            Latest Activity
                                        </h2>
                                        {latestCampaign && (
                                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 uppercase font-bold">
                                                {latestCampaign.status}
                                            </span>
                                        )}
                                    </div>

                                    {loadingInsights ? (
                                        <div className="h-40 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                                        </div>
                                    ) : latestCampaign ? (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-medium text-muted-foreground">Project Name</h3>
                                                <p className="text-foreground font-semibold">{latestCampaign.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-muted/50 p-3 rounded-xl border border-border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Budget</p>
                                                    <p className="text-sm font-bold text-blue-500 dark:text-blue-400">${latestCampaign.budget_max}</p>
                                                </div>
                                                <div className="bg-muted/50 p-3 rounded-xl border border-border">
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Matched</p>
                                                    <p className="text-sm font-bold text-purple-500 dark:text-purple-400">{latestCampaign.matched_influencers_count}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/sponsor/campaigns/${latestCampaign.id}`)}
                                                className="w-full py-2 bg-muted/50 hover:bg-accent text-foreground rounded-xl border border-border transition-colors text-sm font-medium"
                                            >
                                                View Full Report
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-40 flex items-center justify-center text-center">
                                            <p className="text-sm text-gray-500">No recent activity found. Start a new campaign to see insights here.</p>
                                        </div>
                                    )}
                                </motion.div>

                                {/* AI Creator Match */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="lg:col-span-2 rounded-2xl border border-border bg-card p-6"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            Creators for Your Next Video
                                        </h2>
                                        <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">Refresh List</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {loadingInsights ? (
                                            Array(2).fill(0).map((_, i) => (
                                                <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
                                            ))
                                        ) : recommendedCreators.map((creator, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-card border border-border hover:border-purple-500/30 transition-all group">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <img src={creator.thumbnail_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                    <div className="overflow-hidden">
                                                        <h3 className="text-sm font-semibold text-foreground truncate">{creator.name}</h3>
                                                        <p className="text-[10px] text-muted-foreground">{creator.niche}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        setSelectedCreator(creator);
                                                        setShowOutreachModal(true);
                                                    }}
                                                    className="w-full h-8 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 text-xs"
                                                >
                                                    <Send className="w-3 h-3 mr-2" />
                                                    Connect
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </TabsContent>

                        <TabsContent value="campaigns" className="animate-in fade-in slide-in-from-bottom-5">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground mb-4">Your Campaigns</h2>
                                {loading ? (
                                    <div className="flex items-center justify-center h-64">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                                    </div>
                                ) : campaigns.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-16 bg-muted/10 rounded-2xl border border-border"
                                    >
                                        <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
                                        <p className="text-muted-foreground mb-6">Create your first campaign to start finding influencers</p>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Campaign
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {campaigns.map((campaign, idx) => (
                                            <CampaignCard
                                                key={campaign.id || `campaign-${idx}`}
                                                campaign={campaign}
                                                onEdit={(c) => {
                                                    selectCampaign(c);
                                                }}
                                                onDelete={handleDelete}
                                                onActivate={activate}
                                                onPause={pause}
                                                onInactivate={inactivate}
                                                onFindInfluencers={handleFindInfluencers}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Create/Edit Form Modal */}
                    {(showForm || selectedCampaign) && (
                        <CampaignForm
                            campaign={selectedCampaign}
                            onSubmit={selectedCampaign ? handleUpdate : handleCreate}
                            onCancel={() => {
                                setShowForm(false);
                                selectCampaign(null);
                            }}
                            loading={loading}
                        />
                    )}

                    <SponsorOutreachModal
                        isOpen={showOutreachModal}
                        onClose={() => setShowOutreachModal(false)}
                        influencerName={selectedCreator?.name || ''}
                        niche={latestCampaign?.niche || 'Technology'}
                        campaignDetails={latestCampaign?.description || 'Promoting our new product launch.'}
                    />
                </div>
            </div>
        </div>
    );
};

export default SponsorDashboard;
