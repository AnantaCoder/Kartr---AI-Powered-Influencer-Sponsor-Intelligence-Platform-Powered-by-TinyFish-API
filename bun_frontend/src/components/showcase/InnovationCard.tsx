import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface InnovationCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    children?: React.ReactNode;
}

export const InnovationCard: React.FC<InnovationCardProps> = ({
    title,
    description,
    icon: Icon,
    color,
    children
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden"
        >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

            <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-purple-500/20`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-3 text-white">
                    {title}
                </h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {description}
                </p>

                <div className="mt-auto">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};
