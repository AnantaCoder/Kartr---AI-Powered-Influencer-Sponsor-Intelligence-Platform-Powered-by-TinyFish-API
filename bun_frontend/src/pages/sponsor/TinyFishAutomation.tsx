import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fish, ArrowLeft, Bot, CheckCircle2, ChevronRight, Send, Search, Users, Globe, AlertCircle, RefreshCw } from 'lucide-react';
import { useSponsorGuard } from '../../hooks/useRoleGuard';
import { useCampaigns } from '../../hooks/useCampaigns';
import { useDiscovery } from '../../hooks/useDiscovery';
import apiClient from '../../services/apiClient';

interface GlobalCreator {
    bluesky_handle: string;
    display_name: string;
    description: string;
    followers_count: number;
    avatar: string;
    did: string;
    isGlobal: true;
    influencer_id: string; // derived from handle
}

const TinyFishAutomation = () => {
    const navigate = useNavigate();
    const { isLoading: authLoading, isAuthorized } = useSponsorGuard();
    const { campaigns, loadCampaigns } = useCampaigns();
    const { searchImmediate, searchResults, loading: searchLoading } = useDiscovery();
    
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [selectedInfluencers, setSelectedInfluencers] = useState<Set<string>>(new Set());
    const [messageTemplate, setMessageTemplate] = useState<string>(
        "Hi! I'd love to invite you to a sponsorship campaign on Kartr. Join here: [LINK]"
    );
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [sendResults, setSendResults] = useState<{handle: string; success: boolean; error?: string}[]>([]);
    
    const [activeTab, setActiveTab] = useState<'kartr' | 'global' | 'custom'>('kartr');
    const [globalProfiles, setGlobalProfiles] = useState<GlobalCreator[]>([]);
    const [globalLoading, setGlobalLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [lastNicheQuery, setLastNicheQuery] = useState<string>('');

    // Custom Search State
    const [customProfiles, setCustomProfiles] = useState<GlobalCreator[]>([]);
    const [customSearchQuery, setCustomSearchQuery] = useState('');
    const [customSearchLoading, setCustomSearchLoading] = useState(false);
    const [customSearchError, setCustomSearchError] = useState<string | null>(null);

    /** Extract the best single-word search term from campaign data */
    const extractBestSearchTerm = (campaign: any): string => {
        // Prefer the niche field — strip commas/extras and take the first meaningful word
        const candidates: string[] = [];

        if (campaign.niche) {
            // niche might be a single word like "Tech" or a phrase
            const nicheWord = campaign.niche.split(/[,\s]+/).find((w: string) => w.trim().length > 2);
            if (nicheWord) candidates.push(nicheWord.trim());
        }
        if (campaign.name) {
            // Take first meaningful word from the campaign name
            const nameWord = campaign.name.split(/[\s,]+/).find((w: string) => w.trim().length > 2);
            if (nameWord) candidates.push(nameWord.trim());
        }
        if (campaign.keywords && campaign.keywords.length > 0) {
            // Keywords array — use the longest/most meaningful one
            const best = [...campaign.keywords]
                .sort((a: string, b: string) => b.length - a.length)
                .find((k: string) => k.trim().length > 2);
            if (best) candidates.push(best.trim());
        }

        return candidates[0] || 'influencer';
    };

    useEffect(() => {
        if (isAuthorized) {
            loadCampaigns();
        }
    }, [isAuthorized, loadCampaigns]);

    const fetchGlobalCreators = async (niche: string) => {
        // Build the best possible search query
        const query = (niche || '').trim() || 'creator influencer';
        setLastNicheQuery(query);
        if (globalLoading) return;
        setGlobalLoading(true);
        setGlobalError(null);
        setGlobalProfiles([]);
        try {
            const resp = await apiClient.get('/bluesky/search-creators', {
                params: { q: query, limit: 10 }
            });
            const creators: GlobalCreator[] = (resp.data.creators || []).map((c: any) => ({
                ...c,
                isGlobal: true as const,
                influencer_id: `global_${c.bluesky_handle.replace(/\./g, '_')}`
            }));
            setGlobalProfiles(creators);
            if (creators.length === 0) {
                setGlobalError(`No results for "${query}". Try refreshing or a different campaign.`);
            }
        } catch (e: any) {
            console.error('Failed to fetch global Bluesky creators:', e);
            const msg = e?.response?.data?.detail || e?.message || 'Unknown error';
            setGlobalError(`Failed to load creators: ${msg}`);
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleCustomSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const handle = customSearchQuery.trim();
        if (!handle) return;

        setCustomSearchLoading(true);
        setCustomSearchError(null);
        try {
            const resp = await apiClient.get('/bluesky/lookup-profile', {
                params: { handle }
            });
            const c = resp.data;
            const newCreator: GlobalCreator = {
                ...c,
                isGlobal: true,
                influencer_id: `global_${c.bluesky_handle.replace(/\./g, '_')}`
            };
            
            // Avoid duplicates
            setCustomProfiles(prev => {
                if (prev.some(p => p.bluesky_handle === newCreator.bluesky_handle)) return prev;
                return [newCreator, ...prev];
            });
            setCustomSearchQuery('');
        } catch (err: any) {
            console.error('Custom search failed:', err);
            const msg = err?.response?.data?.detail || err?.message || 'Profile not found';
            setCustomSearchError(msg);
        } finally {
            setCustomSearchLoading(false);
        }
    };

    const handleCampaignChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedCampaignId(value);
        setSelectedInfluencers(new Set());
        setSendSuccess(false);
        setSendError(null);
        setGlobalProfiles([]);

        if (value) {
            const campaign = campaigns.find(c => c.id === value);
            if (campaign) {
                searchImmediate({
                    niche: campaign.niche || '',
                    keywords: campaign.keywords?.join(',') || '',
                    description: campaign.description || '',
                    name: '',
                    limit: 10,
                });
                // Extract a clean, single search term for Bluesky
                const nicheQuery = extractBestSearchTerm(campaign);
                fetchGlobalCreators(nicheQuery);
            }
        }
    };

    const toggleInfluencer = (id: string) => {
        setSelectedInfluencers(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getProfileHandle = (id: string): string => {
        const kartr = searchResults.find(r => r.influencer_id === id);
        if (kartr) return kartr.bluesky_handle || `@${kartr.username}.bsky.social`;
        const global = globalProfiles.find(r => r.influencer_id === id);
        if (global) return global.bluesky_handle;
        return `@user.bsky.social`;
    };

    const handleAutomate = async () => {
        if (!selectedCampaignId || selectedInfluencers.size === 0) return;
        
        setIsSending(true);
        setSendSuccess(false);
        setSendError(null);
        setSendResults([]);
        
        try {
            const influencersPayload = Array.from(selectedInfluencers).map(id => ({
                influencer_id: id,
                bluesky_handle: getProfileHandle(id)
            }));

            const resp = await apiClient.post(`/campaigns/${selectedCampaignId}/send-bluesky-invites`, {
                influencers: influencersPayload,
                message_template: messageTemplate
            });

            const data = resp.data;
            const results = (data.results || []).map((r: any) => ({
                handle: r.bluesky_handle,
                success: r.success,
                error: r.error
            }));
            setSendResults(results);
            setSendSuccess(true);
            setSelectedInfluencers(new Set());
        } catch (error: any) {
            console.error('Automation error:', error);
            setSendError(error?.response?.data?.detail || 'Failed to send. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
        );
    }
    const currentList = activeTab === 'kartr' ? searchResults : activeTab === 'global' ? globalProfiles : customProfiles;
    const isListLoading = activeTab === 'kartr' ? searchLoading : activeTab === 'global' ? globalLoading : false;

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-orange-500/30">
            {/* Minimal Header */}
            <header className="border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/sponsor')}
                        className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400">
                            <Fish className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-medium tracking-tight text-white/90">
                            TinyFish <span className="text-zinc-500 font-normal">Automation</span>
                        </h1>
                    </div>
                </div>
                <span className="text-[11px] text-zinc-600 font-mono hidden md:block">
                    Bluesky DM Bot · Powered by TinyFish AI
                </span>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Configuration */}
                    <div className="lg:col-span-5 space-y-8">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <h2 className="text-2xl font-light mb-8 text-white/90 tracking-tight">Configure Outreach</h2>
                            
                            <div className="space-y-6">
                                {/* Campaign Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Target Campaign</label>
                                    <div className="relative">
                                        <select
                                            value={selectedCampaignId}
                                            onChange={handleCampaignChange}
                                            className="w-full appearance-none bg-zinc-900 border border-white/10 rounded-xl py-3.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-light"
                                        >
                                            <option value="">Select a campaign...</option>
                                            {campaigns.filter(c => c.status !== 'completed').map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Message Template */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Outreach Message</label>
                                    <textarea
                                        value={messageTemplate}
                                        onChange={(e) => setMessageTemplate(e.target.value)}
                                        rows={6}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-light resize-none leading-relaxed"
                                        placeholder="Write your custom message here..."
                                    />
                                    <p className="text-[11px] text-zinc-500 font-light">
                                        Use <code className="text-orange-400 bg-orange-500/10 px-1 rounded">[LINK]</code> as a placeholder — it will be replaced with the campaign invite link.
                                    </p>
                                </div>
                                
                                {/* Status Messages */}
                                {sendSuccess && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.97 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                            <p className="text-sm text-emerald-400 font-light">
                                                Outreach complete! {sendResults.filter(r => r.success).length} DM{sendResults.filter(r => r.success).length !== 1 ? 's' : ''} sent via Bluesky.
                                                {sendResults.filter(r => !r.success).length > 0 && (
                                                    <span className="text-amber-400"> {sendResults.filter(r => !r.success).length} blocked by recipient settings.</span>
                                                )}
                                            </p>
                                        </div>
                                        {sendResults.filter(r => !r.success).length > 0 && (
                                            <div className="space-y-1 pl-7">
                                                {sendResults.filter(r => !r.success).map((r, i) => (
                                                    <p key={i} className="text-[11px] text-amber-500/70 font-light">
                                                        @{r.handle.replace(/^@/, '')} — {r.error || 'delivery failed'}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                                
                                {sendError && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.97 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                                    >
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-400 font-light">{sendError}</p>
                                    </motion.div>
                                )}

                                {/* Send Button */}
                                <button
                                    onClick={handleAutomate}
                                    disabled={!selectedCampaignId || selectedInfluencers.size === 0 || isSending}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all font-medium shadow-[0_0_24px_rgba(234,88,12,0.15)] disabled:shadow-none"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            {selectedInfluencers.size === 0
                                                ? 'Select profiles to send'
                                                : `Send to ${selectedInfluencers.size} Profile${selectedInfluencers.size > 1 ? 's' : ''}`
                                            }
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Profiles */}
                    <div className="lg:col-span-7">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.1 }} 
                            className="border border-white/5 bg-zinc-900/50 rounded-2xl p-6 md:p-8 flex flex-col h-full"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-xl font-light text-white tracking-tight">Profiles Pool</h2>
                                {selectedInfluencers.size > 0 && (
                                    <span className="text-xs font-medium text-orange-400 px-3 py-1 bg-orange-500/10 rounded-full flex items-center gap-1.5">
                                        <Users className="w-3 h-3" />
                                        {selectedInfluencers.size} selected
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mb-5 font-light">Click on a creator card to select them for outreach</p>

                            {/* Tabs */}
                            <div className="flex gap-0 border-b border-white/5 mb-5">
                                <button 
                                    className={`pb-2.5 px-1 mr-5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'kartr' ? 'text-orange-400 border-orange-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                                    onClick={() => setActiveTab('kartr')}
                                >
                                    Kartr Network
                                </button>
                                <button 
                                    className={`pb-2.5 px-1 mr-5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'global' ? 'text-orange-400 border-orange-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                                    onClick={() => setActiveTab('global')}
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    Global Bluesky
                                    <span className="bg-orange-500/20 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Live</span>
                                </button>
                                <button 
                                    className={`pb-2.5 px-1 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'custom' ? 'text-orange-400 border-orange-500' : 'text-zinc-500 hover:text-zinc-300 border-transparent'}`}
                                    onClick={() => setActiveTab('custom')}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    Custom Use
                                </button>
                                {/* Refresh button for Global tab */}
                                {activeTab === 'global' && selectedCampaignId && (
                                    <button
                                        onClick={() => fetchGlobalCreators(lastNicheQuery)}
                                        disabled={globalLoading}
                                        className="ml-auto pb-2.5 px-2 text-zinc-500 hover:text-orange-400 transition-colors disabled:opacity-40 flex items-center gap-1.5 text-xs"
                                        title="Refresh global creators"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </button>
                                )}
                            </div>

                            {/* Custom Search Bar */}
                            {activeTab === 'custom' && (
                                <form onSubmit={handleCustomSearch} className="mb-4">
                                    <div className="relative flex items-center">
                                        <div className="absolute left-3 text-zinc-500">
                                            <Search className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Enter Bluesky handle (e.g. atproto.com)"
                                            value={customSearchQuery}
                                            onChange={(e) => setCustomSearchQuery(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-24 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none transition-colors"
                                        />
                                        <div className="absolute right-1">
                                            <button
                                                type="submit"
                                                disabled={customSearchLoading || !customSearchQuery.trim()}
                                                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {customSearchLoading ? 'Looking...' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                    {customSearchError && (
                                        <p className="text-red-400 text-xs mt-2 ml-1">{customSearchError}</p>
                                    )}
                                </form>
                            )}

                            {/* List */}
                            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[320px]">
                                {!selectedCampaignId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-16 border border-dashed border-white/8 rounded-xl bg-black/20">
                                        <Search className="w-7 h-7 text-zinc-700 mb-3" />
                                        <p className="text-sm text-zinc-600 font-light">Select a campaign to discover profiles</p>
                                    </div>
                                ) : isListLoading && activeTab !== 'custom' ? (
                                    <div className="h-full flex flex-col items-center justify-center py-16">
                                        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                                        <p className="text-sm text-zinc-500 font-light">
                                            {activeTab === 'global' ? 'Searching Bluesky...' : 'Matching profiles...'}
                                        </p>
                                    </div>
                                ) : currentList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center py-16 border border-dashed border-white/8 rounded-xl bg-black/20 gap-3">
                                        <Bot className="w-7 h-7 text-zinc-700" />
                                        <p className="text-sm text-zinc-600 font-light text-center max-w-xs">
                                            {activeTab === 'global' && globalError
                                                ? globalError
                                                : activeTab === 'custom'
                                                    ? 'Search by handle to add creators manually.'
                                                    : activeTab === 'kartr' 
                                                        ? 'No Kartr creators matched this campaign.'
                                                        : 'No Bluesky creators found for this niche.'
                                            }
                                        </p>
                                        {activeTab === 'global' && selectedCampaignId && (
                                            <button
                                                onClick={() => fetchGlobalCreators(lastNicheQuery)}
                                                disabled={globalLoading}
                                                className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-all disabled:opacity-40"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
                                                Retry Search
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    currentList.map((inf) => {
                                        const id = 'influencer_id' in inf ? (inf as any).influencer_id : `global_${(inf as GlobalCreator).bluesky_handle}`;
                                        const handle = 'bluesky_handle' in inf ? (inf as GlobalCreator).bluesky_handle : (inf as any).bluesky_handle || `@${(inf as any).username}.bsky.social`;
                                        const name = 'display_name' in (inf as any) ? (inf as GlobalCreator).display_name : ((inf as any).full_name || (inf as any).username);
                                        const avatar = 'avatar' in (inf as any) ? (inf as GlobalCreator).avatar : null;
                                        const desc = 'description' in (inf as any) ? (inf as GlobalCreator).description : null;
                                        const score = 'relevance_score' in (inf as any) ? (inf as any).relevance_score : null;
                                        const followers = 'followers_count' in (inf as any) ? (inf as GlobalCreator).followers_count : null;
                                        const isSelected = selectedInfluencers.has(id);
                                        
                                        return (
                                            <div 
                                                key={id}
                                                onClick={() => toggleInfluencer(id)}
                                                className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                                    isSelected 
                                                    ? 'border-orange-500/50 bg-orange-500/5 shadow-[0_0_12px_rgba(249,115,22,0.08)]' 
                                                    : 'border-white/5 bg-black/40 hover:border-white/10 hover:bg-zinc-900/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* Checkbox */}
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                                        isSelected ? 'bg-orange-500 border-orange-500' : 'border-zinc-700 group-hover:border-zinc-500'
                                                    }`}>
                                                        {isSelected && <div className="w-2 h-2 bg-black rounded-sm" />}
                                                    </div>
                                                    
                                                    {/* Avatar */}
                                                    {avatar ? (
                                                        <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/10" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400 text-sm font-medium">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-medium text-sm text-white/90 truncate">{name}</h3>
                                                            {activeTab === 'global' && (
                                                                <span className="bg-sky-500/10 text-sky-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold leading-none flex-shrink-0">
                                                                    Bluesky
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 font-light mt-0.5 truncate">@{handle.replace(/^@/, '')}</p>
                                                        {desc && <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{desc}</p>}
                                                    </div>
                                                </div>
                                                
                                                {/* Right side stats */}
                                                <div className="flex flex-col items-end ml-3 flex-shrink-0">
                                                    {score !== null && (
                                                        <span className="text-[11px] font-semibold px-2 py-1 bg-white/5 rounded text-zinc-300 tabular-nums">
                                                            {score}% match
                                                        </span>
                                                    )}
                                                    {followers !== null && followers > 0 && (
                                                        <span className="text-[10px] text-zinc-500 mt-1 font-light tabular-nums">
                                                            {followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : followers} followers
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TinyFishAutomation;
