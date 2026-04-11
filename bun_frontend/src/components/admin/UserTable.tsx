/**
 * User Table Component
 * Sortable, paginated table for user management
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, MoreVertical, Shield, User, Briefcase } from 'lucide-react';
import type { AdminUser } from '../../types/admin';

interface UserTableProps {
    users: AdminUser[];
    loading?: boolean;
    onEdit?: (user: AdminUser) => void;
    onDelete?: (userId: string) => void;
}

const roleIcons = {
    admin: Shield,
    sponsor: Briefcase,
    influencer: User,
};

const roleColors = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/30',
    sponsor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    influencer: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const UserTable = ({ users, loading, onEdit, onDelete }: UserTableProps) => {
    const [sortField, setSortField] = useState<keyof AdminUser>('date_registered');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const sortedUsers = [...users].sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
    });

    const handleSort = (field: keyof AdminUser) => {
        if (field === sortField) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl bg-white/5 border border-white/10">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('username')}
                            >
                                User {sortField === 'username' && (sortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('user_type')}
                            >
                                Role {sortField === 'user_type' && (sortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                onClick={() => handleSort('date_registered')}
                            >
                                Joined {sortField === 'date_registered' && (sortDir === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedUsers.map((user, index) => {
                            const RoleIcon = roleIcons[user.user_type] || User;
                            return (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                {user.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.full_name || user.username}</p>
                                                <p className="text-gray-400 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${roleColors[user.user_type]
                                                }`}
                                        >
                                            <RoleIcon className="w-3 h-3" />
                                            {user.user_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.is_active
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-gray-500/20 text-gray-400'
                                                }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-gray-400'
                                                    }`}
                                            />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(user.date_registered).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(user)}
                                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(user.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {users.length === 0 && (
                <div className="py-12 text-center text-gray-400">No users found</div>
            )}
        </div>
    );
};

export default UserTable;
