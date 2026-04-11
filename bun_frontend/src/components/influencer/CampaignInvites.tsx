import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, X, Clock, Briefcase, ChevronRight, MessageSquare, AlertCircle, PlayCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import campaignService from '../../services/campaignService';

interface Invite {
    campaign: {
        id: string;
        name: string;
        description: string;
        budget_min: number;
        budget_max: number;
    };
    sponsor_name: string;
    status: 'invited' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
    invited_at: string;
    notes?: string;
}

const CampaignInvites: React.FC = () => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingAction, setProcessingAction] = useState<{ id: string, type: 'accept' | 'reject' } | null>(null);

    const fetchInvites = async () => {
        try {
            const { invitations } = await campaignService.getInfluencerInvitations();
            setInvites(invitations);
        } catch (error) {
            console.error("Failed to fetch invites:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleRespond = async (campaignId: string, accept: boolean) => {
        setProcessingAction({ id: campaignId, type: accept ? 'accept' : 'reject' });
        try {
            await campaignService.respondToInvitation(campaignId, accept);
            await fetchInvites(); // Refresh to update status
        } catch (error) {
            console.error("Failed to respond:", error);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleUpdateStatus = async (campaignId: string, status: 'in_progress' | 'completed') => {
        try {
            await campaignService.updateCampaignStatus(campaignId, status);
            fetchInvites();
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'invited': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'accepted': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'completed': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const pendingInvites = invites.filter(i => i.status === 'invited');
    const activeProjects = invites.filter(i => ['accepted', 'in_progress'].includes(i.status));
    const historyInvites = invites.filter(i => ['completed', 'rejected', 'cancelled'].includes(i.status));

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading invitations...</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            {/* Header Stats */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-purple-400" />
                    Campaign Invites & Jobs
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchInvites} className="h-8 border-white/10 text-gray-400 hover:text-white">
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Pending Invites Section */}
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    New Invitations ({pendingInvites.length})
                </h3>
                <div className="space-y-4">
                    {pendingInvites.length === 0 ? (
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center text-gray-500 text-sm">
                            No pending invitations.
                        </div>
                    ) : (
                        pendingInvites.map((invite) => (
                            <div key={invite.campaign.id} className="p-5 rounded-xl bg-white/5 border border-purple-500/30 transition-all hover:bg-white/[0.08]">
                                <div className="flex flex-col md:flex-row gap-4 justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-purple-400 font-bold text-sm tracking-wide uppercase">{invite.sponsor_name}</span>
                                            <span className="text-gray-500 text-xs">• {new Date(invite.invited_at).toLocaleDateString()}</span>
                                            {invite.campaign.budget_min && (
                                                <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/20 font-mono">
                                                    ${invite.campaign.budget_min} - ${invite.campaign.budget_max}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-semibold text-white mb-1">
                                            {invite.campaign.name}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-1">
                                            {invite.notes || invite.campaign.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRespond(invite.campaign.id, false)}
                                            disabled={!!processingAction}
                                            className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 border border-white/10"
                                        >
                                            {processingAction?.id === invite.campaign.id && processingAction.type === 'reject' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Declining
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4 mr-2" /> Decline
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleRespond(invite.campaign.id, true)}
                                            disabled={!!processingAction}
                                            className="bg-purple-600 hover:bg-purple-700 text-white"
                                        >
                                            {processingAction?.id === invite.campaign.id && processingAction.type === 'accept' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Accepting
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" /> Accept
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Active Projects Section */}
            {activeProjects.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Active Projects
                    </h3>
                    <div className="space-y-4">
                        {activeProjects.map((invite) => (
                            <div key={invite.campaign.id} className="p-5 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-white font-medium">{invite.campaign.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(invite.status)}`}>
                                                {invite.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 mb-4">{invite.campaign.description}</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {invite.status === 'accepted' && (
                                            <Button size="sm" onClick={() => handleUpdateStatus(invite.campaign.id, 'in_progress')} className="bg-blue-600 hover:bg-blue-700">
                                                Start Work
                                            </Button>
                                        )}
                                        {invite.status === 'in_progress' && (
                                            <Button size="sm" onClick={() => handleUpdateStatus(invite.campaign.id, 'completed')} className="bg-green-600 hover:bg-green-700">
                                                Mark Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Section */}
            {historyInvites.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        History
                    </h3>
                    <div className="space-y-4 opacity-75">
                        {historyInvites.map((invite) => (
                            <div key={invite.campaign.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                                <div>
                                    <h4 className="text-gray-300 text-sm font-medium">{invite.campaign.name}</h4>
                                    <span className={`text-xs ${getStatusColor(invite.status)}`}>{invite.status}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(invite.invited_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default CampaignInvites;
