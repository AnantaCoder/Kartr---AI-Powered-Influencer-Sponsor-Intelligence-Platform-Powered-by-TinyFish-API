/**
 * Analytics Card Component
 * Displays a single metric with icon and trend
 */
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
};

const AnalyticsCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
}: AnalyticsCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 shadow-xl"
        >
            {/* Background gradient */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-10`}
            />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-white">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && trendValue && (
                        <div className="flex items-center mt-2 gap-1">
                            <span
                                className={`text-sm font-medium ${trend === 'up'
                                        ? 'text-emerald-400'
                                        : trend === 'down'
                                            ? 'text-red-400'
                                            : 'text-gray-400'
                                    }`}
                            >
                                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}
                >
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
};

export default AnalyticsCard;
