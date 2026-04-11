/**
 * Influencer Profile Page
 * Displays influencer's personal information, YouTube channels, and Bluesky info
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Shield, Edit2, Save, X, Youtube, Users, Eye, Video, Send, Link2, CheckCircle, AlertCircle, Sparkles, Tag, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useInfluencerGuard } from '../../hooks/useRoleGuard';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectUser, fetchCurrentUser } from '../../store/slices/authSlice';
import apiClient from '../../services/apiClient';
import { updateUserProfile } from '../../features/auth/api';
import Breadcrumbs from '../../components/common/Breadcrumbs';

interface YouTubeChannel {
    channel_id: string;
    title: string;
    subscribers: number;
    views: number;
    video_count: number;
    thumbnail_url?: string;
}

interface BlueskyInfo {
    handle: string;
    connected: boolean;
}

const InfluencerProfile = () => {
    const { isLoading: authLoading } = useInfluencerGuard();
    const user = useAppSelector(selectUser);
    const dispatch = useAppDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannel[]>([]);
    const [blueskyInfo, setBlueskyInfo] = useState<BlueskyInfo | null>(null);
    const [loadingYoutube, setLoadingYoutube] = useState(true);
    const [loadingBluesky, setLoadingBluesky] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        keywords: [] as string[],
    });
    const [newKeyword, setNewKeyword] = useState('');
    const [niche, setNiche] = useState<string | null>(null);

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                keywords: user.keywords || [],
            });
            setNiche(user.niche || null);
        }
    }, [user]);

    // Fetch YouTube channels
    useEffect(() => {
        const fetchYoutubeChannels = async () => {
            try {
                const response = await apiClient.get('/youtube/channels');
                const channels = response.data.channels || [];
                // Map backend fields to frontend interface
                const mappedChannels = channels.map((channel: any) => ({
                    ...channel,
                    subscribers: channel.subscriber_count,
                    views: channel.view_count
                }));
                setYoutubeChannels(mappedChannels);
            } catch (error) {
                console.error('Failed to fetch YouTube channels:', error);
            } finally {
                setLoadingYoutube(false);
            }
        };

        fetchYoutubeChannels();
    }, []);

    // Fetch Bluesky info
    useEffect(() => {
        const fetchBlueskyInfo = async () => {
            try {
                const response = await apiClient.get('/bluesky/status');
                if (response.data.connected) {
                    setBlueskyInfo({
                        handle: response.data.handle,
                        connected: true,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch Bluesky info:', error);
            } finally {
                setLoadingBluesky(false);
            }
        };

        fetchBlueskyInfo();
    }, []);

    const handleSave = async () => {
        try {
            await updateUserProfile({
                full_name: formData.full_name,
                keywords: formData.keywords,
                // Email update usually requires verification, so avoiding it for now or assume backend handles it safely
                // email_visible: user?.email_visible 
            });
            setIsEditing(false);
            dispatch(fetchCurrentUser()); // Refresh user data
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleAddKeyword = () => {
        if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
            setFormData({
                ...formData,
                keywords: [...formData.keywords, newKeyword.trim()]
            });
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (keywordToRemove: string) => {
        setFormData({
            ...formData,
            keywords: formData.keywords.filter(k => k !== keywordToRemove)
        });
    };

    const handleAnalyzeNiche = async () => {
        if (youtubeChannels.length === 0) {
            alert("Please connect a YouTube channel first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await apiClient.post('/youtube/analyze-niche');
            if (response.data.success) {
                setNiche(response.data.message);
                dispatch(fetchCurrentUser()); // Refresh to sync with backend
            }
        } catch (error: any) {
            console.error("Niche analysis failed:", error);
            alert(error.response?.data?.detail || "Failed to analyze niche");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Format large numbers
    const formatNumber = (num?: number): string => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Breadcrumbs items={[{ label: 'Dashboard', href: '/influencer' }, { label: 'Profile', href: '/influencer/profile' }]} />

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                    <p className="text-gray-400">Manage your account and connected platforms</p>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden mb-6"
                >
                    {/* Profile Header */}
                    <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-600">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-gray-900">
                                {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'I'}
                            </div>
                        </div>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                        >
                            {isEditing ? (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save
                                </>
                            ) : (
                                <>
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </>
                            )}
                        </button>
                        {isEditing && (
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    // Reset form data
                                    if (user) {
                                        setFormData({
                                            full_name: user.full_name || '',
                                            email: user.email || '',
                                            keywords: user.keywords || [],
                                        });
                                    }
                                }}
                                className="absolute top-4 right-28 flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        )}
                    </div>

                    {/* Profile Content */}
                    <div className="pt-16 p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {formData.full_name || user?.username}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                                    Influencer
                                </span>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-400">Username</span>
                                </div>
                                <p className="text-white font-medium">{user?.username}</p>
                            </div>

                            {/* Email */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-400">Email</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled // Disable email edit for now to simplify
                                        title="Email change not supported yet"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-white font-medium">{user?.email}</p>
                                )}
                            </div>

                            {/* Full Name */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-400">Full Name</span>
                                </div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                ) : (
                                    <p className="text-white font-medium">{user?.full_name || 'Not set'}</p>
                                )}
                            </div>


                            {/* Member Since */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-400">Member Since</span>
                                </div>
                                <p className="text-white font-medium">
                                    {user?.date_registered
                                        ? new Date(user.date_registered).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Niche & Keywords Section */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Niche Analysis */}
                            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                        <span className="text-sm text-purple-400 font-medium">AI Niche Analysis</span>
                                    </div>
                                    <button
                                        onClick={handleAnalyzeNiche}
                                        disabled={isAnalyzing}
                                        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                                    >
                                        {isAnalyzing ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="w-3 h-3" />
                                        )}
                                        {niche ? 'Regenerate' : 'Generate'}
                                    </button>
                                </div>
                                <div className="mt-3">
                                    {niche ? (
                                        <div className="text-lg font-semibold text-white tracking-wide">
                                            {niche}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm italic">
                                            Connect your YouTube channel and let AI identify your specific niche.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Keywords */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <Tag className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-400">Profile Keywords</span>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3 h-auto min-h-[40px]">
                                    {(isEditing ? formData.keywords : user?.keywords)?.map((keyword, index) => (
                                        <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                                            {keyword}
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleRemoveKeyword(keyword)}
                                                    className="ml-1 hover:text-white"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                    {(!user?.keywords?.length && !isEditing) && (
                                        <span className="text-gray-500 text-sm italic">No keywords added</span>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                                            placeholder="Add keyword..."
                                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            onClick={handleAddKeyword}
                                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* YouTube Channels Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden mb-6"
                >
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <Youtube className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">YouTube Channels</h3>
                                    <p className="text-sm text-gray-400">Your connected YouTube channels</p>
                                </div>
                            </div>
                            <Link
                                to="/influencer"
                                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                            >
                                + Connect Channel
                            </Link>
                        </div>
                    </div>

                    <div className="p-6">
                        {loadingYoutube ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                            </div>
                        ) : youtubeChannels.length > 0 ? (
                            <div className="space-y-4">
                                {youtubeChannels.map((channel) => (
                                    <div
                                        key={channel.channel_id}
                                        className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                                    >
                                        <div className="flex items-start gap-4">
                                            {channel.thumbnail_url ? (
                                                <img
                                                    src={channel.thumbnail_url}
                                                    alt={channel.title}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-red-500/20 flex items-center justify-center">
                                                    <Youtube className="w-8 h-8 text-red-500" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-white">{channel.title}</h4>
                                                <div className="grid grid-cols-3 gap-4 mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-gray-400" />
                                                        <span className="text-white font-medium">
                                                            {formatNumber(channel.subscribers)}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">subs</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                        <span className="text-white font-medium">
                                                            {formatNumber(channel.views)}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">views</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Video className="w-4 h-4 text-gray-400" />
                                                        <span className="text-white font-medium">
                                                            {formatNumber(channel.video_count)}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">videos</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                                    <Youtube className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-gray-400">No YouTube channels connected yet</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Analyze a video to connect your channel
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Bluesky Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Send className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Bluesky</h3>
                                    <p className="text-sm text-gray-400">Your Bluesky social account</p>
                                </div>
                            </div>
                            <a
                                href="/auto-posting"
                                className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                            >
                                {blueskyInfo?.connected ? 'Manage' : '+ Connect'}
                            </a>
                        </div>
                    </div>

                    <div className="p-6">
                        {loadingBluesky ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        ) : blueskyInfo?.connected ? (
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Send className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">@{blueskyInfo.handle}</span>
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">Connected and ready to post</p>
                                    </div>
                                    <a
                                        href="/auto-posting"
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        Create Post
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                                    <Send className="w-8 h-8 text-gray-500" />
                                </div>
                                <p className="text-gray-400">Bluesky not connected</p>
                                <p className="text-gray-500 text-sm mt-1">
                                    Connect your Bluesky account to enable auto-posting
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InfluencerProfile;
