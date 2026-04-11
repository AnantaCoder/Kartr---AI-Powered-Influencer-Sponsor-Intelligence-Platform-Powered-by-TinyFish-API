import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Sparkles, ExternalLink } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface SponsorOutreachModalProps {
    isOpen: boolean;
    onClose: () => void;
    influencerName: string;
    niche: string;
    campaignDetails: string;
    influencerEmail?: string;
}

const SponsorOutreachModal: React.FC<SponsorOutreachModalProps> = ({
    isOpen,
    onClose,
    influencerName,
    niche,
    campaignDetails,
}) => {
    // Determine channel URL based on name (Mock logic for now, ideally passed in props)
    const getChannelUrl = (name: string) => {
        // Simple heuristic for demo purposes
        const handle = name.replace(/\s+/g, '').toLowerCase();
        return `https://www.youtube.com/@${handle}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-white/10 text-white p-0 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-6 border-b border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl text-white">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            Connect with {influencerName}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Professional outreach for {niche} creators.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="text-3xl font-bold text-white">{influencerName.charAt(0)}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{influencerName}</h3>
                            <p className="text-sm text-gray-400">Ready to collaborate on your campaign</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 w-full text-left">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Campaign Context</h4>
                            <p className="text-sm text-gray-300 line-clamp-2">{campaignDetails}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => window.open(getChannelUrl(influencerName), '_blank')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Channel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SponsorOutreachModal;
