import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Gallery from "../components/gallery/Gallery";
import Header from "@/components/layout/Header";
import { useAppSelector } from "../store/hooks";
import { selectIsAuthenticated, selectAuthInitialized } from "../store/slices/authSlice";
import VideoStudio from "../components/virtual-ai/VideoStudio";
import VirtualStudio from "../components/virtual-ai/VirtualStudio";
import AgenticChat from "../components/virtual-ai/AgenticChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, Wand2, Video, MessageSquare } from "lucide-react";


export default function VirtualAi() {
  const navigate = useNavigate();

  // Auth check
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isInitialized = useAppSelector(selectAuthInitialized);

  // Initialize tab from local storage or default
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("virtual_ai_tab_state") || "studio";
  });

  // Save tab state when it changes
  useEffect(() => {
    localStorage.setItem("virtual_ai_tab_state", activeTab);
  }, [activeTab]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login', { state: { from: '/VirtualAi' } });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  // Show loading while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Redirect happening, show nothing
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />

      <div className="pt-20 px-4">
        <Tabs defaultValue="studio" className="w-full max-w-6xl mx-auto" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="bg-white/10 border border-white/10 p-1 rounded-full">
              <TabsTrigger
                value="studio"
                className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 transition-all flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                AI Studio
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 transition-all flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                AI Video
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 transition-all flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Gallery
              </TabsTrigger>

              <TabsTrigger
                value="chat"
                className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Agent Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="studio" className="mt-0">
            <VirtualStudio />
          </TabsContent>

          <TabsContent value="video" className="mt-0">
            <VideoStudio />
          </TabsContent>

          <TabsContent value="gallery" className="mt-0">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">AI Showcase</h1>
              <p className="text-gray-400">Explore what's possible with Kartr's generative AI</p>
            </div>
            <Gallery />
          </TabsContent>



          <TabsContent value="chat" className="mt-0">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Agentic Intelligence</h1>
                <p className="text-gray-400">Interact directly with Kartr's strategic operator</p>
              </div>
              <AgenticChat />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
