import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Public pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import SignupInfluencer from '../pages/SignupInfluencer';
import SignupSponsor from '../pages/SignupSponsor';
import YoutubeAnalysis from '../pages/YoutubeAnalysis';
import ForgotPassword from '../pages/ForgotPassword';
import AutoPosting from '../pages/AutoPosting';
import VirtualAi from '../pages/VirtualAi';
import MvpShowcase from '../pages/MvpShowcase';
import AdStudio from '../pages/AdStudio';
import SponsorCampaign from '../pages/SponsorCampaign';
import BulkAnalysis from '../pages/BulkAnalysis';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';

// Sponsor pages
import SponsorDashboard from '../pages/sponsor/SponsorDashboard';
import SponsorProfile from '../pages/sponsor/SponsorProfile';
import InfluencerDiscovery from '../pages/sponsor/InfluencerDiscovery';
import CampaignDetail from '../pages/sponsor/CampaignDetail';

// Influencer pages
import InfluencerDashboard from '../pages/influencer/InfluencerDashboard';
import InfluencerProfile from '../pages/influencer/InfluencerProfile';
import CampaignInvites from '../pages/influencer/CampaignInvites';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup-influencer" element={<SignupInfluencer />} />
            <Route path="/signup-sponsor" element={<SignupSponsor />} />
            <Route path="/YoutubeAnalysis" element={<YoutubeAnalysis />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auto-posting" element={<AutoPosting />} />
            <Route path="/VirtualAi" element={<VirtualAi />} />
            <Route path="/BulkAnalysis" element={<BulkAnalysis />} />
            {/* <Route path="/innovation-lab" element={<MvpShowcase />} /> */}
            <Route path="/ad-studio" element={<AdStudio />} />
            <Route path="/sponsor/campaigns/:campaignId" element={<CampaignDetail />} />

            {/* Admin Routes (protected by useAdminGuard in component) */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Sponsor Routes (protected by useSponsorGuard in component) */}
            <Route path="/sponsor" element={<SponsorDashboard />} />
            <Route path="/sponsor/dashboard" element={<SponsorDashboard />} />
            <Route path="/sponsor/profile" element={<SponsorProfile />} />
            <Route path="/sponsor/campaigns" element={<SponsorDashboard />} />
            <Route path="/sponsor/manage-campaign/:campaignId" element={<CampaignDetail />} />
            <Route path="/sponsor/discovery" element={<InfluencerDiscovery />} />

            {/* Influencer Routes (protected by useInfluencerGuard in component) */}
            <Route path="/influencer" element={<InfluencerDashboard />} />
            <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
            <Route path="/influencer/profile" element={<InfluencerProfile />} />
            <Route path="/influencer/invites" element={<CampaignInvites />} />
        </Routes>
    );
};

export default AppRoutes;
