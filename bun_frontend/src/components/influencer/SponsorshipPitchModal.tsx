import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import apiClient from '../../services/apiClient';

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
    const [step, setStep] = useState<'generate' | 'edit' | 'sending' | 'success'>('generate');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [manualBrand, setManualBrand] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('generate');
            setRecipientEmail('');
            setSubject('');
            setBody('');
            setManualBrand('');
            setError(null);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        const targetBrand = brandName || manualBrand;

        if (!targetBrand) {
            setError("Please enter a brand name.");
            return;
        }

        if (!videoId) {
            setError("Please select a video to baseline the pitch.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const response = await apiClient.post('/influencer/generate-pitch', {
                video_id: videoId,
                brand_name: targetBrand,
                brand_details: brandDetails || "General sponsorship opportunity"
            });

            setSubject(response.data.subject);
            setBody(response.data.body);
            setStep('edit');
        } catch (err: any) {
            console.error('Failed to generate pitch:', err);
            setError(err.response?.data?.detail || "AI generation failed. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenMailClient = () => {
        const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
        setStep('success');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-[#1a1f2e] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {/* ... (Header remains same) ... */}
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Sponsorship Pitch AI
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Generate a professional sponsorship pitch{brandName ? <span> to <strong>{brandName}</strong></span> : " to any brand"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* ... (Error display remains) ... */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {step === 'generate' && (
                        // ... (Generate step remains same) ...
                        <div className="space-y-4 text-center py-6">
                            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                            </div>
                            <h4 className="text-lg font-medium">Ready to Pitch?</h4>
                            <p className="text-gray-400 text-sm px-8 mb-4">
                                We'll use your video analytics to draft a personalized email.
                            </p>

                            {!brandName && (
                                <div className="max-w-xs mx-auto mb-4 text-left space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Target Brand Name</label>
                                    <Input
                                        placeholder="e.g. Nike, Squarespace..."
                                        className="bg-white/5 border-white/10"
                                        value={manualBrand}
                                        onChange={(e) => setManualBrand(e.target.value)}
                                    />
                                </div>
                            )}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-purple-600 hover:bg-purple-700 text-white w-full max-w-xs mx-auto"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing Niche...
                                    </>
                                ) : (
                                    "Generate Pitch with AI"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 'edit' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient Email (Optional)</label>
                                <Input
                                    placeholder="brand-contact@company.com"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="bg-white/5 border-white/10"
                                />
                                <p className="text-[10px] text-gray-500 italic">This will be pre-filled in your email client.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</label>
                                <Input
                                    placeholder="Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Body (HTML/Text)</label>
                                <Textarea
                                    placeholder="Body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    className="min-h-[250px] bg-white/5 border-white/10 font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                                <Send className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold">Email App Opened!</h3>
                            <p className="text-gray-400 max-w-xs">
                                We've opened your default email client with the pitch pre-filled. Good luck!
                            </p>
                            <Button variant="outline" onClick={onClose} className="border-white/10 hover:bg-white/10">
                                Close Window
                            </Button>
                        </div>
                    )}
                </div>

                {step === 'edit' && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setStep('generate')} className="border-white/10 hover:bg-white/10">
                            Regenerate
                        </Button>
                        <Button onClick={handleOpenMailClient} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="w-4 h-4 mr-2" />
                            Open Email Client
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SponsorshipPitchModal;
