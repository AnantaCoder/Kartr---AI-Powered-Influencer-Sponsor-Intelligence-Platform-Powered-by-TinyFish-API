/**
 * VirtualStudio Component
 * Interactive AI Studio for generating images and captions
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, MessageSquare, Copy, Loader2, Wand2, RefreshCw, Send, CheckCircle, Smartphone } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface GeneratedImage {
    base64: string;
    prompt: string;
    brand: string;
}

const VirtualStudio: React.FC = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [brandName, setBrandName] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [postSuccess, setPostSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Bluesky Connect Modal State
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [blueskyHandle, setBlueskyHandle] = useState('');
    const [blueskyPassword, setBlueskyPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);

    const handleGenerateImage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGeneratingImage(true);
        setError(null);
        setGeneratedCaption(''); // Clear previous caption immediately
        setPostSuccess(false);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            if (brandName) formData.append('brand_name', brandName);

            const response = await apiClient.post('/images/generate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && response.data.image_base64) {
                setGeneratedImage({
                    base64: response.data.image_base64,
                    prompt,
                    brand: brandName || 'Generic Brand',
                });
            } else {
                setError(response.data.error || 'Failed to generate image');
            }
        } catch (err: any) {
            console.error('Image generation error:', err);
            setError(err.response?.data?.detail || 'An error occurred while generating the image');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateCaption = async () => {
        if (!generatedImage) return;

        setIsGeneratingCaption(true);
        setGeneratedCaption(''); // Ensure we clear old caption before generating new one
        try {
            const captionPrompt = `Write a single, short, punchy social media caption for a promotional image of ${generatedImage.brand}. 
      Image description: ${generatedImage.prompt}. 
      Constraint: Must be under 280 characters. Include 2-3 relevant hashtags. Only provide the caption text.`;

            const response = await apiClient.post('/chat/quick', {
                message: captionPrompt
            });

            if (response.data.success && response.data.assistant_message) {
                setGeneratedCaption(response.data.assistant_message.content);
            } else {
                setError('Failed to generate caption');
            }
        } catch (err: any) {
            console.error('Caption generation error:', err);
            setError(err.response?.data?.detail || 'An error occurred while generating the caption');
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(',');

        // Safely get mime type or default to png
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';

        // Safely decode
        const bstr = atob(arr[1] || '');

        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handlePostToBluesky = async () => {
        if (!generatedImage || !generatedCaption) return;

        setIsPosting(true);
        setPostSuccess(false);
        try {
            const imageFile = dataURLtoFile(
                `data:image/png;base64,${generatedImage.base64}`,
                `generated-${Date.now()}.png`
            );

            const formData = new FormData();
            formData.append('text', generatedCaption);
            formData.append('image_file', imageFile);

            // Now correctly mapped to /api/bluesky/post via apiClient
            const response = await apiClient.post('/bluesky/post', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setPostSuccess(true);
                setTimeout(() => setPostSuccess(false), 3000); // Reset success message after 3s
            } else {
                // Check for specific error message about linking account
                if (response.data.message && (response.data.message.includes("not linked") || response.data.message.includes("connect your account"))) {
                    setShowConnectModal(true);
                    return;
                }
                setError(response.data.message || 'Failed to post to Bluesky');
            }
        } catch (err: any) {
            console.error('Posting error:', err);

            // Handle 400 Bad Request or 404 (if user not found in DB logic) meaning missing creds
            const status = err.response?.status;
            const detail = err.response?.data?.detail || '';

            if (status === 400 && (detail.includes('not linked') || detail.includes('connect your account'))) {
                setShowConnectModal(true);
                return;
            }
            // If we got a 404 on the POST, it might be the endpoint issue we just fixed, OR user not found. 
            // Assuming endpoint is fixed, a 404 with specific message could also trigger modal if backend returns it properly.

            setError(err.response?.data?.detail || 'Failed to post to social media.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleConnectBluesky = async () => {
        if (!blueskyHandle || !blueskyPassword) return;

        setIsConnecting(true);
        setConnectError(null);
        try {
            const response = await apiClient.post('/bluesky/connect', {
                identifier: blueskyHandle,
                password: blueskyPassword
            });

            if (response.data.success) {
                setShowConnectModal(false);
                // Optionally clear fields
                setBlueskyPassword('');
                // Auto-retry posting
                handlePostToBluesky();
            } else {
                setConnectError(response.data.message || "Failed to connect account");
            }
        } catch (err: any) {
            console.error("Connect error:", err);
            setConnectError(err.response?.data?.detail || "Failed to verify credentials. Please check your app password.");
        } finally {
            setIsConnecting(false);
        }
    };

    const copyCaption = () => {
        if (generatedCaption) {
            navigator.clipboard.writeText(generatedCaption);
            // Optional: Show toast
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Controls */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                            <Wand2 className="w-8 h-8 text-purple-400" />
                            Virtual AI Studio
                        </h2>
                        <p className="text-gray-400">
                            Create stunning promotional images and AI-generated captions for your campaigns.
                        </p>
                    </div>

                    <form onSubmit={handleGenerateImage} className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Brand Name (Optional)</label>
                            <Input
                                type="text"
                                placeholder="e.g. Nike, TechStart, YourBrand"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Image Prompt</label>
                            <Textarea
                                placeholder="Describe the image you want to generate... e.g. A futuristic sneaker floating in neon space with purple lighting"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isGeneratingImage || !prompt.trim()}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all"
                        >
                            {isGeneratingImage ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Generating Magic...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate Image
                                </>
                            )}
                        </Button>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {postSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-200 text-sm flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Successfully posted to Bluesky!
                            </motion.div>
                        )}
                    </form>

                    {/* Caption Section - Only shows if image exists */}
                    <AnimatePresence>
                        {generatedImage && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                        AI Caption
                                    </h3>
                                    {!generatedCaption && (
                                        <Button
                                            onClick={handleGenerateCaption}
                                            disabled={isGeneratingCaption}
                                            variant="outline"
                                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                        >
                                            {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Caption'}
                                        </Button>
                                    )}
                                </div>

                                {generatedCaption ? (
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Textarea
                                                value={generatedCaption}
                                                onChange={(e) => setGeneratedCaption(e.target.value)}
                                                className="min-h-[100px] p-4 pr-12 rounded-xl bg-black/30 text-gray-200 text-sm leading-relaxed border border-white/5 resize-none focus:ring-1 focus:ring-purple-500/50"
                                                placeholder="Your AI caption will appear here..."
                                            />
                                            <button
                                                onClick={copyCaption}
                                                className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 z-10"
                                                title="Copy to clipboard"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <div className={`text-xs text-right mt-1 ${generatedCaption.length > 300 ? 'text-red-400' : 'text-gray-500'}`}>
                                                {generatedCaption.length}/300 characters
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 gap-4">
                                            <Button
                                                onClick={handleGenerateCaption}
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-white"
                                                disabled={isGeneratingCaption}
                                            >
                                                <RefreshCw className={`w-3 h-3 mr-2 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                                                Regenerate
                                            </Button>

                                            <Button
                                                onClick={handlePostToBluesky}
                                                disabled={isPosting}
                                                className="bg-[#0085ff] hover:bg-[#0060df] text-white shadow-lg shadow-blue-500/20"
                                            >
                                                {isPosting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Posting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Post to Bluesky
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">
                                        Generate an image first, then ask AI to write a perfect caption for it.
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Right Column: Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative lg:h-[600px] flex flex-col"
                >
                    <div className="flex-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-center relative p-1">
                        {isGeneratingImage ? (
                            <div className="text-center space-y-4">
                                <div className="relative w-24 h-24 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-pulse" />
                                    <div className="absolute inset-0 rounded-full border-t-4 border-purple-500 animate-spin" />
                                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                                </div>
                                <p className="text-purple-300 font-medium animate-pulse">Creating your masterpiece...</p>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">This may take up to 30 seconds depending on complexity</p>
                            </div>
                        ) : generatedImage ? (
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={`data:image/png;base64,${generatedImage.base64}`}
                                alt={generatedImage.prompt}
                                className="w-full h-full object-contain rounded-xl"
                            />
                        ) : (
                            <div className="text-center space-y-4 p-8">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                                    <ImageIcon className="w-10 h-10 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white/50">No Image Generated</h3>
                                    <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                                        Enter a prompt and click Generate to see AI magic happen here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {generatedImage && (
                        <div className="mt-4 flex justify-between items-center px-2">
                            <p className="text-xs text-gray-500">
                                Generated for <span className="text-purple-400 font-medium">{generatedImage.brand}</span>
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${generatedImage.base64}`;
                                    link.download = `kartr-ai-${Date.now()}.png`;
                                    link.click();
                                }}
                            >
                                Download Image
                            </Button>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Bluesky Connect Modal */}
            <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
                <DialogContent className="sm:max-w-[425px] bg-[#1a1f2e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            Connect Bluesky
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Your account isn't linked yet. Connect it now to enable one-click posting!
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Bluesky Handle</label>
                            <Input
                                placeholder="username.bsky.social"
                                value={blueskyHandle}
                                onChange={(e) => setBlueskyHandle(e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                            />
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
                                Generate an App Password in Bluesky Settings {'>'} App Passwords
                            </p>
                        </div>
                        {connectError && (
                            <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-500/30">
                                {connectError}
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
                            onClick={handleConnectBluesky}
                            className="bg-[#0085ff] hover:bg-[#0060df] text-white"
                            disabled={isConnecting || !blueskyHandle || !blueskyPassword}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect & Post"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VirtualStudio;

