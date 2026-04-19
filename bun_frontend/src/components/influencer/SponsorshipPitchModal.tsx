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
import { Sparkles, MessageSquare, Send, X } from 'lucide-react';

interface SponsorshipPitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    brandName: string;
    brandDetails: string;
    videoId?: string;
}

const SponsorshipPitchModal: React.FC<SponsorshipPitchModalProps> = ({
    isOpen,
    onClose,
    brandName,
    brandDetails,
    videoId
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#1a1f2e] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        AI Sponsorship Pitch
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Generate a professional pitch for <strong>{brandName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Why this brand?
                        </h4>
                        <p className="text-sm text-gray-300 italic">
                            "{brandDetails}"
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center py-10">
                        <p className="text-gray-500 text-sm">
                            [Placeholder: AI Pitch Generation logic was in the original component file which is currently missing. Please restore the original code here.]
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 border-white/10 hover:bg-white/10 text-gray-300"
                    >
                        Close
                    </Button>
                    <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        disabled
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Send Pitch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SponsorshipPitchModal;
