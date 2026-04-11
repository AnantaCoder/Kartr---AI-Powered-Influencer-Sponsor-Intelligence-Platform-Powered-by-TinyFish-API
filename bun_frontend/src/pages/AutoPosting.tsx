import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Loader, Lock } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import { selectIsAuthenticated, selectAuthInitialized } from "../store/slices/authSlice";

const API_BASE_URL = "http://localhost:8000";

const AutoPosting: React.FC = () => {
  const navigate = useNavigate();

  // Auth check
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  const [caption, setCaption] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [useAIImage, setUseAIImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [useSavedCreds, setUseSavedCreds] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login', { state: { from: '/auto-posting' } });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setUseAIImage(false);
      setMessage(null);
    }
  };

  const handleUseAIImage = () => {
    setSelectedImage(null);
    setUseAIImage(true);
    // TODO: Integrate with virtual AI page to fetch image
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      if (!caption.trim()) {
        setMessage({ type: "error", text: "Please write a caption" });
        setIsLoading(false);
        return;
      }

      if (!useSavedCreds && (!username.trim() || !password.trim())) {
        setMessage({ type: "error", text: "Please enter Bluesky credentials or use saved ones" });
        setIsLoading(false);
        return;
      }

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login', { state: { from: '/auto-posting' } });
        return;
      }

      // Step 1: Connect Bluesky account (verify credentials and save to profile)
      if (!useSavedCreds) {
        const connectRes = await fetch(`${API_BASE_URL}/api/bluesky/connect`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            identifier: username,
            password: password,
          }),
        });

        if (!connectRes.ok) {
          const error = await connectRes.json();
          throw new Error(error.detail || "Failed to verify Bluesky credentials");
        }
      }

      // Step 2: Post to Bluesky (using saved credentials from profile)
      const postFormData = new FormData();
      postFormData.append("text", caption);
      postFormData.append("image_path", ""); // Empty string means no saved image path
      postFormData.append("alt_text", caption);

      if (selectedImage) {
        postFormData.append("image_file", selectedImage);
      }

      const postRes = await fetch(`${API_BASE_URL}/api/bluesky/post`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type - browser will set it with boundary
        },
        body: postFormData,
      });

      if (!postRes.ok) {
        const error = await postRes.json();
        throw new Error(error.detail || "Failed to post to Bluesky");
      }

      const postData = await postRes.json();
      setMessage({
        type: "success",
        text: `✅ Posted successfully! `,
      });

      // Reset form
      setCaption("");
      setUsername("");
      setPassword("");
      setSelectedImage(null);
      setUseAIImage(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
        <div className="pt-32 pb-20 px-6 relative overflow-hidden flex flex-col items-center">
          {/* BACKGROUND GLOW */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="w-full max-w-2xl p-10 rounded-[32px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10">
            <h2 className="text-4xl font-black text-center mb-10 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              Social Content Sync
            </h2>
            <form onSubmit={handlePost} className="space-y-8">
              <div className="flex gap-4 justify-center mb-4">
                <label className="flex flex-col items-center cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  <span className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-2xl shadow-xl group-hover:bg-white/10 group-hover:scale-105 transition-all duration-300 text-xs font-black uppercase tracking-widest">
                    Upload Images / Videos 
                  </span>
                </label>
                {/* <button
                  type="button"
                  onClick={handleUseAIImage}
                  className="px-6 py-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-2xl shadow-xl hover:bg-purple-600/30 hover:scale-105 transition-all duration-300 text-xs font-black uppercase tracking-widest"
                >
                  Fetch AI Asset
                </button> */}
              </div>

              <div className="mb-4 min-h-[28px] text-center">
                {selectedImage && <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest animate-fade-in shadow-lg">Asset: {selectedImage.name}</span>}
                {useAIImage && <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest animate-fade-in shadow-lg">Using Virtual AI Engine Asset</span>}
              </div>

              {/* <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="useSavedCreds"
                  checked={useSavedCreds}
                  onChange={(e) => setUseSavedCreds(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                />
               <label htmlFor="useSavedCreds" className="text-sm font-medium cursor-pointer flex flex-col">
                  <span>Use Saved Credentials</span>
                  <span className="text-[10px] text-gray-400">Skip login if you've already connected your account</span>
                </label> 
                */}
              

              <div className="relative group">
                <label className="block mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Caption Content</label>
                <input
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Write a viral caption..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-white placeholder:text-gray-600 font-medium"
                  required
                />
              </div>

              {!useSavedCreds && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="block mb-3 text-xs font-black uppercase tracking-widest text-gray-500">Bluesky Handle</label>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="user.bsky.social"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-white placeholder:text-gray-600 font-medium"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <label className="block mb-3 text-xs font-black uppercase tracking-widest text-gray-500">App Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-white placeholder:text-gray-600 font-medium"
                      required
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full py-5 mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl hover:scale-[1.02] hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    "Launch Post"
                  )}
                </div>
              </button>

              {message && (
                <div
                  className={`p-5 rounded-2xl text-center text-xs font-black uppercase tracking-widest shadow-xl border animate-fade-in ${message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5"
                    : "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5"
                    }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.5s both; }
      `}</style>
    </>
  );
};

export default AutoPosting;