/**
 * Sponsor Profile Page
 * Displays sponsor's personal information and organization details
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building2, Calendar, Shield, Edit2, Save, X } from 'lucide-react';
import { useSponsorGuard } from '../../hooks/useRoleGuard';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';

const SponsorProfile = () => {
    const { isLoading: authLoading } = useSponsorGuard();
    const user = useAppSelector(selectUser);
    const [isEditing, setIsEditing] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
    });

    const handleSave = async () => {
        // TODO: Implement profile update API call
        setIsEditing(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 lg:p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header with Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">My Profile</h1>
                        <p className="text-zinc-400">View and manage your account details.</p>
                    </div>
                    <div>
                        <a
                            href="/sponsor"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition-all text-sm font-medium"
                        >
                            <Building2 className="w-4 h-4" />
                            Return to Dashboard
                        </a>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 shadow-2xl">
                            {/* Decorative Background */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-50" />

                            <div className="relative p-8 flex flex-col items-center text-center">
                                <div className="mb-6 relative group">
                                    <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-950 flex items-center justify-center text-4xl font-bold text-white shadow-xl bg-gradient-to-br from-zinc-800 to-zinc-900">
                                        {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'S'}
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-2 rounded-full bg-green-500 border-4 border-zinc-950" title="Active" />
                                </div>

                                <h2 className="text-xl font-bold text-white mb-1">{user?.full_name || user?.username}</h2>
                                <p className="text-zinc-500 text-sm mb-4">@{user?.username}</p>

                                <div className="flex items-center gap-2 mb-6">
                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                                        Sponsor Account
                                    </span>
                                </div>

                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-medium text-sm ${isEditing
                                            ? 'bg-white text-black hover:bg-zinc-200'
                                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5'
                                        }`}
                                >
                                    {isEditing ? (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    ) : (
                                        <>
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </>
                                    )}
                                </button>

                                {isEditing && (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="mt-3 w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-6 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Member Since</span>
                                <span className="text-zinc-300 font-medium">
                                    {user?.date_registered
                                        ? new Date(user.date_registered).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                        })
                                        : 'Unknown'}
                                </span>
                            </div>
                            <div className="w-full h-px bg-white/5" />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">Status</span>
                                <span className="flex items-center gap-1.5 text-green-400 font-medium">
                                    <Shield className="w-3 h-3" />
                                    Verified
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details Form */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 md:p-8">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-400" />
                                Account Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Username</label>
                                    <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-300 text-sm font-medium flex items-center gap-2">
                                        <span className="text-zinc-600">@</span>
                                        {user?.username}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-700"
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-300 text-sm font-medium">
                                            {user?.full_name || 'Not set'}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full p-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-zinc-700"
                                            placeholder="name@example.com"
                                        />
                                    ) : (
                                        <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-300 text-sm font-medium flex items-center justify-between group">
                                            <span>{user?.email}</span>
                                            <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">Private</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isEditing && (
                                <div className="mt-8 pt-6 border-t border-white/5">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                        <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-white mb-1">Secure Account</h4>
                                            <p className="text-xs text-zinc-500 leading-relaxed">
                                                Your data is protected. Use the edit button to update your personal information.
                                                For security reasons, sensitive details like your password must be changed via the security settings page.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SponsorProfile;
