/**
 * Admin Dashboard Page
 * Container component for admin analytics and user management
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, User, Shield, TrendingUp, UserPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    fetchUsers,
    fetchAnalytics,
    deleteUser,
    selectUsers,
    selectAnalytics,
    selectAdminLoading,
    selectAdminError,
} from '../../store/slices/adminSlice';
import { useAdminGuard } from '../../hooks/useRoleGuard';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import UserTable from '../../components/admin/UserTable';
import type { AdminUser, UserFilterParams } from '../../types/admin';

const AdminDashboard = () => {
    const { isLoading: authLoading, isAuthorized } = useAdminGuard();
    const dispatch = useAppDispatch();
    const users = useAppSelector(selectUsers);
    const analytics = useAppSelector(selectAnalytics);
    const loading = useAppSelector(selectAdminLoading);
    const error = useAppSelector(selectAdminError);

    const [filter, setFilter] = useState<UserFilterParams>({
        page: 1,
        page_size: 20,
    });

    useEffect(() => {
        if (isAuthorized) {
            dispatch(fetchAnalytics());
            dispatch(fetchUsers(filter));
        }
    }, [dispatch, isAuthorized, filter]);

    const handleFilterChange = (newFilter: Partial<UserFilterParams>) => {
        setFilter((prev) => ({ ...prev, ...newFilter }));
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            dispatch(deleteUser({ userId }));
        }
    };

    const handleEditUser = (user: AdminUser) => {
        // TODO: Open edit modal
        console.log('Edit user:', user);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-400">Manage users and monitor platform analytics</p>
                </motion.div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <AnalyticsCard
                        title="Total Users"
                        value={analytics?.total_users || 0}
                        icon={Users}
                        color="blue"
                        trend="up"
                        trendValue="+12% this week"
                    />
                    <AnalyticsCard
                        title="Sponsors"
                        value={analytics?.total_sponsors || 0}
                        icon={Briefcase}
                        color="green"
                    />
                    <AnalyticsCard
                        title="Influencers"
                        value={analytics?.total_influencers || 0}
                        icon={User}
                        color="purple"
                    />
                    <AnalyticsCard
                        title="New This Week"
                        value={analytics?.new_users_this_week || 0}
                        icon={UserPlus}
                        color="orange"
                        trend="up"
                        trendValue="Active"
                    />
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-wrap gap-4 mb-6"
                >
                    <select
                        value={filter.user_type || ''}
                        onChange={(e) =>
                            handleFilterChange({
                                user_type: (e.target.value as 'admin' | 'sponsor' | 'influencer') || undefined,
                            })
                        }
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="sponsor">Sponsor</option>
                        <option value="influencer">Influencer</option>
                    </select>

                    <select
                        value={filter.is_active === undefined ? '' : filter.is_active.toString()}
                        onChange={(e) =>
                            handleFilterChange({
                                is_active: e.target.value === '' ? undefined : e.target.value === 'true',
                            })
                        }
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filter.search || ''}
                        onChange={(e) => handleFilterChange({ search: e.target.value })}
                        className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </motion.div>

                {/* User Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <UserTable
                        users={users}
                        loading={loading}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
