/**
 * VideoStudio Component
 * Interactive AI Studio for generating videos and posting to Bluesky
 */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, MessageSquare, Copy, Loader2, Wand2, RefreshCw, Send, CheckCircle, Smartphone, Play, Upload } from 'lucide-react';
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

interface GeneratedVideo {
    video_url: string;
    video_filename: string;
    prompt: string;
    isUploaded?: boolean;  // Track if it's an uploaded video
    file?: File; // Store the actual file for uploading
}

const VideoStudio: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
    const [generatedCaption, setGeneratedCaption] = useState<string>('');
    const [postSuccess, setPostSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Bluesky Connect Modal State
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
    const [blueskyHandle, setBlueskyHandle] = useState('');
    const [blueskyPassword, setBlueskyPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);

    const handleGenerateVideo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setGeneratedVideo(null);
        setGeneratedCaption('');
        setPostSuccess(false);

        try {
            const response = await apiClient.post('/videos/generate', {
                prompt,
                use_cached_storyboard: true
            });

            if (response.data.success && response.data.video_url) {
                setGeneratedVideo({
                    video_url: response.data.video_url,
                    video_filename: response.data.video_filename,
                    prompt: prompt
                });
            } else {
                setError(response.data.error || 'Failed to generate video');
            }
        } catch (err: any) {
            console.error('Video generation error:', err);
            // Handle rate limit specifically
            if (err.response?.status === 429) {
                setError("Rate limit reached (3 videos/min). Please wait a moment.");
            } else {
                setError(err.response?.data?.detail || 'An error occurred while generating the video');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setError('Please upload a valid video file');
            return;
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('Video file must be under 100MB');
            return;
        }

        setIsUploading(true);
        setError(null);
        setGeneratedVideo(null);
        setGeneratedCaption('');

        try {
            // Create a local URL for the video
            const videoUrl = URL.createObjectURL(file);

            setGeneratedVideo({
                video_url: videoUrl,
                video_filename: file.name,
                prompt: `Uploaded video: ${file.name}`,
                isUploaded: true,
                file: file
            });
        } catch (err: any) {
            console.error('Video upload error:', err);
            setError('Failed to process uploaded video');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    const handleGenerateCaption = async () => {
        if (!generatedVideo) return;

        setIsGeneratingCaption(true);
        setGeneratedCaption('');
        try {
            const captionPrompt = `Write a short, engaging social media caption for a video.
            Video Context: ${generatedVideo.prompt}.
            Constraint: Under 280 characters. Include 2-3 hashtags.`;

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

    const handlePostToBluesky = async () => {
        if (!generatedVideo || !generatedCaption) return;

        setIsPosting(true);
        setPostSuccess(false);
        try {
            const formData = new FormData();
            formData.append('text', generatedCaption);

            console.log('Posting to Bluesky:', {
                caption: generatedCaption,
                video: generatedVideo,
                isFileObject: generatedVideo.file instanceof File
            });

            if (generatedVideo.isUploaded) {
                if (generatedVideo.file) {
                    formData.append('video_file', generatedVideo.file);
                    // Also append video_path as empty or ignored, to prevent frontend ambiguity
                } else {
                    console.error("Missing file object for uploaded video");
                    setError("Error: Video file data is missing. Please try uploading the video again.");
                    setIsPosting(false);
                    return;
                }
            } else {
                // Pass the filename, backend will resolve path from VIDEOS_DIR
                formData.append('video_path', generatedVideo.video_filename);
            }

            const response = await apiClient.post('/bluesky/post', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setPostSuccess(true);
                setTimeout(() => setPostSuccess(false), 3000);
            } else {
                if (response.data.message && (response.data.message.includes("not linked") || response.data.message.includes("connect your account"))) {
                    setShowConnectModal(true);
                    return;
                }
                setError(response.data.message || 'Failed to post to Bluesky');
            }
        } catch (err: any) {
            console.error('Posting error:', err);
            const status = err.response?.status;
            const detail = err.response?.data?.detail || '';

            // Check for unconfirmed email error
            if (detail.includes('UNCONFIRMED_EMAIL') || detail.includes('unconfirmed_email') || detail.includes('verify your email')) {
                setShowEmailVerifyModal(true);
                return;
            }

            if (status === 400 && (detail.includes('not linked') || detail.includes('connect your account'))) {
                setShowConnectModal(true);
                return;
            }
            setError(detail || 'Failed to post to social media.');
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
                setBlueskyPassword('');
                // Auto-retry posting
                handlePostToBluesky();
            } else {
                setConnectError(response.data.message || "Failed to connect account");
            }
        } catch (err: any) {
            console.error("Connect error:", err);
            setConnectError(err.response?.data?.detail || "Failed to verify credentials.");
        } finally {
            setIsConnecting(false);
        }
    };

    const copyCaption = () => {
        if (generatedCaption) {
            navigator.clipboard.writeText(generatedCaption);
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
                            <Video className="w-8 h-8 text-blue-400" />
                            AI Video Studio
                        </h2>
                        <p className="text-gray-400">
                            Generate short, cinematic AI videos from text prompts.
                        </p>
                    </div>

                    <form onSubmit={handleGenerateVideo} className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Video Prompt</label>
                            <Textarea
                                placeholder="Describe the video... e.g. A cyberpunk city street in rain at night, neon lights reflecting on puddles, cinematic 4k"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-gray-500 resize-none"
                            />
                            <p className="text-xs text-gray-500">Video generation typically takes 1-2 minutes.</p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={isGenerating || isUploading || !prompt.trim()}
                                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>

                            {/* Upload Button */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating || isUploading}
                                variant="outline"
                                className="h-12 px-4 border-white/20 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                                title="Upload your own video"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5" />
                                )}
                            </Button>
                        </div>

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

                    {/* Caption Section */}
                    <AnimatePresence>
                        {generatedVideo && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                        Caption
                                    </h3>
                                    <Button
                                        onClick={handleGenerateCaption}
                                        disabled={isGeneratingCaption}
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                    >
                                        {isGeneratingCaption ? (
                                            <>
                                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="w-3 h-3 mr-1.5" />
                                                AI Generate
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative group">
                                        <Textarea
                                            value={generatedCaption}
                                            onChange={(e) => setGeneratedCaption(e.target.value)}
                                            className="min-h-[100px] p-4 pr-12 rounded-xl bg-black/30 text-gray-200 text-sm leading-relaxed border border-white/5 resize-none focus:ring-1 focus:ring-blue-500/50"
                                            placeholder="Write your caption here or use AI Generate..."
                                        />
                                        {generatedCaption && (
                                            <button
                                                onClick={copyCaption}
                                                className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 z-10"
                                                title="Copy"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="text-xs text-right mt-1 text-gray-500">
                                            {generatedCaption.length}/300 characters
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center pt-2">
                                        <Button
                                            onClick={handlePostToBluesky}
                                            disabled={isPosting || !generatedCaption.trim()}
                                            className="bg-[#0085ff] hover:bg-[#0060df] text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
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
                        {isGenerating ? (
                            <div className="text-center space-y-4">
                                <div className="relative w-24 h-24 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse" />
                                    <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin" />
                                    <Video className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                                </div>
                                <p className="text-blue-300 font-medium animate-pulse">Rendering video...</p>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">This may take 1-2 minutes.</p>
                            </div>
                        ) : generatedVideo ? (
                            <div className="w-full h-full flex flex-col">
                                <video
                                    src={(() => {
                                        // For uploaded videos, use the blob URL directly
                                        if (generatedVideo.isUploaded || generatedVideo.video_url.startsWith('blob:')) {
                                            return generatedVideo.video_url;
                                        }
                                        // For generated videos, construct server URL
                                        const baseUrl = apiClient.defaults.baseURL || '';
                                        // If base URL ends with /api and path starts with /api, remove one /api
                                        if (baseUrl.endsWith('/api') && generatedVideo.video_url.startsWith('/api')) {
                                            return `${baseUrl.slice(0, -4)}${generatedVideo.video_url}`;
                                        }
                                        return `${baseUrl}${generatedVideo.video_url}`;
                                    })()}
                                    controls
                                    className="w-full h-full object-contain rounded-xl"
                                    autoPlay
                                    loop
                                />
                            </div>
                        ) : (
                            <div className="text-center space-y-4 p-8">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Video className="w-10 h-10 text-gray-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white/50">No Video Generated</h3>
                                    <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                                        Enter a prompt and click Generate to create an AI video.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
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

            {/* Email Verification Required Modal */}
            <Dialog open={showEmailVerifyModal} onOpenChange={setShowEmailVerifyModal}>
                <DialogContent className="sm:max-w-[425px] bg-[#1a1f2e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Email Verification Required
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Bluesky requires a verified email address to upload videos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-gray-300">
                            To post videos on Bluesky, please verify your email address:
                        </p>
                        <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2">
                            <li>Open <span className="text-blue-400">bsky.app</span> in your browser</li>
                            <li>Go to <span className="font-medium text-white">Settings → Account</span></li>
                            <li>Find <span className="font-medium text-white">Email</span> and click <span className="font-medium text-white">Verify</span></li>
                            <li>Check your inbox and click the verification link</li>
                        </ol>
                        <p className="text-xs text-gray-500">
                            Note: Image posts work without email verification. Only video uploads require it.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => window.open('https://bsky.app/settings/account', '_blank')}
                            variant="outline"
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                            Open Bluesky Settings
                        </Button>
                        <Button
                            onClick={() => setShowEmailVerifyModal(false)}
                            className="bg-[#0085ff] hover:bg-[#0060df] text-white"
                        >
                            Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VideoStudio;
