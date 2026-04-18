import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const JoinInvite: React.FC = () => {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const bskyHandle = searchParams.get('bsky');
  const navigate = useNavigate();

  const saveToSession = () => {
    if (campaignId) {
      sessionStorage.setItem('pendingCampaignInvite', campaignId);
    }
    if (bskyHandle) {
      sessionStorage.setItem('pendingBlueskyHandle', bskyHandle);
    }
  };

  const handleLoginExisting = () => {
    saveToSession();
    navigate('/login');
  };

  const handleSignupNew = () => {
    saveToSession();
    navigate('/signup-influencer');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] px-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-pink-600/20 blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      <motion.div
        className="relative z-10 max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] text-center shadow-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10 shadow-lg shadow-purple-500/10">
            <Sparkles className="text-purple-400 w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">You're Invited!</h1>
        <p className="text-gray-400 text-sm mb-2 leading-relaxed">
          A sponsor hand-picked you as a perfect fit for their upcoming campaign.
        </p>
        {bskyHandle && (
          <p className="text-xs text-purple-400/70 mb-6 font-mono">
            Invite sent to: @{bskyHandle.replace(/^@/, '')}
          </p>
        )}
        {!bskyHandle && <div className="mb-6" />}

        <p className="text-gray-500 text-xs mb-5 uppercase tracking-widest font-medium">
          How would you like to continue?
        </p>

        <div className="space-y-3">
          <Button
            onClick={handleLoginExisting}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 border-0 transition-all text-base flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            I Already Have an Account
          </Button>
          <Button
            onClick={handleSignupNew}
            variant="outline"
            className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition-all text-base flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            I'm New — Join Kartr Free
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-gray-600 text-[11px] mt-6">
          After signing in, your campaign invite will appear in your Invitations dashboard automatically.
        </p>
      </motion.div>
    </div>
  );
};

export default JoinInvite;
