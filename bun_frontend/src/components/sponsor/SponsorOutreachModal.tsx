import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import { Button } from '../ui/button';
import { Send, User, Target, FileText, X } from 'lucide-react';

interface SponsorOutreachModalProps {
    isOpen: boolean;
    onClose: () => void;
    influencerName: string;
    niche: string;
    campaignDetails: string;
}

const SponsorOutreachModal: React.FC<SponsorOutreachModalProps> = ({
    isOpen,
    onClose,
    influencerName,
    niche,
    campaignDetails
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Send className="w-5 h-5 text-blue-500" />
                        Influencer Outreach
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Connect with <strong>{influencerName}</strong> for your campaign.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-muted/50 border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" /> Niche
                            </p>
                            <p className="text-sm font-semibold">{niche}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50 border border-border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Creator
                            </p>
                            <p className="text-sm font-semibold">{influencerName}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Campaign Details
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {campaignDetails}
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/10 border border-dashed border-border text-center py-8">
                        <p className="text-muted-foreground text-xs italic">
                            [Placeholder: Outreach message generation logic was in the original component file which is currently missing. Please restore the original code here.]
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 border-border hover:bg-muted text-muted-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Send Invite
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SponsorOutreachModal;
