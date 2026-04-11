/**
 * Search Filters Component
 * Niche, keyword, and name search inputs for discovery
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Tag, User } from 'lucide-react';

interface SearchFiltersProps {
    onSearch: (niche: string, keywords: string, name: string) => void;
    loading?: boolean;
}

const POPULAR_NICHES = [
    'Fashion',
    'Tech',
    'Gaming',
    'Beauty',
    'Fitness',
    'Food',
    'Travel',
    'Lifestyle',
    'Home Appliances',
    'Finance',
];

const SearchFilters = ({ onSearch, loading }: SearchFiltersProps) => {
    const [niche, setNiche] = useState('');
    const [keywords, setKeywords] = useState('');
    const [name, setName] = useState('');

    const handleSearch = () => {
        // Allow search if at least one field is filled
        if (niche.trim() || keywords.trim() || name.trim()) {
            onSearch(niche.trim(), keywords.trim(), name.trim());
        }
    };

    const handleNicheClick = (selectedNiche: string) => {
        setNiche(selectedNiche);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 p-6"
        >
            {/* Primary Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {/* Niche Input */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Niche / Category
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., Tech"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* Keywords Input */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Keywords
                    </label>
                    <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., review, unboxing"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Name Input (New) */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Influencer Name
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., MKBHD"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleSearch}
                        disabled={loading || (!niche && !keywords && !name)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Find
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Popular Niches */}
            <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Popular Niches</p>
                <div className="flex flex-wrap gap-2">
                    {POPULAR_NICHES.map((n) => (
                        <button
                            key={n}
                            onClick={() => handleNicheClick(n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${niche === n
                                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default SearchFilters;
