import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import BackgroundVideo from "../components/common/BackgroundVideo";
import { motion } from "framer-motion";
import { Search, AlertCircle, Loader2, BarChart3, Users, Eye, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { useAppSelector } from "../store/hooks";
import { selectIsAuthenticated, selectAuthInitialized } from "../store/slices/authSlice";
import { fetchBulkAnalysisResults, clearResults } from "../store/slices/bulkAnalysisSlice";

const BulkAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { channel, videos, loading, error } = useSelector(
    (state: RootState) => state.bulkAnalysis
  );

  // Auth check
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  const [channelId, setChannelId] = useState("");
  const [numVideos, setNumVideos] = useState(10);

  const handleSearch = async () => {
    if (!channelId.trim() || numVideos <= 0) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/BulkAnalysis' } });
      return;
    }

    dispatch(
      fetchBulkAnalysisResults({
        channel_id: channelId.trim(),
        max_videos: numVideos,
      })
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setChannelId("");
    setNumVideos(10);
    dispatch(clearResults());
  };

  // Calculate aggregate stats
  const calculateStats = () => {
    if (!videos || videos.length === 0) return null;

    const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.like_count, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.comment_count, 0);
    const sponsoredCount = videos.filter(v => v.is_sponsored).length;
    const avgEngagement = videos.length > 0
      ? ((totalLikes + totalComments) / (totalViews * videos.length)) * 100
      : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      sponsoredCount,
      avgEngagement,
      avgLikesPerVideo: Math.round(totalLikes / videos.length),
      avgCommentsPerVideo: Math.round(totalComments / videos.length)
    };
  };

  const stats = calculateStats();

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <>
      <BackgroundVideo />
      <Header />

      <motion.section
        className="relative flex flex-col items-center justify-center text-center px-6 py-28
                   overflow-hidden min-h-[100dvh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* BACKGROUND GLOW */}
        <div className="absolute -top-32 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30 mb-6"
        >
          <BarChart3 className="w-8 h-8 text-white" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl text-white font-semibold leading-tight">
          Bulk Channel
          <span className="text-purple-400"> Analysis</span> &
          <span className="text-pink-400"> Insights</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 max-w-xl text-gray-400 text-sm md:text-base">
          Analyze YouTube videos from a channel to get comprehensive
          insights about sponsorships, audience engagement, and performance metrics.
        </p>

        {/* Search Box */}
        <motion.div
          className="mt-10 flex w-full max-w-2xl flex-col gap-4 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Channel ID Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter YouTube Channel ID or URL (e.g., https://youtube.com/@channel or UCAi...)"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-12 rounded-xl w-full
                         bg-white/10 border-white/20
                         text-white placeholder:text-gray-400
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all"
            />
          </div>

          {/* Number of Videos Selector */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 shadow-xl">
              <span className="text-base text-white font-semibold whitespace-nowrap">Videos:</span>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 20, 25].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumVideos(num)}
                    className={`w-12 h-12 rounded-xl font-bold text-base transition-all duration-200 cursor-pointer
                      ${numVideos === num
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40 scale-105 border-2 border-blue-400'
                        : 'bg-slate-700/80 text-gray-300 hover:bg-slate-600 hover:text-white border border-slate-600 hover:border-blue-400/50 hover:scale-105'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading || !channelId.trim() || numVideos <= 0}
              className="h-14 px-10 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-xl shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Analyze Channel"
              )}
            </Button>
          </div>
        </motion.div>

        {/* RESULTS SLOT */}
        <div className="mt-6 w-full max-w-7xl">
          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-8"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
              </div>
              <p className="text-sm text-gray-400">
                AI is analyzing channel data...
              </p>
              <p className="text-xs text-gray-500">
                This may take a few seconds
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div className="text-center">
                <p className="text-sm text-red-400 font-medium">Analysis Failed</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10 cursor-pointer"
              >
                Try Again
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {!loading && channel && videos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  Clear
                </Button>
              </div>

              {/* Channel Header */}
              <div className="mb-8 pb-6 border-b border-white/10">
                <div className="flex items-start gap-4">
                  <img
                    src={channel.thumbnail_url}
                    alt={channel.title}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-bold text-white mb-1">{channel.title}</h3>
                    <p className="text-sm text-gray-400 mb-3">{channel.description}</p>
                    <div className="text-xs text-gray-500">{channel.custom_url}</div>
                  </div>
                </div>

                {/* Channel Stats */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-gray-400">Subscribers</p>
                      </div>
                      <p className="text-lg font-semibold text-white">{(channel.subscriber_count / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <p className="text-xs text-gray-400">Total Views</p>
                      </div>
                      <p className="text-lg font-semibold text-white">{(channel.view_count / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <p className="text-xs text-gray-400">Videos</p>
                      </div>
                      <p className="text-lg font-semibold text-white">{channel.video_count}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-red-400" />
                        <p className="text-xs text-gray-400">Sponsored</p>
                      </div>
                      <p className="text-lg font-semibold text-white">{stats.sponsoredCount}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Videos Grid */}
              <div>
                <h3 className="text-base font-semibold text-white mb-6">Videos Analyzed ({videos.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video, index) => {
                    const engagement = video.view_count > 0
                      ? ((video.like_count + video.comment_count) / video.view_count * 100).toFixed(2)
                      : "0.00";

                    // Smart number formatting
                    const formatCount = (num: number) => {
                      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
                      return num.toLocaleString();
                    };

                    return (
                      <motion.div
                        key={video.video_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative rounded-xl overflow-hidden bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
                      >
                        {/* Video Embed Container */}
                        <div className="relative w-full aspect-video bg-black overflow-hidden group-hover:opacity-90 transition-opacity">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.video_id}?modestbranding=1&controls=1`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                          />
                        </div>

                        {/* Content Area */}
                        <div className="p-4 space-y-3">
                          {/* Sponsor Badge - PROMINENT */}
                          {video.is_sponsored && (
                            <div className="w-full">
                              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-2 border-purple-500 shadow-lg shadow-purple-500/20">
                                <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse"></span>
                                <div className="flex flex-col">
                                  <p className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Sponsored by</p>
                                  <p className="text-sm font-bold text-purple-100">{video.sponsor_name || 'Brand Sponsor'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* No Sponsorship Badge - PROMINENT */}
                          {!video.is_sponsored && (
                            <div className="w-full">
                              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-gray-600/30 to-slate-600/30 border-2 border-gray-500 shadow-lg shadow-gray-500/20">
                                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                                <div className="flex flex-col">
                                  <p className="text-xs text-gray-300 font-semibold uppercase tracking-wide">No Sponsorship</p>
                                  <p className="text-sm font-bold text-gray-100">Not Sponsored</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Title */}
                          <a
                            href={`https://youtube.com/watch?v=${video.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group-hover:text-blue-400 transition-colors"
                          >
                            <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-300">
                              {video.title}
                            </h4>
                          </a>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                              <p className="text-xs text-gray-400 mb-1">Views</p>
                              <p className="text-sm font-bold text-cyan-400">{formatCount(video.view_count)}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                              <p className="text-xs text-gray-400 mb-1">Likes</p>
                              <p className="text-sm font-bold text-red-400">{formatCount(video.like_count)}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                              <p className="text-xs text-gray-400 mb-1">Comments</p>
                              <p className="text-sm font-bold text-yellow-400">{formatCount(video.comment_count)}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                              <p className="text-xs text-gray-400 mb-1">Engagement</p>
                              <p className="text-sm font-bold text-green-400">{engagement}%</p>
                            </div>
                          </div>

                          {/* Watch Button */}
                          <a
                            href={`https://youtube.com/watch?v=${video.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-semibold transition-all duration-200 text-center group-hover:shadow-lg group-hover:shadow-blue-500/30 block"
                          >
                            Watch Video
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !channel && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 text-center py-8"
            >
              Enter a YouTube channel ID and specify the number of videos to analyze
            </motion.p>
          )}
        </div>
      </motion.section>

      <Footer />
    </>
  );
};

export default BulkAnalysis;