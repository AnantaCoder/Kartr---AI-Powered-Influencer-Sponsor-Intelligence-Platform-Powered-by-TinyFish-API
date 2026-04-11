/**
 * Influencer Dashboard Page
 * Overview for influencers with their stats and invites
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Youtube, Users, Eye, TrendingUp, Briefcase, Send, Plus, Loader2, Check, X, Play, ExternalLink, DollarSign, Trash2, Sparkles, Filter, Mail, MessageSquare, Wand2 } from 'lucide-react';
import { useInfluencerGuard } from '../../hooks/useRoleGuard';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import apiClient from '../../services/apiClient';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SponsorshipPitchModal from '../../components/influencer/SponsorshipPitchModal';
import CampaignInvites from '../../components/influencer/CampaignInvites';

interface ChannelStats {
    totalSubscribers: number;
    totalViews: number;
    totalVideos: number;
    channelCount: number;
}

interface BlueskyStatus {
    connected: boolean;
    handle: string | null;
}

interface YouTubeChannel {
    channel_id: string;
    title: string;
    thumbnail_url?: string;
    subscribers?: number;
    views?: number;
    video_count?: number;
}

interface YouTubeVideo {
    video_id: string;
    title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    published_at: string;
    thumbnail_url: string;
    is_sponsored?: boolean;
    sponsor_name?: string;
}

interface Campaign {
    id: string;
    brand: string;
    status: string;
    date: string;
    payout: string;
    deliverables: string;
    performance: string;
}

interface BrandRecommendation {
    name: string;
    industry: string;
    fit_score: number;
    reason: string;
    logo_url?: string;
}

const InfluencerDashboard = () => {
    const { isLoading: authLoading, isAuthorized } = useInfluencerGuard();
    const user = useAppSelector(selectUser);
    const [stats, setStats] = useState<ChannelStats>({
        totalSubscribers: 0,
        totalViews: 0,
        totalVideos: 0,
        channelCount: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // YouTube Connected Channels and Videos
    const [connectedChannels, setConnectedChannels] = useState<YouTubeChannel[]>([]);
    const [recentVideos, setRecentVideos] = useState<YouTubeVideo[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);

    // Connect Modal State (YouTube)
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const [connectSuccess, setConnectSuccess] = useState(false);

    // Bluesky Modal State
    const [showBlueskyModal, setShowBlueskyModal] = useState(false);
    const [blueskyHandle, setBlueskyHandle] = useState('');
    const [blueskyPassword, setBlueskyPassword] = useState('');
    const [isConnectingBluesky, setIsConnectingBluesky] = useState(false);
    const [blueskyError, setBlueskyError] = useState<string | null>(null);
    const [blueskySuccess, setBlueskySuccess] = useState(false);
    const [blueskyStatus, setBlueskyStatus] = useState<BlueskyStatus>({ connected: false, handle: null });
    const [loadingBlueskyStatus, setLoadingBlueskyStatus] = useState(true);

    // Sponsorship State
    const [activeTab, setActiveTab] = useState('overview');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [recommendations, setRecommendations] = useState<BrandRecommendation[]>([]);
    const [loadingSponsorships, setLoadingSponsorships] = useState(false);

    // Pitch Modal State
    const [showPitchModal, setShowPitchModal] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<{ name: string, details: string } | null>(null);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/youtube/channels');
            const channels = response.data.channels || [];

            // Store connected channels with mapped fields
            const mappedChannels = channels.map((channel: any) => ({
                ...channel,
                subscribers: channel.subscriber_count,
                views: channel.view_count, // Map backend view_count to frontend views
                video_count: channel.video_count
            }));
            setConnectedChannels(mappedChannels);

            const newStats = mappedChannels.reduce((acc: ChannelStats, channel: any) => ({
                totalSubscribers: acc.totalSubscribers + (channel.subscribers || 0),
                totalViews: acc.totalViews + (channel.views || 0),
                totalVideos: acc.totalVideos + (channel.video_count || 0),
                channelCount: acc.channelCount + 1
            }), {
                totalSubscribers: 0,
                totalViews: 0,
                totalVideos: 0,
                channelCount: 0
            });

            setStats(newStats);

            // Fetch videos for the first connected channel
            if (channels.length > 0 && channels[0].channel_id) {
                fetchChannelVideos(channels[0].channel_id);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchChannelVideos = async (channelId: string) => {
        setLoadingVideos(true);
        try {
            const response = await apiClient.post('/youtube/analyze-channel', {
                channel_id: channelId,
                max_videos: 5
            });

            const videos = response.data.videos || [];
            setRecentVideos(videos.map((v: any) => ({
                video_id: v.video_id || v.id,
                title: v.title,
                view_count: v.view_count || v.views || 0,
                like_count: v.like_count || v.likes || 0,
                comment_count: v.comment_count || v.comments || 0,
                published_at: v.published_at || v.publish_date || '',
                thumbnail_url: v.thumbnail_url || v.thumbnail || '',
                is_sponsored: v.is_sponsored || false,
                sponsor_name: v.sponsor_name || null
            })));
        } catch (error) {
            console.error('Failed to fetch channel videos:', error);
        } finally {
            setLoadingVideos(false);
        }
    };

    const fetchBlueskyStatus = async () => {
        try {
            const response = await apiClient.get('/bluesky/status');
            setBlueskyStatus({
                connected: response.data.connected,
                handle: response.data.handle
            });
        } catch (error) {
            console.error('Failed to fetch Bluesky status:', error);
        } finally {
            setLoadingBlueskyStatus(false);
        }
    };

    const fetchSponsorshipData = async () => {
        setLoadingSponsorships(true);
        try {
            // Fetch past campaigns
            const campaignRes = await apiClient.get('/influencer/past-campaigns');
            setCampaigns(campaignRes.data.campaigns || []);

            // Fetch recommendations based on common influencer niche (e.g., Tech)
            // Initial fetch - defaults to Tech or User's niche
            const userNiche = user?.niche || "Tech";
            const recRes = await apiClient.get(`/influencer/recommendations/${userNiche}`);
            setRecommendations(recRes.data.potential_sponsors || []);
        } catch (error) {
            console.error('Failed to fetch sponsorship data:', error);
        } finally {
            setLoadingSponsorships(false);
        }
    };

    const handleCategoryChange = async (category: string) => {
        setLoadingSponsorships(true);
        try {
            // If "Trending", we might use a generic "General" or specific logic in backend
            // For now, we utilize the same endpoint with the category as "niche"
            const recRes = await apiClient.get(`/influencer/recommendations/${category}`);
            setRecommendations(recRes.data.potential_sponsors || []);
        } catch (err) {
            console.error("Failed to filter:", err);
        } finally {
            setLoadingSponsorships(false);
        }
    };

    const handleOpenPitch = (brand: BrandRecommendation) => {
        setSelectedBrand({
            name: brand.name,
            details: brand.reason
        });
        setShowPitchModal(true);
    };

    const handleConnectBluesky = async () => {
        if (!blueskyHandle.trim() || !blueskyPassword.trim()) return;

        setIsConnectingBluesky(true);
        setBlueskyError(null);
        setBlueskySuccess(false);

        try {
            const response = await apiClient.post('/bluesky/connect', {
                identifier: blueskyHandle,
                password: blueskyPassword
            });

            if (response.data.success) {
                setBlueskySuccess(true);
                setBlueskyStatus({ connected: true, handle: blueskyHandle });
                setBlueskyPassword(''); // Clear password for security
                setTimeout(() => {
                    setShowBlueskyModal(false);
                    setBlueskySuccess(false);
                }, 2000);
            }
        } catch (err: any) {
            console.error('Bluesky connection error:', err);
            setBlueskyError(err.response?.data?.detail || 'Failed to connect. Check your credentials.');
        } finally {
            setIsConnectingBluesky(false);
        }
    };

    const handleViewInvites = () => {
        setActiveTab('invites');
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchStats();
            fetchBlueskyStatus();
            fetchSponsorshipData();
        }
    }, [isAuthorized]);

    // Check for query params (e.g. redirect from Analysis)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const brandParam = params.get("brand");
        const tabParam = params.get("tab");

        if (tabParam) {
            setActiveTab(tabParam);
        }

        if (brandParam) {
            // Delay slightly to ensure tab switch works
            setTimeout(() => {
                setSelectedBrand({ name: brandParam, details: "Identified via YouTube Analysis" });
                setShowPitchModal(true);
                // Clean up URL
                window.history.replaceState({}, '', '/influencer?tab=sponsorships');
            }, 500);
        }
    }, []);

    const handleConnectYoutube = async () => {
        if (!youtubeUrl.trim()) return;

        setIsConnecting(true);
        setConnectError(null);
        setConnectSuccess(false);

        try {
            // Call stats endpoint which saves the channel/video info to DB
            const response = await apiClient.post('/youtube/stats', {
                youtube_url: youtubeUrl
            });

            if (response.data.error) {
                setConnectError(response.data.error);
            } else {
                setConnectSuccess(true);
                setYoutubeUrl('');
                fetchStats(); // Refresh stats
                setTimeout(() => {
                    setShowConnectModal(false);
                    setConnectSuccess(false);
                }, 2000);
            }
        } catch (err: any) {
            console.error('Connection error:', err);
            setConnectError(err.response?.data?.detail || 'Failed to connect channel. Please check the URL.');
        } finally {
            setIsConnecting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
        );
    }

    const handleRemoveChannel = async (channelId: string) => {
        if (!confirm('Are you sure you want to remove this channel?')) return;

        try {
            await apiClient.delete(`/youtube/channels/${channelId}`);
            // Refresh stats and channels
            fetchStats();
        } catch (error) {
            console.error('Failed to remove channel:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Breadcrumbs items={[{ label: 'Dashboard', href: '/influencer' }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, {user?.full_name || user?.username}!
                    </h1>
                    <p className="text-gray-400">Manage your profile and view campaign invites</p>
                </motion.div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="invites" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 flex items-center gap-2">
                            Invites
                            <span className="bg-purple-500/20 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full border border-purple-500/30">2</span>
                        </TabsTrigger>
                        <TabsTrigger value="sponsorships" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                            Sponsorship Hub
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 space-y-8 outline-none">

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <AnalyticsCard
                                title="YouTube Channels"
                                value={stats.channelCount}
                                icon={Youtube}
                                color="red"
                            />
                            <AnalyticsCard
                                title="Total Subscribers"
                                value={stats.totalSubscribers}
                                icon={Users}
                                color="purple"
                            />
                            <AnalyticsCard
                                title="Total Views"
                                value={stats.totalViews}
                                icon={Eye}
                                color="blue"
                            />
                            <AnalyticsCard
                                title="Total Videos"
                                value={stats.totalVideos}
                                icon={TrendingUp}
                                color="green"
                            />
                        </div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                        >
                            {/* Connect YouTube */}
                            <div className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Youtube className="w-10 h-10 text-red-500" />
                                    {loadingStats && <Loader2 className="w-4 h-4 text-red-500 animate-spin" />}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Connect YouTube</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Link a new channel or video to update your analytics.
                                </p>
                                <Button
                                    onClick={() => setShowConnectModal(true)}
                                    className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Connect Channel
                                </Button>
                            </div>

                            {/* Connect Bluesky */}
                            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Send className="w-10 h-10 text-blue-400" />
                                    {loadingBlueskyStatus && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                                    {!loadingBlueskyStatus && blueskyStatus.connected && (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                            <Check className="w-3 h-3" />
                                            Connected
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Connect Bluesky</h3>

                                {/* Show connected handle if available */}
                                {blueskyStatus.connected && blueskyStatus.handle && (
                                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-xs text-gray-400 mb-1">Connected Account</p>
                                        <p className="text-blue-300 font-medium truncate">@{blueskyStatus.handle}</p>
                                    </div>
                                )}

                                <p className="text-gray-400 text-sm mb-4">
                                    {blueskyStatus.connected
                                        ? 'Your account is linked. You can update your credentials below.'
                                        : 'Link your Bluesky account for automated posting features.'
                                    }
                                </p>
                                <Button
                                    onClick={() => {
                                        setShowBlueskyModal(true);
                                        if (blueskyStatus.handle) {
                                            setBlueskyHandle(blueskyStatus.handle);
                                        }
                                    }}
                                    className="w-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 border border-blue-500/50"
                                >
                                    {blueskyStatus.connected ? (
                                        <>Update Credentials</>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Connect Bluesky
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* View Invites */}
                            <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-6">
                                <Briefcase className="w-10 h-10 text-purple-400 mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Campaign Invites</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    View and respond to campaign invitations from sponsors.
                                </p>
                                <Button
                                    onClick={handleViewInvites}
                                    className="w-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 shadow-none border border-purple-500/10"
                                >
                                    View Invites
                                </Button>
                            </div>
                        </motion.div>

                        {/* Potential Sponsors (New) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    Potential Sponsors
                                </h2>
                                <button onClick={fetchSponsorshipData} className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Refresh List
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {loadingSponsorships ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
                                    ))
                                ) : recommendations.slice(0, 3).map((brand, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                                        <div className="flex items-center gap-3 mb-3">
                                            {/* Logo */}
                                            {brand.logo_url ? (
                                                <img src={brand.logo_url} className="w-10 h-10 rounded-full object-cover" alt={brand.name} />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{brand.name}</h3>
                                                <p className="text-[10px] text-gray-500">{brand.industry}</p>
                                            </div>
                                            <div className="ml-auto text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                {brand.fit_score}%
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 h-8">
                                            {brand.reason}
                                        </p>
                                        <Button
                                            onClick={() => handleOpenPitch(brand)}
                                            className="w-full h-8 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 text-xs"
                                        >
                                            <Sparkles className="w-3 h-3 mr-2" />
                                            Generate Pitch
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Connected Channels */}
                        {connectedChannels.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="mb-8"
                            >
                                <h2 className="text-xl font-semibold text-white mb-4">Connected Channels</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {connectedChannels.map((channel) => (
                                        <div
                                            key={channel.channel_id}
                                            className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-4 group relative"
                                        >
                                            {channel.thumbnail_url && (
                                                <img
                                                    src={channel.thumbnail_url}
                                                    alt={channel.title}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-medium truncate">{channel.title}</h3>
                                                <div className="flex flex-col text-sm text-gray-400">
                                                    <span>{(channel.subscribers || 0).toLocaleString()} subscribers</span>
                                                    <span>{(channel.views || 0).toLocaleString()} views</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`https://youtube.com/channel/${channel.channel_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-400 hover:text-white p-1"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => handleRemoveChannel(channel.channel_id)}
                                                    className="text-gray-400 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remove Channel"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Recent Videos */}
                        {stats.channelCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold text-white">Recent Videos</h2>
                                    {loadingVideos && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                                </div>

                                {recentVideos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recentVideos.map((video) => (
                                            <div
                                                key={video.video_id}
                                                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative aspect-video">
                                                    <img
                                                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <a
                                                        href={`https://youtube.com/watch?v=${video.video_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                                                    >
                                                        <Play className="w-12 h-12 text-white" />
                                                    </a>
                                                    {video.is_sponsored && (
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium">
                                                            <DollarSign className="w-3 h-3" />
                                                            Sponsored
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-4">
                                                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">
                                                        {video.title}
                                                    </h3>

                                                    {/* Stats */}
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" />
                                                            {video.view_count.toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {video.like_count.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Sponsor Info */}
                                                    {video.sponsor_name && (
                                                        <div className="mt-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                                            <p className="text-xs text-gray-400">Sponsor</p>
                                                            <p className="text-green-400 text-sm font-medium">{video.sponsor_name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                                        {loadingVideos ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
                                                <p className="text-gray-400">Loading recent videos...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-gray-500" />
                                                </div>
                                                <p className="text-gray-300">You are tracking {stats.channelCount} channel(s).</p>
                                                <p className="text-gray-500 text-sm mt-2">
                                                    Video analysis is being processed...
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </TabsContent>

                    <TabsContent value="invites" className="mt-6 space-y-8 outline-none">
                        <CampaignInvites />
                    </TabsContent>

                    <TabsContent value="sponsorships" className="mt-6 space-y-8 outline-none">
                        {/* Category Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                            {["Tech", "Gaming", "Beauty", "Lifestyle", "Finance", "Education"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 focus:bg-purple-500/20 focus:text-purple-300 focus:border-purple-500/30 transition-all whitespace-nowrap"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Potential Sponsors */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    Brand Opportunities
                                </h2>
                                {loadingSponsorships && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                            </div>
                            <div className="grid gap-4">
                                {recommendations.length === 0 && !loadingSponsorships && (
                                    <p className="text-gray-500 text-sm">No recommendations found for this category.</p>
                                )}
                                {recommendations.map((brand, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl bg-bg-card/40 backdrop-blur-xl border border-border hover:border-purple-500/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                {/* Logo */}
                                                {brand.logo_url ? (
                                                    <img src={brand.logo_url} className="w-10 h-10 rounded-full object-cover" alt={brand.name} />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                        <Briefcase className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                                                        {brand.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-muted-foreground">{brand.industry}</p>
                                                        {/* Source Badge */}
                                                        {/* @ts-ignore */}
                                                        {brand.source === 'Web Search' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Live</span>}
                                                        {/* @ts-ignore */}
                                                        {brand.source === 'Trending' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Trending</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                                                <TrendingUp className="w-3 h-3" /> {brand.fit_score}% Fit
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 pl-12">
                                            {brand.reason}
                                        </p>
                                        <div className="pl-12">
                                            <Button
                                                onClick={() => handleOpenPitch(brand)}
                                                className="w-full bg-purple-600/10 text-purple-400 border border-purple-500/20 hover:bg-purple-600 hover:text-white"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Pitch
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Sponsorship Portfolio (Replaces simple table) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >

                            {/* Last Campaign Done */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-blue-400" />
                                    Last Campaign
                                </h2>
                                {campaigns.length > 0 ? (
                                    <div className="rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Briefcase className="w-24 h-24" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{campaigns[0]?.brand}</h3>
                                                <p className="text-blue-300 text-xs font-mono uppercase tracking-wider">{campaigns[0]?.date}</p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                                                {campaigns[0]?.payout}
                                            </span>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="flex gap-3 text-sm text-gray-300">
                                                <div className="min-w-[4px] rounded-full bg-blue-500" />
                                                <p className="text-xs">{campaigns[0]?.deliverables}</p>
                                            </div>

                                            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-white/10">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-500 uppercase">Status</p>
                                                    <p className="text-green-400 font-bold text-xs">{campaigns[0]?.status}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-500 uppercase">Performance</p>
                                                    <p className="text-indigo-400 font-bold text-xs">{campaigns[0]?.performance}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-gray-500 text-sm">
                                        No past campaigns found.
                                    </div>
                                )}
                            </div>


                        </motion.div>

                    </TabsContent>
                </Tabs>
            </div>

            {/* Connect YouTube Modal */}
            <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
                <DialogContent className="sm:max-w-[425px] bg-[#1a1f2e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Youtube className="w-5 h-5 text-red-500" />
                            Connect YouTube Channel
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter any video URL or channel link. We'll automatically verify and link the channel to your profile.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">YouTube URL</label>
                            <Input
                                placeholder="https://youtube.com/watch?v=..."
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                            />
                        </div>
                        {connectError && (
                            <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-500/30">
                                {connectError}
                            </div>
                        )}
                        {connectSuccess && (
                            <div className="p-3 rounded-lg bg-green-500/20 text-green-200 text-sm border border-green-500/30 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Channel connected successfully!
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConnectModal(false)}
                            className="border-white/10 hover:bg-white/10 text-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConnectYoutube}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isConnecting || !youtubeUrl.trim()}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect Channel"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Connect Bluesky Modal */}
            <Dialog open={showBlueskyModal} onOpenChange={setShowBlueskyModal}>
                <DialogContent className="sm:max-w-[425px] bg-[#1a1f2e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-400" />
                            {blueskyStatus.connected ? 'Update Bluesky Account' : 'Connect Bluesky Account'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter your Bluesky handle and app password. Your credentials are stored securely.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Bluesky Handle</label>
                            <Input
                                placeholder="yourname.bsky.social"
                                value={blueskyHandle}
                                onChange={(e) => setBlueskyHandle(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                            />
                            <p className="text-xs text-gray-500">e.g., yourname.bsky.social or custom domain</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">App Password</label>
                            <Input
                                type="password"
                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                value={blueskyPassword}
                                onChange={(e) => setBlueskyPassword(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                            />
                            <p className="text-xs text-gray-500">
                                Create an app password at{' '}
                                <a
                                    href="https://bsky.app/settings/app-passwords"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    bsky.app/settings/app-passwords
                                </a>
                            </p>
                        </div>
                        {blueskyError && (
                            <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-500/30">
                                {blueskyError}
                            </div>
                        )}
                        {blueskySuccess && (
                            <div className="p-3 rounded-lg bg-green-500/20 text-green-200 text-sm border border-green-500/30 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Bluesky account connected successfully!
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowBlueskyModal(false);
                                setBlueskyError(null);
                                setBlueskyPassword('');
                            }}
                            className="border-white/10 hover:bg-white/10 text-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConnectBluesky}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isConnectingBluesky || !blueskyHandle.trim() || !blueskyPassword.trim()}
                        >
                            {isConnectingBluesky ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : blueskyStatus.connected ? (
                                "Update Account"
                            ) : (
                                "Connect Account"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SponsorshipPitchModal
                isOpen={showPitchModal}
                onClose={() => setShowPitchModal(false)}
                brandName={selectedBrand?.name || ''}
                brandDetails={selectedBrand?.details || ''}
                videoId={recentVideos.length > 0 ? recentVideos[0]?.video_id : undefined}
            />
        </div >
    );
};

export default InfluencerDashboard;
