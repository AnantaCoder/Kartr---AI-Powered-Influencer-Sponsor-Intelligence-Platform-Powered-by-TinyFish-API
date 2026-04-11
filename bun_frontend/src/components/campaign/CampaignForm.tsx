/**
 * Campaign Form Component
 * Form for creating and editing campaigns
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
import type { Campaign, CampaignCreateRequest, CampaignUpdateRequest } from '../../types/campaign';

interface CampaignFormProps {
    campaign?: Campaign | null;
    onSubmit: (data: CampaignCreateRequest | CampaignUpdateRequest) => void;
    onCancel: () => void;
    loading?: boolean;
}

const CampaignForm = ({ campaign, onSubmit, onCancel, loading }: CampaignFormProps) => {
    const [formData, setFormData] = useState<CampaignCreateRequest>({
        name: '',
        description: '',
        niche: '',
        target_audience: '',
        budget_min: undefined,
        budget_max: undefined,
        keywords: [],
        requirements: '',
    });
    const [keywordInput, setKeywordInput] = useState('');

    useEffect(() => {
        if (campaign) {
            setFormData({
                name: campaign.name,
                description: campaign.description,
                niche: campaign.niche,
                target_audience: campaign.target_audience || '',
                budget_min: campaign.budget_min,
                budget_max: campaign.budget_max,
                keywords: campaign.keywords || [],
                requirements: campaign.requirements || '',
            });
        }
    }, [campaign]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
        }));
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                keywords: [...(prev.keywords || []), keywordInput.trim()],
            }));
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword: string) => {
        setFormData((prev) => ({
            ...prev,
            keywords: prev.keywords?.filter((k) => k !== keyword) || [],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-white/10 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">
                        {campaign ? 'Edit Campaign' : 'Create Campaign'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Campaign Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Summer Fashion Promotion"
                        />
                    </div>

                    {/* Niche */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Niche *</label>
                        <input
                            type="text"
                            name="niche"
                            value={formData.niche}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Fashion, Tech, Home Appliances"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Describe your campaign goals, target audience, and what you're looking for..."
                        />
                    </div>

                    {/* Keywords */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Keywords (for AI matching)
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a keyword..."
                            />
                            <button
                                type="button"
                                onClick={addKeyword}
                                className="px-4 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.keywords?.map((keyword) => (
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm"
                                >
                                    <Tag className="w-3 h-3" />
                                    {keyword}
                                    <button
                                        type="button"
                                        onClick={() => removeKeyword(keyword)}
                                        className="ml-1 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Min Budget ($)
                            </label>
                            <input
                                type="number"
                                name="budget_min"
                                value={formData.budget_min || ''}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Budget ($)
                            </label>
                            <input
                                type="number"
                                name="budget_max"
                                value={formData.budget_max || ''}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="2000"
                            />
                        </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Target Audience
                        </label>
                        <input
                            type="text"
                            name="target_audience"
                            value={formData.target_audience || ''}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Women aged 25-40 interested in home decor"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default CampaignForm;
